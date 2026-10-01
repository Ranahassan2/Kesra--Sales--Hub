import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getWaClient, getWaState } from "@/lib/whatsapp";

export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const state = getWaState(session.user.id);
  if (state.status !== "CONNECTED") {
    return NextResponse.json({ error: "WhatsApp not connected" }, { status: 503 });
  }

  try {
    const client = getWaClient(session.user.id);
    const chats = await client!.getChats();
    
    const chatData = chats.slice(0, 50).map((chat) => {
      return {
        id: chat.id._serialized,
        name: chat.name,
        isGroup: chat.isGroup,
        unreadCount: chat.unreadCount,
        lastMessage: null, // We'll skip fetching the exact last message body to prevent freezing the server
        timestamp: chat.timestamp,
      };
    });

    // Sort by timestamp descending
    chatData.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

    return NextResponse.json({ chats: chatData });
  } catch (e: any) {
    console.error("Error fetching chats:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
