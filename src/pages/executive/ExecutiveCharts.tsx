import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar, AreaChart, Area,
  CartesianGrid, XAxis, YAxis, Tooltip, Legend, Cell,
} from "recharts";
import { fmtCategoryValue } from "./executiveCategories";

const TICK = { fontSize: 10, fill: "#6b7280" };
const CHART_CARD = "overflow-hidden rounded-xl border border-gray-200 bg-white p-3 shadow-sm";
const tickFormatter = (v: number) => (Math.abs(v) >= 100000 ? `${(v / 100000).toFixed(1)}L` : Math.abs(v) >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v));

/** Revenue/Profit/EBITDA Trend — spec section 10's core executive trend lines, driven by the Executive Timeline's own points. */
export function TrendChart({ points }: { points: { label: string; revenue: number; netProfit: number; ebitda: number }[] }) {
  return (
    <div className={CHART_CARD}>
      <p className="mb-2 text-[11px] font-bold text-gray-700">Revenue / Profit / EBITDA Trend</p>
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={points} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="label" tick={TICK} axisLine={false} tickLine={false} />
          <YAxis tick={TICK} axisLine={false} tickLine={false} tickFormatter={tickFormatter} />
          <Tooltip formatter={(v: number) => fmtCategoryValue(v, "currency")} />
          <Legend wrapperStyle={{ fontSize: 10 }} />
          <Line type="monotone" dataKey="revenue" name="Revenue" stroke="#b10000" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="netProfit" name="Net Profit" stroke="#2563eb" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="ebitda" name="EBITDA" stroke="#10b981" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Budget Achievement Trend. */
export function BudgetAchievementChart({ data }: { data: { label: string; achievementPercentage: number | null }[] }) {
  if (data.length === 0) return null;
  return (
    <div className={CHART_CARD}>
      <p className="mb-2 text-[11px] font-bold text-gray-700">Budget Achievement Trend</p>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="label" tick={TICK} axisLine={false} tickLine={false} />
          <YAxis tick={TICK} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
          <Tooltip formatter={(v: number) => (v != null ? `${v.toFixed(0)}%` : "—")} />
          <Bar dataKey="achievementPercentage" name="Achievement %" radius={[4, 4, 0, 0]}>
            {data.map((d, i) => <Cell key={i} fill={(d.achievementPercentage ?? 0) >= 100 ? "#10b981" : (d.achievementPercentage ?? 0) >= 90 ? "#f59e0b" : "#ef4444"} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Branch Performance Ranking chart. */
export function BranchRankingChart({ branches }: { branches: { branch: { name: string }; healthScore: number }[] }) {
  return (
    <div className={CHART_CARD}>
      <p className="mb-2 text-[11px] font-bold text-gray-700">Branch Performance Ranking (Health Score)</p>
      <ResponsiveContainer width="100%" height={Math.max(160, branches.length * 40)}>
        <BarChart data={branches.map((b) => ({ name: b.branch.name, score: b.healthScore }))} layout="vertical" margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis type="number" domain={[0, 100]} tick={TICK} axisLine={false} tickLine={false} />
          <YAxis type="category" dataKey="name" tick={TICK} axisLine={false} tickLine={false} width={120} />
          <Tooltip />
          <Bar dataKey="score" name="Health Score" radius={[0, 4, 4, 0]}>
            {branches.map((b, i) => <Cell key={i} fill={b.healthScore >= 70 ? "#10b981" : b.healthScore >= 50 ? "#f59e0b" : "#ef4444"} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Investment Portfolio Performance — NPV per project, reusing the same visual language as Investment Analysis's own NPV Comparison chart. */
export function InvestmentPerformanceChart({ projects }: { projects: { project: { name: string }; metrics: { npv: number } }[] }) {
  if (projects.length === 0) return null;
  const data = projects.map((p) => ({ name: p.project.name, npv: p.metrics.npv }));
  return (
    <div className={CHART_CARD}>
      <p className="mb-2 text-[11px] font-bold text-gray-700">Investment Portfolio Performance (NPV)</p>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="name" tick={TICK} axisLine={false} tickLine={false} interval={0} angle={-20} textAnchor="end" height={60} />
          <YAxis tick={TICK} axisLine={false} tickLine={false} tickFormatter={tickFormatter} />
          <Tooltip formatter={(v: number) => fmtCategoryValue(v, "currency")} />
          <Bar dataKey="npv" name="NPV" radius={[4, 4, 0, 0]}>
            {data.map((d, i) => <Cell key={i} fill={d.npv >= 0 ? "#10b981" : "#ef4444"} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Forecast vs Actual — from the persisted Forecast snapshots list. */
export function ForecastVsActualChart({ snapshots }: { snapshots: any[] }) {
  if (snapshots.length === 0) return null;
  const data = [...snapshots].reverse().map((s) => {
    const revenueKpi = (s.predictions?.kpis || []).find((k: any) => k.key === "revenue");
    return { label: new Date(s.targetStartDate).toLocaleDateString("en-IN", { month: "short", year: "2-digit" }), forecast: revenueKpi?.predicted ?? 0 };
  });
  return (
    <div className={CHART_CARD}>
      <p className="mb-2 text-[11px] font-bold text-gray-700">Forecast Trend (Revenue)</p>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="label" tick={TICK} axisLine={false} tickLine={false} />
          <YAxis tick={TICK} axisLine={false} tickLine={false} tickFormatter={tickFormatter} />
          <Tooltip formatter={(v: number) => fmtCategoryValue(v, "currency")} />
          <Area type="monotone" dataKey="forecast" name="Forecasted Revenue" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/** A simple day-by-day revenue heat map (only meaningful at daily granularity) — recharts has no native heat map, so this is a colored CSS grid, the practical interpretation used elsewhere in this app (Investment's cash-flow "waterfall"). */
export function RevenueHeatMap({ points }: { points: { label: string; revenue: number }[] }) {
  const max = Math.max(...points.map((p) => p.revenue), 1);
  return (
    <div className={CHART_CARD}>
      <p className="mb-2 text-[11px] font-bold text-gray-700">Revenue Heat Map</p>
      <div className="grid grid-cols-7 gap-1.5">
        {points.map((p) => {
          const intensity = Math.min(1, p.revenue / max);
          return (
            <div key={p.label} title={`${p.label}: ${fmtCategoryValue(p.revenue, "currency")}`} className="flex aspect-square items-center justify-center rounded-md text-[9px] font-semibold text-white" style={{ backgroundColor: `rgba(177,0,0,${0.15 + intensity * 0.75})` }}>
              {p.label.split("-").slice(2).join("")}
            </div>
          );
        })}
      </div>
    </div>
  );
}
