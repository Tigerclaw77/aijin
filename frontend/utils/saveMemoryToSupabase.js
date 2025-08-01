import { supabase } from "./supabaseClient";

/**
 * Save memory entry to Supabase with duplicate filtering and metadata support.
 *
 * @param {Object} params
 * @param {string} params.companion_id - Companion ID (required)
 * @param {string|null} params.user_id - User ID (optional)
 * @param {string} [params.message_id] - Message UUID (auto-generated if missing)
 * @param {Object} params.content - Content object: { text: string } (required)
 * @param {string} [params.type] - Memory type: "text" or "fact" (default: "text")
 * @param {number} [params.importance] - Importance score (0.0–1.0), only for facts
 * @param {string} [params.emotion] - Optional emotion label
 * @param {number} [params.decay_score] - Optional custom decay score
 */
export async function saveMemoryToSupabase({
  companion_id,
  user_id = null,
  message_id = crypto.randomUUID(),
  content,
  type = "text",
  importance = 1.0,
  emotion = null,
  decay_score = null,
}) {
  if (!content?.text || !companion_id) return;

  const now = new Date().toISOString();

  if (type === "fact") {
    const { data: existing, error } = await supabase
      .from("memories")
      .select("id, created_at")
      .eq("companion_id", companion_id)
      .eq("type", "fact")
      .eq("content->>text", content.text)
      .maybeSingle();

    if (existing?.id) {
      const { error: updateError } = await supabase
        .from("memories")
        .update({
          updated_at: now,
          ...(importance && { importance }),
          ...(emotion && { emotion }),
        })
        .eq("id", existing.id);

      if (updateError) {
        console.error("❌ Error updating memory:", updateError.message);
      } else {
        console.log("🟡 Updated existing fact:", content.text);
      }
      return;
    }
  }

  const memoryPayload = {
    companion_id,
    user_id,
    message_id,
    content,
    type,
    ...(type === "fact" && { importance }),
    ...(emotion && { emotion }),
    ...(decay_score && { decay_score }),
    updated_at: now,
  };

  const { error: insertError } = await supabase.from("memories").insert(memoryPayload);
  if (insertError) {
    console.error(`❌ Error saving ${type}:`, insertError.message);
  } else {
    console.log(`✅ Saved ${type}:`, content.text);
  }
}
