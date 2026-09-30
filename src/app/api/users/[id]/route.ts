import { Role } from "@/lib/enums";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

import bcrypt from "bcryptjs";

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional().or(z.literal("")),
  role: z.nativeEnum(Role).optional(),
  isActive: z.boolean().optional(),
  newPassword: z.string().min(6).optional(),
});

// PATCH /api/users/[id] — تعديل بيانات مستخدم / تعطيله / تغيير دوره / إعادة تعيين كلمة مروره
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "غير مصرح لك بهذا الإجراء" }, { status: 403 });
  }
  
  const isSelf = session.user.id === params.id;
  if (!isSelf && !can(session.user.role, "MANAGE_USERS")) {
    return NextResponse.json({ error: "غير مصرح لك بتعديل بيانات غيرك" }, { status: 403 });
  }

  const user = await prisma.user.findUnique({ where: { id: params.id } });
  if (!user) return NextResponse.json({ error: "المستخدم غير موجود" }, { status: 404 });

  if (isSelf) {
    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
    }
    
    // Prevent self role/status change unless ADMIN doing it to themselves safely
    if (parsed.data.isActive === false) {
      return NextResponse.json({ error: "لا يمكنك تعطيل حسابك بنفسك" }, { status: 400 });
    }
    if (parsed.data.role && parsed.data.role !== user.role && session.user.role !== Role.ADMIN) {
      return NextResponse.json({ error: "لا يمكنك تغيير دورك الوظيفي" }, { status: 400 });
    }
    
    return applyUpdate(user.id, parsed.data);
  }

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }

  return applyUpdate(user.id, parsed.data);
}

async function applyUpdate(userId: string, data: z.infer<typeof updateSchema>) {
  const updateData: any = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.email !== undefined) updateData.email = data.email;
  if (data.phone !== undefined) updateData.phone = data.phone || null;
  if (data.role !== undefined) updateData.role = data.role;
  if (data.isActive !== undefined) updateData.isActive = data.isActive;
  if (data.newPassword) updateData.passwordHash = await bcrypt.hash(data.newPassword, 10);

  try {
    const updated = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
      },
    });

    return NextResponse.json({ success: true, user: updated });
  } catch (e: any) {
    if (e?.code === "P2002") {
      return NextResponse.json({ error: "الإيميل ده مستخدم بالفعل" }, { status: 409 });
    }
    throw e;
  }
}
