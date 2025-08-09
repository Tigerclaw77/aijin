// utils/updateUserTokenBalance.js
import { supabase } from "../Supabase/supabaseClient";

/**
 * Set the user's token balance to an exact value.
 * @param {string} user_id - Supabase auth user.id
 * @param {number} newBalance - final tokens balance to set
 */
export async function updateUserTokenBalance(user_id, newBalance) {
  const { error } = await supabase
    .from("profiles")
    .update({ tokens: newBalance })  // ← correct column
    .eq("user_id", user_id);         // ← correct key

  if (error) {
    console.error("❌ Failed to update tokens:", error.message);
    throw error;
  }
  return true;
}
