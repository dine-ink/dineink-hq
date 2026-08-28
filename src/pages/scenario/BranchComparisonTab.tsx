import { useEffect, useState } from "react";
import { useAppSelector } from "../../store";
import { fmtCategoryValue } from "./scenarioCategories";
import MobileTableCards from "../../components/common/MobileTableCards";
import { TrophyIcon } from "@heroicons/react/24/outline";

// "Apply a scenario across every branch" (spec section 10) reuses the
// existing per-scenario what-if endpoint — no new backend aggregation route.
// Each branch always has its own auto-created "Expected" built-in scenario
// (ensureBuiltInScenariosService runs on every list call), so that's used as
// the per-branch carrier: the chosen template scenario's overrides are sent
// as live (unsaved) overrides on top of that branch's own real actuals.
const RANK_KPIS = ["revenue", "netProfit", "ebitda", "foodCost", "primeCost", "labour"];

const PERIODS = [
  { key: "currentMonth", label: "Current Month" },
  { key: "currentQuarter", label: "Current Quarter" },
  { key: "currentYear", label: "Current Year" },
];

export default function BranchComparisonTab() {
  const { branches } = useAppSelector((s) => s.branch);
  const { user, token } = useAppSelector((s) => s.auth);
  const API_URL = import.meta.env.VITE_API_URL;

  const [templates, setTemplates] = useState<any[]>([]);
  const [templateId, setTemplateId] = useState<number | null>(null);
  const [period, setPeriod] = useState("currentMonth");
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchTemplates = async () => {
      if (!user?.restaurantId) return;
      try {
        const res = await fetch(`${API_URL}/api/scenarios/${user.restaurantId}?branchId=null&activeOnly=true`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        if (json.success) {
          setTemplates(json.data);
          setTemplateId(json.data.find((s: any) => s.type === "OPTIMISTIC")?.id ?? json.data[0]?.id ?? null);
        }
      } catch {
        // fetch error — silently ignored
      }
    };
    fetchTemplates();
  }, [user?.restaurantId]);

  useEffect(() => {
    const fetchComparison = async () => {
      if (!templateId || !user?.restaurantId || !branches?.length) return;
      setLoading(true);
      try {
        const template = templates.find((t) => t.id === templateId);
        const overrideKeys = [
          "revenueGrowthPercentage", "orderGrowthPercentage", "avgOrderValue", "rent", "utilities", "marketing",
          "maintenance", "packaging", "foodCostTargetPercentage", "labourTargetPercentage", "deliveryPercentage",
          "swiggyCommissionPercentage", "zomatoCommissionPercentage", "royaltyPercentage", "franchiseFeePercentage",
          "salaryIncrementPercentage", "inflationPercentage", "rentEscalationPercentage", "workingDays", "businessHours",
        ];
        const liveOverrides = Object.fromEntries(overrideKeys.map((k) => [k, template?.[k] ?? null]));

        const perBranch = await Promise.all(
          (branches || []).map(async (branch: any) => {
            const listRes = await fetch(`${API_URL}/api/scenarios/${user.restaurantId}?branchId=${branch.id}&activeOnly=true`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            const listJson = await listRes.json();
            const expected = (listJson.data || []).find((s: any) => s.type === "EXPECTED");
            if (!expected) return { branch, kpis: [] };

            const whatIfRes = await fetch(`${API_URL}/api/scenarios/${user.restaurantId}/${expected.id}/what-if?period=${period}`, {
              method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
              body: JSON.stringify(liveOverrides),
            });
            const whatIfJson = await whatIfRes.json();
            return { branch, kpis: whatIfJson.data?.kpis || [] };
          }),
        );

        const withRank = perBranch.map(({ branch, kpis }) => {
          const byKey = Object.fromEntries(kpis.map((k: any) => [k.key, k]));
          const achievements = RANK_KPIS.map((k) => byKey[k]?.achievementPercentage).filter((v) => v !== null && v !== undefined);
          const avgAchievement = achievements.length > 0 ? achievements.reduce((s: number, v: number) => s + v, 0) / achievements.length : null;
          return { branch, byKey, avgAchievement };
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
  }, [templateId, period, user?.restaurantId, branches?.length]);

  const rankBadge = (index: number) => {
    if (index === 0) return "bg-amber-100 text-amber-700";
    if (index === 1) return "bg-gray-200 text-gray-700";
    if (index === 2) return "bg-orange-100 text-orange-700";
    return "bg-gray-50 text-gray-500";
  };

  if (!branches || branches.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50 text-[12px] text-gray-400">
        No branches to compare.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-[16px] font-bold text-gray-900">Branch Scenario Comparison</h3>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={templateId ?? ""}
            onChange={(e) => setTemplateId(Number(e.target.value))}
            className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-[12px] font-semibold text-gray-700 outline-none"
          >
            {templates.map((t) => (
              <option key={t.id} value={t.id}>Apply: {t.name}</option>
            ))}
          </select>
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
      </div>
      <p className="text-[11px] text-gray-500">
        Applies the selected scenario's assumptions to every branch's own actuals — e.g. "what if every branch grew revenue by 10%."
      </p>

      {loading ? (
        <div className="flex h-40 items-center justify-center text-[12px] text-gray-400">Loading…</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <MobileTableCards>
          <table className="w-full text-[12px]">
            <thead className="bg-gray-50 text-[10px] font-bold uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-2 text-left">Rank</th>
                <th className="px-4 py-2 text-left">Branch</th>
                <th className="px-3 py-2 text-right">Revenue</th>
                <th className="px-3 py-2 text-right">Net Profit</th>
                <th className="px-3 py-2 text-right">EBITDA</th>
                <th className="px-3 py-2 text-right">Food Cost</th>
                <th className="px-3 py-2 text-right">Prime Cost</th>
                <th className="px-3 py-2 text-right">Labour</th>
                <th className="px-3 py-2 text-right">Avg Achievement %</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={row.branch.id} className="border-t border-gray-100">
                  <td className="px-4 py-2.5">
                    <span className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold ${rankBadge(i)}`}>
                      {i === 0 ? <TrophyIcon className="h-3.5 w-3.5" /> : i + 1}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 font-semibold text-gray-900">{row.branch.name}</td>
                  {RANK_KPIS.map((k) => (
                    <td key={k} className="px-3 py-2.5 text-right text-gray-600">
                      {fmtCategoryValue(row.byKey[k]?.projected, row.byKey[k]?.unit || "currency")}
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
