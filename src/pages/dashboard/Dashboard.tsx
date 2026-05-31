import { useCallback, useEffect, useState } from "react";
import { useBranchSync, getSelectedBranch } from "@/hooks/useBranchSync";
import dayjs, { Dayjs } from "dayjs";
import RestaurantSetupModal from "../../components/dashboard/RestaurantSetupModal";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import StatsStrip from "@/components/StatsStrip";
import CommonTable from "@/components/common/CommonTable";
import {
  ResponsiveContainer, AreaChart, Area, CartesianGrid, XAxis, YAxis,
  Tooltip, BarChart, Bar, PieChart, Pie, Cell, Legend,
} from "recharts";

const TICK = { fontSize: 10, fill: "#6b7280" };
const CHART_CARD = "overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm";

export default function Dashboard() {
  const API_URL = import.meta.env.VITE_API_URL;
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [hasRestaurant, setHasRestaurant] = useState<boolean | null>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [preset, setPreset] = useState("today");
  const [customMode, setCustomMode] = useState(false);
  const [range, setRange] = useState<[Dayjs | null, Dayjs | null]>([
    dayjs().startOf("day"), dayjs().endOf("day"),
  ]);
  const branches = JSON.parse(localStorage.getItem("branches") || "[]");
  const [selectedBranch, setSelectedBranch] = useState<any>(() => {
    const s = localStorage.getItem("selectedBranch");
    return s ? JSON.parse(s) : branches[0] || null;
  });

  const onlineRevenue = analytics?.recentOrders?.filter((o: any) => o.orderType === "ONLINE").reduce((s: number, o: any) => s + o.total, 0) || 0;
  const dineInRevenue = analytics?.recentOrders?.filter((o: any) => o.orderType === "DINE_IN").reduce((s: number, o: any) => s + o.total, 0) || 0;
  const totalRevenue = onlineRevenue + dineInRevenue;
  const onlinePercent = totalRevenue ? Math.round((onlineRevenue / totalRevenue) * 100) : 0;
  const dineInPercent = totalRevenue ? Math.round((dineInRevenue / totalRevenue) * 100) : 0;

  const handleBranchChange = useCallback(() => { setSelectedBranch(getSelectedBranch()); }, []);
  useBranchSync(handleBranchChange);

  const getRange = (type: string): [Dayjs | null, Dayjs | null] => {
    switch (type) {
      case "week": return [dayjs().subtract(6, "day"), dayjs().endOf("day")];
      case "month": return [dayjs().startOf("month"), dayjs().endOf("day")];
      case "quarter": return [dayjs().subtract(3, "month"), dayjs().endOf("day")];
      default: return [dayjs().startOf("day"), dayjs().endOf("day")];
    }
  };

  const chartData = (() => {
    const start = range[0]?.toDate();
    const end = range[1]?.toDate();
    if (!start || !end) return [];
    const data = [];
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const fmt = `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
      data.push({ date: fmt, revenue: analytics?.revenueByDate?.[fmt] || 0, orders: analytics?.ordersByDate?.[fmt] || 0 });
    }
    return data;
  })();

  useEffect(() => {
    const ctrl = new AbortController();
    const { signal } = ctrl;

    const fetchDashboard = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_URL}/api/restaurant/my-restaurant`, { signal, headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        if (data.success) {
          if (data.data?.restaurant?.branches?.length) { setHasRestaurant(true); setShowSetupModal(false); }
          else { setHasRestaurant(false); setShowSetupModal(true); }
        }
      } catch (e) { if (e instanceof DOMException) return; }
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
      } catch (e) { if (e instanceof DOMException) return; }
    };

    fetchDashboard();
    fetchAnalytics();
    return () => ctrl.abort();
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

  // ── NO RESTAURANT ───────────────────────────────────────────────────────────
  if (!hasRestaurant) {
    return (
      <>
        {showSetupModal && <RestaurantSetupModal open={showSetupModal} setOpen={setShowSetupModal} />}
        <div className="relative flex min-h-[78vh] items-center justify-center overflow-hidden rounded-2xl border border-white/40 bg-gradient-to-br from-white to-red-50/60 px-6 py-16 shadow-sm">
          <div className="absolute left-[-120px] top-[-120px] h-[300px] w-[300px] rounded-full bg-red-200/30 blur-3xl" />
          <div className="absolute bottom-[-150px] right-[-100px] h-[320px] w-[320px] rounded-full bg-pink-200/30 blur-3xl" />
          <div className="relative z-10 w-full max-w-4xl overflow-hidden rounded-2xl border border-white/60 bg-white/80 shadow-xl backdrop-blur-2xl">
            <div className="relative overflow-hidden bg-gradient-to-r from-red-500 to-rose-500 px-10 py-14">
              <div className="absolute right-[-60px] top-[-60px] h-[200px] w-[200px] rounded-full bg-white/10 blur-3xl" />
              <div className="relative z-10 flex flex-col items-center text-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-3xl border border-white/20 bg-white/15 shadow-lg backdrop-blur">
                  <svg className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M5 6h14a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2z" />
                  </svg>
                </div>
                <h1 className="mt-6 text-4xl font-black tracking-tight text-white">Welcome to DineInk</h1>
                <p className="mx-auto mt-4 max-w-lg text-base leading-7 text-red-100">
                  Set up your restaurant to unlock billing, menu management, staff operations and AI-powered analytics.
                </p>
                <button onClick={() => setShowSetupModal(true)}
                  className="mt-8 rounded-2xl bg-white px-8 py-3.5 text-sm font-bold text-red-600 shadow-xl transition hover:scale-[1.02] hover:shadow-2xl">
                  Setup Your Restaurant →
                </button>
                <p className="mt-3 text-[12px] text-red-200">Takes less than 5 minutes</p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 p-8 md:grid-cols-3">
              {[
                { icon: "🏪", title: "Multi Branch", desc: "Manage multiple restaurant locations and seating from one dashboard." },
                { icon: "🧾", title: "Smart Billing", desc: "Fast billing with QR ordering, KOT, GST and payment integrations." },
                { icon: "📊", title: "AI Insights", desc: "Revenue forecasting, profitability analysis and business intelligence." },
              ].map(f => (
                <div key={f.title} className="rounded-2xl border border-gray-100 bg-gradient-to-br from-white to-red-50/40 p-6 transition hover:-translate-y-1 hover:shadow-md">
                  <div className="mb-4 text-3xl">{f.icon}</div>
                  <h3 className="text-[16px] font-bold text-gray-900">{f.title}</h3>
                  <p className="mt-2 text-[13px] leading-6 text-gray-500">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </>
    );
  }

  // ── FULL DASHBOARD ──────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-gray-100">
      <div className="mx-auto flex flex-col gap-3">

        {/* ── HEADER ─────────────────────────────────────────── */}
        <div className="relative overflow-hidden rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
          <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-red-100/40 blur-3xl" />
          <div className="relative z-10 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-rose-500 shadow-sm">
                <span className="text-lg font-black text-white">D</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-black tracking-tight text-gray-900">Restaurant Dashboard</h1>
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-emerald-600">Live</span>
                </div>
                <p className="mt-0.5 text-[12px] text-gray-500">Real-time analytics & restaurant intelligence</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex flex-wrap gap-1">
                {["today", "week", "month", "quarter", "custom"].map(f => (
                  <button key={f} onClick={() => {
                    setPreset(f);
                    if (f === "custom") { setCustomMode(true); return; }
                    setCustomMode(false);
                    setRange(getRange(f));
                  }}
                    className={`h-8 rounded-lg px-3 text-[11px] font-semibold transition-all ${
                      preset === f ? "bg-gradient-to-r from-red-500 to-rose-500 text-white shadow-sm" : "border border-gray-200 bg-white text-gray-700 hover:border-red-200 hover:bg-red-50"
                    }`}
                  >
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>
              {customMode && (
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <div className="flex gap-1">
                    {[
                      { label: "From", val: range[0], onChange: (v: any) => setRange([v, range[1]]) },
                      { label: "To", val: range[1], onChange: (v: any) => setRange([range[0], v]) },
                    ].map(dp => (
                      <DatePicker key={dp.label} label={dp.label} value={dp.val} onChange={dp.onChange}
                        slotProps={{ textField: { size: "small", sx: {
                          width: 115,
                          "& .MuiOutlinedInput-root": { borderRadius: "10px", background: "white", fontSize: "12px", height: "32px" },
                          "& .MuiInputLabel-root": { fontSize: "12px", top: "-4px" },
                        }}}}
                      />
                    ))}
                  </div>
                </LocalizationProvider>
              )}
            </div>
          </div>
        </div>

        {/* ── KPI STRIP ──────────────────────────────────────── */}
        <StatsStrip analytics={analytics} />

        {/* ── CHARTS ─────────────────────────────────────────── */}
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-12">
          {/* Revenue Trend */}
          <div className={`xl:col-span-7 ${CHART_CARD}`}>
            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
              <div>
                <h3 className="text-[15px] font-bold text-gray-900">Revenue Trend</h3>
                <p className="mt-0.5 text-[11px] text-gray-500">Daily revenue overview for selected period</p>
              </div>
              <span className="rounded-full bg-red-50 px-2.5 py-1 text-[10px] font-semibold text-red-600">Live</span>
            </div>
            <div className="p-3">
              {chartData.length <= 1 ? (
                <div className="flex h-[200px] items-center justify-center">
                  <div className="text-center">
                    <p className="text-[13px] font-semibold text-gray-600">Not enough data</p>
                    <p className="mt-1 text-[11px] text-gray-400">Revenue will appear once orders are placed</p>
                  </div>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="rg" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="date" tick={TICK} axisLine={false} tickLine={false} />
                    <YAxis tick={TICK} axisLine={false} tickLine={false} />
                    <Tooltip />
                    <Area type="monotone" dataKey="revenue" stroke="#ef4444" strokeWidth={2} fill="url(#rg)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Orders Bar */}
          <div className={`xl:col-span-3 ${CHART_CARD}`}>
            <div className="border-b border-gray-100 px-4 py-3">
              <h3 className="text-[15px] font-bold text-gray-900">Orders</h3>
              <p className="mt-0.5 text-[11px] text-gray-500">Daily order count</p>
            </div>
            <div className="p-3">
              {chartData.length <= 1 ? (
                <div className="flex h-[200px] items-center justify-center text-[12px] text-gray-400">No data yet</div>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="date" tick={{ ...TICK, fontSize: 9 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ ...TICK, fontSize: 9 }} axisLine={false} tickLine={false} />
                    <Tooltip />
                    <Bar dataKey="orders" radius={[4, 4, 0, 0]} fill="#f43f5e" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Order Split Pie */}
          <div className={`xl:col-span-2 ${CHART_CARD}`}>
            <div className="border-b border-gray-100 px-4 py-3">
              <h3 className="text-[15px] font-bold text-gray-900">Order Split</h3>
              <p className="mt-0.5 text-[11px] text-gray-500">Dine-in vs online</p>
            </div>
            <div className="p-3">
              {onlinePercent === 0 && dineInPercent === 0 ? (
                <div className="flex h-[200px] items-center justify-center text-[12px] text-gray-400">No data</div>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Tooltip />
                    <Pie data={[{ name: "Online", value: onlinePercent }, { name: "Dine In", value: dineInPercent }]}
                      cx="50%" cy="45%" innerRadius={34} outerRadius={56} paddingAngle={3} dataKey="value">
                      <Cell fill="#f43f5e" />
                      <Cell fill="#10b981" />
                    </Pie>
                    <Legend verticalAlign="bottom" height={20} iconType="circle" wrapperStyle={{ fontSize: "11px" }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        {/* ── INSIGHTS GRID ──────────────────────────────────── */}
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-12">
          {/* Live Orders */}
          <div className={`xl:col-span-4 ${CHART_CARD} p-3`}>
            <div className="mb-3 flex items-start justify-between">
              <div>
                <div className="inline-flex rounded-full bg-gray-100 px-2 py-1 text-[9px] font-bold uppercase tracking-wide text-gray-600">Live Orders</div>
                <h3 className="mt-1.5 text-[15px] font-bold text-gray-900">Online Orders</h3>
                <p className="mt-0.5 text-[11px] text-gray-500">Incoming delivery orders</p>
              </div>
              <div className="flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1">
                <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                <span className="text-[9px] font-bold text-emerald-700">LIVE</span>
              </div>
            </div>
            <div className="space-y-2">
              {analytics?.recentOrders?.slice(0, 4).map((order: any, i: number) => (
                <div key={order.id} className="rounded-xl border border-gray-100 bg-gray-50/60 p-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[12px] font-semibold text-gray-900">{order.billNo}</p>
                      <p className="text-[10px] text-gray-400">{order.customer?.name || "Guest"}</p>
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-[9px] font-semibold ${i % 2 === 0 ? "bg-orange-100 text-orange-700" : "bg-red-100 text-red-700"}`}>
                      {i % 2 === 0 ? "Swiggy" : "Zomato"}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <p className="text-[17px] font-black text-gray-900">₹{order.total}</p>
                    <button className="rounded-lg bg-red-500 px-2.5 py-1 text-[10px] font-bold text-white transition hover:bg-red-600">Accept</button>
                  </div>
                </div>
              )) || (
                <div className="flex h-[120px] items-center justify-center text-[12px] text-gray-400">No live orders</div>
              )}
            </div>
          </div>

          {/* Payment Split */}
          <div className={`xl:col-span-3 ${CHART_CARD} p-3`}>
            <div className="mb-3">
              <div className="inline-flex rounded-full bg-gray-100 px-2 py-1 text-[9px] font-bold uppercase tracking-wide text-gray-600">Analytics</div>
              <h3 className="mt-1.5 text-[15px] font-bold text-gray-900">Payment Split</h3>
              <p className="mt-0.5 text-[11px] text-gray-500">Revenue by payment method</p>
            </div>
            <div className="space-y-2">
              {Object.entries(analytics?.paymentSplit || {}).length > 0 ? Object.entries(analytics?.paymentSplit || {}).map(([key, value]: any) => {
                const max = Math.max(...Object.values(analytics?.paymentSplit || {}).map(Number), 1);
                return (
                  <div key={key} className="rounded-xl border border-gray-100 bg-gray-50/60 p-2.5">
                    <div className="flex items-center justify-between">
                      <p className="text-[12px] font-semibold text-gray-900">{key}</p>
                      <p className="text-[12px] font-bold text-gray-700">₹{Number(value).toLocaleString()}</p>
                    </div>
                    <div className="mt-2 h-1 overflow-hidden rounded-full bg-gray-200">
                      <div className="h-full rounded-full bg-blue-500 transition-all" style={{ width: `${Math.min((Number(value) / max) * 100, 100)}%` }} />
                    </div>
                  </div>
                );
              }) : (
                <div className="flex h-[120px] items-center justify-center text-[12px] text-gray-400">No payment data</div>
              )}
            </div>
          </div>

          {/* Top Items */}
          <div className={`xl:col-span-5 ${CHART_CARD} p-3`}>
            <div className="mb-3 flex items-start justify-between">
              <div>
                <div className="inline-flex rounded-full bg-gray-100 px-2 py-1 text-[9px] font-bold uppercase tracking-wide text-gray-600">Trending</div>
                <h3 className="mt-1.5 text-[15px] font-bold text-gray-900">Top Selling Items</h3>
                <p className="mt-0.5 text-[11px] text-gray-500">Best performing menu items</p>
              </div>
            </div>
            <div className="space-y-2">
              {analytics?.topItems?.slice(0, 5).map((item: any) => (
                <div key={item.name} className="rounded-xl border border-gray-100 bg-gray-50/60 p-2.5 transition hover:bg-gray-50">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-[12px] font-semibold text-gray-900">{item.name}</p>
                    <div className="flex h-7 min-w-[32px] items-center justify-center rounded-lg bg-red-500 px-2 text-[11px] font-bold text-white">{item.quantity}</div>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-200">
                      <div className="h-full rounded-full bg-red-500 transition-all" style={{ width: `${Math.min(item.quantity * 10, 100)}%` }} />
                    </div>
                    <p className="min-w-[28px] text-right text-[9px] font-semibold text-gray-400">{Math.min(item.quantity * 10, 100)}%</p>
                  </div>
                </div>
              )) || (
                <div className="flex h-[120px] items-center justify-center text-[12px] text-gray-400">No item data yet</div>
              )}
            </div>
          </div>
        </div>

        {/* ── RECENT ORDERS TABLE ─────────────────────────────── */}
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
              { header: "Bill No", key: "billNo", render: (r) => <p className="text-[12px] font-bold text-gray-900">{r.billNo}</p> },
              {
                header: "Customer", key: "customer", render: (r) => (
                  <div>
                    <p className="text-[12px] font-semibold text-gray-900">{r.customer?.name || "—"}</p>
                    <p className="text-[10px] text-gray-400">{r.customer?.phone || "—"}</p>
                  </div>
                ),
              },
              {
                header: "Type", key: "orderType", render: (r) => (
                  <span className={`rounded-full px-2 py-[3px] text-[10px] font-semibold ${
                    r.orderType === "DINE_IN" ? "bg-gray-100 text-gray-700" :
                    r.orderType === "TAKEAWAY" ? "bg-orange-50 text-orange-600" : "bg-violet-50 text-violet-600"
                  }`}>{r.orderType}</span>
                ),
              },
              { header: "Payment", key: "paymentMethod", render: (r) => <span className="rounded-full border border-gray-200 bg-white px-2 py-[3px] text-[10px] text-gray-600">{r.paymentMethod}</span> },
              { header: "Amount", key: "total", render: (r) => <span className="text-[13px] font-black text-gray-900">₹{Number(r.total || 0).toLocaleString()}</span> },
              {
                header: "Status", key: "status", render: (r) => (
                  <span className={`rounded-full px-2 py-[3px] text-[10px] font-semibold ${r.status === "PAID" ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"}`}>
                    {r.status}
                  </span>
                ),
              },
              { header: "Date", key: "createdAt", render: (r) => <p className="text-[11px] text-gray-400">{new Date(r.createdAt).toLocaleDateString()}</p> },
            ]}
          />
        </div>
      </div>
    </main>
  );
}
