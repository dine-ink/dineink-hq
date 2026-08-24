import { useEffect, useState } from "react";
import { useAppSelector } from "../../store";
import { fmtCategoryValue } from "./forecastCategories";
import MobileTableCards from "../../components/common/MobileTableCards";

const localDateStr = (iso: string) => {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const PERIOD_LABELS: Record<string, string> = {
  NEXT_WEEK: "Week", NEXT_MONTH: "Month", NEXT_QUARTER: "Quarter", NEXT_6_MONTHS: "6 Months", NEXT_YEAR: "Year",
};

export default function AccuracyTab() {
  const { selectedBranch } = useAppSelector((s) => s.branch);
  const { user, token } = useAppSelector((s) => s.auth);
  const API_URL = import.meta.env.VITE_API_URL;

  const [scope, setScope] = useState<"branch" | "restaurant">("branch");
  const [snapshots, setSnapshots] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [comparison, setComparison] = useState<any>(null);
  const [accuracyReport, setAccuracyReport] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const branchParam = scope === "branch" && selectedBranch?.id ? `branchId=${selectedBranch.id}` : "branchId=null";

  useEffect(() => {
    const fetchSnapshots = async () => {
      if (!user?.restaurantId) return;
      setLoading(true);
      try {
        const [listRes, accuracyRes] = await Promise.all([
          fetch(`${API_URL}/api/forecasts/${user.restaurantId}?${branchParam}`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API_URL}/api/forecasts/${user.restaurantId}/accuracy?${branchParam}`, { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        const listJson = await listRes.json();
        const accuracyJson = await accuracyRes.json();
        if (listJson.success) {
          setSnapshots(listJson.data);
          setSelectedId(listJson.data[0]?.id ?? null);
        }
        if (accuracyJson.success) setAccuracyReport(accuracyJson.data);
      } catch {
        // fetch error — silently ignored
      } finally {
        setLoading(false);
      }
    };
    fetchSnapshots();
  }, [user?.restaurantId, selectedBranch?.id, scope]);

  useEffect(() => {
    const fetchComparison = async () => {
      if (!selectedId || !user?.restaurantId) {
        setComparison(null);
        return;
      }
      try {
        const res = await fetch(`${API_URL}/api/forecasts/${user.restaurantId}/${selectedId}/vs-actual`, { headers: { Authorization: `Bearer ${token}` } });
        const json = await res.json();
        if (json.success) setComparison(json.data);
      } catch {
        // fetch error — silently ignored
      }
    };
    fetchComparison();
  }, [selectedId]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-[16px] font-bold text-gray-900">Forecast Accuracy</h3>
        <div className="flex items-center gap-1 rounded-xl bg-gray-100 p-1">
          <button type="button" onClick={() => setScope("branch")} className={`rounded-lg px-3 py-1.5 text-[11px] font-semibold transition ${scope === "branch" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
            {selectedBranch?.name || "This Branch"}
          </button>
          <button type="button" onClick={() => setScope("restaurant")} className={`rounded-lg px-3 py-1.5 text-[11px] font-semibold transition ${scope === "restaurant" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
            Entire Restaurant
          </button>
        </div>
      </div>

      {loading && <div className="flex h-24 items-center justify-center text-[12px] text-gray-400">Loading…</div>}

      {!loading && (
        <>
          {/* AGGREGATE ACCURACY SUMMARY */}
          {accuracyReport && accuracyReport.completedForecastCount > 0 ? (
            <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <h4 className="mb-3 text-[13px] font-bold text-gray-900">
                Average Accuracy — across {accuracyReport.completedForecastCount} completed forecast(s)
              </h4>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-6">
                {accuracyReport.kpiAccuracy.map((k: any) => (
                  <div key={k.key} className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500">{k.label}</p>
                    <p className="mt-1 text-[18px] font-extrabold text-gray-900">{k.averageAccuracyPercentage.toFixed(1)}%</p>
                    <p className="text-[10px] text-gray-400">{k.sampleSize} sample(s)</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex h-20 items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50 text-[12px] text-gray-400">
              No completed forecasts yet — accuracy becomes available once a forecasted period ends and real actuals exist.
            </div>
          )}

          {/* SNAPSHOT LIST + DETAIL */}
          {snapshots.length > 0 && (
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
              <div className="overflow-hidden rounded-xl border border-gray-200 xl:col-span-1">
                <div className="bg-gray-50 px-4 py-2 text-[11px] font-bold text-gray-900">Forecast History</div>
                <div className="max-h-[420px] overflow-y-auto">
                  {snapshots.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setSelectedId(s.id)}
                      className={`block w-full border-t border-gray-100 px-4 py-2.5 text-left text-[12px] transition ${selectedId === s.id ? "bg-red-50" : "hover:bg-gray-50"}`}
                    >
                      <p className="font-semibold text-gray-900">{PERIOD_LABELS[s.periodType] || s.periodType}</p>
                      <p className="text-[10px] text-gray-400">{localDateStr(s.targetStartDate)} → {localDateStr(s.targetEndDate)}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="xl:col-span-2">
                {comparison && (
                  <div className="overflow-hidden rounded-xl border border-gray-200">
                    <div className="flex items-center justify-between bg-gray-50 px-4 py-2">
                      <span className="text-[11px] font-bold text-gray-900">
                        {localDateStr(comparison.targetStartDate)} → {localDateStr(comparison.targetEndDate)}
                      </span>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${comparison.isComplete ? "bg-emerald-100 text-emerald-700" : "bg-gray-200 text-gray-600"}`}>
                        {comparison.isComplete ? "Completed" : "In Progress"}
                      </span>
                    </div>
                    <div className="overflow-x-auto">
                    <MobileTableCards>
                    <table className="w-full text-[12px] min-w-[36rem]">
                      <thead className="text-[10px] font-bold uppercase tracking-wide text-gray-500">
                        <tr>
                          <th className="px-4 py-2 text-left">KPI</th>
                          <th className="px-3 py-2 text-right">Forecast</th>
                          <th className="px-3 py-2 text-right">Actual</th>
                          <th className="px-3 py-2 text-right">Variance %</th>
                          <th className="px-3 py-2 text-right">Accuracy %</th>
                        </tr>
                      </thead>
                      <tbody>
                        {comparison.rows.map((r: any) => (
                          <tr key={r.key} className="border-t border-gray-100">
                            <td className="px-4 py-2 font-medium text-gray-700">{r.label}</td>
                            <td className="px-3 py-2 text-right text-gray-600">{fmtCategoryValue(r.forecast, r.unit)}</td>
                            <td className="px-3 py-2 text-right text-gray-900">{r.actual != null ? fmtCategoryValue(r.actual, r.unit) : "Pending"}</td>
                            <td className="px-3 py-2 text-right text-gray-600">{r.variancePercentage != null ? `${r.variancePercentage.toFixed(1)}%` : "—"}</td>
                            <td className="px-3 py-2 text-right font-semibold text-gray-900">{r.accuracyPercentage != null ? `${r.accuracyPercentage.toFixed(1)}%` : "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    </MobileTableCards>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
