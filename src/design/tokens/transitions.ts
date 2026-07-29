// Single source of truth for animation timing. Matches what's already
// consistently used across the app (duration-200 is the dominant timing for
// hover/focus micro-interactions; 300/500ms show up for larger movements
// like dialogs/drawers).

export const duration = {
  instant: "0ms",
  fast: "150ms",
  base: "200ms", // hover, focus, color/background transitions — the app's default
  moderate: "300ms", // dialog/drawer open-close
  slow: "500ms", // large layout shifts
} as const;

export const easing = {
  linear: "linear",
  easeIn: "cubic-bezier(0.4, 0, 1, 1)",
  easeOut: "cubic-bezier(0, 0, 0.2, 1)",
  easeInOut: "cubic-bezier(0.4, 0, 0.2, 1)",
} as const;

// Named, ready-to-use transition presets for the interaction roles the
// brief calls out.
export const transitionPreset = {
  hover: `background-color ${duration.base} ${easing.easeInOut}, color ${duration.base} ${easing.easeInOut}, border-color ${duration.base} ${easing.easeInOut}`,
  focus: `box-shadow ${duration.fast} ${easing.easeOut}`,
  navigation: `transform ${duration.moderate} ${easing.easeInOut}, opacity ${duration.moderate} ${easing.easeInOut}`,
  dialog: `transform ${duration.moderate} ${easing.easeOut}, opacity ${duration.moderate} ${easing.easeOut}`,
  drawer: `transform ${duration.moderate} ${easing.easeInOut}`,
} as const;

export const transitions = { duration, easing, transitionPreset } as const;
export default transitions;
