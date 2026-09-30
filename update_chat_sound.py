import re

with open('src/components/ChatBox.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Add import
import_old = '''import { useSession } from "next-auth/react";'''
import_new = '''import { useSession } from "next-auth/react";
import { playNotificationSound } from "@/lib/audio";'''
if "import { playNotificationSound }" not in content:
    content = content.replace(import_old, import_new)

# Add ref to track last seen message IDs
state_old = '''  const [showEmojiPicker, setShowEmojiPicker] = useState(false);'''
state_new = '''  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const prevLatestMessageIds = useRef<Record<string, string>>({});'''
content = content.replace(state_old, state_new)

# Add logic inside fetchConversations to play sound
fetch_old = '''      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations || []);
      }'''
fetch_new = '''      if (res.ok) {
        const data = await res.json();
        const convs = data.conversations || [];
        
        let hasNewMessages = false;
        convs.forEach((c: any) => {
          if (c.latestMessage) {
            const lastId = prevLatestMessageIds.current[c.id || (c.user?.id) || (c.group?.id)];
            if (lastId && lastId !== c.latestMessage.id && c.latestMessage.senderId !== session?.user?.id) {
              hasNewMessages = true;
            }
            prevLatestMessageIds.current[c.id || (c.user?.id) || (c.group?.id)] = c.latestMessage.id;
          }
        });
        
        if (hasNewMessages) {
          playNotificationSound();
        }
        
        setConversations(convs);
      }'''
content = content.replace(fetch_old, fetch_new)

with open('src/components/ChatBox.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
