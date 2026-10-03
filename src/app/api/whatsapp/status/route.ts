import { NextRequest, NextResponse } from "next/server";
import { getWaState, initializeWhatsApp } from "@/lib/whatsapp";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

import fs from "fs/promises";
import path from "path";

// GET /api/whatsapp/status?slotId=slot1
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const slotId = req.nextUrl.searchParams.get("slotId") || "slot1";
  const sessionKey = `${session.user.id}_${slotId}`;

  let state = getWaState(sessionKey);

  // Auto-reconnect logic
  if (state.status === "DISCONNECTED") {
    const sessionPath = path.join(process.cwd(), ".wwebjs_auth", `session-${sessionKey}`);
    try {
      const stats = await fs.stat(sessionPath);
      if (stats.isDirectory()) {
        initializeWhatsApp(sessionKey);
        state = getWaState(sessionKey);
      }
    } catch {
      // Folder does not exist, do nothing
    }
  }

  return NextResponse.json(state);
}

// POST /api/whatsapp/status?slotId=slot1  → initialize
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const slotId = req.nextUrl.searchParams.get("slotId") || "slot1";
  const sessionKey = `${session.user.id}_${slotId}`;

  initializeWhatsApp(sessionKey);
  return NextResponse.json({ success: true, status: getWaState(sessionKey).status });
}
