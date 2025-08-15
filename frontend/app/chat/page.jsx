"use client";

import { useSearchParams } from "next/navigation";
import GuestChatBox from "../../components/GuestChatBox";
import ChatBox from "../../components/ChatBox";
import useAuthStore from "../../store/authStore";

export default function ChatPage() {
  const params = useSearchParams();
  const isGuest = params.get("guest") === "true";
  const { user } = useAuthStore();

  // If explicitly guest, render the lightweight preview.
  if (isGuest && !user?.id) {
    return <GuestChatBox />;
  }

  // Otherwise, use your full chat (requires a selected companion in your flow).
  return <ChatBox />;
}
