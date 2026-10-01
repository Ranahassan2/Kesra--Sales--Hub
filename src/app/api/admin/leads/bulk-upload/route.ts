import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "HEAD_OF_SALES")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const { leads } = await req.json();
    
    if (!leads || !Array.isArray(leads)) {
      return NextResponse.json({ error: "Invalid data format" }, { status: 400 });
    }

    const dataToInsert = leads.map((l: any) => ({
      name: l.name,
      phone: String(l.phone),
      company: l.company || null,
      need: l.need || null,
      createdById: session.user.id,
      status: "NEW",
      tier: "WARM",
    }));

    await prisma.lead.createMany({
      data: dataToInsert,
    });

    return NextResponse.json({ success: true, count: dataToInsert.length });
  } catch (error: any) {
    console.error("Bulk upload error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
