// app/dev/testCheckMemory/page.jsx
"use client";

import { useEffect } from "react";

export default function TestCheckMemoryPage() {
  useEffect(() => {
    async function test() {
      const res = await fetch("/api/check-memory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companion_id: "72c5e29a-30b9-4d26-8164-48a82987dac5",
        }),
      });

      try {
        const result = await res.json();
        console.log("🧠 Memory enabled?", result.memoryEnabled);
      } catch (err) {
        console.error("❌ Failed to parse response JSON:", err);
        const text = await res.text();
        console.error("Raw response:", text);
      }
    }

    test();
  }, []);

  return (
    <div className="text-white p-4">
      <h1>Testing Memory Check...</h1>
      <p>Check the browser console for results.</p>
    </div>
  );
}
