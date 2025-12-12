import OpenAI from "openai";
import { storage } from "./storage";
import type {
  Document,
  Chunk,
  ChunkMetadata,
  RetrievedChunk,
  SourceCitation,
  DocumentType,
} from "@shared/schema";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// RAG 2.0 Configuration
const CHUNK_SIZE = 500; // characters per chunk
const CHUNK_OVERLAP = 100; // overlap between chunks
const TOP_K = 5; // number of chunks to retrieve
const EMBEDDING_MODEL = "text-embedding-3-small";
const CHAT_MODEL = "gpt-5";

/**
 * RAG 2.0 System - F1 Strategist Assistant
 * Features:
 * - Semantic document chunking
 * - Hybrid retrieval (vector + BM25)
 * - Query enhancement with variations
 * - Dynamic reranking
 * - Source attribution
 */

// ============ Document Processing ============

export async function processDocument(document: Document): Promise<void> {
  const chunks = chunkDocument(document);

  for (const chunk of chunks) {
    const createdChunk = await storage.createChunk(chunk);

    // Generate embedding for the chunk
    try {
      const embedding = await generateEmbedding(createdChunk.content);
      await storage.updateChunkEmbedding(createdChunk.id, embedding);
    } catch (error) {
      console.error(`Failed to generate embedding for chunk ${createdChunk.id}:`, error);
    }
  }
}

function chunkDocument(document: Document): Omit<Chunk, "id">[] {
  const content = document.content;
  const chunks: Omit<Chunk, "id">[] = [];

  // Semantic chunking: split by sentences and paragraphs
  const sentences = content.split(/(?<=[.!?])\s+/);
  let currentChunk = "";
  let chunkIndex = 0;
  let startPosition = 0;

  for (const sentence of sentences) {
    if (currentChunk.length + sentence.length > CHUNK_SIZE && currentChunk.length > 0) {
      // Save current chunk
      const metadata: ChunkMetadata = {
        documentTitle: document.title,
        documentType: document.type as DocumentType,
        source: document.source || undefined,
        startPosition,
        endPosition: startPosition + currentChunk.length,
        keywords: extractKeywords(currentChunk),
      };

      chunks.push({
        documentId: document.id,
        content: currentChunk.trim(),
        chunkIndex,
        embedding: null,
        metadata,
      });

      // Start new chunk with overlap
      const overlapStart = Math.max(0, currentChunk.length - CHUNK_OVERLAP);
      currentChunk = currentChunk.slice(overlapStart) + sentence;
      startPosition += overlapStart;
      chunkIndex++;
    } else {
      currentChunk += (currentChunk ? " " : "") + sentence;
    }
  }

  // Don't forget the last chunk
  if (currentChunk.trim()) {
    const metadata: ChunkMetadata = {
      documentTitle: document.title,
      documentType: document.type as DocumentType,
      source: document.source || undefined,
      startPosition,
      endPosition: startPosition + currentChunk.length,
      keywords: extractKeywords(currentChunk),
    };

    chunks.push({
      documentId: document.id,
      content: currentChunk.trim(),
      chunkIndex,
      embedding: null,
      metadata,
    });
  }

  return chunks;
}

function extractKeywords(text: string): string[] {
  // F1-specific keyword extraction
  const f1Terms = [
    "pit stop", "tire", "strategy", "DRS", "overtake", "qualifying",
    "pole position", "fastest lap", "safety car", "VSC", "red flag",
    "undercut", "overcut", "medium", "soft", "hard", "intermediate",
    "wet", "slick", "degradation", "graining", "blistering",
    "downforce", "drag", "aero", "ERS", "battery", "deployment",
    "sector", "lap time", "gap", "delta", "pace", "stint",
  ];

  const words = text.toLowerCase().split(/\s+/);
  const keywords = new Set<string>();

  // Extract F1-specific terms
  for (const term of f1Terms) {
    if (text.toLowerCase().includes(term)) {
      keywords.add(term);
    }
  }

  // Extract driver names and teams (common ones)
  const entities = [
    "verstappen", "hamilton", "leclerc", "norris", "sainz", "russell",
    "perez", "alonso", "stroll", "gasly", "ocon", "tsunoda",
    "red bull", "ferrari", "mercedes", "mclaren", "aston martin",
    "alpine", "williams", "haas", "alfa romeo", "alphatauri",
    "monaco", "silverstone", "monza", "spa", "suzuka", "interlagos",
  ];

  for (const entity of entities) {
    if (text.toLowerCase().includes(entity)) {
      keywords.add(entity);
    }
  }

  return Array.from(keywords).slice(0, 10);
}

// ============ Embedding Generation ============

async function generateEmbedding(text: string): Promise<number[]> {
  // Retry with exponential backoff for rate limits
  const maxRetries = 3;
  let delay = 1000;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await openai.embeddings.create({
        model: EMBEDDING_MODEL,
        input: text,
      });
      return response.data[0].embedding;
    } catch (error: any) {
      if (error?.status === 429 && attempt < maxRetries - 1) {
        console.log(`Rate limited, waiting ${delay}ms before retry...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay *= 2; // Exponential backoff
      } else {
        throw error;
      }
    }
  }

  throw new Error("Failed to generate embedding after retries");
}

// ============ Query Enhancement (RAG 2.0) ============

async function enhanceQuery(query: string): Promise<string[]> {
  // Generate query variations for better retrieval coverage
  const response = await openai.chat.completions.create({
    model: CHAT_MODEL,
    messages: [
      {
        role: "system",
        content: `You are a Formula 1 expert. Generate 3 alternative phrasings of the user's question to improve search coverage. Focus on different F1 terminology and aspects. Return as JSON array of strings.`,
      },
      {
        role: "user",
        content: query,
      },
    ],
    response_format: { type: "json_object" },
    max_completion_tokens: 256,
  });

  try {
    const result = JSON.parse(response.choices[0].message.content || "{}");
    const variations = result.variations || result.queries || [];
    return [query, ...variations.slice(0, 2)];
  } catch {
    return [query];
  }
}

// ============ BM25 Keyword Search ============

function bm25Search(query: string, chunks: Chunk[], topK: number): Map<string, number> {
  const queryTerms = query.toLowerCase().split(/\s+/).filter(t => t.length > 2);
  const scores = new Map<string, number>();

  // BM25 parameters
  const k1 = 1.2;
  const b = 0.75;

  // Calculate average document length
  const avgDL = chunks.reduce((sum, c) => sum + c.content.length, 0) / chunks.length;

  // Calculate IDF for query terms
  const idf = new Map<string, number>();
  for (const term of queryTerms) {
    const df = chunks.filter(c => c.content.toLowerCase().includes(term)).length;
    idf.set(term, Math.log((chunks.length - df + 0.5) / (df + 0.5) + 1));
  }

  // Score each chunk
  for (const chunk of chunks) {
    const content = chunk.content.toLowerCase();
    const dl = content.length;
    let score = 0;

    for (const term of queryTerms) {
      const tf = (content.match(new RegExp(term, "gi")) || []).length;
      const idfValue = idf.get(term) || 0;
      score += idfValue * ((tf * (k1 + 1)) / (tf + k1 * (1 - b + b * (dl / avgDL))));
    }

    if (score > 0) {
      scores.set(chunk.id, score);
    }
  }

  return scores;
}

// ============ Hybrid Retrieval ============

export async function hybridRetrieval(
  query: string,
  topK: number = TOP_K
): Promise<RetrievedChunk[]> {
  // 1. Get all chunks
  const allChunks = await storage.getChunks();
  if (allChunks.length === 0) return [];

  // 2. Try to enhance query with variations (graceful fallback if API fails)
  let queryVariations: string[];
  try {
    queryVariations = await enhanceQuery(query);
  } catch (error) {
    console.log("Query enhancement failed, using original query only");
    queryVariations = [query];
  }

  // 3. Try vector search if embeddings are available
  const vectorScores = new Map<string, number>();
  const hasEmbeddings = allChunks.some((c) => c.embedding && c.embedding.length > 0);

  if (hasEmbeddings) {
    try {
      // Generate embeddings for query variations
      const queryEmbeddings = await Promise.all(
        queryVariations.map((q) => generateEmbedding(q))
      );

      // Vector search for each variation
      for (const embedding of queryEmbeddings) {
        const results = await storage.searchChunksByEmbedding(embedding, topK * 2);
        for (const result of results) {
          const existing = vectorScores.get(result.id) || 0;
          vectorScores.set(result.id, Math.max(existing, result.vectorScore));
        }
      }
    } catch (error) {
      console.log("Vector search failed, falling back to BM25 only:", error);
    }
  }

  // 4. BM25 keyword search (always works)
  const bm25Scores = bm25Search(query, allChunks, topK * 2);

  // 5. Normalize and combine scores (hybrid fusion or BM25-only)
  const maxVectorScore = Math.max(...vectorScores.values(), 0.001);
  const maxBM25Score = Math.max(...bm25Scores.values(), 0.001);

  // Adjust weights based on what's available
  const useVectorSearch = vectorScores.size > 0;
  const vectorWeight = useVectorSearch ? 0.6 : 0;
  const bm25Weight = useVectorSearch ? 0.4 : 1.0;

  const combinedScores = new Map<string, { vector: number; bm25: number; combined: number }>();

  for (const chunk of allChunks) {
    const vectorScore = useVectorSearch ? (vectorScores.get(chunk.id) || 0) / maxVectorScore : 0;
    const bm25Score = (bm25Scores.get(chunk.id) || 0) / maxBM25Score;

    // Weighted combination
    const combined = vectorWeight * vectorScore + bm25Weight * bm25Score;

    if (combined > 0) {
      combinedScores.set(chunk.id, {
        vector: vectorScore,
        bm25: bm25Score,
        combined,
      });
    }
  }

  // 7. Dynamic reranking based on query intent
  const rerankedResults: RetrievedChunk[] = [];

  for (const [chunkId, scores] of combinedScores) {
    const chunk = allChunks.find((c) => c.id === chunkId);
    if (!chunk) continue;

    // Boost score based on keyword matches in metadata
    let boost = 1.0;
    const metadata = chunk.metadata as ChunkMetadata;
    if (metadata?.keywords) {
      const queryLower = query.toLowerCase();
      for (const keyword of metadata.keywords) {
        if (queryLower.includes(keyword)) {
          boost += 0.1;
        }
      }
    }

    rerankedResults.push({
      id: chunk.id,
      content: chunk.content,
      documentId: chunk.documentId,
      metadata: metadata,
      vectorScore: scores.vector,
      bm25Score: scores.bm25,
      combinedScore: Math.min(scores.combined * boost, 1.0),
    });
  }

  // Sort by combined score and return top K
  return rerankedResults
    .sort((a, b) => b.combinedScore - a.combinedScore)
    .slice(0, topK);
}

// ============ Response Generation ============

export async function generateResponse(
  query: string,
  conversationHistory: Array<{ role: "user" | "assistant"; content: string }>,
  retrievedChunks: RetrievedChunk[]
): Promise<{ response: string; sources: SourceCitation[] }> {
  // Build context from retrieved chunks
  const context = retrievedChunks
    .map((chunk, idx) => `[${idx + 1}] ${chunk.metadata.documentTitle}:\n${chunk.content}`)
    .join("\n\n");

  // Build source citations
  const sources: SourceCitation[] = retrievedChunks.map((chunk) => ({
    documentId: chunk.documentId,
    chunkId: chunk.id,
    title: chunk.metadata.documentTitle,
    excerpt: chunk.content.slice(0, 200) + (chunk.content.length > 200 ? "..." : ""),
    relevanceScore: chunk.combinedScore,
    type: chunk.metadata.documentType,
  }));

  // Generate response with context
  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    {
      role: "system",
      content: `You are an expert F1 Strategist Assistant with deep knowledge of Formula 1 racing, strategies, regulations, and driver performance. 

Your role is to:
1. Answer questions about F1 strategy, tire management, pit stops, and race tactics
2. Explain FIA regulations and technical rules
3. Analyze driver and team performance
4. Provide insights on race weekends and circuits

Use the provided context to give accurate, detailed answers. If the context doesn't contain relevant information, use your F1 knowledge but indicate when you're going beyond the provided sources.

Always cite your sources using [1], [2], etc. when referencing specific information from the context.

Context from F1 Knowledge Base:
${context || "No relevant context found. Use your general F1 knowledge."}`,
    },
    ...conversationHistory.map((msg) => ({
      role: msg.role as "user" | "assistant",
      content: msg.content,
    })),
    {
      role: "user",
      content: query,
    },
  ];

  const response = await openai.chat.completions.create({
    model: CHAT_MODEL,
    messages,
    max_completion_tokens: 1024,
  });

  return {
    response: response.choices[0].message.content || "I apologize, but I couldn't generate a response. Please try again.",
    sources,
  };
}

// ============ Document Ingestion Pipeline ============

export async function ingestDocument(
  title: string,
  content: string,
  type: DocumentType,
  source?: string,
  url?: string
): Promise<Document> {
  // Create document
  const document = await storage.createDocument({
    title,
    content,
    type,
    source: source || null,
    url: url || null,
  });

  // Process and chunk the document
  await processDocument(document);

  return document;
}

// Process an existing document (for seeded documents)
export async function processExistingDocument(document: Document): Promise<void> {
  await processDocument(document);
}

// ============ Initialize Sample Embeddings ============

export async function initializeEmbeddings(): Promise<void> {
  const chunks = await storage.getChunks();
  const chunksWithoutEmbeddings = chunks.filter(
    (c) => !c.embedding || c.embedding.length === 0
  );

  console.log(`Initializing embeddings for ${chunksWithoutEmbeddings.length} chunks...`);

  for (const chunk of chunksWithoutEmbeddings) {
    try {
      const embedding = await generateEmbedding(chunk.content);
      await storage.updateChunkEmbedding(chunk.id, embedding);
    } catch (error) {
      console.error(`Failed to generate embedding for chunk ${chunk.id}:`, error);
    }
  }

  console.log("Embeddings initialization complete.");
}
