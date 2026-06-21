import { useEffect, useState } from "react";
import { useAppSelector } from "../../store";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from "recharts";
import { FireIcon } from "@heroicons/react/24/outline";

const TICK = { fontSize: 10, fill: "#6b7280" };

function KpiCard({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: string | number;
  sub: string;
  color: string;
}) {
  const cls: Record<string, string> = {
    red: "border-red-100 bg-red-50 text-red-700",
    emerald: "border-emerald-100 bg-emerald-50/60 text-emerald-700",
    blue: "border-blue-100 bg-blue-50/60 text-blue-700",
    orange: "border-orange-100 bg-orange-50/60 text-orange-700",
    violet: "border-violet-100 bg-violet-50/60 text-violet-700",
  };
  return (
    <div className={`rounded-xl border p-4 ${cls[color] || cls.red}`}>
      <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500">
        {label}
      </p>
      <p className={`mt-2 text-[22px] font-bold ${cls[color]?.split(" ")[2]}`}>
        {value}
      </p>
      <p className="mt-1 text-[11px] text-gray-500">{sub}</p>
    </div>
  );
}

export default function Kitchen() {
  const API_URL = import.meta.env.VITE_API_URL;
  const { from, to } = useAppSelector((s) => s.dateRange);
  const { selectedBranch } = useAppSelector((s) => s.branch);
  const { user, token } = useAppSelector((s) => s.auth);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const fetch_ = async () => {
      if (!user?.restaurantId) return;
      try {
        setLoading(true);
        const h = { Authorization: `Bearer ${token}` };
        const branchParam = selectedBranch?.id
          ? `&branchId=${selectedBranch.id}`
          : "";
        const res = await fetch(
          `${API_URL}/api/analytics/${user.restaurantId}/kitchen?from=${from}&to=${to}${branchParam}`,
          { headers: h },
        );
        const json = await res.json();
        if (json.success) setData(json.data);
      } catch {
        /* silent */
      } finally {
        setLoading(false);
      }
    };
    fetch_();
  }, [from, to, selectedBranch?.id]);

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-red-500" />
          <p className="text-[12px] text-gray-500">
            Loading kitchen analytics...
          </p>
        </div>
      </div>
    );
  }

  const summary = data?.summary || {};
  const hourlyData = data?.hourlyData || [];
  const dailyTrend = data?.dailyTrend || [];
  const tableTurnData = data?.tableTurnData || [];
  const topItems = data?.topItems || [];
  const slowestOrders = data?.slowestOrders || [];
  const orderTypeSpeeds = data?.orderTypeSpeeds || [];

  // Only show active kitchen hours (6am–midnight)
  const activeHours = hourlyData.filter(
    (h: any) => h.hour >= 6 && h.hour <= 23,
  );

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto flex flex-col gap-3">
        {/* HEADER */}
        <div className="relative overflow-hidden rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
          <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-red-100/40 blur-3xl" />
          <div className="relative z-10 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#b10000] shadow-sm">
                <FireIcon className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-black tracking-tight text-gray-900">
                  Kitchen Analytics
                </h1>
                <p className="mt-0.5 text-[12px] text-gray-500">
                  Order speed, SLA compliance, kitchen throughput and table turn
                  rate
                </p>
              </div>
            </div>
            <p className="text-[11px] text-gray-400">
              {from} → {to}
            </p>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-5">
          <KpiCard
            label="Total Orders"
            value={summary.totalOrders || 0}
            sub="completed orders"
            color="blue"
          />
          <KpiCard
            label="Avg Completion Time"
            value={`${summary.avgTime || 0}m`}
            sub="from order to serve"
            color="orange"
          />
          <KpiCard
            label="SLA Compliance"
            value={`${summary.slaPercent || 0}%`}
            sub="orders under 30 min"
            color={summary.slaPercent >= 80 ? "emerald" : "red"}
          />
          <KpiCard
            label="Fastest Order"
            value={`${summary.fastestOrder || 0}m`}
            sub="best completion time"
            color="emerald"
          />
          <KpiCard
            label="Peak Hour"
            value={summary.peakHourLabel || "—"}
            sub="highest kitchen load"
            color="violet"
          />
        </div>

        {/* CHARTS ROW 1 */}
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
          {/* Hourly Throughput */}
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-100 px-4 py-3">
              <h3 className="text-[15px] font-bold text-gray-900">
                Kitchen Throughput by Hour
              </h3>
              <p className="mt-0.5 text-[11px] text-gray-500">
                Orders received per hour — identifies peak kitchen load
              </p>
            </div>
            <div className="p-3">
              {activeHours.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={activeHours}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#f1f5f9"
                    />
                    <XAxis
                      dataKey="label"
                      tick={TICK}
                      axisLine={false}
                      tickLine={false}
                      interval={2}
                    />
                    <YAxis tick={TICK} axisLine={false} tickLine={false} />
                    <Tooltip />
                    <Bar
                      dataKey="orders"
                      name="Orders"
                      fill="#f97316"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-[220px] items-center justify-center text-[12px] text-gray-400">
                  No completed order data for this period
                </div>
              )}
            </div>
          </div>

          {/* Avg Completion Time by Hour */}
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-100 px-4 py-3">
              <h3 className="text-[15px] font-bold text-gray-900">
                Avg Completion Time by Hour
              </h3>
              <p className="mt-0.5 text-[11px] text-gray-500">
                When kitchen is slowest — helps plan staffing
              </p>
            </div>
            <div className="p-3">
              {activeHours.filter((h: any) => h.avgTime > 0).length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart
                    data={activeHours.filter((h: any) => h.orders > 0)}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#f1f5f9"
                    />
                    <XAxis
                      dataKey="label"
                      tick={TICK}
                      axisLine={false}
                      tickLine={false}
                      interval={2}
                    />
                    <YAxis
                      tick={TICK}
                      axisLine={false}
                      tickLine={false}
                      unit="m"
                    />
                    <Tooltip formatter={(v: any) => `${v} min`} />
                    <ReferenceLine
                      y={30}
                      stroke="#ef4444"
                      strokeDasharray="4 2"
                      strokeWidth={1.5}
                      label={{
                        value: "30m SLA",
                        position: "right",
                        fontSize: 9,
                        fill: "#ef4444",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="avgTime"
                      name="Avg Time (min)"
                      stroke="#f97316"
                      strokeWidth={2}
                      dot={{ fill: "#f97316", r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-[220px] items-center justify-center text-[12px] text-gray-400">
                  No timing data available
                </div>
              )}
            </div>
          </div>
        </div>

        {/* CHARTS ROW 2 */}
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
          {/* Daily Trend */}
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-100 px-4 py-3">
              <h3 className="text-[15px] font-bold text-gray-900">
                Daily Completion Trend
              </h3>
              <p className="mt-0.5 text-[11px] text-gray-500">
                Avg completion time per day — track kitchen efficiency over time
              </p>
            </div>
            <div className="p-3">
              {dailyTrend.length > 1 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={dailyTrend}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#f1f5f9"
                    />
                    <XAxis
                      dataKey="date"
                      tick={TICK}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={TICK}
                      axisLine={false}
                      tickLine={false}
                      unit="m"
                    />
                    <Tooltip formatter={(v: any) => `${v} min`} />
                    <ReferenceLine
                      y={30}
                      stroke="#ef4444"
                      strokeDasharray="4 2"
                      strokeWidth={1}
                    />
                    <Line
                      type="monotone"
                      dataKey="avgTime"
                      name="Avg Time"
                      stroke="#f97316"
                      strokeWidth={2}
                      dot={{ fill: "#f97316", r: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-[200px] items-center justify-center text-[12px] text-gray-400">
                  Not enough days of data
                </div>
              )}
            </div>
          </div>

          {/* Order Type Speed */}
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-100 px-4 py-3">
              <h3 className="text-[15px] font-bold text-gray-900">
                Speed by Order Type
              </h3>
              <p className="mt-0.5 text-[11px] text-gray-500">
                Which order type takes longest to complete
              </p>
            </div>
            <div className="p-3">
              {orderTypeSpeeds.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={orderTypeSpeeds} layout="vertical">
                    <CartesianGrid
                      strokeDasharray="3 3"
                      horizontal={false}
                      stroke="#f1f5f9"
                    />
                    <XAxis
                      type="number"
                      tick={TICK}
                      axisLine={false}
                      tickLine={false}
                      unit="m"
                    />
                    <YAxis
                      dataKey="type"
                      type="category"
                      tick={TICK}
                      axisLine={false}
                      tickLine={false}
                      width={80}
                    />
                    <Tooltip formatter={(v: any) => `${v} min`} />
                    <ReferenceLine
                      x={30}
                      stroke="#ef4444"
                      strokeDasharray="4 2"
                      strokeWidth={1}
                    />
                    <Bar
                      dataKey="avgTime"
                      name="Avg Time (min)"
                      fill="#f97316"
                      radius={[0, 4, 4, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-[200px] items-center justify-center text-[12px] text-gray-400">
                  No order type data
                </div>
              )}
            </div>
          </div>
        </div>

        {/* TABLE TURN + TOP ITEMS */}
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
          {/* Table Turn Rate */}
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-100 px-4 py-3">
              <h3 className="text-[15px] font-bold text-gray-900">
                Table Turn Rate
              </h3>
              <p className="mt-0.5 text-[11px] text-gray-500">
                Avg time each table is occupied per order
              </p>
            </div>
            {tableTurnData.length > 0 ? (
              <div className="divide-y divide-gray-50">
                {tableTurnData.slice(0, 8).map((t: any) => (
                  <div
                    key={t.name}
                    className="flex items-center justify-between px-4 py-2.5"
                  >
                    <div>
                      <p className="text-[13px] font-semibold text-gray-900">
                        {t.name}
                      </p>
                      <p className="text-[10px] text-gray-400">
                        {t.count} orders
                      </p>
                    </div>
                    <div className="text-right">
                      <p
                        className={`text-[14px] font-bold ${t.avgTime <= 30 ? "text-emerald-600" : t.avgTime <= 45 ? "text-orange-500" : "text-red-600"}`}
                      >
                        {t.avgTime}m
                      </p>
                      <p className="text-[9px] text-gray-400">
                        {t.avgTime <= 30
                          ? "Fast"
                          : t.avgTime <= 45
                            ? "Normal"
                            : "Slow"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex h-[160px] items-center justify-center text-[12px] text-gray-400">
                No table data — only dine-in orders tracked
              </div>
            )}
          </div>

          {/* Top Kitchen Items */}
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-100 px-4 py-3">
              <h3 className="text-[15px] font-bold text-gray-900">
                Top Items from Kitchen
              </h3>
              <p className="mt-0.5 text-[11px] text-gray-500">
                Most frequently prepared items — helps plan prep batches
              </p>
            </div>
            {topItems.length > 0 ? (
              <div className="divide-y divide-gray-50">
                {topItems.map((item: any, i: number) => {
                  const maxCount = topItems[0].count || 1;
                  return (
                    <div key={item.name} className="px-4 py-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-5 text-center text-[10px] font-bold text-gray-300">
                            #{i + 1}
                          </span>
                          <p className="truncate text-[12px] font-semibold text-gray-900">
                            {item.name}
                          </p>
                        </div>
                        <p className="ml-2 shrink-0 text-[13px] font-bold text-orange-600">
                          {item.count}
                        </p>
                      </div>
                      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-gray-100">
                        <div
                          className="h-full rounded-full bg-orange-400 transition-all"
                          style={{
                            width: `${Math.round((item.count / maxCount) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex h-[160px] items-center justify-center text-[12px] text-gray-400">
                No kitchen item data
              </div>
            )}
          </div>
        </div>

        {/* SLOWEST ORDERS */}
        <div className="overflow-hidden rounded-xl border border-orange-100 bg-white shadow-sm">
          <div className="border-b border-orange-100 bg-orange-50/40 px-4 py-3 flex items-center justify-between">
            <div>
              <h3 className="text-[15px] font-bold text-gray-900">
                Slowest Orders — Needs Attention
              </h3>
              <p className="mt-0.5 text-[11px] text-gray-500">
                Orders that exceeded 30 min SLA — investigate root cause
              </p>
            </div>
            {slowestOrders.filter((o: any) => o.durationMinutes > 30).length >
              0 && (
              <span className="rounded-full bg-orange-100 px-3 py-1 text-[11px] font-bold text-orange-700">
                {
                  slowestOrders.filter((o: any) => o.durationMinutes > 30)
                    .length
                }{" "}
                over SLA
              </span>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-[12px]">
              <thead className="bg-gray-50">
                <tr className="border-b border-gray-100">
                  {[
                    "Order ID",
                    "Type",
                    "Table",
                    "Duration",
                    "Started At",
                    "SLA",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wide text-gray-400"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {slowestOrders.length > 0 ? (
                  slowestOrders.map((o: any) => (
                    <tr
                      key={o.id}
                      className={`border-b border-gray-50 ${o.durationMinutes > 30 ? "bg-orange-50/20" : ""}`}
                    >
                      <td className="px-4 py-2.5 font-semibold text-gray-900">
                        #{o.id}
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-700">
                          {(o.orderType || "DINE_IN").replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-gray-500">
                        {o.tableName || "—"}
                      </td>
                      <td className="px-4 py-2.5">
                        <span
                          className={`font-bold ${o.durationMinutes > 45 ? "text-red-600" : o.durationMinutes > 30 ? "text-orange-500" : "text-emerald-600"}`}
                        >
                          {o.durationMinutes}m
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-gray-500">
                        {new Date(o.startedAt).toLocaleTimeString("en-IN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="px-4 py-2.5">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${o.durationMinutes <= 30 ? "bg-emerald-50 text-emerald-600" : "bg-[#b10000] text-red-600"}`}
                        >
                          {o.durationMinutes <= 30 ? "Met" : "Missed"}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={6}
                      className="py-12 text-center text-[12px] text-gray-400"
                    >
                      No completed orders with timing data in this period
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}
