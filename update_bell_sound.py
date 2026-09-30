import re

with open('src/components/NotificationBell.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Add import
import_old = '''import { useRouter } from "next/navigation";'''
import_new = '''import { useRouter } from "next/navigation";
import { playNotificationSound } from "@/lib/audio";'''
content = content.replace(import_old, import_new)

# Add logic inside component
logic_old = '''  const unreadCount = notifications.filter(n => !n.isRead).length;

  useEffect(() => {
    fetchNotifications();'''
logic_new = '''  const unreadCount = notifications.filter(n => !n.isRead).length;
  const prevUnreadRef = useRef(0);

  useEffect(() => {
    if (unreadCount > prevUnreadRef.current) {
      playNotificationSound();
    }
    prevUnreadRef.current = unreadCount;
  }, [unreadCount]);

  useEffect(() => {
    fetchNotifications();'''
content = content.replace(logic_old, logic_new)

with open('src/components/NotificationBell.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
