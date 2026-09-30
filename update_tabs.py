import re

with open('src/components/ChatBox.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add activeTab state
state_old = '''  const [searchQuery, setSearchQuery] = useState("");'''
state_new = '''  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"users" | "groups">("users");'''
content = content.replace(state_old, state_new)

# 2. Update Header buttons
header_old = '''            ) : (
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <span className="text-xl">💬</span>
                  <h3 className="text-white font-bold text-sm">الرسائل والمحادثات</h3>
                </div>
                <button onClick={() => setIsCreatingGroup(true)} className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-2 py-1 rounded">
                  + مجموعة
                </button>
              </div>
            )}'''
header_new = '''            ) : (
              <div className="flex flex-col w-full gap-3 mt-1">
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">💬</span>
                    <h3 className="text-white font-bold text-sm">الرسائل والمحادثات</h3>
                  </div>
                  {activeTab === "groups" && (
                    <button onClick={() => setIsCreatingGroup(true)} className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-2 py-1 rounded">
                      + مجموعة
                    </button>
                  )}
                </div>
                <div className="flex bg-[#0b1120] rounded-lg p-1 border border-white/5">
                  <button 
                    onClick={() => setActiveTab("users")}
                    className={`flex-1 text-xs font-bold py-1.5 rounded-md transition-colors ${activeTab === "users" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"}`}
                  >
                    الموظفين
                  </button>
                  <button 
                    onClick={() => setActiveTab("groups")}
                    className={`flex-1 text-xs font-bold py-1.5 rounded-md transition-colors ${activeTab === "groups" ? "bg-emerald-600 text-white" : "text-slate-400 hover:text-white"}`}
                  >
                    المجموعات
                  </button>
                </div>
              </div>
            )}'''
content = content.replace(header_old, header_new)

# 3. Update filtering logic in list
filter_old = '''              {conversations.length === 0 ? (
                <p className="text-center text-slate-500 text-sm mt-10">لا يوجد مستخدمين آخرين.</p>
              ) : (
                conversations
                  .filter(conv => {
                    const name = conv.isGroup ? conv.group!.name : conv.user!.name;
                    return name.toLowerCase().includes(searchQuery.toLowerCase());
                  })
                  .map((conv) => {'''
filter_new = '''              {conversations.length === 0 ? (
                <p className="text-center text-slate-500 text-sm mt-10">لا يوجد مستخدمين آخرين.</p>
              ) : (
                conversations
                  .filter(conv => (activeTab === "users" ? !conv.isGroup : conv.isGroup))
                  .filter(conv => {
                    const name = conv.isGroup ? conv.group!.name : conv.user!.name;
                    return name.toLowerCase().includes(searchQuery.toLowerCase());
                  })
                  .map((conv) => {'''
content = content.replace(filter_old, filter_new)

with open('src/components/ChatBox.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
