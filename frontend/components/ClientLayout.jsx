'use client';

import { useEffect } from "react";
import useAuthStore from "../store/authStore";

export default function ClientLayout({ children }) {
  const { user, fetchUser } = useAuthStore();

  useEffect(() => {
    const run = async () => {
      console.log("🔁 Calling fetchUser()...");
      await fetchUser();
    };
    run();
  }, []);

  useEffect(() => {
    console.log("✅ Zustand user from authStore:", user);
    console.log("🧠 user?.id =", user?.id);
  }, [user]);

  return (
    <div className="flex flex-col min-h-screen h-full">
      {children}
    </div>
  );
}
