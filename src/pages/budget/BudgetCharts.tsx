import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Cell,
} from "recharts";
import { tooltipFormatter } from "../../utils/chartFormatters";
import { useAppSelector } from "../../store";
import { fyMonths, MONTH_NAMES } from "./budgetCategories";

const TICK = { fontSize: 10, fill: "#6b7280" };
const CHART_CARD = "overflow-hidden rounded-xl border border-gray-200 bg-white p-3 shadow-sm";

type ChartMode = "line" | "bar" | "area";

const CHART_COMPONENTS: Record<ChartMode, any> = { line: LineChart, bar: BarChart, area: AreaChart };

function TrendChart({ mode, data, dataKey, color, name }: { mode: ChartMode; data: any[]; dataKey: string; color: string; name: string }) {
  const Chart = CHART_COMPONENTS[mode];
  return (
    <ResponsiveContainer width="100%" height={220}>
      <Chart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="month" tick={TICK} axisLine={false} tickLine={false} />
        <YAxis tick={TICK} axisLine={false} tickLine={false} tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v)} />
        <Tooltip />
        {mode === "line" && <Line type="monotone" dataKey={dataKey} name={name} stroke={color} strokeWidth={2} dot={false} />}
        {mode === "bar" && <Bar dataKey={dataKey} name={name} fill={color} radius={[4, 4, 0, 0]} />}
        {mode === "area" && <Area type="monotone" dataKey={dataKey} name={name} stroke={color} fill={color} fillOpacity={0.2} />}
      </Chart>
    </ResponsiveContainer>
  );
}

export default function BudgetCharts({ budget }: { budget: any }) {
  const { user, token } = useAppSelector((s) => s.auth);
  const API_URL = import.meta.env.VITE_API_URL;
  const [mode, setMode] = useState<ChartMode>("line");
  const [monthly, setMonthly] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Intentionally does NOT reuse OverviewTab's own variance fetch: this chart
  // needs one data point per fiscal-year month (12 total) to draw a trend
  // line, while OverviewTab only ever fetches variance for whichever single
  // period the user currently has selected (a month, a quarter, a custom
  // range) — there is no "current period" fetch that already contains a
  // 12-month series to reuse. Each call below hits the same authoritative
  // /variance endpoint OverviewTab's KPI cards use (getBudgetVarianceService),
  // so every month's numbers are guaranteed to agree with what that endpoint
  // would show if the user picked that exact month — this is a bounded
  // (12-call) fan-out for a distinct dataset, not a duplicate calculation.
  useEffect(() => {
    const fetchMonthlyTrend = async () => {
      if (!budget?.id || !user?.restaurantId) return;
      setLoading(true);
      try {
        const months = fyMonths(Number(budget.financialYear));
        const results = await Promise.all(
          months.map(async ({ year, month }) => {
            const from = `${year}-${String(month).padStart(2, "0")}-01`;
            const to = `${year}-${String(month).padStart(2, "0")}-${new Date(year, month, 0).getDate()}`;
            const res = await fetch(
              `${API_URL}/api/budgets/${user.restaurantId}/${budget.id}/variance?period=custom&from=${from}&to=${to}`,
              { headers: { Authorization: `Bearer ${token}` } },
            );
            const json = await res.json();
            const byCategory = Object.fromEntries((json.data?.rows || []).map((r: any) => [r.category, r]));
            return {
              month: `${MONTH_NAMES[month - 1]}'${String(year).slice(-2)}`,
              revenueBudget: byCategory.revenue?.budget ?? 0,
              revenueActual: byCategory.revenue?.actual ?? 0,
              revenueVariancePercentage: byCategory.revenue?.variancePercentage ?? 0,
              foodCostActual: byCategory.foodCost?.actual ?? 0,
              operatingExpensesActual: byCategory.operatingExpenses?.actual ?? 0,
              ebitdaActual: byCategory.ebitda?.actual ?? 0,
            };
          }),
        );
        setMonthly(results);
      } catch {
        // fetch error — silently ignored
      } finally {
        setLoading(false);
      }
    };
    fetchMonthlyTrend();
  }, [budget?.id]);

  if (!budget) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-[13px] font-bold text-gray-900">Charts — FY{budget.financialYear}</h4>
        <div className="flex items-center gap-1 rounded-xl bg-gray-100 p-1">
          {(["line", "bar", "area"] as ChartMode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`rounded-lg px-3 py-1 text-[11px] font-semibold capitalize transition ${
                mode === m ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex h-40 items-center justify-center text-[12px] text-gray-400">Loading charts…</div>
      ) : (
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
          <div className={CHART_CARD}>
            <p className="mb-2 text-[11px] font-bold text-gray-700">Budget vs Actual — Revenue</p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={monthly} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={TICK} axisLine={false} tickLine={false} />
                <YAxis tick={TICK} axisLine={false} tickLine={false} tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v)} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Bar dataKey="revenueBudget" name="Budget" fill="#9ca3af" radius={[4, 4, 0, 0]} />
                <Bar dataKey="revenueActual" name="Actual" fill="#b10000" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className={CHART_CARD}>
            <p className="mb-2 text-[11px] font-bold text-gray-700">Monthly Variance % — Revenue</p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={monthly} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={TICK} axisLine={false} tickLine={false} />
                <YAxis tick={TICK} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
                <Tooltip formatter={tooltipFormatter((v) => `${v.toFixed(1)}%`)} />
                <Bar dataKey="revenueVariancePercentage" name="Variance %" radius={[4, 4, 0, 0]}>
                  {monthly.map((d, i) => (
                    <Cell key={i} fill={d.revenueVariancePercentage >= 0 ? "#10b981" : "#ef4444"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className={CHART_CARD}>
            <p className="mb-2 text-[11px] font-bold text-gray-700">Revenue Trend</p>
            <TrendChart mode={mode} data={monthly} dataKey="revenueActual" color="#b10000" name="Revenue" />
          </div>

          <div className={CHART_CARD}>
            <p className="mb-2 text-[11px] font-bold text-gray-700">Expense Trend</p>
            <TrendChart mode={mode} data={monthly} dataKey="operatingExpensesActual" color="#f97316" name="Operating Expenses" />
          </div>

          <div className={CHART_CARD}>
            <p className="mb-2 text-[11px] font-bold text-gray-700">EBITDA Trend</p>
            <TrendChart mode={mode} data={monthly} dataKey="ebitdaActual" color="#10b981" name="EBITDA" />
          </div>

          <div className={CHART_CARD}>
            <p className="mb-2 text-[11px] font-bold text-gray-700">Food Cost Trend</p>
            <TrendChart mode={mode} data={monthly} dataKey="foodCostActual" color="#8b5cf6" name="Food Cost" />
          </div>
        </div>
      )}
    </div>
  );
}
