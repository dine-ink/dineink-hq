// Mirrors dineink-backend's budget.types.ts BUDGET_CATEGORIES — a display
// list only (label/unit for rendering), not a calculation. The backend is
// still the sole source of truth for validation and actual-value resolution;
// this just needs to know what to render in the grid and how to format it.
export interface BudgetCategoryDef {
  key: string;
  label: string;
  unit: "currency" | "percentage" | "count";
  group: string;
}

export const BUDGET_CATEGORIES: BudgetCategoryDef[] = [
  {
    key: "revenue",
    label: "Revenue",
    unit: "currency",
    group: "Revenue & Volume",
  },
  { key: "orders", label: "Orders", unit: "count", group: "Revenue & Volume" },
  {
    key: "avgOrderValue",
    label: "Average Order Value",
    unit: "currency",
    group: "Revenue & Volume",
  },

  {
    key: "foodCost",
    label: "Food Cost",
    unit: "currency",
    group: "Cost of Goods",
  },
  {
    key: "foodCostPercentage",
    label: "Food Cost %",
    unit: "percentage",
    group: "Cost of Goods",
  },
  {
    key: "primeCost",
    label: "Prime Cost",
    unit: "currency",
    group: "Cost of Goods",
  },

  { key: "labour", label: "Labour", unit: "currency", group: "Labour" },
  {
    key: "labourPercentage",
    label: "Labour %",
    unit: "percentage",
    group: "Labour",
  },

  {
    key: "rent",
    label: "Rent",
    unit: "currency",
    group: "Fixed & Operating Costs",
  },
  {
    key: "utilities",
    label: "Utilities",
    unit: "currency",
    group: "Fixed & Operating Costs",
  },
  {
    key: "marketing",
    label: "Marketing",
    unit: "currency",
    group: "Fixed & Operating Costs",
  },
  {
    key: "maintenance",
    label: "Maintenance",
    unit: "currency",
    group: "Fixed & Operating Costs",
  },
  {
    key: "cleaning",
    label: "Cleaning",
    unit: "currency",
    group: "Fixed & Operating Costs",
  },
  {
    key: "packaging",
    label: "Packaging",
    unit: "currency",
    group: "Fixed & Operating Costs",
  },
  {
    key: "deliveryCommission",
    label: "Delivery Commission",
    unit: "currency",
    group: "Fixed & Operating Costs",
  },
  {
    key: "operatingExpenses",
    label: "Operating Expenses",
    unit: "currency",
    group: "Fixed & Operating Costs",
  },

  { key: "ebitda", label: "EBITDA", unit: "currency", group: "Profitability" },
  {
    key: "netProfit",
    label: "Net Profit",
    unit: "currency",
    group: "Profitability",
  },
  {
    key: "cashFlow",
    label: "Cash Flow",
    unit: "currency",
    group: "Profitability",
  },
];

export const BUDGET_CATEGORY_GROUPS = [
  ...new Set(BUDGET_CATEGORIES.map((c) => c.group)),
];

export const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/** Apr(fyStartYear) .. Mar(fyStartYear+1), matching the backend's FY convention. */
export const fyMonths = (
  fyStartYear: number,
): { year: number; month: number }[] => {
  const months: { year: number; month: number }[] = [];
  for (let i = 0; i < 12; i++) {
    const m = ((3 + i) % 12) + 1;
    const y = m >= 4 ? fyStartYear : fyStartYear + 1;
    months.push({ year: y, month: m });
  }
  return months;
};

export const fmtCategoryValue = (
  value: number | null | undefined,
  unit: BudgetCategoryDef["unit"],
): string => {
  if (value === null || value === undefined) return "—";
  if (unit === "percentage") return `${value.toFixed(1)}%`;
  if (unit === "count") return String(Math.round(value));
  return `₹${Math.round(value).toLocaleString("en-IN")}`;
};
