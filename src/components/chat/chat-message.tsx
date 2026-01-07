import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Bot } from "lucide-react";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
}

export function ChatMessage({ role, content }: ChatMessageProps) {
  return (
    <div
      className={cn(
        "flex w-full items-start gap-4 p-4",
        role === "assistant" ? "bg-muted/50" : "bg-background"
      )}
    >
      <Avatar className="h-8 w-8 border">
        {role === "user" ? (
          <>
            <AvatarImage src="/user-avatar.jpg" alt="User" />
            <AvatarFallback>
              <User className="h-4 w-4" />
            </AvatarFallback>
          </>
        ) : (
          <>
            <AvatarImage src="/bot-avatar.jpg" alt="Bot" />
            <AvatarFallback className="bg-primary text-primary-foreground">
              <Bot className="h-4 w-4" />
            </AvatarFallback>
          </>
        )}
      </Avatar>
      <div className="flex-1 space-y-2">
        <p className="text-sm font-medium leading-none">
          {role === "user" ? "You" : "Rave Assistant"}
        </p>
        <div className="text-sm text-muted-foreground whitespace-pre-wrap">
          {content}
        </div>
      </div>
    </div>
  );
}
