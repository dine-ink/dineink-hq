import type { HTMLAttributes, ReactNode } from "react";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  /** Removes the default padding — use when the card owns a <SectionHeader> + custom content that manages its own spacing. */
  noPadding?: boolean;
}

// The base bordered/rounded/shadowed container used everywhere in the app
// (rounded-xl border border-gray-200 bg-white shadow-sm, duplicated as a
// literal string hundreds of times). Every other card in this folder
// (MetricCard, ChartCard, InfoCard) builds on top of this one.
export function Card({ children, noPadding = false, className = "", ...rest }: CardProps) {
  return (
    <div
      className={`overflow-hidden rounded-card border border-surface-border bg-surface-card shadow-card ${noPadding ? "" : "p-4"} ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}

export default Card;
