import dayjs from "dayjs";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import MobileTableCards from "@/components/common/MobileTableCards";

/**
 * Table turn metrics — covers, turns and average occupancy per table, derived from running orders.
 *
 * Extracted from Report.tsx as part of breaking up a 4,254-line component.
 * Chosen by measurement: it referenced a single value from the
 * parent scope, now its prop. The characterisation suite in
 * Report.characterisation.test.tsx is what verifies the move changed nothing.
 */

interface TableAnalyticsTabProps {
  runningOrders: any;
}

export default function TableAnalyticsTab({ runningOrders }: TableAnalyticsTabProps) {
  // Compute table turn metrics from running orders
  const tableMap: Record<
    string,
    {
      tableId: string;
      tableName: string;
      orders: number;
      totalMins: number;
      revenue: number;
    }
  > = {};
  runningOrders.forEach((o: any) => {
    if (!o.tableId) return;
    const key = String(o.tableId);
    if (!tableMap[key])
      tableMap[key] = {
        tableId: key,
        tableName: o.table?.name || `Table ${key}`,
        orders: 0,
        totalMins: 0,
        revenue: 0,
      };
    tableMap[key].orders++;
    if (o.startedAt && o.completedAt) {
      const mins = dayjs(o.completedAt).diff(
        dayjs(o.startedAt),
        "minute",
      );
      if (mins > 0 && mins < 300) tableMap[key].totalMins += mins;
    }
    tableMap[key].revenue += Number(
      o.finalAmount || o.totalAmount || 0,
    );
  });

  const tableData = Object.values(tableMap)
    .map((t) => ({
      ...t,
      avgTurnMins:
        t.orders > 0 ? Math.round(t.totalMins / t.orders) : 0,
      avgRevenue: t.orders > 0 ? Math.round(t.revenue / t.orders) : 0,
    }))
    .sort((a, b) => b.revenue - a.revenue);

  const quickServiceOrders = runningOrders.filter(
    (o: any) => !o.tableId,
  ).length;
  const avgTurnTime =
    tableData.length > 0
      ? Math.round(
          tableData.reduce((s, t) => s + t.avgTurnMins, 0) /
            tableData.length,
        )
      : 0;
  const totalTableRevenue = tableData.reduce(
    (s, t) => s + t.revenue,
    0,
  );

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {[
          {
            label: "Tables Active",
            value: tableData.length,
            sub: "tables with orders",
            cls: "border-blue-100 bg-blue-50/60",
            val: "text-blue-700",
          },
          {
            label: "Avg Turn Time",
            value: `${avgTurnTime}m`,
            sub: "per table per order",
            cls: "border-orange-100 bg-orange-50/60",
            val: "text-orange-700",
          },
          {
            label: "Table Revenue",
            value: `₹${totalTableRevenue.toLocaleString("en-IN")}`,
            sub: "dine-in channel",
            cls: "border-emerald-100 bg-emerald-50/60",
            val: "text-emerald-700",
          },
          {
            label: "Quick Orders",
            value: quickServiceOrders,
            sub: "no table assigned",
            cls: "border-violet-100 bg-violet-50/60",
            val: "text-violet-700",
          },
        ].map((k) => (
          <div
            key={k.label}
            className={`rounded-xl border p-4 ${k.cls}`}
          >
            <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500">
              {k.label}
            </p>
            <p className={`mt-2 text-[22px] font-bold ${k.val}`}>
              {k.value}
            </p>
            <p className="mt-1 text-[11px] text-gray-500">{k.sub}</p>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-4 py-3">
            <h3 className="text-[15px] font-bold text-gray-900">
              Revenue by Table
            </h3>
          </div>
          <div className="p-3">
            {tableData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={tableData.slice(0, 12)}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#f1f5f9"
                  />
                  <XAxis
                    dataKey="tableName"
                    tick={{ fontSize: 9, fill: "#6b7280" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 9, fill: "#6b7280" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    formatter={(v: any) =>
                      `₹${Number(v).toLocaleString("en-IN")}`
                    }
                  />
                  <Bar
                    dataKey="revenue"
                    name="Revenue"
                    fill="#ef4444"
                    radius={[3, 3, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[220px] items-center justify-center text-[12px] text-gray-400">
                No table order data available
              </div>
            )}
          </div>
        </div>
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-4 py-3">
            <h3 className="text-[15px] font-bold text-gray-900">
              Avg Turn Time by Table
            </h3>
            <p className="mt-0.5 text-[11px] text-gray-500">
              Minutes from order start to completion
            </p>
          </div>
          <div className="p-3">
            {tableData.filter((t) => t.avgTurnMins > 0).length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart
                  data={tableData
                    .filter((t) => t.avgTurnMins > 0)
                    .slice(0, 12)}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#f1f5f9"
                  />
                  <XAxis
                    dataKey="tableName"
                    tick={{ fontSize: 9, fill: "#6b7280" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 9, fill: "#6b7280" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip formatter={(v: any) => `${v} mins`} />
                  <Bar
                    dataKey="avgTurnMins"
                    name="Avg Turn (mins)"
                    fill="#3b82f6"
                    radius={[3, 3, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[220px] items-center justify-center text-[12px] text-gray-400">
                No turn time data (need order start/end timestamps)
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-4 py-3">
          <h3 className="text-[15px] font-bold text-gray-900">
            Table Performance Summary
          </h3>
        </div>
        <div className="overflow-x-auto">
          <MobileTableCards>
          <table className="min-w-full text-[12px]">
            <thead className="bg-gray-50">
              <tr className="border-b border-gray-100">
                {[
                  "Table",
                  "Orders",
                  "Avg Turn Time",
                  "Total Revenue",
                  "Avg Revenue/Order",
                  "Performance",
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
              {tableData.map((t: any) => {
                const perf =
                  t.revenue >
                  totalTableRevenue / Math.max(tableData.length, 1)
                    ? "High"
                    : "Low";
                return (
                  <tr
                    key={t.tableId}
                    className="border-b border-gray-50 hover:bg-gray-50/60"
                  >
                    <td className="px-4 py-2.5 font-semibold text-gray-900">
                      {t.tableName}
                    </td>
                    <td className="px-4 py-2.5 text-gray-700">
                      {t.orders}
                    </td>
                    <td className="px-4 py-2.5 text-gray-600">
                      {t.avgTurnMins > 0 ? `${t.avgTurnMins}m` : "—"}
                    </td>
                    <td className="px-4 py-2.5 font-bold text-gray-900">
                      ₹{t.revenue.toLocaleString("en-IN")}
                    </td>
                    <td className="px-4 py-2.5 text-gray-600">
                      ₹{t.avgRevenue.toLocaleString("en-IN")}
                    </td>
                    <td className="px-4 py-2.5">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${perf === "High" ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 text-gray-500"}`}
                      >
                        {perf}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {tableData.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="py-12 text-center text-[12px] text-gray-400"
                  >
                    No table orders found for this period
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          </MobileTableCards>
        </div>
      </div>
    </div>
  );
}
