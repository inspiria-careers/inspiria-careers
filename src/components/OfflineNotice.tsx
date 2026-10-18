"use client";
import React, { useState, useEffect } from "react";
import { useSite } from "@/contexts/SiteContext";

export default function OfflineNotice() {
  const { lang } = useSite();
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    function handleOnline() {
      setIsOffline(false);
    }
    function handleOffline() {
      setIsOffline(true);
    }

    if (typeof window !== "undefined") {
      setIsOffline(!navigator.onLine);
      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div
      role="alert"
      style={{
        position: "fixed",
        bottom: "1rem",
        left: "50%",
        transform: "translateX(-50%)",
        background: "#991b1b",
        color: "#ffffff",
        padding: "0.6rem 1.25rem",
        borderRadius: 30,
        boxShadow: "0 10px 25px rgba(0,0,0,0.3)",
        zIndex: 9999,
        fontSize: "0.85rem",
        fontWeight: 600,
        display: "flex",
        alignItems: "center",
        gap: "0.5rem",
        textAlign: "center",
      }}
    >
      <span>⚠️</span>
      <span>
        {lang === "hi"
          ? "आप ऑफ़लाइन हैं। नेटवर्क कनेक्शन की जांच करें।"
          : "You are currently offline. Please check your connection."}
      </span>
      <a
        href="/offline"
        style={{
          color: "#fef08a",
          textDecoration: "underline",
          marginLeft: "0.5rem",
          fontSize: "0.78rem",
        }}
      >
        {lang === "hi" ? "हेल्पलाइन देखें →" : "View Helplines →"}
      </a>
    </div>
  );
}
