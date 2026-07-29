// Single source of truth for border radius. Values match Tailwind's
// defaults (already what the app uses); this file assigns each one a
// semantic role so a component reaches for `radius.button`, not a bare
// `rounded-lg`, and a future radius change is one edit here.

export const radiusScale = {
  none: "0px",
  sm: "4px",
  md: "8px",
  lg: "12px", // buttons, inputs — matches the app's existing rounded-lg
  xl: "16px", // cards, panels — the app's single most-used radius (rounded-xl)
  "2xl": "20px", // dialogs, larger containers (rounded-2xl)
  "3xl": "28px", // rare, large hero panels (rounded-3xl)
  full: "9999px", // pills, avatars, badges (rounded-full)
} as const;

export const radius = {
  button: radiusScale.lg,
  // Matches actual existing usage (Login, Bills' search box, every other
  // form input in the app) — inputs share the card radius, not the button
  // radius, despite both being "form controls" in the abstract.
  input: radiusScale.xl,
  card: radiusScale.xl,
  dialog: radiusScale["2xl"],
  table: radiusScale.xl,
  tag: radiusScale.full,
  avatar: radiusScale.full,
  ...radiusScale,
} as const;

export default radius;
