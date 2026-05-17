// Custom Safiri icon set — hand-drawn SVGs, not icon library copies
// All icons: 24×24 viewBox, 1.8px stroke, rounded caps/joins

const base = {
  fill: 'none',
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
}

/* ── Tab bar icons ── */

// Budget: card face with transaction lines + balance dot
export function BudgetIcon({ size = 24, stroke = 'currentColor', ...p }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" stroke={stroke} {...base} {...p}>
      <rect x="2.5" y="5.5" width="19" height="14" rx="3.5" strokeWidth="1.8" />
      <path d="M2.5 10h19" strokeWidth="1.8" />
      <path d="M7 14.5h3.5" strokeWidth="2" />
      <path d="M7 17h2" strokeWidth="2" />
      <circle cx="17.5" cy="15.5" r="2" strokeWidth="1.6" />
      <path d="M17.5 14v.4M17.5 17v.4M16.1 14.85l.35.2M18.65 16.3l.35.2M16.1 16.3l.35-.2M18.65 14.85l.35-.2" strokeWidth="1.2" />
    </svg>
  )
}

// Plan: journey route — start pin → curved path → stop dot → end flag
export function PlanIcon({ size = 24, stroke = 'currentColor', ...p }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" stroke={stroke} {...base} {...p}>
      <circle cx="5" cy="8" r="2.2" strokeWidth="1.8" />
      <path d="M5 10.2C5 13 8 13 8 16s3 3.5 3 3.5" strokeWidth="1.8" />
      <circle cx="11" cy="19.5" r="1.6" strokeWidth="1.6" />
      <path d="M8 5.5c2-2 5-2 7 0s5 2 7 0" strokeWidth="1.8" />
      <path d="M15 5.5v7l2-1.5 2 1.5V5.5" strokeWidth="1.8" />
    </svg>
  )
}

// Afford: balance scale with a coin pan — the "can we afford?" check
export function AffordIcon({ size = 24, stroke = 'currentColor', ...p }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" stroke={stroke} {...base} {...p}>
      <line x1="12" y1="4" x2="12" y2="20" strokeWidth="1.8" />
      <line x1="7" y1="20" x2="17" y2="20" strokeWidth="1.8" />
      <line x1="4" y1="8" x2="20" y2="8" strokeWidth="1.8" />
      <path d="M4 8 L2 13 C2 15 6 15 6 13 Z" strokeWidth="1.6" />
      <path d="M20 8 L18 13 C18 15 22 15 22 13 Z" strokeWidth="1.6" />
      <path d="M10.5 11.5 L12 10 L13.5 11.5" strokeWidth="1.5" />
    </svg>
  )
}

// More: a 3×2 tile grid (app launcher style)
export function MoreIcon({ size = 24, stroke = 'currentColor', ...p }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" stroke={stroke} {...base} {...p}>
      <rect x="3" y="3" width="7" height="7" rx="2" strokeWidth="1.7" />
      <rect x="14" y="3" width="7" height="7" rx="2" strokeWidth="1.7" />
      <rect x="3" y="14" width="7" height="7" rx="2" strokeWidth="1.7" />
      <rect x="14" y="14" width="7" height="7" rx="2" strokeWidth="1.7" />
    </svg>
  )
}

/* ── More menu icons ── */

// Setup: three sliders at different heights (settings/configure)
export function SetupIcon({ size = 20, stroke = 'currentColor', ...p }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" stroke={stroke} {...base} {...p}>
      <line x1="4" y1="6" x2="20" y2="6" strokeWidth="1.8" />
      <line x1="4" y1="12" x2="20" y2="12" strokeWidth="1.8" />
      <line x1="4" y1="18" x2="20" y2="18" strokeWidth="1.8" />
      <circle cx="8" cy="6" r="2.5" strokeWidth="1.6" fill="var(--color-bg)" />
      <circle cx="16" cy="12" r="2.5" strokeWidth="1.6" fill="var(--color-bg)" />
      <circle cx="10" cy="18" r="2.5" strokeWidth="1.6" fill="var(--color-bg)" />
    </svg>
  )
}

// Members: two person silhouettes side by side
export function MembersIcon({ size = 20, stroke = 'currentColor', ...p }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" stroke={stroke} {...base} {...p}>
      <circle cx="9" cy="7" r="3" strokeWidth="1.8" />
      <path d="M3 20c0-4 2.7-6 6-6s6 2 6 6" strokeWidth="1.8" />
      <circle cx="17" cy="7" r="2.5" strokeWidth="1.6" />
      <path d="M21 20c0-3.3-2-5-4.5-5" strokeWidth="1.6" />
    </svg>
  )
}

// Settle: two arrows crossing — money changing hands
export function SettleIcon({ size = 20, stroke = 'currentColor', ...p }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" stroke={stroke} {...base} {...p}>
      <path d="M5 8h14M5 8l3-3M5 8l3 3" strokeWidth="1.8" />
      <path d="M19 16H5M19 16l-3-3M19 16l-3 3" strokeWidth="1.8" />
    </svg>
  )
}

// Checklist: paper with two checkbox rows
export function ChecklistIcon({ size = 20, stroke = 'currentColor', ...p }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" stroke={stroke} {...base} {...p}>
      <rect x="4" y="3" width="16" height="18" rx="3" strokeWidth="1.8" />
      <rect x="7.5" y="8" width="3.5" height="3.5" rx="1" strokeWidth="1.5" />
      <path d="M8.5 9.5l1 1 1.5-1.5" strokeWidth="1.4" />
      <line x1="14" y1="9" x2="17" y2="9" strokeWidth="1.6" />
      <line x1="14" y1="11" x2="16" y2="11" strokeWidth="1.6" />
      <rect x="7.5" y="14" width="3.5" height="3.5" rx="1" strokeWidth="1.5" />
      <line x1="14" y1="15" x2="17" y2="15" strokeWidth="1.6" />
      <line x1="14" y1="17" x2="16" y2="17" strokeWidth="1.6" />
    </svg>
  )
}

// Vault: a folder with a lock tab
export function VaultIcon({ size = 20, stroke = 'currentColor', ...p }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" stroke={stroke} {...base} {...p}>
      <path d="M3 8c0-1.1.9-2 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8z" strokeWidth="1.8" />
      <rect x="10" y="12" width="4" height="3.5" rx="1" strokeWidth="1.5" />
      <path d="M11 12v-1.2a1 1 0 0 1 2 0V12" strokeWidth="1.5" />
    </svg>
  )
}

// Add / FAB icon (larger, bolder)
export function AddIcon({ size = 26, stroke = 'currentColor', ...p }) {
  return (
    <svg width={size} height={size} viewBox="0 0 26 26" stroke={stroke} {...base} {...p}>
      <line x1="13" y1="5" x2="13" y2="21" strokeWidth="2.5" />
      <line x1="5" y1="13" x2="21" y2="13" strokeWidth="2.5" />
    </svg>
  )
}

// Back arrow (used in onboarding / setup)
export function BackIcon({ size = 22, stroke = 'currentColor', ...p }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" stroke={stroke} {...base} {...p}>
      <path d="M19 12H5M5 12l6-6M5 12l6 6" strokeWidth="1.9" />
    </svg>
  )
}

// Forward / Continue arrow
export function ForwardIcon({ size = 18, stroke = 'currentColor', ...p }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" stroke={stroke} {...base} {...p}>
      <path d="M5 12h14M14 7l5 5-5 5" strokeWidth="2" />
    </svg>
  )
}

// Users / group (for the member count badge)
export function GroupIcon({ size = 14, stroke = 'currentColor', ...p }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" stroke={stroke} {...base} {...p}>
      <circle cx="9" cy="8" r="3" strokeWidth="1.9" />
      <path d="M3 20c0-3.5 2.5-5.5 6-5.5s6 2 6 5.5" strokeWidth="1.9" />
      <circle cx="17" cy="8" r="2.5" strokeWidth="1.6" />
      <path d="M21 20c0-3-1.8-4.8-4.2-5" strokeWidth="1.6" />
    </svg>
  )
}

// Calendar (used in countdown/dates)
export function CalendarIcon({ size = 16, stroke = 'currentColor', ...p }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" stroke={stroke} {...base} {...p}>
      <rect x="3" y="5" width="18" height="17" rx="3" strokeWidth="1.8" />
      <line x1="3" y1="10" x2="21" y2="10" strokeWidth="1.8" />
      <line x1="8" y1="3" x2="8" y2="7" strokeWidth="1.8" />
      <line x1="16" y1="3" x2="16" y2="7" strokeWidth="1.8" />
      <circle cx="8" cy="15" r="1.2" fill={stroke} strokeWidth="0" />
      <circle cx="12" cy="15" r="1.2" fill={stroke} strokeWidth="0" />
      <circle cx="16" cy="15" r="1.2" fill={stroke} strokeWidth="0" />
    </svg>
  )
}

// Trend down (expense log)
export function TrendIcon({ size = 18, stroke = 'currentColor', ...p }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" stroke={stroke} {...base} {...p}>
      <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" strokeWidth="1.9" />
      <polyline points="17 18 23 18 23 12" strokeWidth="1.9" />
    </svg>
  )
}

// Zap / quick action
export function ZapIcon({ size = 18, stroke = 'currentColor', ...p }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" stroke={stroke} {...base} {...p}>
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" strokeWidth="1.9" />
    </svg>
  )
}

// ChevronRight
export function ChevronRightIcon({ size = 14, stroke = 'currentColor', ...p }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" stroke={stroke} {...base} {...p}>
      <path d="M9 18l6-6-6-6" strokeWidth="2" />
    </svg>
  )
}

// Train (SGR)
export function TrainIcon({ size = 20, stroke = 'currentColor', ...p }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" stroke={stroke} {...base} {...p}>
      <rect x="5" y="3" width="14" height="14" rx="3" strokeWidth="1.8" />
      <line x1="5" y1="10" x2="19" y2="10" strokeWidth="1.8" />
      <line x1="9" y1="3" x2="9" y2="10" strokeWidth="1.5" />
      <line x1="15" y1="3" x2="15" y2="10" strokeWidth="1.5" />
      <path d="M8 17l-2 4M16 17l2 4" strokeWidth="1.8" />
      <line x1="6" y1="21" x2="18" y2="21" strokeWidth="1.8" />
    </svg>
  )
}

// Car
export function CarIcon({ size = 20, stroke = 'currentColor', ...p }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" stroke={stroke} {...base} {...p}>
      <path d="M5 11L7 5h10l2 6" strokeWidth="1.8" />
      <rect x="2" y="11" width="20" height="7" rx="2" strokeWidth="1.8" />
      <circle cx="7" cy="18" r="2" strokeWidth="1.8" />
      <circle cx="17" cy="18" r="2" strokeWidth="1.8" />
      <line x1="9" y1="18" x2="15" y2="18" strokeWidth="1.8" />
    </svg>
  )
}

// MapPin
export function MapPinIcon({ size = 14, stroke = 'currentColor', ...p }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" stroke={stroke} {...base} {...p}>
      <path d="M12 22s-8-7.5-8-13a8 8 0 1 1 16 0c0 5.5-8 13-8 13z" strokeWidth="1.8" />
      <circle cx="12" cy="9" r="2.5" strokeWidth="1.7" />
    </svg>
  )
}

// Wallet (budget/money)
export function WalletIcon({ size = 16, stroke = 'currentColor', ...p }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" stroke={stroke} {...base} {...p}>
      <path d="M20 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z" strokeWidth="1.8" />
      <path d="M16 3l-4 4-4-4" strokeWidth="1.8" />
      <circle cx="17" cy="13" r="1.5" strokeWidth="0" fill={stroke} />
    </svg>
  )
}

// Pencil / edit
export function PencilIcon({ size = 16, stroke = 'currentColor', ...p }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" stroke={stroke} {...base} {...p}>
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" strokeWidth="1.8" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" strokeWidth="1.8" />
    </svg>
  )
}

// Share / upload-box
export function ShareIcon({ size = 20, stroke = 'currentColor', ...p }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" stroke={stroke} {...base} {...p}>
      <path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7" strokeWidth="1.8" />
      <polyline points="16 6 12 2 8 6" strokeWidth="1.8" />
      <line x1="12" y1="2" x2="12" y2="15" strokeWidth="1.8" />
    </svg>
  )
}

// X close
export function CloseIcon({ size = 20, stroke = 'currentColor', ...p }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" stroke={stroke} {...base} {...p}>
      <line x1="18" y1="6" x2="6" y2="18" strokeWidth="2" />
      <line x1="6" y1="6" x2="18" y2="18" strokeWidth="2" />
    </svg>
  )
}

export function HomeIcon({ size = 20, stroke = 'currentColor', ...p }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" stroke={stroke} {...base} {...p}>
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" strokeWidth="1.8" />
      <polyline points="9 22 9 12 15 12 15 22" strokeWidth="1.8" />
    </svg>
  )
}

export function LogOutIcon({ size = 20, stroke = 'currentColor', ...p }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" stroke={stroke} {...base} {...p}>
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" strokeWidth="1.8" />
      <polyline points="16 17 21 12 16 7" strokeWidth="1.8" />
      <line x1="21" y1="12" x2="9" y2="12" strokeWidth="1.8" />
    </svg>
  )
}

export function SettingsIcon({ size = 20, stroke = 'currentColor', ...p }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" stroke={stroke} {...base} {...p}>
      <circle cx="12" cy="12" r="3" strokeWidth="1.8" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" strokeWidth="1.8" />
    </svg>
  )
}

// Tour / compass — used for "Show tour" menu item
export function TourIcon({ size = 20, stroke = 'currentColor', ...p }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" stroke={stroke} {...base} {...p}>
      <circle cx="12" cy="12" r="9" strokeWidth="1.8" />
      <polygon points="16.24,7.76 14.12,14.12 7.76,16.24 9.88,9.88" strokeWidth="1.6" />
      <circle cx="12" cy="12" r="1.5" strokeWidth="0" fill={stroke} />
    </svg>
  )
}

// Download arrow — used for CSV export
export function DownloadIcon({ size = 20, stroke = 'currentColor', ...p }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" stroke={stroke} {...base} {...p}>
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" strokeWidth="1.8" />
      <polyline points="7 10 12 15 17 10" strokeWidth="1.8" />
      <line x1="12" y1="15" x2="12" y2="3" strokeWidth="1.8" />
    </svg>
  )
}
