import re

with open('src/components/ChatBox.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Define the new header and list content
replacement = '''          {/* Header */}
          <div className="p-4 border-b border-white/5 bg-[#121927] flex justify-between items-center shrink-0">
            {selectedChat ? (
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setSelectedChat(null)}
                  className="text-slate-400 hover:text-white p-1 ml-1"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M15 18l-6-6 6-6"/>
                  </svg>
                </button>
                <div className="relative">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-full text-white font-bold text-sm ${selectedChat.isGroup ? 'bg-emerald-600' : 'bg-indigo-600'}`}>
                    {selectedChat.isGroup ? '👥' : selectedChat.name.charAt(0)}
                  </div>
                  {!selectedChat.isGroup && <span className={`absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full ring-2 ring-[#121927] ${isOnline(selectedChat.lastActiveAt || null) ? 'bg-green-500' : 'bg-slate-500'}`} />}
                </div>
                <div>
                  <h3 className="text-white font-bold text-sm">{selectedChat.name}</h3>
                  <p className="text-[10px] text-slate-400">{selectedChat.isGroup ? 'مجموعة' : (ROLE_LABELS[selectedChat.role!] || selectedChat.role)}</p>
                </div>
              </div>
            ) : isCreatingGroup ? (
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setIsCreatingGroup(false)}
                  className="text-slate-400 hover:text-white p-1 ml-1"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M15 18l-6-6 6-6"/>
                  </svg>
                </button>
                <h3 className="text-white font-bold text-sm">إنشاء مجموعة جديدة</h3>
              </div>
            ) : (
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <span className="text-xl">💬</span>
                  <h3 className="text-white font-bold text-sm">الرسائل والمحادثات</h3>
                </div>
                <button onClick={() => setIsCreatingGroup(true)} className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-2 py-1 rounded">
                  + مجموعة
                </button>
              </div>
            )}
            
            <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white p-1">
              ✕
            </button>
          </div>
          
          {!selectedChat ? (
            isCreatingGroup ? (
              <div className="flex-1 overflow-y-auto bg-[#0b1120] p-4 flex flex-col gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">اسم المجموعة</label>
                  <input 
                    type="text" 
                    value={newGroupName}
                    onChange={e => setNewGroupName(e.target.value)}
                    className="w-full bg-[#121927] border border-white/10 rounded-lg p-2 text-white text-sm"
                    placeholder="مثال: فريق المبيعات"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">اختر الأعضاء</label>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                    {conversations.filter(c => !c.isGroup && c.user).map(c => (
                      <label key={c.user!.id} className="flex items-center gap-3 p-2 hover:bg-white/5 rounded cursor-pointer border border-white/5">
                        <input 
                          type="checkbox" 
                          checked={selectedGroupMembers.includes(c.user!.id)}
                          onChange={(e) => {
                            if (e.target.checked) setSelectedGroupMembers(prev => [...prev, c.user!.id]);
                            else setSelectedGroupMembers(prev => prev.filter(id => id !== c.user!.id));
                          }}
                          className="w-4 h-4 rounded border-slate-600 text-indigo-600 focus:ring-indigo-600 bg-slate-700"
                        />
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-white font-bold text-sm">
                          {c.user!.name.charAt(0)}
                        </div>
                        <span className="text-white text-sm">{c.user!.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <button 
                  onClick={async () => {
                    if (!newGroupName.trim() || selectedGroupMembers.length === 0) {
                      alert("يرجى إدخال اسم المجموعة واختيار عضو واحد على الأقل");
                      return;
                    }
                    setIsLoading(true);
                    try {
                      const res = await fetch("/api/chat/group", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ name: newGroupName, memberIds: selectedGroupMembers })
                      });
                      if (res.ok) {
                        setNewGroupName("");
                        setSelectedGroupMembers([]);
                        setIsCreatingGroup(false);
                        const convRes = await fetch(`/api/chat?t=${new Date().getTime()}`);
                        if (convRes.ok) {
                          const data = await convRes.json();
                          setConversations(data.conversations || []);
                        }
                      }
                    } catch (e) {}
                    setIsLoading(false);
                  }}
                  disabled={isLoading}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 rounded-lg mt-auto disabled:opacity-50"
                >
                  {isLoading ? 'جاري الإنشاء...' : 'إنشاء المجموعة'}
                </button>
              </div>
            ) : (
            /* Conversations List */
            <div className="flex-1 overflow-y-auto bg-[#0b1120]">
              {conversations.length === 0 ? (
                <p className="text-center text-slate-500 text-sm mt-10">لا يوجد مستخدمين آخرين.</p>
              ) : (
                conversations.map((conv) => {
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
                )})}
              )}
            </div>
            )
          ) : (
            /* Active Chat View */'''

# Find the start and end indices using regex
start_marker = r'\{\/\* Header \*\/\}'
end_marker = r'\{\/\* Active Chat View \*\/\}'
match = re.search(f"{start_marker}.*?{end_marker}", content, re.DOTALL)
if match:
    content = content[:match.start()] + replacement + content[match.end():]
else:
    print("Match not found")

# Fix EmojiPicker theme TS Error
content = content.replace('theme="dark"', 'theme={"dark" as any}')

with open('src/components/ChatBox.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
