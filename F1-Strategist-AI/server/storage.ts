import {
  type User,
  type InsertUser,
  type Document,
  type InsertDocument,
  type Chunk,
  type InsertChunk,
  type Conversation,
  type InsertConversation,
  type Message,
  type InsertMessage,
  type ChunkMetadata,
  type RetrievedChunk,
  type DocumentType,
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Documents
  getDocuments(): Promise<Document[]>;
  getDocument(id: string): Promise<Document | undefined>;
  createDocument(doc: InsertDocument): Promise<Document>;
  deleteDocument(id: string): Promise<void>;

  // Chunks
  getChunks(): Promise<Chunk[]>;
  getChunksByDocumentId(documentId: string): Promise<Chunk[]>;
  createChunk(chunk: InsertChunk): Promise<Chunk>;
  updateChunkEmbedding(id: string, embedding: number[]): Promise<void>;
  searchChunksByEmbedding(embedding: number[], topK: number): Promise<RetrievedChunk[]>;

  // Conversations
  getConversations(): Promise<Conversation[]>;
  getConversation(id: string): Promise<Conversation | undefined>;
  createConversation(conv: InsertConversation): Promise<Conversation>;
  updateConversationTitle(id: string, title: string): Promise<void>;
  deleteConversation(id: string): Promise<void>;

  // Messages
  getMessages(conversationId: string): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private documents: Map<string, Document>;
  private chunks: Map<string, Chunk>;
  private conversations: Map<string, Conversation>;
  private messages: Map<string, Message>;

  constructor() {
    this.users = new Map();
    this.documents = new Map();
    this.chunks = new Map();
    this.conversations = new Map();
    this.messages = new Map();
  }

  // Seed sample F1 documents - called from routes.ts after RAG module is available
  async seedSampleData(): Promise<Document[]> {
    // Check if we already have documents (avoid re-seeding)
    if (this.documents.size > 0) {
      return Array.from(this.documents.values());
    }

    const sampleDocs = [
      {
        title: "2024 Monaco Grand Prix Strategy Analysis",
        content: `The Monaco Grand Prix remains one of the most challenging races for tire strategy. The narrow streets and limited overtaking opportunities make track position paramount. Most teams opt for a one-stop strategy, typically starting on medium tires and switching to hards around lap 30-35. The pit window is critical as track position is nearly impossible to recover. In 2024, the soft compound degraded rapidly in sector 3 due to high temperatures. Teams that preserved their tires through the tunnel section gained significant advantages. The undercut at Monaco is less effective than at other circuits due to the tight pit lane and slow entry/exit speeds. Overcut strategies can work better here if the driver can manage tire temperatures.`,
        type: "analysis" as DocumentType,
        source: "F1 Strategy Analysis",
      },
      {
        title: "FIA 2024 Technical Regulations - DRS Zones",
        content: `Article 3.10.10 of the FIA Technical Regulations specifies DRS (Drag Reduction System) activation zones. The rear wing flap may only open when the car is within 1 second of the car ahead at the DRS detection point. DRS is disabled during the first two laps of a race or restart, and when yellow flags are displayed in the DRS zone. The system must be driver-activated and automatically closes upon brake application. Maximum flap opening is 65mm from the mainplane reference. In wet conditions, Race Control may disable DRS entirely to ensure safety. The 2024 regulations maintain the single-element rear wing requirement with specific dimensional constraints.`,
        type: "rules" as DocumentType,
        source: "FIA Technical Regulations 2024",
      },
      {
        title: "Max Verstappen Performance Analysis 2024",
        content: `Max Verstappen's 2024 season showcases exceptional consistency and race craft. His qualifying pace puts him on pole 65% of the time with an average gap of 0.3s to P2. Race pace analysis shows Verstappen maintains optimal tire temperatures 12% better than the field average. His sector 2 performance at high-speed circuits is particularly dominant, often gaining 0.2s in medium-speed corners. Tire management has improved significantly, with degradation rates 8% lower than 2023. Wet weather performance remains his strongest attribute with podium conversion rate of 95% in changing conditions. Strategic radio communication shows strong understanding of race dynamics and tire windows.`,
        type: "performance" as DocumentType,
        source: "F1 Performance Data",
      },
      {
        title: "Pit Stop Strategy: One-Stop vs Two-Stop",
        content: `The decision between one-stop and two-stop strategies depends on multiple factors: tire degradation rate, fuel load effect, track position value, and weather conditions. One-stop strategies favor tracks where overtaking is difficult and tire degradation is manageable. Two-stop strategies work best at circuits with high degradation, good overtaking opportunities, and when fresh tire pace advantage exceeds time lost in pit. The crossover point typically occurs when the time lost per stop (pit lane delta plus tire change) is less than the accumulated time gained from fresher tires. Modern F1 pit stops average 2.2-2.5 seconds for tire changes alone. Virtual Safety Cars have revolutionized strategy, reducing pit stop time loss by approximately 12 seconds compared to standard racing conditions.`,
        type: "article" as DocumentType,
        source: "F1 Strategy Guide",
      },
      {
        title: "Breaking: 2025 Regulation Changes Announced",
        content: `The FIA has confirmed significant regulation changes for the 2025 season. Active aerodynamics will be expanded, allowing teams more flexibility in front wing adjustments. The minimum weight limit decreases by 10kg to improve racing. Power unit regulations introduce a 50/50 split between internal combustion engine and electric power. Sprint race format expands to eight events with revised points allocation. Budget cap increases 3% to account for inflation while maintaining cost control objectives. Tire blanket temperatures will be further reduced, challenging teams on tire warm-up strategies. These changes aim to enhance competition while maintaining the sustainability initiatives introduced in 2024.`,
        type: "news" as DocumentType,
        source: "FIA Official Press",
      },
    ];

    const createdDocs: Document[] = [];
    for (const doc of sampleDocs) {
      const created = await this.createDocument(doc);
      createdDocs.push(created);
    }
    return createdDocs;
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Document methods
  async getDocuments(): Promise<Document[]> {
    return Array.from(this.documents.values()).sort(
      (a, b) =>
        new Date(b.createdAt || 0).getTime() -
        new Date(a.createdAt || 0).getTime()
    );
  }

  async getDocument(id: string): Promise<Document | undefined> {
    return this.documents.get(id);
  }

  async createDocument(doc: InsertDocument): Promise<Document> {
    const id = randomUUID();
    const document: Document = {
      ...doc,
      id,
      createdAt: new Date(),
    };
    this.documents.set(id, document);
    return document;
  }

  async deleteDocument(id: string): Promise<void> {
    this.documents.delete(id);
    // Also delete associated chunks
    for (const [chunkId, chunk] of this.chunks) {
      if (chunk.documentId === id) {
        this.chunks.delete(chunkId);
      }
    }
  }

  // Chunk methods
  async getChunks(): Promise<Chunk[]> {
    return Array.from(this.chunks.values());
  }

  async getChunksByDocumentId(documentId: string): Promise<Chunk[]> {
    return Array.from(this.chunks.values()).filter(
      (chunk) => chunk.documentId === documentId
    );
  }

  async createChunk(chunk: InsertChunk): Promise<Chunk> {
    const id = randomUUID();
    const newChunk: Chunk = { ...chunk, id };
    this.chunks.set(id, newChunk);
    return newChunk;
  }

  async updateChunkEmbedding(id: string, embedding: number[]): Promise<void> {
    const chunk = this.chunks.get(id);
    if (chunk) {
      chunk.embedding = embedding;
      this.chunks.set(id, chunk);
    }
  }

  async searchChunksByEmbedding(
    queryEmbedding: number[],
    topK: number
  ): Promise<RetrievedChunk[]> {
    const chunks = Array.from(this.chunks.values()).filter(
      (chunk) => chunk.embedding && chunk.embedding.length > 0
    );

    const scoredChunks = chunks.map((chunk) => {
      const vectorScore = this.cosineSimilarity(
        queryEmbedding,
        chunk.embedding || []
      );
      return {
        id: chunk.id,
        content: chunk.content,
        documentId: chunk.documentId,
        metadata: chunk.metadata as ChunkMetadata,
        vectorScore,
        bm25Score: 0,
        combinedScore: vectorScore,
      };
    });

    return scoredChunks
      .sort((a, b) => b.combinedScore - a.combinedScore)
      .slice(0, topK);
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length || a.length === 0) return 0;

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    const denominator = Math.sqrt(normA) * Math.sqrt(normB);
    return denominator === 0 ? 0 : dotProduct / denominator;
  }

  // Conversation methods
  async getConversations(): Promise<Conversation[]> {
    return Array.from(this.conversations.values()).sort(
      (a, b) =>
        new Date(b.createdAt || 0).getTime() -
        new Date(a.createdAt || 0).getTime()
    );
  }

  async getConversation(id: string): Promise<Conversation | undefined> {
    return this.conversations.get(id);
  }

  async createConversation(conv: InsertConversation): Promise<Conversation> {
    const id = randomUUID();
    const conversation: Conversation = {
      ...conv,
      id,
      createdAt: new Date(),
    };
    this.conversations.set(id, conversation);
    return conversation;
  }

  async updateConversationTitle(id: string, title: string): Promise<void> {
    const conv = this.conversations.get(id);
    if (conv) {
      conv.title = title;
      this.conversations.set(id, conv);
    }
  }

  async deleteConversation(id: string): Promise<void> {
    this.conversations.delete(id);
    // Also delete associated messages
    for (const [msgId, msg] of this.messages) {
      if (msg.conversationId === id) {
        this.messages.delete(msgId);
      }
    }
  }

  // Message methods
  async getMessages(conversationId: string): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter((msg) => msg.conversationId === conversationId)
      .sort(
        (a, b) =>
          new Date(a.createdAt || 0).getTime() -
          new Date(b.createdAt || 0).getTime()
      );
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const id = randomUUID();
    const msg: Message = {
      ...message,
      id,
      createdAt: new Date(),
    };
    this.messages.set(id, msg);
    return msg;
  }
}

export const storage = new MemStorage();
