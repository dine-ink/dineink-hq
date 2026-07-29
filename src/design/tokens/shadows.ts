// Single source of truth for elevation. Matches Tailwind's default shadow
// scale (already what the app uses — shadow-sm alone accounts for the vast
// majority of shadow usage repo-wide), assigned to the semantic elevation
// roles the brief calls out.

export const shadowScale = {
  none: "none",
  sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
  md: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
  lg: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
  xl: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
  "2xl": "0 25px 50px -12px rgb(0 0 0 / 0.25)",
} as const;

export const elevation = {
  card: shadowScale.sm, // the app's default card elevation
  cardHover: shadowScale.md,
  dropdown: shadowScale.lg,
  popover: shadowScale.lg,
  dialog: shadowScale.xl,
  drawer: shadowScale["2xl"],
  ...shadowScale,
} as const;

export default elevation;
