import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await req.json();

    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    if (!id.startsWith("followup-")) {
      await (prisma as any).notification.updateMany({
        where: { id, userId: session.user.id },
        data: { isRead: true },
      });
    }
    // Note: Follow-ups become read when they are completed in the CRM.

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Mark read error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
