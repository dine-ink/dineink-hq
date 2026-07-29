// Display-only metadata for the Executive Dashboard — reuses budgetCategories.ts's
// fmtCategoryValue formatter instead of implementing currency/percentage
// formatting a fifth time. executive.service.ts is the sole source of every
// KPI/health-score/alert value; this file only knows how to label and color them.
export { fmtCategoryValue } from "../budget/budgetCategories";

export const PERIOD_OPTIONS = [
  { key: "currentMonth", label: "Current Month" },
  { key: "currentQuarter", label: "Current Quarter" },
  { key: "currentYear", label: "Current Year" },
  { key: "custom", label: "Custom Range" },
];

export const GRANULARITY_OPTIONS = [
  { key: "daily", label: "Daily" },
  { key: "weekly", label: "Weekly" },
  { key: "monthly", label: "Monthly" },
  { key: "quarterly", label: "Quarterly" },
  { key: "yearly", label: "Yearly" },
];

export const STATUS_STYLES: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  excellent: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", dot: "bg-emerald-500" },
  good: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", dot: "bg-blue-500" },
  warning: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", dot: "bg-amber-500" },
  critical: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200", dot: "bg-red-500" },
  "no-data": { bg: "bg-gray-50", text: "text-gray-500", border: "border-gray-200", dot: "bg-gray-400" },
};

/** The 6 headline widget cards on the Overview tab — a subset of the 17 Overview KPIs, matching how every prior phase's dashboard picked a curated "widget" set from its own richer KPI table. */
export const WIDGET_KPIS = ["revenue", "ebitda", "netProfit", "foodCostPercentage", "labourCostPercentage", "repeatCustomerRate"];

export const ALL_KPI_LABELS: Record<string, string> = {
  revenue: "Total Revenue", orders: "Total Orders", avgOrderValue: "Average Order Value",
  grossProfit: "Gross Profit", grossProfitMarginPercentage: "Gross Margin %", ebitda: "EBITDA",
  ebitdaPercentage: "EBITDA %", netProfit: "Net Profit", foodCostPercentage: "Food Cost %",
  labourCostPercentage: "Labour Cost %", primeCostPercentage: "Prime Cost %",
  customerGrowthPercentage: "Customer Growth %", repeatCustomerRate: "Repeat Customer %",
  branchCount: "Branch Count", activeEmployees: "Active Employees", inventoryValue: "Inventory Value",
  cashPosition: "Cash Position",
};
