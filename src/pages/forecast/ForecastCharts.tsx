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
import { tooltipFormatter } from "@/utils/chartFormatters";
import { fmtCategoryValue } from "./forecastCategories";

const TICK = { fontSize: 10, fill: "#6b7280" };
const CHART_CARD = "overflow-hidden rounded-xl border border-gray-200 bg-white p-3 shadow-sm";

type ChartMode = "line" | "bar" | "area";

// Revenue/Profit/EBITDA/Food Cost/Labour/Expense/Cash Flow Forecast — spec
// section 6's exact list. Cards for KPIs the backend returned as null (e.g.
// Cash Flow, no real data source yet anywhere in the app) are skipped.
const CHART_KPIS = [
  { key: "revenue", label: "Revenue Forecast" },
  { key: "netProfit", label: "Profit Forecast" },
  { key: "ebitda", label: "EBITDA Forecast" },
  { key: "foodCost", label: "Food Cost Forecast" },
  { key: "labourCost", label: "Labour Forecast" },
  { key: "operatingExpenses", label: "Expense Forecast" },
  { key: "cashFlow", label: "Cash Flow Forecast" },
];

function LastPeriodVsForecastChart({ mode, baseline, predicted, unit, color }: { mode: ChartMode; baseline: number; predicted: number; unit: string; color: string }) {
  const data = [
    { name: "Last Period", value: baseline },
    { name: "Forecast", value: predicted },
  ];
  const tickFormatter = (v: number) => (unit === "percentage" ? `${v}%` : Math.abs(v) >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v));

  return (
    <ResponsiveContainer width="100%" height={180}>
      {mode === "line" ? (
        <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="name" tick={TICK} axisLine={false} tickLine={false} />
          <YAxis tick={TICK} axisLine={false} tickLine={false} tickFormatter={tickFormatter} />
          <Tooltip formatter={tooltipFormatter((v) => fmtCategoryValue(v, unit as any))} />
          <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={{ r: 4 }} strokeDasharray={undefined} />
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

export default function ForecastCharts({ kpis }: { kpis: any[] }) {
  const [mode, setMode] = useState<ChartMode>("bar");
  const byKey = Object.fromEntries((kpis || []).map((k) => [k.key, k]));

  const variancePctData = CHART_KPIS.map((c) => ({ name: c.label.replace(" Forecast", ""), variancePercentage: byKey[c.key]?.variancePercentage ?? null })).filter(
    (d) => d.variancePercentage !== null,
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-[13px] font-bold text-gray-900">Forecast Charts</h4>
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

      <div className={CHART_CARD}>
        <p className="mb-2 text-[11px] font-bold text-gray-700">Expected Growth — Variance % vs Last Period</p>
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
          if (!row || row.baseline === null || row.predicted === null) return null;
          return (
            <div key={c.key} className={CHART_CARD}>
              <p className="mb-2 text-[11px] font-bold text-gray-700">{c.label}</p>
              <LastPeriodVsForecastChart mode={mode} baseline={row.baseline} predicted={row.predicted} unit={row.unit} color="#b10000" />
            </div>
          );
        })}
      </div>
    </div>
  );
}
