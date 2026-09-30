import { ActivityType } from "@/lib/enums";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import DashboardShell from "@/components/DashboardShell";


const TYPE_LABELS: Record<string, string> = {
  STATUS_CHANGE: "تغيير حالة",
  FOLLOWUP_CREATED: "إضافة متابعة",
  FOLLOWUP_COMPLETED: "إنجاز متابعة",
  MEETING_SCHEDULED: "تحديد Meeting",
  MEETING_UPDATED: "تحديث نتيجة Meeting",
  TRANSFERRED: "تحويل لـ Sales",
  NOTE: "تعديل بيانات",
  LEAD_CREATED: "إنشاء ليد",
  LEAD_ASSIGNED: "توزيع ليد",
};

function formatDateTime(date: Date) {
  return date.toLocaleString("ar-EG", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function ActivityLogPage({
  searchParams,
}: {
  searchParams: { type?: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (!can(session.user.role, "VIEW_FULL_ACTIVITY_LOG")) redirect("/unauthorized");

  const type = searchParams.type;
  const where: any = {};
  if (type && Object.keys(TYPE_LABELS).includes(type)) where.type = type;

  const activities = await prisma.activity.findMany({
    where,
    take: 150,
    orderBy: { createdAt: "desc" },
    include: {
      lead: { select: { id: true, name: true, phone: true } },
      user: { select: { id: true, name: true, role: true } },
    },
  });

  return (
    <DashboardShell title="سجل النشاط">
      <div className="mb-4 flex flex-wrap gap-2">
        <a
          href="/admin/activity"
          className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
            !type ? "bg-accent/20 text-accent-soft" : "bg-white/[0.03] text-slate-400"
          }`}
        >
          الكل
        </a>
        {Object.entries(TYPE_LABELS).map(([value, label]) => (
          <a
            key={value}
            href={`/admin/activity?type=${value}`}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
              type === value ? "bg-accent/20 text-accent-soft" : "bg-white/[0.03] text-slate-400"
            }`}
          >
            {label}
          </a>
        ))}
      </div>

      <div className="glass-panel overflow-hidden">
        {activities.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-500">لا يوجد نشاط مسجّل</div>
        ) : (
          <ul className="divide-y divide-white/[0.03]">
            {activities.map((a) => (
              <li key={a.id} className="flex items-start justify-between gap-4 px-4 py-3 text-sm">
                <div>
                  <p className="text-slate-200">{a.message}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    <span className="text-slate-400">{a.lead.name}</span>
                    <span dir="ltr"> ({a.lead.phone})</span>
                    <span className="mx-1.5">·</span>
                    بواسطة {a.user.name}
                    <span className="mx-1.5">·</span>
                    {TYPE_LABELS[a.type] ?? a.type}
                  </p>
                </div>
                <span className="whitespace-nowrap text-xs text-slate-500">
                  {formatDateTime(a.createdAt)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </DashboardShell>
  );
}
