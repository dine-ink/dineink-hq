import { useState } from "react";
import { useAppSelector } from "@/store";
import { useGetAiInsightsQuery } from "@/store/api/aiApi";
import { CATEGORY_OPTIONS, PERIOD_OPTIONS } from "./aiCategories";
import InsightCard from "./InsightCard";

export default function InsightsTab() {
  const { selectedBranch } = useAppSelector((s) => s.branch);
  const { user } = useAppSelector((s) => s.auth);

  const [scope, setScope] = useState<"branch" | "restaurant">("branch");
  const [period, setPeriod] = useState("currentMonth");
  const [category, setCategory] = useState("all");

  // Each of these is a model call on the server, so the cache is not just a
  // latency win: the Reports tab asks for this same answer, and before this
  // the model ran twice for identical parameters.
  const { data: insights = [], isFetching: loading } = useGetAiInsightsQuery(
    {
      restaurantId: user?.restaurantId as number,
      period,
      branchId: scope === "branch" ? selectedBranch?.id : undefined,
    },
    { skip: !user?.restaurantId },
  );

  const filtered = category === "all" ? insights : insights.filter((i) => i.category === category);
  const counts: Record<string, number> = { all: insights.length };
  for (const opt of CATEGORY_OPTIONS) if (opt.key !== "all") counts[opt.key] = insights.filter((i) => i.category === opt.key).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
            {PERIOD_OPTIONS.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
          </select>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {CATEGORY_OPTIONS.map((opt) => (
          <button
            key={opt.key}
            type="button"
            onClick={() => setCategory(opt.key)}
            className={`rounded-xl px-3 py-1.5 text-[12px] font-semibold transition ${category === opt.key ? "bg-[#b10000] text-white shadow-sm" : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"}`}
          >
            {opt.label} <span className="opacity-70">({counts[opt.key] ?? 0})</span>
          </button>
        ))}
      </div>

      {loading && <div className="flex h-24 items-center justify-center text-[12px] text-gray-400">Analysing…</div>}

      {!loading && filtered.length === 0 && (
        <div className="flex h-24 items-center justify-center text-[12px] text-gray-400">No {category === "all" ? "insights" : CATEGORY_OPTIONS.find((c) => c.key === category)?.label.toLowerCase()} for this scope right now.</div>
      )}

      {!loading && filtered.length > 0 && (
        <div className="space-y-3">
          {filtered.map((insight, i) => <InsightCard key={i} insight={insight} />)}
        </div>
      )}
    </div>
  );
}
