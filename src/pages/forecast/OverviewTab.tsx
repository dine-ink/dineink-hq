import { useEffect, useMemo, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { useAppSelector } from "../../store";
import { CONFIDENCE_STYLES, fmtCategoryValue, FORECAST_KPIS, MODEL_OPTIONS, PERIOD_OPTIONS, WIDGET_KPIS } from "./forecastCategories";
import { ALERT_STYLES, AlertIcon, TrendIcon, trendStyle } from "../../utils/kpiDisplay";
import ForecastCharts from "./ForecastCharts";

export default function OverviewTab() {
  const { selectedBranch } = useAppSelector((s) => s.branch);
  const { user, token } = useAppSelector((s) => s.auth);
  const API_URL = import.meta.env.VITE_API_URL;

  const [scope, setScope] = useState<"branch" | "restaurant">("branch");
  const [period, setPeriod] = useState("NEXT_MONTH");
  const [model, setModel] = useState("HISTORICAL_TREND");
  const [forecast, setForecast] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchForecast = async () => {
      if (!user?.restaurantId) return;
      setLoading(true);
      try {
        const branchParam = scope === "branch" && selectedBranch?.id ? `&branchId=${selectedBranch.id}` : "";
        const res = await fetch(`${API_URL}/api/forecasts/${user.restaurantId}/generate?period=${period}&model=${model}${branchParam}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        if (json.success) setForecast(json.data);
      } catch {
        // fetch error — silently ignored
      } finally {
        setLoading(false);
      }
    };
    fetchForecast();
  }, [user?.restaurantId, selectedBranch?.id, scope, period, model]);

  const kpisByKey = useMemo(() => {
    const map = new Map<string, any>();
    (forecast?.kpis || []).forEach((k: any) => map.set(k.key, k));
    return map;
  }, [forecast]);

  const confidenceStyle = CONFIDENCE_STYLES[forecast?.overallConfidence] || CONFIDENCE_STYLES.low;
  const modelLabel = MODEL_OPTIONS.find((m) => m.key === forecast?.modelUsed)?.label || forecast?.modelUsed;
  const periodLabel = PERIOD_OPTIONS.find((p) => p.key === period)?.label;

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

        {forecast && (
          <div className={`flex items-center gap-2 rounded-xl border ${confidenceStyle.border} ${confidenceStyle.bg} px-3 py-1.5`}>
            <span className={`h-2 w-2 rounded-full ${confidenceStyle.dot}`} />
            <span className={`text-[11px] font-bold capitalize ${confidenceStyle.text}`}>{forecast.overallConfidence} Confidence</span>
            <span className="text-[10px] text-gray-400">· {modelLabel} · {forecast.historicalPeriodsUsed} period(s) of history</span>
          </div>
        )}
      </div>

      {loading && <div className="flex h-24 items-center justify-center text-[12px] text-gray-400">Generating forecast…</div>}

      {!loading && forecast && (
        <>
          {/* CONFIDENCE EXPLANATION */}
          {forecast.confidenceReasons?.length > 0 && (
            <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5">
              <p className="text-[11px] font-semibold text-gray-600">Why this confidence level:</p>
              <ul className="mt-1 list-inside list-disc space-y-0.5 text-[11px] text-gray-500">
                {forecast.confidenceReasons.map((r: string, i: number) => <li key={i}>{r}</li>)}
              </ul>
            </div>
          )}

          {/* UPCOMING RISKS / ALERTS */}
          {forecast.alerts?.length > 0 ? (
            <div className="space-y-2">
              <h4 className="text-[13px] font-bold text-gray-900">Upcoming Risks & Signals</h4>
              {forecast.alerts.map((a: any, i: number) => {
                const style = ALERT_STYLES[a.severity] || ALERT_STYLES.info;
                return (
                  <div key={i} className={`flex items-center gap-2 rounded-xl border ${style.border} ${style.bg} px-3 py-2 text-[12px] ${style.text}`}>
                    <AlertIcon severity={a.severity} /> {a.message}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-[12px] font-semibold text-emerald-700">
              <CheckCircle2 className="h-4 w-4" /> No risks detected for {periodLabel?.toLowerCase()}.
            </div>
          )}

          {/* KPI WIDGET CARDS */}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {WIDGET_KPIS.map((key) => {
              const row = kpisByKey.get(key);
              if (!row) return null;
              return (
                <div key={key} className="rounded-2xl border border-gray-200 bg-white p-3.5 shadow-sm">
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-500">{row.label}</p>
                  <div className="mt-2 flex items-baseline gap-2">
                    <p className="text-[20px] font-extrabold tracking-tight text-gray-900">{fmtCategoryValue(row.predicted, row.unit)}</p>
                    <p className="text-[11px] text-gray-400">was {fmtCategoryValue(row.baseline, row.unit)}</p>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <span className={`flex items-center gap-1 text-[11px] font-semibold ${trendStyle(row.trendDirection, row.higherIsBetter)}`}>
                      <TrendIcon direction={row.trendDirection} />
                      {row.variancePercentage != null ? `${row.variancePercentage > 0 ? "+" : ""}${row.variancePercentage.toFixed(1)}%` : "—"}
                    </span>
                    <span className="text-[10px] font-semibold text-gray-400">
                      {row.achievementPercentage != null ? `${row.achievementPercentage.toFixed(0)}% of target` : "No target set"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* CHARTS */}
          <ForecastCharts kpis={forecast.kpis} />

          {/* FULL KPI TABLE */}
          <div className="overflow-hidden rounded-xl border border-gray-200">
            <table className="w-full text-[12px]">
              <thead className="bg-gray-50 text-[10px] font-bold uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-4 py-2 text-left">KPI</th>
                  <th className="px-3 py-2 text-right">Last Period</th>
                  <th className="px-3 py-2 text-right">Forecast</th>
                  <th className="px-3 py-2 text-right">Variance %</th>
                  <th className="px-3 py-2 text-right">Achievement %</th>
                  <th className="px-3 py-2 text-center">Trend</th>
                </tr>
              </thead>
              <tbody>
                {FORECAST_KPIS.map((def) => {
                  const row = kpisByKey.get(def.key);
                  if (!row) return null;
                  return (
                    <tr key={def.key} className="border-t border-gray-100">
                      <td className="px-4 py-2 font-medium text-gray-700">{def.label}</td>
                      <td className="px-3 py-2 text-right text-gray-600">{fmtCategoryValue(row.baseline, row.unit)}</td>
                      <td className="px-3 py-2 text-right font-semibold text-gray-900">{fmtCategoryValue(row.predicted, row.unit)}</td>
                      <td className={`px-3 py-2 text-right font-semibold ${trendStyle(row.trendDirection, row.higherIsBetter)}`}>
                        {row.variancePercentage != null ? `${row.variancePercentage > 0 ? "+" : ""}${row.variancePercentage.toFixed(1)}%` : "—"}
                      </td>
                      <td className="px-3 py-2 text-right text-gray-600">{row.achievementPercentage != null ? `${row.achievementPercentage.toFixed(0)}%` : "—"}</td>
                      <td className="px-3 py-2 text-center">
                        <span className={`inline-flex ${trendStyle(row.trendDirection, row.higherIsBetter)}`}>
                          <TrendIcon direction={row.trendDirection} />
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
