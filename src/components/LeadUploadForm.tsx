"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LeadUploadForm() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [showManual, setShowManual] = useState(false);
  const [manual, setManual] = useState({ name: "", phone: "", company: "", need: "" });

  async function handleUpload() {
    if (!file) return;
    setBusy(true);
    setResult(null);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/leads/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "فشل الرفع");
      const dupCount = data.duplicatePhones?.length ?? 0;
      const invalidCount = data.invalidRows?.length ?? 0;
      const notes = [
        invalidCount ? `${invalidCount} صف ببيانات غير صالحة` : null,
        dupCount ? `${dupCount} رقم مكرر (موجود بالفعل)` : null,
      ]
        .filter(Boolean)
        .join(" و ");
      setResult(
        `تم رفع وتوزيع ${data.totalUploaded} ليد على ${data.distributedAcross} موظف بنجاح${
          notes ? ` — تم تجاهل: ${notes}` : ""
        }`
      );
      router.refresh();
    } catch (e: any) {
      setResult(`خطأ: ${e.message}`);
    } finally {
      setBusy(false);
      setFile(null);
    }
  }

  async function handleManualAdd() {
    setBusy(true);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(manual),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "فشلت الإضافة");
      setResult("تم إضافة الليد وتوزيعه بنجاح");
      setManual({ name: "", phone: "", company: "", need: "" });
      router.refresh();
    } catch (e: any) {
      setResult(`خطأ: ${e.message}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="glass-panel p-5 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-white">رفع / إضافة ليدز</p>
        <button className="text-xs text-accent-soft" onClick={() => setShowManual(!showManual)}>
          {showManual ? "رفع ملف بدلاً من ذلك" : "إضافة يدوية بدلاً من ذلك"}
        </button>
      </div>

      {!showManual ? (
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="file"
            accept=".csv"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="text-xs text-slate-400 file:btn-ghost file:mr-3 file:border-0 file:text-xs"
          />
          <button disabled={!file || busy} onClick={handleUpload} className="btn-primary text-xs">
            {busy ? "جاري الرفع والتوزيع..." : "رفع وتوزيع الليدز"}
          </button>
          <span className="text-xs text-slate-500">
            أعمدة الملف المتوقعة: name, phone, email, company, need
          </span>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
          <input
            className="input-field text-xs"
            placeholder="اسم العميل"
            value={manual.name}
            onChange={(e) => setManual({ ...manual, name: e.target.value })}
          />
          <input
            className="input-field text-xs"
            placeholder="رقم الهاتف"
            value={manual.phone}
            onChange={(e) => setManual({ ...manual, phone: e.target.value })}
          />
          <input
            className="input-field text-xs"
            placeholder="الشركة (اختياري)"
            value={manual.company}
            onChange={(e) => setManual({ ...manual, company: e.target.value })}
          />
          <button
            disabled={!manual.name || !manual.phone || busy}
            onClick={handleManualAdd}
            className="btn-primary text-xs"
          >
            إضافة
          </button>
        </div>
      )}

      {result && <p className="text-xs text-accent-soft">{result}</p>}
    </div>
  );
}
