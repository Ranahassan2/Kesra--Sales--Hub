import { Role } from "@/lib/enums";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import DashboardShell from "@/components/DashboardShell";
import StatCard from "@/components/StatCard";
import LeadTable from "@/components/LeadTable";
import LeadUploadForm from "@/components/LeadUploadForm";


export default async function AdminDashboard() {
  const session = await getServerSession(authOptions);
  const [totalLeads, hotGold, meetingsToday, transferred, closedWon, leads, teamPerformance] =
    await Promise.all([
      prisma.lead.count(),
      prisma.lead.count({ where: { tier: { in: ["HOT", "COLD"] } } }),
      prisma.meeting.count({
        where: {
          scheduledAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
            lt: new Date(new Date().setHours(23, 59, 59, 999)),
          },
        },
      }),
      prisma.lead.count({ where: { status: "TRANSFERRED_TO_SALES" } }),
      prisma.lead.count({ where: { status: "CLOSED_WON" } }),
      prisma.lead.findMany({
        include: {
          assignedTo: { select: { id: true, name: true, role: true } },
          followUps: { where: { isCompleted: false }, orderBy: { scheduledDate: "asc" } },
          meetings: { orderBy: { scheduledAt: "desc" }, take: 1 },
          activities: { orderBy: { createdAt: "desc" }, take: 8, include: { user: { select: { name: true } } } },
        },
        orderBy: { updatedAt: "desc" },
        take: 200,
      }),
      prisma.user.findMany({
        where: { role: { in: [Role.TELE_SALES, Role.SALES] }, isActive: true },
        select: {
          id: true,
          name: true,
          role: true,
          _count: { select: { assignedLeads: true } },
        },
      }),
    ]);

  const salesTeam = await prisma.user.findMany({
    where: { role: Role.SALES, isActive: true },
    select: { id: true, name: true, lastActiveAt: true },
  });

  return (
    <DashboardShell title="لوحة تحكم الإدارة">
      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-5">
        <StatCard label="إجمالي الليدز" value={totalLeads} icon="📋" />
        <StatCard label="Hot / Cold" value={hotGold} icon="🔥" accent="text-status-hot" />
        <StatCard label="Meetings اليوم" value={meetingsToday} icon="📅" />
        <StatCard label="تم التحويل لـ Sales" value={transferred} icon="🤝" />
        <StatCard label="صفقات مغلقة" value={closedWon} icon="✅" accent="text-status-won" />
      </div>

      <div className="mb-6">
        <LeadUploadForm />
      </div>

      <div className="mb-6 glass-panel p-5">
        <p className="mb-4 text-sm font-semibold text-white">أداء الفريق</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {teamPerformance.map((emp) => (
            <div key={emp.id} className="rounded-xl bg-white/[0.03] p-3">
              <p className="text-xs text-slate-400">{emp.name}</p>
              <p className="text-xs text-slate-500">
                {emp.role === "TELE_SALES" ? "Tele-Sales" : "Sales"}
              </p>
              <p className="mt-1 text-lg font-bold text-white">{emp._count.assignedLeads}</p>
              <p className="text-xs text-slate-500">ليد حاليًا</p>
            </div>
          ))}
        </div>
      </div>

      <p className="mb-3 text-sm font-semibold text-white">
        كل الليدز في النظام {totalLeads > 200 && `(أحدث 200 من ${totalLeads} — استخدم البحث للوصول لباقي الليدز)`}
      </p>
      <LeadTable
        leads={leads as any}
        showAssignee
        allowTransfer
        canDelete={session?.user.role === "ADMIN"}
        salesTeam={salesTeam}
      />
    </DashboardShell>
  );
}
