export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { handleChat } from "../_core/chatCore";
export async function POST(req) { return handleChat(req, { preview: true }); }
export function GET() {
  return new Response(JSON.stringify({ error: "method_not_allowed" }), {
    status: 405, headers: { "Content-Type": "application/json" },
  });
}
