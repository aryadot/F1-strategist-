import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, real, jsonb, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Document types for F1 content
export const documentTypes = ["article", "analysis", "rules", "performance", "news"] as const;
export type DocumentType = typeof documentTypes[number];

// Documents table for ingested F1 content
export const documents = pgTable("documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  content: text("content").notNull(),
  type: text("type").notNull().$type<DocumentType>(),
  source: text("source"),
  url: text("url"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Document chunks for RAG retrieval
export const chunks = pgTable("chunks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  documentId: varchar("document_id").notNull(),
  content: text("content").notNull(),
  chunkIndex: integer("chunk_index").notNull(),
  embedding: jsonb("embedding").$type<number[]>(),
  metadata: jsonb("metadata").$type<ChunkMetadata>(),
});

// Chat conversations
export const conversations = pgTable("conversations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Chat messages
export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  conversationId: varchar("conversation_id").notNull(),
  role: text("role").notNull().$type<"user" | "assistant">(),
  content: text("content").notNull(),
  sources: jsonb("sources").$type<SourceCitation[]>(),
  createdAt: timestamp("created_at").defaultNow(),
});

// User table (keep existing)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

// Types for metadata and citations
export interface ChunkMetadata {
  documentTitle: string;
  documentType: DocumentType;
  source?: string;
  startPosition: number;
  endPosition: number;
  keywords: string[];
}

export interface SourceCitation {
  documentId: string;
  chunkId: string;
  title: string;
  excerpt: string;
  relevanceScore: number;
  type: DocumentType;
}

export interface RetrievedChunk {
  id: string;
  content: string;
  documentId: string;
  metadata: ChunkMetadata;
  vectorScore: number;
  bm25Score: number;
  combinedScore: number;
}

// Insert schemas
export const insertDocumentSchema = createInsertSchema(documents).omit({ id: true, createdAt: true });
export const insertChunkSchema = createInsertSchema(chunks).omit({ id: true });
export const insertConversationSchema = createInsertSchema(conversations).omit({ id: true, createdAt: true });
export const insertMessageSchema = createInsertSchema(messages).omit({ id: true, createdAt: true });
export const insertUserSchema = createInsertSchema(users).pick({ username: true, password: true });

// Zod schemas for API validation
export const chatRequestSchema = z.object({
  message: z.string().min(1),
  conversationId: z.string().optional(),
});

export const documentUploadSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  type: z.enum(documentTypes),
  source: z.string().optional(),
  url: z.string().url().optional(),
});

export const searchQuerySchema = z.object({
  query: z.string().min(1),
  topK: z.number().int().positive().default(5),
  documentTypes: z.array(z.enum(documentTypes)).optional(),
});

// Types
export type Document = typeof documents.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type Chunk = typeof chunks.$inferSelect;
export type InsertChunk = z.infer<typeof insertChunkSchema>;
export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type ChatRequest = z.infer<typeof chatRequestSchema>;
export type DocumentUpload = z.infer<typeof documentUploadSchema>;
export type SearchQuery = z.infer<typeof searchQuerySchema>;
