"use client";
import React from "react";

interface RenderIconProps {
  icon: string;
  alt?: string;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * RenderIcon guarantees that whether an icon is an uploaded PNG/SVG/JPG
 * or a unicode emoji/symbol, it displays at the EXACT same uniform dimensions
 * with proper containment and styling across the entire website.
 */
export default function RenderIcon({
  icon,
  alt = "Icon",
  size = 56,
  className = "",
  style = {},
}: RenderIconProps) {
  const isImage =
    typeof icon === "string" &&
    (icon.startsWith("data:") ||
      icon.startsWith("http://") ||
      icon.startsWith("https://") ||
      icon.startsWith("/") ||
      icon.includes(".png") ||
      icon.includes(".svg") ||
      icon.includes(".jpg") ||
      icon.includes(".jpeg") ||
      icon.includes(".webp"));

  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        minWidth: size,
        minHeight: size,
        borderRadius: Math.round(size * 0.22),
        background: "rgba(201,168,76,0.1)",
        border: "1px solid var(--border-gold)",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        flexShrink: 0,
        boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
        ...style,
      }}
    >
      {isImage ? (
        <img
          src={icon}
          alt={alt}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            padding: Math.max(4, Math.round(size * 0.14)),
            display: "block",
          }}
        />
      ) : (
        <span
          style={{
            fontSize: `${Math.round(size * 0.52)}px`,
            lineHeight: 1,
            userSelect: "none",
          }}
        >
          {icon || "✨"}
        </span>
      )}
    </div>
  );
}
