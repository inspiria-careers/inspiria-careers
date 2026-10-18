"use client";
import React from "react";
import { useSite } from "@/contexts/SiteContext";
import { WhatsAppIcon } from "@/components/Icons";

export default function FloatingWhatsApp() {
  const { profile } = useSite();

  if (!profile.whatsapp) return null;

  const cleanNumber = profile.whatsapp.replace(/[^0-9]/g, "");
  if (!cleanNumber) return null;

  const url = `https://wa.me/${cleanNumber}?text=${encodeURIComponent("Hello, I would like to inquire about guidance and counselling.")}`;

  return (
    <aside
      aria-label="Direct WhatsApp Contact"
      style={{
        position: "fixed",
        bottom: "1.5rem",
        right: "1.5rem",
        zIndex: 990,
      }}
    >
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat with Counsellor on WhatsApp"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "52px",
          height: "52px",
          borderRadius: "50%",
          backgroundColor: "#25D366",
          color: "#ffffff",
          boxShadow: "0 4px 14px rgba(37, 211, 102, 0.4)",
          textDecoration: "none",
          transition: "transform 0.2s ease, box-shadow 0.2s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "scale(1.08)";
          e.currentTarget.style.boxShadow = "0 6px 18px rgba(37, 211, 102, 0.5)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "scale(1)";
          e.currentTarget.style.boxShadow = "0 4px 14px rgba(37, 211, 102, 0.4)";
        }}
      >
        <WhatsAppIcon size={28} />
      </a>
    </aside>
  );
}
