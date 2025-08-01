import { supabase } from "../utils/supabaseClient";
import useAuthStore from "../store/authStore";

export async function updateUserTokens(change) {
  const { user, updateTokens } = useAuthStore.getState();

  if (!user?.profile?.user_id) {
    console.warn("⛔ No valid user or profile in store");
    return { success: false, newAmount: null };
  }

  const current = user.profile.tokens || 0;
  const newAmount = current + change;

  const { error } = await supabase
    .from("profiles")
    .update({ tokens: newAmount })
    .eq("user_id", user.profile.user_id);

  if (!error) updateTokens(newAmount);

  return { success: !error, newAmount };
}
