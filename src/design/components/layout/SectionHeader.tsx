import type { ReactNode } from "react";

export interface SectionHeaderProps {
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

// The border-bottom title strip at the top of a card/table/chart section
// (e.g. "Kitchen Throughput by Hour" / "Detailed breakdown of revenue and
// costs") — duplicated near-identically at the top of almost every card in
// the app. Use inside a <Card> or any bordered container.
export function SectionHeader({ title, subtitle, actions, className = "" }: SectionHeaderProps) {
  return (
    <div className={`flex items-center justify-between border-b border-surface-border px-4 py-3 ${className}`}>
      <div>
        <h3 className="text-[15px] font-bold text-gray-900">{title}</h3>
        {subtitle && <p className="mt-0.5 text-[11px] text-gray-500">{subtitle}</p>}
      </div>
      {actions}
    </div>
  );
}

export default SectionHeader;
