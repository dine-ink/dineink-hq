import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { useAppSelector } from "../../store";
import { fmtCategoryValue } from "./budgetCategories";
import { TrendIcon } from "../../utils/kpiDisplay";
import BudgetCharts from "./BudgetCharts";
import MobileTableCards from "../../components/common/MobileTableCards";

const WIDGET_CATEGORIES = ["revenue", "foodCost", "labour", "ebitda", "netProfit"];

const PERIODS = [
  { key: "currentMonth", label: "Current Month" },
  { key: "currentQuarter", label: "Current Quarter" },
  { key: "currentYear", label: "Current Year" },
  { key: "custom", label: "Custom Range" },
];

const statusStyles: Record<string, { border: string; bg: string; text: string }> = {
  "on-track": { border: "border-emerald-200", bg: "bg-emerald-50", text: "text-emerald-700" },
  warning: { border: "border-amber-200", bg: "bg-amber-50", text: "text-amber-700" },
  critical: { border: "border-red-200", bg: "bg-red-50", text: "text-red-700" },
  "no-data": { border: "border-gray-200", bg: "bg-gray-50", text: "text-gray-500" },
};

export default function OverviewTab() {
  const { selectedBranch } = useAppSelector((s) => s.branch);
  const { user, token } = useAppSelector((s) => s.auth);
  const API_URL = import.meta.env.VITE_API_URL;

  const [budgets, setBudgets] = useState<any[]>([]);
  const [selectedBudgetId, setSelectedBudgetId] = useState<number | null>(null);
  const [period, setPeriod] = useState("currentMonth");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [variance, setVariance] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchBudgets = async () => {
      if (!user?.restaurantId) return;
      try {
        const res = await fetch(`${API_URL}/api/budgets/${user.restaurantId}?status=PUBLISHED`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        if (json.success) {
          setBudgets(json.data);
          // Prefer a published budget matching the currently selected branch, else restaurant-wide, else the first.
          const preferred =
            json.data.find((b: any) => b.branchId === selectedBranch?.id) ||
            json.data.find((b: any) => b.branchId === null) ||
            json.data[0];
          setSelectedBudgetId(preferred?.id ?? null);
        }
      } catch {
        // fetch error — silently ignored
      }
    };
    fetchBudgets();
  }, [user?.restaurantId, selectedBranch?.id]);

  useEffect(() => {
    const fetchVariance = async () => {
      if (!selectedBudgetId || !user?.restaurantId) {
        setVariance(null);
        return;
      }
      if (period === "custom" && (!customFrom || !customTo)) return;
      setLoading(true);
      try {
        const rangeParams = period === "custom" ? `&from=${customFrom}&to=${customTo}` : "";
        const res = await fetch(
          `${API_URL}/api/budgets/${user.restaurantId}/${selectedBudgetId}/variance?period=${period}${rangeParams}`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        const json = await res.json();
        if (json.success) setVariance(json.data);
      } catch {
        // fetch error — silently ignored
      } finally {
        setLoading(false);
      }
    };
    fetchVariance();
  }, [selectedBudgetId, period, customFrom, customTo]);

  const rowsByCategory = useMemo(() => {
    const map = new Map<string, any>();
    (variance?.rows || []).forEach((r: any) => map.set(r.category, r));
    return map;
  }, [variance]);

  const alerts = useMemo(() => {
    return (variance?.rows || []).filter((r: any) => r.status === "critical" || r.status === "warning");
  }, [variance]);

  if (budgets.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50 text-[12px] text-gray-400">
        No published budgets yet — publish a budget under the Budgets tab to see Budget vs Actual here.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedBudgetId ?? ""}
            onChange={(e) => setSelectedBudgetId(Number(e.target.value))}
            className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-[12px] font-semibold text-gray-700 outline-none"
          >
            {budgets.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} ({b.branch?.name || "Restaurant-wide"})
              </option>
            ))}
          </select>
          <div className="flex items-center gap-1 rounded-xl bg-gray-100 p-1">
            {PERIODS.map((p) => (
              <button
                key={p.key}
                type="button"
                onClick={() => setPeriod(p.key)}
                className={`rounded-lg px-3 py-1.5 text-[11px] font-semibold transition ${
                  period === p.key ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          {period === "custom" && (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="rounded-xl border border-gray-200 bg-white px-2.5 py-1.5 text-[11px] outline-none"
              />
              <span className="text-[11px] text-gray-400">to</span>
              <input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="rounded-xl border border-gray-200 bg-white px-2.5 py-1.5 text-[11px] outline-none"
              />
            </div>
          )}
        </div>
      </div>

      {loading && <div className="flex h-24 items-center justify-center text-[12px] text-gray-400">Loading…</div>}

      {!loading && variance && (
        <>
          {/* KPI WIDGET CARDS */}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
            {WIDGET_CATEGORIES.map((catKey) => {
              const row = rowsByCategory.get(catKey);
              if (!row) return null;
              const style = statusStyles[row.status] || statusStyles["no-data"];
              return (
                <div key={catKey} className={`rounded-2xl border ${style.border} ${style.bg} p-3.5 shadow-sm`}>
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-500">{row.label}</p>
                  <p className="mt-2 text-[20px] font-extrabold tracking-tight text-gray-900">
                    {fmtCategoryValue(row.actual, row.unit)}
                  </p>
                  <p className="mt-0.5 text-[11px] text-gray-500">Budget: {fmtCategoryValue(row.budget, row.unit)}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className={`flex items-center gap-1 text-[11px] font-semibold ${style.text}`}>
                      <TrendIcon direction={row.trendDirection} />
                      {row.variancePercentage != null ? `${row.variancePercentage > 0 ? "+" : ""}${row.variancePercentage.toFixed(1)}%` : "—"}
                    </span>
                    <span className="text-[10px] font-semibold text-gray-400">
                      {row.achievementPercentage != null ? `${row.achievementPercentage.toFixed(0)}% achieved` : "No data"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* VISUAL ALERTS */}
          {alerts.length > 0 && (
            <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <h4 className="mb-3 flex items-center gap-2 text-[13px] font-bold text-gray-900">
                <AlertTriangle className="h-4 w-4 text-amber-500" /> Attention Needed
              </h4>
              <div className="space-y-2">
                {alerts.map((r: any) => (
                  <div
                    key={r.category}
                    className={`flex items-center justify-between rounded-xl border px-3 py-2 text-[12px] ${
                      r.status === "critical" ? "border-red-200 bg-red-50 text-red-700" : "border-amber-200 bg-amber-50 text-amber-700"
                    }`}
                  >
                    <span className="font-semibold">{r.label}</span>
                    <span>
                      {fmtCategoryValue(r.actual, r.unit)} vs budget {fmtCategoryValue(r.budget, r.unit)} ·{" "}
                      {r.achievementPercentage != null ? `${r.achievementPercentage.toFixed(0)}% achieved` : "no data"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {alerts.length === 0 && (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-[12px] font-semibold text-emerald-700">
              <CheckCircle2 className="h-4 w-4" /> All tracked categories are on track for this period.
            </div>
          )}

          {/* CHARTS */}
          <BudgetCharts budget={budgets.find((b) => b.id === selectedBudgetId)} />

          {/* FULL VARIANCE TABLE */}
          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <MobileTableCards>
            <table className="w-full text-[12px] min-w-[36rem]">
              <thead className="bg-gray-50 text-[10px] font-bold uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-4 py-2 text-left">Category</th>
                  <th className="px-3 py-2 text-right">Budget</th>
                  <th className="px-3 py-2 text-right">Actual</th>
                  <th className="px-3 py-2 text-right">Variance</th>
                  <th className="px-3 py-2 text-right">Variance %</th>
                  <th className="px-3 py-2 text-right">Achievement %</th>
                  <th className="px-3 py-2 text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {(variance.rows || []).map((r: any) => (
                  <tr key={r.category} className="border-t border-gray-100">
                    <td className="px-4 py-2 font-medium text-gray-700">{r.label}</td>
                    <td className="px-3 py-2 text-right text-gray-600">{fmtCategoryValue(r.budget, r.unit)}</td>
                    <td className="px-3 py-2 text-right text-gray-900">{fmtCategoryValue(r.actual, r.unit)}</td>
                    <td className="px-3 py-2 text-right text-gray-600">{r.variance != null ? fmtCategoryValue(r.variance, r.unit) : "—"}</td>
                    <td className="px-3 py-2 text-right text-gray-600">{r.variancePercentage != null ? `${r.variancePercentage.toFixed(1)}%` : "—"}</td>
                    <td className="px-3 py-2 text-right text-gray-600">{r.achievementPercentage != null ? `${r.achievementPercentage.toFixed(0)}%` : "—"}</td>
                    <td className="px-3 py-2 text-center">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${(statusStyles[r.status] || statusStyles["no-data"]).bg} ${(statusStyles[r.status] || statusStyles["no-data"]).text}`}>
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </MobileTableCards>
          </div>
        </>
      )}
    </div>
  );
}
