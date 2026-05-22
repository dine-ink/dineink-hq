import { useEffect, useState } from "react";
import dayjs, { Dayjs } from "dayjs";
import { Stack, Typography } from "@mui/material";
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
  useEffect(() => {
    const handleBranchChange = () => {
      const savedBranch = localStorage.getItem("selectedBranch");

      if (savedBranch) {
        setSelectedBranch(JSON.parse(savedBranch));
      }
    };

    window.addEventListener("branchChanged", handleBranchChange);

    return () => {
      window.removeEventListener("branchChanged", handleBranchChange);
    };
  }, []);
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
    const fetchDashboard = async () => {
      try {
        const token = localStorage.getItem("token");

        const res = await fetch(`${API_URL}/api/restaurant/my-restaurant`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
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
        console.log(err);
      }
    };

    const fetchAnalytics = async () => {
      try {
        const token = localStorage.getItem("token");

        const user = JSON.parse(localStorage.getItem("user") || "{}");

        if (!selectedBranch?.id) {
          return;
        }

        const res = await fetch(
          `${API_URL}/api/analytics/${user.restaurantId}/restaurantDashboardOverview?branchId=${selectedBranch.id}&range=${preset}&from=${range[0]?.format(
            "YYYY-MM-DD",
          )}&to=${range[1]?.format("YYYY-MM-DD")}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        const data = await res.json();

        if (data.success) {
          setAnalytics(data.data);
        }
      } catch (err) {
        console.log(err);
      }
    };
    fetchDashboard();
    fetchAnalytics();
  }, [preset, range, selectedBranch?.id]);
  if (hasRestaurant === null) return null;

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
        <>
          {showSetupModal && (
            <RestaurantSetupModal
              open={showSetupModal}
              setOpen={setShowSetupModal}
            />
          )}

          {!hasRestaurant ? (
            <div className="mt-20 text-center">
              <h2 className="text-2xl font-bold">No restaurant added</h2>
              <button
                onClick={() => setShowSetupModal(true)}
                className="mt-6 rounded-xl bg-red-600 px-6 py-3 text-white"
              >
                Add Restaurant
              </button>
            </div>
          ) : (
            <main className="min-h-screen bg-gradient-to-br from-red-50 via-white to-rose-50 p-6">
              <div className="mx-auto max-w-[1700px] space-y-6">
                {/* ================= HEADER ================= */}
                <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                  {/* SOFT BG */}
                  <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-red-100/40 blur-3xl" />
                  <div className="relative z-10 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                    {/* LEFT */}
                    <div>
                      <div className="flex items-center gap-3">
                        {/* LOGO */}
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-rose-500 shadow-sm">
                          <span className="text-xl font-black text-white">
                            D
                          </span>
                        </div>
                        {/* TITLE */}
                        <div>
                          <h1 className="text-2xl font-black tracking-tight text-gray-900">
                            Restaurant Dashboard
                          </h1>
                          <p className="mt-0.5 text-sm text-gray-500">
                            Real-time business analytics & restaurant
                            intelligence
                          </p>
                        </div>
                      </div>
                    </div>
                    {/* RIGHT */}
                    <div className="flex flex-col items-start gap-3 xl:items-end">
                      {/* FILTERS */}
                      <div className="flex flex-wrap gap-2">
                        {["today", "week", "month", "quarter", "custom"].map(
                          (f) => (
                            <button
                              key={f}
                              onClick={() => {
                                setPreset(f);
                                if (f === "custom") {
                                  setCustomMode(true);
                                  return;
                                }
                                setCustomMode(false);
                                setRange(getRange(f));
                              }}
                              className={`rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-200 ${
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
                      <div className="flex flex-wrap gap-2">
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
                                  width: 170,
                                  "& .MuiOutlinedInput-root": {
                                    borderRadius: "12px",
                                    background: "white",
                                    fontSize: "14px",
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
                                  width: 170,
                                  "& .MuiOutlinedInput-root": {
                                    borderRadius: "12px",
                                    background: "white",
                                    fontSize: "14px",
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
                <BusinessStats analytics={analytics} />
                {/* ================= CHARTS ================= */}
                <div className="grid grid-cols-1 gap-5 xl:grid-cols-10">
                  {/* ================= REVENUE TREND ================= */}
                  <div className="xl:col-span-7 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                    {/* HEADER */}
                    <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
                      <div>
                        <h3 className="text-lg font-black tracking-tight text-gray-900">
                          Revenue Trend
                        </h3>
                        <p className="mt-1 text-sm text-gray-500">
                          Daily revenue performance overview
                        </p>
                      </div>
                      <div className="rounded-full bg-red-50 px-3 py-1 text-[11px] font-semibold text-red-600">
                        Live Analytics
                      </div>
                    </div>
                    {/* CHART */}
                    <div className="p-4">
                      {chartData.length <= 1 ? (
                        <div className="flex h-[280px] items-center justify-center">
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
                        <ResponsiveContainer width="100%" height={300}>
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
                                  stopOpacity={0.25}
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
                                fontSize: 11,
                                fill: "#6b7280",
                              }}
                              axisLine={false}
                              tickLine={false}
                            />
                            <YAxis
                              tick={{
                                fontSize: 11,
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
                              strokeWidth={2.5}
                              fill="url(#revenueGradient)"
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  </div>
                  {/* ================= ORDERS DISTRIBUTION ================= */}
                  <div className="xl:col-span-3 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                    {/* HEADER */}
                    <div className="border-b border-gray-100 px-5 py-4">
                      <h3 className="text-lg font-black tracking-tight text-gray-900">
                        Orders Distribution
                      </h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Orders trend overview
                      </p>
                    </div>
                    {/* CHART */}
                    <div className="p-4">
                      {chartData.length <= 1 ? (
                        <div className="flex h-[240px] items-center justify-center">
                          <div className="text-center">
                            <p className="text-sm font-semibold text-gray-700">
                              Not enough order data
                            </p>
                            <p className="mt-1 text-xs text-gray-500">
                              Order distribution will appear once orders are
                              available
                            </p>
                          </div>
                        </div>
                      ) : (
                        <ResponsiveContainer width="100%" height={240}>
                          <BarChart data={chartData}>
                            <CartesianGrid
                              strokeDasharray="3 3"
                              vertical={false}
                              stroke="#f1f5f9"
                            />
                            <XAxis
                              dataKey="date"
                              tick={{
                                fontSize: 11,
                                fill: "#6b7280",
                              }}
                              axisLine={false}
                              tickLine={false}
                            />
                            <YAxis
                              tick={{
                                fontSize: 11,
                                fill: "#6b7280",
                              }}
                              axisLine={false}
                              tickLine={false}
                            />
                            <Tooltip />
                            <Bar
                              dataKey="orders"
                              radius={[8, 8, 0, 0]}
                              fill="#f43f5e"
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  </div>
                </div>
                {/* ================= INSIGHTS ================= */}
                <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
                  {/* ================= TOP ITEMS ================= */}
                  <div className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
                    {/* Soft Glow */}
                    <div className="absolute -right-8 -top-8 h-20 w-20 rounded-full bg-red-100/60 blur-3xl" />
                    <div className="relative z-10">
                      {/* HEADER */}
                      <div className="mb-4 flex items-start justify-between">
                        <div>
                          <div className="inline-flex items-center rounded-full bg-red-50 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-red-600">
                            Trending
                          </div>
                          <h3 className="mt-2 text-lg font-black tracking-tight text-gray-900">
                            Top Selling Items
                          </h3>
                          <p className="mt-0.5 text-sm text-gray-500">
                            Best performing menu items
                          </p>
                        </div>
                      </div>
                      {/* ITEMS */}
                      <div className="space-y-2.5">
                        {analytics?.topItems?.slice(0, 5).map((item: any) => (
                          <div
                            key={item.name}
                            className="rounded-xl border border-gray-100 bg-gray-50/60 p-3 transition-all duration-200 hover:border-red-100 hover:bg-red-50/30"
                          >
                            {/* TOP */}
                            <div className="flex items-center justify-between gap-3">
                              {/* LEFT */}
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-semibold text-gray-900">
                                  {item.name}
                                </p>
                                <p className="mt-0.5 text-[11px] text-gray-500">
                                  Menu Item
                                </p>
                              </div>
                              {/* QTY */}
                              <div className="flex h-10 min-w-[40px] items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-rose-500 px-3 text-sm font-bold text-white shadow-sm">
                                {item.quantity}
                              </div>
                            </div>
                            {/* FOOTER */}
                            <div className="mt-3 flex items-center gap-3">
                              {/* PROGRESS */}
                              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-200">
                                <div
                                  className="h-full rounded-full bg-gradient-to-r from-red-500 to-rose-500 transition-all duration-500"
                                  style={{
                                    width: `${Math.min(
                                      item.quantity * 10,
                                      100,
                                    )}%`,
                                  }}
                                />
                              </div>
                              {/* % */}
                              <p className="min-w-[32px] text-right text-[11px] font-semibold text-gray-500">
                                {Math.min(item.quantity * 10, 100)}%
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  {/* ================= PAYMENT SPLIT ================= */}
                  <div className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
                    {/* Soft Glow */}
                    <div className="absolute -right-8 -top-8 h-20 w-20 rounded-full bg-blue-100/60 blur-3xl" />
                    <div className="relative z-10">
                      {/* HEADER */}
                      <div className="mb-4">
                        <div className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-blue-600">
                          Analytics
                        </div>
                        <h3 className="mt-2 text-lg font-black tracking-tight text-gray-900">
                          Payment Split
                        </h3>
                        <p className="mt-0.5 text-sm text-gray-500">
                          Revenue by payment mode
                        </p>
                      </div>
                      {/* PAYMENT LIST */}
                      <div className="space-y-2.5">
                        {Object.entries(analytics?.paymentSplit || {}).map(
                          ([key, value]: any) => (
                            <div
                              key={key}
                              className="rounded-xl border border-gray-100 bg-gray-50/60 p-3 transition-all duration-200 hover:border-blue-100 hover:bg-blue-50/30"
                            >
                              <div className="flex items-center justify-between gap-3">
                                {/* LEFT */}
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-sm font-semibold text-gray-900">
                                    {key}
                                  </p>
                                  <p className="mt-0.5 text-[11px] text-gray-500">
                                    Payment Method
                                  </p>
                                </div>
                                {/* VALUE */}
                                <div className="rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 px-3 py-2 text-sm font-bold text-white shadow-sm">
                                  ₹{Number(value).toLocaleString()}
                                </div>
                              </div>
                              {/* MINI BAR */}
                              <div className="mt-3">
                                <div className="h-1.5 overflow-hidden rounded-full bg-gray-200">
                                  <div
                                    className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-500"
                                    style={{
                                      width: `${Math.min((Number(value) / Math.max(...Object.values(analytics?.paymentSplit || {}).map(Number), 1)) * 100, 100)}%`,
                                    }}
                                  />
                                </div>
                              </div>
                            </div>
                          ),
                        )}
                      </div>
                    </div>
                  </div>
                  {/* ================= LIVE ORDERS ================= */}
                  <div className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
                    {/* Soft Glow */}
                    <div className="absolute -right-8 -top-8 h-20 w-20 rounded-full bg-green-100/60 blur-3xl" />
                    <div className="relative z-10">
                      {/* HEADER */}
                      <div className="mb-4 flex items-start justify-between gap-3">
                        <div>
                          <div className="inline-flex items-center gap-2 rounded-full bg-green-50 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-green-700">
                            Live Orders
                          </div>
                          <h3 className="mt-2 text-lg font-black tracking-tight text-gray-900">
                            Online Orders
                          </h3>
                          <p className="mt-0.5 text-sm text-gray-500">
                            Swiggy & Zomato incoming
                          </p>
                        </div>
                        {/* LIVE BADGE */}
                        <div className="flex items-center gap-1.5 rounded-full bg-green-50 px-2 py-1">
                          <div className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
                          <span className="text-[10px] font-bold text-green-700">
                            LIVE
                          </span>
                        </div>
                      </div>
                      {/* ORDERS */}
                      <div className="space-y-2.5">
                        {analytics?.recentOrders
                          ?.slice(0, 4)
                          .map((order: any, index: number) => (
                            <div
                              key={order.id}
                              className="rounded-xl border border-gray-100 bg-gray-50/60 p-3 transition-all duration-200 hover:border-green-100 hover:bg-green-50/20"
                            >
                              {/* TOP */}
                              <div className="flex items-start justify-between gap-3">
                                {/* LEFT */}
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-sm font-semibold text-gray-900">
                                    {order.billNo}
                                  </p>
                                  <p className="mt-0.5 text-[11px] text-gray-500">
                                    {order.customer?.name || "Guest"}
                                  </p>
                                </div>
                                {/* PLATFORM */}
                                <span
                                  className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                                    index % 2 === 0
                                      ? "bg-orange-100 text-orange-700"
                                      : "bg-red-100 text-red-700"
                                  }`}
                                >
                                  {index % 2 === 0 ? "Swiggy" : "Zomato"}
                                </span>
                              </div>
                              {/* BOTTOM */}
                              <div className="mt-3 flex items-center justify-between gap-3">
                                {/* AMOUNT */}
                                <p className="text-xl font-black tracking-tight text-red-600">
                                  ₹{order.total}
                                </p>
                                {/* BUTTON */}
                                <button className="rounded-lg bg-gradient-to-r from-red-500 to-rose-500 px-3 py-1.5 text-xs font-bold text-white shadow-sm transition-all duration-200 hover:scale-[1.02]">
                                  Accept
                                </button>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                </div>
                {/* ================= RECENT ORDERS ================= */}
                <div className="mt-5">
                  <CommonTable
                    title="Recent Orders"
                    subtitle="Latest customer billing activity"
                    data={analytics?.recentOrders || []}
                    page={1}
                    totalPages={1}
                    headerAction={
                      <button className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50">
                        View All
                      </button>
                    }
                    columns={[
                      {
                        header: "Bill No",
                        key: "billNo",
                        render: (row) => (
                          <div className="font-medium text-gray-900">
                            {row.billNo}
                          </div>
                        ),
                      },
                      {
                        header: "Customer",
                        key: "customer",
                        render: (row) => (
                          <div>
                            <p className="font-medium text-gray-900">
                              {row.customer?.name || "-"}
                            </p>
                            <p className="text-[11px] text-gray-500">
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
                            className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                              row.orderType === "DINE_IN"
                                ? "bg-blue-100 text-blue-700"
                                : row.orderType === "TAKEAWAY"
                                  ? "bg-orange-100 text-orange-700"
                                  : "bg-violet-100 text-violet-700"
                            }`}
                          >
                            {row.orderType}
                          </span>
                        ),
                      },
                      {
                        header: "Items",
                        key: "items",
                        render: (row) => (
                          <div className="flex flex-col gap-1">
                            {row.items?.length ? (
                              row.items.map((item: any) => (
                                <div
                                  key={item.id}
                                  className="text-[11px] text-gray-700"
                                >
                                  {item.itemName} × {item.quantity}
                                </div>
                              ))
                            ) : (
                              <span className="text-[11px] text-gray-400">
                                No items
                              </span>
                            )}
                          </div>
                        ),
                      },
                      {
                        header: "Payment",
                        key: "paymentMethod",
                        render: (row) => (
                          <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-medium text-gray-700">
                            {row.paymentMethod}
                          </span>
                        ),
                      },
                      {
                        header: "Amount",
                        key: "total",
                        render: (row) => (
                          <span className="font-semibold text-emerald-600">
                            ₹{Number(row.total || 0).toLocaleString()}
                          </span>
                        ),
                      },
                      {
                        header: "Status",
                        key: "status",
                        render: (row) => (
                          <span
                            className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                              row.status === "PAID"
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-red-100 text-red-700"
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
                          <div className="text-sm text-gray-500">
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
      )}
    </>
  );
}

/* ---------- SMALL COMPONENTS ---------- */

function Row({ label, value }: any) {
  return (
    <Stack
      direction="row"
      sx={{
        justifyContent: "space-between",
      }}
    >
      <Typography>{label}</Typography>
      <Typography sx={{ fontWeight: 600 }}>{value}</Typography>
    </Stack>
  );
}

function Order({ id, amount }: any) {
  return (
    <Stack
      direction="row"
      sx={{
        justifyContent: "space-between",
      }}
    >
      <Typography sx={{ fontWeight: 600 }}>Order #{id}</Typography>
      <Typography>{amount}</Typography>
    </Stack>
  );
}
