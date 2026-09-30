import { Role } from "@/lib/enums";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

import bcrypt from "bcryptjs";

// GET /api/users — كل المستخدمين (Admin فقط)
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !can(session.user.role, "MANAGE_USERS")) {
    return NextResponse.json({ error: "غير مصرح لك بهذا الإجراء" }, { status: 403 });
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      username: true,
      email: true,
      phone: true,
      role: true,
      isActive: true,
      createdAt: true,
      _count: { select: { assignedLeads: true } },
    },
  });

  return NextResponse.json(users);
}

const createUserSchema = z.object({
  name: z.string().min(1, "الاسم مطلوب"),
  username: z
    .string()
    .min(3, "اسم المستخدم لازم يكون 3 حروف على الأقل")
    .regex(/^[a-zA-Z0-9._-]+$/, "اسم المستخدم يقبل حروف إنجليزي وأرقام فقط"),
  email: z.string().email("إيميل غير صحيح"),
  phone: z.string().optional(),
  role: z.nativeEnum(Role),
  password: z.string().min(6, "كلمة المرور لازم تكون 6 حروف على الأقل"),
});

// POST /api/users — إنشاء مستخدم جديد (Admin فقط)
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !can(session.user.role, "MANAGE_USERS")) {
    return NextResponse.json({ error: "غير مصرح لك بهذا الإجراء" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = createUserSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }

  const existing = await prisma.user.findFirst({
    where: { OR: [{ username: parsed.data.username }, { email: parsed.data.email }] },
  });
  if (existing) {
    return NextResponse.json(
      { error: "اسم المستخدم أو الإيميل ده مستخدم بالفعل" },
      { status: 409 }
    );
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);

  const user = await prisma.user.create({
    data: {
      name: parsed.data.name,
      username: parsed.data.username,
      email: parsed.data.email,
      phone: parsed.data.phone || null,
      role: parsed.data.role,
      passwordHash,
    },
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

  return NextResponse.json({ success: true, user });
}
