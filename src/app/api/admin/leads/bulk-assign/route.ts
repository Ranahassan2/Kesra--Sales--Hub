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
    const { leadIds, employeeId } = await req.json();
    
    if (!leadIds || !Array.isArray(leadIds) || !employeeId) {
      return NextResponse.json({ error: "Invalid data format" }, { status: 400 });
    }

    if (employeeId === "AUTO") {
      const teleSalesEmployees = await prisma.user.findMany({
        where: { role: "TELE_SALES" }
      });
      if (teleSalesEmployees.length === 0) {
        return NextResponse.json({ error: "لا يوجد موظفين تيلي سيلز لتوزيع العملاء عليهم" }, { status: 400 });
      }

      // Distribute leads evenly using round-robin logic
      const updates = teleSalesEmployees.map((emp, index) => {
        // Get leads for this specific employee
        const assignedLeadIds = leadIds.filter((_, i) => i % teleSalesEmployees.length === index);
        if (assignedLeadIds.length === 0) return null;
        
        return prisma.lead.updateMany({
          where: { id: { in: assignedLeadIds } },
          data: { assignedToId: emp.id }
        });
      }).filter(Boolean); // Remove nulls

      await prisma.$transaction(updates as any);
      return NextResponse.json({ success: true, auto: true });
    }

    // Check if employee exists
    const employee = await prisma.user.findUnique({
      where: { id: employeeId },
    });

    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    // If assigned to SALES, we might want to change status to TRANSFERRED_TO_SALES
    const updateData: any = {
      assignedToId: employeeId,
    };

    if (employee.role === "SALES") {
      updateData.status = "TRANSFERRED_TO_SALES";
    }

    await prisma.lead.updateMany({
      where: {
        id: { in: leadIds },
      },
      data: updateData,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Bulk assign error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
