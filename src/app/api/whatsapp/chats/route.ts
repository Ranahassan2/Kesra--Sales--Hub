import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getWaClient, getWaState } from "@/lib/whatsapp";

// GET /api/whatsapp/chats?slotId=slot1
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const slotId = req.nextUrl.searchParams.get("slotId") || "slot1";
  const sessionKey = `${session.user.id}_${slotId}`;

  const state = getWaState(sessionKey);
  if (state.status !== "CONNECTED") {
    return NextResponse.json({ error: "WhatsApp not connected" }, { status: 503 });
  }

  try {
    const client = getWaClient(sessionKey);
    const chats = await client!.getChats();

    const chatData = chats.slice(0, 50).map((chat) => ({
      id: chat.id._serialized,
      name: chat.name,
      isGroup: chat.isGroup,
      unreadCount: chat.unreadCount,
      lastMessage: null,
      timestamp: chat.timestamp,
    }));

    chatData.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

    return NextResponse.json({ chats: chatData });
  } catch (e: any) {
    console.error("Error fetching chats:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
