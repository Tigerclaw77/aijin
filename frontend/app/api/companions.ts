// /utils/api/companions.ts
export async function updateCompanionTier(companion_id: string, sub_tier: string) {
  const res = await fetch("/api/admin/update-companion-tier", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ companion_id, sub_tier }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error || "UPDATE_FAILED");
  return json;
}
