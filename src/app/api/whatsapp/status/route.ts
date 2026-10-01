import { NextResponse } from "next/server";
import { getWaState, initializeWhatsApp } from "@/lib/whatsapp";

export async function GET() {
  const state = getWaState();
  return NextResponse.json(state);
}

export async function POST() {
  initializeWhatsApp();
  return NextResponse.json({ success: true, status: getWaState().status });
}
