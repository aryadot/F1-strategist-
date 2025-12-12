import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  chatRequestSchema,
  documentUploadSchema,
  insertConversationSchema,
} from "@shared/schema";
import {
  hybridRetrieval,
  generateResponse,
  ingestDocument,
  processExistingDocument,
  initializeEmbeddings,
} from "./rag";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Initialize sample documents and embeddings on startup
  setTimeout(async () => {
    try {
      console.log("Seeding sample F1 documents...");
      const sampleDocs = await storage.seedSampleData();
      
      if (sampleDocs.length > 0) {
        // Process each seeded document through the RAG pipeline to create chunks
        for (const doc of sampleDocs) {
          console.log(`Creating chunks for: ${doc.title}`);
          await processExistingDocument(doc);
        }
      }
      
      // Now generate embeddings for all chunks
      await initializeEmbeddings();
      console.log("Sample data initialization complete!");
    } catch (error) {
      console.error("Failed to initialize sample data:", error);
    }
  }, 1000);

  // ============ Documents API ============

  // Get all documents
  app.get("/api/documents", async (req, res) => {
    try {
      const documents = await storage.getDocuments();
      res.json(documents);
    } catch (error) {
      console.error("Error fetching documents:", error);
      res.status(500).json({ error: "Failed to fetch documents" });
    }
  });

  // Upload new document
  app.post("/api/documents", async (req, res) => {
    try {
      const data = documentUploadSchema.parse(req.body);
      const document = await ingestDocument(
        data.title,
        data.content,
        data.type,
        data.source,
        data.url
      );
      res.json(document);
    } catch (error) {
      console.error("Error uploading document:", error);
      res.status(400).json({ error: "Failed to upload document" });
    }
  });

  // Delete document
  app.delete("/api/documents/:id", async (req, res) => {
    try {
      await storage.deleteDocument(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting document:", error);
      res.status(500).json({ error: "Failed to delete document" });
    }
  });

  // ============ Conversations API ============

  // Get all conversations
  app.get("/api/conversations", async (req, res) => {
    try {
      const conversations = await storage.getConversations();
      res.json(conversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ error: "Failed to fetch conversations" });
    }
  });

  // Create new conversation
  app.post("/api/conversations", async (req, res) => {
    try {
      const data = insertConversationSchema.parse(req.body);
      const conversation = await storage.createConversation(data);
      res.json(conversation);
    } catch (error) {
      console.error("Error creating conversation:", error);
      res.status(400).json({ error: "Failed to create conversation" });
    }
  });

  // Delete conversation
  app.delete("/api/conversations/:id", async (req, res) => {
    try {
      await storage.deleteConversation(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting conversation:", error);
      res.status(500).json({ error: "Failed to delete conversation" });
    }
  });

  // ============ Messages API ============

  // Get messages for a conversation
  app.get("/api/conversations/:conversationId/messages", async (req, res) => {
    try {
      const messages = await storage.getMessages(req.params.conversationId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

  // ============ Chat API (RAG) ============

  app.post("/api/chat", async (req, res) => {
    try {
      const data = chatRequestSchema.parse(req.body);
      const { message, conversationId } = data;

      if (!conversationId) {
        return res.status(400).json({ error: "Conversation ID required" });
      }

      // Save user message
      await storage.createMessage({
        conversationId,
        role: "user",
        content: message,
        sources: null,
      });

      // Get conversation history
      const allMessages = await storage.getMessages(conversationId);
      const history = allMessages.slice(-10).map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));

      // RAG 2.0: Hybrid retrieval with query enhancement and reranking
      const retrievedChunks = await hybridRetrieval(message, 5);

      // Generate response with context
      const { response, sources } = await generateResponse(
        message,
        history.slice(0, -1), // Exclude the message we just added
        retrievedChunks
      );

      // Save assistant message with sources
      const assistantMessage = await storage.createMessage({
        conversationId,
        role: "assistant",
        content: response,
        sources,
      });

      res.json({
        message: assistantMessage,
        sources,
      });
    } catch (error) {
      console.error("Error in chat:", error);
      res.status(500).json({ error: "Failed to process chat message" });
    }
  });

  // ============ Search API ============

  app.post("/api/search", async (req, res) => {
    try {
      const { query, topK = 5 } = req.body;

      if (!query) {
        return res.status(400).json({ error: "Query required" });
      }

      const results = await hybridRetrieval(query, topK);
      res.json(results);
    } catch (error) {
      console.error("Error in search:", error);
      res.status(500).json({ error: "Failed to search documents" });
    }
  });

  return httpServer;
}
