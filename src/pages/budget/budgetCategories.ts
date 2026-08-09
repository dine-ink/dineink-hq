// Mirrors dineink-backend's budget.types.ts BUDGET_CATEGORIES — a display
// list only (label/unit for rendering), not a calculation. The backend is
// still the sole source of truth for validation and actual-value resolution;
// this just needs to know what to render in the grid and how to format it.
export interface BudgetCategoryDef {
  key: string;
  label: string;
  unit: "currency" | "percentage" | "count";
  group: string;
  /** true = a contracted/scheduled cost whose planned value is pre-filled from live data (Insights/payroll) when creating a budget, but still editable. */
  isFixed: boolean;
}

export const BUDGET_CATEGORIES: BudgetCategoryDef[] = [
  {
    key: "revenue",
    label: "Revenue",
    unit: "currency",
    group: "Revenue & Volume",
    isFixed: false,
  },
  { key: "orders", label: "Orders", unit: "count", group: "Revenue & Volume", isFixed: false },
  {
    key: "avgOrderValue",
    label: "Average Order Value",
    unit: "currency",
    group: "Revenue & Volume",
    isFixed: false,
  },

  {
    key: "foodCost",
    label: "Food Cost",
    unit: "currency",
    group: "Cost of Goods",
    isFixed: false,
  },
  {
    key: "foodCostPercentage",
    label: "Food Cost %",
    unit: "percentage",
    group: "Cost of Goods",
    isFixed: false,
  },
  {
    key: "primeCost",
    label: "Prime Cost",
    unit: "currency",
    group: "Cost of Goods",
    isFixed: false,
  },

  { key: "labour", label: "Labour", unit: "currency", group: "Labour", isFixed: true },
  {
    key: "labourPercentage",
    label: "Labour %",
    unit: "percentage",
    group: "Labour",
    isFixed: false,
  },

  {
    key: "rent",
    label: "Rent",
    unit: "currency",
    group: "Fixed Costs",
    isFixed: true,
  },
  {
    key: "loanEmi",
    label: "Loan EMI",
    unit: "currency",
    group: "Fixed Costs",
    isFixed: true,
  },
  {
    key: "internet",
    label: "Internet",
    unit: "currency",
    group: "Fixed Costs",
    isFixed: true,
  },
  {
    key: "phoneBills",
    label: "Phone Bills",
    unit: "currency",
    group: "Fixed Costs",
    isFixed: true,
  },
  {
    key: "accounting",
    label: "Accounting Fees",
    unit: "currency",
    group: "Fixed Costs",
    isFixed: true,
  },
  {
    key: "insurance",
    label: "Insurance",
    unit: "currency",
    group: "Fixed Costs",
    isFixed: true,
  },
  {
    key: "licenses",
    label: "Licenses & Permits",
    unit: "currency",
    group: "Fixed Costs",
    isFixed: true,
  },

  {
    key: "utilities",
    label: "Utilities",
    unit: "currency",
    group: "Operating Costs",
    isFixed: false,
  },
  {
    key: "marketing",
    label: "Marketing",
    unit: "currency",
    group: "Operating Costs",
    isFixed: false,
  },
  {
    key: "maintenance",
    label: "Maintenance",
    unit: "currency",
    group: "Operating Costs",
    isFixed: false,
  },
  {
    key: "cleaning",
    label: "Cleaning",
    unit: "currency",
    group: "Operating Costs",
    isFixed: false,
  },
  {
    key: "packaging",
    label: "Packaging",
    unit: "currency",
    group: "Operating Costs",
    isFixed: false,
  },
  {
    key: "deliveryCommission",
    label: "Delivery Commission",
    unit: "currency",
    group: "Operating Costs",
    isFixed: false,
  },
  {
    key: "operatingExpenses",
    label: "Operating Expenses",
    unit: "currency",
    group: "Operating Costs",
    isFixed: false,
  },

  { key: "ebitda", label: "EBITDA", unit: "currency", group: "Profitability", isFixed: false },
  {
    key: "netProfit",
    label: "Net Profit",
    unit: "currency",
    group: "Profitability",
    isFixed: false,
  },
  {
    key: "cashFlow",
    label: "Cash Flow",
    unit: "currency",
    group: "Profitability",
    isFixed: false,
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
