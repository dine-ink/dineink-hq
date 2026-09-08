import { useEffect, useMemo, useState } from "react";
import { useAppSelector } from "@/store";
import { errorMessage } from "@/utils/apiRequest";
import {
  useGetScenariosQuery,
  useGetWhatIfQuery,
  useUpdateScenarioMutation,
} from "@/store/api/scenariosApi";
import { fmtCategoryValue, OVERRIDE_FIELD_GROUPS, OVERRIDE_FIELDS, SCENARIO_KPIS, WIDGET_KPIS } from "./scenarioCategories";
import { TrendIcon } from "@/utils/kpiDisplay";
import { trendStyle } from "@/utils/kpiStyles";
import ScenarioCharts from "./ScenarioCharts";
import MobileTableCards from "@/components/common/MobileTableCards";
import { ArrowPathIcon, CheckIcon } from "@heroicons/react/24/outline";
import { notify } from "@/utils/notify";
import { clampToToday, todayISO } from "@/utils/dates";

const PERIODS = [
  { key: "currentMonth", label: "Current Month" },
  { key: "currentQuarter", label: "Current Quarter" },
  { key: "currentYear", label: "Current Year" },
  { key: "custom", label: "Custom Range" },
];

export default function OverviewTab() {
  const { branches } = useAppSelector((s) => s.branch);
  const { user } = useAppSelector((s) => s.auth);
  const restaurantId = user?.restaurantId as number;

  // Independent of the global top-nav branch selector — same convention as
  // the Scenarios tab's own scope dropdown. A scenario's visibility here is
  // driven ONLY by this, so a restaurant-wide custom scenario stays visible
  // regardless of which branch happens to be selected in the top nav, and
  // vice versa.
  const [scopeBranchId, setScopeBranchId] = useState<string>("restaurant");
  const [selectedScenarioId, setSelectedScenarioId] = useState<number | null>(null);

  const { data: scenarios = [] } = useGetScenariosQuery(
    {
      restaurantId,
      branchId: scopeBranchId === "restaurant" ? null : Number(scopeBranchId),
      activeOnly: true,
    },
    { skip: !user?.restaurantId },
  );
  const [updateScenario] = useUpdateScenarioMutation();
  const [period, setPeriod] = useState("currentMonth");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [sliderValues, setSliderValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  // Pick a default scenario once the list arrives — Expected if present, else
  // the first. Keyed off the list itself rather than a fetch callback.
  useEffect(() => {
    if (!scenarios.length) {
      setSelectedScenarioId(null);
      return;
    }
    const preferred = scenarios.find((s) => s.type === "EXPECTED") || scenarios[0];
    setSelectedScenarioId(preferred?.id ?? null);
  }, [scenarios]);

  const selectedScenario = scenarios.find((s) => s.id === selectedScenarioId) || null;
  // Built-in scenarios (Conservative/Expected/Optimistic) are fixed reference
  // points shared across every restaurant — the What-If sliders here are for
  // trying things out, so they're locked to Custom scenarios only. To
  // experiment starting from a built-in, clone it into a Custom scenario
  // from the Scenarios tab first.
  const isCustom = selectedScenario?.type === "CUSTOM";

  // Sliders always reflect the CURRENT scenario's saved overrides when it changes.
  useEffect(() => {
    const values: Record<string, string> = {};
    OVERRIDE_FIELDS.forEach((f) => {
      values[f.key] = selectedScenario?.[f.key] === null || selectedScenario?.[f.key] === undefined ? "" : String(selectedScenario[f.key]);
    });
    setSliderValues(values);
    setDirty(false);
  }, [selectedScenarioId]);

  const buildLiveOverrides = (): Record<string, number | null> => {
    const overrides: Record<string, number | null> = {};
    OVERRIDE_FIELDS.forEach((f) => {
      const raw = sliderValues[f.key];
      overrides[f.key] = raw === undefined || raw === "" ? null : Number(raw);
    });
    return overrides;
  };

  // Sliders fire many changes in a row, so the *arguments* are debounced rather
  // than the request: the query re-runs only once the values settle. Because
  // the overrides are part of the cache key, dragging back to a combination
  // already tried is served from cache instead of recomputed.
  const [debouncedOverrides, setDebouncedOverrides] = useState<Record<string, number | null>>({});
  useEffect(() => {
    const t = setTimeout(() => setDebouncedOverrides(buildLiveOverrides()), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sliderValues]);

  const rangeReady = period !== "custom" || Boolean(customFrom && customTo);
  const { data: whatIf, isFetching: loading } = useGetWhatIfQuery(
    {
      restaurantId,
      scenarioId: selectedScenarioId as number,
      period,
      from: customFrom,
      to: customTo,
      overrides: debouncedOverrides,
    },
    { skip: !selectedScenarioId || !user?.restaurantId || !rangeReady },
  );

  const kpisByKey = useMemo(() => {
    const map = new Map<string, any>();
    (whatIf?.kpis || []).forEach((k: any) => map.set(k.key, k));
    return map;
  }, [whatIf]);

  const handleSliderChange = (key: string, value: string) => {
    setSliderValues((prev) => ({ ...prev, [key]: value }));
    setDirty(true);
  };

  const handleSaveToScenario = async () => {
    if (!selectedScenario) return;
    setSaving(true);
    try {
      await updateScenario({
        restaurantId,
        id: selectedScenario.id,
        body: { overrides: buildLiveOverrides() },
      }).unwrap();
      // The list refreshes via invalidatesTags rather than local surgery.
      setDirty(false);
    } catch (err) {
      // `dirty` deliberately stays true on failure: it is what keeps the Save
      // button live and the unsaved values on screen. Clearing it — or saying
      // nothing, as this once did — presents unsaved overrides as saved.
      notify(errorMessage(err, "Failed to save these scenario overrides"));
    } finally {
      setSaving(false);
    }
  };

  const handleRevert = () => {
    const values: Record<string, string> = {};
    OVERRIDE_FIELDS.forEach((f) => {
      values[f.key] = selectedScenario?.[f.key] === null || selectedScenario?.[f.key] === undefined ? "" : String(selectedScenario[f.key]);
    });
    setSliderValues(values);
    setDirty(false);
  };

  if (scenarios.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50 text-[12px] text-gray-400">
        No scenarios yet for this scope — visit the Scenarios tab to see the auto-created Conservative/Expected/Optimistic scenarios.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
          <select
            value={selectedScenarioId ?? ""}
            onChange={(e) => setSelectedScenarioId(Number(e.target.value))}
            className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-[12px] font-semibold text-gray-700 outline-none"
          >
            {scenarios.map((s) => (
              <option key={s.id} value={s.id}>{s.name} ({s.type})</option>
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
          {period === "custom" && (
            <div className="flex items-center gap-2">
              <input type="date" value={customFrom} max={customTo || todayISO()} onChange={(e) => setCustomFrom(clampToToday(e.target.value))} className="rounded-xl border border-gray-200 bg-white px-2.5 py-1.5 text-[11px] outline-none" />
              <span className="text-[11px] text-gray-400">to</span>
              <input type="date" value={customTo} min={customFrom || undefined} max={todayISO()} onChange={(e) => setCustomTo(clampToToday(e.target.value))} className="rounded-xl border border-gray-200 bg-white px-2.5 py-1.5 text-[11px] outline-none" />
            </div>
          )}
        </div>
        {dirty && (
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-amber-600">Unsaved slider changes — not yet applied to the scenario</span>
            <button type="button" onClick={handleRevert} className="flex items-center gap-1 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-gray-600 hover:bg-gray-50">
              <ArrowPathIcon className="h-3 w-3" /> Revert
            </button>
            <button type="button" onClick={handleSaveToScenario} disabled={saving} className="flex items-center gap-1 rounded-xl bg-[#b10000] px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-[#950000] disabled:opacity-50">
              <CheckIcon className="h-3 w-3" /> {saving ? "Saving…" : "Save to Scenario"}
            </button>
          </div>
        )}
      </div>

      {/* WHAT-IF SLIDERS */}
      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <h4 className="mb-3 text-[13px] font-bold text-gray-900">What-If Controls</h4>
        <p className="mb-3 text-[11px] text-gray-500">
          {isCustom
            ? 'Adjust any assumption below — projections update instantly. Nothing is written to actuals; use "Save to Scenario" to keep these values.'
            : "Built-in scenarios have fixed assumptions and can't be adjusted here — go to the Scenarios tab and clone this into a Custom scenario to experiment."}
        </p>
        {OVERRIDE_FIELD_GROUPS.map((group) => (
          <div key={group} className="mb-4 last:mb-0">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-gray-400">{group}</p>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {OVERRIDE_FIELDS.filter((f) => f.group === group).map((f) => {
                const raw = sliderValues[f.key] ?? "";
                const current = whatIf?.currentValues?.[f.key];
                return (
                  <div key={f.key}>
                    <div className="mb-1 flex items-center justify-between">
                      <label className="text-[11px] font-medium text-gray-600">{f.label}</label>
                      <span className="text-[11px] font-semibold text-gray-900">
                        {raw !== ""
                          ? fmtCategoryValue(Number(raw), f.unit)
                          : current != null
                            ? `${fmtCategoryValue(current, f.unit)} (current)`
                            : "Inherit"}
                      </span>
                    </div>
                    {f.slider ? (
                      <input
                        type="range"
                        min={f.min}
                        max={f.max}
                        step={f.step}
                        value={raw === "" ? (f.min < 0 && f.max > 0 ? 0 : f.min) : raw}
                        onChange={(e) => handleSliderChange(f.key, e.target.value)}
                        disabled={!isCustom}
                        className="w-full accent-[#b10000] disabled:cursor-not-allowed disabled:opacity-40"
                      />
                    ) : (
                      <input
                        type="number"
                        value={raw}
                        onChange={(e) => handleSliderChange(f.key, e.target.value)}
                        placeholder={current != null ? String(current) : "Inherit"}
                        disabled={!isCustom}
                        className={`w-full rounded-xl border border-gray-200 px-3 py-1.5 text-sm outline-none focus:border-red-300 focus:bg-white ${isCustom ? "bg-gray-50" : "cursor-not-allowed bg-gray-100 text-gray-400"}`}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {loading && <div className="flex h-24 items-center justify-center text-[12px] text-gray-400">Recalculating…</div>}

      {!loading && whatIf && (
        <>
          {/* KPI WIDGET CARDS */}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {WIDGET_KPIS.map((key) => {
              const row = kpisByKey.get(key);
              if (!row) return null;
              return (
                <div key={key} className="rounded-2xl border border-gray-200 bg-white p-3.5 shadow-sm">
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-500">{row.label}</p>
                  <div className="mt-2 flex items-baseline gap-2">
                    <p className="text-[20px] font-extrabold tracking-tight text-gray-900">{fmtCategoryValue(row.projected, row.unit)}</p>
                    <p className="text-[11px] text-gray-400 line-through">{fmtCategoryValue(row.baseline, row.unit)}</p>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <span className={`flex items-center gap-1 text-[11px] font-semibold ${trendStyle(row.trendDirection, row.higherIsBetter)}`}>
                      <TrendIcon direction={row.trendDirection} />
                      {row.variancePercentage != null ? `${row.variancePercentage > 0 ? "+" : ""}${row.variancePercentage.toFixed(1)}% vs actual` : "—"}
                    </span>
                    <span className="text-[10px] font-semibold text-gray-400">
                      {row.achievementPercentage != null ? `${row.achievementPercentage.toFixed(0)}% of target` : "No target set"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* CHARTS */}
          <ScenarioCharts kpis={whatIf.kpis ?? []} />

          {/* FULL KPI TABLE */}
          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <MobileTableCards>
            <table className="w-full text-[12px] min-w-[36rem]">
              <thead className="bg-gray-50 text-[10px] font-bold uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-4 py-2 text-left">KPI</th>
                  <th className="px-3 py-2 text-right">Actual (Baseline)</th>
                  <th className="px-3 py-2 text-right">Projected</th>
                  <th className="px-3 py-2 text-right">Variance</th>
                  <th className="px-3 py-2 text-right">Variance %</th>
                  <th className="px-3 py-2 text-right">Achievement %</th>
                  <th className="px-3 py-2 text-center">Trend</th>
                </tr>
              </thead>
              <tbody>
                {SCENARIO_KPIS.map((def) => {
                  const row = kpisByKey.get(def.key);
                  if (!row) return null;
                  return (
                    <tr key={def.key} className="border-t border-gray-100">
                      <td className="px-4 py-2 font-medium text-gray-700">{def.label}</td>
                      <td className="px-3 py-2 text-right text-gray-600">{fmtCategoryValue(row.baseline, row.unit)}</td>
                      <td className="px-3 py-2 text-right font-semibold text-gray-900">{fmtCategoryValue(row.projected, row.unit)}</td>
                      <td className="px-3 py-2 text-right text-gray-600">{row.variance != null ? fmtCategoryValue(row.variance, row.unit) : "—"}</td>
                      <td className={`px-3 py-2 text-right font-semibold ${trendStyle(row.trendDirection, row.higherIsBetter)}`}>
                        {row.variancePercentage != null ? `${row.variancePercentage > 0 ? "+" : ""}${row.variancePercentage.toFixed(1)}%` : "—"}
                      </td>
                      <td className="px-3 py-2 text-right text-gray-600">{row.achievementPercentage != null ? `${row.achievementPercentage.toFixed(0)}%` : "—"}</td>
                      <td className="px-3 py-2 text-center">
                        <span className={`inline-flex ${trendStyle(row.trendDirection, row.higherIsBetter)}`}>
                          <TrendIcon direction={row.trendDirection} />
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            </MobileTableCards>
          </div>
        </>
      )}
    </div>
  );
}
