import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import DashboardShell from "@/components/DashboardShell";
import StatCard from "@/components/StatCard";
import LeadTable from "@/components/LeadTable";

export default async function SalesDashboard() {
  const session = await getServerSession(authOptions);
  const userId = session!.user.id;

  const [myLeads, meetingsToday, upcomingMeetings, needsFollowUp] = await Promise.all([
    prisma.lead.findMany({
      where: { assignedToId: userId },
      include: {
        assignedTo: { select: { id: true, name: true, role: true } },
        followUps: { where: { isCompleted: false }, orderBy: { scheduledDate: "asc" } },
        meetings: { orderBy: { scheduledAt: "desc" }, take: 1 },
        activities: { orderBy: { createdAt: "desc" }, take: 8, include: { user: { select: { name: true } } } },
      },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.meeting.count({
      where: {
        ownerId: userId,
        status: "SCHEDULED",
        scheduledAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
          lt: new Date(new Date().setHours(23, 59, 59, 999)),
        },
      },
    }),
    prisma.meeting.count({
      where: { ownerId: userId, status: "SCHEDULED", scheduledAt: { gt: new Date() } },
    }),
    prisma.lead.count({ where: { assignedToId: userId, status: "NEEDS_FOLLOWUP" } }),
  ]);

  return (
    <DashboardShell title="لوحة Sales">
      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="عملاء محولين لي" value={myLeads.length} icon="🤝" />
        <StatCard label="Meetings اليوم" value={meetingsToday} icon="📅" accent="text-status-new" />
        <StatCard label="Meetings قادمة" value={upcomingMeetings} icon="🗓️" />
        <StatCard label="يحتاجون متابعة" value={needsFollowUp} icon="⏰" accent="text-status-gold" />
      </div>

      <p className="mb-3 text-sm font-semibold text-white">عملائي المحوّلين</p>
      <LeadTable leads={myLeads as any} />
    </DashboardShell>
  );
}
