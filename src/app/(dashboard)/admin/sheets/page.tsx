import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";
import { redirect } from "next/navigation";
import DashboardShell from "@/components/DashboardShell";
import SheetsClient from "./SheetsClient";

const prisma = new PrismaClient();

export default async function AdminSheetsPage() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "HEAD_OF_SALES")) {
    redirect("/");
  }

  const batches = await prisma.uploadBatch.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      uploadedBy: { select: { name: true } },
      _count: { select: { leads: true } },
    },
  });

  return (
    <DashboardShell title="إدارة الشيتات">
      <SheetsClient initialBatches={batches} />
    </DashboardShell>
  );
}
