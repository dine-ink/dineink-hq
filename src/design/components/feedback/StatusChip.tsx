import type { ReactNode } from "react";

export type ChipStatus = "success" | "warning" | "danger" | "info" | "neutral" | "primary" | "secondary";

export interface StatusChipProps {
  children: ReactNode;
  status?: ChipStatus;
  className?: string;
}

const statusClasses: Record<ChipStatus, string> = {
  success: "bg-success-50 text-success-700",
  warning: "bg-warning-50 text-warning-700",
  danger: "bg-danger-50 text-danger-700",
  info: "bg-info-50 text-info-700",
  neutral: "bg-gray-100 text-gray-600",
  primary: "bg-primary-50 text-primary-700",
  secondary: "bg-secondary-50 text-secondary-700",
};

// The small rounded-pill status label duplicated ad hoc across ~20 files
// (order-type badges, payment-status badges, discount-status badges — each
// with its own copy of "rounded-full px-2 py-0.5 text-[10px] font-semibold
// bg-X-50 text-X-700"). One component now; every status color is a design
// token, so retuning "success" green updates every chip in the app at once.
export function StatusChip({ children, status = "neutral", className = "" }: StatusChipProps) {
  return (
    <span
      className={`inline-flex items-center rounded-tag px-2 py-0.5 text-[10px] font-semibold ${statusClasses[status]} ${className}`}
    >
      {children}
    </span>
  );
}

// Alias — a StatusChip used as a generic count/label tag (not a semantic
// status) reads more clearly as <Badge>.
export const Badge = StatusChip;

export default StatusChip;
