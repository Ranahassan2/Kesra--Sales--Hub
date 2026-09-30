import re

with open('src/components/ChatBox.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add searchQuery state
state_old = '''  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [selectedGroupMembers, setSelectedGroupMembers] = useState<string[]>([]);'''
state_new = '''  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [selectedGroupMembers, setSelectedGroupMembers] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");'''
content = content.replace(state_old, state_new)

# 2. Add search bar and filter conversations
list_old = '''            /* Conversations List */
            <div className="flex-1 overflow-y-auto bg-[#0b1120]">
              {conversations.length === 0 ? (
                <p className="text-center text-slate-500 text-sm mt-10">لا يوجد مستخدمين آخرين.</p>
              ) : (
                conversations.map((conv) => {'''
list_new = '''            /* Conversations List */
            <div className="flex-1 overflow-y-auto bg-[#0b1120] flex flex-col">
              <div className="p-3 border-b border-white/5 bg-[#0f1623] shrink-0">
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="ابحث عن مستخدم أو مجموعة..."
                    className="w-full bg-[#1a2235] text-white text-sm rounded-lg pl-10 pr-4 py-2 border border-white/10 focus:outline-none focus:border-indigo-500"
                    dir="rtl"
                  />
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="11" cy="11" r="8"></circle>
                      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    </svg>
                  </div>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto">
              {conversations.length === 0 ? (
                <p className="text-center text-slate-500 text-sm mt-10">لا يوجد مستخدمين آخرين.</p>
              ) : (
                conversations
                  .filter(conv => {
                    const name = conv.isGroup ? conv.group!.name : conv.user!.name;
                    return name.toLowerCase().includes(searchQuery.toLowerCase());
                  })
                  .map((conv) => {'''
content = content.replace(list_old, list_new)

# 3. Add closing </div> for the flex-1 overflow-y-auto
end_old = '''                  );
                })
              )}
            </div>
            )
          ) : (
            /* Active Chat View */'''
end_new = '''                  );
                })
              )}
              </div>
            </div>
            )
          ) : (
            /* Active Chat View */'''
content = content.replace(end_old, end_new)

with open('src/components/ChatBox.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
