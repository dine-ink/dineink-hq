import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  ComposedChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ClockIcon, CurrencyRupeeIcon, UserGroupIcon, UsersIcon } from "@heroicons/react/24/outline";
import { Alert, MetricCard } from "../../design";
import {
  BASIS_OPTIONS,
  CHART_CARD,
  CONFIDENCE_STYLES,
  CONSTRAINT_STYLES,
  HOUR_OPTIONS,
  PLAN_WINDOW_OPTIONS,
  TICK,
  VERDICT_STYLES,
  WINDOW_PRESETS,
  fmtFte,
  fmtInr,
  fmtMinutes,
  type CapacityVerdict,
  type StationConstraint,
} from "./laborCategories";
import { useLaborQuery, useLaborScope } from "./useLaborApi";

// The manager-facing output: required vs. rostered staff, who stands where,
// when the peak actually lands, what the binding constraint is, and what to do
// about it. Every figure is rendered as the API returned it — the plan's
// arithmetic lives in the backend's labor.formulas.ts.

interface StationRow {
  stationId: number;
  code: string;
  name: string;
  workloadMinutes: number;
  itemUnits: number;
  utilizationFactorUsed: number;
  productiveMinutesPerStaff: number;
  rawRequiredFte: number;
  requiredFte: number;
  recommendedHeadcount: number;
  coveredFte: number;
  shortfallFte: number;
  headcount: number;
  constraint: StationConstraint;
  capacityPerHour: number | null;
  equipmentUtilizationPercent: number | null;
  unservableItemsPerHour: number;
  isEquipmentBound: boolean;
  anyoneSkilled: boolean;
  topContributors: { menuItemId: number; itemName: string; quantity: number; minutes: number }[];
}

interface StaffingPlan {
  window: { fromHour: number; toHour: number; label: string; windowMinutes: number };
  source: {
    basis: string;
    trailingDays: number;
    daysWithData: number;
    ordersObserved: number;
    confidence: string;
    confidenceReasons: string[];
  };
  demand: {
    expectedOrders: number;
    expectedItems: number;
    itemsMissingStandards: { menuItemId: number; itemName: string; quantity: number }[];
    coveragePercent: number;
  };
  peak: {
    windows: { windowMinutes: number; label: string; startOffsetMinutes: number; workloadMinutes: number; workloadMinutesPerHour: number }[];
    drivingWindowMinutes: number;
    drivingWindowLabel: string;
  };
  stations: StationRow[];
  crew: {
    basis: "SCHEDULED" | "ASSUMED";
    scheduledCount: number;
    assignments: {
      userId: number;
      name: string;
      stations: { stationId: number; code: string; name: string; fractionOfWindow: number; percentOfWindow: number }[];
      idleFraction: number;
    }[];
    totalShortfallFte: number;
    totalSurplusFte: number;
    unskilledShortfallFte: number;
    recommendedHeadcount: number;
    shortByHeadcount: number;
    estimatedWindowLaborCost: number | null;
  };
  verdict: { verdict: CapacityVerdict; headline: string; bindingStationCode: string | null; actions: string[] };
  buckets: { offsetMinutes: number; label: string; orders: number; workloadMinutes: number; perStation: Record<number, number> }[];
  setupWarnings: string[];
  hasModelledWorkload: boolean;
}

export default function StaffingPlanTab() {
  const { restaurantId, branchId } = useLaborScope();

  const [fromHour, setFromHour] = useState(18);
  const [toHour, setToHour] = useState(21);
  const [basis, setBasis] = useState("FORECAST");
  const [planWindowMinutes, setPlanWindowMinutes] = useState(60);
  const [days, setDays] = useState(30);
  const [assumedHeadcount, setAssumedHeadcount] = useState<string>("");

  const path = useMemo(() => {
    if (!restaurantId || !branchId) return null;
    const params = new URLSearchParams({
      fromHour: String(fromHour),
      toHour: String(toHour),
      basis,
      planWindowMinutes: String(planWindowMinutes),
      days: String(days),
    });
    if (assumedHeadcount) params.set("assumedHeadcount", assumedHeadcount);
    return `/${restaurantId}/${branchId}/staffing-plan?${params.toString()}`;
  }, [restaurantId, branchId, fromHour, toHour, basis, planWindowMinutes, days, assumedHeadcount]);

  const { data: plan, loading, error } = useLaborQuery<StaffingPlan>(path);

  const confidenceStyle = CONFIDENCE_STYLES[plan?.source.confidence || "low"] || CONFIDENCE_STYLES.low;
  const verdictStyle = plan ? VERDICT_STYLES[plan.verdict.verdict] : null;

  // Required vs. covered FTE per station, the chart that makes a shortfall
  // legible at a glance.
  const stationChartData = (plan?.stations || [])
    .filter((s) => s.requiredFte > 0 || s.coveredFte > 0)
    .map((s) => ({
      name: s.name,
      required: s.requiredFte,
      covered: s.coveredFte,
      constraint: s.constraint,
    }));

  const bucketChartData = (plan?.buckets || []).map((b) => ({
    label: b.label,
    workload: b.workloadMinutes,
    orders: b.orders,
  }));

  return (
    <div className="space-y-4">
      {/* CONTROLS */}
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 rounded-xl bg-gray-100 p-1">
            {WINDOW_PRESETS.map((p) => {
              const active = p.fromHour === fromHour && p.toHour === toHour;
              return (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => {
                    setFromHour(p.fromHour);
                    setToHour(p.toHour);
                  }}
                  className={`rounded-lg px-3 py-1.5 text-[11px] font-semibold transition ${
                    active ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>

          <select
            value={fromHour}
            onChange={(e) => {
              const next = Number(e.target.value);
              setFromHour(next);
              if (next > toHour) setToHour(next);
            }}
            className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-[12px] font-semibold text-gray-700 outline-none"
            aria-label="Window start hour"
          >
            {HOUR_OPTIONS.map((h) => (
              <option key={h.key} value={h.key}>
                From {h.label}
              </option>
            ))}
          </select>
          <select
            value={toHour}
            onChange={(e) => setToHour(Math.max(fromHour, Number(e.target.value)))}
            className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-[12px] font-semibold text-gray-700 outline-none"
            aria-label="Window end hour"
          >
            {HOUR_OPTIONS.filter((h) => h.key >= fromHour).map((h) => (
              <option key={h.key} value={h.key}>
                To {h.label}
              </option>
            ))}
          </select>
          <select
            value={basis}
            onChange={(e) => setBasis(e.target.value)}
            className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-[12px] font-semibold text-gray-700 outline-none"
            aria-label="Demand basis"
          >
            {BASIS_OPTIONS.map((b) => (
              <option key={b.key} value={b.key}>
                {b.label}
              </option>
            ))}
          </select>
          <select
            value={planWindowMinutes}
            onChange={(e) => setPlanWindowMinutes(Number(e.target.value))}
            className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-[12px] font-semibold text-gray-700 outline-none"
            aria-label="Planning window"
          >
            {PLAN_WINDOW_OPTIONS.map((o) => (
              <option key={o.key} value={o.key}>
                Plan for {o.label}
              </option>
            ))}
          </select>
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-[12px] font-semibold text-gray-700 outline-none"
            aria-label="History window"
          >
            {[14, 30, 60, 90].map((d) => (
              <option key={d} value={d}>
                Last {d} days
              </option>
            ))}
          </select>
          <input
            type="number"
            min={1}
            value={assumedHeadcount}
            onChange={(e) => setAssumedHeadcount(e.target.value)}
            placeholder="What if N staff?"
            className="w-36 rounded-xl border border-gray-200 bg-white px-3 py-2 text-[12px] font-semibold text-gray-700 outline-none placeholder:font-normal placeholder:text-gray-400"
            aria-label="Hypothetical headcount"
          />
        </div>

        {plan && (
          <div className={`flex shrink-0 items-center gap-2 rounded-xl border ${confidenceStyle.border} ${confidenceStyle.bg} px-3 py-1.5`}>
            <span className={`h-2 w-2 rounded-full ${confidenceStyle.dot}`} />
            <span className={`text-[11px] font-bold capitalize ${confidenceStyle.text}`}>
              {plan.source.confidence} confidence
            </span>
            <span className="text-[10px] text-gray-400">
              · {plan.source.daysWithData} day(s), {plan.source.ordersObserved} orders
            </span>
          </div>
        )}
      </div>

      {loading && (
        <div className="flex h-40 items-center justify-center text-[12px] text-gray-400">
          Building staffing plan…
        </div>
      )}

      {error && (
        <Alert variant="danger" title="Could not build the staffing plan">
          {error}
        </Alert>
      )}

      {!loading && !error && plan && (
        <>
          {plan.setupWarnings.length > 0 && (
            <Alert variant="warning" title="This plan is incomplete">
              <ul className="mt-1 list-inside list-disc space-y-0.5">
                {plan.setupWarnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </Alert>
          )}

          {/* THE ANSWER — verdict first, before any table */}
          {verdictStyle && (
            <div className={`rounded-2xl border p-4 ${verdictStyle.card}`}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-3">
                  <span className="text-[22px] leading-none" aria-hidden="true">
                    {verdictStyle.icon}
                  </span>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-500">
                      Recommendation · {plan.window.label}
                    </p>
                    <p className="mt-1 text-[16px] font-extrabold tracking-tight text-gray-900">
                      {verdictStyle.label}
                    </p>
                    <p className="mt-1 max-w-3xl text-[12px] text-gray-600">{plan.verdict.headline}</p>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Peak lands</p>
                  <p className="text-[13px] font-bold text-gray-900">{plan.peak.drivingWindowLabel}</p>
                  <p className="text-[10px] text-gray-400">
                    busiest {plan.peak.drivingWindowMinutes} min of the window
                  </p>
                </div>
              </div>

              {plan.verdict.actions.length > 0 && (
                <ul className="mt-3 space-y-1.5 border-t border-white/60 pt-3">
                  {plan.verdict.actions.map((a, i) => (
                    <li key={i} className="flex gap-2 text-[12px] text-gray-700">
                      <span className="mt-[3px] h-1.5 w-1.5 shrink-0 rounded-full bg-gray-400" />
                      <span>{a}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* KPIs — every staffing figure renders as "—" rather than 0 when
              there is no station workload to derive it from. A green "short by
              0" on an unconfigured branch reads as an all-clear, which is the
              opposite of the truth. Expected Orders is the exception: it comes
              straight from order history and is real either way. */}
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-5">
            <MetricCard
              label="Expected Orders"
              value={plan.demand.expectedOrders}
              sub={`${plan.demand.expectedItems} items in ${plan.window.label}`}
              icon={ClockIcon}
              status="info"
            />
            <MetricCard
              label="Staff Required"
              value={plan.hasModelledWorkload ? plan.crew.recommendedHeadcount : "—"}
              sub={
                plan.hasModelledWorkload
                  ? `${fmtFte(plan.stations.reduce((s, r) => s + r.requiredFte, 0))} FTE at peak`
                  : "needs stations + labor standards"
              }
              icon={UsersIcon}
              status={plan.hasModelledWorkload ? "secondary" : "neutral"}
            />
            <MetricCard
              label={plan.crew.basis === "SCHEDULED" ? "Currently Scheduled" : "Assumed Roster"}
              value={plan.crew.scheduledCount}
              sub={
                plan.crew.basis === "SCHEDULED"
                  ? "clocked in today with a station skill"
                  : "staff able to work a station"
              }
              icon={UserGroupIcon}
              status="neutral"
            />
            <MetricCard
              label="Short By"
              value={
                !plan.hasModelledWorkload
                  ? "—"
                  : plan.crew.shortByHeadcount > 0
                    ? plan.crew.shortByHeadcount
                    : "0"
              }
              sub={
                !plan.hasModelledWorkload
                  ? "not computable yet"
                  : plan.crew.shortByHeadcount > 0
                    ? `${fmtFte(plan.crew.totalShortfallFte)} FTE uncovered`
                    : `${fmtFte(plan.crew.totalSurplusFte)} FTE spare`
              }
              status={
                !plan.hasModelledWorkload ? "neutral" : plan.crew.shortByHeadcount > 0 ? "danger" : "success"
              }
            />
            <MetricCard
              label="Labor Cost (peak window)"
              value={plan.hasModelledWorkload ? fmtInr(plan.crew.estimatedWindowLaborCost) : "—"}
              sub={
                !plan.hasModelledWorkload
                  ? "needs a staffing plan first"
                  : plan.crew.estimatedWindowLaborCost == null
                    ? "no salaries on record for the roster"
                    : `${plan.peak.drivingWindowMinutes} min as allocated`
              }
              icon={CurrencyRupeeIcon}
              status={plan.hasModelledWorkload ? "warning" : "neutral"}
            />
          </div>

          {/* Why this confidence */}
          {plan.source.confidenceReasons.length > 0 && (
            <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5">
              <p className="text-[11px] font-semibold text-gray-600">How this plan was derived:</p>
              <ul className="mt-1 list-inside list-disc space-y-0.5 text-[11px] text-gray-500">
                {plan.source.confidenceReasons.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Required vs covered per station */}
          <div className={CHART_CARD}>
            <div className="border-b border-gray-100 px-4 py-3">
              <h3 className="text-[15px] font-bold text-gray-900">Required vs. Covered Staff by Station</h3>
              <p className="mt-0.5 text-[11px] text-gray-500">
                Bars are staff-equivalents (FTE) over the busiest {plan.peak.drivingWindowMinutes} minutes.
                Required is already capped at what each station's equipment can physically produce.
              </p>
            </div>
            <div className="p-3">
              {stationChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={stationChartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={TICK} axisLine={false} tickLine={false} />
                    <YAxis tick={TICK} axisLine={false} tickLine={false} />
                    <Tooltip formatter={(v: any) => `${v} FTE`} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="required" name="Required" radius={[4, 4, 0, 0]}>
                      {stationChartData.map((entry, i) => (
                        <Cell key={`req-${i}`} fill={CONSTRAINT_STYLES[entry.constraint as StationConstraint].bar} />
                      ))}
                    </Bar>
                    <Bar dataKey="covered" name="Covered by roster" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-[240px] items-center justify-center text-[12px] text-gray-400">
                  No station workload in this window — add labor standards to your menu items.
                </div>
              )}
            </div>
          </div>

          {/* Station detail table */}
          <div className={CHART_CARD}>
            <div className="border-b border-gray-100 px-4 py-3">
              <h3 className="text-[15px] font-bold text-gray-900">Station Breakdown</h3>
              <p className="mt-0.5 text-[11px] text-gray-500">
                Workload is the peak {plan.peak.drivingWindowMinutes}-minute figure. Productive minutes per
                person already exclude non-producing time.
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-[12px]">
                <thead className="bg-gray-50">
                  <tr className="border-b border-gray-100">
                    {[
                      "Station",
                      "Workload",
                      "Items",
                      "Productive min/staff",
                      "Required",
                      "Covered",
                      "Short",
                      "Equipment",
                      "Status",
                    ].map((h) => (
                      <th
                        key={h}
                        className="whitespace-nowrap px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wide text-gray-400"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {plan.stations.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-10 text-center text-[12px] text-gray-400">
                        No stations defined for this branch yet.
                      </td>
                    </tr>
                  ) : (
                    plan.stations.map((s) => {
                      const style = CONSTRAINT_STYLES[s.constraint];
                      return (
                        <tr key={s.stationId} className="border-b border-gray-50">
                          <td className="px-4 py-2.5">
                            <p className="font-semibold text-gray-900">{s.name}</p>
                            {s.topContributors.length > 0 && (
                              <p className="mt-0.5 max-w-[220px] truncate text-[10px] text-gray-400">
                                {s.topContributors
                                  .slice(0, 3)
                                  .map((c) => `${c.itemName} ${Math.round(c.minutes)}m`)
                                  .join(" · ")}
                              </p>
                            )}
                          </td>
                          <td className="px-4 py-2.5 text-gray-700">{fmtMinutes(s.workloadMinutes)}</td>
                          <td className="px-4 py-2.5 text-gray-500">{Math.round(s.itemUnits)}</td>
                          <td className="px-4 py-2.5 text-gray-500">
                            {fmtMinutes(s.productiveMinutesPerStaff)}
                            <span className="ml-1 text-[10px] text-gray-400">
                              ({Math.round(s.utilizationFactorUsed * 100)}%)
                            </span>
                          </td>
                          <td className="px-4 py-2.5">
                            <span className="font-bold text-gray-900">{fmtFte(s.requiredFte)}</span>
                            {s.requiredFte < s.rawRequiredFte - 0.01 && (
                              <span
                                className="ml-1 text-[10px] text-red-600"
                                title={`Uncapped requirement is ${fmtFte(s.rawRequiredFte)} FTE — capped because the station cannot produce that much`}
                              >
                                (capped)
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-2.5 text-gray-700">{fmtFte(s.coveredFte)}</td>
                          <td className="px-4 py-2.5">
                            <span className={s.shortfallFte > 0.25 ? "font-bold text-red-600" : "text-gray-400"}>
                              {s.shortfallFte > 0 ? fmtFte(s.shortfallFte) : "—"}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-gray-500">
                            {s.capacityPerHour == null ? (
                              <span className="text-[10px] text-gray-400">not set</span>
                            ) : (
                              <>
                                <span
                                  className={
                                    s.isEquipmentBound ? "font-bold text-red-600" : "text-gray-700"
                                  }
                                >
                                  {s.equipmentUtilizationPercent}%
                                </span>
                                <span className="ml-1 text-[10px] text-gray-400">
                                  of {s.capacityPerHour}/hr
                                </span>
                                {s.unservableItemsPerHour > 0 && (
                                  <p className="text-[10px] text-red-600">
                                    -{s.unservableItemsPerHour}/hr unservable
                                  </p>
                                )}
                              </>
                            )}
                          </td>
                          <td className="px-4 py-2.5">
                            <span
                              className={`inline-block whitespace-nowrap rounded-full border px-2 py-0.5 text-[10px] font-semibold ${style.chip}`}
                              title={style.help}
                            >
                              {style.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Allocation */}
          <div className={CHART_CARD}>
            <div className="border-b border-gray-100 px-4 py-3">
              <h3 className="text-[15px] font-bold text-gray-900">Who Stands Where</h3>
              <p className="mt-0.5 text-[11px] text-gray-500">
                {plan.crew.basis === "SCHEDULED"
                  ? "Staff clocked in today, assigned across stations by skill — a split means one person covers two stations."
                  : "No one is clocked in, so this is a hypothetical roster of everyone marked able to work a station."}
              </p>
            </div>
            {plan.crew.assignments.length === 0 ? (
              <div className="flex h-[120px] items-center justify-center px-4 text-center text-[12px] text-gray-400">
                No staff have station skills recorded — fill in the Skill Matrix tab so the plan can allocate
                people.
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {plan.crew.assignments.map((a) => (
                  <div key={a.userId} className="flex flex-col gap-2 px-4 py-2.5 sm:flex-row sm:items-center">
                    <p className="w-40 shrink-0 text-[13px] font-semibold text-gray-900">{a.name}</p>
                    <div className="flex min-w-0 flex-1 items-center gap-2">
                      {a.stations.length === 0 ? (
                        <span className="text-[11px] text-gray-400">Unassigned — no station needs their skills</span>
                      ) : (
                        <div className="flex h-5 min-w-0 flex-1 overflow-hidden rounded-full bg-gray-100">
                          {a.stations.map((s) => (
                            <div
                              key={s.stationId}
                              className="flex items-center justify-center bg-[#b10000] text-[9px] font-bold text-white"
                              style={{ width: `${s.percentOfWindow}%` }}
                              title={`${s.name} — ${s.percentOfWindow}% of the window`}
                            >
                              {s.percentOfWindow >= 18 ? s.name : ""}
                            </div>
                          ))}
                          {a.idleFraction > 0.01 && (
                            <div
                              className="flex items-center justify-center text-[9px] font-semibold text-gray-500"
                              style={{ width: `${Math.round(a.idleFraction * 100)}%` }}
                              title={`${Math.round(a.idleFraction * 100)}% of the window free`}
                            >
                              {a.idleFraction >= 0.18 ? "free" : ""}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <p className="w-24 shrink-0 text-right text-[11px] text-gray-500">
                      {a.idleFraction > 0.01 ? `${Math.round(a.idleFraction * 100)}% free` : "fully used"}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Arrival shape + rolling windows */}
          <div className="grid grid-cols-1 gap-3 xl:grid-cols-3">
            <div className={`${CHART_CARD} xl:col-span-2`}>
              <div className="border-b border-gray-100 px-4 py-3">
                <h3 className="text-[15px] font-bold text-gray-900">Workload Through the Window</h3>
                <p className="mt-0.5 text-[11px] text-gray-500">
                  15-minute slices. An hourly average hides a rush like this — the bars are what the plan is
                  actually solved against.
                </p>
              </div>
              <div className="p-3">
                {bucketChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <ComposedChart data={bucketChartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="label" tick={TICK} axisLine={false} tickLine={false} interval={3} />
                      <YAxis yAxisId="left" tick={TICK} axisLine={false} tickLine={false} unit="m" />
                      <YAxis yAxisId="right" orientation="right" tick={TICK} axisLine={false} tickLine={false} />
                      <Tooltip />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Bar
                        yAxisId="left"
                        dataKey="workload"
                        name="Labor minutes"
                        fill="#b10000"
                        radius={[4, 4, 0, 0]}
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="orders"
                        name="Orders"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        dot={false}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-[220px] items-center justify-center text-[12px] text-gray-400">
                    No order history in this window.
                  </div>
                )}
              </div>
            </div>

            <div className={CHART_CARD}>
              <div className="border-b border-gray-100 px-4 py-3">
                <h3 className="text-[15px] font-bold text-gray-900">Peak by Window Length</h3>
                <p className="mt-0.5 text-[11px] text-gray-500">
                  Same demand, measured over different spans. A much higher short-window rate means bursty
                  arrivals.
                </p>
              </div>
              <div className="divide-y divide-gray-50">
                {plan.peak.windows.map((w) => {
                  const isDriving = w.windowMinutes === plan.peak.drivingWindowMinutes;
                  return (
                    <div
                      key={w.windowMinutes}
                      className={`flex items-center justify-between px-4 py-2.5 ${isDriving ? "bg-red-50/40" : ""}`}
                    >
                      <div>
                        <p className="text-[12px] font-semibold text-gray-900">
                          {w.windowMinutes} min
                          {isDriving && (
                            <span className="ml-1.5 rounded-full bg-[#b10000] px-1.5 py-0.5 text-[9px] font-bold text-white">
                              PLANNED
                            </span>
                          )}
                        </p>
                        <p className="text-[10px] text-gray-400">{w.label}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[13px] font-bold text-gray-900">{Math.round(w.workloadMinutesPerHour)}</p>
                        <p className="text-[9px] text-gray-400">labor min/hr</p>
                      </div>
                    </div>
                  );
                })}
                {plan.peak.windows.length === 0 && (
                  <div className="flex h-[120px] items-center justify-center text-[12px] text-gray-400">
                    Not enough data for a rolling-window peak.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Coverage gap */}
          {plan.demand.itemsMissingStandards.length > 0 && (
            <Alert variant="warning" title={`${Math.round(100 - plan.demand.coveragePercent)}% of demand has no labor standard`}>
              These items sold in this window but have no per-station minutes, so their workload is missing
              from every number above:{" "}
              {plan.demand.itemsMissingStandards
                .map((i) => `${i.itemName} (${Math.round(i.quantity)}/day)`)
                .join(", ")}
              . Add them on the Labor Standards tab.
            </Alert>
          )}
        </>
      )}
    </div>
  );
}
