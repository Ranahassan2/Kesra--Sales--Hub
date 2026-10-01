import { NextResponse } from "next/server";
import { getWaState, initializeWhatsApp } from "@/lib/whatsapp";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  
  const state = getWaState(session.user.id);
  return NextResponse.json(state);
}

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  
  initializeWhatsApp(session.user.id);
  return NextResponse.json({ success: true, status: getWaState(session.user.id).status });
}
