const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  NEW: { label: "جديد", className: "badge-new" },
  CONTACTED: { label: "تم التواصل", className: "badge-new" },
  NO_ANSWER: { label: "لم يتم الرد", className: "badge-lost" },
  NEEDS_FOLLOWUP: { label: "يحتاج متابعة", className: "badge-gold" },
  INTERESTED: { label: "مهتم", className: "badge-won" },
  NOT_INTERESTED: { label: "غير مهتم", className: "badge-lost" },
  HOT: { label: "Hot", className: "badge-hot" },
  COLD: { label: "Cold", className: "badge-gold" },
  MEETING_SCHEDULED: { label: "تم تحديد Meeting", className: "badge-new" },
  TRANSFERRED_TO_SALES: { label: "تم التحويل لـ Sales", className: "badge-won" },
  CLOSED_WON: { label: "تم الإغلاق (نجاح)", className: "badge-won" },
  CLOSED_LOST: { label: "تم الإغلاق (خسارة)", className: "badge-lost" },
};

export default function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_LABELS[status] ?? { label: status, className: "badge-new" };
  return <span className={cfg.className}>{cfg.label}</span>;
}
