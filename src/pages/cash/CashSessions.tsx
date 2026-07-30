import { useEffect, useState } from "react";
import dayjs from "dayjs";
import { useAppSelector } from "../../store";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from "recharts";

export default function CashSessions() {
  const API_URL = import.meta.env.VITE_API_URL;
  const { from, to } = useAppSelector((s) => s.dateRange);
  const { selectedBranch } = useAppSelector((s) => s.branch);
  const { token } = useAppSelector((s) => s.auth);
  const [loading, setLoading] = useState(false);
  const [sessions, setSessions] = useState<any[]>([]);

  useEffect(() => {
    const fetch_ = async () => {
      if (!selectedBranch?.id) return;
      try {
        setLoading(true);
        const res = await fetch(
          `${API_URL}/api/cash/sessions?branchId=${selectedBranch.id}&from=${from}&to=${to}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        const data = await res.json();
        if (data.success) setSessions(data.data || []);
      } catch {
        /* silent */
      } finally {
        setLoading(false);
      }
    };
    fetch_();
  }, [from, to, selectedBranch?.id]);

  const shortfallSessions = sessions.filter(
    (s: any) => Number(s.cashDifference || 0) < 0,
  );
  const surplusSessions = sessions.filter(
    (s: any) => Number(s.cashDifference || 0) > 0,
  );
  const totalShortfall = shortfallSessions.reduce(
    (sum: number, s: any) => sum + Math.abs(Number(s.cashDifference || 0)),
    0,
  );
  const totalSurplus = surplusSessions.reduce(
    (sum: number, s: any) => sum + Number(s.cashDifference || 0),
    0,
  );
  const netDiff = totalSurplus - totalShortfall;
  const bigDiscrepancy = sessions.filter(
    (s: any) => Math.abs(Number(s.cashDifference || 0)) > 500,
  );

  const sorted = [...sessions].sort(
    (a, b) => dayjs(a.businessDate).valueOf() - dayjs(b.businessDate).valueOf(),
  );
  const chartData = sorted.map((s: any) => ({
    date: dayjs(s.businessDate).format("DD/MM"),
    difference: Number(s.cashDifference || 0),
    opening: Number(s.openingCash || 0),
    closing: Number(s.closingCash || s.actualCash || 0),
  }));

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-red-500" />
          <p className="text-[12px] text-gray-500">Loading cash sessions...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto flex flex-col gap-3">
        {/* HEADER */}
        <div className="relative overflow-hidden rounded-md border border-gray-200 bg-white px-4 py-3 shadow-sm">
          <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-emerald-100/40 blur-3xl" />
          <div className="relative z-10 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#b10000] shadow-sm">
                <svg
                  className="h-5 w-5 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-black tracking-tight text-gray-900">
                  Cash Reconciliation
                </h1>
                <p className="mt-0.5 text-[13px] text-gray-500">
                  Daily cash session open/close, differences and shortfall
                  alerts
                </p>
              </div>
            </div>
            <p className="text-[11px] text-gray-400">
              {from} → {to}
            </p>
          </div>
        </div>

        {/* ALERT */}
        {bigDiscrepancy.length > 0 && (
          <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
            <svg
              className="mt-0.5 h-5 w-5 shrink-0 text-red-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <div>
              <p className="text-[13px] font-bold text-red-700">
                {bigDiscrepancy.length} session
                {bigDiscrepancy.length > 1 ? "s" : ""} with discrepancy &gt;
                ₹500 detected
              </p>
              <p className="mt-0.5 text-[11px] text-red-600">
                Review dates:{" "}
                {bigDiscrepancy
                  .map((s: any) => dayjs(s.businessDate).format("DD MMM"))
                  .join(", ")}{" "}
                — investigate immediately
              </p>
            </div>
          </div>
        )}

        {/* KPIs */}
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          {[
            {
              label: "Total Sessions",
              value: sessions.length,
              sub: "days recorded",
              cls: "border-blue-100 bg-blue-50/60",
              val: "text-blue-700",
            },
            {
              label: "Total Shortfall",
              value: `₹${totalShortfall.toLocaleString("en-IN")}`,
              sub: `${shortfallSessions.length} sessions`,
              cls: "border-red-100 bg-red-50/60",
              val: "text-red-700",
            },
            {
              label: "Total Surplus",
              value: `₹${totalSurplus.toLocaleString("en-IN")}`,
              sub: `${surplusSessions.length} sessions`,
              cls: "border-emerald-100 bg-emerald-50/60",
              val: "text-emerald-700",
            },
            {
              label: "Net Difference",
              value: `${netDiff >= 0 ? "+" : ""}₹${netDiff.toLocaleString("en-IN")}`,
              sub: netDiff >= 0 ? "net surplus" : "net shortfall",
              cls:
                netDiff >= 0
                  ? "border-emerald-100 bg-emerald-50/60"
                  : "border-red-100 bg-red-50/60",
              val: netDiff >= 0 ? "text-emerald-700" : "text-red-700",
            },
          ].map((k) => (
            <div key={k.label} className={`rounded-xl border p-4 ${k.cls}`}>
              <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500">
                {k.label}
              </p>
              <p className={`mt-2 text-[22px] font-bold ${k.val}`}>{k.value}</p>
              <p className="mt-1 text-[11px] text-gray-500">{k.sub}</p>
            </div>
          ))}
        </div>

        {/* CHARTS */}
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-100 px-4 py-3">
              <h3 className="text-[15px] font-bold text-gray-900">
                Cash Difference Trend
              </h3>
              <p className="mt-0.5 text-[11px] text-gray-500">
                Positive = surplus · Negative = shortfall · Watch for patterns
              </p>
            </div>
            <div className="p-3">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={chartData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#f1f5f9"
                    />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 10, fill: "#6b7280" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: "#6b7280" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      formatter={(v: any) =>
                        `₹${Number(v).toLocaleString("en-IN")}`
                      }
                    />
                    <ReferenceLine
                      y={0}
                      stroke="#ef4444"
                      strokeDasharray="4 2"
                      strokeWidth={1.5}
                    />
                    <Line
                      type="monotone"
                      dataKey="difference"
                      name="Cash Difference"
                      stroke="#10b981"
                      strokeWidth={2}
                      dot={{ fill: "#10b981", r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-[200px] items-center justify-center text-[12px] text-gray-400">
                  No data for this period
                </div>
              )}
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-100 px-4 py-3">
              <h3 className="text-[15px] font-bold text-gray-900">
                Opening vs Closing Cash
              </h3>
              <p className="mt-0.5 text-[11px] text-gray-500">
                Daily cash flow comparison
              </p>
            </div>
            <div className="p-3">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={chartData} barGap={2}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#f1f5f9"
                    />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 10, fill: "#6b7280" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: "#6b7280" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      formatter={(v: any) =>
                        `₹${Number(v).toLocaleString("en-IN")}`
                      }
                    />
                    <Bar
                      dataKey="opening"
                      name="Opening"
                      fill="#3b82f6"
                      radius={[3, 3, 0, 0]}
                    />
                    <Bar
                      dataKey="closing"
                      name="Closing"
                      fill="#10b981"
                      radius={[3, 3, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-[200px] items-center justify-center text-[12px] text-gray-400">
                  No data for this period
                </div>
              )}
            </div>
          </div>
        </div>

        {/* SESSIONS TABLE */}
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-4 py-3">
            <h3 className="text-[15px] font-bold text-gray-900">
              Session History
            </h3>
            <p className="mt-0.5 text-[11px] text-gray-500">
              All daily cash sessions with opening, expected and actual amounts
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-[12px]">
              <thead className="bg-gray-50">
                <tr className="border-b border-gray-100">
                  {[
                    "Date",
                    "Opened By",
                    "Open Time",
                    "Close Time",
                    "Opening ₹",
                    "Expected ₹",
                    "Actual ₹",
                    "Difference",
                    "Notes",
                    "Status",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-2 text-left text-[10px] font-bold uppercase tracking-wide text-gray-400"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sorted.length > 0 ? (
                  sorted.map((s: any) => {
                    const diff = Number(s.cashDifference || 0);
                    const isBig = Math.abs(diff) > 500;
                    return (
                      <tr
                        key={s.id}
                        className={`border-b border-gray-50 transition hover:bg-gray-50/40 ${isBig ? "bg-red-50/60" : ""}`}
                      >
                        <td className="px-4 py-2.5 font-semibold text-gray-900">
                          {dayjs(s.businessDate).format("DD MMM YYYY")}
                          {isBig && (
                            <span className="ml-1.5 rounded-full bg-red-100 px-1.5 py-0.5 text-[8px] font-bold text-red-600">
                              ALERT
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-gray-600">
                          {s.openedBy?.name || "—"}
                        </td>
                        <td className="px-4 py-2.5 text-gray-500">
                          {s.openedAt
                            ? dayjs(s.openedAt).format("h:mm A")
                            : "—"}
                        </td>
                        <td className="px-4 py-2.5 text-gray-500">
                          {s.closedAt
                            ? dayjs(s.closedAt).format("h:mm A")
                            : "—"}
                        </td>
                        <td className="px-4 py-2.5 text-gray-700">
                          ₹{Number(s.openingCash || 0).toLocaleString("en-IN")}
                        </td>
                        <td className="px-4 py-2.5 text-gray-700">
                          ₹{Number(s.expectedCash || 0).toLocaleString("en-IN")}
                        </td>
                        <td className="px-4 py-2.5 font-semibold text-gray-900">
                          ₹
                          {Number(
                            s.actualCash || s.closingCash || 0,
                          ).toLocaleString("en-IN")}
                        </td>
                        <td className="px-4 py-2.5">
                          <span
                            className={`font-bold ${diff > 0 ? "text-emerald-600" : diff < 0 ? "text-red-600" : "text-gray-500"}`}
                          >
                            {diff === 0
                              ? "Balanced"
                              : `${diff > 0 ? "+" : ""}₹${diff.toLocaleString("en-IN")}`}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 max-w-[150px] truncate text-gray-500">
                          {s.notes || "—"}
                        </td>
                        <td className="px-4 py-2.5">
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${s.status === "CLOSED" ? "bg-emerald-50 text-emerald-600" : "bg-orange-50 text-orange-600"}`}
                          >
                            {s.status || "OPEN"}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan={10}
                      className="py-14 text-center text-[12px] text-gray-400"
                    >
                      No cash sessions found. Sessions are created when staff
                      open/close the register each day.
                    </td>
                  </tr>
                )}
              </tbody>
              {sessions.length > 0 && (
                <tfoot className="border-t border-gray-200 bg-gray-50">
                  <tr>
                    <td
                      colSpan={4}
                      className="px-4 py-3 text-[12px] font-bold text-gray-900"
                    >
                      TOTALS
                    </td>
                    <td className="px-4 py-3 text-[12px] font-bold text-gray-700">
                      ₹
                      {sessions
                        .reduce((s, r) => s + Number(r.openingCash || 0), 0)
                        .toLocaleString("en-IN")}
                    </td>
                    <td className="px-4 py-3 text-[12px] font-bold text-gray-700">
                      ₹
                      {sessions
                        .reduce((s, r) => s + Number(r.expectedCash || 0), 0)
                        .toLocaleString("en-IN")}
                    </td>
                    <td className="px-4 py-3 text-[12px] font-bold text-gray-900">
                      ₹
                      {sessions
                        .reduce(
                          (s, r) =>
                            s + Number(r.actualCash || r.closingCash || 0),
                          0,
                        )
                        .toLocaleString("en-IN")}
                    </td>
                    <td
                      className="px-4 py-3 text-[12px] font-bold"
                      style={{ color: netDiff >= 0 ? "#059669" : "#dc2626" }}
                    >
                      {netDiff >= 0 ? "+" : ""}₹
                      {netDiff.toLocaleString("en-IN")}
                    </td>
                    <td colSpan={2} />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}
