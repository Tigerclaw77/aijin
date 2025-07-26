import { supabase } from "./supabaseClient";
import useAuthStore from "../store/authStore"; // ✅ default import

/**
 * Logs out the user from Supabase and clears the Zustand auth state.
 * @returns {Promise<{ success: boolean, error?: string }>}
 */
export async function logoutUser() {
  const { logout } = useAuthStore.getState();

  try {
    await logout(); // uses the logout method from your store
    return { success: true };
  } catch (error) {
    console.error("Logout failed:", error.message);
    return { success: false, error: error.message };
  }
}
