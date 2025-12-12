import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Plus, MessageSquare, Flag, Trash2 } from "lucide-react";
import type { Conversation } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";

interface ConversationSidebarProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  onDeleteConversation: (id: string) => void;
}

export function ConversationSidebar({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
}: ConversationSidebarProps) {
  return (
    <Sidebar>
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center">
            <Flag className="h-4 w-4 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-tight">F1 Strategist</h1>
            <p className="text-xs text-muted-foreground">RAG 2.0 Assistant</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <div className="px-4 py-2">
            <Button
              onClick={onNewConversation}
              className="w-full gap-2"
              data-testid="button-new-conversation"
            >
              <Plus className="h-4 w-4" />
              New Chat
            </Button>
          </div>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Conversations</SidebarGroupLabel>
          <SidebarGroupContent>
            <ScrollArea className="h-[calc(100vh-280px)]">
              <SidebarMenu>
                {conversations.length === 0 ? (
                  <div className="px-4 py-8 text-center text-muted-foreground">
                    <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No conversations yet</p>
                    <p className="text-xs mt-1">Start a new chat to begin</p>
                  </div>
                ) : (
                  conversations.map((conversation) => (
                    <SidebarMenuItem key={conversation.id}>
                      <SidebarMenuButton
                        isActive={conversation.id === activeConversationId}
                        onClick={() => onSelectConversation(conversation.id)}
                        className="group w-full justify-between"
                        data-testid={`conversation-${conversation.id}`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <MessageSquare className="h-4 w-4 shrink-0" />
                          <span className="truncate">{conversation.title}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-muted-foreground">
                            {conversation.createdAt
                              ? formatDistanceToNow(new Date(conversation.createdAt), { addSuffix: true })
                              : ""}
                          </span>
                          <span
                            role="button"
                            tabIndex={0}
                            className="h-6 w-6 flex items-center justify-center rounded-md opacity-0 group-hover:opacity-100 transition-opacity hover-elevate cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteConversation(conversation.id);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.stopPropagation();
                                onDeleteConversation(conversation.id);
                              }
                            }}
                            data-testid={`delete-conversation-${conversation.id}`}
                          >
                            <Trash2 className="h-3 w-3" />
                          </span>
                        </div>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))
                )}
              </SidebarMenu>
            </ScrollArea>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-sidebar-border">
        <div className="text-xs text-muted-foreground text-center">
          <p>Powered by RAG 2.0</p>
          <p className="mt-1">Hybrid retrieval with reranking</p>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
