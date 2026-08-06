// Mirrors dineink-backend's forecast.service.ts KPI_DEFINITIONS (key/label/unit
// order) — a display list only, not a calculation. The backend's Forecast
// Engine is the sole source of every predicted number; this just knows what
// to render and how to format it, reusing budgetCategories.ts's
// fmtCategoryValue formatter instead of re-implementing currency/percentage/
// count formatting a third time (Budget, Scenario, now Forecast).
export { fmtCategoryValue } from "../budget/budgetCategories";

export interface ForecastKpiDef {
  key: string;
  label: string;
  unit: "currency" | "percentage" | "count";
  group: string;
}

export const FORECAST_KPIS: ForecastKpiDef[] = [
  { key: "revenue", label: "Revenue", unit: "currency", group: "Revenue & Volume" },
  { key: "orders", label: "Orders", unit: "count", group: "Revenue & Volume" },
  { key: "avgOrderValue", label: "Average Order Value", unit: "currency", group: "Revenue & Volume" },
  { key: "avgDailySales", label: "Average Daily Sales", unit: "currency", group: "Revenue & Volume" },

  { key: "foodCost", label: "Food Cost", unit: "currency", group: "Cost of Goods" },
  { key: "foodCostPercentage", label: "Food Cost %", unit: "percentage", group: "Cost of Goods" },
  { key: "primeCost", label: "Prime Cost", unit: "currency", group: "Cost of Goods" },
  { key: "primeCostPercentage", label: "Prime Cost %", unit: "percentage", group: "Cost of Goods" },

  { key: "labourCost", label: "Labour", unit: "currency", group: "Labour" },
  { key: "labourCostPercentage", label: "Labour %", unit: "percentage", group: "Labour" },

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

export const FORECAST_KPI_GROUPS = [...new Set(FORECAST_KPIS.map((k) => k.group))];

/** The 6 headline cards on the Forecast Summary dashboard. */
export const WIDGET_KPIS = ["revenue", "netProfit", "foodCost", "labourCost", "ebitda", "operatingExpenses"];

export const PERIOD_OPTIONS = [
  { key: "NEXT_WEEK", label: "Next Week" },
  { key: "NEXT_MONTH", label: "Next Month" },
  { key: "NEXT_QUARTER", label: "Next Quarter" },
  { key: "NEXT_6_MONTHS", label: "Next 6 Months" },
  { key: "NEXT_YEAR", label: "Next Year" },
];

export const MODEL_OPTIONS = [
  { key: "HISTORICAL_TREND", label: "Historical Trend" },
  { key: "MOVING_AVERAGE", label: "Moving Average" },
  { key: "SEASONAL", label: "Seasonal" },
];

export const CONFIDENCE_STYLES: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  high: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", dot: "bg-emerald-500" },
  medium: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", dot: "bg-amber-500" },
  low: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200", dot: "bg-red-500" },
};

