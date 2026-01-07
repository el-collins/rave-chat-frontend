import { ChatInterface } from "@/components/chat/chat-interface";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gray-50 dark:bg-zinc-900">
      <div className="w-full max-w-2xl items-center justify-between font-mono text-sm">
        <ChatInterface />
      </div>
    </main>
  );
}
