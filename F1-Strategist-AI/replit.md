# F1 Strategist Assistant

## Overview

This is an AI-powered Formula 1 strategy assistant built with RAG 2.0 (Retrieval-Augmented Generation) technology. The application allows users to ask questions about F1 strategy, regulations, race analysis, driver performance, and get answers grounded in ingested F1 documents. The system uses semantic document chunking, vector embeddings for retrieval, and GPT-5 for response generation with source attribution.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight router)
- **State Management**: TanStack React Query for server state
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with custom F1-themed design tokens
- **Theme**: Dark/light mode support with localStorage persistence

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript with ESM modules
- **Build Tool**: Vite for frontend, esbuild for server bundling
- **API Pattern**: RESTful JSON API under `/api/*` prefix

### RAG System Design
- **Document Processing**: Content is chunked into 500-character segments with 100-character overlap
- **Embeddings**: OpenAI `text-embedding-3-small` model for vector generation
- **Retrieval**: Hybrid approach combining vector similarity search with top-K results (K=5)
- **Generation**: GPT-5 model for response synthesis with source citations
- **Storage**: In-memory storage implementation with PostgreSQL schema defined (Drizzle ORM)

### Data Models
- **Documents**: Ingested F1 content with types (article, analysis, rules, performance, news)
- **Chunks**: Document segments with embeddings and metadata for retrieval
- **Conversations**: Chat sessions with message history
- **Messages**: User/assistant messages with source citations

### Key Design Decisions
1. **Split-screen layout**: Chat interface (40%) + source panel (60%) for transparency in RAG responses
2. **Source attribution**: Every AI response includes clickable citations to source documents
3. **In-memory storage with DB schema**: Currently uses MemStorage but has Drizzle/PostgreSQL schema ready for persistence
4. **Semantic chunking**: Fixed-size chunks with overlap to maintain context across boundaries

## External Dependencies

### AI/ML Services
- **OpenAI API**: Used for embeddings (`text-embedding-3-small`) and chat completions (`gpt-5`)
  - Requires `OPENAI_API_KEY` environment variable

### Database
- **PostgreSQL**: Schema defined via Drizzle ORM, requires `DATABASE_URL` environment variable
- **Drizzle ORM**: Type-safe database toolkit with Zod schema generation

### Frontend Libraries
- **Radix UI**: Accessible component primitives (dialog, dropdown, tabs, etc.)
- **TanStack Query**: Data fetching and caching
- **React Hook Form + Zod**: Form validation
- **date-fns**: Date formatting utilities
- **Lucide React**: Icon library

### Build & Development
- **Vite**: Frontend dev server and bundler
- **esbuild**: Server-side bundling for production
- **TypeScript**: Full type safety across client and server