import { useState } from "react";
import { useGetPeakHourForecastQuery } from "@/store/api/forecastApi";
import { ClockIcon, UsersIcon } from "@heroicons/react/24/outline";
import { BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { useAppSelector } from "@/store";
import { MetricCard } from "@/design";
import { CONFIDENCE_STYLES, MODEL_OPTIONS, PERIOD_OPTIONS } from "./forecastCategories";
import { TrendIcon } from "@/utils/kpiDisplay";
import { trendStyle } from "@/utils/kpiStyles";

const TICK = { fontSize: 10, fill: "#6b7280" };
const CHART_CARD = "overflow-hidden rounded-xl border border-gray-200 bg-white p-3 shadow-sm";

export default function PeakHourForecastTab() {
  const { selectedBranch } = useAppSelector((s) => s.branch);
  const { user } = useAppSelector((s) => s.auth);

  const [scope, setScope] = useState<"branch" | "restaurant">("branch");
  const [period, setPeriod] = useState("NEXT_MONTH");
  const [model, setModel] = useState("HISTORICAL_TREND");

  // On failure this used to set data to null; RTK Query leaves it undefined,
  // which the `data && ...` guards below treat identically.
  const { data, isFetching: loading } = useGetPeakHourForecastQuery(
    {
      restaurantId: user?.restaurantId as number,
      branchId: scope === "branch" ? selectedBranch?.id : undefined,
      period,
      model,
    },
    { skip: !user?.restaurantId },
  );

  // perPeriod is the busiest hour's projected TOTAL order count, one entry
  // per future week/month in the horizon — not an hour-of-day breakdown
  // (the backend has no hour-of-day data to forecast with; see
  // getPeakHourForecastService's own header comment). Labeled generically
  // since the API doesn't return a date per entry, only the granularity.
  const perPeriod: number[] = Array.isArray(data?.perPeriod) ? data.perPeriod : [];
  const periodNoun = data?.granularity === "week" ? "Week" : "Month";
  const chartData = perPeriod.map((value, i) => ({ name: `${periodNoun} ${i + 1}`, projectedOrders: Math.round(value) }));

  const confidenceStyle = CONFIDENCE_STYLES[data?.confidence] || CONFIDENCE_STYLES.low;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 rounded-xl bg-gray-100 p-1">
            <button
              type="button"
              onClick={() => setScope("branch")}
              className={`rounded-lg px-3 py-1.5 text-[11px] font-semibold transition ${scope === "branch" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
            >
              {selectedBranch?.name || "This Branch"}
            </button>
            <button
              type="button"
              onClick={() => setScope("restaurant")}
              className={`rounded-lg px-3 py-1.5 text-[11px] font-semibold transition ${scope === "restaurant" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
            >
              Entire Restaurant
            </button>
          </div>
          <select value={period} onChange={(e) => setPeriod(e.target.value)} className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-[12px] font-semibold text-gray-700 outline-none">
            {PERIOD_OPTIONS.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
          </select>
          <select value={model} onChange={(e) => setModel(e.target.value)} className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-[12px] font-semibold text-gray-700 outline-none">
            {MODEL_OPTIONS.map((m) => <option key={m.key} value={m.key}>{m.label}</option>)}
          </select>
        </div>

        {data && (
          <div className={`flex items-center gap-2 rounded-xl border ${confidenceStyle.border} ${confidenceStyle.bg} px-3 py-1.5`}>
            <span className={`h-2 w-2 rounded-full ${confidenceStyle.dot}`} />
            <span className={`text-[11px] font-bold capitalize ${confidenceStyle.text}`}>{data.confidence} Confidence</span>
            <span className="text-[10px] text-gray-400">· {data.historicalPeriodsUsed} period(s) of history</span>
          </div>
        )}
      </div>

      {loading && <div className="flex h-24 items-center justify-center text-[12px] text-gray-400">Generating forecast…</div>}

      {!loading && !data && (
        <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50 text-[12px] text-gray-400">
          No peak hour forecast available yet.
        </div>
      )}

      {!loading && data && (
        <>
          {data.confidenceReasons?.length > 0 && (
            <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5">
              <p className="text-[11px] font-semibold text-gray-600">Why this confidence level:</p>
              <ul className="mt-1 list-inside list-disc space-y-0.5 text-[11px] text-gray-500">
                {data.confidenceReasons.map((r: string, i: number) => <li key={i}>{r}</li>)}
              </ul>
            </div>
          )}

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="rounded-2xl border border-gray-200 bg-white p-3.5 shadow-sm">
              <div className="flex items-center gap-2">
                <ClockIcon className="h-4 w-4 text-gray-400" />
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-500">Projected Peak-Hour Orders</p>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <p className="text-[20px] font-extrabold tracking-tight text-gray-900">{data.predictedPeakHourOrders ?? "—"}</p>
                {data.baselinePeakHourOrders != null && <p className="text-[11px] text-gray-400">was {data.baselinePeakHourOrders}</p>}
              </div>
              <div className="mt-2 flex items-center gap-1 text-[11px] font-semibold">
                <span className={`flex items-center gap-1 ${trendStyle(data.trendDirection, true)}`}>
                  <TrendIcon direction={data.trendDirection} />
                  {data.variancePercentage != null ? `${data.variancePercentage > 0 ? "+" : ""}${data.variancePercentage.toFixed(1)}% vs last period` : "—"}
                </span>
              </div>
            </div>
            <MetricCard
              label="Projected Staff Requirement"
              value={data.projectedStaffRequirement != null ? String(data.projectedStaffRequirement) : "—"}
              sub="staff recommended during peak"
              icon={UsersIcon}
              status="secondary"
            />
          </div>

          {chartData.length > 1 && (
            <div className={CHART_CARD}>
              <p className="mb-2 text-[11px] font-bold text-gray-700">Projected Peak-Hour Orders by {periodNoun}</p>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={TICK} axisLine={false} tickLine={false} />
                  <YAxis tick={TICK} axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Bar dataKey="projectedOrders" name="Projected Orders" fill="#b10000" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      )}
    </div>
  );
}
