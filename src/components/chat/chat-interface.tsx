"use client";

import * as React from "react";
import { Send, Paperclip, X, FileAudio, FileImage, Mic, Square } from "lucide-react";
import { useReactMediaRecorder } from "react-media-recorder";

import { cn } from "@/lib/utils";
import { config } from "@/lib/config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);

  const { status, startRecording, stopRecording, mediaBlobUrl } = useReactMediaRecorder({ audio: true });

  const [sessionId, setSessionId] = React.useState("");
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    // Generate or retrieve session ID on mount
    let storedSessionId = sessionStorage.getItem("chat_session_id");
    if (!storedSessionId) {
      storedSessionId = `session-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      sessionStorage.setItem("chat_session_id", storedSessionId);
    }
    setSessionId(storedSessionId);
  }, []);

  // Convert recorded blob URL to File object
  React.useEffect(() => {
    if (mediaBlobUrl) {
      fetch(mediaBlobUrl)
        .then((res) => res.blob())
        .then((blob) => {
          const file = new File([blob], "voice_message.wav", { type: "audio/wav" });
          setSelectedFile(file);
        });
    }
  }, [mediaBlobUrl]);

  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoading]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const sendMessage = async () => {
    // If recording, stop it first? No, we shouldn't send while recording.
    if (!inputValue.trim() && !selectedFile) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: selectedFile 
        ? `[Attached: ${selectedFile.name}] ${inputValue}` 
        : inputValue,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    const fileToSend = selectedFile;
    setSelectedFile(null); // Clear immediately
    setIsLoading(true);

    try {
      const headers: HeadersInit = {};
      let body: any;

      if (fileToSend) {
        const formData = new FormData();
        formData.append("sessionId", sessionId);
        formData.append("file", fileToSend);
        formData.append("message", inputValue); 
        body = formData;
        // fetch handles content-type for FormData
      } else {
        headers["Content-Type"] = "application/json";
        body = JSON.stringify({
          message: inputValue,
          sessionId: sessionId,
        });
      }

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: headers,
        body: body,
      });

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      const data = await response.json();
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
      // Reset file input
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const isRecording = status === "recording";

  return (
    <Card className="flex h-[600px] w-full max-w-2xl flex-col overflow-hidden border shadow-xl">
      <div className="flex items-center justify-between border-b px-6 py-4 bg-muted/20">
        <div>
          <h2 className="text-lg font-semibold">Rave Chat</h2>
          <p className="text-xs text-muted-foreground">Powered by n8n & OpenAI</p>
        </div>
        {isRecording && (
          <div className="flex items-center gap-1 h-6">
            <span className="text-xs font-medium text-red-500 mr-2">Recording</span>
            <div className="flex items-end gap-0.5 h-4">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="w-1 bg-red-500 rounded-t-sm animate-bounce"
                  style={{
                    height: "100%",
                    animationDuration: "0.8s",
                    animationDelay: `${i * 0.1}s`,
                    opacity: 0.7,
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </div>
      
      <div className="flex-1 overflow-y-auto p-4">
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
          <div ref={scrollRef} />
        </div>
      </div>

      <div className="border-t p-4 bg-background">
        {/* File Preview Area */}
        {selectedFile && (
          <div className="mb-2 flex items-center gap-2 rounded-md border bg-muted p-2">
            {selectedFile.type.startsWith("image/") ? (
               <FileImage className="h-5 w-5 text-blue-500" />
            ) : (
               <FileAudio className="h-5 w-5 text-orange-500" />
            )}
            <span className="text-sm truncate max-w-[200px]">{selectedFile.name}</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 ml-auto hover:bg-destructive/20"
              onClick={() => {
                setSelectedFile(null);
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        <div className="flex items-center gap-2">
          <input
            type="file"
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept="image/*,audio/*"
          />
          
          {/* Paperclip for Image Upload */}
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => fileInputRef.current?.click()}
            title="Attach Image"
            disabled={isRecording}
          >
            <Paperclip className="h-4 w-4" />
          </Button>

          {/* Mic Button */}
          <Button
            variant={isRecording ? "destructive" : "outline"}
            size="icon"
            onClick={isRecording ? stopRecording : startRecording}
            title={isRecording ? "Stop Recording" : "Record Voice"}
          >
            {isRecording ? <Square className="h-4 w-4 fill-current" /> : <Mic className="h-4 w-4" />}
          </Button>

          <Input
            placeholder={isRecording ? "Recording..." : "Type your message..."}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading || isRecording}
            className="flex-1"
          />
          <Button size="icon" onClick={sendMessage} disabled={isLoading || isRecording || (!inputValue.trim() && !selectedFile)}>
            <Send className="h-4 w-4" />
            <span className="sr-only">Send</span>
          </Button>
        </div>
      </div>
    </Card>
  );
}
