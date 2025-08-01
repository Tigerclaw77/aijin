import { supabase } from "./supabaseClient";

export async function logCompanionArchive(companion) {
  try {
    const archivePayload = {
      companion_id: companion.companion_id,
      user_id: companion.user_id,
      deleted_at: new Date().toISOString(),
      data: companion,
    };

    const { error } = await supabase
      .from("archived_companions")
      .insert([archivePayload]);

    if (error) throw error;
  } catch (err) {
    console.error("Archive error:", err);
  }
}
