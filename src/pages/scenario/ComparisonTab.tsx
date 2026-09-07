import { useEffect, useMemo, useState } from "react";
import { useAppSelector } from "@/store";
import { useGetScenariosQuery, useGetWhatIfBatchQuery } from "@/store/api/scenariosApi";
import { useGetBudgetsQuery, useGetBudgetVarianceQuery } from "@/store/api/budgetsApi";
import { fmtCategoryValue, SCENARIO_KPIS } from "./scenarioCategories";
import MobileTableCards from "@/components/common/MobileTableCards";

const PERIODS = [
  { key: "currentMonth", label: "Current Month" },
  { key: "currentQuarter", label: "Current Quarter" },
  { key: "currentYear", label: "Current Year" },
];

// KPI keys BUDGET_CATEGORIES also tracks (dineink-backend/budget.types.ts) —
// only these can show a "Budget" column; everything else (e.g. Prime Cost %,
// Break-even) simply reads "—" for Budget, same as Budget's own "no-data" rows.
const BUDGET_COMPARABLE_KEYS = new Set([
  "revenue", "orders", "avgOrderValue", "foodCost", "foodCostPercentage", "primeCost",
  "labour", "labourPercentage", "rent", "utilities", "operatingExpenses", "ebitda", "netProfit", "cashFlow",
]);

const MAX_SELECTED_SCENARIOS = 4;

export default function ComparisonTab() {
  const { branches } = useAppSelector((s) => s.branch);
  const { user } = useAppSelector((s) => s.auth);

  // Independent of the global top-nav branch selector — same convention as
  // the Scenarios tab's own scope dropdown, so a restaurant-wide custom
  // scenario stays visible here regardless of which branch happens to be
  // selected in the top nav, and vice versa.
  const [scopeBranchId, setScopeBranchId] = useState<string>("restaurant");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [period, setPeriod] = useState("currentMonth");

  const restaurantId = user?.restaurantId as number;

  const { data: scenarios = [] } = useGetScenariosQuery(
    {
      restaurantId,
      branchId: scopeBranchId === "restaurant" ? null : Number(scopeBranchId),
      activeOnly: true,
    },
    { skip: !user?.restaurantId },
  );

  // One cache entry for the whole selected set — a hook cannot be called once
  // per id, so the fan-out lives in the endpoint (see getWhatIfBatch).
  const { data: results = {}, isFetching: loading } = useGetWhatIfBatchQuery(
    { restaurantId, scenarioIds: selectedIds, period },
    { skip: !user?.restaurantId || selectedIds.length === 0 },
  );

  // Pre-select up to the max so the table isn't empty on first load, without
  // silently dropping scenarios beyond the cap — the rest are just left
  // unselected, still pickable via the chips below.
  useEffect(() => {
    setSelectedIds(scenarios.slice(0, MAX_SELECTED_SCENARIOS).map((s) => s.id));
  }, [scenarios]);

  // The optional Budget column, now on the budgets slice — this was the call
  // deliberately left on fetch when the scenarios module was migrated, because
  // it belongs to a different module.
  const budgetBranchId = scopeBranchId === "restaurant" ? null : Number(scopeBranchId);
  const { data: publishedBudgets = [] } = useGetBudgetsQuery(
    { restaurantId, branchId: budgetBranchId, status: "PUBLISHED" },
    { skip: !user?.restaurantId || selectedIds.length === 0 },
  );

  const budget = budgetBranchId
    ? publishedBudgets.find((b) => b.branchId === budgetBranchId)
    : publishedBudgets.find((b) => b.branchId === null) || publishedBudgets[0];

  const { data: budgetVariance } = useGetBudgetVarianceQuery(
    { restaurantId, budgetId: budget?.id as number, period },
    { skip: !budget?.id },
  );

  // No published budget for this scope is an ordinary state, not a failure —
  // the column simply does not render.
  const budgetColumn = useMemo(() => {
    if (!budgetVariance?.rows) return null;
    const byCategory: Record<string, number | null> = {};
    budgetVariance.rows.forEach((r) => { byCategory[r.category] = r.budget; });
    return byCategory;
  }, [budgetVariance]);

  const toggleScenario = (id: number) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= MAX_SELECTED_SCENARIOS) return prev; // cap reached — ignore until one is deselected
      return [...prev, id];
    });
  };

  // Every selected scenario's what-if call resolves against the SAME real
  // actuals for this scope/period, so `baseline` is identical across all of
  // them — read it from whichever result came back first instead of a
  // separate "actuals" call.
  const actualByKpi = useMemo(() => {
    const first = Object.values(results)[0];
    const map = new Map<string, number | null>();
    (first?.kpis || []).forEach((k: any) => map.set(k.key, k.baseline));
    return map;
  }, [results]);

  const cellHighlight = (value: number | null, actual: number | null, higherIsBetter: boolean) => {
    if (value === null || actual === null) return "";
    if (value === actual) return "";
    const better = higherIsBetter ? value > actual : value < actual;
    return better ? "text-emerald-700 font-semibold" : "text-red-600 font-semibold";
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-[16px] font-bold text-gray-900">Actual vs Budget vs Scenarios</h3>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={scopeBranchId}
            onChange={(e) => setScopeBranchId(e.target.value)}
            className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-[12px] font-semibold text-gray-700 outline-none"
          >
            <option value="restaurant">Restaurant-wide (all branches)</option>
            {(branches || []).map((b: any) => (
              <option key={b.id} value={b.id}>{b.name}</option>
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

      <div className="flex flex-wrap items-center gap-2">
        {scenarios.map((s) => {
          const selected = selectedIds.includes(s.id);
          const disabled = !selected && selectedIds.length >= MAX_SELECTED_SCENARIOS;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => toggleScenario(s.id)}
              disabled={disabled}
              title={disabled ? `Up to ${MAX_SELECTED_SCENARIOS} scenarios can be compared at once — deselect one first` : undefined}
              className={`rounded-xl border px-3 py-1.5 text-[11px] font-semibold transition ${
                selected
                  ? "border-[#b10000] bg-red-50 text-[#b10000]"
                  : disabled
                    ? "cursor-not-allowed border-gray-100 bg-gray-50 text-gray-300"
                    : "border-gray-200 bg-white text-gray-500 hover:bg-gray-50"
              }`}
            >
              {s.name}
            </button>
          );
        })}
        <span className="text-[10px] font-semibold text-gray-400">{selectedIds.length}/{MAX_SELECTED_SCENARIOS} selected</span>
      </div>

      {loading ? (
        <div className="flex h-40 items-center justify-center text-[12px] text-gray-400">Loading…</div>
      ) : selectedIds.length === 0 ? (
        <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50 text-[12px] text-gray-400">
          Select at least one scenario above to compare.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <MobileTableCards>
          <table className="w-full text-[12px]">
            <thead className="bg-gray-50 text-[10px] font-bold uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-2 text-left">KPI</th>
                <th className="px-3 py-2 text-right">Actual</th>
                {budgetColumn && <th className="px-3 py-2 text-right">Budget</th>}
                {selectedIds.map((id) => (
                  <th key={id} className="px-3 py-2 text-right">{scenarios.find((s) => s.id === id)?.name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {SCENARIO_KPIS.map((def) => {
                const actual = actualByKpi.get(def.key) ?? null;
                if (actual === null && selectedIds.every((id) => !results[id]?.kpis?.find((k: any) => k.key === def.key)?.projected)) return null;
                return (
                  <tr key={def.key} className="border-t border-gray-100">
                    <td className="px-4 py-2 font-medium text-gray-700">{def.label}</td>
                    <td className="px-3 py-2 text-right text-gray-900">{fmtCategoryValue(actual, def.unit)}</td>
                    {budgetColumn && (
                      <td className="px-3 py-2 text-right text-gray-600">
                        {BUDGET_COMPARABLE_KEYS.has(def.key) && budgetColumn[def.key] != null ? fmtCategoryValue(budgetColumn[def.key], def.unit) : "—"}
                      </td>
                    )}
                    {selectedIds.map((id) => {
                      const row = results[id]?.kpis?.find((k: any) => k.key === def.key);
                      return (
                        <td key={id} className={`px-3 py-2 text-right ${cellHighlight(row?.projected ?? null, actual, row?.higherIsBetter ?? true)}`}>
                          {fmtCategoryValue(row?.projected ?? null, def.unit)}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
          </MobileTableCards>
        </div>
      )}
    </div>
  );
}
