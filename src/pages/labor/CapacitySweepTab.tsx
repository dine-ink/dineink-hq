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
import { Alert, MetricCard } from "../../design";
import { CHART_CARD, TICK, fmtFte, fmtMinutes } from "./laborCategories";
import { useLaborQuery, useLaborScope } from "./useLaborApi";
import MobileTableCards from "../../components/common/MobileTableCards";

// The whole trading day at a glance: required staff per hour, which station is
// busiest, and which hours are equipment-bound. Answers "WHEN does the kitchen
// break?" rather than only "how badly".

interface SweepStation {
  stationId: number;
  code: string;
  name: string;
  workloadMinutes: number;
  requiredFte: number;
  isEquipmentBound: boolean;
  equipmentUtilizationPercent: number | null;
  unservableItemsPerHour: number;
}

interface SweepHour {
  hour: number;
  label: string;
  expectedOrders: number;
  daysWithData: number;
  totalWorkloadMinutes: number;
  totalRequiredFte: number;
  recommendedHeadcount: number;
  busiestStationCode: string | null;
  equipmentBoundStationCodes: string[];
  perStation: SweepStation[];
}

interface SweepResponse {
  trailingDays: number;
  stations: { stationId: number; code: string; name: string }[];
  hours: SweepHour[];
  peakHour: { hour: number; label: string; requiredFte: number; recommendedHeadcount: number } | null;
}

const STATION_COLORS = ["#b10000", "#f97316", "#3b82f6", "#7c3aed", "#059669", "#0891b2", "#db2777", "#65a30d"];

export default function CapacitySweepTab() {
  const { restaurantId, branchId } = useLaborScope();
  const [days, setDays] = useState(30);

  const path = restaurantId && branchId ? `/${restaurantId}/${branchId}/capacity-sweep?days=${days}` : null;
  const { data, loading, error } = useLaborQuery<SweepResponse>(path);

  // Only hours the kitchen actually trades in — a 24-row chart of mostly zeros
  // buries the four hours that matter.
  const activeHours = useMemo(
    () => (data?.hours || []).filter((h) => h.expectedOrders > 0 || h.totalRequiredFte > 0),
    [data?.hours],
  );

  const chartData = activeHours.map((h) => {
    const row: Record<string, number | string> = {
      label: h.label,
      requiredFte: h.totalRequiredFte,
      orders: h.expectedOrders,
    };
    h.perStation.forEach((s) => {
      row[s.code] = s.requiredFte;
    });
    return row;
  });

  const equipmentBoundHours = activeHours.filter((h) => h.equipmentBoundStationCodes.length > 0);
  const totalDayWorkload = activeHours.reduce((s, h) => s + h.totalWorkloadMinutes, 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-[15px] font-bold text-gray-900">Capacity by Hour</h3>
          <p className="mt-0.5 max-w-3xl text-[11px] text-gray-500">
            Required staff for every trading hour, from the average day in your history. Red hours are
            equipment-bound — those are the ones a hire cannot fix.
          </p>
        </div>
        <select
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          className="shrink-0 rounded-xl border border-gray-200 bg-white px-3 py-2 text-[12px] font-semibold text-gray-700 outline-none"
          aria-label="History window"
        >
          {[14, 30, 60, 90].map((d) => (
            <option key={d} value={d}>
              Last {d} days
            </option>
          ))}
        </select>
      </div>

      {error && <Alert variant="danger" title="Could not load the capacity sweep">{error}</Alert>}

      {loading && (
        <div className="flex h-40 items-center justify-center text-[12px] text-gray-400">
          Computing hour-by-hour capacity…
        </div>
      )}

      {!loading && data && activeHours.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-gray-200 bg-gray-50 py-12 text-center">
          <p className="text-[13px] font-semibold text-gray-700">No workload to show</p>
          <p className="max-w-md text-[11px] text-gray-500">
            Either there are no orders in the last {days} days, or no menu item has station labor standards yet.
            Both are needed before an hourly requirement can be computed.
          </p>
        </div>
      )}

      {!loading && data && activeHours.length > 0 && (
        <>
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            <MetricCard
              label="Peak Hour"
              value={data.peakHour?.label || "—"}
              sub={data.peakHour ? `${data.peakHour.recommendedHeadcount} staff needed` : "no peak found"}
              status="secondary"
            />
            <MetricCard
              label="Peak Requirement"
              value={fmtFte(data.peakHour?.requiredFte)}
              sub="staff-equivalents at the busiest hour"
              status="warning"
            />
            <MetricCard
              label="Daily Kitchen Workload"
              value={fmtMinutes(totalDayWorkload)}
              sub={`${(totalDayWorkload / 60).toFixed(1)} labor hours on an average day`}
              status="info"
            />
            <MetricCard
              label="Equipment-Bound Hours"
              value={equipmentBoundHours.length}
              sub={
                equipmentBoundHours.length > 0
                  ? "hiring will not raise output in these"
                  : "no throughput ceiling reached"
              }
              status={equipmentBoundHours.length > 0 ? "danger" : "success"}
            />
          </div>

          {/* Stacked per-station requirement */}
          <div className={CHART_CARD}>
            <div className="border-b border-gray-100 px-4 py-3">
              <h3 className="text-[15px] font-bold text-gray-900">Required Staff by Station, by Hour</h3>
              <p className="mt-0.5 text-[11px] text-gray-500">
                Stacked staff-equivalents. The line is order volume — where the two diverge, the item mix (not
                the order count) is driving the workload.
              </p>
            </div>
            <div className="p-3">
              <ResponsiveContainer width="100%" height={280}>
                <ComposedChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="label" tick={TICK} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="left" tick={TICK} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="right" orientation="right" tick={TICK} axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  {data.stations.map((s, i) => (
                    <Bar
                      key={s.stationId}
                      yAxisId="left"
                      dataKey={s.code}
                      name={s.name}
                      stackId="stations"
                      fill={STATION_COLORS[i % STATION_COLORS.length]}
                    />
                  ))}
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="orders"
                    name="Orders"
                    stroke="#111827"
                    strokeWidth={2}
                    strokeDasharray="4 2"
                    dot={false}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Headcount per hour */}
          <div className={CHART_CARD}>
            <div className="border-b border-gray-100 px-4 py-3">
              <h3 className="text-[15px] font-bold text-gray-900">Recommended Headcount by Hour</h3>
              <p className="mt-0.5 text-[11px] text-gray-500">
                Rounded up from the pooled requirement across all stations — not the sum of each station rounded
                up separately, which would overstate headcount.
              </p>
            </div>
            <div className="p-3">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={activeHours}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="label" tick={TICK} axisLine={false} tickLine={false} />
                  <YAxis tick={TICK} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip formatter={(v: any) => `${v} staff`} />
                  <Bar dataKey="recommendedHeadcount" name="Staff needed" radius={[4, 4, 0, 0]}>
                    {activeHours.map((h, i) => (
                      <Cell
                        key={`hc-${i}`}
                        fill={h.equipmentBoundStationCodes.length > 0 ? "#dc2626" : "#b10000"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              {equipmentBoundHours.length > 0 && (
                <p className="mt-1.5 text-[10px] text-gray-400">
                  <span className="mr-1 inline-block h-2 w-2 rounded-sm bg-red-600 align-middle" />
                  Bright red hours have at least one station at its throughput ceiling
                </p>
              )}
            </div>
          </div>

          {/* Hour table */}
          <div className={CHART_CARD}>
            <div className="border-b border-gray-100 px-4 py-3">
              <h3 className="text-[15px] font-bold text-gray-900">Hour Detail</h3>
            </div>
            <div className="overflow-x-auto">
              <MobileTableCards>
              <table className="min-w-full text-[12px]">
                <thead className="bg-gray-50">
                  <tr className="border-b border-gray-100">
                    {["Hour", "Orders", "Workload", "Required", "Staff", "Busiest station", "At ceiling", "Days of data"].map(
                      (h) => (
                        <th
                          key={h}
                          className="whitespace-nowrap px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wide text-gray-400"
                        >
                          {h}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {activeHours.map((h) => (
                    <tr
                      key={h.hour}
                      className={`border-b border-gray-50 ${
                        h.equipmentBoundStationCodes.length > 0 ? "bg-red-50/30" : ""
                      }`}
                    >
                      <td className="px-4 py-2 font-semibold text-gray-900">{h.label}</td>
                      <td className="px-4 py-2 text-gray-500">{h.expectedOrders}</td>
                      <td className="px-4 py-2 text-gray-700">{fmtMinutes(h.totalWorkloadMinutes)}</td>
                      <td className="px-4 py-2 text-gray-700">{fmtFte(h.totalRequiredFte)}</td>
                      <td className="px-4 py-2 font-bold text-gray-900">{h.recommendedHeadcount}</td>
                      <td className="px-4 py-2 text-gray-500">{h.busiestStationCode || "—"}</td>
                      <td className="px-4 py-2">
                        {h.equipmentBoundStationCodes.length > 0 ? (
                          <span className="font-semibold text-red-600">
                            {h.equipmentBoundStationCodes.join(", ")}
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-2 text-[11px] text-gray-400">{h.daysWithData}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </MobileTableCards>
            </div>
          </div>

          <Alert variant="info" title="These are hourly averages">
            Each row averages that hour of the day across the last {data.trailingDays} days, so a rush inside
            the hour is smoothed away. Use the Staffing Plan tab for the 15-minute view and the burst warning
            that comes with it.
          </Alert>
        </>
      )}
    </div>
  );
}
