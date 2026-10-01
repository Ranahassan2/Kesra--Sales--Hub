"use client";

import { useState } from "react";
import LeadTable from "@/components/LeadTable";

export default function SalesClient({ leads }: { leads: any[] }) {
  const [activeTab, setActiveTab] = useState<"all" | "meetings_today" | "won" | "lost">("all");

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Filter for Today's Meetings
  const todaysMeetings = leads.filter(l => 
    l.meetings?.some((m: any) => 
      m.status === "SCHEDULED" && 
      new Date(m.scheduledAt) >= today && 
      new Date(m.scheduledAt) < tomorrow
    )
  );

  const wonLeads = leads.filter(l => l.status === "CLOSED_WON");
  const lostLeads = leads.filter(l => l.status === "CLOSED_LOST");

  let displayedLeads = leads;
  if (activeTab === "meetings_today") displayedLeads = todaysMeetings;
  if (activeTab === "won") displayedLeads = wonLeads;
  if (activeTab === "lost") displayedLeads = lostLeads;

  return (
    <div>
      <div className="mb-6 flex space-x-2 space-x-reverse overflow-x-auto border-b border-white/10 pb-2">
        <button
          className={`shrink-0 rounded-xl px-4 py-2 text-sm font-medium transition-all ${
            activeTab === "all"
              ? "bg-accent/20 text-accent-soft"
              : "text-slate-400 hover:bg-white/5 hover:text-white"
          }`}
          onClick={() => setActiveTab("all")}
        >
          كل عملائي ({leads.length})
        </button>
        <button
          className={`shrink-0 rounded-xl px-4 py-2 text-sm font-medium transition-all ${
            activeTab === "meetings_today"
              ? "bg-accent/20 text-accent-soft"
              : "text-slate-400 hover:bg-white/5 hover:text-white"
          }`}
          onClick={() => setActiveTab("meetings_today")}
        >
          اجتماعات ومقابلات اليوم ({todaysMeetings.length})
        </button>
        <button
          className={`shrink-0 rounded-xl px-4 py-2 text-sm font-medium transition-all ${
            activeTab === "won"
              ? "bg-status-won/20 text-status-won"
              : "text-slate-400 hover:bg-white/5 hover:text-white"
          }`}
          onClick={() => setActiveTab("won")}
        >
          صفقات ناجحة 🤑 ({wonLeads.length})
        </button>
        <button
          className={`shrink-0 rounded-xl px-4 py-2 text-sm font-medium transition-all ${
            activeTab === "lost"
              ? "bg-status-lost/20 text-status-lost"
              : "text-slate-400 hover:bg-white/5 hover:text-white"
          }`}
          onClick={() => setActiveTab("lost")}
        >
          مرفوض / خسرناها 💔 ({lostLeads.length})
        </button>
      </div>

      <LeadTable leads={displayedLeads} />
    </div>
  );
}
