import { useState } from "react";
import { useAppSelector } from "@/store";
import { useGetAiBranchNarrativesQuery } from "@/store/api/aiApi";
import { PERIOD_OPTIONS } from "./aiCategories";
import {
  ArrowTrendingUpIcon,
  LightBulbIcon,
  ShieldExclamationIcon,
} from "@heroicons/react/24/outline";

const scoreStyle = (score: number) => (score >= 70 ? "text-emerald-700 border-emerald-200 bg-emerald-50" : score >= 50 ? "text-amber-700 border-amber-200 bg-amber-50" : "text-red-700 border-red-200 bg-red-50");

export default function BranchNarrativesTab() {
  const { user } = useAppSelector((s) => s.auth);

  const [period, setPeriod] = useState("currentMonth");

  const { data: narratives = [], isFetching: loading } =
    useGetAiBranchNarrativesQuery(
      { restaurantId: user?.restaurantId as number, period },
      { skip: !user?.restaurantId },
    );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <select value={period} onChange={(e) => setPeriod(e.target.value)} className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-[12px] font-semibold text-gray-700 outline-none">
          {PERIOD_OPTIONS.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
        </select>
      </div>

      {loading && <div className="flex h-24 items-center justify-center text-[12px] text-gray-400">Comparing branches…</div>}

      {!loading && narratives.length === 0 && (
        <div className="flex h-24 items-center justify-center text-[12px] text-gray-400">Only one branch exists — nothing to compare against yet.</div>
      )}

      {!loading && narratives.length > 0 && (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {narratives.map((n) => (
            <div key={n.branchId} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-[14px] font-bold text-gray-900">{n.branchName}</p>
                <span className={`rounded-full border px-2.5 py-1 text-[11px] font-bold ${scoreStyle(n.healthScore)}`}>{n.healthScore}/100</span>
              </div>
              <p className="mt-2 text-[12px] text-gray-700">{n.narrative}</p>

              {n.strengths.length > 0 && (
                <div className="mt-3">
                  <p className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-emerald-600"><ArrowTrendingUpIcon className="h-3 w-3" /> Strengths</p>
                  <ul className="mt-1 list-inside list-disc space-y-0.5 text-[11px] text-gray-600">
                    {n.strengths.map((s: string, i: number) => <li key={i}>{s}</li>)}
                  </ul>
                </div>
              )}
              {n.risks.length > 0 && (
                <div className="mt-3">
                  <p className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-red-600"><ShieldExclamationIcon className="h-3 w-3" /> Risks</p>
                  <ul className="mt-1 list-inside list-disc space-y-0.5 text-[11px] text-gray-600">
                    {n.risks.map((r: string, i: number) => <li key={i}>{r}</li>)}
                  </ul>
                </div>
              )}
              {n.opportunities.length > 0 && (
                <div className="mt-3">
                  <p className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-blue-600"><LightBulbIcon className="h-3 w-3" /> Opportunities</p>
                  <ul className="mt-1 list-inside list-disc space-y-0.5 text-[11px] text-gray-600">
                    {n.opportunities.map((o: string, i: number) => <li key={i}>{o}</li>)}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
