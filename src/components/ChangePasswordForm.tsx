"use client";

import { useState } from "react";

export default function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ text: string; error?: boolean } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setMessage({ text: "كلمة المرور الجديدة وتأكيدها مش متطابقين", error: true });
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/account/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "حدث خطأ");
      setMessage({ text: "تم تغيير كلمة المرور بنجاح" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (e: any) {
      setMessage({ text: e.message, error: true });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="glass-panel max-w-md space-y-4 p-6">
      <p className="text-sm font-semibold text-white">تغيير كلمة المرور</p>
      <div>
        <label className="mb-1.5 block text-xs font-medium text-slate-400">كلمة المرور الحالية</label>
        <input
          type="password"
          required
          className="input-field"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
        />
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-medium text-slate-400">كلمة المرور الجديدة</label>
        <input
          type="password"
          required
          minLength={6}
          className="input-field"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-medium text-slate-400">تأكيد كلمة المرور الجديدة</label>
        <input
          type="password"
          required
          minLength={6}
          className="input-field"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
      </div>
      {message && (
        <p className={`text-sm ${message.error ? "text-status-hot" : "text-status-won"}`}>
          {message.text}
        </p>
      )}
      <button type="submit" disabled={busy} className="btn-primary w-full">
        {busy ? "جاري الحفظ..." : "حفظ كلمة المرور الجديدة"}
      </button>
    </form>
  );
}
