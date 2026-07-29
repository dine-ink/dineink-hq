import { useEffect, useState } from "react";
import { useAppSelector } from "../../store";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  BuildingStorefrontIcon,
  MapPinIcon,
} from "@heroicons/react/24/outline";
import { chartPalette } from "../../design";

// The app's one shared qualitative chart palette (src/design/tokens/colors
// .ts) — previously its own slightly-different copy of this same red/blue/
// emerald/amber/violet/pink array, duplicated across this file, Report.tsx,
// and MenuManagement.tsx.
const COLORS = chartPalette;
const TICK = { fontSize: 10, fill: "#6b7280" };

const fmtINR = (v: number) => `₹${Number(v || 0).toLocaleString("en-IN")}`;

const TABS = [
  { id: "branch", label: "Branch vs Branch", icon: BuildingStorefrontIcon },
  { id: "city", label: "City vs City", icon: MapPinIcon },
] as const;

type TabId = "branch" | "city";

interface ComparisonRow {
  label: string;
  key: string;
  format?: (v: number) => string;
  higherIsBetter?: boolean;
}

const METRICS: ComparisonRow[] = [
  { label: "Revenue", key: "revenue", format: fmtINR, higherIsBetter: true },
  { label: "Orders", key: "orders", higherIsBetter: true },
  { label: "Avg Bill", key: "avgBill", format: fmtINR, higherIsBetter: true },
  {
    label: "Discount Given",
    key: "discount",
    format: fmtINR,
    higherIsBetter: false,
  },
  // GST is a pass-through tax collection, not a performance signal — no
  // higherIsBetter direction, so it never gets a misleading "winner" badge.
  { label: "GST Collected", key: "gst", format: fmtINR },
  { label: "Expenses", key: "expenses", format: fmtINR, higherIsBetter: false },
  {
    label: "Labour Cost",
    key: "labourCost",
    format: fmtINR,
    higherIsBetter: false,
  },
  {
    label: "Labour Cost %",
    key: "labourCostPercentage",
    format: (v: number) => `${v}%`,
    higherIsBetter: false,
  },
  {
    label: "EBITDA",
    key: "ebitda",
    format: fmtINR,
    higherIsBetter: true,
  },
  {
    label: "Net Profit",
    key: "netProfit",
    format: fmtINR,
    higherIsBetter: true,
  },
  { label: "Staff", key: "staffCount", higherIsBetter: true },
  {
    label: "Revenue per Employee",
    key: "revenuePerEmployee",
    format: fmtINR,
    higherIsBetter: true,
  },
  { label: "Customers", key: "totalCustomers", higherIsBetter: true },
  {
    label: "Repeat Customer Rate",
    key: "repeatCustomerRate",
    format: (v: number) => `${v}%`,
    higherIsBetter: true,
  },
];

function WinnerBadge({
  isWinner,
  isBest,
}: {
  isWinner: boolean;
  isBest?: boolean;
}) {
  if (!isWinner) return null;
  return (
    <span className="ml-1 inline-flex rounded-full bg-emerald-100 px-1.5 py-0.5 text-[8px] font-bold text-emerald-700">
      {isBest ? "BEST" : "↑"}
    </span>
  );
}

export default function BranchComparison() {
  const API_URL = import.meta.env.VITE_API_URL;
  const { from, to } = useAppSelector((s) => s.dateRange);
  const { user, token } = useAppSelector((s) => s.auth);
  const [activeTab, setActiveTab] = useState<TabId>("branch");
  const [loading, setLoading] = useState(false);
  const [branchData, setBranchData] = useState<any[]>([]);
  const [cityData, setCityData] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.restaurantId) return;
      setLoading(true);
      const h = { Authorization: `Bearer ${token}` };
      // Fetch branch and city data independently so one failing won't block the other
      await Promise.all([
        (async () => {
          try {
            const res = await fetch(
              `${API_URL}/api/analytics/${user.restaurantId}/branch-comparison?from=${from}&to=${to}`,
              { headers: h },
            );
            const data = await res.json();
            if (data.success) setBranchData(data.data || []);
          } catch {
            /* silent */
          }
        })(),
        (async () => {
          try {
            const res = await fetch(
              `${API_URL}/api/analytics/${user.restaurantId}/city-comparison?from=${from}&to=${to}`,
              { headers: h },
            );
            const data = await res.json();
            if (data.success) setCityData(data.data || []);
          } catch {
            /* silent */
          }
        })(),
      ]);
      setLoading(false);
    };
    fetchData();
  }, [from, to]);

  const data = activeTab === "branch" ? branchData : cityData;
  const nameKey =
    activeTab === "branch" ? (d: any) => d.branch?.name : (d: any) => d.city;

  // Revenue chart data
  const revenueChart = data.map((d, i) => ({
    name: nameKey(d),
    Revenue: d.revenue,
    Orders: d.orders,
    Expenses: d.expenses,
    color: COLORS[i % COLORS.length],
  }));

  // Winner for each metric — metrics with no higherIsBetter direction (e.g.
  // GST, a tax pass-through rather than a performance signal) never get a
  // winner highlighted.
  const getWinner = (metric: ComparisonRow) => {
    if (!data.length || metric.higherIsBetter === undefined) return null;
    return data.reduce((best, d) =>
      (
        metric.higherIsBetter !== false
          ? d[metric.key] > best[metric.key]
          : d[metric.key] < best[metric.key]
      )
        ? d
        : best,
    );
  };

  // Order type stacked chart
  const orderTypeKeys = [
    ...new Set(
      data.flatMap((d) => d.orderTypes?.map((o: any) => o.type) || []),
    ),
  ];
  const orderTypeChart = data.map((d) => {
    const row: any = { name: nameKey(d) };
    for (const key of orderTypeKeys) {
      const ot = d.orderTypes?.find((o: any) => o.type === key);
      row[key] = ot?.count || 0;
    }
    return row;
  });

  // Payment mix for each entity
  const topRevenue = data.length
    ? Math.max(...data.map((d) => d.revenue || 0))
    : 1;

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-red-500" />
          <p className="text-[12px] text-gray-500">
            Loading comparison data...
          </p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto flex flex-col gap-3">
        {/* ── HEADER ─────────────────────────────────────── */}
        <div className="relative overflow-hidden rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
          <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-red-100/40 blur-3xl" />
          <div className="relative z-10 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#b10000] shadow-sm">
                <BuildingStorefrontIcon className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-black tracking-tight text-gray-900">
                  Comparison Analytics
                </h1>
                <p className="mt-0.5 text-[12px] text-gray-500">
                  Compare performance across branches and cities
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {/* Tab toggle */}
              <div className="flex overflow-hidden rounded-xl border border-gray-200 bg-white">
                {TABS.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-1.5 px-4 py-2 text-[12px] font-semibold transition ${activeTab === tab.id ? "bg-[#b10000] text-white" : "text-gray-600 hover:bg-gray-50"}`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* ── NO DATA ────────────────────────────────────── */}
        {data.length === 0 && (
          <div className="flex min-h-[300px] items-center justify-center rounded-xl border border-dashed border-gray-200 bg-white">
            <div className="text-center">
              <p className="text-[15px] font-semibold text-gray-700">
                No comparison data available
              </p>
              <p className="mt-1 text-[12px] text-gray-400">
                {activeTab === "branch"
                  ? "Add multiple branches and place orders to see branch comparison"
                  : "Branches must have different cities set in Shops settings"}
              </p>
            </div>
          </div>
        )}

        {data.length > 0 && (
          <>
            {/* ── WINNER KPI CARDS ───────────────────────── */}
            <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
              {[
                {
                  label: "Highest Revenue",
                  key: "revenue",
                  fmt: fmtINR,
                  color: "emerald",
                },
                { label: "Most Orders", key: "orders", color: "blue" },
                {
                  label: "Best Avg Bill",
                  key: "avgBill",
                  fmt: fmtINR,
                  color: "orange",
                },
                {
                  label: "Most Profitable",
                  key: "netProfit",
                  fmt: fmtINR,
                  color: "violet",
                },
              ].map((k) => {
                const best = data.reduce(
                  (b, d) => (d[k.key] > b[k.key] ? d : b),
                  data[0],
                );
                const name =
                  activeTab === "branch" ? best?.branch?.name : best?.city;
                return (
                  <div
                    key={k.label}
                    className={`rounded-xl border p-4 ${
                      k.color === "emerald"
                        ? "border-emerald-100 bg-emerald-50/60"
                        : k.color === "blue"
                          ? "border-blue-100 bg-blue-50/60"
                          : k.color === "orange"
                            ? "border-orange-100 bg-orange-50/60"
                            : "border-violet-100 bg-violet-50/60"
                    }`}
                  >
                    <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500">
                      {k.label}
                    </p>
                    <p
                      className={`mt-1 truncate text-[14px] font-black ${
                        k.color === "emerald"
                          ? "text-emerald-700"
                          : k.color === "blue"
                            ? "text-blue-700"
                            : k.color === "orange"
                              ? "text-orange-700"
                              : "text-violet-700"
                      }`}
                    >
                      {name}
                    </p>
                    <p className="mt-1 text-[20px] font-black text-gray-900">
                      {k.fmt
                        ? k.fmt(best?.[k.key] || 0)
                        : (best?.[k.key] || 0).toLocaleString()}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* ── REVENUE + ORDERS CHART ─────────────────── */}
            <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
              <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="border-b border-gray-100 px-4 py-3">
                  <h3 className="text-[15px] font-bold text-gray-900">
                    Revenue Comparison
                  </h3>
                  <p className="mt-0.5 text-[11px] text-gray-500">
                    Side-by-side total revenue
                  </p>
                </div>
                <div className="p-3">
                  <ResponsiveContainer width="100%" height={230}>
                    <BarChart data={revenueChart} barCategoryGap="30%">
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="#f1f5f9"
                      />
                      <XAxis
                        dataKey="name"
                        tick={TICK}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={TICK}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                      />
                      <Tooltip formatter={(v: any) => fmtINR(Number(v))} />
                      <Bar dataKey="Revenue" radius={[6, 6, 0, 0]}>
                        {revenueChart.map((entry, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="border-b border-gray-100 px-4 py-3">
                  <h3 className="text-[15px] font-bold text-gray-900">
                    Revenue Share
                  </h3>
                  <p className="mt-0.5 text-[11px] text-gray-500">
                    Contribution % of total revenue
                  </p>
                </div>
                <div className="p-3">
                  <ResponsiveContainer width="100%" height={230}>
                    <PieChart>
                      <Pie
                        data={revenueChart.map((d, i) => ({
                          name: d.name,
                          value: d.Revenue,
                          fill: COLORS[i % COLORS.length],
                        }))}
                        cx="50%"
                        cy="45%"
                        innerRadius={50}
                        outerRadius={85}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {revenueChart.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v: any) => fmtINR(Number(v))} />
                      <Legend
                        verticalAlign="bottom"
                        height={24}
                        iconType="circle"
                        wrapperStyle={{ fontSize: "11px" }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* ── FULL METRIC COMPARISON TABLE ───────────── */}
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-100 px-4 py-3">
                <h3 className="text-[15px] font-bold text-gray-900">
                  Full Metric Comparison
                </h3>
                <p className="mt-0.5 text-[11px] text-gray-500">
                  Every KPI side by side ·{" "}
                  <span className="text-emerald-600 font-semibold">
                    Green = best performer
                  </span>
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-[12px]">
                  <thead className="bg-gray-50">
                    <tr className="border-b border-gray-100">
                      <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wide text-gray-400 w-40">
                        Metric
                      </th>
                      {data.map((d, i) => (
                        <th
                          key={i}
                          className="px-4 py-3 text-center text-[11px] font-bold text-gray-800"
                        >
                          <div className="flex items-center justify-center gap-1.5">
                            <div
                              className="h-3 w-3 rounded-full"
                              style={{ background: COLORS[i % COLORS.length] }}
                            />
                            {nameKey(d)}
                          </div>
                          {activeTab === "city" && d.branches?.length > 0 && (
                            <p className="mt-0.5 text-[9px] font-normal text-gray-400">
                              {d.branches.length} branch
                              {d.branches.length > 1 ? "es" : ""}
                            </p>
                          )}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {METRICS.map((metric) => {
                      const winner = getWinner(metric);
                      return (
                        <tr
                          key={metric.key}
                          className="border-b border-gray-50 hover:bg-gray-50/50"
                        >
                          <td className="px-4 py-3 text-[12px] font-semibold text-gray-700">
                            {metric.label}
                          </td>
                          {data.map((d, i) => {
                            const val = d[metric.key] || 0;
                            const isWinner =
                              winner &&
                              val === winner[metric.key] &&
                              data.length > 1;
                            return (
                              <td
                                key={i}
                                className={`px-4 py-3 text-center text-[12px] font-semibold ${isWinner ? "text-emerald-700" : "text-gray-900"}`}
                              >
                                <span
                                  className={
                                    isWinner
                                      ? "rounded-lg bg-emerald-50 px-2.5 py-1"
                                      : ""
                                  }
                                >
                                  {metric.format
                                    ? metric.format(val)
                                    : val.toLocaleString()}
                                  <WinnerBadge isWinner={!!isWinner} />
                                </span>
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ── ORDER TYPE MIX ─────────────────────────── */}
            <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
              <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="border-b border-gray-100 px-4 py-3">
                  <h3 className="text-[15px] font-bold text-gray-900">
                    Order Type Mix
                  </h3>
                  <p className="mt-0.5 text-[11px] text-gray-500">
                    Dine-in vs Takeaway vs Delivery per{" "}
                    {activeTab === "branch" ? "branch" : "city"}
                  </p>
                </div>
                <div className="p-3">
                  {orderTypeChart.length > 0 && orderTypeKeys.length > 0 ? (
                    <ResponsiveContainer width="100%" height={230}>
                      <BarChart data={orderTypeChart} barCategoryGap="30%">
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          stroke="#f1f5f9"
                        />
                        <XAxis
                          dataKey="name"
                          tick={TICK}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis tick={TICK} axisLine={false} tickLine={false} />
                        <Tooltip />
                        <Legend wrapperStyle={{ fontSize: "11px" }} />
                        {orderTypeKeys.map((key, i) => (
                          <Bar
                            key={key}
                            dataKey={key}
                            fill={COLORS[i % COLORS.length]}
                            radius={[3, 3, 0, 0]}
                            stackId="a"
                          />
                        ))}
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex h-[230px] items-center justify-center text-[12px] text-gray-400">
                      No order type data
                    </div>
                  )}
                </div>
              </div>

              {/* ── REVENUE BARS (visual) ───────────────── */}
              <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="border-b border-gray-100 px-4 py-3">
                  <h3 className="text-[15px] font-bold text-gray-900">
                    Revenue Performance
                  </h3>
                  <p className="mt-0.5 text-[11px] text-gray-500">
                    Revenue bar relative to top performer
                  </p>
                </div>
                <div className="p-4 space-y-4">
                  {data.map((d, i) => {
                    const name = nameKey(d);
                    const pct =
                      topRevenue > 0
                        ? Math.round((d.revenue / topRevenue) * 100)
                        : 0;
                    return (
                      <div key={i}>
                        <div className="mb-1.5 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div
                              className="h-3 w-3 rounded-full"
                              style={{ background: COLORS[i % COLORS.length] }}
                            />
                            <p className="text-[13px] font-semibold text-gray-900">
                              {name}
                            </p>
                            {activeTab === "city" && d.branches?.length > 0 && (
                              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[9px] font-medium text-gray-500">
                                {d.branches.length} branches
                              </span>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-[13px] font-bold text-gray-900">
                              {fmtINR(d.revenue)}
                            </p>
                            <p className="text-[10px] text-gray-400">
                              {d.orders} orders
                            </p>
                          </div>
                        </div>
                        <div className="h-2.5 overflow-hidden rounded-full bg-gray-100">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${pct}%`,
                              background: COLORS[i % COLORS.length],
                            }}
                          />
                        </div>
                        <p className="mt-1 text-[10px] text-gray-400">
                          {pct}% of top performer
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* ── TOP ITEMS PER BRANCH/CITY ──────────────── */}
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-100 px-4 py-3">
                <h3 className="text-[15px] font-bold text-gray-900">
                  Top Selling Items
                </h3>
                <p className="mt-0.5 text-[11px] text-gray-500">
                  Best performing menu items per{" "}
                  {activeTab === "branch" ? "branch" : "city"}
                </p>
              </div>
              <div
                className={`grid grid-cols-1 gap-0 divide-y divide-gray-50 ${data.length > 2 ? "xl:grid-cols-3 xl:divide-x xl:divide-y-0" : data.length === 2 ? "xl:grid-cols-2 xl:divide-x xl:divide-y-0" : ""}`}
              >
                {data.map((d, i) => (
                  <div key={i} className="p-4">
                    <div className="mb-3 flex items-center gap-2">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ background: COLORS[i % COLORS.length] }}
                      />
                      <p className="text-[13px] font-bold text-gray-900">
                        {nameKey(d)}
                      </p>
                    </div>
                    <div className="space-y-2">
                      {d.topItems?.length > 0 ? (
                        d.topItems.map((item: any, j: number) => (
                          <div
                            key={j}
                            className="flex items-center justify-between"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-[10px] font-bold text-gray-300">
                                #{j + 1}
                              </span>
                              <p className="truncate text-[12px] font-semibold text-gray-900">
                                {item.name}
                              </p>
                            </div>
                            <div className="ml-2 shrink-0 text-right">
                              <p className="text-[12px] font-bold text-gray-900">
                                {item.quantity} sold
                              </p>
                              <p className="text-[10px] text-gray-400">
                                {fmtINR(item.revenue)}
                              </p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-[12px] text-gray-400">
                          No orders in this period
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── PAYMENT METHOD PER BRANCH/CITY ─────────── */}
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-100 px-4 py-3">
                <h3 className="text-[15px] font-bold text-gray-900">
                  Payment Method Preferences
                </h3>
                <p className="mt-0.5 text-[11px] text-gray-500">
                  How customers pay at each{" "}
                  {activeTab === "branch" ? "branch" : "city"}
                </p>
              </div>
              <div
                className={`grid grid-cols-1 divide-y divide-gray-50 ${data.length > 2 ? "xl:grid-cols-3 xl:divide-x xl:divide-y-0" : data.length === 2 ? "xl:grid-cols-2 xl:divide-x xl:divide-y-0" : ""}`}
              >
                {data.map((d, i) => {
                  const total =
                    d.payments?.reduce((s: number, p: any) => s + p.count, 0) ||
                    1;
                  return (
                    <div key={i} className="p-4">
                      <div className="mb-3 flex items-center gap-2">
                        <div
                          className="h-3 w-3 rounded-full"
                          style={{ background: COLORS[i % COLORS.length] }}
                        />
                        <p className="text-[13px] font-bold text-gray-900">
                          {nameKey(d)}
                        </p>
                      </div>
                      <div className="space-y-2">
                        {d.payments?.length > 0 ? (
                          d.payments
                            .sort((a: any, b: any) => b.count - a.count)
                            .map((p: any, j: number) => {
                              const pct = Math.round((p.count / total) * 100);
                              return (
                                <div key={j}>
                                  <div className="flex items-center justify-between">
                                    <p className="text-[12px] font-semibold text-gray-900">
                                      {p.method}
                                    </p>
                                    <p className="text-[11px] font-bold text-gray-700">
                                      {pct}%
                                    </p>
                                  </div>
                                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-gray-100">
                                    <div
                                      className="h-full rounded-full bg-[#b10000] transition-all"
                                      style={{
                                        width: `${pct}%`,
                                        background: COLORS[i % COLORS.length],
                                      }}
                                    />
                                  </div>
                                </div>
                              );
                            })
                        ) : (
                          <p className="text-[12px] text-gray-400">
                            No payment data
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
