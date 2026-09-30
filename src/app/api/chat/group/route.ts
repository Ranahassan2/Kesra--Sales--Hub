import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, memberIds } = body;

    if (!name || !memberIds || !Array.isArray(memberIds) || memberIds.length === 0) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // Ensure the creator is also in the group
    const allMembers = Array.from(new Set([...memberIds, session.user.id]));

    const group = await prisma.chatGroup.create({
      data: {
        name: name.trim(),
        createdById: session.user.id,
        members: {
          create: allMembers.map((id) => ({ userId: id })),
        },
      },
      include: {
        members: { include: { user: { select: { id: true, name: true, role: true } } } },
      },
    });

    return NextResponse.json({ group }, { status: 201 });
  } catch (error) {
    console.error("Group POST error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
