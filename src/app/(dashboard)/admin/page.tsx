import { Role } from "@/lib/enums";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import DashboardShell from "@/components/DashboardShell";
import StatCard from "@/components/StatCard";
import LeadTable from "@/components/LeadTable";
import {
  StatusBarChart,
  TierPieChart,
  TeamPerformanceChart,
  LeadsOverTimeChart,
} from "@/components/ReportsCharts";
import StaleLeadsChecker from "@/components/StaleLeadsChecker";

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions);
  
  const since = new Date();
  since.setDate(since.getDate() - 13);
  since.setHours(0, 0, 0, 0);

  const [
    totalLeads, 
    hotGold, 
    meetingsToday, 
    transferred, 
    closedWon, 
    closedLost,
    statusGroups,
    tierGroups,
    team,
    recentLeads,
  ] = await Promise.all([
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
    prisma.lead.count({ where: { status: "CLOSED_LOST" } }),
    prisma.lead.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.lead.groupBy({ by: ["tier"], _count: { _all: true } }),
    prisma.user.findMany({
      where: { role: { in: [Role.TELE_SALES, Role.SALES] }, isActive: true },
      select: { id: true, name: true, role: true, _count: { select: { assignedLeads: true } } },
    }),
    prisma.lead.findMany({
      where: { createdAt: { gte: since } },
      select: { createdAt: true },
    }),
  ]);

  const teamWithActions = await Promise.all(
    team.map(async (emp) => {
      // Find all unique leads this employee has interacted with
      const distinctLeads = await prisma.activity.findMany({
        where: { userId: emp.id },
        distinct: ['leadId'],
        select: { leadId: true },
      });
      const actionCount = distinctLeads.length;

      return { ...emp, actionCount };
    })
  );

  const statusData = statusGroups
    .map((g) => ({ status: g.status, count: g._count._all }))
    .sort((a, b) => b.count - a.count);

  const tierData = tierGroups.map((g) => ({ tier: g.tier, count: g._count._all }));

  const teamData = team
    .map((t) => ({ name: t.name, role: t.role, count: t._count.assignedLeads }))
    .sort((a, b) => b.count - a.count);

  const dayBuckets: Record<string, number> = {};
  for (let i = 0; i < 14; i++) {
    const d = new Date(since);
    d.setDate(d.getDate() + i);
    dayBuckets[d.toLocaleDateString("ar-EG", { day: "2-digit", month: "2-digit" })] = 0;
  }
  recentLeads.forEach((l) => {
    const key = l.createdAt.toLocaleDateString("ar-EG", { day: "2-digit", month: "2-digit" });
    if (key in dayBuckets) dayBuckets[key] += 1;
  });
  const timeSeries = Object.entries(dayBuckets).map(([date, count]) => ({ date, count }));
  const conversionRate = totalLeads > 0 ? ((closedWon / totalLeads) * 100).toFixed(1) : "0";

  return (
    <DashboardShell title="لوحة تحكم الإدارة">
      <StaleLeadsChecker />
      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-6">
        <StatCard label="إجمالي الليدز" value={totalLeads} icon="📋" />
        <StatCard label="Hot / Cold" value={hotGold} icon="🔥" accent="text-status-hot" />
        <StatCard label="Meetings اليوم" value={meetingsToday} icon="📅" />
        <StatCard label="تم التحويل" value={transferred} icon="🤝" />
        <StatCard label="صفقات ناجحة" value={closedWon} icon="✅" accent="text-status-won" />
        <StatCard label="نسبة التحويل" value={`${conversionRate}%`} icon="📈" accent="text-accent-soft" />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="glass-panel p-5">
          <p className="mb-4 text-sm font-semibold text-white">توزيع الليدز حسب الحالة</p>
          <StatusBarChart data={statusData} />
        </div>
        <div className="glass-panel p-5">
          <p className="mb-4 text-sm font-semibold text-white">توزيع الليدز حسب التصنيف</p>
          <TierPieChart data={tierData} />
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="glass-panel p-5">
          <p className="mb-4 text-sm font-semibold text-white">أداء الفريق (عدد الليدز الحالية)</p>
          <TeamPerformanceChart data={teamData} />
        </div>
        <div className="glass-panel p-5">
          <p className="mb-4 text-sm font-semibold text-white">ليدز جديدة آخر 14 يوم</p>
          <LeadsOverTimeChart data={timeSeries} />
        </div>
      </div>

      <div className="mb-6 glass-panel p-5">
        <p className="mb-4 text-sm font-semibold text-white">تفاصيل أداء الفريق (متابعة الأكشن)</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {teamWithActions.map((emp) => (
            <div key={emp.name} className="rounded-xl bg-white/[0.03] p-4 border border-white/5 relative overflow-hidden group hover:border-white/10 transition">
              <div className="absolute top-0 right-0 h-full w-1 bg-accent/50"></div>
              <p className="text-sm text-slate-200 font-bold truncate pr-2">{emp.name}</p>
              <p className="text-[11px] text-slate-500 mb-4 pr-2">
                {emp.role === "TELE_SALES" ? "مبيعات هاتفية (Tele-Sales)" : (emp.role === "SALES" ? "مبيعات (Sales)" : emp.role)}
              </p>
              
              <div className="flex items-center justify-between mt-2 pt-3 border-t border-white/5">
                <div>
                  <p className="text-[10px] text-slate-500 font-medium">إجمالي الليدز</p>
                  <p className="text-xl font-bold text-white mt-0.5">{emp._count.assignedLeads}</p>
                </div>
                <div className="text-left">
                  <p className="text-[10px] text-emerald-500/80 font-medium">تم اتخاذ أكشن</p>
                  <p className="text-xl font-bold text-emerald-400 mt-0.5">{emp.actionCount}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
    </DashboardShell>
  );
}
