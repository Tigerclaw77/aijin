"use client";

import dynamic from "next/dynamic";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import useAuthStore from "../store/authStore";
import useCompanionStore from "../store/companionStore";

const CREATION_PATH = "/create"; // ← change if your creation flow lives elsewhere

function Skeleton() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-gray-400 animate-pulse">
      <div className="text-3xl">✨ Loading…</div>
    </div>
  );
}

const PreviewChat = dynamic(() => import("./chat/PreviewChat"), {
  ssr: false,
  loading: () => <Skeleton />,
});
const RealChat = dynamic(() => import("./chat/RealChat"), {
  ssr: false,
  loading: () => <Skeleton />,
});

export default function ChatBox() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { currentCompanion } = useCompanionStore();

  const isLoggedIn = !!user;
  const hasCompanion = !!currentCompanion?.companion_id;

  // Logged-in but no companion? Send them to character creation.
  useEffect(() => {
    if (isLoggedIn && !hasCompanion) {
      router.replace(CREATION_PATH);
    }
  }, [isLoggedIn, hasCompanion, router]);

  // Guests always see preview; logged-in + companion see real chat.
  if (!isLoggedIn) return <PreviewChat />;
  if (!hasCompanion) return <Skeleton />; // brief skeleton while we redirect

  return <RealChat />;
}
