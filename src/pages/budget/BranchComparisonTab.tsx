import { useMemo, useState } from "react";
import { useAppSelector } from "@/store";
import { useGetBudgetsQuery, useGetBudgetVarianceBatchQuery } from "@/store/api/budgetsApi";
import { fmtCategoryValue } from "./budgetCategories";
import MobileTableCards from "@/components/common/MobileTableCards";
import { TrophyIcon } from "@heroicons/react/24/outline";

// Reuses the existing per-budget variance endpoint (no new backend
// aggregation route) — one call per branch-scoped budget, then ranked
// client-side. The Finance/Ratio Engine remains the sole source of the
// underlying actuals; this only composes results already computed there.
const RANK_CATEGORIES = ["revenue", "foodCost", "ebitda", "netProfit"];

const PERIODS = [
  { key: "currentMonth", label: "Current Month" },
  { key: "currentQuarter", label: "Current Quarter" },
  { key: "currentYear", label: "Current Year" },
];

export default function BranchComparisonTab() {
  const { user } = useAppSelector((s) => s.auth);
  const restaurantId = user?.restaurantId as number;

  const [period, setPeriod] = useState("currentMonth");

  const { data: budgets = [] } = useGetBudgetsQuery(
    { restaurantId, status: "PUBLISHED" },
    { skip: !user?.restaurantId },
  );
  const branchBudgets = budgets.filter((b) => b.branchId !== null);
  const hasBranchBudgets = branchBudgets.length > 0;

  // One cache entry for the whole set — a hook cannot be called per budget.
  const { data: varianceByBudget = {}, isFetching: loading } = useGetBudgetVarianceBatchQuery(
    { restaurantId, budgetIds: branchBudgets.map((b) => b.id), period },
    { skip: !user?.restaurantId || branchBudgets.length === 0 },
  );

  // Ranking is presentation, so it stays here rather than in the endpoint.
  const rows = useMemo(() => {
    const withRank = branchBudgets.map((budget) => {
      const byCategory = Object.fromEntries(
        (varianceByBudget[budget.id]?.rows ?? []).map((r) => [r.category, r]),
      );
      const achievements = RANK_CATEGORIES.map(
        (c) => byCategory[c]?.achievementPercentage as number | undefined,
      ).filter((v): v is number => v !== null && v !== undefined);
      const avgAchievement =
        achievements.length > 0 ? achievements.reduce((sum, v) => sum + v, 0) / achievements.length : null;
      return { budget, byCategory, avgAchievement };
    });
    return [...withRank].sort((a, b) => (b.avgAchievement ?? -Infinity) - (a.avgAchievement ?? -Infinity));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [varianceByBudget, budgets]);



  const rankBadge = (index: number) => {
    if (index === 0) return "bg-amber-100 text-amber-700";
    if (index === 1) return "bg-gray-200 text-gray-700";
    if (index === 2) return "bg-orange-100 text-orange-700";
    return "bg-gray-50 text-gray-500";
  };

  if (!loading && !hasBranchBudgets) {
    return (
      <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50 text-[12px] text-gray-400">
        No published branch-level budgets yet — publish at least one branch budget to compare performance.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-[16px] font-bold text-gray-900">Branch Budget vs Actual Comparison</h3>
        <div className="flex items-center gap-1 rounded-xl bg-gray-100 p-1">
          {PERIODS.map((p) => (
            <button
              key={p.key}
              type="button"
              onClick={() => setPeriod(p.key)}
              className={`rounded-lg px-3 py-1.5 text-[11px] font-semibold transition ${
                period === p.key ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex h-40 items-center justify-center text-[12px] text-gray-400">Loading…</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <MobileTableCards>
          <table className="w-full text-[12px] min-w-[36rem]">
            <thead className="bg-gray-50 text-[10px] font-bold uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-2 text-left">Rank</th>
                <th className="px-4 py-2 text-left">Branch</th>
                <th className="px-3 py-2 text-right">Revenue</th>
                <th className="px-3 py-2 text-right">Food Cost</th>
                <th className="px-3 py-2 text-right">EBITDA</th>
                <th className="px-3 py-2 text-right">Net Profit</th>
                <th className="px-3 py-2 text-right">Avg Achievement %</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={row.budget.id} className="border-t border-gray-100">
                  <td className="px-4 py-2.5">
                    <span className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold ${rankBadge(i)}`}>
                      {i === 0 ? <TrophyIcon className="h-3.5 w-3.5" /> : i + 1}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 font-semibold text-gray-900">{row.budget.branch?.name}</td>
                  {RANK_CATEGORIES.map((c) => (
                    <td key={c} className="px-3 py-2.5 text-right text-gray-600">
                      {fmtCategoryValue(row.byCategory[c]?.actual, row.byCategory[c]?.unit || "currency")}
                    </td>
                  ))}
                  <td className="px-3 py-2.5 text-right font-semibold text-gray-900">
                    {row.avgAchievement != null ? `${row.avgAchievement.toFixed(0)}%` : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </MobileTableCards>
        </div>
      )}
    </div>
  );
}
