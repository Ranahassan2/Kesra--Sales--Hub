import re

with open('src/components/ChatBox.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add pinnedChats state and useEffect
state_old = '''  const [activeTab, setActiveTab] = useState<"users" | "groups">("users");'''
state_new = '''  const [activeTab, setActiveTab] = useState<"users" | "groups">("users");
  const [pinnedChats, setPinnedChats] = useState<string[]>([]);

  useEffect(() => {
    const savedPins = localStorage.getItem("pinnedChats");
    if (savedPins) {
      try { setPinnedChats(JSON.parse(savedPins)); } catch (e) {}
    }
  }, []);

  const togglePin = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setPinnedChats(prev => {
      const isPinned = prev.includes(id);
      const newPins = isPinned ? prev.filter(p => p !== id) : [...prev, id];
      localStorage.setItem("pinnedChats", JSON.stringify(newPins));
      return newPins;
    });
  };'''
content = content.replace(state_old, state_new)

# 2. Update filtering and mapping logic in list
filter_old = '''              {conversations.length === 0 ? (
                <p className="text-center text-slate-500 text-sm mt-10">لا يوجد مستخدمين آخرين.</p>
              ) : (
                conversations
                  .filter(conv => (activeTab === "users" ? !conv.isGroup : conv.isGroup))
                  .filter(conv => {
                    const name = conv.isGroup ? conv.group!.name : conv.user!.name;
                    return name.toLowerCase().includes(searchQuery.toLowerCase());
                  })
                  .map((conv) => {
                  const id = conv.isGroup ? conv.group!.id : conv.user!.id;
                  const name = conv.isGroup ? conv.group!.name : conv.user!.name;
                  return (
                  <div 
                    key={id} 
                    className="p-4 border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer flex items-center justify-between"
                    onClick={() => setSelectedChat({
                      id, name, isGroup: conv.isGroup,
                      role: conv.isGroup ? undefined : conv.user!.role,
                      lastActiveAt: conv.isGroup ? undefined : conv.user!.lastActiveAt
                    })}
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="relative shrink-0">
                        <div className={`flex h-11 w-11 items-center justify-center rounded-full text-white font-bold text-lg border border-white/10 ${conv.isGroup ? 'bg-emerald-800' : 'bg-slate-800'}`}>
                          {conv.isGroup ? '👥' : name.charAt(0)}
                        </div>
                        {!conv.isGroup && <span className={`absolute bottom-0 right-0 block h-3 w-3 rounded-full ring-2 ring-[#0b1120] ${isOnline(conv.user!.lastActiveAt) ? 'bg-green-500' : 'bg-slate-500'}`} />}
                      </div>
                      <div className="truncate text-right">
                        <h4 className="text-sm font-bold text-white truncate">{name}</h4>
                        {conv.latestMessage && (
                          <p className="text-xs text-slate-400 truncate mt-1" dir="rtl">
                            {conv.latestMessage.content.startsWith("data:audio") 
                              ? "🎤 رسالة صوتية" 
                              : conv.latestMessage.content.startsWith("[FILE:") ? "📎 ملف مرفق" : conv.latestMessage.content}
                          </p>
                        )}
                      </div>
                    </div>
                    {conv.latestMessage && (
                      <div className="shrink-0 text-left mr-2">
                        <span className="text-[10px] text-slate-500">
                          {new Date(conv.latestMessage.createdAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    )}
                  </div>
                  );
                })
              )}'''

filter_new = '''              {conversations.length === 0 ? (
                <p className="text-center text-slate-500 text-sm mt-10">لا يوجد مستخدمين آخرين.</p>
              ) : (
                conversations
                  .filter(conv => (activeTab === "users" ? !conv.isGroup : conv.isGroup))
                  .filter(conv => {
                    const name = conv.isGroup ? conv.group!.name : conv.user!.name;
                    return name.toLowerCase().includes(searchQuery.toLowerCase());
                  })
                  .sort((a, b) => {
                    const aId = a.isGroup ? a.group!.id : a.user!.id;
                    const bId = b.isGroup ? b.group!.id : b.user!.id;
                    const aPinned = pinnedChats.includes(aId);
                    const bPinned = pinnedChats.includes(bId);
                    if (aPinned && !bPinned) return -1;
                    if (!aPinned && bPinned) return 1;
                    return 0; // maintain original sort (date)
                  })
                  .map((conv) => {
                  const id = conv.isGroup ? conv.group!.id : conv.user!.id;
                  const name = conv.isGroup ? conv.group!.name : conv.user!.name;
                  const isPinned = pinnedChats.includes(id);
                  return (
                  <div 
                    key={id} 
                    className={`p-4 border-b transition-colors cursor-pointer flex items-center justify-between ${isPinned ? 'bg-indigo-900/20 border-indigo-500/30' : 'border-white/5 hover:bg-white/5'}`}
                    onClick={() => setSelectedChat({
                      id, name, isGroup: conv.isGroup,
                      role: conv.isGroup ? undefined : conv.user!.role,
                      lastActiveAt: conv.isGroup ? undefined : conv.user!.lastActiveAt
                    })}
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="relative shrink-0">
                        <div className={`flex h-11 w-11 items-center justify-center rounded-full text-white font-bold text-lg border border-white/10 ${conv.isGroup ? 'bg-emerald-800' : 'bg-slate-800'}`}>
                          {conv.isGroup ? '👥' : name.charAt(0)}
                        </div>
                        {!conv.isGroup && <span className={`absolute bottom-0 right-0 block h-3 w-3 rounded-full ring-2 ring-[#0b1120] ${isOnline(conv.user!.lastActiveAt) ? 'bg-green-500' : 'bg-slate-500'}`} />}
                      </div>
                      <div className="truncate text-right">
                        <h4 className="text-sm font-bold text-white truncate flex items-center gap-2">
                          {name}
                        </h4>
                        {conv.latestMessage && (
                          <p className="text-xs text-slate-400 truncate mt-1" dir="rtl">
                            {conv.latestMessage.content.startsWith("data:audio") 
                              ? "🎤 رسالة صوتية" 
                              : conv.latestMessage.content.startsWith("[FILE:") ? "📎 ملف مرفق" : conv.latestMessage.content}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="shrink-0 text-left mr-2 flex flex-col items-end gap-1">
                      <button 
                        onClick={(e) => togglePin(e, id)} 
                        className={`hover:scale-110 transition-transform ${isPinned ? 'opacity-100' : 'opacity-30 hover:opacity-100'}`}
                        title={isPinned ? 'إلغاء التثبيت' : 'تثبيت المحادثة'}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill={isPinned ? "#ef4444" : "currentColor"} stroke={isPinned ? "#ef4444" : "currentColor"} className={isPinned ? "" : "text-slate-400"} strokeWidth="2">
                          <path d="M12 2L12 10" />
                          <path d="M8 10L16 10" />
                          <path d="M10 10L10 14" />
                          <path d="M14 10L14 14" />
                          <path d="M6 14L18 14" />
                          <path d="M12 14L12 22" />
                        </svg>
                      </button>
                      {conv.latestMessage && (
                        <span className="text-[10px] text-slate-500">
                          {new Date(conv.latestMessage.createdAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                  </div>
                  );
                })
              )}'''
content = content.replace(filter_old, filter_new)

with open('src/components/ChatBox.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
