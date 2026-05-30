import { useCallback, useEffect, useState } from "react";
import { useBranchSync, getSelectedBranch } from "@/hooks/useBranchSync";
import dayjs, { Dayjs } from "dayjs";
import RestaurantSetupModal from "../../components/dashboard/RestaurantSetupModal";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import StatsStrip from "@/components/StatsStrip";
import BusinessStats from "@/components/common/BusinessStats";
import CommonTable from "@/components/common/CommonTable";
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
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

export default function Dashboard() {
  const API_URL = import.meta.env.VITE_API_URL;
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [hasRestaurant, setHasRestaurant] = useState<boolean | null>(null);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [preset, setPreset] = useState("today");
  const [customMode, setCustomMode] = useState(false);
  const branches = JSON.parse(localStorage.getItem("branches") || "[]");
  const onlineRevenue =
    analytics?.recentOrders
      ?.filter((o: any) => o.orderType === "ONLINE")
      .reduce((sum: number, order: any) => sum + order.total, 0) || 0;
  const dineInRevenue =
    analytics?.recentOrders
      ?.filter((o: any) => o.orderType === "DINE_IN")
      .reduce((sum: number, order: any) => sum + order.total, 0) || 0;
  const totalRevenue = onlineRevenue + dineInRevenue;
  const onlinePercent = totalRevenue
    ? Math.round((onlineRevenue / totalRevenue) * 100)
    : 0;
  const dineInPercent = totalRevenue
    ? Math.round((dineInRevenue / totalRevenue) * 100)
    : 0;
  const handleBranchChange = useCallback(() => {
    setSelectedBranch(getSelectedBranch());
  }, []);
  useBranchSync(handleBranchChange);
  const [selectedBranch, setSelectedBranch] = useState<any>(() => {
    const savedBranch = localStorage.getItem("selectedBranch");

    if (savedBranch) {
      return JSON.parse(savedBranch);
    }

    return branches[0] || null;
  });
  const [range, setRange] = useState<[Dayjs | null, Dayjs | null]>([
    dayjs().startOf("day"),
    dayjs().endOf("day"),
  ]);
  const buildChartData = () => {
    const data = [];
    const start = range[0]?.toDate();
    const end = range[1]?.toDate();
    if (!start || !end) {
      return [];
    }
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const formatted = `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
      data.push({
        date: formatted,
        revenue: analytics?.revenueByDate?.[formatted] || 0,
        orders: analytics?.ordersByDate?.[formatted] || 0,
      });
    }
    return data;
  };
  const chartData = buildChartData();
  const getRange = (type: string): [Dayjs | null, Dayjs | null] => {
    switch (type) {
      case "today":
        return [dayjs().startOf("day"), dayjs().endOf("day")];

      case "week":
        return [dayjs().subtract(6, "day"), dayjs().endOf("day")];

      case "month":
        return [dayjs().startOf("month"), dayjs().endOf("day")];

      case "quarter":
        return [dayjs().subtract(3, "month"), dayjs().endOf("day")];

      default:
        return [dayjs().startOf("day"), dayjs().endOf("day")];
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;

    const fetchDashboard = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_URL}/api/restaurant/my-restaurant`, {
          signal,
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success) {
          setDashboardData(data.data);
          if (data.data?.restaurant?.branches?.length) {
            setHasRestaurant(true);
            setShowSetupModal(false);
          } else {
            setHasRestaurant(false);
            setShowSetupModal(true);
          }
        }
      } catch (err) {
        if (err instanceof DOMException) return;
      }
    };

    const fetchAnalytics = async () => {
      try {
        const token = localStorage.getItem("token");
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        if (!selectedBranch?.id) return;
        const res = await fetch(
          `${API_URL}/api/analytics/${user.restaurantId}/restaurantDashboardOverview?branchId=${selectedBranch.id}&range=${preset}&from=${range[0]?.format("YYYY-MM-DD")}&to=${range[1]?.format("YYYY-MM-DD")}`,
          { signal, headers: { Authorization: `Bearer ${token}` } },
        );
        const data = await res.json();
        if (data.success) setAnalytics(data.data);
      } catch (err) {
        if (err instanceof DOMException) return;
      }
    };

    fetchDashboard();
    fetchAnalytics();
    return () => controller.abort();
  }, [preset, range, selectedBranch?.id]);
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

  return (
    <>
      {showSetupModal && (
        <RestaurantSetupModal
          open={showSetupModal}
          setOpen={setShowSetupModal}
        />
      )}
      {!hasRestaurant ? (
        <div className="relative flex min-h-[78vh] items-center justify-center overflow-hidden rounded-2xl border border-white/40 bg-gradient-to-br from-white to-red-50 px-6 py-16 shadow-[0_35px_120px_rgba(255,0,80,0.08)]">
          {/* BACKGROUND GLOW */}
          <div className="absolute left-[-120px] top-[-120px] h-[300px] w-[300px] rounded-full bg-red-200/40 blur-3xl"></div>
          <div className="absolute bottom-[-150px] right-[-100px] h-[320px] w-[320px] rounded-full bg-pink-200/40 blur-3xl"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,0,80,0.06),transparent_30%)]"></div>
          {/* CONTENT */}
          <div className="relative z-10 w-full max-w-5xl overflow-hidden rounded-2xl border border-white/60 bg-white/75 backdrop-blur-2xl shadow-[0_30px_90px_rgba(15,23,42,0.08)]">
            {/* TOP SECTION */}
            <div className="relative overflow-hidden border-b border-gray-100 px-10 py-14">
              {/* TOP BG */}
              <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-rose-500"></div>
              <div className="absolute right-[-80px] top-[-80px] h-[240px] w-[240px] rounded-full bg-white/10 blur-3xl"></div>
              <div className="absolute bottom-[-100px] left-[-100px] h-[240px] w-[240px] rounded-full bg-white/10 blur-3xl"></div>
              <div className="relative z-10 flex flex-col items-center text-center">
                {/* ICON */}
                <div className="flex h-28 w-28 items-center justify-center rounded-[32px] border border-white/20 bg-white/15 shadow-[0_20px_40px_rgba(0,0,0,0.15)] backdrop-blur-xl">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-14 w-14 text-white"
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
                {/* TITLE */}
                <h1 className="mt-8 text-5xl font-black tracking-tight text-white">
                  Welcome to DineInk
                </h1>
                <p className="mt-5 max-w-2xl text-base leading-8 text-red-100">
                  Setup your restaurant ecosystem including branches, billing,
                  staff, menu management and AI-powered analytics to start
                  operating smarter with DineInk.
                </p>
                {/* BUTTON */}
                <button
                  onClick={() => setShowSetupModal(true)}
                  className="mt-10 rounded-2xl bg-white px-8 py-4 text-sm font-bold text-red-600 shadow-[0_15px_40px_rgba(0,0,0,0.18)] transition-all duration-300 hover:scale-[1.03]"
                >
                  Setup Your Restaurant
                </button>

                <p className="mt-4 text-sm text-red-100">
                  Takes less than 5 minutes
                </p>
              </div>
            </div>
            {/* FEATURES */}
            <div className="grid grid-cols-1 gap-6 p-10 md:grid-cols-3">
              {/* CARD 1 */}
              <div className="group rounded-[28px] border border-gray-100 bg-gradient-to-br from-white to-red-50 p-7 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-7 w-7 text-red-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.8}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M8 7V3m8 4V3m-9 8h10m-11 9h12a2 2 0 002-2V7a2 2 0 00-2-2H6a2 2 0 00-2 2v11a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <h3 className="mt-6 text-xl font-bold text-gray-900">
                  Multi Branch
                </h3>
                <p className="mt-3 text-sm leading-7 text-gray-500">
                  Manage multiple restaurant branches, seating and operations
                  from one dashboard.
                </p>
              </div>
              {/* CARD 2 */}
              <div className="group rounded-[28px] border border-gray-100 bg-gradient-to-br from-white to-pink-50 p-7 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-pink-100">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-7 w-7 text-pink-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.8}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M17 9V7a5 5 0 00-10 0v2m-2 0h14l1 11H4L5 9z"
                    />
                  </svg>
                </div>
                <h3 className="mt-6 text-xl font-bold text-gray-900">
                  Smart Billing & POS
                </h3>
                <p className="mt-3 text-sm leading-7 text-gray-500">
                  Complete restaurant billing system with QR ordering, KOT and
                  payment integrations.
                </p>
              </div>
              {/* CARD 3 */}
              <div className="group rounded-[28px] border border-gray-100 bg-gradient-to-br from-white to-rose-50 p-7 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-100">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-7 w-7 text-rose-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.8}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                </div>
                <h3 className="mt-6 text-xl font-bold text-gray-900">
                  AI Insights
                </h3>
                <p className="mt-3 text-sm leading-7 text-gray-500">
                  Revenue forecasting, profitability analysis and restaurant
                  intelligence powered by AI.
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
            <main className="min-h-screen bg-gradient-to-br from-red-50 via-white to-rose-50 py-1">
              <div className="mx-auto flex flex-col gap-3">
                {/* ================= HEADER ================= */}
                <div className="relative overflow-hidden rounded-md border border-gray-200 bg-white px-4 py-3 shadow-sm">
                  {/* SOFT GLOW */}
                  <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-red-100/40 blur-3xl" />

                  <div className="relative z-10 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                    {/* LEFT */}
                    <div className="flex items-center gap-3">
                      {/* LOGO */}
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-rose-500 shadow-sm">
                        <span className="text-lg font-black text-white">D</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h1 className="text-xl font-black tracking-tight text-gray-900">Restaurant Dashboard</h1>
                          <div className="rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-emerald-600">Live</div>
                        </div>
                        <p className="mt-0.5 text-[13px] text-gray-500">Real-time business analytics & restaurant intelligence</p>
                      </div>
                    </div>

                    {/* RIGHT TOOLBAR */}
                    <div className="flex flex-wrap items-center gap-2">
                      {/* FILTERS */}
                      <div className="flex flex-wrap items-center gap-1">
                        {["today", "week", "month", "quarter", "custom"].map(
                          (f) => (
                            <button
                              key={f}
                              onClick={() => {
                                setPreset(f);
                                if (f === "custom") { setCustomMode(true); return; }
                                setCustomMode(false);
                                setRange(getRange(f));
                              }}
                              className={`h-9 rounded-lg px-3 text-[11px] font-semibold transition-all duration-200 ${
                                preset === f
                                  ? "bg-gradient-to-r from-red-500 to-rose-500 text-white shadow-sm"
                                  : "border border-gray-200 bg-white text-gray-700 hover:border-red-200 hover:bg-red-50"
                              }`}
                            >
                              {f.charAt(0).toUpperCase() + f.slice(1)}
                            </button>
                          ),
                        )}
                      </div>

                      {/* DATE PICKERS */}
                      <div className="flex flex-wrap items-center gap-1">
                        <LocalizationProvider dateAdapter={AdapterDayjs}>
                          <DatePicker
                            label="From"
                            value={range[0]}
                            disabled={!customMode}
                            onChange={(value) => setRange([value, range[1]])}
                            slotProps={{
                              textField: {
                                size: "small",
                                sx: {
                                  width: 125,
                                  "& .MuiPickersInputBase-root": {
                                    fontSize: "0.7rem",
                                  },
                                  "& .MuiOutlinedInput-root": {
                                    borderRadius: "10px",
                                    background: "white",
                                    fontSize: "12px",
                                    height: "36px",
                                  },

                                  "& .MuiInputLabel-root": {
                                    fontSize: "12px",
                                    top: "-2px",
                                  },
                                },
                              },
                            }}
                          />

                          <DatePicker
                            label="To"
                            value={range[1]}
                            disabled={!customMode}
                            onChange={(value) => setRange([range[0], value])}
                            slotProps={{
                              textField: {
                                size: "small",
                                sx: {
                                  width: 125,
                                  "& .MuiPickersInputBase-root": {
                                    fontSize: "0.7rem",
                                  },
                                  "& .MuiOutlinedInput-root": {
                                    borderRadius: "10px",
                                    background: "white",
                                    fontSize: "12px",
                                    height: "36px",
                                  },

                                  "& .MuiInputLabel-root": {
                                    fontSize: "12px",
                                    top: "-2px",
                                  },
                                },
                              },
                            }}
                          />
                        </LocalizationProvider>
                      </div>
                    </div>
                  </div>
                </div>
                {/* ================= KPI ================= */}
                <StatsStrip analytics={analytics} />
                {/* ================= BUSINESS HEALTH ================= */}
                {/* <BusinessStats analytics={analytics} /> */}
                <div className="grid grid-cols-1 gap-3 xl:grid-cols-12">
                  {/* ================= REVENUE TREND ================= */}

                  <div className="xl:col-span-7 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
                    {/* HEADER */}

                    <div className="flex items-center justify-between border-b border-gray-100 px-3 py-2.5">
                      <div>
                        <h3 className="text-[15px] font-bold tracking-tight text-gray-900">
                          Revenue Trend
                        </h3>

                        <p className="mt-0.5 text-[12px] text-gray-500">
                          Daily revenue overview
                        </p>
                      </div>

                      <div className="rounded-full bg-red-50 px-2 py-1 text-[10px] font-semibold text-red-600">
                        Live
                      </div>
                    </div>

                    {/* CHART */}

                    <div className="p-2.5">
                      {chartData.length <= 1 ? (
                        <div className="flex h-[200px] items-center justify-center">
                          <div className="text-center">
                            <p className="text-sm font-semibold text-gray-700">
                              Not enough revenue data
                            </p>

                            <p className="mt-1 text-xs text-gray-500">
                              Revenue analytics will appear once orders are
                              available
                            </p>
                          </div>
                        </div>
                      ) : (
                        <ResponsiveContainer width="100%" height={200}>
                          <AreaChart data={chartData}>
                            <defs>
                              <linearGradient
                                id="revenueGradient"
                                x1="0"
                                y1="0"
                                x2="0"
                                y2="1"
                              >
                                <stop
                                  offset="5%"
                                  stopColor="#ef4444"
                                  stopOpacity={0.18}
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
                              tick={{
                                fontSize: 10,
                                fill: "#6b7280",
                              }}
                              axisLine={false}
                              tickLine={false}
                            />

                            <YAxis
                              tick={{
                                fontSize: 10,
                                fill: "#6b7280",
                              }}
                              axisLine={false}
                              tickLine={false}
                            />

                            <Tooltip />

                            <Area
                              type="monotone"
                              dataKey="revenue"
                              stroke="#ef4444"
                              strokeWidth={2}
                              fill="url(#revenueGradient)"
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  </div>

                  {/* ================= ORDERS ================= */}

                  <div className="xl:col-span-3 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
                    {/* HEADER */}

                    <div className="border-b border-gray-100 px-3 py-2.5">
                      <h3 className="text-[15px] font-bold tracking-tight text-gray-900">
                        Orders
                      </h3>

                      <p className="mt-0.5 text-[12px] text-gray-500">
                        Orders distribution
                      </p>
                    </div>

                    {/* CHART */}

                    <div className="p-2.5">
                      {chartData.length <= 1 ? (
                        <div className="flex h-[200px] items-center justify-center">
                          <div className="text-center">
                            <p className="text-sm font-semibold text-gray-700">
                              Not enough data
                            </p>
                          </div>
                        </div>
                      ) : (
                        <ResponsiveContainer width="100%" height={200}>
                          <BarChart data={chartData}>
                            <CartesianGrid
                              strokeDasharray="3 3"
                              vertical={false}
                              stroke="#f1f5f9"
                            />

                            <XAxis
                              dataKey="date"
                              tick={{
                                fontSize: 9,
                                fill: "#6b7280",
                              }}
                              axisLine={false}
                              tickLine={false}
                            />

                            <YAxis
                              tick={{
                                fontSize: 9,
                                fill: "#6b7280",
                              }}
                              axisLine={false}
                              tickLine={false}
                            />

                            <Tooltip />

                            <Bar
                              dataKey="orders"
                              radius={[4, 4, 0, 0]}
                              fill="#f43f5e"
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  </div>

                  {/* ================= ORDER SPLIT ================= */}

                  <div className="xl:col-span-2 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
                    {/* HEADER */}

                    <div className="border-b border-gray-100 px-3 py-2.5">
                      <h3 className="text-[15px] font-bold tracking-tight text-gray-900">
                        Order Split
                      </h3>

                      <p className="mt-0.5 text-[12px] text-gray-500">
                        Dine-in vs online orders
                      </p>
                    </div>

                    {/* CHART */}

                    <div className="p-2.5">
                      {onlinePercent === 0 && dineInPercent === 0 ? (
                        <div className="flex h-[200px] items-center justify-center">
                          <div className="text-center">
                            <p className="text-sm font-semibold text-gray-700">
                              No order data
                            </p>

                            <p className="mt-1 text-xs text-gray-500">
                              Split analytics will appear once orders are
                              available
                            </p>
                          </div>
                        </div>
                      ) : (
                        <ResponsiveContainer width="100%" height={200}>
                          <PieChart>
                            <Tooltip />

                            <Pie
                              data={[
                                {
                                  name: "Online",
                                  value: onlinePercent,
                                },

                                {
                                  name: "Dine In",
                                  value: dineInPercent,
                                },
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
                              wrapperStyle={{
                                fontSize: "11px",
                              }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  </div>
                </div>
                {/* ================= INSIGHTS ================= */}
                <div className="grid grid-cols-1 gap-3 xl:grid-cols-12">
                  {/* ================= LIVE ORDERS ================= */}
                  <div className="xl:col-span-4 rounded-xl border border-gray-200 bg-white p-2.5 shadow-sm">
                    {/* HEADER */}
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div>
                        <div className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1 text-[9px] font-bold uppercase tracking-[0.14em] text-gray-600">
                          Live Orders
                        </div>

                        <h3 className="mt-1.5 text-[15px] font-bold tracking-tight text-gray-900">
                          Online Orders
                        </h3>

                        <p className="mt-0.5 text-[11px] text-gray-500">
                          Swiggy & Zomato incoming
                        </p>
                      </div>

                      {/* LIVE BADGE */}
                      <div className="flex items-center gap-1 rounded-full bg-green-50 px-2 py-1">
                        <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-500" />

                        <span className="text-[9px] font-bold text-green-700">
                          LIVE
                        </span>
                      </div>
                    </div>

                    {/* ORDERS */}
                    <div className="space-y-1.5">
                      {analytics?.recentOrders
                        ?.slice(0, 4)
                        .map((order: any, index: number) => (
                          <div
                            key={order.id}
                            className="rounded-lg border border-gray-100 bg-gray-50/50 p-2"
                          >
                            {/* TOP */}
                            <div className="flex items-start justify-between gap-3">
                              {/* LEFT */}
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-[12px] font-semibold text-gray-900">
                                  {order.billNo}
                                </p>

                                <p className="mt-0.5 text-[10px] text-gray-500">
                                  {order.customer?.name || "Guest"}
                                </p>
                              </div>

                              {/* PLATFORM */}
                              <span
                                className={`rounded-full px-2 py-1 text-[9px] font-semibold ${
                                  index % 2 === 0
                                    ? "bg-orange-100 text-orange-700"
                                    : "bg-red-100 text-red-700"
                                }`}
                              >
                                {index % 2 === 0 ? "Swiggy" : "Zomato"}
                              </span>
                            </div>

                            {/* BOTTOM */}
                            <div className="mt-2 flex items-center justify-between gap-3">
                              {/* AMOUNT */}
                              <p className="text-[18px] font-black tracking-tight text-gray-900">
                                ₹{order.total}
                              </p>

                              {/* BUTTON */}
                              <button className="rounded-md bg-red-500 px-2.5 py-1 text-[10px] font-bold text-white transition-all duration-200 hover:bg-red-600">
                                Accept
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* ================= PAYMENT SPLIT ================= */}
                  <div className="xl:col-span-3 rounded-xl border border-gray-200 bg-white p-2.5 shadow-sm">
                    {/* HEADER */}
                    <div className="mb-3">
                      <div className="inline-flex items-center rounded-full bg-gray-100 px-2 py-1 text-[9px] font-bold uppercase tracking-[0.14em] text-gray-600">
                        Analytics
                      </div>

                      <h3 className="mt-1.5 text-[15px] font-bold tracking-tight text-gray-900">
                        Payment Split
                      </h3>

                      <p className="mt-0.5 text-[11px] text-gray-500">
                        Revenue by payment mode
                      </p>
                    </div>

                    {/* PAYMENT LIST */}
                    <div className="space-y-1.5">
                      {Object.entries(analytics?.paymentSplit || {}).map(
                        ([key, value]: any) => (
                          <div
                            key={key}
                            className="rounded-lg border border-gray-100 bg-gray-50/50 p-2"
                          >
                            <div className="flex items-center justify-between gap-3">
                              {/* LEFT */}
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-[12px] font-semibold text-gray-900">
                                  {key}
                                </p>

                                <p className="mt-0.5 text-[10px] text-gray-500">
                                  Payment Method
                                </p>
                              </div>

                              {/* VALUE */}
                              <div className="rounded-md border border-gray-200 bg-white px-2 py-1 text-[11px] font-semibold text-gray-700">
                                ₹{Number(value).toLocaleString()}
                              </div>
                            </div>

                            {/* MINI BAR */}
                            <div className="mt-2">
                              <div className="h-1 overflow-hidden rounded-full bg-gray-200">
                                <div
                                  className="h-full rounded-full bg-blue-500/80 transition-all duration-500"
                                  style={{
                                    width: `${Math.min(
                                      (Number(value) /
                                        Math.max(
                                          ...Object.values(
                                            analytics?.paymentSplit || {},
                                          ).map(Number),
                                          1,
                                        )) *
                                        100,
                                      100,
                                    )}%`,
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                  {/* ================= TOP ITEMS ================= */}
                  <div className="xl:col-span-5 rounded-xl border border-gray-200 bg-white p-2.5 shadow-sm">
                    {/* HEADER */}
                    <div className="mb-3 flex items-start justify-between">
                      <div>
                        <div className="inline-flex items-center rounded-full bg-gray-100 px-2 py-1 text-[9px] font-bold uppercase tracking-[0.14em] text-gray-600">
                          Trending
                        </div>

                        <h3 className="mt-1.5 text-[15px] font-bold tracking-tight text-gray-900">
                          Top Selling Items
                        </h3>

                        <p className="mt-0.5 text-[11px] text-gray-500">
                          Best performing menu items
                        </p>
                      </div>
                    </div>

                    {/* ITEMS */}
                    <div className="space-y-1.5">
                      {analytics?.topItems?.slice(0, 5).map((item: any) => (
                        <div
                          key={item.name}
                          className="rounded-lg border border-gray-100 bg-gray-50/50 p-2 transition-all duration-200 hover:border-gray-200 hover:bg-gray-50"
                        >
                          {/* TOP */}
                          <div className="flex items-center justify-between gap-3">
                            {/* LEFT */}
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-[12px] font-semibold text-gray-900">
                                {item.name}
                              </p>

                              <p className="mt-0.5 text-[10px] text-gray-500">
                                Menu Item
                              </p>
                            </div>

                            {/* QTY */}
                            <div className="flex h-7 min-w-[30px] items-center justify-center rounded-md bg-red-500 px-2 text-[11px] font-bold text-white">
                              {item.quantity}
                            </div>
                          </div>

                          {/* FOOTER */}
                          <div className="mt-2 flex items-center gap-2">
                            {/* PROGRESS */}
                            <div className="h-1 flex-1 overflow-hidden rounded-full bg-gray-200">
                              <div
                                className="h-full rounded-full bg-red-500/80 transition-all duration-500"
                                style={{
                                  width: `${Math.min(item.quantity * 10, 100)}%`,
                                }}
                              />
                            </div>

                            {/* % */}
                            <p className="min-w-[26px] text-right text-[9px] font-semibold text-gray-500">
                              {Math.min(item.quantity * 10, 100)}%
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                {/* ================= RECENT ORDERS ================= */}
                <div>
                  <CommonTable
                    title="Recent Orders"
                    subtitle="Latest customer billing activity"
                    data={(analytics?.recentOrders || []).slice(0, 5)}
                    page={1}
                    totalPages={1}
                    headerAction={
                      <button className="rounded-md border border-gray-200 bg-gray-50 px-3 py-1.5 text-[11px] font-semibold text-gray-700 transition hover:bg-gray-100">
                        View All
                      </button>
                    }
                    columns={[
                      {
                        header: "Bill No",
                        key: "billNo",
                        render: (row) => (
                          <div className="text-[12px] font-semibold text-gray-900">
                            {row.billNo}
                          </div>
                        ),
                      },

                      {
                        header: "Customer",
                        key: "customer",
                        render: (row) => (
                          <div>
                            <p className="text-[12px] font-semibold text-gray-900">
                              {row.customer?.name || "-"}
                            </p>

                            <p className="text-[10px] text-gray-500">
                              {row.customer?.phone || "-"}
                            </p>
                          </div>
                        ),
                      },

                      {
                        header: "Order Type",
                        key: "orderType",
                        render: (row) => (
                          <span
                            className={`rounded-full px-2 py-[3px] text-[10px] font-medium ${
                              row.orderType === "DINE_IN"
                                ? "bg-gray-100 text-gray-700"
                                : row.orderType === "TAKEAWAY"
                                  ? "bg-orange-50 text-orange-600"
                                  : "bg-violet-50 text-violet-600"
                            }`}
                          >
                            {row.orderType}
                          </span>
                        ),
                      },

                      {
                        header: "Payment",
                        key: "paymentMethod",
                        render: (row) => (
                          <span className="rounded-full border border-gray-200 bg-white px-2 py-[3px] text-[10px] font-medium text-gray-700">
                            {row.paymentMethod}
                          </span>
                        ),
                      },

                      {
                        header: "Amount",
                        key: "total",
                        render: (row) => (
                          <span className="text-[12px] font-bold text-gray-900">
                            ₹{Number(row.total || 0).toLocaleString()}
                          </span>
                        ),
                      },

                      {
                        header: "Status",
                        key: "status",
                        render: (row) => (
                          <span
                            className={`rounded-full px-2 py-[3px] text-[10px] font-medium ${
                              row.status === "PAID"
                                ? "bg-emerald-50 text-emerald-600"
                                : "bg-red-50 text-red-600"
                            }`}
                          >
                            {row.status}
                          </span>
                        ),
                      },

                      {
                        header: "Date",
                        key: "createdAt",
                        render: (row) => (
                          <div className="text-[11px] text-gray-500">
                            {new Date(row.createdAt).toLocaleDateString()}
                          </div>
                        ),
                      },
                    ]}
                  />
                </div>
              </div>
            </main>
      )}
    </>
  );
}
