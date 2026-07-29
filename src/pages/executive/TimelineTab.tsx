import { useEffect, useState } from "react";
import { useAppSelector } from "../../store";
import { fmtCategoryValue, GRANULARITY_OPTIONS } from "./executiveCategories";
import { BudgetAchievementChart, ForecastVsActualChart, RevenueHeatMap, TrendChart } from "./ExecutiveCharts";

const INVESTMENT_STATUS_LABEL: Record<string, string> = { PLANNED: "Planned", IN_PROGRESS: "In Progress", COMPLETED: "Completed", CANCELLED: "Cancelled" };

export default function TimelineTab() {
  const { selectedBranch } = useAppSelector((s) => s.branch);
  const { user, token } = useAppSelector((s) => s.auth);
  const API_URL = import.meta.env.VITE_API_URL;

  const [scope, setScope] = useState<"branch" | "restaurant">("branch");
  const [granularity, setGranularity] = useState("monthly");
  const [timeline, setTimeline] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchTimeline = async () => {
      if (!user?.restaurantId) return;
      setLoading(true);
      try {
        const branchParam = scope === "branch" && selectedBranch?.id ? `&branchId=${selectedBranch.id}` : "";
        const res = await fetch(`${API_URL}/api/executive/${user.restaurantId}/timeline?granularity=${granularity}${branchParam}`, { headers: { Authorization: `Bearer ${token}` } });
        const json = await res.json();
        if (json.success) setTimeline(json.data);
      } catch {
        // fetch error — silently ignored
      } finally {
        setLoading(false);
      }
    };
    fetchTimeline();
  }, [user?.restaurantId, selectedBranch?.id, scope, granularity]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-[16px] font-bold text-gray-900">Executive Timeline</h3>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 rounded-xl bg-gray-100 p-1">
            <button type="button" onClick={() => setScope("branch")} className={`rounded-lg px-3 py-1.5 text-[11px] font-semibold transition ${scope === "branch" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
              {selectedBranch?.name || "This Branch"}
            </button>
            <button type="button" onClick={() => setScope("restaurant")} className={`rounded-lg px-3 py-1.5 text-[11px] font-semibold transition ${scope === "restaurant" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
              Entire Restaurant
            </button>
          </div>
          <div className="flex items-center gap-1 rounded-xl bg-gray-100 p-1">
            {GRANULARITY_OPTIONS.map((g) => (
              <button key={g.key} type="button" onClick={() => setGranularity(g.key)} className={`rounded-lg px-3 py-1.5 text-[11px] font-semibold transition ${granularity === g.key ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
                {g.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading && <div className="flex h-40 items-center justify-center text-[12px] text-gray-400">Loading…</div>}

      {!loading && timeline && (
        <>
          <TrendChart points={timeline.points} />
          {granularity === "daily" && <RevenueHeatMap points={timeline.points} />}
          <BudgetAchievementChart data={timeline.budgetAchievementTrend} />
          <ForecastVsActualChart snapshots={timeline.forecastSnapshots} />

          <div className="overflow-hidden rounded-xl border border-gray-200">
            <div className="bg-gray-50 px-4 py-2 text-[11px] font-bold text-gray-900">Investment Timeline</div>
            {timeline.investmentTimeline.length === 0 ? (
              <div className="p-4 text-center text-[11px] text-gray-400">No investment projects yet.</div>
            ) : (
              <table className="w-full text-[12px]">
                <thead className="text-[10px] font-bold uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="px-4 py-2 text-left">Project</th>
                    <th className="px-3 py-2 text-left">Type</th>
                    <th className="px-3 py-2 text-left">Planned Start</th>
                    <th className="px-3 py-2 text-right">Initial Investment</th>
                    <th className="px-3 py-2 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {timeline.investmentTimeline.map((p: any) => (
                    <tr key={p.id} className="border-t border-gray-100">
                      <td className="px-4 py-2 font-medium text-gray-700">{p.name}</td>
                      <td className="px-3 py-2 text-gray-600">{p.type}</td>
                      <td className="px-3 py-2 text-gray-600">{new Date(p.plannedStartDate).toLocaleDateString("en-IN")}</td>
                      <td className="px-3 py-2 text-right text-gray-900">{fmtCategoryValue(p.initialInvestment, "currency")}</td>
                      <td className="px-3 py-2 text-gray-600">{INVESTMENT_STATUS_LABEL[p.status] || p.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}
