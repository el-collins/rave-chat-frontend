"use client";

import * as React from "react";
import { Send } from "lucide-react";

import { cn } from "@/lib/utils";
import { config } from "@/lib/config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { ChatMessage } from "@/components/chat/chat-message";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export function ChatInterface() {
  const [messages, setMessages] = React.useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Hello! I am the RaveIntelligence Assistant. How can I help you today?",
    },
  ]);
  const [inputValue, setInputValue] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);

  const sendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: inputValue,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    // Mock API call for now (Task #1 requirement: n8n integration comes later)
    // Real API call to n8n
    try {
      const response = await fetch(config.n8nWebhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: inputValue,
          sessionId: "test-session-user-1", // You could generate a UUID here
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      const data = await response.json();
      
      // Expecting n8n to return { output: "AI response..." } or array of messages
      // Adjust based on your actual n8n final node output structure
      const aiText = data.output || data.message || JSON.stringify(data);

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: aiText,
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Sorry, I encountered an error connecting to the server.",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <Card className="flex h-[600px] w-full max-w-2xl flex-col overflow-hidden border shadow-xl">
      <div className="flex items-center justify-between border-b px-6 py-4 bg-muted/20">
        <div>
          <h2 className="text-lg font-semibold">Rave Chat</h2>
          <p className="text-xs text-muted-foreground">Powered by n8n & OpenAI</p>
        </div>
      </div>
      
      <ScrollArea className="flex-1 p-4">
        <div className="flex flex-col gap-4">
          {messages.map((msg) => (
            <ChatMessage key={msg.id} role={msg.role} content={msg.content} />
          ))}
          {isLoading && (
             <div className="flex w-full items-start gap-4 p-4 bg-muted/50 rounded-lg animate-pulse">
                <div className="h-8 w-8 rounded-full bg-gray-300" />
                <div className="space-y-2 flex-1">
                   <div className="h-4 w-1/4 bg-gray-300 rounded" />
                   <div className="h-4 w-1/2 bg-gray-300 rounded" />
                </div>
             </div>
          )}
        </div>
      </ScrollArea>

      <div className="border-t p-4 bg-background">
        <div className="flex items-center gap-2">
          <Input
            placeholder="Type your message..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            className="flex-1"
          />
          <Button size="icon" onClick={sendMessage} disabled={isLoading || !inputValue.trim()}>
            <Send className="h-4 w-4" />
            <span className="sr-only">Send</span>
          </Button>
        </div>
      </div>
    </Card>
  );
}
