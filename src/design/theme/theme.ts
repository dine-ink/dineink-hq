// The single JS-side entry point for the design system — components that
// need a raw token value (chart colors, inline style values that can't be
// expressed as a Tailwind class) should import `theme` from here rather
// than reaching into individual token files directly.
import { colors } from "@/design/tokens/colors";
import { spacing } from "@/design/tokens/spacing";
import { typography } from "@/design/tokens/typography";
import { radius } from "@/design/tokens/radius";
import { elevation } from "@/design/tokens/shadows";
import { breakpoints, bp } from "@/design/tokens/breakpoints";
import { transitions } from "@/design/tokens/transitions";
import { zIndex } from "@/design/tokens/zIndex";

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
