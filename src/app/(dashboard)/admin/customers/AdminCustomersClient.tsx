"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";
import StatusBadge from "@/components/StatusBadge";
import TierBadge from "@/components/TierBadge";
import LeadTable from "@/components/LeadTable";

type Employee = { id: string; name: string; role: string; lastActiveAt?: Date | null };
type Lead = {
  id: string;
  name: string;
  phone: string;
  company?: string | null;
  need?: string | null;
  status: string;
  tier: string;
  assignedTo?: Employee | null;
  createdAt: string;
};

export default function AdminCustomersClient({
  initialLeads,
  employees,
  salesTeam,
  canDelete,
}: {
  initialLeads: Lead[];
  employees: Employee[];
  salesTeam: Employee[];
  canDelete: boolean;
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"table" | "cards">("table");
  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());
  const [assignTarget, setAssignTarget] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  
  const [search, setSearch] = useState("");
  const [filterEmployee, setFilterEmployee] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Parse Excel
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const data = evt.target?.result;
        const workbook = XLSX.read(data, { type: "binary" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        
        // Convert to JSON
        const rawJson: any[] = XLSX.utils.sheet_to_json(sheet);
        
        // Map to expected fields (assuming Arabic headers or English)
        const mappedLeads = rawJson.map(row => ({
          name: row["الاسم"] || row["اسم العميل"] || row["Name"] || row["name"] || "",
          phone: String(row["رقم الهاتف"] || row["التليفون"] || row["Phone"] || row["phone"] || ""),
          company: row["الشركة"] || row["Company"] || row["company"] || "",
          need: row["الاحتياج"] || row["الملاحظات"] || row["Need"] || row["Notes"] || "",
        })).filter(l => l.name && l.phone); // Filter out invalid rows

        if (mappedLeads.length === 0) {
          alert("لم يتم العثور على بيانات صالحة في الملف. يرجى التأكد من وجود أعمدة (الاسم) و (رقم الهاتف).");
          setIsUploading(false);
          return;
        }

        const res = await fetch("/api/admin/leads/bulk-upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ leads: mappedLeads }),
        });

        if (!res.ok) throw new Error(await res.text());
        
        alert(`تم رفع ${mappedLeads.length} عميل بنجاح!`);
        router.refresh();
      } catch (error: any) {
        alert("حدث خطأ أثناء رفع الملف: " + error.message);
      } finally {
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    reader.readAsBinaryString(file);
  };

  // Bulk Assign
  const handleBulkAssign = async () => {
    if (selectedLeads.size === 0) return alert("يرجى تحديد العملاء أولاً.");
    if (!assignTarget) return alert("يرجى اختيار الموظف.");

    setIsAssigning(true);
    try {
      const res = await fetch("/api/admin/leads/bulk-assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadIds: Array.from(selectedLeads),
          employeeId: assignTarget,
        }),
      });

      if (!res.ok) throw new Error(await res.text());
      
      alert(`تم تحويل ${selectedLeads.size} عميل للموظف بنجاح!`);
      setSelectedLeads(new Set());
      setAssignTarget("");
      router.refresh();
    } catch (error: any) {
      alert("حدث خطأ أثناء التحويل: " + error.message);
    } finally {
      setIsAssigning(false);
    }
  };

  const toggleSelectAll = (filteredList: Lead[]) => {
    if (selectedLeads.size === filteredList.length) {
      setSelectedLeads(new Set());
    } else {
      setSelectedLeads(new Set(filteredList.map(l => l.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedLeads);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedLeads(next);
  };

  // Filtering
  const filteredLeads = leads.filter(l => {
    if (filterStatus !== "ALL" && filterStatus !== "UNASSIGNED") {
      if (l.status !== filterStatus) return false;
    }
    if (filterStatus === "UNASSIGNED" && l.assignedTo) return false;
    
    if (filterEmployee !== "ALL") {
      if (filterEmployee === "UNASSIGNED" && l.assignedTo) return false;
      if (filterEmployee !== "UNASSIGNED" && l.assignedTo?.id !== filterEmployee) return false;
    }
    
    if (search) {
      const q = search.toLowerCase();
      if (!l.name.toLowerCase().includes(q) && !l.phone.includes(q)) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header & Upload */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#121826] p-6 rounded-3xl border border-white/5 shadow-xl">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
            <span className="text-indigo-500">👥</span> إدارة وتوزيع العملاء
          </h1>
          <p className="text-slate-400 text-sm">ارفع شيت الإكسيل وقم بتوزيع العملاء على موظفي المبيعات والتيلي سيلز.</p>
        </div>
        
        <div>
          <input
            type="file"
            accept=".xlsx, .xls, .csv"
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileUpload}
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-6 rounded-xl shadow-lg transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {isUploading ? "جاري الرفع..." : (
              <>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="17 8 12 3 7 8"></polyline>
                  <line x1="12" y1="3" x2="12" y2="15"></line>
                </svg>
                رفع شيت Excel
              </>
            )}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/10">
        <button
          className={`px-6 py-3 font-bold text-sm transition-colors border-b-2 ${
            activeTab === "table" ? "border-indigo-500 text-indigo-400" : "border-transparent text-slate-400 hover:text-white"
          }`}
          onClick={() => setActiveTab("table")}
        >
          توزيع العملاء (الجدول)
        </button>
        <button
          className={`px-6 py-3 font-bold text-sm transition-colors border-b-2 ${
            activeTab === "cards" ? "border-indigo-500 text-indigo-400" : "border-transparent text-slate-400 hover:text-white"
          }`}
          onClick={() => setActiveTab("cards")}
        >
          متابعة العملاء (البطاقات)
        </button>
      </div>

      {activeTab === "table" ? (
        <>
          {/* Action Bar (Filters + Assign) */}
      <div className="bg-[#121826] p-4 rounded-3xl border border-white/5 shadow-lg flex flex-col xl:flex-row gap-4 items-center justify-between">
        
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
          <div className="relative flex-1 min-w-[200px]">
            <input 
              type="text" placeholder="بحث بالاسم أو الرقم..." 
              value={search} onChange={e => setSearch(e.target.value)}
              className="w-full bg-[#182032] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500/50"
            />
          </div>
          <select 
            value={filterEmployee} onChange={e => setFilterEmployee(e.target.value)}
            className="bg-[#182032] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-indigo-500/50 min-w-[150px]"
          >
            <option value="ALL">كل الموظفين</option>
            <option value="UNASSIGNED">غير معين (جديد)</option>
            {employees.map(emp => (
              <option key={emp.id} value={emp.id}>{emp.name} ({emp.role === "TELE_SALES" ? "تيلي" : "سيلز"})</option>
            ))}
          </select>
          <select 
            value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className="bg-[#182032] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-indigo-500/50 min-w-[150px]"
          >
            <option value="ALL">كل الحالات</option>
            <option value="UNASSIGNED">غير موزع فقط</option>
            <option value="NEW">جديد</option>
            <option value="CONTACTED">تم التواصل</option>
            <option value="INTERESTED">مهتم</option>
            <option value="NOT_INTERESTED">غير مهتم</option>
            <option value="TRANSFERRED_TO_SALES">تم التحويل لـ Sales</option>
          </select>
        </div>

        {/* Bulk Actions */}
        <div className="flex items-center gap-3 w-full xl:w-auto p-3 bg-indigo-500/10 rounded-2xl border border-indigo-500/20">
          <div className="text-sm text-indigo-300 font-bold px-2 whitespace-nowrap">
            محدد: {selectedLeads.size}
          </div>
          <select 
            value={assignTarget} onChange={e => setAssignTarget(e.target.value)}
            className="bg-[#182032] border border-indigo-500/30 rounded-xl px-4 py-2 text-sm text-white outline-none focus:border-indigo-500 flex-1 min-w-[180px]"
          >
            <option value="">-- اختر الموظف للتحويل --</option>
            {employees.map(emp => (
              <option key={emp.id} value={emp.id}>{emp.name} ({emp.role === "TELE_SALES" ? "Tele" : "Sales"})</option>
            ))}
          </select>
          <button 
            onClick={handleBulkAssign}
            disabled={isAssigning || selectedLeads.size === 0 || !assignTarget}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-6 rounded-xl shadow-md transition-colors disabled:opacity-50 whitespace-nowrap"
          >
            {isAssigning ? "جاري..." : "توزيع"}
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#121826] rounded-3xl border border-white/5 shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-right text-slate-300">
            <thead className="bg-[#0f1523] text-slate-400 font-semibold border-b border-white/5">
              <tr>
                <th className="px-6 py-4 w-12">
                  <input 
                    type="checkbox" 
                    checked={selectedLeads.size > 0 && selectedLeads.size === filteredLeads.length}
                    onChange={() => toggleSelectAll(filteredLeads)}
                    className="w-4 h-4 rounded bg-[#182032] border-white/20 text-indigo-500 focus:ring-indigo-500/50 cursor-pointer"
                  />
                </th>
                <th className="px-6 py-4">العميل</th>
                <th className="px-6 py-4">الهاتف</th>
                <th className="px-6 py-4">الشركة</th>
                <th className="px-6 py-4">الحالة</th>
                <th className="px-6 py-4">الموظف المسؤول</th>
                <th className="px-6 py-4">تاريخ الإضافة</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    لا يوجد عملاء متاحين بالفلتر الحالي.
                  </td>
                </tr>
              ) : (
                filteredLeads.map(lead => (
                  <tr key={lead.id} onClick={() => toggleSelect(lead.id)} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors cursor-pointer group">
                    <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                      <input 
                        type="checkbox" 
                        checked={selectedLeads.has(lead.id)}
                        onChange={() => toggleSelect(lead.id)}
                        className="w-4 h-4 rounded bg-[#182032] border-white/20 text-indigo-500 focus:ring-indigo-500/50 cursor-pointer"
                      />
                    </td>
                    <td className="px-6 py-4 font-bold text-white">{lead.name}</td>
                    <td className="px-6 py-4 text-slate-400" dir="ltr">{lead.phone}</td>
                    <td className="px-6 py-4">{lead.company || "-"}</td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <StatusBadge status={lead.status} />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {lead.assignedTo ? (
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${lead.assignedTo.role === "SALES" ? "bg-purple-500/10 text-purple-400 border-purple-500/20" : "bg-blue-500/10 text-blue-400 border-blue-500/20"}`}>
                          {lead.assignedTo.name}
                        </span>
                      ) : (
                        <span className="text-slate-500 text-xs font-semibold bg-white/5 px-3 py-1 rounded-full">غير معين</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500">
                      {new Date(lead.createdAt).toLocaleDateString("ar-EG")}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
        </>
      ) : (
        <LeadTable
          leads={leads as any}
          showAssignee
          allowTransfer
          canDelete={canDelete}
          salesTeam={salesTeam as any}
        />
      )}
    </div>
  );
}

