// Shared types, constants, and formatting helpers for the Dues Tracker page
// (DuesTracker.tsx + its tab components). Kept in one file since none of
// this is large enough to warrant its own module, mirroring how
// src/pages/budget/budgetCategories.ts centralizes that page's category
// metadata for its tabs to share.
import type { ChipStatus } from "../../design";

export type DueCategory =
  | "EB"
  | "SALARIES"
  | "RENT"
  | "OPERATIONS"
  | "UTILITIES"
  | "MAINTENANCE"
  | "MISC"
  | "EMI";

export type DueStatus = "PENDING" | "PARTIAL" | "PAID" | "OVERDUE";

export type PaymentSource = "MONTHLY_DUE" | "VENDOR_INVOICE" | "EMI";

export interface MonthlyDue {
  id: number;
  restaurantId: number;
  branchId: number;
  category: DueCategory;
  month: number;
  year: number;
  amountDue: number;
  amountPaid: number;
  dueDate: string | null;
  paidDate: string | null;
  status: DueStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentCalendarEntry {
  source: PaymentSource;
  id: number | string;
  label: string;
  amount: number;
  dueDate: string;
}

export interface MonthComparisonCategoryAmount {
  category: string;
  amountDue: number;
  amountPaid: number;
}

export interface MonthComparisonChange {
  category: string;
  pct: number;
}

export interface MonthComparisonData {
  current: MonthComparisonCategoryAmount[];
  previous: MonthComparisonCategoryAmount[];
  changePercent: MonthComparisonChange[];
}

// The 8 fixed expense categories the page always renders, even when the
// backend has no MonthlyDue row yet for one of them this month.
export const DUE_CATEGORIES: { key: DueCategory; label: string }[] = [
  { key: "EB", label: "Electricity (EB)" },
  { key: "SALARIES", label: "Salaries" },
  { key: "RENT", label: "Rent" },
  { key: "OPERATIONS", label: "Operations" },
  { key: "UTILITIES", label: "Utilities" },
  { key: "MAINTENANCE", label: "Maintenance" },
  { key: "MISC", label: "Miscellaneous" },
  { key: "EMI", label: "EMI" },
];

export const categoryLabel = (category: string): string =>
  DUE_CATEGORIES.find((c) => c.key === category)?.label || category;

export const STATUS_TO_CHIP: Record<DueStatus, ChipStatus> = {
  PAID: "success",
  PARTIAL: "warning",
  OVERDUE: "danger",
  PENDING: "neutral",
};

export const SOURCE_LABEL: Record<PaymentSource, string> = {
  MONTHLY_DUE: "Monthly Due",
  VENDOR_INVOICE: "Vendor Invoice",
  EMI: "EMI",
};

// Distinct colors per the brief: info / primary / secondary.
export const SOURCE_CHIP: Record<PaymentSource, ChipStatus> = {
  MONTHLY_DUE: "info",
  VENDOR_INVOICE: "primary",
  EMI: "secondary",
};

export const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

// Matches the ₹{value.toLocaleString("en-IN")} convention already used
// across the app (Insights.tsx, Report.tsx, etc.) rather than introducing
// a new formatting style.
export const formatCurrency = (value: number | null | undefined): string =>
  `₹${Math.round(value || 0).toLocaleString("en-IN")}`;

export const formatDate = (value: string | null | undefined): string => {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

// camelCase/snake_case -> "Title Case", used to render the EBITDA
// endpoint's response defensively without assuming its exact shape.
export const titleCaseFromKey = (key: string): string =>
  key
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .map((w) => (w.length ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");

export const monthRangeISO = (month: number, year: number): { from: string; to: string } => {
  const from = new Date(year, month - 1, 1);
  const to = new Date(year, month, 0);
  const iso = (d: Date) => d.toISOString().split("T")[0];
  return { from: iso(from), to: iso(to) };
};

export const monthYearLabel = (month: number, year: number): string =>
  `${MONTH_NAMES[month - 1]} ${year}`;
