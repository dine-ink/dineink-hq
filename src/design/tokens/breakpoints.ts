// Single source of truth for responsive breakpoints. Matches Tailwind's
// defaults, which the app already uses consistently (sm/md/lg/xl account
// for every responsive prefix found repo-wide) — named here for the
// device-class roles the brief calls out, and for any JS-side responsive
// logic (e.g. a useBreakpoint hook) that can't reach for a Tailwind prefix.

export const breakpoints = {
  mobile: "0px",
  tablet: "640px", // Tailwind `sm`
  laptop: "1024px", // Tailwind `lg`
  desktop: "1280px", // Tailwind `xl`
  wide: "1536px", // Tailwind `2xl`
} as const;

// Tailwind-prefix aliases, for code that composes class names dynamically
// (e.g. `` `${bp.laptop}:grid-cols-3` ``) instead of hardcoding "lg".
export const bp = {
  tablet: "sm",
  laptop: "lg",
  desktop: "xl",
  wide: "2xl",
} as const;

export default breakpoints;
