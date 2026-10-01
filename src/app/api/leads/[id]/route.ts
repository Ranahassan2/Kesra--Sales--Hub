import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { can, isManagementRole } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  phone: z.string().min(1).optional(),
  email: z.string().email().optional().or(z.literal("")),
  company: z.string().optional().or(z.literal("")),
  need: z.string().optional().or(z.literal("")),
  interestReason: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
  salesNotes: z.string().optional().or(z.literal("")),
  storeUrl: z.string().url().optional().or(z.literal("")),
  socialMediaUrl: z.string().url().optional().or(z.literal("")),
});

// PATCH /api/leads/[id] — تعديل بيانات العميل الأساسية (مش الحالة/التصنيف، دي في /status)
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || !can(session.user.role, "EDIT_LEAD_DETAILS")) {
    return NextResponse.json({ error: "غير مصرح لك بهذا الإجراء" }, { status: 403 });
  }

  const lead = await prisma.lead.findUnique({ where: { id: params.id } });
  if (!lead) return NextResponse.json({ error: "الليد غير موجود" }, { status: 404 });

  if (!isManagementRole(session.user.role) && lead.assignedToId !== session.user.id) {
    return NextResponse.json({ error: "هذا الليد غير مسند لك" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }

  if (parsed.data.phone && parsed.data.phone !== lead.phone) {
    const duplicate = await prisma.lead.findFirst({
      where: { phone: parsed.data.phone, id: { not: params.id } },
    });
    if (duplicate) {
      return NextResponse.json(
        { error: "يوجد عميل آخر بنفس رقم الهاتف بالفعل" },
        { status: 409 }
      );
    }
  }

  const updated = await prisma.lead.update({
    where: { id: params.id },
    data: {
      ...(parsed.data.name !== undefined && { name: parsed.data.name }),
      ...(parsed.data.phone !== undefined && { phone: parsed.data.phone }),
      ...(parsed.data.email !== undefined && { email: parsed.data.email || null }),
      ...(parsed.data.company !== undefined && { company: parsed.data.company || null }),
      ...(parsed.data.need !== undefined && { need: parsed.data.need || null }),
      ...(parsed.data.interestReason !== undefined && {
        interestReason: parsed.data.interestReason || null,
      }),
      ...(parsed.data.notes !== undefined && { notes: parsed.data.notes || null }),
      ...(parsed.data.salesNotes !== undefined && { salesNotes: parsed.data.salesNotes || null }),
      ...(parsed.data.storeUrl !== undefined && { storeUrl: parsed.data.storeUrl || null }),
      ...(parsed.data.socialMediaUrl !== undefined && { socialMediaUrl: parsed.data.socialMediaUrl || null }),
      activities: {
        create: {
          userId: session.user.id,
          type: "NOTE",
          message: "تم تعديل بيانات العميل",
        },
      },
    },
  });

  return NextResponse.json({ success: true, lead: updated });
}

// DELETE /api/leads/[id] — حذف نهائي (Admin فقط) — بيحذف معاه الـ follow-ups والـ meetings والـ activities
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || !can(session.user.role, "DELETE_LEAD")) {
    return NextResponse.json({ error: "غير مصرح لك بهذا الإجراء" }, { status: 403 });
  }

  const lead = await prisma.lead.findUnique({ where: { id: params.id } });
  if (!lead) return NextResponse.json({ error: "الليد غير موجود" }, { status: 404 });

  await prisma.lead.delete({ where: { id: params.id } });

  return NextResponse.json({ success: true });
}
