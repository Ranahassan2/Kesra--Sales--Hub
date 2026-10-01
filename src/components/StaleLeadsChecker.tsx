"use client";

import { useEffect } from "react";

// This component auto-checks for stale leads and overdue meetings
// when the admin dashboard loads. It runs once on mount.
export default function StaleLeadsChecker() {
  useEffect(() => {
    // Run the check silently in the background
    fetch("/api/admin/stale-leads", { method: "POST" })
      .then(() => {
        // Trigger notification refresh so new alerts show up in the bell
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("refreshNotifications"));
        }
      })
      .catch(() => {
        // Silently fail - this is a background check
      });
  }, []);

  return null; // This component renders nothing
}
