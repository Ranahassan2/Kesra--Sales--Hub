import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { can, isManagementRole } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createSchema = z.object({
  scheduledAt: z.string().datetime(),
  notes: z.string().optional(),
});

const updateSchema = z.object({
  meetingId: z.string(),
  status: z.enum(["SCHEDULED", "DONE", "POSTPONED", "CANCELLED"]).optional(),
  result: z.string().optional(),
  notes: z.string().optional(),
});

// POST — Tele-Sales بيحدد موعد Meeting بعد اهتمام العميل
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || !can(session.user.role, "SCHEDULE_MEETING")) {
    return NextResponse.json({ error: "غير مصرح لك بهذا الإجراء" }, { status: 403 });
  }

  const lead = await prisma.lead.findUnique({ where: { id: params.id } });
  if (!lead) return NextResponse.json({ error: "الليد غير موجود" }, { status: 404 });

  if (!isManagementRole(session.user.role) && lead.assignedToId !== session.user.id) {
    return NextResponse.json({ error: "هذا الليد غير مسند لك" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }

  const meeting = await prisma.meeting.create({
    data: {
      leadId: params.id,
      ownerId: lead.assignedToId ?? session.user.id,
      scheduledAt: new Date(parsed.data.scheduledAt),
      notes: parsed.data.notes,
    },
  });

  await prisma.$transaction([
    prisma.lead.update({
      where: { id: params.id },
      data: { status: "MEETING_SCHEDULED" },
    }),
    prisma.activity.create({
      data: {
        leadId: params.id,
        userId: session.user.id,
        type: "MEETING_SCHEDULED",
        message: `تم تحديد Meeting بتاريخ ${parsed.data.scheduledAt}`,
      },
    }),
  ]);

  return NextResponse.json({ success: true, meeting });
}

// PATCH — Sales بيسجل نتيجة الـ Meeting بعد ما بتتم
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || !can(session.user.role, "RECORD_MEETING_RESULT")) {
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

  const meeting = await prisma.meeting.update({
    where: { id: parsed.data.meetingId },
    data: {
      ...(parsed.data.status && { status: parsed.data.status }),
      ...(parsed.data.result && { result: parsed.data.result }),
      ...(parsed.data.notes && { notes: parsed.data.notes }),
    },
  });

  await prisma.activity.create({
    data: {
      leadId: params.id,
      userId: session.user.id,
      type: "MEETING_UPDATED",
      message: `تم تحديث نتيجة الـ Meeting: ${parsed.data.result ?? parsed.data.status ?? ""}`,
    },
  });

  return NextResponse.json({ success: true, meeting });
}
