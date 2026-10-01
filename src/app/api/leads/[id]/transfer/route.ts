import { Role } from "@/lib/enums";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { can, isManagementRole } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { z } from "zod";


const schema = z.object({
  salesEmployeeId: z.string(),
});

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || !can(session.user.role, "TRANSFER_TO_SALES")) {
    return NextResponse.json({ error: "غير مصرح لك بهذا الإجراء" }, { status: 403 });
  }

  const lead = await prisma.lead.findUnique({ where: { id: params.id } });
  if (!lead) return NextResponse.json({ error: "الليد غير موجود" }, { status: 404 });

  if (!isManagementRole(session.user.role) && lead.assignedToId !== session.user.id) {
    return NextResponse.json({ error: "هذا الليد غير مسند لك" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }

  const salesEmployee = await prisma.user.findUnique({
    where: { id: parsed.data.salesEmployeeId },
  });
  if (!salesEmployee || salesEmployee.role !== Role.SALES || !salesEmployee.isActive) {
    return NextResponse.json({ error: "موظف المبيعات المحدد غير صالح" }, { status: 400 });
  }

  const [updatedLead] = await prisma.$transaction([
    prisma.lead.update({
      where: { id: params.id },
      data: {
        assignedToId: salesEmployee.id,
        currentStage: Role.SALES,
        status: "TRANSFERRED_TO_SALES",
        salesStatus: "NEW",
        transferredAt: new Date(),
      },
    }),
    prisma.activity.create({
      data: {
        leadId: params.id,
        userId: session.user.id,
        type: "TRANSFERRED",
        message: `تم تحويل الليد إلى موظف Sales: ${salesEmployee.name}`,
      },
    }),
    // أي Meeting مجدول بيتحول ملكيته لموظف الـ Sales الجديد
    prisma.meeting.updateMany({
      where: { leadId: params.id, status: "SCHEDULED" },
      data: { ownerId: salesEmployee.id },
    }),
    prisma.notification.create({
      data: {
        userId: salesEmployee.id,
        title: "عميل جديد محول إليك",
        message: `تم تحويل العميل ${lead.name} إليك من قبل ${session.user.name}. راجع مواعيد مقابلاتك.`,
        type: "LEAD_TRANSFER",
        link: "/sales",
      },
    }),
  ]);

  return NextResponse.json({ success: true, lead: updatedLead });
}
