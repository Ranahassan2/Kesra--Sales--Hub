import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { logoutWhatsApp } from "@/lib/whatsapp";

// POST /api/whatsapp/logout?slotId=slot1
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const slotId = req.nextUrl.searchParams.get("slotId") || "slot1";
  const sessionKey = `${session.user.id}_${slotId}`;

  try {
    await logoutWhatsApp(sessionKey);
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Failed to logout" }, { status: 500 });
  }
}
