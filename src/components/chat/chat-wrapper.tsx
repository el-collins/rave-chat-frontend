"use client";

import dynamic from "next/dynamic";

const ChatInterface = dynamic(
  () => import("./chat-interface").then((mod) => mod.ChatInterface),
  { ssr: false }
);

export function ChatWrapper() {
  return <ChatInterface />;
}
