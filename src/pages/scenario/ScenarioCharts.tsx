import { useState } from "react";
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
import { fmtCategoryValue } from "./scenarioCategories";

const TICK = { fontSize: 10, fill: "#6b7280" };
const CHART_CARD = "overflow-hidden rounded-xl border border-gray-200 bg-white p-3 shadow-sm";

type ChartMode = "line" | "bar" | "area" | "stacked";

// Revenue/Expense/Profit/EBITDA/Food Cost/Labour/Cash Flow/Break-even
// Comparison — spec section 9's exact list. Cards for KPIs the backend
// returned as null (e.g. Cash Flow, not yet available) are simply skipped.
const CHART_KPIS = [
  { key: "revenue", label: "Revenue" },
  { key: "operatingExpenses", label: "Operating Expenses" },
  { key: "netProfit", label: "Net Profit" },
  { key: "ebitda", label: "EBITDA" },
  { key: "foodCost", label: "Food Cost" },
  { key: "labour", label: "Labour" },
  { key: "cashFlow", label: "Cash Flow" },
  { key: "breakEvenRevenue", label: "Break-even Sales" },
];

function BaselineVsProjectedChart({ mode, baseline, projected, unit, color }: { mode: ChartMode; baseline: number; projected: number; unit: string; color: string }) {
  const data = [
    { name: "Baseline", value: baseline },
    { name: "Projected", value: projected },
  ];
  const tickFormatter = (v: number) => (unit === "percentage" ? `${v}%` : Math.abs(v) >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v));

  if (mode === "stacked") {
    const delta = projected - baseline;
    const stackedData = [{ name: "Baseline → Projected", baseline: baseline, delta: delta >= 0 ? delta : 0, negDelta: delta < 0 ? Math.abs(delta) : 0 }];
    return (
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={stackedData} layout="vertical" margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis type="number" tick={TICK} axisLine={false} tickLine={false} tickFormatter={tickFormatter} />
          <YAxis type="category" dataKey="name" tick={TICK} axisLine={false} tickLine={false} width={110} />
          <Tooltip formatter={tooltipFormatter((v) => fmtCategoryValue(v, unit as any))} />
          <Bar dataKey="baseline" stackId="a" name="Baseline" fill="#9ca3af" radius={[4, 0, 0, 4]} />
          <Bar dataKey="delta" stackId="a" name="Increase" fill="#10b981" radius={[0, 4, 4, 0]} />
          <Bar dataKey="negDelta" stackId="a" name="Decrease" fill="#ef4444" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={180}>
      {mode === "line" ? (
        <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="name" tick={TICK} axisLine={false} tickLine={false} />
          <YAxis tick={TICK} axisLine={false} tickLine={false} tickFormatter={tickFormatter} />
          <Tooltip formatter={tooltipFormatter((v) => fmtCategoryValue(v, unit as any))} />
          <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={{ r: 4 }} />
        </LineChart>
      ) : mode === "area" ? (
        <AreaChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="name" tick={TICK} axisLine={false} tickLine={false} />
          <YAxis tick={TICK} axisLine={false} tickLine={false} tickFormatter={tickFormatter} />
          <Tooltip formatter={tooltipFormatter((v) => fmtCategoryValue(v, unit as any))} />
          <Area type="monotone" dataKey="value" stroke={color} fill={color} fillOpacity={0.2} />
        </AreaChart>
      ) : (
        <BarChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="name" tick={TICK} axisLine={false} tickLine={false} />
          <YAxis tick={TICK} axisLine={false} tickLine={false} tickFormatter={tickFormatter} />
          <Tooltip formatter={tooltipFormatter((v) => fmtCategoryValue(v, unit as any))} />
          <Bar dataKey="value" radius={[4, 4, 0, 0]}>
            <Cell fill="#9ca3af" />
            <Cell fill={color} />
          </Bar>
        </BarChart>
      )}
    </ResponsiveContainer>
  );
}

export default function ScenarioCharts({ kpis }: { kpis: any[] }) {
  const [mode, setMode] = useState<ChartMode>("bar");
  const byKey = Object.fromEntries((kpis || []).map((k) => [k.key, k]));

  const variancePctData = CHART_KPIS.map((c) => ({ name: c.label, variancePercentage: byKey[c.key]?.variancePercentage ?? null })).filter(
    (d) => d.variancePercentage !== null,
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-[13px] font-bold text-gray-900">Baseline vs Projected</h4>
        <div className="flex items-center gap-1 rounded-xl bg-gray-100 p-1">
          {(["line", "bar", "area", "stacked"] as ChartMode[]).map((m) => (
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

      <div className={CHART_CARD}>
        <p className="mb-2 text-[11px] font-bold text-gray-700">Variance % by KPI (Projected vs Actual)</p>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={variancePctData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="name" tick={TICK} axisLine={false} tickLine={false} interval={0} angle={-20} textAnchor="end" height={50} />
            <YAxis tick={TICK} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
            <Tooltip formatter={tooltipFormatter((v) => `${v.toFixed(1)}%`)} />
            <Legend wrapperStyle={{ fontSize: 10 }} />
            <Bar dataKey="variancePercentage" name="Variance %" radius={[4, 4, 0, 0]}>
              {variancePctData.map((d, i) => (
                <Cell key={i} fill={d.variancePercentage >= 0 ? "#10b981" : "#ef4444"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
        {CHART_KPIS.map((c) => {
          const row = byKey[c.key];
          if (!row || row.baseline === null || row.projected === null) return null;
          return (
            <div key={c.key} className={CHART_CARD}>
              <p className="mb-2 text-[11px] font-bold text-gray-700">{c.label}</p>
              <BaselineVsProjectedChart mode={mode} baseline={row.baseline} projected={row.projected} unit={row.unit} color="#b10000" />
            </div>
          );
        })}
      </div>
    </div>
  );
}
