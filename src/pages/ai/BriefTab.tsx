import { useEffect, useState } from "react";
import { useAppSelector } from "@/store";
import { PERIOD_OPTIONS } from "./aiCategories";
import InsightCard from "./InsightCard";
import MobileTableCards from "@/components/common/MobileTableCards";
import {
  ClipboardDocumentCheckIcon,
  HeartIcon,
  ShieldExclamationIcon,
  TrophyIcon,
} from "@heroicons/react/24/outline";

const HEALTH_STYLE: Record<
  string,
  { text: string; border: string; bg: string }
> = {
  excellent: {
    text: "text-emerald-700",
    border: "border-emerald-200",
    bg: "bg-emerald-50",
  },
  good: { text: "text-blue-700", border: "border-blue-200", bg: "bg-blue-50" },
  warning: {
    text: "text-amber-700",
    border: "border-amber-200",
    bg: "bg-amber-50",
  },
  critical: { text: "text-red-700", border: "border-red-200", bg: "bg-red-50" },
  "no-data": {
    text: "text-gray-500",
    border: "border-gray-200",
    bg: "bg-gray-50",
  },
};

export default function BriefTab() {
  const { selectedBranch } = useAppSelector((s) => s.branch);
  const { user, token } = useAppSelector((s) => s.auth);
  const API_URL = import.meta.env.VITE_API_URL;

  const [scope, setScope] = useState<"branch" | "restaurant">("branch");
  const [period, setPeriod] = useState("currentMonth");
  const [brief, setBrief] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const branchParam =
    scope === "branch" && selectedBranch?.id
      ? `&branchId=${selectedBranch.id}`
      : "";

  useEffect(() => {
    const run = async () => {
      if (!user?.restaurantId) return;
      setLoading(true);
      try {
        const res = await fetch(
          `${API_URL}/api/ai/${user.restaurantId}/executive-brief?period=${period}${branchParam}`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        const json = await res.json();
        if (json.success) setBrief(json.data);
      } catch {
        // fetch error — silently ignored
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [user?.restaurantId, selectedBranch?.id, scope, period]);

  const healthStyle = brief
    ? HEALTH_STYLE[brief.businessHealth.status] || HEALTH_STYLE["no-data"]
    : HEALTH_STYLE["no-data"];

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
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-[12px] font-semibold text-gray-700 outline-none"
          >
            {PERIOD_OPTIONS.map((p) => (
              <option key={p.key} value={p.key}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
        {brief && (
          <p className="text-[11px] text-gray-400">
            Generated {new Date(brief.generatedAt).toLocaleString("en-IN")}
          </p>
        )}
      </div>

      {loading && (
        <div className="flex h-24 items-center justify-center text-[12px] text-gray-400">
          Preparing today's brief…
        </div>
      )}

      {!loading && brief && (
        <>
          <div
            className={`rounded-2xl border ${healthStyle.border} ${healthStyle.bg} p-4 shadow-sm`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`flex h-14 w-14 items-center justify-center rounded-full border-4 ${healthStyle.border} bg-white`}
              >
                <HeartIcon className={`h-6 w-6 ${healthStyle.text}`} />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                  Business Health
                </p>
                <p className={`text-[22px] font-black ${healthStyle.text}`}>
                  {brief.businessHealth.overall}/100{" "}
                  <span className="text-[13px] font-semibold capitalize">
                    ({brief.businessHealth.status})
                  </span>
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500">
                Budget Performance
              </p>
              <p className="mt-1 text-[12px] text-gray-700">
                {brief.budgetPerformance}
              </p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500">
                Forecast Summary
              </p>
              <p className="mt-1 text-[12px] text-gray-700">
                {brief.forecastSummary}
              </p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500">
                Investment Updates
              </p>
              <p className="mt-1 text-[12px] text-gray-700">
                {brief.investmentUpdates}
              </p>
            </div>
          </div>

          <div>
            <h4 className="mb-2 flex items-center gap-1.5 text-[13px] font-bold text-gray-900">
              <ClipboardDocumentCheckIcon className="h-4 w-4 text-[#b10000]" /> Immediate
              Priorities
            </h4>
            <ul className="space-y-1.5">
              {brief.immediatePriorities.map((p: string, i: number) => (
                <li
                  key={i}
                  className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-[12px] font-medium text-gray-700 shadow-sm"
                >
                  {p}
                </li>
              ))}
            </ul>
          </div>

          {brief.branchRankings.length > 0 && (
            <div>
              <h4 className="mb-2 text-[13px] font-bold text-gray-900">
                Branch Rankings
              </h4>
              <div className="overflow-x-auto rounded-xl border border-gray-200">
                <MobileTableCards>
                <table className="w-full text-[12px]">
                  <thead className="bg-gray-50 text-[10px] font-bold uppercase tracking-wide text-gray-500">
                    <tr>
                      <th className="px-4 py-2 text-left">Branch</th>
                      <th className="px-3 py-2 text-right">Health Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {brief.branchRankings.map((b: any, i: number) => (
                      <tr key={i} className="border-t border-gray-100">
                        <td className="px-4 py-2 font-medium text-gray-700">
                          {b.name}
                        </td>
                        <td className="px-3 py-2 text-right font-semibold text-gray-900">
                          {b.healthScore}/100
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </MobileTableCards>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div>
              <h4 className="mb-2 flex items-center gap-1.5 text-[13px] font-bold text-gray-900">
                <TrophyIcon className="h-4 w-4 text-emerald-600" /> Biggest Wins
              </h4>
              {brief.biggestWins.length === 0 ? (
                <p className="text-[12px] text-gray-400">
                  No standout wins flagged this period.
                </p>
              ) : (
                <div className="space-y-2">
                  {brief.biggestWins.map((w: any, i: number) => (
                    <InsightCard key={i} insight={w} />
                  ))}
                </div>
              )}
            </div>
            <div>
              <h4 className="mb-2 flex items-center gap-1.5 text-[13px] font-bold text-gray-900">
                <ShieldExclamationIcon className="h-4 w-4 text-red-600" /> Biggest Risks
              </h4>
              {brief.biggestRisks.length === 0 ? (
                <p className="text-[12px] text-gray-400">
                  No significant risks flagged this period.
                </p>
              ) : (
                <div className="space-y-2">
                  {brief.biggestRisks.map((r: any, i: number) => (
                    <InsightCard key={i} insight={r} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
