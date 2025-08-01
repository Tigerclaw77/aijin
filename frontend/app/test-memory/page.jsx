"use client";

import { useEffect } from "react";
import { testMemoryToSupabase } from "../../data/memory/testMemory";

export default function TestMemoryPage() {
  useEffect(() => {
    testMemoryToSupabase(
      "214e517b-c59f-45fb-976d-4f69e913fbc6", // user_id
      "72c5e29a-30b9-4d26-8164-48a82987dac5"  // companion_id
    );
  }, []);

  return (
    <div className="p-6 text-white">
      <h1 className="text-xl font-bold">🧪 Testing Memory Insert</h1>
      <p>Open the console and check Supabase to verify success.</p>
    </div>
  );
}
