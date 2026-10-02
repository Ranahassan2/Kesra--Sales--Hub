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
    const { leads, fileName, tier } = await req.json();
    
    if (!leads || !Array.isArray(leads)) {
      return NextResponse.json({ error: "Invalid data format" }, { status: 400 });
    }

    const incomingPhones = leads.map((l: any) => String(l.phone));
    
    const existingLeads = await prisma.lead.findMany({
      where: { phone: { in: incomingPhones } },
      select: { phone: true, name: true }
    });

    const existingPhonesSet = new Set(existingLeads.map(l => l.phone));
    const newLeads = leads.filter((l: any) => !existingPhonesSet.has(String(l.phone)));

    // 1. Create an UploadBatch first to get its ID
    const batch = await prisma.uploadBatch.create({
      data: {
        fileName: fileName || "Untitled Sheet",
        totalLeads: newLeads.length,
        uploadedById: session.user.id,
      },
    });

    // 2. Associate all leads with this batch
    const dataToInsert = newLeads.map((l: any) => ({
      name: l.name,
      phone: String(l.phone),
      email: l.email || null,
      company: l.company || null,
      need: l.need || null,
      storeUrl: l.storeUrl || null,
      socialMediaUrl: l.socialMediaUrl || null,
      createdById: session.user.id,
      status: "NEW",
      tier: tier || "WARM", // Use the tier chosen in the preview step
      uploadBatchId: batch.id,
    }));

    if (dataToInsert.length > 0) {
      await prisma.lead.createMany({
        data: dataToInsert,
      });
    }

    return NextResponse.json({ 
      success: true, 
      count: dataToInsert.length, 
      batchId: batch.id,
      duplicates: existingLeads
    });
  } catch (error: any) {
    console.error("Bulk upload error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
