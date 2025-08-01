// @ts-check
/// <reference path="./memoryTypes.d.ts" />

import { addMemory, getAllMemory } from "./memoryManager";

/**
 * Injects a sample memory into Supabase and reads it back.
 * @param {string} user_id
 * @param {string} companion_id
 */
export async function testMemoryToSupabase(user_id, companion_id) {
  const sample = {
    id: "",
    type: "test",
    label: "Favorite drink",
    summary: "Paul loves iced green tea with honey.",
    details: {
      food: "iced green tea",
    },
    keywords: ["green tea", "drink", "honey"],
    createdAt: "",
    lastReinforced: "",
    decayResistant: true,
  };

  console.log("🧪 Inserting test memory...");
  const result = await addMemory(user_id, companion_id, sample);
  console.log("📦 Insert result:", result);

  console.log("📥 Fetching all memory for", { user_id, companion_id });
  const all = await getAllMemory(user_id, companion_id);
  console.log("🧠 Full memory record:", all);
}
