import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getWaClient, getWaState } from "@/lib/whatsapp";

export async function GET(
  _req: NextRequest,
  { params }: { params: { chatId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const state = getWaState();
  if (state.status !== "CONNECTED") {
    return NextResponse.json({ error: "WhatsApp not connected" }, { status: 503 });
  }

  try {
    const client = getWaClient();
    const chatId = decodeURIComponent(params.chatId);
    const chat = await client!.getChatById(chatId);
    const messages = await chat.fetchMessages({ limit: 50 });

    const msgData = messages.map((m) => ({
      id: m.id._serialized,
      body: m.body,
      fromMe: m.fromMe,
      timestamp: m.timestamp,
      type: m.type,
      author: m.author || null,
    }));

    return NextResponse.json({ messages: msgData });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { chatId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const state = getWaState();
  if (state.status !== "CONNECTED") {
    return NextResponse.json({ error: "WhatsApp not connected" }, { status: 503 });
  }

  try {
    const { message } = await req.json();
    const client = getWaClient();
    const chatId = decodeURIComponent(params.chatId);
    await client!.sendMessage(chatId, message);
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
