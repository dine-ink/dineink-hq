// Single source of truth for font sizes, weights, and letter-spacing. The
// scale below is not invented — it's the exact set of pixel sizes already in
// organic, consistent use across the app (a repo-wide audit found these 15
// values and no others), now given semantic names so a future resize means
// editing one entry here instead of a find-and-replace across hundreds of
// `text-[Npx]` occurrences.

export const fontSize = {
  micro: "8px", // rare: dense inline badges
  caption: "9px", // uppercase eyebrow labels, tiny sub-text
  overline: "10px", // the single most common "label" size (KPI card labels, table headers)
  xs: "11px", // secondary text, table body (dense tables)
  sm: "12px", // the app's default body-text size
  base: "13px", // slightly emphasized body text, form labels
  md: "14px",
  lg: "15px", // card/section sub-headings
  xl: "16px",
  "2xl": "17px", // drawer/dialog titles
  "3xl": "18px", // page section titles
  "4xl": "20px",
  "5xl": "22px", // KPI card headline numbers
  "6xl": "24px",
  "7xl": "28px", // rare: hero/landing-page numerals
} as const;

export const fontWeight = {
  normal: "400",
  medium: "500",
  semibold: "600",
  bold: "700",
  extrabold: "800",
  black: "900",
} as const;

// Matches the app's existing uppercase-label convention (e.g. KPI card
// labels, table header cells) — pick the widest one already used nearby
// rather than inventing a new value.
export const letterSpacing = {
  normal: "normal",
  wide: "0.025em", // Tailwind's tracking-wide, used for most uppercase labels
  wider: "0.05em",
  widest: "0.1em",
  label: "0.12em", // uppercase KPI/table-header labels
  labelWide: "0.14em", // the single most common uppercase-label tracking
  labelWidest: "0.18em",
} as const;

export const lineHeight = {
  tight: "1.1", // large headline numbers
  snug: "1.25",
  normal: "1.5",
  relaxed: "1.6", // body copy, descriptions
} as const;

// Named, composed text styles for the most common UI roles — prefer these
// over assembling size/weight/tracking by hand in a new component.
export const textStyle = {
  pageTitle: { fontSize: fontSize["3xl"], fontWeight: fontWeight.black, letterSpacing: letterSpacing.normal },
  sectionTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, letterSpacing: letterSpacing.normal },
  cardLabel: { fontSize: fontSize.overline, fontWeight: fontWeight.bold, letterSpacing: letterSpacing.labelWide },
  metricValue: { fontSize: fontSize["5xl"], fontWeight: fontWeight.bold, letterSpacing: letterSpacing.normal },
  body: { fontSize: fontSize.sm, fontWeight: fontWeight.normal, letterSpacing: letterSpacing.normal },
  caption: { fontSize: fontSize.xs, fontWeight: fontWeight.normal, letterSpacing: letterSpacing.normal },
} as const;

export const typography = { fontSize, fontWeight, letterSpacing, lineHeight, textStyle } as const;
export default typography;
