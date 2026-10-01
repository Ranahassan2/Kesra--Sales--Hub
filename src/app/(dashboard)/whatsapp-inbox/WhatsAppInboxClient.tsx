"use client";

import { useEffect, useRef, useState, useCallback } from "react";

type Chat = {
  id: string;
  name: string;
  isGroup: boolean;
  unreadCount: number;
  lastMessage: { body: string; fromMe: boolean; timestamp: number } | null;
  timestamp: number;
};

type Message = {
  id: string;
  body: string;
  fromMe: boolean;
  timestamp: number;
  type: string;
};

type WaStatus = "DISCONNECTED" | "INITIALIZING" | "QR_READY" | "CONNECTED";

function formatTime(ts: number) {
  return new Date(ts * 1000).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" });
}

function formatChatTime(ts: number) {
  const d = new Date(ts * 1000);
  const diffDays = Math.floor((Date.now() - d.getTime()) / 86400000);
  if (diffDays === 0) return d.toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" });
  if (diffDays === 1) return "أمس";
  return d.toLocaleDateString("ar-EG", { month: "short", day: "numeric" });
}

function getInitials(name: string) {
  return name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

const COLORS = ["bg-indigo-500", "bg-emerald-500", "bg-rose-500", "bg-amber-500", "bg-sky-500", "bg-purple-500"];
function avatarColor(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = id.charCodeAt(i) + ((h << 5) - h);
  return COLORS[Math.abs(h) % COLORS.length];
}

export default function WhatsAppInboxClient() {
  const [waStatus, setWaStatus] = useState<WaStatus>("DISCONNECTED");
  const [waQr, setWaQr] = useState<string | null>(null);
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMsg, setNewMsg] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingChats, setLoadingChats] = useState(false);
  const [search, setSearch] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const poll = async () => {
      try {
        const r = await fetch(`/api/whatsapp/status?t=${Date.now()}`);
        if (r.ok) { const d = await r.json(); setWaStatus(d.status); setWaQr(d.qrCodeBase64); }
      } catch {}
    };
    poll();
    const iv = setInterval(poll, 3000);
    return () => clearInterval(iv);
  }, []);

  const loadChats = useCallback(async () => {
    if (waStatus !== "CONNECTED") return;
    setLoadingChats(true);
    try {
      const r = await fetch("/api/whatsapp/chats");
      if (r.ok) { const d = await r.json(); setChats(d.chats || []); }
    } catch {} finally { setLoadingChats(false); }
  }, [waStatus]);

  useEffect(() => {
    loadChats();
    const iv = setInterval(loadChats, 10000);
    return () => clearInterval(iv);
  }, [loadChats]);

  const loadMessages = useCallback(async () => {
    if (!selectedChat) return;
    try {
      const r = await fetch(`/api/whatsapp/chats/${encodeURIComponent(selectedChat.id)}`);
      if (r.ok) { const d = await r.json(); setMessages(d.messages || []); }
    } catch {}
  }, [selectedChat]);

  useEffect(() => {
    if (!selectedChat) return;
    loadMessages();
    const iv = setInterval(loadMessages, 5000);
    return () => clearInterval(iv);
  }, [loadMessages, selectedChat]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!selectedChat || !newMsg.trim()) return;
    setSending(true);
    try {
      await fetch(`/api/whatsapp/chats/${encodeURIComponent(selectedChat.id)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: newMsg }),
      });
      setNewMsg("");
      await loadMessages();
    } catch {} finally { setSending(false); }
  };

  const filtered = chats.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));

  if (!mounted) return null;

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-120px)] w-full relative">
      {/* NOT CONNECTED */}
      {waStatus !== "CONNECTED" && (
        <div className="m-auto max-w-md bg-[#121927] border border-white/10 rounded-2xl p-8 text-center shadow-2xl">
          {waStatus === "DISCONNECTED" && (
            <>
              <div className="text-5xl mb-4">💬</div>
              <h2 className="text-xl font-bold text-white mb-2">الواتساب غير مرتبط</h2>
              <p className="text-slate-400 mb-6">اضغط لتوليد رمز QR وربط حسابك</p>
              <button
                onClick={() => fetch("/api/whatsapp/status", { method: "POST" })}
                className="bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-8 rounded-xl transition-colors"
              >توليد رمز QR</button>
            </>
          )}
          {waStatus === "INITIALIZING" && (
            <>
              <div className="w-12 h-12 border-4 border-green-500/20 border-t-green-500 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-green-400 font-bold">جاري تجهيز رمز QR...</p>
              <p className="text-sm text-slate-400 mt-2">يرجى الانتظار بضع ثوانٍ</p>
            </>
          )}
          {waStatus === "QR_READY" && waQr && (
            <>
              <h2 className="text-xl font-bold text-white mb-4">امسح الرمز من موبايلك</h2>
              <div className="bg-white p-3 rounded-2xl inline-block mb-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={waQr} alt="QR" width={240} height={240} />
              </div>
              <div className="text-right text-sm text-slate-300 space-y-2 bg-white/5 p-4 rounded-xl border border-white/10">
                <p>1️⃣ افتح <strong>واتساب</strong> على هاتفك</p>
                <p>2️⃣ الإعدادات → <strong>الأجهزة المرتبطة</strong></p>
                <p>3️⃣ اضغط <strong>ربط جهاز</strong> وامسح الرمز</p>
              </div>
            </>
          )}
        </div>
      )}

      {/* CONNECTED INBOX */}
      {waStatus === "CONNECTED" && (
        <div className="flex gap-0 rounded-2xl overflow-hidden border border-white/10 shadow-2xl w-full h-full bg-[#121927]">
          {/* Sidebar */}
          <div className="w-80 min-w-[320px] bg-[#0f1523] border-l border-white/10 flex flex-col z-10">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <span className="text-white font-bold flex items-center gap-2">
                <span className="text-green-400">💬</span> المحادثات
              </span>
              <button onClick={loadChats} className="text-slate-400 hover:text-white text-xs transition-colors">
                {loadingChats ? "⟳ جاري..." : "⟳ تحديث"}
              </button>
            </div>
            <div className="p-3 border-b border-white/5">
              <input
                type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="🔍 بحث..."
                className="w-full bg-[#182032] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 transition-colors"
              />
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {filtered.length === 0
                ? <p className="text-center text-slate-500 text-sm py-8">لا توجد محادثات</p>
                : filtered.map(chat => (
                  <button key={chat.id} onClick={() => { setSelectedChat(chat); setMessages([]); }}
                    className={`w-full flex items-center gap-3 px-4 py-3 border-b border-white/5 hover:bg-white/5 transition-colors text-right ${selectedChat?.id === chat.id ? "bg-white/10 border-r-2 border-r-green-500" : ""}`}
                  >
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 ${avatarColor(chat.id)}`}>
                      {chat.isGroup ? "👥" : getInitials(chat.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-white text-[15px] font-semibold truncate">{chat.name}</span>
                        {chat.timestamp > 0 && <span className="text-slate-500 text-[11px] flex-shrink-0 mr-2">{formatChatTime(chat.timestamp)}</span>}
                      </div>
                      {chat.lastMessage && (
                        <p className="text-slate-400 text-xs truncate flex items-center gap-1">
                          {chat.lastMessage.fromMe && <span className="text-green-400 text-[10px]">✓✓</span>}
                          {chat.lastMessage.body}
                        </p>
                      )}
                    </div>
                    {chat.unreadCount > 0 && <span className="bg-green-500 text-white text-[10px] font-bold px-2 py-1 rounded-full">{chat.unreadCount}</span>}
                  </button>
                ))
              }
            </div>
          </div>

          {/* Messages Area */}
          {!selectedChat ? (
            <div className="flex-1 bg-[#121927] flex items-center justify-center">
              <div className="text-center text-slate-500">
                <div className="text-6xl mb-4">💬</div>
                <p className="text-xl font-bold text-white mb-2">واتساب ويب</p>
                <p className="text-sm">اختر محادثة للبدء في المراسلة</p>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col bg-[#121927] relative min-w-0 overflow-hidden">
              {/* Chat Header */}
              <div className="p-4 border-b border-white/10 flex items-center gap-4 bg-[#0f1523] z-10 flex-shrink-0">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${avatarColor(selectedChat.id)}`}>
                  {selectedChat.isGroup ? "👥" : getInitials(selectedChat.name)}
                </div>
                <div className="min-w-0">
                  <p className="text-white font-bold text-[15px] truncate">{selectedChat.name}</p>
                  <p className="text-green-400 text-[11px]">متصل</p>
                </div>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-[#121927] custom-scrollbar">
                {messages.map(msg => (
                  <div key={msg.id} className={`flex ${msg.fromMe ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm shadow-md relative ${msg.fromMe ? "bg-[#005c4b] text-white rounded-br-sm" : "bg-[#202c33] text-white rounded-bl-sm"}`}>
                      <p className="whitespace-pre-wrap leading-relaxed mb-1">{msg.body || <em className="opacity-50">[ميديا]</em>}</p>
                      <div className="flex items-center justify-end gap-1">
                        <p className={`text-[10px] ${msg.fromMe ? "text-green-200" : "text-slate-400"}`}>{formatTime(msg.timestamp)}</p>
                        {msg.fromMe && <span className="text-blue-400 text-[10px]">✓✓</span>}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input */}
              <div className="p-4 border-t border-white/10 bg-[#0f1523] z-10 flex-shrink-0">
                <div className="flex gap-3 items-center">
                  <input
                    type="text" value={newMsg} onChange={e => setNewMsg(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); handleSend(); }}}
                    placeholder="اكتب رسالة..."
                    className="flex-1 bg-[#182032] border border-white/10 rounded-xl px-4 py-3.5 text-white text-[15px] placeholder-slate-500 focus:outline-none focus:border-[#00a884] transition-colors shadow-inner"
                  />
                  <button onClick={handleSend} disabled={sending || !newMsg.trim()}
                    className="bg-[#00a884] hover:bg-[#008f6f] text-white p-3.5 rounded-xl font-bold transition-colors disabled:opacity-50 flex items-center justify-center shadow-lg"
                  >
                    {sending ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : (
                      <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                        <path d="M1.101 21.757 23.8 12.028 1.101 2.3l.011 7.912 13.623 1.816-13.623 1.817-.011 7.912z"></path>
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
