// Display-only metadata for the AI Financial Advisor — reuses budgetCategories.ts's
// fmtCategoryValue formatter instead of implementing currency/percentage
// formatting a sixth time. ai.service.ts (and the engines it composes) is
// the sole source of every number shown here; this file only knows how to
// label and color an Insight's category/severity.
export { fmtCategoryValue } from "@/pages/budget/budgetCategories";

export const PERIOD_OPTIONS = [
  { key: "currentMonth", label: "Current Month" },
  { key: "currentQuarter", label: "Current Quarter" },
  { key: "currentYear", label: "Current Year" },
];

export const CATEGORY_OPTIONS = [
  { key: "all", label: "All" },
  { key: "insight", label: "Insights" },
  { key: "risk", label: "Risks" },
  { key: "opportunity", label: "Opportunities" },
  { key: "recommendation", label: "Recommendations" },
  { key: "anomaly", label: "Anomalies" },
];

export const CATEGORY_LABELS: Record<string, string> = {
  insight: "Insight", risk: "Risk", opportunity: "Opportunity", recommendation: "Recommendation", anomaly: "Anomaly",
};

export const SEVERITY_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  critical: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
  high: { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200" },
  medium: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  low: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  info: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
};

export const CONFIDENCE_STYLES: Record<string, string> = {
  high: "text-emerald-700 bg-emerald-50",
  medium: "text-amber-700 bg-amber-50",
  low: "text-gray-600 bg-gray-100",
};

export const CATEGORY_BADGE_STYLES: Record<string, string> = {
  insight: "bg-blue-50 text-blue-700",
  risk: "bg-red-50 text-red-700",
  opportunity: "bg-emerald-50 text-emerald-700",
  recommendation: "bg-purple-50 text-purple-700",
  anomaly: "bg-orange-50 text-orange-700",
};

/** Canned conversational questions the Ask AI tab offers — each maps 1:1 to a Conversational Finance API endpoint (spec section 9's own example question set). */
export const ASK_QUESTIONS = [
  { key: "why-profit-changed", label: "Why did profit change?", needsPercentage: false },
  { key: "best-performing-branch", label: "Which branch performed best?", needsPercentage: false },
  { key: "why-food-cost-changing", label: "Why is Food Cost changing?", needsPercentage: false },
  { key: "best-roi-investments", label: "What investments have the best ROI?", needsPercentage: false },
  { key: "what-if-sales-increase", label: "What happens if sales increase by X%?", needsPercentage: true },
  { key: "kpis-needing-attention", label: "Which KPIs need immediate attention?", needsPercentage: false },
];
