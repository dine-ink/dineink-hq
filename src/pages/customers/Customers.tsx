import { useState, useEffect } from "react";
import { useAppSelector } from "../../store";
import {
  EyeIcon,
  UsersIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import { BarChart3Icon, IndianRupeeIcon, RepeatIcon } from "lucide-react";

export default function Customers() {
  const { selectedBranch } = useAppSelector(s => s.branch);
  const { user, token } = useAppSelector(s => s.auth);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [customers, setCustomers] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const rowsPerPage = 5;
  const filtered = customers.filter(
    (c) =>
      (c.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (c.phone ?? "").includes(search),
  );
  const API_URL = import.meta.env.VITE_API_URL;
  const totalPages = Math.ceil(filtered.length / rowsPerPage);
  const paginatedCustomers = filtered.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage,
  );
  const [activeTab, setActiveTab] = useState<"overview" | "churn" | "rfm">("overview");
  const [rfmData, setRfmData] = useState<any>(null);
  const [rfmLoading, setRfmLoading] = useState(false);
  const total = filtered.length;
  const repeat = filtered.filter((c) => c.visits > 1).length;
  const revenue = filtered.reduce((s, c) => s + c.spend, 0);
  const avg = total ? Math.round(revenue / total) : 0;

  // Churn analysis
  const now = new Date();
  const active = customers.filter(c => c.lastVisit && (now.getTime() - new Date(c.lastVisit).getTime()) / (1000 * 60 * 60 * 24) <= 30);
  const atRisk = customers.filter(c => c.lastVisit && (now.getTime() - new Date(c.lastVisit).getTime()) / (1000 * 60 * 60 * 24) > 30 && (now.getTime() - new Date(c.lastVisit).getTime()) / (1000 * 60 * 60 * 24) <= 90);
  const churned = customers.filter(c => !c.lastVisit || (now.getTime() - new Date(c.lastVisit).getTime()) / (1000 * 60 * 60 * 24) > 90);
  const topCustomers = [...customers].sort((a, b) => b.spend - a.spend).slice(0, 10);
  const clvAvg = total > 0 ? Math.round(customers.reduce((s, c) => s + Number(c.spend || 0), 0) / total) : 0;

  useEffect(() => {
    const controller = new AbortController();
    fetchCustomers(controller.signal);
    return () => controller.abort();
  }, [selectedBranch]);

  const fetchCustomers = async (signal?: AbortSignal) => {
    try {
      setLoading(true);
      if (!selectedBranch?.id || !user?.restaurantId) return;
      const url = `${API_URL}/api/customers/${user.restaurantId}/customerByBranch?branchId=${selectedBranch.id}`;
      const res = await fetch(url, { signal, headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setCustomers(data.customers);
    } catch (err) {
      if (err instanceof DOMException) return;
    } finally {
      setLoading(false);
    }
  };

  // Fetch RFM data when tab is selected
  useEffect(() => {
    if (activeTab !== "rfm" || !selectedBranch?.id) return;
    const fetchRFM = async () => {
      try {
        setRfmLoading(true);
        const res = await fetch(
          `${API_URL}/api/analytics/${user.restaurantId}/customer-rfm?branchId=${selectedBranch.id}`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        const data = await res.json();
        if (data.success) setRfmData(data.data);
      } catch { /* silent */ } finally { setRfmLoading(false); }
    };
    fetchRFM();
  }, [activeTab, selectedBranch]);

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-red-500" />
          <p className="text-[12px] text-gray-500">Loading customers...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="h-full flex-1 overflow-auto rounded-xl border border-gray-200 bg-[#f8fafc]">
      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-2.5">
        <div className="relative overflow-hidden rounded-2xl border border-gray-100 bg-white px-5 py-4 shadow-sm transition-all duration-200 hover:shadow-md">
          <div className="absolute -right-10 -top-10 h-24 w-24 rounded-full bg-red-100/50 blur-3xl" />
          <div className="relative z-10 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-pink-500 shadow-sm">
                <UsersIcon className="h-4 w-4 text-white" />
              </div>
              <div>
                <h1 className="text-[18px] font-bold leading-none tracking-tight text-gray-900">Customers</h1>
                <p className="mt-1 text-[11px] text-gray-500">Customer analytics, retention and churn intelligence</p>
              </div>
              <div className="ml-2 flex rounded-lg border border-gray-200 bg-white overflow-hidden">
                {(["overview", "churn", "rfm"] as const).map(t => (
                  <button key={t} onClick={() => setActiveTab(t)}
                    className={`px-3 py-1.5 text-[11px] font-semibold transition ${activeTab === t ? "bg-red-500 text-white" : "text-gray-600 hover:bg-gray-50"}`}>
                    {t === "overview" ? "Overview" : t === "churn" ? "Churn Analysis" : "RFM Score"}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { label: "Customers", value: total, Icon: UsersIcon, cls: "border-blue-100 bg-blue-50", ibg: "bg-blue-100", ico: "text-blue-600", val: "text-blue-700", lbl: "text-blue-400" },
                { label: "Repeat", value: repeat, Icon: RepeatIcon, cls: "border-emerald-100 bg-emerald-50", ibg: "bg-emerald-100", ico: "text-emerald-600", val: "text-emerald-700", lbl: "text-emerald-400" },
                { label: "Avg Spend", value: `₹${avg}`, Icon: IndianRupeeIcon, cls: "border-orange-100 bg-orange-50", ibg: "bg-orange-100", ico: "text-orange-600", val: "text-orange-700", lbl: "text-orange-400" },
                { label: "Revenue", value: `₹${revenue.toLocaleString()}`, Icon: BarChart3Icon, cls: "border-red-100 bg-red-50", ibg: "bg-red-100", ico: "text-red-600", val: "text-red-700", lbl: "text-red-400" },
              ].map(k => (
                <div key={k.label} className={`flex items-center gap-2 rounded-xl border px-2.5 py-1.5 shadow-sm ${k.cls}`}>
                  <div className={`flex h-6 w-6 items-center justify-center rounded-lg ${k.ibg}`}>
                    <k.Icon className={`h-3 w-3 ${k.ico}`} />
                  </div>
                  <div>
                    <p className={`text-[8px] font-bold uppercase tracking-[0.12em] ${k.lbl}`}>{k.label}</p>
                    <p className={`text-[13px] font-black leading-none ${k.val}`}>{k.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {activeTab === "overview" && <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all duration-200 hover:shadow-md">
          {/* HEADER */}

          <div className="border-b border-gray-100 px-4 py-2.5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              {/* LEFT */}

              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-red-50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.18em] text-red-600">
                  Analytics Table
                </div>

                <h2 className="mt-1.5 text-[18px] font-bold text-gray-900">
                  Customer Insights
                </h2>

                <p className="mt-0.5 text-[11px] text-gray-500">
                  Spending patterns & engagement analytics
                </p>
              </div>

              {/* SEARCH */}

              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />

                <input
                  placeholder="Search customer..."
                  className="h-9 w-full rounded-xl border border-gray-200 bg-white pl-8 pr-3 text-[12px] outline-none transition-all focus:border-red-400 focus:ring-2 focus:ring-red-100 lg:w-60"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* TABLE */}

          <div className="overflow-x-auto">
            <table className="min-w-full text-[12px]">
              {/* HEAD */}

              <thead className="bg-gray-50">
                <tr className="border-b border-gray-100">
                  {[
                    "Customer",
                    "Visits",
                    "Avg Bill",
                    "Spend",
                    "Preferred",
                    "Last Visit",
                    "Segment",
                    "Action",
                  ].map((header) => (
                    <th
                      key={header}
                      className="px-4 py-2 text-left text-[9px] font-bold uppercase tracking-[0.16em] text-gray-400"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>

              {/* BODY */}

              <tbody>
                {paginatedCustomers.map((c: any) => {
                  const avgBill = c.visits ? Math.round(c.spend / c.visits) : 0;

                  const preferred = c.preferredOrderType || "-";

                  const segment =
                    c.spend > 5000 ? "VIP" : c.visits > 3 ? "Regular" : "New";

                  const avatarGradients = [
                    "from-red-500 to-pink-500",
                    "from-blue-500 to-indigo-500",
                    "from-emerald-500 to-teal-500",
                    "from-orange-500 to-amber-500",
                    "from-violet-500 to-purple-500",
                  ];
                  const gradientIndex =
                    (c.name?.charCodeAt(0) || 0) % avatarGradients.length;

                  return (
                    <tr
                      key={c.id}
                      className="border-b border-gray-100 transition-all hover:bg-gray-50/60"
                    >
                      {/* CUSTOMER */}

                      <td className="px-4 py-1.5">
                        <div className="flex items-center gap-2">
                          <div
                            className={`flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br ${avatarGradients[gradientIndex]} text-[10px] font-bold text-white`}
                          >
                            {c.name?.charAt(0)}
                          </div>

                          <div>
                            <p className="text-[12px] font-semibold text-gray-900">
                              {c.name}
                            </p>

                            <p className="text-[9px] text-gray-400">
                              {c.phone}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* VISITS */}

                      <td className="px-4 py-1.5">
                        <span className="inline-flex rounded-full bg-blue-50 px-1.5 py-[2px] text-[9px] font-semibold text-blue-600">
                          {c.visits} Visits
                        </span>
                      </td>

                      {/* AVG */}

                      <td className="px-4 py-1.5">
                        <p className="text-[12px] font-semibold text-gray-800">
                          ₹{avgBill}
                        </p>
                      </td>

                      {/* SPEND */}

                      <td className="px-4 py-1.5">
                        <p className="text-[12px] font-bold text-emerald-600">
                          ₹{c.spend}
                        </p>
                      </td>

                      {/* PREFERRED */}

                      <td className="px-4 py-1.5">
                        <span
                          className={`inline-flex rounded-full px-1.5 py-[2px] text-[9px] font-semibold ${
                            preferred === "DINE_IN"
                              ? "bg-blue-50 text-blue-600"
                              : "bg-orange-50 text-orange-600"
                          }`}
                        >
                          {preferred.replace("_", " ")}
                        </span>
                      </td>

                      {/* LAST VISIT */}

                      <td className="px-4 py-1.5">
                        <div className="text-[11px] text-gray-500">
                          {c.lastVisit
                            ? new Date(c.lastVisit).toLocaleDateString()
                            : "-"}
                        </div>
                      </td>

                      {/* SEGMENT */}

                      <td className="px-4 py-1.5">
                        <span
                          className={`inline-flex rounded-full px-1.5 py-[2px] text-[9px] font-semibold ${
                            segment === "VIP"
                              ? "bg-purple-50 text-purple-600"
                              : segment === "Regular"
                                ? "bg-blue-50 text-blue-600"
                                : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {segment}
                        </span>
                      </td>

                      {/* ACTION */}

                      <td className="px-4 py-1.5">
                        <button
                          onClick={() => setSelectedCustomer(c)}
                          className="flex h-7 w-7 items-center justify-center rounded-md bg-gray-100 transition hover:bg-red-50"
                        >
                          <EyeIcon className="h-3.5 w-3.5 text-gray-600 hover:text-red-600" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* FOOTER */}

          <div className="flex items-center justify-between border-t border-gray-100 px-4 py-2">
            <p className="text-[11px] text-gray-500">
              Showing{" "}
              <span className="font-semibold text-gray-700">
                {paginatedCustomers.length}
              </span>{" "}
              customers
            </p>

            <div className="flex items-center gap-1.5">
              <button
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
                className="rounded-md border border-gray-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-gray-700 transition-all hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Previous
              </button>

              <div className="rounded-md bg-red-50 px-2.5 py-1 text-[11px] font-semibold text-red-600">
                {page} / {totalPages}
              </div>

              <button
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
                className="rounded-md border border-gray-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-gray-700 transition-all hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </div>}

        {activeTab === "churn" && (
          <div className="space-y-3">
            {/* CHURN KPIs */}
            <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
              {[
                { label: "Active", value: active.length, sub: "visited in last 30 days", cls: "border-emerald-100 bg-emerald-50/60", val: "text-emerald-700" },
                { label: "At Risk", value: atRisk.length, sub: "30–90 days since visit", cls: "border-orange-100 bg-orange-50/60", val: "text-orange-700" },
                { label: "Churned", value: churned.length, sub: "no visit in 90+ days", cls: "border-red-100 bg-red-50/60", val: "text-red-700" },
                { label: "Avg CLV", value: `₹${clvAvg.toLocaleString()}`, sub: "customer lifetime value", cls: "border-violet-100 bg-violet-50/60", val: "text-violet-700" },
              ].map(k => (
                <div key={k.label} className={`rounded-xl border p-4 ${k.cls}`}>
                  <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500">{k.label}</p>
                  <p className={`mt-2 text-[22px] font-bold ${k.val}`}>{k.value}</p>
                  <p className="mt-1 text-[11px] text-gray-500">{k.sub}</p>
                </div>
              ))}
            </div>

            {/* TOP CUSTOMERS */}
            <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
              <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="border-b border-gray-100 px-4 py-3">
                  <h3 className="text-[15px] font-bold text-gray-900">Top 10 Customers by Spend</h3>
                  <p className="mt-0.5 text-[11px] text-gray-500">Your highest-value customers — never lose these</p>
                </div>
                <div className="divide-y divide-gray-50">
                  {topCustomers.map((c: any, i: number) => (
                    <div key={c.id} className="flex items-center gap-3 px-4 py-2.5">
                      <span className="w-5 text-center text-[11px] font-bold text-gray-400">#{i + 1}</span>
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-red-400 to-pink-500 text-[11px] font-bold text-white">
                        {c.name?.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-gray-900 truncate">{c.name}</p>
                        <p className="text-[10px] text-gray-400">{c.phone} · {c.visits} visits</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[13px] font-bold text-emerald-600">₹{Number(c.spend || 0).toLocaleString()}</p>
                        <p className="text-[9px] text-gray-400">₹{c.visits ? Math.round(c.spend / c.visits) : 0} avg</p>
                      </div>
                    </div>
                  ))}
                  {topCustomers.length === 0 && <div className="py-10 text-center text-[12px] text-gray-400">No customers yet</div>}
                </div>
              </div>

              {/* AT-RISK CUSTOMERS */}
              <div className="overflow-hidden rounded-xl border border-orange-100 bg-white shadow-sm">
                <div className="border-b border-orange-100 bg-orange-50/40 px-4 py-3">
                  <h3 className="text-[15px] font-bold text-gray-900">⚠ At-Risk Customers</h3>
                  <p className="mt-0.5 text-[11px] text-gray-500">Haven't visited in 30–90 days — reach out now before they churn</p>
                </div>
                <div className="divide-y divide-gray-50 max-h-[320px] overflow-y-auto">
                  {atRisk.slice(0, 15).map((c: any) => {
                    const daysSince = c.lastVisit ? Math.floor((Date.now() - new Date(c.lastVisit).getTime()) / (1000 * 60 * 60 * 24)) : null;
                    return (
                      <div key={c.id} className="flex items-center gap-3 px-4 py-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-100 text-[11px] font-bold text-orange-700">
                          {c.name?.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-semibold text-gray-900 truncate">{c.name}</p>
                          <p className="text-[10px] text-gray-400">{c.phone} · {c.visits} visits · ₹{c.spend} total</p>
                        </div>
                        <span className="rounded-full bg-orange-50 px-2 py-0.5 text-[10px] font-bold text-orange-600 whitespace-nowrap">
                          {daysSince}d ago
                        </span>
                      </div>
                    );
                  })}
                  {atRisk.length === 0 && <div className="py-10 text-center text-[12px] text-gray-400">No at-risk customers — great retention!</div>}
                </div>
              </div>
            </div>

            {/* CHURNED CUSTOMERS */}
            <div className="overflow-hidden rounded-xl border border-red-100 bg-white shadow-sm">
              <div className="border-b border-red-100 bg-red-50/40 px-4 py-3 flex items-center justify-between">
                <div>
                  <h3 className="text-[15px] font-bold text-gray-900">Churned Customers</h3>
                  <p className="mt-0.5 text-[11px] text-gray-500">No visit in 90+ days — consider a win-back campaign</p>
                </div>
                <span className="rounded-full bg-red-100 px-3 py-1 text-[11px] font-bold text-red-700">{churned.length} churned</span>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-[12px]">
                  <thead className="bg-gray-50">
                    <tr className="border-b border-gray-100">
                      {["Customer", "Phone", "Total Visits", "Total Spend", "Last Visit", "Days Since", "Avg Bill"].map(h => (
                        <th key={h} className="px-4 py-2 text-left text-[10px] font-bold uppercase tracking-wide text-gray-400">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {churned.slice(0, 20).map((c: any) => {
                      const daysSince = c.lastVisit ? Math.floor((Date.now() - new Date(c.lastVisit).getTime()) / (1000 * 60 * 60 * 24)) : null;
                      return (
                        <tr key={c.id} className="border-b border-gray-50 hover:bg-red-50/20">
                          <td className="px-4 py-2.5">
                            <div className="flex items-center gap-2">
                              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-100 text-[10px] font-bold text-red-600">{c.name?.charAt(0)}</div>
                              <p className="font-semibold text-gray-900">{c.name}</p>
                            </div>
                          </td>
                          <td className="px-4 py-2.5 text-gray-500">{c.phone}</td>
                          <td className="px-4 py-2.5 text-gray-700">{c.visits}</td>
                          <td className="px-4 py-2.5 font-semibold text-gray-900">₹{Number(c.spend || 0).toLocaleString()}</td>
                          <td className="px-4 py-2.5 text-gray-500">{c.lastVisit ? new Date(c.lastVisit).toLocaleDateString() : "Never"}</td>
                          <td className="px-4 py-2.5">
                            <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-600">{daysSince ? `${daysSince}d` : "—"}</span>
                          </td>
                          <td className="px-4 py-2.5 text-gray-600">₹{c.visits ? Math.round(c.spend / c.visits) : 0}</td>
                        </tr>
                      );
                    })}
                    {churned.length === 0 && <tr><td colSpan={7} className="py-10 text-center text-[12px] text-gray-400">No churned customers — excellent retention!</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── RFM SCORE TAB ─────────────────────────────── */}
        {activeTab === "rfm" && (
          <div className="space-y-3">
            {rfmLoading ? (
              <div className="flex min-h-[300px] items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-red-500" />
                  <p className="text-[12px] text-gray-500">Scoring customers...</p>
                </div>
              </div>
            ) : (
              <>
                {/* Segment KPIs */}
                <div className="grid grid-cols-2 gap-3 xl:grid-cols-5">
                  {[
                    { label: "Champion", sub: "High R·F·M — best customers", color: "emerald" },
                    { label: "Loyal", sub: "Regular buyers, good spend", color: "blue" },
                    { label: "Potential", sub: "Occasional, growing", color: "violet" },
                    { label: "At Risk", sub: "Haven't visited recently", color: "orange" },
                    { label: "Lost", sub: "No visits in 90+ days", color: "red" },
                  ].map(s => {
                    const count = rfmData?.segmentCounts?.[s.label] || 0;
                    const rev = rfmData?.segmentRevenue?.[s.label] || 0;
                    const colorMap: Record<string, string> = {
                      emerald: "border-emerald-100 bg-emerald-50/60 text-emerald-700",
                      blue: "border-blue-100 bg-blue-50/60 text-blue-700",
                      violet: "border-violet-100 bg-violet-50/60 text-violet-700",
                      orange: "border-orange-100 bg-orange-50/60 text-orange-700",
                      red: "border-red-100 bg-red-50/60 text-red-700",
                    };
                    return (
                      <div key={s.label} className={`rounded-xl border p-4 ${colorMap[s.color]}`}>
                        <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500">{s.label}</p>
                        <p className={`mt-2 text-[24px] font-black ${colorMap[s.color].split(" ")[2]}`}>{count}</p>
                        <p className="mt-0.5 text-[10px] text-gray-500">₹{Number(rev).toLocaleString()} revenue</p>
                        <p className="mt-1 text-[10px] text-gray-400">{s.sub}</p>
                      </div>
                    );
                  })}
                </div>

                {/* RFM explanation */}
                <div className="overflow-hidden rounded-xl border border-blue-100 bg-blue-50/40 px-4 py-3">
                  <p className="text-[12px] font-semibold text-blue-900">How RFM scoring works</p>
                  <p className="mt-1 text-[11px] text-blue-700">
                    Each customer is scored 1–5 on three dimensions: <strong>R</strong>ecency (days since last visit), <strong>F</strong>requency (total visits), <strong>M</strong>onetary (total spend). Higher score = better customer.
                    Total 13–15 = Champion · 10–12 = Loyal · 7–9 = Potential · 5–6 = At Risk · 3–4 = Lost.
                  </p>
                </div>

                {/* RFM Customer Table */}
                <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                  <div className="border-b border-gray-100 px-4 py-3">
                    <h3 className="text-[15px] font-bold text-gray-900">All Customers — RFM Scores</h3>
                    <p className="mt-0.5 text-[11px] text-gray-500">{rfmData?.total || 0} customers scored · sorted by RFM total (best first)</p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-[12px]">
                      <thead className="bg-gray-50">
                        <tr className="border-b border-gray-100">
                          {["Customer", "Segment", "R Score", "F Score", "M Score", "Total", "Last Visit", "Visits", "Spend"].map(h => (
                            <th key={h} className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wide text-gray-400">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {(rfmData?.customers || []).slice(0, 50).map((c: any) => {
                          const segColor: Record<string, string> = {
                            Champion: "bg-emerald-50 text-emerald-700",
                            Loyal: "bg-blue-50 text-blue-700",
                            Potential: "bg-violet-50 text-violet-700",
                            "At Risk": "bg-orange-50 text-orange-700",
                            Lost: "bg-red-50 text-red-700",
                          };
                          const ScoreCell = ({ v }: { v: number }) => (
                            <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold ${v >= 4 ? "bg-emerald-100 text-emerald-700" : v === 3 ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`}>
                              {v}
                            </span>
                          );
                          return (
                            <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50/60">
                              <td className="px-4 py-2.5">
                                <p className="font-semibold text-gray-900">{c.name}</p>
                                <p className="text-[10px] text-gray-400">{c.phone}</p>
                              </td>
                              <td className="px-4 py-2.5">
                                <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${segColor[c.segment] || "bg-gray-100 text-gray-600"}`}>
                                  {c.segment}
                                </span>
                              </td>
                              <td className="px-4 py-2.5"><ScoreCell v={c.R} /></td>
                              <td className="px-4 py-2.5"><ScoreCell v={c.F} /></td>
                              <td className="px-4 py-2.5"><ScoreCell v={c.M} /></td>
                              <td className="px-4 py-2.5">
                                <span className="text-[14px] font-black text-gray-900">{c.rfm}</span>
                                <span className="text-[10px] text-gray-400">/15</span>
                              </td>
                              <td className="px-4 py-2.5 text-gray-500">{c.recencyDays}d ago</td>
                              <td className="px-4 py-2.5 text-gray-700">{c.frequency}</td>
                              <td className="px-4 py-2.5 font-bold text-emerald-600">₹{c.monetary.toLocaleString()}</td>
                            </tr>
                          );
                        })}
                        {!rfmData?.customers?.length && (
                          <tr><td colSpan={9} className="py-12 text-center text-[12px] text-gray-400">No customer data available for RFM scoring</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
