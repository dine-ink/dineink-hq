import { useState } from "react";
import { useAppSelector } from "@/store";
import { useGetScorecardsQuery } from "@/store/api/executiveApi";
import { fmtCategoryValue, PERIOD_OPTIONS, STATUS_STYLES } from "./executiveCategories";
import { TrendIcon } from "@/utils/kpiDisplay";
import { trendStyle } from "@/utils/kpiStyles";

export default function ScorecardsTab() {
  const { selectedBranch } = useAppSelector((s) => s.branch);
  const { user } = useAppSelector((s) => s.auth);

  const [scope, setScope] = useState<"branch" | "restaurant">("branch");
  const [period, setPeriod] = useState("currentMonth");

  const { data: rows = [], isFetching: loading } = useGetScorecardsQuery(
    {
      restaurantId: user?.restaurantId as number,
      branchId: scope === "branch" ? selectedBranch?.id : null,
      period,
    },
    { skip: !user?.restaurantId },
  );



  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-[16px] font-bold text-gray-900">KPI Scorecards</h3>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 rounded-xl bg-gray-100 p-1">
            <button type="button" onClick={() => setScope("branch")} className={`rounded-lg px-3 py-1.5 text-[11px] font-semibold transition ${scope === "branch" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
              {selectedBranch?.name || "This Branch"}
            </button>
            <button type="button" onClick={() => setScope("restaurant")} className={`rounded-lg px-3 py-1.5 text-[11px] font-semibold transition ${scope === "restaurant" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
              Entire Restaurant
            </button>
          </div>
          <select value={period} onChange={(e) => setPeriod(e.target.value)} className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-[12px] font-semibold text-gray-700 outline-none">
            {PERIOD_OPTIONS.filter((p) => p.key !== "custom").map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex h-40 items-center justify-center text-[12px] text-gray-400">Loading…</div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {rows.map((row) => {
            const style = STATUS_STYLES[row.status] || STATUS_STYLES["no-data"];
            return (
              <div key={row.key} className={`rounded-2xl border ${style.border} ${style.bg} p-4 shadow-sm`}>
                <div className="flex items-center justify-between">
                  <p className="text-[12px] font-bold text-gray-900">{row.label}</p>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${style.text}`}>{row.status}</span>
                </div>
                <p className="mt-2 text-[22px] font-extrabold text-gray-900">{fmtCategoryValue(row.current, row.unit)}</p>
                <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
                  <div><p className="text-gray-400">Target</p><p className="font-semibold text-gray-700">{row.target != null ? fmtCategoryValue(row.target, row.unit) : "—"}</p></div>
                  <div><p className="text-gray-400">Previous Period</p><p className="font-semibold text-gray-700">{row.previousPeriod != null ? fmtCategoryValue(row.previousPeriod, row.unit) : "—"}</p></div>
                  <div><p className="text-gray-400">Budget</p><p className="font-semibold text-gray-700">{row.budget != null ? fmtCategoryValue(row.budget, row.unit) : "—"}</p></div>
                  <div><p className="text-gray-400">Forecast (Next Month)</p><p className="font-semibold text-gray-700">{row.forecast != null ? fmtCategoryValue(row.forecast, row.unit) : "—"}</p></div>
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-white/60 pt-2">
                  <span className={`flex items-center gap-1 text-[11px] font-semibold ${trendStyle(row.trendDirection, row.higherIsBetter)}`}>
                    <TrendIcon direction={row.trendDirection} /> Trend
                  </span>
                  <span className="text-[11px] font-semibold text-gray-500">
                    {row.achievementPercentage != null ? `${row.achievementPercentage.toFixed(0)}% achieved` : "No target"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
