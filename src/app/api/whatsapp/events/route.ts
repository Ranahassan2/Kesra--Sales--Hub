import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getWaClient } from "@/lib/whatsapp";

// Global map to keep track of SSE writers for each session
declare global {
  var waSSEClients: Map<string, any[]> | undefined;
}
if (!global.waSSEClients) {
  global.waSSEClients = new Map();
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return new Response("Unauthorized", { status: 401 });

  const slotId = req.nextUrl.searchParams.get("slotId") || "slot1";
  const sessionKey = `${session.user.id}_${slotId}`;

  const responseStream = new TransformStream();
  const writer = responseStream.writable.getWriter();
  const encoder = new TextEncoder();

  // Add this writer to our global map
  if (!global.waSSEClients!.has(sessionKey)) {
    global.waSSEClients!.set(sessionKey, []);
  }
  global.waSSEClients!.get(sessionKey)!.push(writer);

  // Send an initial connected event
  writer.write(encoder.encode(`data: ${JSON.stringify({ type: "ping" })}\n\n`));

  req.signal.addEventListener("abort", () => {
    const clients = global.waSSEClients!.get(sessionKey) || [];
    global.waSSEClients!.set(
      sessionKey,
      clients.filter((c) => c !== writer)
    );
    writer.close().catch(() => {});
  });

  return new Response(responseStream.readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
    },
  });
}
