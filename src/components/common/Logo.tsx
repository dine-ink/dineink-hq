import {
  logoSizes,
  logoTones,
  type LogoSize,
  type LogoTone,
} from "./logoTokens";

/**
 * The DineInk brand lockup — a boxed "D" mark plus a two-tone "DineInk"
 * wordmark. Matches the top bar in DineInk POS so the two products read as
 * one brand. See ./logoTokens for the palettes and sizes.
 */

/** The two-tone wordmark without the boxed mark. */
export function LogoWordmark({
  tone = "onLight",
  size = "md",
  subtitle,
}: {
  tone?: LogoTone;
  size?: LogoSize;
  subtitle?: string;
}) {
  const s = logoSizes[size];
  const t = logoTones[tone];

  return (
    <span className="min-w-0">
      <span
        className={`block truncate leading-none font-bold tracking-tight ${s.word}`}
      >
        <span className={t.dine}>Dine</span>
        <span className={t.ink}>Ink</span>
      </span>
      {subtitle && (
        <span
          className={`mt-1 block truncate leading-none font-semibold tracking-[0.15em] uppercase ${s.subtitle} ${t.subtitle}`}
        >
          {subtitle}
        </span>
      )}
    </span>
  );
}

export default function Logo({
  tone = "onLight",
  size = "md",
  subtitle,
  markOnly = false,
  className = "",
}: {
  tone?: LogoTone;
  size?: LogoSize;
  subtitle?: string;
  markOnly?: boolean;
  className?: string;
}) {
  const s = logoSizes[size];
  const t = logoTones[tone];

  return (
    <span className={`inline-flex items-center ${s.gap} ${className}`}>
      <span
        aria-hidden="true"
        className={`flex shrink-0 items-center justify-center font-bold ${s.box} ${t.box} ${s.letter}`}
      >
        D
      </span>
      {!markOnly && <LogoWordmark tone={tone} size={size} subtitle={subtitle} />}
      <span className="sr-only">DineInk</span>
    </span>
  );
}
