import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Loader2 } from "lucide-react";

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading?: boolean;
  disabled?: boolean;
}

const quickPrompts = [
  "What tire strategy works best at Monaco?",
  "Compare Verstappen vs Hamilton lap times",
  "Explain DRS rules in overtaking zones",
  "Best pit stop timing for 2-stop strategy",
];

export function ChatInput({ onSend, isLoading, disabled }: ChatInputProps) {
  const [message, setMessage] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [message]);

  const handleSubmit = () => {
    if (message.trim() && !isLoading && !disabled) {
      onSend(message.trim());
      setMessage("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="border-t border-border bg-background p-4">
      <div className="flex flex-wrap gap-2 mb-3">
        {quickPrompts.map((prompt, idx) => (
          <Button
            key={idx}
            variant="outline"
            size="sm"
            className="text-xs"
            onClick={() => setMessage(prompt)}
            disabled={isLoading || disabled}
            data-testid={`quick-prompt-${idx}`}
          >
            {prompt}
          </Button>
        ))}
      </div>

      <div className="flex gap-2 items-end">
        <Textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about F1 strategy, regulations, or driver performance..."
          className="min-h-[44px] max-h-[200px] resize-none text-sm"
          disabled={isLoading || disabled}
          data-testid="input-chat-message"
        />
        <Button
          onClick={handleSubmit}
          disabled={!message.trim() || isLoading || disabled}
          size="icon"
          data-testid="button-send-message"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
}
