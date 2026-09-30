"use client";

import { SessionProvider } from "next-auth/react";
import { useEffect } from "react";

export default function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Send heartbeat immediately on load
    fetch("/api/user/heartbeat", { method: "POST" }).catch(() => {});
    
    // Then every 3 minutes
    const interval = setInterval(() => {
      fetch("/api/user/heartbeat", { method: "POST" }).catch(() => {});
    }, 1000 * 60 * 3);
    
    return () => clearInterval(interval);
  }, []);

  return <SessionProvider>{children}</SessionProvider>;
}
