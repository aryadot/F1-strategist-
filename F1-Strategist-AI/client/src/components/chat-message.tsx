import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { Message, SourceCitation } from "@shared/schema";
import { FileText, Newspaper, BookOpen, BarChart3, Gavel, ExternalLink } from "lucide-react";

interface ChatMessageProps {
  message: Message;
  onSourceClick?: (source: SourceCitation) => void;
}

const typeIcons: Record<string, React.ReactNode> = {
  article: <FileText className="h-3 w-3" />,
  news: <Newspaper className="h-3 w-3" />,
  analysis: <BarChart3 className="h-3 w-3" />,
  performance: <BarChart3 className="h-3 w-3" />,
  rules: <Gavel className="h-3 w-3" />,
};

const typeColors: Record<string, string> = {
  article: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  news: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  analysis: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  performance: "bg-green-500/10 text-green-600 dark:text-green-400",
  rules: "bg-slate-500/10 text-slate-600 dark:text-slate-400",
};

export function ChatMessage({ message, onSourceClick }: ChatMessageProps) {
  const isUser = message.role === "user";
  const sources = message.sources || [];

  return (
    <div
      className={cn(
        "flex gap-4 py-4",
        isUser ? "justify-end" : "justify-start"
      )}
      data-testid={`message-${message.id}`}
    >
      <div className={cn("flex flex-col gap-2 max-w-[85%]", isUser && "items-end")}>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {isUser ? "You" : "F1 Strategist"}
          </span>
        </div>
        
        <Card
          className={cn(
            "px-4 py-3",
            isUser
              ? "bg-primary text-primary-foreground border-primary-border"
              : "bg-card border-card-border"
          )}
        >
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <p className="whitespace-pre-wrap m-0 text-sm leading-relaxed">
              {message.content}
            </p>
          </div>
        </Card>

        {!isUser && sources.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-1">
            {sources.map((source, idx) => (
              <Badge
                key={idx}
                variant="outline"
                className={cn(
                  "cursor-pointer gap-1.5 text-xs font-normal",
                  typeColors[source.type] || typeColors.article
                )}
                onClick={() => onSourceClick?.(source)}
                data-testid={`source-badge-${idx}`}
              >
                {typeIcons[source.type] || typeIcons.article}
                <span className="truncate max-w-[120px]">{source.title}</span>
                <span className="text-[10px] opacity-60">
                  {Math.round(source.relevanceScore * 100)}%
                </span>
                <ExternalLink className="h-2.5 w-2.5 opacity-60" />
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function ChatMessageSkeleton() {
  return (
    <div className="flex gap-4 py-4">
      <div className="flex flex-col gap-2 max-w-[85%]">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            F1 Strategist
          </span>
        </div>
        <Card className="px-4 py-3 bg-card border-card-border">
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              <span className="h-2 w-2 rounded-full bg-primary animate-pulse" style={{ animationDelay: "0ms" }} />
              <span className="h-2 w-2 rounded-full bg-primary animate-pulse" style={{ animationDelay: "150ms" }} />
              <span className="h-2 w-2 rounded-full bg-primary animate-pulse" style={{ animationDelay: "300ms" }} />
            </div>
            <span className="text-sm text-muted-foreground">Analyzing F1 data...</span>
          </div>
        </Card>
      </div>
    </div>
  );
}
