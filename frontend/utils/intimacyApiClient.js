export async function updateCompanionIntimacy(user_id, companion_id) {
  if (!user_id || !companion_id) {
    console.warn("Missing user_id or companion_id");
    return;
  }

  try {
    console.log("🛰 Sending intimacy update...", { user_id, companion_id });

    const res = await fetch("/api/intimacy/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id, companion_id }),
    });

    const text = await res.text(); // 👈 use .text() instead of .json()
    let result;

    try {
      result = JSON.parse(text);
    } catch (err) {
      console.error("❌ Failed to parse JSON from intimacy update:", text);
      throw new Error("Invalid JSON from server");
    }

    if (!res.ok) {
      throw new Error(result.error || "Unknown server error");
    }

    console.log("✅ Intimacy updated:", result.newIntimacy);
  } catch (err) {
    console.error("❌ Failed to update intimacy for companion:", err);
  }
}
