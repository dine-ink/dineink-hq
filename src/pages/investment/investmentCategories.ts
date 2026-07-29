// Display-only metadata for Investment Analysis — reuses budgetCategories.ts's
// fmtCategoryValue formatter instead of implementing currency/percentage
// formatting a fourth time (Budget, Scenario, Forecast, now Investment). The
// backend's Investment Engine (investment.formulas.ts) is the sole source of
// every ROI/NPV/IRR/Payback number; this file only knows how to label and
// color them.
export { fmtCategoryValue } from "../budget/budgetCategories";

export const INVESTMENT_TYPES = [
  { key: "NEW_BRANCH", label: "New Branch" },
  { key: "BRANCH_EXPANSION", label: "Branch Expansion" },
  { key: "KITCHEN_UPGRADE", label: "Kitchen Upgrade" },
  { key: "EQUIPMENT_PURCHASE", label: "Equipment Purchase" },
  { key: "INTERIOR_RENOVATION", label: "Interior Renovation" },
  { key: "DELIVERY_EXPANSION", label: "Delivery Expansion" },
  { key: "MARKETING_INVESTMENT", label: "Marketing Investment" },
  { key: "FRANCHISE_OUTLET", label: "Franchise Outlet" },
  { key: "CUSTOM", label: "Custom Investment" },
];

export const INVESTMENT_STATUSES = [
  { key: "PLANNED", label: "Planned" },
  { key: "IN_PROGRESS", label: "In Progress" },
  { key: "COMPLETED", label: "Completed" },
  { key: "CANCELLED", label: "Cancelled" },
];

export const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  PLANNED: { bg: "bg-blue-100", text: "text-blue-700" },
  IN_PROGRESS: { bg: "bg-amber-100", text: "text-amber-700" },
  COMPLETED: { bg: "bg-emerald-100", text: "text-emerald-700" },
  CANCELLED: { bg: "bg-gray-100", text: "text-gray-500" },
};

export const RISK_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  low: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  medium: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  high: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
};

/** A simple, documented risk read: negative/zero NPV or a payback that never happens within the project life is "high" risk; a payback beyond half the project life is "medium"; anything else is "low". */
export const riskLevelFor = (npv: number | null, paybackPeriodYears: number | null, projectLifeYears: number): "low" | "medium" | "high" => {
  if (npv === null || npv <= 0 || paybackPeriodYears === null) return "high";
  if (paybackPeriodYears > projectLifeYears / 2) return "medium";
  return "low";
};

export const ASSUMPTION_FIELDS = [
  { key: "initialInvestment", label: "Initial Investment (₹)", currency: true },
  { key: "monthlyRevenueIncrease", label: "Monthly Revenue Increase (₹)", currency: true },
  { key: "revenueGrowthPercentage", label: "Annual Revenue Growth (%)", percentage: true },
  { key: "expectedCostSavings", label: "Expected Cost Savings (₹/month)", currency: true },
  { key: "labourSavings", label: "Labour Savings (₹/month)", currency: true },
  { key: "additionalOperatingExpenses", label: "Additional Operating Expenses (₹/month)", currency: true },
  { key: "maintenanceCost", label: "Maintenance Cost (₹/year)", currency: true },
  { key: "salvageValue", label: "Salvage Value (₹)", currency: true },
  { key: "discountRate", label: "Discount Rate (%)", percentage: true },
  { key: "inflationRate", label: "Inflation Rate (%)", percentage: true },
];
