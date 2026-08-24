/**
 * Shared tokens for the DineInk brand lockup, kept out of Logo.tsx so that file
 * only exports components (react-refresh/only-export-components).
 *
 * `tone` picks the palette for the background the logo sits on:
 *   - "onColor" — on the brand red or any dark surface (white / red-200 text)
 *   - "onLight" — on white or a pale surface (slate-900 / brand-red text)
 */

export type LogoTone = "onLight" | "onColor";
export type LogoSize = "sm" | "md" | "lg";

export const logoSizes = {
  sm: {
    box: "h-8 w-8 rounded-lg",
    letter: "text-sm",
    word: "text-sm",
    subtitle: "text-[0.5625rem]",
    gap: "gap-2",
  },
  md: {
    box: "h-10 w-10 rounded-xl",
    letter: "text-lg",
    word: "text-xl",
    subtitle: "text-[10px]",
    gap: "gap-3",
  },
  lg: {
    box: "h-12 w-12 rounded-2xl",
    letter: "text-xl",
    word: "text-3xl",
    subtitle: "text-xs",
    gap: "gap-3",
  },
} as const;

export const logoTones = {
  onLight: {
    box: "bg-[#b10000] text-white ring-1 ring-red-900/10",
    dine: "text-slate-900",
    ink: "text-[#b10000]",
    subtitle: "text-slate-500",
  },
  onColor: {
    box: "bg-white/20 text-white ring-1 ring-white/25",
    dine: "text-white",
    ink: "text-red-200",
    subtitle: "text-white/60",
  },
} as const;

/**
 * The boxed "D" on its own, as class names. Use this when the mark has to live
 * inside an element that is already interactive (a collapse toggle, say) and so
 * cannot be wrapped in <Logo />.
 */
export function logoMarkClasses(
  tone: LogoTone = "onLight",
  size: LogoSize = "md",
) {
  const s = logoSizes[size];
  return `flex shrink-0 items-center justify-center font-bold ${s.box} ${logoTones[tone].box} ${s.letter}`;
}
