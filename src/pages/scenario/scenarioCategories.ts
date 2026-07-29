// Mirrors dineink-backend's scenario.service.ts KPI_DEFINITIONS (key/label/unit
// order) and scenario.types.ts/scenario.validation.ts's override field list —
// a display list only, not a calculation. The backend's What-If Engine is the
// sole source of every projected number; this just knows what to render and
// how to format it, reusing budgetCategories.ts's fmtCategoryValue formatter
// instead of re-implementing currency/percentage/count formatting a second time.
export { fmtCategoryValue } from "../budget/budgetCategories";

export interface ScenarioKpiDef {
  key: string;
  label: string;
  unit: "currency" | "percentage" | "count";
  group: string;
}

export const SCENARIO_KPIS: ScenarioKpiDef[] = [
  { key: "revenue", label: "Revenue", unit: "currency", group: "Revenue & Volume" },
  { key: "orders", label: "Orders", unit: "count", group: "Revenue & Volume" },
  { key: "avgOrderValue", label: "Average Order Value", unit: "currency", group: "Revenue & Volume" },

  { key: "foodCost", label: "Food Cost", unit: "currency", group: "Cost of Goods" },
  { key: "foodCostPercentage", label: "Food Cost %", unit: "percentage", group: "Cost of Goods" },
  { key: "primeCost", label: "Prime Cost", unit: "currency", group: "Cost of Goods" },
  { key: "primeCostPercentage", label: "Prime Cost %", unit: "percentage", group: "Cost of Goods" },

  { key: "labour", label: "Labour", unit: "currency", group: "Labour" },
  { key: "labourPercentage", label: "Labour %", unit: "percentage", group: "Labour" },

  { key: "rent", label: "Rent", unit: "currency", group: "Fixed & Operating Costs" },
  { key: "utilities", label: "Utilities", unit: "currency", group: "Fixed & Operating Costs" },
  { key: "operatingExpenses", label: "Operating Expenses", unit: "currency", group: "Fixed & Operating Costs" },

  { key: "grossProfit", label: "Gross Profit", unit: "currency", group: "Profitability" },
  { key: "grossProfitMarginPercentage", label: "Gross Margin %", unit: "percentage", group: "Profitability" },
  { key: "ebitda", label: "EBITDA", unit: "currency", group: "Profitability" },
  { key: "ebitdaPercentage", label: "EBITDA %", unit: "percentage", group: "Profitability" },
  { key: "netProfit", label: "Net Profit", unit: "currency", group: "Profitability" },
  { key: "contributionMargin", label: "Contribution Margin", unit: "currency", group: "Profitability" },
  { key: "marginOfSafety", label: "Margin of Safety", unit: "currency", group: "Profitability" },

  { key: "breakEvenRevenue", label: "Break-even Sales", unit: "currency", group: "Break-even" },
  { key: "breakEvenOrders", label: "Break-even Orders", unit: "count", group: "Break-even" },

  { key: "cashFlow", label: "Cash Flow", unit: "currency", group: "Cash Flow" },
];

export const SCENARIO_KPI_GROUPS = [...new Set(SCENARIO_KPIS.map((k) => k.group))];

/** The 6 headline cards shown on the Overview dashboard (spec section 7). */
export const WIDGET_KPIS = ["revenue", "foodCost", "primeCost", "labour", "ebitda", "netProfit"];

export type ScenarioOverrideField =
  | "revenueGrowthPercentage" | "orderGrowthPercentage" | "avgOrderValue"
  | "rent" | "utilities" | "marketing" | "maintenance" | "packaging"
  | "foodCostTargetPercentage" | "labourTargetPercentage"
  | "deliveryPercentage" | "swiggyCommissionPercentage" | "zomatoCommissionPercentage"
  | "royaltyPercentage" | "franchiseFeePercentage"
  | "salaryIncrementPercentage" | "inflationPercentage" | "rentEscalationPercentage"
  | "workingDays" | "businessHours";

export interface OverrideFieldDef {
  key: ScenarioOverrideField;
  label: string;
  unit: "currency" | "percentage" | "count";
  min: number;
  max: number;
  step: number;
  /** Rendered as a slider on the What-If panel (spec section 8's examples) — the rest are plain number inputs. */
  slider: boolean;
  group: string;
}

// [min, max] mirrors dineink-backend's scenario.validation.ts BOUNDS exactly.
export const OVERRIDE_FIELDS: OverrideFieldDef[] = [
  { key: "revenueGrowthPercentage", label: "Revenue Growth", unit: "percentage", min: -100, max: 500, step: 1, slider: true, group: "Growth" },
  { key: "orderGrowthPercentage", label: "Order Growth", unit: "percentage", min: -100, max: 500, step: 1, slider: true, group: "Growth" },
  { key: "avgOrderValue", label: "Average Order Value", unit: "currency", min: 0, max: 100_000, step: 10, slider: false, group: "Growth" },

  { key: "foodCostTargetPercentage", label: "Food Cost Target", unit: "percentage", min: 0, max: 100, step: 1, slider: true, group: "Costs" },
  { key: "labourTargetPercentage", label: "Labour Target", unit: "percentage", min: 0, max: 100, step: 1, slider: true, group: "Costs" },
  { key: "salaryIncrementPercentage", label: "Salary Increment", unit: "percentage", min: -50, max: 100, step: 1, slider: false, group: "Costs" },

  { key: "rent", label: "Rent (₹/month)", unit: "currency", min: 0, max: 10_000_000, step: 1000, slider: true, group: "Fixed Costs" },
  { key: "rentEscalationPercentage", label: "Rent Escalation", unit: "percentage", min: -50, max: 100, step: 1, slider: false, group: "Fixed Costs" },
  { key: "utilities", label: "Utilities (₹/month)", unit: "currency", min: 0, max: 10_000_000, step: 500, slider: false, group: "Fixed Costs" },
  { key: "marketing", label: "Marketing (₹/month)", unit: "currency", min: 0, max: 10_000_000, step: 500, slider: false, group: "Fixed Costs" },
  { key: "maintenance", label: "Maintenance (₹/month)", unit: "currency", min: 0, max: 10_000_000, step: 500, slider: false, group: "Fixed Costs" },
  { key: "packaging", label: "Packaging (₹/month)", unit: "currency", min: 0, max: 10_000_000, step: 500, slider: false, group: "Fixed Costs" },
  { key: "inflationPercentage", label: "General Inflation", unit: "percentage", min: -50, max: 100, step: 1, slider: false, group: "Fixed Costs" },

  { key: "deliveryPercentage", label: "Delivery Orders %", unit: "percentage", min: 0, max: 100, step: 1, slider: false, group: "Channel & Fees" },
  { key: "swiggyCommissionPercentage", label: "Swiggy Commission", unit: "percentage", min: 0, max: 100, step: 1, slider: false, group: "Channel & Fees" },
  { key: "zomatoCommissionPercentage", label: "Zomato Commission", unit: "percentage", min: 0, max: 100, step: 1, slider: false, group: "Channel & Fees" },
  { key: "royaltyPercentage", label: "Royalty", unit: "percentage", min: 0, max: 100, step: 1, slider: false, group: "Channel & Fees" },
  { key: "franchiseFeePercentage", label: "Franchise Fee", unit: "percentage", min: 0, max: 100, step: 1, slider: false, group: "Channel & Fees" },

  { key: "workingDays", label: "Working Days", unit: "count", min: 0, max: 31, step: 1, slider: false, group: "Operating Hours" },
  { key: "businessHours", label: "Business Hours", unit: "count", min: 0, max: 24, step: 1, slider: false, group: "Operating Hours" },
];

export const OVERRIDE_FIELD_GROUPS = [...new Set(OVERRIDE_FIELDS.map((f) => f.group))];

export const SCENARIO_TYPE_STYLES: Record<string, { bg: string; text: string }> = {
  CONSERVATIVE: { bg: "bg-amber-100", text: "text-amber-700" },
  EXPECTED: { bg: "bg-blue-100", text: "text-blue-700" },
  OPTIMISTIC: { bg: "bg-emerald-100", text: "text-emerald-700" },
  CUSTOM: { bg: "bg-gray-100", text: "text-gray-700" },
};
