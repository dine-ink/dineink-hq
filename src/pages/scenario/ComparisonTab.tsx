import { useEffect, useMemo, useState } from "react";
import { useAppSelector } from "../../store";
import { fmtCategoryValue, SCENARIO_KPIS } from "./scenarioCategories";

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

export default function ComparisonTab() {
  const { selectedBranch } = useAppSelector((s) => s.branch);
  const { user, token } = useAppSelector((s) => s.auth);
  const API_URL = import.meta.env.VITE_API_URL;

  const [scenarios, setScenarios] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [period, setPeriod] = useState("currentMonth");
  const [budgetColumn, setBudgetColumn] = useState<Record<string, number | null> | null>(null);
  const [results, setResults] = useState<Record<number, any>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchScenarios = async () => {
      if (!user?.restaurantId) return;
      try {
        const branchParam = selectedBranch?.id ?? "null";
        const res = await fetch(`${API_URL}/api/scenarios/${user.restaurantId}?branchId=${branchParam}&activeOnly=true`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        if (json.success) {
          setScenarios(json.data);
          setSelectedIds(json.data.map((s: any) => s.id));
        }
      } catch {
        // fetch error — silently ignored
      }
    };
    fetchScenarios();
  }, [user?.restaurantId, selectedBranch?.id]);

  useEffect(() => {
    const fetchComparison = async () => {
      if (selectedIds.length === 0 || !user?.restaurantId) {
        setResults({});
        return;
      }
      setLoading(true);
      try {
        const entries = await Promise.all(
          selectedIds.map(async (id) => {
            const res = await fetch(`${API_URL}/api/scenarios/${user.restaurantId}/${id}/what-if?period=${period}`, {
              method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: "{}",
            });
            const json = await res.json();
            return [id, json.data] as const;
          }),
        );
        setResults(Object.fromEntries(entries));

        // Optional Budget column — reuses the Budget module's own variance
        // endpoint rather than re-deriving budget figures; skipped silently
        // if no published budget exists for this scope.
        const branchParam = selectedBranch?.id ? `?branchId=${selectedBranch.id}&status=PUBLISHED` : "?status=PUBLISHED";
        const budgetListRes = await fetch(`${API_URL}/api/budgets/${user.restaurantId}${branchParam}`, { headers: { Authorization: `Bearer ${token}` } });
        const budgetListJson = await budgetListRes.json();
        const budget = selectedBranch?.id
          ? budgetListJson.data?.find((b: any) => b.branchId === selectedBranch.id)
          : budgetListJson.data?.find((b: any) => b.branchId === null) || budgetListJson.data?.[0];
        if (budget) {
          const varianceRes = await fetch(`${API_URL}/api/budgets/${user.restaurantId}/${budget.id}/variance?period=${period}`, { headers: { Authorization: `Bearer ${token}` } });
          const varianceJson = await varianceRes.json();
          const byCategory: Record<string, number | null> = {};
          (varianceJson.data?.rows || []).forEach((r: any) => { byCategory[r.category] = r.budget; });
          setBudgetColumn(byCategory);
        } else {
          setBudgetColumn(null);
        }
      } catch {
        // fetch error — silently ignored
      } finally {
        setLoading(false);
      }
    };
    fetchComparison();
  }, [selectedIds, period, user?.restaurantId, selectedBranch?.id]);

  const toggleScenario = (id: number) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
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

      <div className="flex flex-wrap gap-2">
        {scenarios.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => toggleScenario(s.id)}
            className={`rounded-xl border px-3 py-1.5 text-[11px] font-semibold transition ${
              selectedIds.includes(s.id) ? "border-[#b10000] bg-red-50 text-[#b10000]" : "border-gray-200 bg-white text-gray-500 hover:bg-gray-50"
            }`}
          >
            {s.name}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex h-40 items-center justify-center text-[12px] text-gray-400">Loading…</div>
      ) : selectedIds.length === 0 ? (
        <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50 text-[12px] text-gray-400">
          Select at least one scenario above to compare.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200">
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
        </div>
      )}
    </div>
  );
}
