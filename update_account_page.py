import re

with open('src/app/(dashboard)/account/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

import_old = '''import ChangePasswordForm from "@/components/ChangePasswordForm";'''
import_new = '''import ChangePasswordForm from "@/components/ChangePasswordForm";
import EditProfileForm from "@/components/EditProfileForm";
import { prisma } from "@/lib/prisma";'''
content = content.replace(import_old, import_new)

component_old = '''export default async function AccountPage() {
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
}'''

component_new = '''export default async function AccountPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true, phone: true, role: true }
  });
  
  if (!user) redirect("/login");

  return (
    <DashboardShell title="حسابي">
      <div className="mb-6 max-w-md">
        <div className="flex items-center gap-4 mb-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-700 text-white font-bold text-2xl shadow-inner border-2 border-white/10">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">{user.name}</h2>
            <p className="text-sm text-slate-400">{ROLE_LABELS[user.role] ?? user.role}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        <EditProfileForm user={user} />
        <ChangePasswordForm />
      </div>
    </DashboardShell>
  );
}'''
content = content.replace(component_old, component_new)

with open('src/app/(dashboard)/account/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
