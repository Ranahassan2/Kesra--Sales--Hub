import re

with open('src/components/LeadTable.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Add state for WA modal
state_old = '''  const [openId, setOpenId] = useState<string | null>(null);
  const [modalMode, setModalMode] = useState<"details" | "transfer">("details");'''
state_new = '''  const [openId, setOpenId] = useState<string | null>(null);
  const [modalMode, setModalMode] = useState<"details" | "transfer">("details");
  const [waLead, setWaLead] = useState<LeadRow | null>(null);
  const [waMessage, setWaMessage] = useState("");
  const [waLoading, setWaLoading] = useState(false);
  const [waError, setWaError] = useState("");

  const handleSendWa = async () => {
    if (!waLead || !waMessage.trim()) return;
    setWaLoading(true);
    setWaError("");
    try {
      const phone = waLead.phone.startsWith("0") ? "2" + waLead.phone : waLead.phone;
      const res = await fetch("/api/whatsapp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, message: waMessage })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "خطأ في الإرسال");
      setWaLead(null);
      setWaMessage("");
      alert("تم إرسال رسالة الواتساب بنجاح! 🚀");
    } catch (e: any) {
      setWaError(e.message || "تأكد من ربط الواتساب في صفحة (ربط واتساب) أولاً.");
    } finally {
      setWaLoading(false);
    }
  };'''
content = content.replace(state_old, state_new)

# Replace <a> with <button>
btn_old = '''                  <a 
                    href={`https://wa.me/${lead.phone.startsWith("0") ? "2" + lead.phone : lead.phone}`} 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl py-3 text-[13px] transition-colors text-center flex items-center justify-center gap-2 font-semibold shadow-[0_4px_12px_rgba(79,70,229,0.3)]"
                  >
                    واتساب 💬
                  </a>'''
btn_new = '''                  <button 
                    onClick={() => { setWaLead(lead); setWaMessage(`أهلاً بك يا ${lead.name}، معك ممثل مبيعات من الشركة.`); }}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl py-3 text-[13px] transition-colors text-center flex items-center justify-center gap-2 font-semibold shadow-[0_4px_12px_rgba(79,70,229,0.3)]"
                  >
                    واتساب 💬
                  </button>'''
content = content.replace(btn_old, btn_new)

# Add WA Modal at the end of the file
modal_old = '''      {/* Full Screen Details Modal */}'''
modal_new = '''      {waLead && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4">
          <div className="bg-[#121927] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl relative">
            <button onClick={() => setWaLead(null)} className="absolute top-4 left-4 text-slate-400 hover:text-white">✕</button>
            <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
              <span className="text-green-500">💬</span> إرسال رسالة واتساب
            </h3>
            <p className="text-slate-400 text-sm mb-6">جاري إرسال رسالة إلى {waLead.name} ({waLead.phone})</p>
            
            <textarea
              className="w-full h-32 bg-[#0e1320] border border-white/10 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-indigo-500 resize-none mb-4"
              value={waMessage}
              onChange={(e) => setWaMessage(e.target.value)}
              placeholder="اكتب رسالتك هنا..."
            ></textarea>
            
            {waError && <p className="text-red-400 text-xs mb-4">{waError}</p>}
            
            <button
              onClick={handleSendWa}
              disabled={waLoading || !waMessage.trim()}
              className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-xl disabled:opacity-50 transition-colors"
            >
              {waLoading ? "جاري الإرسال..." : "إرسال الآن 🚀"}
            </button>
          </div>
        </div>
      )}

      {/* Full Screen Details Modal */}'''
content = content.replace(modal_old, modal_new)

with open('src/components/LeadTable.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
