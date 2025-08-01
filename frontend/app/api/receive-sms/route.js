export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(req) {
  try {
    const body = await req.text(); // Edge-style body parsing
    const params = new URLSearchParams(body);

    const from = params.get("From");
    const bodyText = params.get("Body");

    console.log("📩 Received SMS:", { from, bodyText });

    const replyText = `Hello! You said: "${bodyText}". We'll talk soon! ❤️`;

    const xmlResponse = `
      <Response>
        <Message>${replyText}</Message>
      </Response>
    `.trim();

    return new Response(xmlResponse, {
      status: 200,
      headers: { "Content-Type": "text/xml" },
    });
  } catch (err) {
    console.error("🛑 SMS receive error:", err);
    return new Response("Error", { status: 500 });
  }
}
