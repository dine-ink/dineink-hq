import { useState } from "react";
import { Alert, Button, MetricCard } from "@/design";
import { CHART_CARD } from "./laborCategories";
import { useLaborQuery, useLaborScope } from "./useLaborApi";
import MobileTableCards from "@/components/common/MobileTableCards";

// Calibration: comparing the labor standards an owner entered against what the
// kitchen actually did. The honesty of this tab matters more than its numbers —
// order duration is wall clock, which includes queue wait and parallel cooking,
// so only RELATIVE per-item differences are recoverable. The UI says so.

interface CalibrationItem {
  menuItemId: number;
  itemName: string;
  factor: number;
  observationCount: number;
  stations: {
    stationId: number;
    code: string;
    standardMinutes: number;
    suggestedMinutes: number;
    observedMinutes: number | null;
    observationCount: number;
  }[];
}

interface CalibrationResponse {
  trailingDays: number;
  ordersConsidered: number;
  ordersUsable: number;
  maxConcurrencyUsed: number;
  applied: boolean;
  items: CalibrationItem[];
  staffThroughput: {
    userId: number;
    name: string;
    hoursOnShift: number;
    ordersCompletedDuringShift: number;
    ordersPerHour: number;
    branchAverageOrdersPerHour: number;
    relativeIndex: number;
  }[];
  staffThroughputCaveat: string;
}

export default function CalibrationTab() {
  const { restaurantId, branchId, request } = useLaborScope();
  const [days, setDays] = useState(60);

  const path = restaurantId && branchId ? `/${restaurantId}/${branchId}/calibration?days=${days}` : null;
  const { data, loading, error, reload } = useLaborQuery<CalibrationResponse>(path);

  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const apply = async () => {
    if (
      !window.confirm(
        "Record these measured times against your labor standards?\n\nYour entered standards are NOT overwritten — the measured figures are stored alongside them, and the plan only starts using a measured time once it has 20+ observations.",
      )
    )
      return;
    setBusy(true);
    setActionError(null);
    try {
      const result = await request(`/${restaurantId}/${branchId}/calibration/apply`, {
        method: "POST",
        body: JSON.stringify({ days }),
      });
      reload();
      setNotice(`Recorded measured times for ${result.items.length} item(s).`);
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const usablePercent =
    data && data.ordersConsidered > 0 ? Math.round((data.ordersUsable / data.ordersConsidered) * 100) : 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-[15px] font-bold text-gray-900">Calibration</h3>
          <p className="mt-0.5 max-w-3xl text-[11px] text-gray-500">
            Checks your entered labor standards against completed order times, and flags the items that are
            relatively slower or faster than you assumed.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-[12px] font-semibold text-gray-700 outline-none"
            aria-label="Calibration window"
          >
            {[30, 60, 90, 180].map((d) => (
              <option key={d} value={d}>
                Last {d} days
              </option>
            ))}
          </select>
          <Button
            size="sm"
            onClick={apply}
            loading={busy}
            disabled={!data || data.items.length === 0}
          >
            Record measured times
          </Button>
        </div>
      </div>

      {notice && (
        <Alert variant="success" onDismiss={() => setNotice(null)}>
          {notice}
        </Alert>
      )}
      {actionError && (
        <Alert variant="danger" title="Could not apply calibration" onDismiss={() => setActionError(null)}>
          {actionError}
        </Alert>
      )}
      {error && <Alert variant="danger" title="Could not load calibration">{error}</Alert>}

      {loading && (
        <div className="flex h-40 items-center justify-center text-[12px] text-gray-400">
          Comparing standards against order history…
        </div>
      )}

      {!loading && data && (
        <>
          <Alert variant="info" title="What this can and cannot measure">
            An order's duration is one number covering several items, and it includes queue wait as well as
            hands-on work — so the <strong>absolute</strong> level of minutes is not recoverable from it. Only{" "}
            <strong>relative</strong> differences between items are, and the factors below are centred so the
            typical item sits at 1.00. A factor of 1.30 means "this item runs 30% longer than your standard
            relative to the rest of the menu", not "add 30% to every standard".
          </Alert>

          <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            <MetricCard
              label="Orders Considered"
              value={data.ordersConsidered.toLocaleString("en-IN")}
              sub={`completed in the last ${data.trailingDays} days`}
              status="info"
            />
            <MetricCard
              label="Orders Used"
              value={data.ordersUsable.toLocaleString("en-IN")}
              sub={`${usablePercent}% — only quiet-kitchen orders qualify`}
              status={usablePercent >= 20 ? "success" : "warning"}
            />
            <MetricCard
              label="Items Measured"
              value={data.items.length}
              sub="with enough appearances to compare"
              status="secondary"
            />
            <MetricCard
              label="Queue Cutoff"
              value={`≤ ${data.maxConcurrencyUsed}`}
              sub="other orders open when the ticket started"
              status="neutral"
            />
          </div>

          {data.ordersUsable === 0 && (
            <Alert variant="warning" title="No orders qualified for calibration">
              Calibration only uses orders cooked when at most {data.maxConcurrencyUsed} other orders were open,
              because otherwise the duration is mostly queue wait rather than cooking. Either this kitchen is
              always busy, or there aren't enough completed orders with station standards yet.
            </Alert>
          )}

          {data.items.length > 0 && (
            <div className={CHART_CARD}>
              <div className="border-b border-gray-100 px-4 py-3">
                <h3 className="text-[15px] font-bold text-gray-900">Suggested Corrections</h3>
                <p className="mt-0.5 text-[11px] text-gray-500">
                  Biggest disagreements first. Anything near 1.00 means your entered standard already matches
                  what the kitchen does.
                </p>
              </div>
              <div className="overflow-x-auto">
                <MobileTableCards>
                <table className="min-w-full text-[12px]">
                  <thead className="bg-gray-50">
                    <tr className="border-b border-gray-100">
                      {["Item", "Factor", "Observations", "Per-station standard → measured"].map((h) => (
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
                    {data.items.map((item) => {
                      const off = Math.abs(item.factor - 1);
                      return (
                        <tr key={item.menuItemId} className="border-b border-gray-50">
                          <td className="px-4 py-2.5 font-semibold text-gray-900">{item.itemName}</td>
                          <td className="px-4 py-2.5">
                            <span
                              className={`font-bold ${
                                off < 0.1
                                  ? "text-emerald-600"
                                  : item.factor > 1
                                    ? "text-red-600"
                                    : "text-blue-600"
                              }`}
                            >
                              {item.factor.toFixed(2)}×
                            </span>
                            <p className="text-[10px] text-gray-400">
                              {off < 0.1
                                ? "standard is right"
                                : item.factor > 1
                                  ? "slower than entered"
                                  : "faster than entered"}
                            </p>
                          </td>
                          <td className="px-4 py-2.5 text-gray-500">
                            {item.observationCount}
                            {item.observationCount < 20 && (
                              <p className="text-[10px] text-amber-600">below the 20 needed to be used</p>
                            )}
                          </td>
                          <td className="px-4 py-2.5">
                            <div className="flex flex-wrap gap-1.5">
                              {item.stations.map((s) => (
                                <span
                                  key={s.stationId}
                                  className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-600"
                                >
                                  {s.code}: {s.standardMinutes}m → <strong>{s.suggestedMinutes}m</strong>
                                </span>
                              ))}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                </MobileTableCards>
              </div>
            </div>
          )}

          {/* Per-employee throughput — carefully framed */}
          {data.staffThroughput.length > 0 && (
            <div className={CHART_CARD}>
              <div className="border-b border-gray-100 px-4 py-3">
                <h3 className="text-[15px] font-bold text-gray-900">Shift Throughput by Staff Member</h3>
                <p className="mt-0.5 text-[11px] text-gray-500">
                  Orders the kitchen completed while each person was clocked in.
                </p>
              </div>
              <div className="overflow-x-auto">
                <MobileTableCards>
                <table className="min-w-full text-[12px]">
                  <thead className="bg-gray-50">
                    <tr className="border-b border-gray-100">
                      {["Staff", "Hours on shift", "Orders during shift", "Orders/hr", "vs branch average"].map(
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
                    {data.staffThroughput.map((s) => (
                      <tr key={s.userId} className="border-b border-gray-50">
                        <td className="px-4 py-2.5 font-semibold text-gray-900">{s.name}</td>
                        <td className="px-4 py-2.5 text-gray-500">{s.hoursOnShift.toFixed(1)}</td>
                        <td className="px-4 py-2.5 text-gray-500">{s.ordersCompletedDuringShift}</td>
                        <td className="px-4 py-2.5 font-semibold text-gray-900">{s.ordersPerHour.toFixed(2)}</td>
                        <td className="px-4 py-2.5 text-gray-500">
                          {s.relativeIndex.toFixed(2)}×
                          <span className="ml-1 text-[10px] text-gray-400">
                            (avg {s.branchAverageOrdersPerHour.toFixed(2)}/hr)
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </MobileTableCards>
              </div>
              <div className="border-t border-gray-100 bg-amber-50/50 px-4 py-3">
                <p className="text-[11px] font-semibold text-amber-800">Not an individual speed rating</p>
                <p className="mt-0.5 text-[11px] text-amber-700">{data.staffThroughputCaveat}</p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
