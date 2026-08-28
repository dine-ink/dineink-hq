import type { ComponentType, ReactNode } from "react";
import {
  ArrowTrendingDownIcon,
  ArrowTrendingUpIcon,
  MinusIcon,
} from "@heroicons/react/24/outline";

export type MetricStatus = "primary" | "secondary" | "success" | "warning" | "danger" | "info" | "neutral";

export interface MetricCardProps {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  /** A lucide/heroicon component, rendered inside a colored icon chip. Omit for the plain bordered variant (no icon box). */
  icon?: ComponentType<{ className?: string }>;
  status?: MetricStatus;
  trend?: { direction: "up" | "down" | "flat"; higherIsBetter?: boolean };
  onClick?: () => void;
  className?: string;
}

const statusClasses: Record<MetricStatus, { border: string; bg: string; text: string; iconBg: string; iconText: string }> = {
  primary: { border: "border-primary-100", bg: "bg-primary-50/60", text: "text-primary-700", iconBg: "bg-primary-100", iconText: "text-primary-600" },
  secondary: { border: "border-secondary-100", bg: "bg-secondary-50/60", text: "text-secondary-700", iconBg: "bg-secondary-100", iconText: "text-secondary-600" },
  success: { border: "border-success-100", bg: "bg-success-50/60", text: "text-success-700", iconBg: "bg-success-100", iconText: "text-success-600" },
  warning: { border: "border-warning-100", bg: "bg-warning-50/60", text: "text-warning-700", iconBg: "bg-warning-100", iconText: "text-warning-600" },
  danger: { border: "border-danger-100", bg: "bg-danger-50/60", text: "text-danger-700", iconBg: "bg-danger-100", iconText: "text-danger-600" },
  info: { border: "border-info-100", bg: "bg-info-50/60", text: "text-info-700", iconBg: "bg-info-100", iconText: "text-info-600" },
  neutral: { border: "border-gray-200", bg: "bg-gray-50", text: "text-gray-700", iconBg: "bg-gray-100", iconText: "text-gray-600" },
};

const TrendIndicator = ({ direction, higherIsBetter = true }: { direction: "up" | "down" | "flat"; higherIsBetter?: boolean }) => {
  const isGood = direction === "flat" ? null : higherIsBetter ? direction === "up" : direction === "down";
  const color = isGood === null ? "text-gray-400" : isGood ? "text-success-600" : "text-danger-600";
  const Icon = direction === "up" ? ArrowTrendingUpIcon : direction === "down" ? ArrowTrendingDownIcon : MinusIcon;
  return <Icon className={`h-3 w-3 ${color}`} aria-hidden="true" />;
};

// The single KPI/stat card used everywhere in the app — previously
// re-implemented with small variations in Kitchen.tsx (KpiCard), StatsStrip
// .tsx, Bills.tsx, and Report.tsx's inline KPI arrays. Supports both the
// plain bordered variant (no icon) and the icon-chip variant, covering both
// pre-existing visual styles without changing how either one looks.
export function MetricCard({ label, value, sub, icon: Icon, status = "primary", trend, onClick, className = "" }: MetricCardProps) {
  const s = statusClasses[status];
  const Wrapper = onClick ? "button" : "div";

  return (
    <Wrapper
      onClick={onClick}
      className={`rounded-card border p-4 text-left ${s.border} ${s.bg} ${onClick ? "cursor-pointer transition hover:shadow-card-hover focus:outline-none focus-visible:ring-4 focus-visible:ring-primary-200" : ""} ${className}`}
      {...(onClick ? { type: "button" } : {})}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-label-wide text-gray-500">{label}</p>
          <p className={`mt-2 text-[22px] font-bold tracking-tight ${s.text}`}>{value}</p>
        </div>
        {Icon && (
          <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${s.iconBg}`}>
            <Icon className={`h-3.5 w-3.5 ${s.iconText}`} />
          </div>
        )}
      </div>
      {(sub || trend) && (
        <div className="mt-1 flex items-center gap-1 text-[11px] text-gray-500">
          {trend && <TrendIndicator {...trend} />}
          {sub}
        </div>
      )}
    </Wrapper>
  );
}

export default MetricCard;
