// // /utils/Gift/getRecentGifts.js
// import { supabaseServer } from "../../../utils/Supabase/supabaseServerClient.js";

// /**
//  * Fetch recent gifts given to a companion by user.
//  * @param {string} user_id
//  * @param {string} companion_id
//  * @param {number} daysBack - How many past days to consider recent
//  * @returns {Promise<Array>} Array of gift records
//  */
// export async function getRecentGifts(user_id, companion_id, daysBack = 7) {
//   const since = new Date();
//   since.setDate(since.getDate() - daysBack);

//   const { data, error } = await supabaseServer
//     .from("gift_transactions")
//     .select("*")
//     .eq("user_id", user_id)
//     .eq("companion_id", companion_id)
//     .gte("created_at", since.toISOString())
//     .order("created_at", { ascending: false });

//   if (error) {
//     console.error("⚠️ getRecentGifts failed:", error.message);
//     return [];
//   }

//   return data || [];
// }
