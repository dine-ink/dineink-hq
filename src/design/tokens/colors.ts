// Single source of truth for every color used in the app. These exact hex
// values are grounded in what's already on screen today (a repo-wide audit
// found #b10000 used 327 times as the brand color, with #950000/#8f0000/
// #7a0000 already in use as its hover/active shades) — this file formalizes
// the palette that was already organically consistent, rather than
// introducing a new one. Changing the brand, or any status color, means
// editing the one scale below; every consumer (Tailwind utilities via
// src/design/theme, and any JS/chart code that needs a raw hex) reads from
// here.
//
// Each brand/status color is a 50-900 scale (50 = lightest tint, 900 =
// darkest shade), following the same convention Tailwind's own palette uses.

export const primary = {
  50: "#fef2f2",
  100: "#fde3e3",
  200: "#fbc7c7",
  300: "#f59999",
  400: "#ea6060",
  500: "#d92b2b",
  600: "#b10000", // brand red — the app's single most-used color
  700: "#950000", // hover
  800: "#8f0000", // active/pressed
  900: "#7a0000", // darkest, reserved for text-on-light-red contexts
} as const;

// A distinct secondary accent (violet), already used throughout the app to
// mark a second, non-primary category of KPI/status (e.g. "AI"-tagged
// cards, secondary chart series) — formalized here rather than left as a
// bare Tailwind violet-500 sprinkled through individual files.
export const secondary = {
  50: "#f5f3ff",
  100: "#ede9fe",
  200: "#ddd6fe",
  300: "#c4b5fd",
  400: "#a78bfa",
  500: "#8b5cf6",
  600: "#7c3aed",
  700: "#6d28d9",
  800: "#5b21b6",
  900: "#4c1d95",
} as const;

export const success = {
  50: "#ecfdf5",
  100: "#d1fae5",
  200: "#a7f3d0",
  300: "#6ee7b7",
  400: "#34d399",
  500: "#10b981",
  600: "#059669",
  700: "#047857",
  800: "#065f46",
  900: "#064e3b",
} as const;

export const warning = {
  50: "#fffbeb",
  100: "#fef3c7",
  200: "#fde68a",
  300: "#fcd34d",
  400: "#fbbf24",
  500: "#f59e0b",
  600: "#d97706",
  700: "#b45309",
  800: "#92400e",
  900: "#78350f",
} as const;

// The app's "bad/negative" status color (badges, error text, destructive
// actions) — distinct from `primary`, which is the brand color, not a
// semantic danger signal. Matches Tailwind's own red-50..900 exactly, since
// that's what nearly every danger/error usage in the app already resolves
// to today.
export const danger = {
  50: "#fef2f2",
  100: "#fee2e2",
  200: "#fecaca",
  300: "#fca5a5",
  400: "#f87171",
  500: "#ef4444",
  600: "#dc2626",
  700: "#b91c1c",
  800: "#991b1b",
  900: "#7f1d1d",
} as const;

export const info = {
  50: "#eff6ff",
  100: "#dbeafe",
  200: "#bfdbfe",
  300: "#93c5fd",
  400: "#60a5fa",
  500: "#3b82f6",
  600: "#2563eb",
  700: "#1d4ed8",
  800: "#1e40af",
  900: "#1e3a8a",
} as const;

// Neutral grays — page chrome, text, borders, dividers.
export const neutral = {
  0: "#ffffff",
  50: "#f8fafc",
  100: "#f1f5f9",
  200: "#e2e8f0",
  300: "#cbd5e1",
  400: "#9ca3af",
  500: "#6b7280",
  600: "#4b5563",
  700: "#374151",
  800: "#1f2937",
  900: "#0f172a",
} as const;

// Semantic surface roles, composed from the scales above. Prefer these over
// reaching for `neutral.100` etc. directly in a new component — they name
// *what the color is for*, which is what stays stable even if the
// underlying gray shade is ever retuned.
export const surface = {
  page: "#f5f6fa", // main app background, behind every page's cards
  card: neutral[0], // card/panel background
  border: neutral[100], // default card/divider border
  borderStrong: neutral[200], // input borders, table borders
  overlay: "rgba(15, 23, 42, 0.4)", // modal/drawer backdrop
} as const;

export const text = {
  primary: neutral[900], // headings, primary content
  secondary: neutral[700], // body text
  muted: neutral[500], // captions, sub-labels, timestamps
  faint: neutral[400], // placeholders, disabled text
  onPrimary: neutral[0], // text on top of a primary/brand-colored surface
  link: primary[600],
} as const;

export const interactive = {
  hover: primary[700],
  active: primary[800],
  selected: primary[50], // selected row/tab background
  selectedBorder: primary[200],
  disabledBg: neutral[100],
  disabledText: neutral[400],
  focusRing: info[500], // visible keyboard-focus ring color (accessibility)
} as const;

// The recurring bg/text/border trio used for every status pill, alert
// banner, and badge in the app (previously duplicated ad hoc — see
// ALERT_STYLES in the old kpiStyles.ts). One definition per semantic status,
// reused by <StatusChip>, <Badge>, and the four <Alert> variants.
export const statusStyles = {
  success: { bg: success[50], text: success[700], border: success[200] },
  warning: { bg: warning[50], text: warning[700], border: warning[200] },
  danger: { bg: danger[50], text: danger[700], border: danger[200] },
  info: { bg: info[50], text: info[700], border: info[200] },
  neutral: { bg: neutral[100], text: neutral[600], border: neutral[200] },
} as const;

// The 7-color qualitative palette already duplicated across BranchComparison,
// Report, and MenuManagement's pie/bar charts (recharts needs raw hex, not
// Tailwind classes, so this list is the JS-side counterpart to the palette
// above) — one array, reused by every chart in the app instead of each page
// re-declaring its own copy.
export const chartPalette = [
  danger[500],
  info[500],
  success[500],
  warning[500],
  secondary[500],
  "#ec4899", // pink — rounds out the qualitative palette for a 6th/7th series
  "#f97316", // orange
] as const;

export const colors = {
  primary,
  secondary,
  success,
  warning,
  danger,
  info,
  neutral,
  surface,
  text,
  interactive,
  statusStyles,
  chartPalette,
} as const;

export type StatusKey = keyof typeof statusStyles;
export default colors;
