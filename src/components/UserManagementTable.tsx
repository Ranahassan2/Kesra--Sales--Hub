"use client";

import { Fragment, useState } from "react";
import { useRouter } from "next/navigation";

export interface UserRow {
  id: string;
  name: string;
  username: string;
  email: string;
  phone: string | null;
  role: string;
  isActive: boolean;
  createdAt: string;
  _count: { assignedLeads: number };
}

const ROLE_OPTIONS = [
  { value: "ADMIN", label: "مدير النظام" },
  { value: "HEAD_OF_SALES", label: "رئيس المبيعات" },
  { value: "TELE_SALES", label: "موظف Tele-Sales" },
  { value: "SALES", label: "موظف Sales" },
];

export default function UserManagementTable({
  users,
  currentUserId,
}: {
  users: UserRow[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newUser, setNewUser] = useState({
    name: "",
    username: "",
    email: "",
    phone: "",
    role: "TELE_SALES",
    password: "",
  });
  const [createError, setCreateError] = useState<string | null>(null);

  async function patchUser(id: string, body: any) {
    setBusy(true);
    try {
      const res = await fetch(`/api/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "حدث خطأ");
      router.refresh();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleCreate() {
    setBusy(true);
    setCreateError(null);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUser),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "حدث خطأ");
      setNewUser({ name: "", username: "", email: "", phone: "", role: "TELE_SALES", password: "" });
      setShowCreate(false);
      router.refresh();
    } catch (e: any) {
      setCreateError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="glass-panel p-5">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-white">إضافة موظف جديد</p>
          <button className="text-xs text-accent-soft" onClick={() => setShowCreate(!showCreate)}>
            {showCreate ? "إخفاء ▲" : "إضافة ▼"}
          </button>
        </div>
        {showCreate && (
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <input
              className="input-field text-xs"
              placeholder="الاسم"
              value={newUser.name}
              onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
            />
            <input
              className="input-field text-xs"
              placeholder="اسم المستخدم (username)"
              dir="ltr"
              value={newUser.username}
              onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
            />
            <input
              className="input-field text-xs"
              placeholder="الإيميل"
              dir="ltr"
              value={newUser.email}
              onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
            />
            <input
              className="input-field text-xs"
              placeholder="رقم الهاتف (اختياري)"
              dir="ltr"
              value={newUser.phone}
              onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
            />
            <select
              className="input-field text-xs"
              value={newUser.role}
              onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
            >
              {ROLE_OPTIONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
            <input
              type="password"
              className="input-field text-xs"
              placeholder="كلمة المرور المبدئية"
              value={newUser.password}
              onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
            />
            <div className="sm:col-span-3">
              {createError && <p className="mb-2 text-xs text-status-hot">{createError}</p>}
              <button
                disabled={busy || !newUser.name || !newUser.username || !newUser.email || !newUser.password}
                onClick={handleCreate}
                className="btn-primary text-xs"
              >
                إنشاء الحساب
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="glass-panel overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-white/5 text-xs text-slate-400">
            <tr>
              <th className="px-4 py-3 text-right font-medium">الاسم</th>
              <th className="px-4 py-3 text-right font-medium">اسم المستخدم</th>
              <th className="px-4 py-3 text-right font-medium">الدور</th>
              <th className="px-4 py-3 text-right font-medium">الليدز الحالية</th>
              <th className="px-4 py-3 text-right font-medium">الحالة</th>
              <th className="px-4 py-3 text-right font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <Fragment key={u.id}>
                <tr className="border-b border-white/[0.03]">
                  <td className="px-4 py-3">
                    <p className="font-medium text-white">{u.name}</p>
                    <p className="text-xs text-slate-500" dir="ltr">
                      {u.email}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-slate-300" dir="ltr">
                    {u.username}
                  </td>
                  <td className="px-4 py-3 text-slate-300">
                    {ROLE_OPTIONS.find((r) => r.value === u.role)?.label ?? u.role}
                  </td>
                  <td className="px-4 py-3 text-slate-300">{u._count.assignedLeads}</td>
                  <td className="px-4 py-3">
                    <span className={u.isActive ? "badge-won badge" : "badge-lost badge"}>
                      {u.isActive ? "نشط" : "معطّل"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-left text-xs text-accent-soft">
                    <button onClick={() => setOpenId(openId === u.id ? null : u.id)}>
                      {openId === u.id ? "إغلاق ▲" : "إدارة ▼"}
                    </button>
                  </td>
                </tr>
                {openId === u.id && (
                  <tr className="border-b border-white/[0.03] bg-white/[0.02]">
                    <td colSpan={6} className="px-4 py-4">
                      <UserActions
                        user={u}
                        busy={busy}
                        isSelf={u.id === currentUserId}
                        onUpdate={(body) => patchUser(u.id, body)}
                      />
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function UserActions({
  user,
  busy,
  isSelf,
  onUpdate,
}: {
  user: UserRow;
  busy: boolean;
  isSelf: boolean;
  onUpdate: (body: any) => void;
}) {
  const [role, setRole] = useState(user.role);
  const [newPassword, setNewPassword] = useState("");

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <div className="space-y-2">
        <p className="text-xs font-semibold text-slate-400">تغيير الدور</p>
        <select
          className="input-field text-xs"
          value={role}
          disabled={isSelf}
          onChange={(e) => setRole(e.target.value)}
        >
          {ROLE_OPTIONS.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
        <button
          disabled={busy || role === user.role || isSelf}
          onClick={() => onUpdate({ role })}
          className="btn-ghost w-full text-xs"
        >
          حفظ الدور
        </button>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-semibold text-slate-400">إعادة تعيين كلمة المرور</p>
        <input
          type="password"
          placeholder="كلمة مرور جديدة"
          className="input-field text-xs"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />
        <button
          disabled={busy || newPassword.length < 6}
          onClick={() => {
            onUpdate({ newPassword });
            setNewPassword("");
          }}
          className="btn-ghost w-full text-xs"
        >
          حفظ كلمة المرور
        </button>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-semibold text-slate-400">الحالة</p>
        <p className="text-xs text-slate-500">
          {isSelf ? "متقدرش تعطّل حسابك بنفسك" : "تعطيل الحساب يمنعه من الدخول للنظام"}
        </p>
        <button
          disabled={busy || isSelf}
          onClick={() => onUpdate({ isActive: !user.isActive })}
          className={`w-full text-xs ${user.isActive ? "btn-ghost text-status-hot" : "btn-primary"}`}
        >
          {user.isActive ? "تعطيل الحساب" : "تفعيل الحساب"}
        </button>
      </div>
    </div>
  );
}
