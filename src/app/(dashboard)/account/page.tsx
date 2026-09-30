import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import DashboardShell from "@/components/DashboardShell";
import ChangePasswordForm from "@/components/ChangePasswordForm";

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "مدير النظام",
  HEAD_OF_SALES: "رئيس المبيعات",
  TELE_SALES: "موظف Tele-Sales",
  SALES: "موظف Sales",
};

export default async function AccountPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  return (
    <DashboardShell title="حسابي">
      <div className="mb-6 glass-panel max-w-md p-6">
        <p className="mb-3 text-sm font-semibold text-white">بيانات الحساب</p>
        <div className="space-y-1.5 text-sm">
          <p className="text-slate-400">
            الاسم: <span className="text-slate-200">{session.user.name}</span>
          </p>
          <p className="text-slate-400">
            الإيميل: <span className="text-slate-200" dir="ltr">{session.user.email}</span>
          </p>
          <p className="text-slate-400">
            الدور: <span className="text-slate-200">{ROLE_LABELS[session.user.role] ?? session.user.role}</span>
          </p>
        </div>
      </div>

      <ChangePasswordForm />
    </DashboardShell>
  );
}
