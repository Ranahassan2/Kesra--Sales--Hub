import re

with open('src/components/ChatBox.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace Conversation type
conv_old = '''export type Conversation = {
  user: {
    id: string;
    name: string;
    role: string;
    lastActiveAt: string | null;
  };
  latestMessage: {
    content: string;
    createdAt: string;
    senderId: string;
    isRead: boolean;
  } | null;
};'''
conv_new = '''export type Conversation = {
  isGroup: boolean;
  user?: {
    id: string;
    name: string;
    role: string;
    lastActiveAt: string | null;
  };
  group?: {
    id: string;
    name: string;
    _count: { members: number };
  };
  latestMessage: {
    content: string;
    createdAt: string;
    senderId: string;
    isRead: boolean;
  } | null;
};

export type SelectedChat = {
  id: string;
  name: string;
  isGroup: boolean;
  role?: string;
  lastActiveAt?: string | null;
};'''
content = content.replace(conv_old, conv_new)

# Replace selectedUser state
content = content.replace("const [selectedUser, setSelectedUser] = useState<Conversation['user'] | null>(null);", 
                          "const [selectedChat, setSelectedChat] = useState<SelectedChat | null>(null);\n  const [isCreatingGroup, setIsCreatingGroup] = useState(false);\n  const [newGroupName, setNewGroupName] = useState(\"\");\n  const [selectedGroupMembers, setSelectedGroupMembers] = useState<string[]>([]);")

# Replace selectedUser in useEffect
content = content.replace("[isOpen, selectedUser]", "[isOpen, selectedChat]")
content = content.replace("!selectedUser", "!selectedChat")
content = content.replace("selectedUser.id", "selectedChat.id")
content = content.replace("selectedUser.name", "selectedChat.name")
content = content.replace("selectedUser.role", "selectedChat.role")
content = content.replace("selectedUser.lastActiveAt", "selectedChat.lastActiveAt")

# Fix fetchMessages
fetch_msg_old = '''  const fetchMessages = async () => {
    if (!selectedChat) return;
    try {
      const res = await fetch(`/api/chat?userId=${selectedChat.id}&t=${new Date().getTime()}`);'''
fetch_msg_new = '''  const fetchMessages = async () => {
    if (!selectedChat) return;
    try {
      const queryParam = selectedChat.isGroup ? `groupId=${selectedChat.id}` : `userId=${selectedChat.id}`;
      const res = await fetch(`/api/chat?${queryParam}&t=${new Date().getTime()}`);'''
content = content.replace(fetch_msg_old, fetch_msg_new)

# Fix sendMessage
send_msg_old = '''      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: contentToSend, receiverId: selectedChat.id }),
      });'''
send_msg_new = '''      const bodyData: any = { content: contentToSend };
      if (selectedChat.isGroup) bodyData.groupId = selectedChat.id;
      else bodyData.receiverId = selectedChat.id;

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyData),
      });'''
content = content.replace(send_msg_old, send_msg_new)

# Fix file upload
upload_old = '''            receiverId: selectedChat.id,
            content: "ملف مرفق",
            file: { name: file.name, base64 }'''
upload_new = '''            ...(selectedChat.isGroup ? { groupId: selectedChat.id } : { receiverId: selectedChat.id }),
            content: "ملف مرفق",
            file: { name: file.name, base64 }'''
content = content.replace(upload_old, upload_new)

with open('src/components/ChatBox.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
