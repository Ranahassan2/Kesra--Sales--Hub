import { ActivityType } from "@/lib/enums";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";


// GET /api/activity — سجل النشاط الكامل، فلترة اختيارية بالنوع أو بالبحث عن ليد
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !can(session.user.role, "VIEW_FULL_ACTIVITY_LOG")) {
    return NextResponse.json({ error: "غير مصرح لك بهذا الإجراء" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") ?? undefined;
  const q = searchParams.get("q")?.trim() ?? undefined;
  const take = Math.min(Number(searchParams.get("take") ?? 100), 300);

  const where: any = {};
  if (type && (Object.values() as string[]).includes(type)) where.type = type;
  if (q) {
    where.lead = {
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { phone: { contains: q } },
      ],
    };
  }

  const activities = await prisma.activity.findMany({
    where,
    take,
    orderBy: { createdAt: "desc" },
    include: {
      lead: { select: { id: true, name: true, phone: true } },
      user: { select: { id: true, name: true, role: true } },
    },
  });

  return NextResponse.json(activities);
}
