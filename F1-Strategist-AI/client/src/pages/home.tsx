import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { ConversationSidebar } from "@/components/conversation-sidebar";
import { ChatMessage, ChatMessageSkeleton } from "@/components/chat-message";
import { ChatInput } from "@/components/chat-input";
import { SourcePanel } from "@/components/source-panel";
import { DocumentUploadDialog } from "@/components/document-upload-dialog";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Conversation, Message, Document, SourceCitation, DocumentUpload } from "@shared/schema";
import { Flag, Zap, Database, Brain, PanelRightOpen, PanelRightClose } from "lucide-react";

export default function Home() {
  const { toast } = useToast();
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [selectedSource, setSelectedSource] = useState<SourceCitation | null>(null);
  const [showSourcePanel, setShowSourcePanel] = useState(true);
  const [currentSources, setCurrentSources] = useState<SourceCitation[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch conversations
  const { data: conversations = [] } = useQuery<Conversation[]>({
    queryKey: ["/api/conversations"],
  });

  // Fetch messages for active conversation
  const { data: messages = [], isLoading: messagesLoading } = useQuery<Message[]>({
    queryKey: ["/api/conversations", activeConversationId, "messages"],
    enabled: !!activeConversationId,
  });

  // Fetch documents
  const { data: documents = [] } = useQuery<Document[]>({
    queryKey: ["/api/documents"],
  });

  // Create new conversation
  const createConversation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/conversations", {
        title: "New Chat",
      });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      setActiveConversationId(data.id);
    },
  });

  // Delete conversation
  const deleteConversation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/conversations/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      if (activeConversationId) {
        setActiveConversationId(null);
      }
    },
  });

  // Send message
  const sendMessage = useMutation({
    mutationFn: async (message: string) => {
      let convId = activeConversationId;

      // Create conversation if needed
      if (!convId) {
        const convResponse = await apiRequest("POST", "/api/conversations", {
          title: message.slice(0, 50) + (message.length > 50 ? "..." : ""),
        });
        const conv = await convResponse.json();
        convId = conv.id;
        setActiveConversationId(convId);
        queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      }

      const response = await apiRequest("POST", "/api/chat", {
        message,
        conversationId: convId,
      });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["/api/conversations", activeConversationId, "messages"],
      });
      if (data.sources) {
        setCurrentSources(data.sources);
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Upload document
  const uploadDocument = useMutation({
    mutationFn: async (data: DocumentUpload) => {
      const response = await apiRequest("POST", "/api/documents", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      toast({
        title: "Document Added",
        description: "The document has been processed and added to the knowledge base.",
      });
    },
    onError: () => {
      toast({
        title: "Upload Failed",
        description: "Failed to process document. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sendMessage.isPending]);

  // Collect all sources from messages
  const allSources = messages.flatMap((m) => m.sources || []);
  const displaySources = currentSources.length > 0 ? currentSources : allSources;

  const sidebarStyle = {
    "--sidebar-width": "18rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={sidebarStyle as React.CSSProperties}>
      <div className="flex h-screen w-full bg-background">
        <ConversationSidebar
          conversations={conversations}
          activeConversationId={activeConversationId}
          onSelectConversation={setActiveConversationId}
          onNewConversation={() => createConversation.mutate()}
          onDeleteConversation={(id) => deleteConversation.mutate(id)}
        />

        <div className="flex flex-col flex-1 min-w-0">
          {/* Header */}
          <header className="flex items-center justify-between gap-4 p-3 border-b border-border bg-background sticky top-0 z-50">
            <div className="flex items-center gap-3">
              <SidebarTrigger data-testid="button-sidebar-toggle" />
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-md bg-primary flex items-center justify-center">
                  <Flag className="h-3.5 w-3.5 text-primary-foreground" />
                </div>
                <span className="font-semibold">F1 Strategist</span>
              </div>
              <div className="hidden sm:flex items-center gap-2">
                <Badge variant="outline" className="gap-1 text-xs">
                  <Zap className="h-3 w-3" />
                  RAG 2.0
                </Badge>
                <Badge variant="outline" className="gap-1 text-xs">
                  <Database className="h-3 w-3" />
                  {documents.length} docs
                </Badge>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <DocumentUploadDialog
                onUpload={(data) => uploadDocument.mutateAsync(data)}
                isLoading={uploadDocument.isPending}
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowSourcePanel(!showSourcePanel)}
                className="hidden md:flex"
                data-testid="button-toggle-sources"
              >
                {showSourcePanel ? (
                  <PanelRightClose className="h-4 w-4" />
                ) : (
                  <PanelRightOpen className="h-4 w-4" />
                )}
              </Button>
              <ThemeToggle />
            </div>
          </header>

          {/* Main Content */}
          <div className="flex flex-1 min-h-0">
            {/* Chat Area */}
            <div className="flex flex-col flex-1 min-w-0">
              <ScrollArea className="flex-1">
                <div className="max-w-3xl mx-auto px-4 py-6">
                  {!activeConversationId && messages.length === 0 ? (
                    <WelcomeScreen />
                  ) : (
                    <>
                      {messages.map((message) => (
                        <ChatMessage
                          key={message.id}
                          message={message}
                          onSourceClick={setSelectedSource}
                        />
                      ))}
                      {sendMessage.isPending && <ChatMessageSkeleton />}
                      <div ref={messagesEndRef} />
                    </>
                  )}
                </div>
              </ScrollArea>

              <ChatInput
                onSend={(message) => sendMessage.mutate(message)}
                isLoading={sendMessage.isPending}
              />
            </div>

            {/* Source Panel */}
            {showSourcePanel && (
              <div className="hidden md:block w-80 relative">
                <SourcePanel
                  sources={displaySources}
                  selectedSource={selectedSource}
                  documents={documents}
                  onSourceSelect={setSelectedSource}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
}

function WelcomeScreen() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="h-16 w-16 rounded-xl bg-primary flex items-center justify-center mb-6">
        <Flag className="h-8 w-8 text-primary-foreground" />
      </div>
      <h1 className="text-3xl font-bold mb-2">F1 Strategist Assistant</h1>
      <p className="text-muted-foreground max-w-md mb-8">
        Your AI-powered pit wall for Formula 1 strategy, race analysis, and regulation questions.
        Powered by RAG 2.0 with hybrid retrieval.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg">
        <FeatureCard
          icon={<Brain className="h-5 w-5" />}
          title="Hybrid Retrieval"
          description="Combines vector embeddings with BM25 keyword search"
        />
        <FeatureCard
          icon={<Zap className="h-5 w-5" />}
          title="Query Enhancement"
          description="Multiple query variations for better coverage"
        />
        <FeatureCard
          icon={<Database className="h-5 w-5" />}
          title="Dynamic Reranking"
          description="Relevance scoring for precise context selection"
        />
        <FeatureCard
          icon={<Flag className="h-5 w-5" />}
          title="Source Citations"
          description="Transparent references to F1 documents"
        />
      </div>

      <p className="text-sm text-muted-foreground mt-8">
        Ask about tire strategies, driver comparisons, FIA regulations, or race analysis
      </p>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3 p-4 rounded-lg bg-card border border-card-border text-left">
      <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center shrink-0 text-primary">
        {icon}
      </div>
      <div>
        <h3 className="font-medium text-sm">{title}</h3>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
    </div>
  );
}
