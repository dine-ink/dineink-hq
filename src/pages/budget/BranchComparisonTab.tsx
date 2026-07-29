import { useEffect, useState } from "react";
import { Trophy } from "lucide-react";
import { useAppSelector } from "../../store";
import { fmtCategoryValue } from "./budgetCategories";

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
  const { user, token } = useAppSelector((s) => s.auth);
  const API_URL = import.meta.env.VITE_API_URL;

  const [period, setPeriod] = useState("currentMonth");
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasBranchBudgets, setHasBranchBudgets] = useState(true);

  useEffect(() => {
    const fetchComparison = async () => {
      if (!user?.restaurantId) return;
      setLoading(true);
      try {
        const listRes = await fetch(`${API_URL}/api/budgets/${user.restaurantId}?status=PUBLISHED`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const listJson = await listRes.json();
        const branchBudgets = (listJson.data || []).filter((b: any) => b.branchId !== null);
        setHasBranchBudgets(branchBudgets.length > 0);
        if (branchBudgets.length === 0) {
          setRows([]);
          return;
        }

        const varianceResults = await Promise.all(
          branchBudgets.map(async (b: any) => {
            const res = await fetch(
              `${API_URL}/api/budgets/${user.restaurantId}/${b.id}/variance?period=${period}`,
              { headers: { Authorization: `Bearer ${token}` } },
            );
            const json = await res.json();
            const byCategory = Object.fromEntries((json.data?.rows || []).map((r: any) => [r.category, r]));
            return { budget: b, byCategory };
          }),
        );

        const withRank = varianceResults.map(({ budget, byCategory }) => {
          const achievements = RANK_CATEGORIES.map((c) => byCategory[c]?.achievementPercentage).filter(
            (v) => v !== null && v !== undefined,
          );
          const avgAchievement = achievements.length > 0 ? achievements.reduce((s, v) => s + v, 0) / achievements.length : null;
          return { budget, byCategory, avgAchievement };
        });
        withRank.sort((a, b) => (b.avgAchievement ?? -Infinity) - (a.avgAchievement ?? -Infinity));
        setRows(withRank);
      } catch {
        // fetch error — silently ignored
      } finally {
        setLoading(false);
      }
    };
    fetchComparison();
  }, [user?.restaurantId, period]);

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
        <div className="overflow-hidden rounded-xl border border-gray-200">
          <table className="w-full text-[12px]">
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
                      {i === 0 ? <Trophy className="h-3.5 w-3.5" /> : i + 1}
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
        </div>
      )}
    </div>
  );
}
