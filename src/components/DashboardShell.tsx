import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import SignOutButton from "@/components/SignOutButton";
import DashboardNav from "@/components/DashboardNav";
import NotificationBell from "@/components/NotificationBell";
import OnlineUsers from "@/components/OnlineUsers";
import ChatBox from "@/components/ChatBox";

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "مدير النظام",
  HEAD_OF_SALES: "رئيس المبيعات",
  TELE_SALES: "موظف Tele-Sales",
  SALES: "موظف Sales",
};

export default async function DashboardShell({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) {
  const session = await getServerSession(authOptions);
  const role = session?.user.role ?? "";

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0b101a]/90 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-[96%] items-center justify-between px-6 pt-3 pb-1">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4 border-l border-white/10 pl-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-700 text-white font-bold text-xl shadow-inner">
                {session?.user.name?.charAt(0).toUpperCase()}
              </div>
              <div className="text-right hidden sm:block">
                <p className="text-base font-bold text-white">{session?.user.name}</p>
                <p className="text-sm text-slate-400 mt-1">{ROLE_LABELS[role] ?? role}</p>
              </div>
            </div>

            <div className="hidden sm:flex items-center">
              <ChatBox />
              <OnlineUsers currentUserRole={role} />
              <NotificationBell />
            </div>
          </div>

          <div className="flex items-center gap-5">
            <SignOutButton />
            <div className="text-right border-l border-white/10 pl-5">
              <p className="text-xl font-extrabold text-white leading-tight tracking-wide">TeleSales CRM</p>
              <p className="text-sm text-slate-400 font-medium mt-1">{title.replace("لوحة ", "")}</p>
            </div>
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
              </svg>
            </div>
          </div>
        </div>
        <div className="mx-auto w-full max-w-[96%] px-6 pb-2">
          <DashboardNav role={role} />
        </div>
      </header>
      <main className="mx-auto w-full max-w-[96%] px-6 py-8 flex-1 min-w-0">{children}</main>
    </div>
  );
}
