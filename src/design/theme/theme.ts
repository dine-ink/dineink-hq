// The single JS-side entry point for the design system — components that
// need a raw token value (chart colors, inline style values that can't be
// expressed as a Tailwind class) should import `theme` from here rather
// than reaching into individual token files directly.
import { colors } from "../tokens/colors";
import { spacing } from "../tokens/spacing";
import { typography } from "../tokens/typography";
import { radius } from "../tokens/radius";
import { elevation } from "../tokens/shadows";
import { breakpoints, bp } from "../tokens/breakpoints";
import { transitions } from "../tokens/transitions";
import { zIndex } from "../tokens/zIndex";

export const theme = {
  colors,
  spacing,
  typography,
  radius,
  elevation,
  breakpoints,
  bp,
  transitions,
  zIndex,
} as const;

export type Theme = typeof theme;
export default theme;
