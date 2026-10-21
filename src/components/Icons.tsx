import React from "react";

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  color?: string;
  className?: string;
}

const baseProps = (size: number | string = 20, color?: string) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  xmlns: "http://www.w3.org/2000/svg",
  style: color ? { color } : undefined,
});

/* ═══════════════════════════════════════════════════════════════════════
   1. SPECIFIC VECTOR ICONS MATCHING USER REFERENCE IMAGE (16 ICONS)
   ═══════════════════════════════════════════════════════════════════════ */

// Row 1, Col 1: Share Nodes
export function ShareNodesIcon({ size = 20, color, className, ...props }: IconProps) {
  return (
    <svg {...baseProps(size, color)} className={className} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="18" cy="5" r="3" fill="currentColor" />
      <circle cx="6" cy="12" r="3" fill="currentColor" />
      <circle cx="18" cy="19" r="3" fill="currentColor" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  );
}

// Row 1, Col 2: Browser WWW with Pointer
export function BrowserWwwIcon({ size = 20, color, className, ...props }: IconProps) {
  return (
    <svg {...baseProps(size, color)} className={className} {...props}>
      <rect x="2" y="4" width="20" height="13" rx="3" stroke="currentColor" strokeWidth="2" fill="none" />
      <text x="4.5" y="13.5" fill="currentColor" fontSize="6.5" fontWeight="900" fontFamily="sans-serif" letterSpacing="-0.5">WWW.</text>
      {/* Pointer Cursor */}
      <path d="M15 11l6 6-2.5.5 1.5 3-1.5.8-1.5-3L15 20V11z" fill="currentColor" stroke="var(--bg-white, #fff)" strokeWidth="0.8" />
    </svg>
  );
}

// Row 1, Col 3: Ethernet Plug with Coiled Cable
export function EthernetCableIcon({ size = 20, color, className, ...props }: IconProps) {
  return (
    <svg {...baseProps(size, color)} className={className} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" {...props}>
      {/* Plug head */}
      <path d="M9 2h6v4H9z" fill="currentColor" stroke="none" />
      <line x1="10" y1="2" x2="10" y2="1" />
      <line x1="12" y1="2" x2="12" y2="1" />
      <line x1="14" y1="2" x2="14" y2="1" />
      <rect x="8" y="5" width="8" height="4" rx="1" fill="currentColor" stroke="none" />
      {/* S-Coil cable */}
      <path d="M12 9v2a2 2 0 0 1-2 2H8a2 2 0 0 0-2 2 2 2 0 0 0 2 2h8a2 2 0 0 1 2 2 2 2 0 0 1-2 2H7" />
    </svg>
  );
}

// Row 1, Col 4: Users Network
export function UsersNetworkIcon({ size = 20, color, className, ...props }: IconProps) {
  return (
    <svg {...baseProps(size, color)} className={className} {...props}>
      {/* Top person */}
      <circle cx="12" cy="4" r="2.2" fill="currentColor" />
      <path d="M9 9.5a3 3 0 0 1 6 0V10H9v-.5z" fill="currentColor" />
      {/* Bottom-left person */}
      <circle cx="5" cy="16" r="2.2" fill="currentColor" />
      <path d="M2 21.5a3 3 0 0 1 6 0V22H2v-.5z" fill="currentColor" />
      {/* Bottom-right person */}
      <circle cx="19" cy="16" r="2.2" fill="currentColor" />
      <path d="M16 21.5a3 3 0 0 1 6 0V22h-6v-.5z" fill="currentColor" />
      {/* Triangular network links */}
      <path d="M10 11.5L6.5 15M14 11.5l3.5 3.5M7.5 19.5h9" stroke="currentColor" strokeWidth="1.8" strokeDasharray="2 1.5" strokeLinecap="round" />
    </svg>
  );
}

// Row 2, Col 1: Globe with Pointer
export function GlobePointerIcon({ size = 20, color, className, ...props }: IconProps) {
  return (
    <svg {...baseProps(size, color)} className={className} {...props}>
      <circle cx="11" cy="11" r="9" stroke="currentColor" strokeWidth="2" fill="none" />
      <ellipse cx="11" cy="11" rx="4" ry="9" stroke="currentColor" strokeWidth="1.7" fill="none" />
      <line x1="2" y1="11" x2="20" y2="11" stroke="currentColor" strokeWidth="1.7" />
      {/* Click Pointer */}
      <path d="M15 13l6 6-2.5.5 1.5 3-1.5.8-1.5-3L15 22V13z" fill="currentColor" stroke="var(--bg-white, #fff)" strokeWidth="0.8" />
    </svg>
  );
}

// Row 2, Col 2: Hand Holding Globe
export function HandGlobeIcon({ size = 20, color, className, ...props }: IconProps) {
  return (
    <svg {...baseProps(size, color)} className={className} {...props}>
      {/* Globe */}
      <circle cx="12" cy="7" r="5" stroke="currentColor" strokeWidth="1.8" fill="none" />
      <ellipse cx="12" cy="7" rx="2" ry="5" stroke="currentColor" strokeWidth="1.3" fill="none" />
      <line x1="7" y1="7" x2="17" y2="7" stroke="currentColor" strokeWidth="1.3" />
      {/* Supportive Hand */}
      <path d="M5 14h4l3 2h5a2 2 0 0 1 2 2v1a2 2 0 0 1-2 2h-6l-3-2H4a2 2 0 0 1-2-2v-1a2 2 0 0 1 2-2h1z" fill="currentColor" />
    </svg>
  );
}

// Row 2, Col 3: Global Network Nodes
export function GlobeNetworkIcon({ size = 20, color, className, ...props }: IconProps) {
  return (
    <svg {...baseProps(size, color)} className={className} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M5 8c3 2 5-1 8 1s4 4 6 2" />
      <path d="M4 14c4-1 6 3 9 1s4-3 7-1" />
      <path d="M10 3c2 4 0 7 2 11s-1 5 1 7" />
      {/* Node dots */}
      <circle cx="8" cy="9" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="13" cy="9" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="10" cy="14" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="16" cy="15" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

// Row 2, Col 4: Mesh Network Sphere
export function MeshNetworkIcon({ size = 20, color, className, ...props }: IconProps) {
  return (
    <svg {...baseProps(size, color)} className={className} {...props}>
      <circle cx="12" cy="12" r="9.5" fill="currentColor" />
      {/* Cutout network lines & nodes */}
      <path d="M6 7l6 3 6-3M6 17l6-3 6 3M12 10v4M6 7v10M18 7v10M12 2.5v7.5M12 14v7.5" stroke="var(--bg-white, #fff)" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="12" cy="10" r="1.8" fill="var(--bg-white, #fff)" />
      <circle cx="12" cy="14" r="1.8" fill="var(--bg-white, #fff)" />
      <circle cx="6" cy="12" r="1.8" fill="var(--bg-white, #fff)" />
      <circle cx="18" cy="12" r="1.8" fill="var(--bg-white, #fff)" />
    </svg>
  );
}

// Row 3, Col 1: Satellite Broadcast
export function SatelliteIcon({ size = 20, color, className, ...props }: IconProps) {
  return (
    <svg {...baseProps(size, color)} className={className} {...props}>
      {/* Satellite body angled */}
      <g transform="rotate(-45 10 10)">
        <rect x="7" y="7" width="6" height="6" rx="1" fill="currentColor" />
        {/* Left Solar Panel */}
        <rect x="0" y="8" width="6" height="4" rx="0.5" stroke="currentColor" strokeWidth="1.2" fill="none" />
        <line x1="3" y1="8" x2="3" y2="12" stroke="currentColor" strokeWidth="1" />
        <line x1="6" y1="10" x2="7" y2="10" stroke="currentColor" strokeWidth="1.5" />
        {/* Right Solar Panel */}
        <rect x="14" y="8" width="6" height="4" rx="0.5" stroke="currentColor" strokeWidth="1.2" fill="none" />
        <line x1="17" y1="8" x2="17" y2="12" stroke="currentColor" strokeWidth="1" />
        <line x1="13" y1="10" x2="14" y2="10" stroke="currentColor" strokeWidth="1.5" />
      </g>
      {/* Broadcast waves */}
      <path d="M16 15a4 4 0 0 1 4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
      <path d="M14 18a2 2 0 0 1 2 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
      <path d="M18 12a7 7 0 0 1 5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
    </svg>
  );
}

// Row 3, Col 2: Router Modem with Antenna & Signals
export function RouterSignalIcon({ size = 20, color, className, ...props }: IconProps) {
  return (
    <svg {...baseProps(size, color)} className={className} {...props}>
      {/* Router Base */}
      <rect x="2" y="14" width="16" height="7" rx="3" fill="currentColor" />
      <circle cx="5" cy="17.5" r="1" fill="var(--bg-white, #fff)" />
      <circle cx="8" cy="17.5" r="1" fill="var(--bg-white, #fff)" />
      <circle cx="11" cy="17.5" r="1" fill="var(--bg-white, #fff)" />
      {/* Antenna */}
      <line x1="15" y1="14" x2="15" y2="7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      {/* Signal Waves */}
      <path d="M12 9a3.5 3.5 0 0 1 0-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
      <path d="M10 11a6 6 0 0 1 0-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
      <path d="M18 5a3.5 3.5 0 0 1 0 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
      <path d="M20 3a6 6 0 0 1 0 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
    </svg>
  );
}

// Row 3, Col 3: Wi-Fi Signal Waves
export function WifiSignalIcon({ size = 20, color, className, ...props }: IconProps) {
  return (
    <svg {...baseProps(size, color)} className={className} fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" {...props}>
      <circle cx="12" cy="19" r="1.5" fill="currentColor" stroke="none" />
      <path d="M8.5 15.5a5 5 0 0 1 7 0" />
      <path d="M5 12a10 10 0 0 1 14 0" />
      <path d="M2 8.5a15 15 0 0 1 20 0" />
    </svg>
  );
}

// Row 3, Col 4: Dual Beacon Signal
export function BeaconSignalIcon({ size = 20, color, className, ...props }: IconProps) {
  return (
    <svg {...baseProps(size, color)} className={className} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" {...props}>
      <circle cx="12" cy="12" r="2.2" fill="currentColor" stroke="none" />
      <path d="M9 8a5 5 0 0 0 0 8" />
      <path d="M6 5.5a9 9 0 0 0 0 13" />
      <path d="M3 3a13 13 0 0 0 0 18" />
      <path d="M15 8a5 5 0 0 1 0 8" />
      <path d="M18 5.5a9 9 0 0 1 0 13" />
      <path d="M21 3a13 13 0 0 1 0 18" />
    </svg>
  );
}

// Row 4, Col 1: Smartphone with Wi-Fi
export function PhoneWifiIcon({ size = 20, color, className, ...props }: IconProps) {
  return (
    <svg {...baseProps(size, color)} className={className} {...props}>
      <rect x="5" y="2" width="14" height="20" rx="3" stroke="currentColor" strokeWidth="2" fill="none" />
      <circle cx="12" cy="18.5" r="1" fill="currentColor" />
      {/* Wi-Fi glyph on screen */}
      <circle cx="12" cy="13.5" r="0.8" fill="currentColor" />
      <path d="M10 11.5a3 3 0 0 1 4 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" fill="none" />
      <path d="M8 9.5a5.5 5.5 0 0 1 8 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" fill="none" />
    </svg>
  );
}

// Row 4, Col 2: Smartphone with Pointer
export function PhonePointerIcon({ size = 20, color, className, ...props }: IconProps) {
  return (
    <svg {...baseProps(size, color)} className={className} {...props}>
      <rect x="5" y="2" width="14" height="20" rx="3" stroke="currentColor" strokeWidth="2" fill="none" />
      <circle cx="12" cy="18.5" r="1" fill="currentColor" />
      {/* Pointer Cursor */}
      <path d="M11 7l5 5-2.2.4 1.3 2.7-1.3.7-1.3-2.7L11 15V7z" fill="currentColor" />
    </svg>
  );
}

// Row 4, Col 3: Laptop with Pointer
export function LaptopPointerIcon({ size = 20, color, className, ...props }: IconProps) {
  return (
    <svg {...baseProps(size, color)} className={className} {...props}>
      <rect x="4" y="4" width="16" height="11" rx="2" stroke="currentColor" strokeWidth="2" fill="none" />
      <path d="M2 17h20a1 1 0 0 1 1 1v1H1v-1a1 1 0 0 1 1-1z" fill="currentColor" />
      <line x1="9" y1="18.5" x2="15" y2="18.5" stroke="var(--bg-white, #fff)" strokeWidth="1" strokeLinecap="round" />
      {/* Pointer Cursor */}
      <path d="M13 7l4 4-1.8.3 1 2.2-1 .5-1-2.2L13 13V7z" fill="currentColor" />
    </svg>
  );
}

// Row 4, Col 4: Desktop Monitor with Pointer
export function DesktopPointerIcon({ size = 20, color, className, ...props }: IconProps) {
  return (
    <svg {...baseProps(size, color)} className={className} {...props}>
      <rect x="3" y="3" width="18" height="12" rx="2" stroke="currentColor" strokeWidth="2" fill="none" />
      <path d="M10 15h4v3h-4z" fill="currentColor" />
      <line x1="7" y1="18" x2="17" y2="18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      {/* Pointer Cursor */}
      <path d="M13 6l4 4-1.8.3 1 2.2-1 .5-1-2.2L13 12V6z" fill="currentColor" />
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   2. CORE APPLICATION & COUNSELLING VECTOR UI ICONS (MONOCHROME AESTHETIC)
   ═══════════════════════════════════════════════════════════════════════ */

// Authentic Official WhatsApp Icon
export function WhatsAppIcon({ size = 20, color, className, ...props }: IconProps) {
  return (
    <svg {...baseProps(size, color)} className={className} viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M17.5 14.4c-.3-.1-1.7-.8-1.9-.9-.3-.1-.5-.1-.7.1-.2.3-.8.9-1 1.1-.2.2-.4.2-.7.1-.3-.1-1.3-.5-2.5-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6.1-.1.3-.3.4-.5.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5-.1-.1-.7-1.7-1-2.3-.3-.6-.5-.5-.7-.5h-.6c-.2 0-.6.1-.9.4-.3.3-1.2 1.2-1.2 2.9s1.2 3.4 1.4 3.6c.2.2 2.4 3.7 5.8 5.1.8.3 1.4.5 1.9.7.8.2 1.5.2 2.1.1.7-.1 2.1-.9 2.4-1.7.3-.8.3-1.6.2-1.7-.1-.1-.3-.2-.6-.3z" />
      <path d="M12 2C6.5 2 2 6.5 2 12c0 1.8.5 3.5 1.4 5L2 22l5.2-1.4c1.4.8 3.1 1.3 4.8 1.3 5.5 0 10-4.5 10-10S17.5 2 12 2zm0 18.2c-1.5 0-3-.4-4.3-1.2l-.3-.2-3.2.8.9-3.1-.2-.3C4 14.9 3.6 13.5 3.6 12c0-4.6 3.8-8.4 8.4-8.4 4.6 0 8.4 3.8 8.4 8.4 0 4.6-3.8 8.2-8.4 8.2z" />
    </svg>
  );
}

// Clean Calendar Icon (for Bookings & Dates)
export function CalendarIcon({ size = 20, color, className, ...props }: IconProps) {
  return (
    <svg {...baseProps(size, color)} className={className} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" {...props}>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
      <circle cx="8" cy="14" r="1" fill="currentColor" stroke="none" />
      <circle cx="12" cy="14" r="1" fill="currentColor" stroke="none" />
      <circle cx="16" cy="14" r="1" fill="currentColor" stroke="none" />
      <circle cx="8" cy="18" r="1" fill="currentColor" stroke="none" />
      <circle cx="12" cy="18" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

// Modern Phone Receiver Icon
export function PhoneIcon({ size = 20, color, className, ...props }: IconProps) {
  return (
    <svg {...baseProps(size, color)} className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

// Modern Mail / Envelope Icon
export function MailIcon({ size = 20, color, className, ...props }: IconProps) {
  return (
    <svg {...baseProps(size, color)} className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="M22 7l-10 7L2 7" />
    </svg>
  );
}

// Location / Map Pin
export function MapPinIcon({ size = 20, color, className, ...props }: IconProps) {
  return (
    <svg {...baseProps(size, color)} className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" fill="currentColor" stroke="none" />
    </svg>
  );
}

// Modern Clock Icon
export function ClockIcon({ size = 20, color, className, ...props }: IconProps) {
  return (
    <svg {...baseProps(size, color)} className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

// Confidential Lock Icon
export function LockIcon({ size = 20, color, className, ...props }: IconProps) {
  return (
    <svg {...baseProps(size, color)} className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      <circle cx="12" cy="16" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

// Emergency Alert / Siren Icon
export function SirenIcon({ size = 20, color, className, ...props }: IconProps) {
  return (
    <svg {...baseProps(size, color)} className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 2v3M4.93 4.93l2.12 2.12M19.07 4.93l-2.12 2.12" />
      <path d="M6 18a6 6 0 0 1 12 0H6z" fill="currentColor" />
      <rect x="4" y="18" width="16" height="3" rx="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

// Key / Login Icon
export function KeyIcon({ size = 20, color, className, ...props }: IconProps) {
  return (
    <svg {...baseProps(size, color)} className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="8" cy="15" r="4" />
      <line x1="10.85" y1="12.15" x2="19" y2="4" />
      <line x1="18" y1="5" x2="20" y2="7" />
      <line x1="15" y1="8" x2="17" y2="10" />
    </svg>
  );
}

// Certificate / Registration Document
export function CertificateIcon({ size = 20, color, className, ...props }: IconProps) {
  return (
    <svg {...baseProps(size, color)} className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="3" y="3" width="18" height="14" rx="2" />
      <line x1="7" y1="7" x2="17" y2="7" />
      <line x1="7" y1="11" x2="13" y2="11" />
      {/* Ribbon seal */}
      <circle cx="16" cy="17" r="3" fill="currentColor" stroke="none" />
      <path d="M14.5 19.5L13 22l3-1 3 1-1.5-2.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

// Credit Card / Fee Payment
export function CreditCardIcon({ size = 20, color, className, ...props }: IconProps) {
  return (
    <svg {...baseProps(size, color)} className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <line x1="2" y1="10" x2="22" y2="10" />
      <line x1="6" y1="15" x2="10" y2="15" />
    </svg>
  );
}

// Wrench / Maintenance Tools
export function WrenchIcon({ size = 20, color, className, ...props }: IconProps) {
  return (
    <svg {...baseProps(size, color)} className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    </svg>
  );
}

// Sparkles / Highlights (for Empty states and quality features)
export function SparklesIcon({ size = 20, color, className, ...props }: IconProps) {
  return (
    <svg {...baseProps(size, color)} className={className} fill="currentColor" {...props}>
      <path d="M12 2l2.4 6.6L21 11l-6.6 2.4L12 20l-2.4-6.6L3 11l6.6-2.4L12 2z" />
      <path d="M19 16l1.2 3.3L23.5 20.5l-3.3 1.2L19 25l-1.2-3.3L14.5 20.5l3.3-1.2L19 16z" transform="scale(0.7) translate(8, 2)" />
    </svg>
  );
}

// Hamburger Menu (3 Bars)
export function MenuIcon({ size = 20, color, className, ...props }: IconProps) {
  return (
    <svg {...baseProps(size, color)} className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" {...props}>
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

// Chevron Down (for dropdowns & accordions)
export function ChevronDownIcon({ size = 20, color, className, ...props }: IconProps) {
  return (
    <svg {...baseProps(size, color)} className={className} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

// Chevron Up (for accordions)
export function ChevronUpIcon({ size = 20, color, className, ...props }: IconProps) {
  return (
    <svg {...baseProps(size, color)} className={className} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <polyline points="18 15 12 9 6 15" />
    </svg>
  );
}

// Check Circle (for verified items)
export function CheckCircleIcon({ size = 20, color, className, ...props }: IconProps) {
  return (
    <svg {...baseProps(size, color)} className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

// Arrow Right (for CTAs & links)
export function ArrowRightIcon({ size = 20, color, className, ...props }: IconProps) {
  return (
    <svg {...baseProps(size, color)} className={className} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

// Close Icon (X)
export function CloseIcon({ size = 20, color, className, ...props }: IconProps) {
  return (
    <svg {...baseProps(size, color)} className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   3. SOCIAL MEDIA VECTOR SVG ICONS
   ═══════════════════════════════════════════════════════════════════════ */

export function FacebookIcon({ size = 18, color, className, ...props }: IconProps) {
  return (
    <svg {...baseProps(size, color)} className={className} fill="currentColor" {...props}>
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3V2z" />
    </svg>
  );
}

export function InstagramIcon({ size = 18, color, className, ...props }: IconProps) {
  return (
    <svg {...baseProps(size, color)} className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" strokeWidth="2.5" />
    </svg>
  );
}

export function YouTubeIcon({ size = 18, color, className, ...props }: IconProps) {
  return (
    <svg {...baseProps(size, color)} className={className} fill="currentColor" {...props}>
      <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" />
      <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" fill="var(--bg-white, #fff)" />
    </svg>
  );
}

export function LinkedInIcon({ size = 18, color, className, ...props }: IconProps) {
  return (
    <svg {...baseProps(size, color)} className={className} fill="currentColor" {...props}>
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect x="2" y="9" width="4" height="12" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  );
}

export function TwitterIcon({ size = 18, color, className, ...props }: IconProps) {
  return (
    <svg {...baseProps(size, color)} className={className} fill="currentColor" {...props}>
      {/* Modern X logo */}
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   4. DYNAMIC VECTOR SERVICE ICON RESOLVER
   Maps text keys (e.g. 'network', 'globe', 'laptop', 'wifi', 'share')
   or fallback to customized SVGs in the exact requested monochrome style.
   ═══════════════════════════════════════════════════════════════════════ */

export function DynamicVectorIcon({ name, size = 32, className }: { name?: string; size?: number; className?: string }) {
  if (!name) return <GlobeNetworkIcon size={size} className={className} />;

  const lower = name.toLowerCase().trim();

  // Match against user's specific vector icon grid
  if (lower.includes("share")) return <ShareNodesIcon size={size} className={className} />;
  if (lower.includes("www") || lower.includes("browser") || lower.includes("web")) return <BrowserWwwIcon size={size} className={className} />;
  if (lower.includes("cable") || lower.includes("wire") || lower.includes("connect")) return <EthernetCableIcon size={size} className={className} />;
  if (lower.includes("team") || lower.includes("group") || lower.includes("users") || lower.includes("network")) return <UsersNetworkIcon size={size} className={className} />;
  if (lower.includes("pointer") || lower.includes("click")) return <GlobePointerIcon size={size} className={className} />;
  if (lower.includes("hand") || lower.includes("care") || lower.includes("support")) return <HandGlobeIcon size={size} className={className} />;
  if (lower.includes("mesh")) return <MeshNetworkIcon size={size} className={className} />;
  if (lower.includes("satellite") || lower.includes("space")) return <SatelliteIcon size={size} className={className} />;
  if (lower.includes("router") || lower.includes("modem")) return <RouterSignalIcon size={size} className={className} />;
  if (lower.includes("wifi") || lower.includes("wireless")) return <WifiSignalIcon size={size} className={className} />;
  if (lower.includes("signal") || lower.includes("beacon") || lower.includes("broadcast")) return <BeaconSignalIcon size={size} className={className} />;
  if (lower.includes("mobile") || lower.includes("phone")) return <PhoneWifiIcon size={size} className={className} />;
  if (lower.includes("laptop")) return <LaptopPointerIcon size={size} className={className} />;
  if (lower.includes("desktop") || lower.includes("computer") || lower.includes("screen")) return <DesktopPointerIcon size={size} className={className} />;
  if (lower.includes("calendar") || lower.includes("booking")) return <CalendarIcon size={size} className={className} />;
  if (lower.includes("target") || lower.includes("goal") || lower.includes("career")) return <GlobeNetworkIcon size={size} className={className} />;

  // If it's a raw Unicode emoji (e.g. 🎯 or 💻), display gracefully with balanced font size
  return <span style={{ fontSize: `${size}px`, lineHeight: 1, display: "inline-block" }}>{name}</span>;
}

export function SearchIcon({ size = 18, color, className, ...props }: IconProps) {
  return (
    <svg {...baseProps(size, color)} className={className} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" {...props}>
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}
