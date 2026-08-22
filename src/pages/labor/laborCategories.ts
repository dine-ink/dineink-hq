// Display constants and shared types for the Labor & Capacity page. Mirrors
// dineink-backend's modules/labor types — a rendering vocabulary only. Every
// number shown on this page is computed by labor.formulas.ts on the server;
// nothing here recalculates a requirement, a shortfall, or a verdict.

export const CONFIDENCE_STYLES: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  high: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", dot: "bg-emerald-500" },
  medium: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", dot: "bg-amber-500" },
  low: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200", dot: "bg-red-500" },
};

/** Mirrors labor.formulas.ts's StationConstraint. */
export type StationConstraint = "EQUIPMENT_BOUND" | "LABOR_SHORT" | "UNSKILLED" | "BALANCED" | "IDLE";

export const CONSTRAINT_STYLES: Record<
  StationConstraint,
  { label: string; chip: string; bar: string; help: string }
> = {
  EQUIPMENT_BOUND: {
    label: "Equipment bound",
    chip: "bg-red-50 text-red-700 border-red-200",
    bar: "#dc2626",
    help: "The station itself cannot produce any faster. Adding staff here will not raise output.",
  },
  LABOR_SHORT: {
    label: "Short of staff",
    chip: "bg-amber-50 text-amber-700 border-amber-200",
    bar: "#f59e0b",
    help: "The work is there and the equipment can keep up — there just aren't enough hands.",
  },
  UNSKILLED: {
    label: "Nobody trained",
    chip: "bg-violet-50 text-violet-700 border-violet-200",
    bar: "#7c3aed",
    help: "This station needs staffing, but nobody on the roster is marked able to work it.",
  },
  BALANCED: {
    label: "Balanced",
    chip: "bg-emerald-50 text-emerald-700 border-emerald-200",
    bar: "#059669",
    help: "Staffing and throughput both keep up with the forecast workload.",
  },
  IDLE: {
    label: "No workload",
    chip: "bg-gray-100 text-gray-500 border-gray-200",
    bar: "#9ca3af",
    help: "No forecast demand passes through this station in the selected window.",
  },
};

/** Mirrors labor.formulas.ts's CapacityVerdict. */
export type CapacityVerdict =
  | "NOT_CONFIGURED"
  | "INVEST_IN_EQUIPMENT"
  | "HIRE_STAFF"
  | "REALLOCATE_STAFF"
  | "TRAIN_STAFF"
  | "ADD_SEATING"
  | "BALANCED";

export const VERDICT_STYLES: Record<
  CapacityVerdict,
  { label: string; tone: "danger" | "warning" | "info" | "success" | "secondary"; card: string; icon: string }
> = {
  // Deliberately NOT styled like the success verdict. "Can't tell yet" and
  // "you're fine" must never look alike — an unconfigured kitchen showing a
  // green all-clear is the worst thing this page could say.
  NOT_CONFIGURED: {
    label: "Not enough setup to judge",
    tone: "warning",
    card: "border-gray-300 bg-gray-50",
    icon: "⚙️",
  },
  INVEST_IN_EQUIPMENT: {
    label: "Buy / add equipment",
    tone: "danger",
    card: "border-red-200 bg-red-50/60",
    icon: "🔧",
  },
  HIRE_STAFF: {
    label: "Hire staff",
    tone: "warning",
    card: "border-amber-200 bg-amber-50/60",
    icon: "🧑‍🍳",
  },
  REALLOCATE_STAFF: {
    label: "Move people around",
    tone: "info",
    card: "border-blue-200 bg-blue-50/60",
    icon: "🔀",
  },
  TRAIN_STAFF: {
    label: "Train staff",
    tone: "secondary",
    card: "border-violet-200 bg-violet-50/60",
    icon: "🎓",
  },
  ADD_SEATING: {
    label: "Add seating / tables",
    tone: "info",
    card: "border-blue-200 bg-blue-50/60",
    icon: "🪑",
  },
  BALANCED: {
    label: "No action needed",
    tone: "success",
    card: "border-emerald-200 bg-emerald-50/60",
    icon: "✅",
  },
};

/** Common service windows, so a manager isn't typing hour numbers. */
export const WINDOW_PRESETS = [
  { key: "lunch", label: "Lunch (12–3 PM)", fromHour: 12, toHour: 14 },
  { key: "evening", label: "Evening (6–10 PM)", fromHour: 18, toHour: 21 },
  { key: "dinnerPeak", label: "Dinner peak (7–9 PM)", fromHour: 19, toHour: 20 },
  { key: "allDay", label: "All day (8 AM–11 PM)", fromHour: 8, toHour: 22 },
];

export const PLAN_WINDOW_OPTIONS = [
  { key: 15, label: "15 min (staff the sharpest burst)" },
  { key: 30, label: "30 min" },
  { key: 60, label: "60 min (recommended)" },
  { key: 90, label: "90 min (staff the sustained average)" },
];

export const BASIS_OPTIONS = [
  { key: "FORECAST", label: "Forecast trend" },
  { key: "HISTORICAL", label: "Historical average" },
];

export const PROFICIENCY_LABELS: Record<number, string> = {
  1: "Trainee",
  2: "Basic",
  3: "Competent",
  4: "Strong",
  5: "Expert",
};

export const HOUR_OPTIONS = Array.from({ length: 24 }, (_, h) => ({
  key: h,
  label: h === 0 ? "12 AM" : h < 12 ? `${h} AM` : h === 12 ? "12 PM" : `${h - 12} PM`,
}));

/** Chart/table card shells, matching the Forecasting and Kitchen pages. */
export const CHART_CARD = "overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm";
export const TICK = { fontSize: 10, fill: "#6b7280" };

export const fmtFte = (n: number | null | undefined) =>
  n == null ? "—" : (Math.round(n * 100) / 100).toFixed(2);

export const fmtMinutes = (n: number | null | undefined) =>
  n == null ? "—" : `${Math.round(n)}m`;

export const fmtInr = (n: number | null | undefined) =>
  n == null ? "—" : `₹${Math.round(n).toLocaleString("en-IN")}`;
