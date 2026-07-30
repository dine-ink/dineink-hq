import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import RestaurantSetupModal from "../../components/dashboard/RestaurantSetupModal";
import StatsStrip from "@/components/StatsStrip";
import CommonTable from "@/components/common/CommonTable";
import { useAppSelector } from "../../store";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const TICK = { fontSize: 10, fill: "#6b7280" };
const CHART_CARD =
  "overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm";

export default function Dashboard() {
  const API_URL = import.meta.env.VITE_API_URL;
  const navigate = useNavigate();

  // Global state from Redux
  const { from, to, preset } = useAppSelector((s) => s.dateRange);
  const { selectedBranch } = useAppSelector((s) => s.branch);
  const { user, token } = useAppSelector((s) => s.auth);

  const [showSetupModal, setShowSetupModal] = useState(false);
  const [hasRestaurant, setHasRestaurant] = useState<boolean | null>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [_insightsData, setInsightsData] = useState<any>(null);
  const [_staffData, setStaffData] = useState<any[]>([]);
  const [_restockHistory, setRestockHistory] = useState<any[]>([]);
  const [_inventoryStockValue, setInventoryStockValue] = useState(0);
  const [reorderAlerts, setReorderAlerts] = useState<any>(null);
  const [financeSummary, setFinanceSummary] = useState<any>(null);
  const [ratioReport, setRatioReport] = useState<any>(null);

  const isSingleDay = from === to;

  const hourlyChartData = (() => {
    const hourly = analytics?.hourlyAnalytics;
    if (!hourly) return [];
    return Array.from({ length: 24 }, (_, h) => ({
      label:
        h === 0
          ? "12 AM"
          : h < 12
            ? `${h} AM`
            : h === 12
              ? "12 PM"
              : `${h - 12} PM`,
      revenue: hourly[String(h)]?.revenue || 0,
      orders: hourly[String(h)]?.orders || 0,
    }));
  })();

  const chartData = (() => {
    if (!from || !to) return [];
    const data = [];
    let d = dayjs(from);
    const end = dayjs(to);
    while (d.isBefore(end) || d.isSame(end, "day")) {
      const fmt = d.format("YYYY-MM-DD");
      data.push({
        date: fmt,
        revenue: analytics?.revenueByDate?.[fmt] || 0,
        orders: analytics?.ordersByDate?.[fmt] || 0,
      });
      d = d.add(1, "day");
    }
    return data;
  })();

  const hasRevenueData = isSingleDay
    ? hourlyChartData.some((h) => h.revenue > 0)
    : chartData.some((d) => d.revenue > 0);
  const hasOrderData = isSingleDay
    ? hourlyChartData.some((h) => h.orders > 0)
    : chartData.some((d) => d.orders > 0);

  // Sourced from the backend's already-computed, full-period revenueByOrderType
  // map (not analytics.recentOrders, which the backend caps to the 10 most
  // recent bills — a chart derived from that truncated list would silently
  // stop matching the Revenue KPI card above it once a period has more than
  // 10 orders).
  const onlineRevenue = analytics?.revenueByOrderType?.ONLINE || 0;
  const dineInRevenue = analytics?.revenueByOrderType?.DINE_IN || 0;
  const totalRevenue = onlineRevenue + dineInRevenue;
  const onlinePercent = totalRevenue
    ? Math.round((onlineRevenue / totalRevenue) * 100)
    : 0;
  const dineInPercent = totalRevenue
    ? Math.round((dineInRevenue / totalRevenue) * 100)
    : 0;

  useEffect(() => {
    const ctrl = new AbortController();
    const { signal } = ctrl;

    const fetchDashboard = async () => {
      try {
        const res = await fetch(`${API_URL}/api/restaurant/my-restaurant`, {
          signal,
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success) {
          if (data.data?.restaurant?.branches?.length) {
            setHasRestaurant(true);
            setShowSetupModal(false);
          } else {
            setHasRestaurant(false);
            setShowSetupModal(true);
          }
        }
      } catch (e) {
        if (e instanceof DOMException) return;
        setHasRestaurant(false);
      }
    };

    const fetchAnalytics = async () => {
      try {
        if (!selectedBranch?.id || !user?.restaurantId) return;
        const res = await fetch(
          `${API_URL}/api/analytics/${user.restaurantId}/restaurantDashboardOverview?branchId=${selectedBranch.id}&range=${preset}&from=${from}&to=${to}`,
          { signal, headers: { Authorization: `Bearer ${token}` } },
        );
        const data = await res.json();
        if (data.success) setAnalytics(data.data);
      } catch (e) {
        if (e instanceof DOMException) return;
      }
    };

    const fetchInsights = async () => {
      try {
        if (!selectedBranch?.id || !user?.restaurantId) return;
        const res = await fetch(
          `${API_URL}/api/analytics/insights/${user.restaurantId}/${selectedBranch.id}`,
          { signal, headers: { Authorization: `Bearer ${token}` } },
        );
        const data = await res.json();
        if (data.success && data.data) {
          const normalized = Object.fromEntries(
            Object.entries(data.data).map(([k, v]) => [k, v == null ? 0 : v]),
          );
          setInsightsData(normalized);
        }
      } catch (e) {
        if (e instanceof DOMException) return;
      }
    };

    const fetchStaff = async () => {
      try {
        if (!selectedBranch?.id || !user?.restaurantId) return;
        const res = await fetch(
          `${API_URL}/api/restaurant/staff/${user.restaurantId}/${selectedBranch.id}`,
          { signal, headers: { Authorization: `Bearer ${token}` } },
        );
        const data = await res.json();
        if (data.success) setStaffData(data.data || []);
      } catch (e) {
        if (e instanceof DOMException) return;
      }
    };

    const fetchRestockHistory = async () => {
      try {
        if (!user?.restaurantId) return;
        const res = await fetch(
          `${API_URL}/api/inventory/${user.restaurantId}/get-restock-history`,
          { signal, headers: { Authorization: `Bearer ${token}` } },
        );
        const data = await res.json();
        if (data.success) {
          const now = new Date();
          const currentMonth = now.getMonth() + 1;
          const currentYear = now.getFullYear();
          const monthData = (data.data || []).find(
            (item: any) =>
              item.month === currentMonth && item.year === currentYear,
          );
          if (monthData) {
            setRestockHistory(
              monthData.data.map((item: any) => ({
                MonthlyRMExpense: Number(
                  item["Monthly RM Expense"] ||
                    Number(item["Opening Stock Value"] || 0) +
                      Number(item["Total Purchase Amount"] || 0) -
                      Number(
                        item["Week5 Closing Value"] ||
                          item["Week4 Closing Value"] ||
                          item["Week3 Closing Value"] ||
                          item["Week2 Closing Value"] ||
                          item["Week1 Closing Value"] ||
                          0,
                      ),
                ),
              })),
            );
          }
        }
      } catch (e) {
        if (e instanceof DOMException) return;
      }
    };

    const fetchInventoryStock = async () => {
      try {
        if (!selectedBranch?.id || !user?.restaurantId) return;
        const res = await fetch(
          `${API_URL}/api/inventory/${user.restaurantId}/menu-management?branchId=${selectedBranch.id}`,
          { signal, headers: { Authorization: `Bearer ${token}` } },
        );
        const data = await res.json();
        if (data.success) {
          const total = (data.data?.ingredients || []).reduce(
            (sum: number, ing: any) =>
              sum + Number(ing.quantity || 0) * Number(ing.pricePerUnit || 0),
            0,
          );
          setInventoryStockValue(total);
        }
      } catch (e) {
        if (e instanceof DOMException) return;
      }
    };

    const fetchReorderAlerts = async () => {
      try {
        if (!user?.restaurantId) return;
        const res = await fetch(
          `${API_URL}/api/ingredients/${user.restaurantId}/reorder-alerts`,
          { signal, headers: { Authorization: `Bearer ${token}` } },
        );
        const data = await res.json();
        if (data.success) setReorderAlerts(data.data);
      } catch (e) {
        if (e instanceof DOMException) return;
      }
    };

    // The canonical EBITDA for whatever date range is currently selected —
    // same finance.formulas.ts engine used by Insights, Branch Comparison,
    // and the PDF/Excel exports. `period=custom` + explicit from/to always
    // wins over the period key (see resolveDateRange), so this tracks
    // whatever range the dashboard's date picker has selected.
    const fetchFinanceSummary = async () => {
      try {
        if (!selectedBranch?.id || !user?.restaurantId || !from || !to) return;
        const res = await fetch(
          `${API_URL}/api/finance/${user.restaurantId}/${selectedBranch.id}/summary?period=custom&from=${from}&to=${to}`,
          { signal, headers: { Authorization: `Bearer ${token}` } },
        );
        const data = await res.json();
        if (data.success) setFinanceSummary(data.data);
      } catch (e) {
        if (e instanceof DOMException) return;
      }
    };

    // The Ratio/Period Engine — Revenue and EBITDA cards use this for
    // previous-month comparison, target, achievement %, and trend. Always
    // month-scoped (not tied to the dashboard's own date-range picker) since
    // "vs last month" is a fixed, calendar-anchored comparison.
    const fetchRatioReport = async () => {
      try {
        if (!selectedBranch?.id || !user?.restaurantId) return;
        const res = await fetch(
          `${API_URL}/api/finance/${user.restaurantId}/${selectedBranch.id}/ratios`,
          { signal, headers: { Authorization: `Bearer ${token}` } },
        );
        const data = await res.json();
        if (data.success) setRatioReport(data.data);
      } catch (e) {
        if (e instanceof DOMException) return;
      }
    };

    fetchDashboard();
    fetchAnalytics();
    fetchInsights();
    fetchStaff();
    fetchRestockHistory();
    fetchInventoryStock();
    fetchReorderAlerts();
    fetchFinanceSummary();
    fetchRatioReport();
    return () => ctrl.abort();
  }, [preset, from, to, selectedBranch?.id, token, user?.restaurantId]);

  const dashboardEbitda: number | null =
    financeSummary?.current?.ebitda ?? null;
  // Same Finance Engine call as dashboardEbitda above — StatsStrip's Revenue
  // tile used to read analytics.totalRevenue (a separate, independent
  // Prisma aggregate in analytics.service.ts) even though the adjacent
  // EBITDA tile was already Finance-Engine-sourced. Routed through here so
  // both tiles trace to the same computation.
  const dashboardRevenue: number | null =
    financeSummary?.current?.revenue ?? null;
  console.log("dashboardRevenue", dashboardRevenue, financeSummary);

  if (hasRestaurant === null) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-red-500" />
          <p className="text-[12px] text-gray-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!hasRestaurant) {
    return (
      <>
        {showSetupModal && (
          <RestaurantSetupModal
            open={showSetupModal}
            setOpen={setShowSetupModal}
          />
        )}
        <div className="relative overflow-hidden rounded-2xl border border-white/40 bg-gradient-to-br from-white to-red-50/60 shadow-sm">
          <div className="pointer-events-none absolute left-[-80px] top-[-80px] h-[220px] w-[220px] rounded-full bg-red-200/30 blur-3xl" />
          <div className="pointer-events-none absolute bottom-[-80px] right-[-60px] h-[220px] w-[220px] rounded-full bg-pink-200/30 blur-3xl" />
          <div className="relative z-10 w-full overflow-hidden rounded-2xl border border-white/60 bg-white/80 shadow-xl backdrop-blur-2xl">
            <div className="relative overflow-hidden bg-gradient-to-r from-red-500 to-rose-500 px-10 py-8">
              <div className="pointer-events-none absolute right-[-60px] top-[-60px] h-[180px] w-[180px] rounded-full bg-white/10 blur-3xl" />
              <div className="relative z-10 flex flex-col items-center text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/20 bg-white/15 shadow-lg backdrop-blur">
                  <svg
                    className="h-7 w-7 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.8}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 10h18M5 6h14a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2z"
                    />
                  </svg>
                </div>
                <h1 className="mt-4 text-3xl font-black tracking-tight text-white">
                  Welcome to DineInk
                </h1>
                <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-red-100">
                  Set up your restaurant to unlock billing, menu management,
                  staff operations and AI-powered analytics.
                </p>
                <button
                  onClick={() => setShowSetupModal(true)}
                  className="mt-5 rounded-2xl bg-white px-8 py-3 text-sm font-bold text-red-600 shadow-xl transition hover:scale-[1.02]"
                >
                  Setup Your Restaurant →
                </button>
                <p className="mt-2 text-[11px] text-red-200">
                  Takes less than 5 minutes
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 p-5 md:grid-cols-3">
              {[
                {
                  icon: "🏪",
                  title: "Multi Branch",
                  desc: "Manage multiple restaurant locations and seating from one dashboard.",
                },
                {
                  icon: "🧾",
                  title: "Smart Billing",
                  desc: "Fast billing with QR ordering, KOT, GST and payment integrations.",
                },
                {
                  icon: "📊",
                  title: "AI Insights",
                  desc: "Revenue forecasting, profitability analysis and business intelligence.",
                },
              ].map((f) => (
                <div
                  key={f.title}
                  className="rounded-2xl border border-gray-100 bg-gradient-to-br from-white to-red-50/40 p-5 transition hover:-translate-y-1 hover:shadow-md"
                >
                  <div className="mb-3 text-2xl">{f.icon}</div>
                  <h3 className="text-[15px] font-bold text-gray-900">
                    {f.title}
                  </h3>
                  <p className="mt-1.5 text-[12px] leading-5 text-gray-500">
                    {f.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100">
      <div className="mx-auto flex flex-col gap-3">
        {/* Header — filter lives in topbar now */}
        <div className="relative overflow-hidden rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
          <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-red-100/40 blur-3xl" />
          <div className="relative z-10 flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#b10000] shadow-sm">
              <span className="text-lg font-black text-white">D</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black tracking-tight text-gray-900">
                  Restaurant Dashboard
                </h1>
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-emerald-600">
                  Live
                </span>
              </div>
              <p className="mt-0.5 text-[12px] text-gray-500">
                {from} → {to}
              </p>
            </div>
          </div>
        </div>

        {reorderAlerts?.alertCount > 0 && (
          <div className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100">
                <svg
                  className="h-4 w-4 text-amber-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                  />
                </svg>
              </div>
              <div>
                <p className="text-[13px] font-bold text-amber-900">
                  {reorderAlerts.alertCount} ingredient
                  {reorderAlerts.alertCount > 1 ? "s" : ""} at or below reorder
                  level
                </p>
                <p className="mt-0.5 text-[11px] text-amber-700">
                  {reorderAlerts.alerts
                    .slice(0, 3)
                    .map((a: any) => a.name)
                    .join(", ")}
                  {reorderAlerts.alertCount > 3
                    ? ` +${reorderAlerts.alertCount - 3} more`
                    : ""}
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate("/dashboard/menu-management")}
              className="shrink-0 rounded-xl bg-amber-500 px-3.5 py-2 text-[11px] font-bold text-white transition hover:bg-amber-600"
            >
              Review Stock →
            </button>
          </div>
        )}

        <StatsStrip
          analytics={analytics}
          revenue={dashboardRevenue}
          ebitda={dashboardEbitda}
          ebitdaPct={financeSummary?.current?.ebitdaPercentage ?? null}
          ratios={ratioReport?.kpis}
          onDrillDown={() => navigate("/dashboard/financial-statements")}
        />

        <div className="grid grid-cols-1 gap-3 xl:grid-cols-12">
          <div className={`xl:col-span-7 ${CHART_CARD}`}>
            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
              <div>
                <h3 className="text-[15px] font-bold text-gray-900">
                  Revenue Trend
                </h3>
                <p className="mt-0.5 text-[11px] text-gray-500">
                  {isSingleDay
                    ? "Hourly revenue breakdown"
                    : "Daily revenue overview"}
                </p>
              </div>
              <span className="rounded-full bg-red-50 px-2.5 py-1 text-[10px] font-semibold text-[#b10000]">
                {isSingleDay ? "Hourly" : "Live"}
              </span>
            </div>
            <div className="p-3">
              {!hasRevenueData ? (
                <div className="flex h-[200px] items-center justify-center text-center">
                  <div>
                    <p className="text-[13px] font-semibold text-gray-600">
                      No revenue data yet
                    </p>
                    <p className="mt-1 text-[11px] text-gray-400">
                      Revenue will appear once orders are placed
                    </p>
                  </div>
                </div>
              ) : isSingleDay ? (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={hourlyChartData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#f1f5f9"
                    />
                    <XAxis
                      dataKey="label"
                      tick={{ ...TICK, fontSize: 9 }}
                      axisLine={false}
                      tickLine={false}
                      interval={2}
                    />
                    <YAxis tick={TICK} axisLine={false} tickLine={false} />
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
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="rg" x1="0" y1="0" x2="0" y2="1">
                        <stop
                          offset="5%"
                          stopColor="#ef4444"
                          stopOpacity={0.15}
                        />
                        <stop
                          offset="95%"
                          stopColor="#ef4444"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
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
                      interval={Math.max(1, Math.ceil(chartData.length / 7))}
                      tickFormatter={(v: string) => {
                        const [, mm, dd] = v.split("-");
                        return `${dd}/${mm}`;
                      }}
                    />
                    <YAxis tick={TICK} axisLine={false} tickLine={false} />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="#b10000"
                      strokeWidth={2}
                      fill="url(#rg)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className={`xl:col-span-3 ${CHART_CARD}`}>
            <div className="border-b border-gray-100 px-4 py-3">
              <h3 className="text-[15px] font-bold text-gray-900">Orders</h3>
              <p className="mt-0.5 text-[11px] text-gray-500">
                {isSingleDay ? "Orders by hour" : "Daily order count"}
              </p>
            </div>
            <div className="p-3">
              {!hasOrderData ? (
                <div className="flex h-[200px] items-center justify-center text-[12px] text-gray-400">
                  No orders yet
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={isSingleDay ? hourlyChartData : chartData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#f1f5f9"
                    />
                    <XAxis
                      dataKey={isSingleDay ? "label" : "date"}
                      tick={{ ...TICK, fontSize: 9 }}
                      axisLine={false}
                      tickLine={false}
                      interval={
                        isSingleDay
                          ? 2
                          : Math.max(1, Math.ceil(chartData.length / 6))
                      }
                      tickFormatter={
                        isSingleDay
                          ? undefined
                          : (v: string) => {
                              const [, mm, dd] = v.split("-");
                              return `${dd}/${mm}`;
                            }
                      }
                    />
                    <YAxis
                      tick={{ ...TICK, fontSize: 9 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip />
                    <Bar
                      dataKey="orders"
                      radius={[4, 4, 0, 0]}
                      fill="#b10000"
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className={`xl:col-span-2 ${CHART_CARD}`}>
            <div className="border-b border-gray-100 px-4 py-3">
              <h3 className="text-[15px] font-bold text-gray-900">
                Order Split
              </h3>
              <p className="mt-0.5 text-[11px] text-gray-500">
                Dine-in vs online
              </p>
            </div>
            <div className="p-3">
              {onlinePercent === 0 && dineInPercent === 0 ? (
                <div className="flex h-[200px] items-center justify-center text-[12px] text-gray-400">
                  No data
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Tooltip />
                    <Pie
                      data={[
                        { name: "Online", value: onlinePercent },
                        { name: "Dine In", value: dineInPercent },
                      ]}
                      cx="50%"
                      cy="45%"
                      innerRadius={34}
                      outerRadius={56}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      <Cell fill="#f43f5e" />
                      <Cell fill="#10b981" />
                    </Pie>
                    <Legend
                      verticalAlign="bottom"
                      height={20}
                      iconType="circle"
                      wrapperStyle={{ fontSize: "11px" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 xl:grid-cols-12">
          <div className={`xl:col-span-4 ${CHART_CARD} p-3`}>
            <div className="mb-3 flex items-start justify-between">
              <div>
                <div className="inline-flex rounded-full bg-gray-100 px-2 py-1 text-[9px] font-bold uppercase tracking-wide text-gray-600">
                  Live Orders
                </div>
                <h3 className="mt-1.5 text-[15px] font-bold text-gray-900">
                  Online Orders
                </h3>
                <p className="mt-0.5 text-[11px] text-gray-500">
                  Incoming delivery orders
                </p>
              </div>
              <div className="flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1">
                <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                <span className="text-[9px] font-bold text-emerald-700">
                  LIVE
                </span>
              </div>
            </div>
            <div className="space-y-2">
              {analytics?.recentOrders
                ?.filter((o: any) => o.orderType === "ONLINE")
                .slice(0, 4)
                .map((order: any) => (
                  <div
                    key={order.id}
                    className="rounded-xl border border-gray-100 bg-gray-50/60 p-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[12px] font-semibold text-gray-900">
                          {order.billNo}
                        </p>
                        <p className="text-[10px] text-gray-400">
                          {order.customer?.name || "Guest"}
                        </p>
                      </div>
                      <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[9px] font-semibold text-violet-600">
                        Online
                      </span>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <p className="text-[17px] font-black text-gray-900">
                        ₹{order.total}
                      </p>
                      <button className="rounded-lg bg-[#b10000] px-2.5 py-1 text-[10px] font-bold text-white transition hover:bg-[#b10000]">
                        Accept
                      </button>
                    </div>
                  </div>
                )) || (
                <div className="flex h-[120px] items-center justify-center text-[12px] text-gray-400">
                  No live orders
                </div>
              )}
            </div>
          </div>

          <div className={`xl:col-span-3 ${CHART_CARD} p-3`}>
            <div className="mb-3">
              <div className="inline-flex rounded-full bg-gray-100 px-2 py-1 text-[9px] font-bold uppercase tracking-wide text-gray-600">
                Trending
              </div>
              <h3 className="mt-1.5 text-[15px] font-bold text-gray-900">
                Top Selling Items
              </h3>
              <p className="mt-0.5 text-[11px] text-gray-500">
                Best performing menu items
              </p>
            </div>
            <div className="space-y-2">
              {(() => {
                const items = analytics?.topItems || [];
                const max = Math.max(...items.map((i: any) => i.quantity), 1);
                return items.length > 0 ? (
                  items.slice(0, 5).map((item: any) => (
                    <div
                      key={item.name}
                      className="rounded-xl border border-gray-100 bg-gray-50/60 p-2.5 transition hover:bg-gray-50"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-[12px] font-semibold text-gray-900">
                          {item.name}
                        </p>
                        <div className="flex h-7 min-w-[32px] items-center justify-center rounded-lg bg-[#b10000] px-2 text-[11px] font-bold text-white">
                          {item.quantity}
                        </div>
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-200">
                          <div
                            className="h-full rounded-full bg-[#b10000] transition-all"
                            style={{
                              width: `${Math.round((item.quantity / max) * 100)}%`,
                            }}
                          />
                        </div>
                        <p className="min-w-[28px] text-right text-[9px] font-semibold text-gray-400">
                          {Math.round((item.quantity / max) * 100)}%
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex h-[120px] items-center justify-center text-[12px] text-gray-400">
                    No item data yet
                  </div>
                );
              })()}
            </div>
          </div>

          <div className={`xl:col-span-3 ${CHART_CARD} p-3`}>
            <div className="mb-3">
              <div className="inline-flex rounded-full bg-[#b10000]/10 px-2 py-1 text-[9px] font-bold uppercase tracking-wide text-[#b10000]">
                Categories
              </div>
              <h3 className="mt-1.5 text-[15px] font-bold text-gray-900">
                Top Selling Categories
              </h3>
              <p className="mt-0.5 text-[11px] text-gray-500">
                Best performing menu categories
              </p>
            </div>
            <div className="space-y-2">
              {(() => {
                const cats = analytics?.topCategories || [];
                const max = Math.max(...cats.map((c: any) => c.quantity), 1);
                return cats.length > 0 ? (
                  cats.slice(0, 5).map((cat: any, i: number) => {
                    const colors = [
                      "bg-[#b10000]",
                      "bg-orange-500",
                      "bg-amber-500",
                      "bg-emerald-500",
                      "bg-blue-500",
                    ];
                    return (
                      <div
                        key={cat.name}
                        className="rounded-xl border border-gray-100 bg-gray-50/60 p-2.5 transition hover:bg-gray-50"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-[12px] font-semibold text-gray-900">
                            {cat.name}
                          </p>
                          <div
                            className={`flex h-7 min-w-[32px] items-center justify-center rounded-lg px-2 text-[11px] font-bold text-white ${colors[i] || "bg-gray-400"}`}
                          >
                            {cat.quantity}
                          </div>
                        </div>
                        <div className="mt-2 flex items-center gap-2">
                          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-200">
                            <div
                              className={`h-full rounded-full transition-all ${colors[i] || "bg-gray-400"}`}
                              style={{
                                width: `${Math.round((cat.quantity / max) * 100)}%`,
                              }}
                            />
                          </div>
                          <p className="min-w-[28px] text-right text-[9px] font-semibold text-gray-400">
                            {Math.round((cat.quantity / max) * 100)}%
                          </p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="flex h-[120px] items-center justify-center text-[12px] text-gray-400">
                    No category data yet
                  </div>
                );
              })()}
            </div>
          </div>
          <div className={`xl:col-span-2 ${CHART_CARD} p-3`}>
            <div className="mb-3">
              <div className="inline-flex rounded-full bg-gray-100 px-2 py-1 text-[9px] font-bold uppercase tracking-wide text-gray-600">
                Analytics
              </div>
              <h3 className="mt-1.5 text-[15px] font-bold text-gray-900">
                Payment Split
              </h3>
              <p className="mt-0.5 text-[11px] text-gray-500">
                Revenue by payment method
              </p>
            </div>
            <div className="space-y-2">
              {Object.entries(analytics?.paymentSplit || {}).length > 0 ? (
                Object.entries(analytics.paymentSplit).map(
                  ([key, value]: any) => {
                    const max = Math.max(
                      ...Object.values(analytics.paymentSplit).map(Number),
                      1,
                    );
                    return (
                      <div
                        key={key}
                        className="rounded-xl border border-gray-100 bg-gray-50/60 p-2.5"
                      >
                        <div className="flex items-center justify-between">
                          <p className="text-[12px] font-semibold text-gray-900">
                            {key}
                          </p>
                          <p className="text-[12px] font-bold text-gray-700">
                            ₹{Number(value).toLocaleString("en-IN")}
                          </p>
                        </div>
                        <div className="mt-2 h-1 overflow-hidden rounded-full bg-gray-200">
                          <div
                            className="h-full rounded-full bg-blue-500 transition-all"
                            style={{
                              width: `${Math.min((Number(value) / max) * 100, 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                    );
                  },
                )
              ) : (
                <div className="flex h-[120px] items-center justify-center text-[12px] text-gray-400">
                  No payment data
                </div>
              )}
            </div>
          </div>
        </div>

        <div className={CHART_CARD}>
          <CommonTable
            title="Recent Orders"
            subtitle="Latest customer billing activity"
            data={(analytics?.recentOrders || []).slice(0, 8)}
            page={1}
            totalPages={1}
            headerAction={
              <button className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-[11px] font-semibold text-gray-700 transition hover:bg-gray-100">
                View All
              </button>
            }
            columns={[
              {
                header: "Bill No",
                key: "billNo",
                render: (r) => (
                  <p className="text-[12px] font-bold text-gray-900">
                    {r.billNo}
                  </p>
                ),
              },
              {
                header: "Customer",
                key: "customer",
                render: (r) => (
                  <div>
                    <p className="text-[12px] font-semibold text-gray-900">
                      {r.customer?.name || "—"}
                    </p>
                    <p className="text-[10px] text-gray-400">
                      {r.customer?.phone || "—"}
                    </p>
                  </div>
                ),
              },
              {
                header: "Type",
                key: "orderType",
                render: (r) => (
                  <span
                    className={`rounded-full px-2 py-[3px] text-[10px] font-semibold ${r.orderType === "DINE_IN" ? "bg-gray-100 text-gray-700" : r.orderType === "TAKEAWAY" ? "bg-orange-50 text-orange-600" : "bg-violet-50 text-violet-600"}`}
                  >
                    {r.orderType}
                  </span>
                ),
              },
              {
                header: "Payment",
                key: "paymentMethod",
                render: (r) => (
                  <span className="rounded-full border border-gray-200 bg-white px-2 py-[3px] text-[10px] text-gray-600">
                    {r.paymentMethod}
                  </span>
                ),
              },
              {
                header: "Amount",
                key: "total",
                render: (r) => (
                  <span className="text-[13px] font-black text-gray-900">
                    ₹{Number(r.total || 0).toLocaleString("en-IN")}
                  </span>
                ),
              },
              {
                header: "Status",
                key: "status",
                render: (r) => (
                  <span
                    className={`rounded-full px-2 py-[3px] text-[10px] font-semibold ${r.status === "PAID" ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-700"}`}
                  >
                    {r.status}
                  </span>
                ),
              },
              {
                header: "Date",
                key: "createdAt",
                render: (r) => (
                  <p className="text-[11px] text-gray-400">
                    {new Date(r.createdAt).toLocaleDateString()}
                  </p>
                ),
              },
            ]}
          />
        </div>
      </div>
    </main>
  );
}
