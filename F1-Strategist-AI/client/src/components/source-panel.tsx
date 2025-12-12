import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { FileText, Newspaper, BarChart3, Gavel, X, ExternalLink, Percent } from "lucide-react";
import type { SourceCitation, Document } from "@shared/schema";
import { cn } from "@/lib/utils";

interface SourcePanelProps {
  sources: SourceCitation[];
  selectedSource: SourceCitation | null;
  documents: Document[];
  onSourceSelect: (source: SourceCitation | null) => void;
}

const typeIcons: Record<string, React.ReactNode> = {
  article: <FileText className="h-4 w-4" />,
  news: <Newspaper className="h-4 w-4" />,
  analysis: <BarChart3 className="h-4 w-4" />,
  performance: <BarChart3 className="h-4 w-4" />,
  rules: <Gavel className="h-4 w-4" />,
};

const typeLabels: Record<string, string> = {
  article: "Article",
  news: "Breaking News",
  analysis: "Race Analysis",
  performance: "Performance Data",
  rules: "FIA Rules",
};

export function SourcePanel({ sources, selectedSource, documents, onSourceSelect }: SourcePanelProps) {
  return (
    <div className="h-full flex flex-col bg-sidebar border-l border-sidebar-border">
      <div className="p-4 border-b border-sidebar-border">
        <h2 className="font-semibold text-lg">Sources & Context</h2>
        <p className="text-sm text-muted-foreground">
          Retrieved F1 documents and data
        </p>
      </div>

      <Tabs defaultValue="sources" className="flex-1 flex flex-col">
        <TabsList className="mx-4 mt-2 grid grid-cols-3 w-auto">
          <TabsTrigger value="sources" data-testid="tab-sources">
            Sources
          </TabsTrigger>
          <TabsTrigger value="documents" data-testid="tab-documents">
            Documents
          </TabsTrigger>
          <TabsTrigger value="news" data-testid="tab-news">
            News
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sources" className="flex-1 m-0">
          <ScrollArea className="h-[calc(100vh-220px)]">
            <div className="p-4 space-y-3">
              {sources.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No sources retrieved yet</p>
                  <p className="text-xs mt-1">Ask a question to see relevant F1 data</p>
                </div>
              ) : (
                sources.map((source, idx) => (
                  <SourceCard
                    key={idx}
                    source={source}
                    isSelected={selectedSource?.chunkId === source.chunkId}
                    onClick={() => onSourceSelect(source)}
                  />
                ))
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="documents" className="flex-1 m-0">
          <ScrollArea className="h-[calc(100vh-220px)]">
            <div className="p-4 space-y-3">
              {documents.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No documents uploaded</p>
                  <p className="text-xs mt-1">Add F1 articles and rules to the knowledge base</p>
                </div>
              ) : (
                documents.map((doc) => (
                  <DocumentCard key={doc.id} document={doc} />
                ))
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="news" className="flex-1 m-0">
          <ScrollArea className="h-[calc(100vh-220px)]">
            <div className="p-4">
              <div className="text-center py-8 text-muted-foreground">
                <Newspaper className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Breaking news will appear here</p>
                <p className="text-xs mt-1">Real-time F1 updates and race results</p>
              </div>
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>

      {selectedSource && (
        <SourceDetailPanel
          source={selectedSource}
          onClose={() => onSourceSelect(null)}
        />
      )}
    </div>
  );
}

function SourceCard({
  source,
  isSelected,
  onClick,
}: {
  source: SourceCitation;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <Card
      className={cn(
        "cursor-pointer transition-colors hover-elevate",
        isSelected && "ring-2 ring-primary"
      )}
      onClick={onClick}
      data-testid={`source-card-${source.chunkId}`}
    >
      <CardHeader className="p-3 pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-muted-foreground">
              {typeIcons[source.type]}
            </span>
            <CardTitle className="text-sm font-medium truncate">
              {source.title}
            </CardTitle>
          </div>
          <Badge variant="secondary" className="shrink-0 gap-1 text-xs">
            <Percent className="h-3 w-3" />
            {Math.round(source.relevanceScore * 100)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-3 pt-0">
        <p className="text-xs text-muted-foreground line-clamp-2">
          {source.excerpt}
        </p>
        <Badge variant="outline" className="mt-2 text-[10px]">
          {typeLabels[source.type]}
        </Badge>
      </CardContent>
    </Card>
  );
}

function DocumentCard({ document }: { document: Document }) {
  return (
    <Card className="hover-elevate" data-testid={`document-card-${document.id}`}>
      <CardHeader className="p-3 pb-2">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">
            {typeIcons[document.type]}
          </span>
          <CardTitle className="text-sm font-medium truncate">
            {document.title}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-3 pt-0">
        <p className="text-xs text-muted-foreground line-clamp-2">
          {document.content.slice(0, 150)}...
        </p>
        <div className="flex items-center gap-2 mt-2">
          <Badge variant="outline" className="text-[10px]">
            {typeLabels[document.type]}
          </Badge>
          {document.source && (
            <span className="text-[10px] text-muted-foreground">
              {document.source}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function SourceDetailPanel({
  source,
  onClose,
}: {
  source: SourceCitation;
  onClose: () => void;
}) {
  return (
    <div className="absolute inset-0 bg-sidebar z-10 flex flex-col">
      <div className="p-4 border-b border-sidebar-border flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {typeIcons[source.type]}
          <h3 className="font-medium truncate">{source.title}</h3>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          data-testid="button-close-source-detail"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Badge>{typeLabels[source.type]}</Badge>
            <Badge variant="outline" className="gap-1">
              <Percent className="h-3 w-3" />
              {Math.round(source.relevanceScore * 100)}% relevance
            </Badge>
          </div>
          <div className="prose prose-sm dark:prose-invert">
            <p>{source.excerpt}</p>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
