import { useCallback, useState, useEffect } from "react";
import { useBranchSync, getSelectedBranch } from "@/hooks/useBranchSync";
import {
  ReceiptPercentIcon,
  MagnifyingGlassIcon,
  ChartBarIcon,
  CalendarDaysIcon,
} from "@heroicons/react/24/outline";
import { IndianRupeeIcon, ShoppingBagIcon } from "lucide-react";

export default function Bills() {
  const API_URL = import.meta.env.VITE_API_URL;
  const [search, setSearch] = useState("");
  const [bills, setBills] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const rowsPerPage = 10;
  const branches = JSON.parse(localStorage.getItem("branches") || "[]");
  const [selectedBranch, setSelectedBranch] = useState<any>(() => {
    const saved = localStorage.getItem("selectedBranch");
    return saved ? JSON.parse(saved) : branches[0] || null;
  });

  useEffect(() => {
    const controller = new AbortController();
    fetchBills(controller.signal);
    return () => controller.abort();
  }, [selectedBranch]);

  const fetchBills = async (signal?: AbortSignal) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      if (!selectedBranch?.id) return;
      const res = await fetch(
        `${API_URL}/api/bills/${user.restaurantId}/${selectedBranch.id}/branchwise`,
        { signal, headers: { Authorization: `Bearer ${token}` } },
      );
      const data = await res.json();
      if (data.success) setBills(data.bills);
    } catch (err) {
      if (err instanceof DOMException) return;
    } finally {
      setLoading(false);
    }
  };

  const handleBranchChange = useCallback(() => { setSelectedBranch(getSelectedBranch()); }, []);
  useBranchSync(handleBranchChange);

  const filtered = bills.filter(b => {
    const s = search.toLowerCase();
    return (
      (b.customer?.name || "").toLowerCase().includes(s) ||
      (b.customer?.phone || "").includes(search) ||
      (b.paymentMethod || "").toLowerCase().includes(s) ||
      (b.orderType || "").toLowerCase().includes(s) ||
      String(b.total).includes(search) ||
      String(b.id).includes(search)
    );
  });

  const totalPages = Math.max(Math.ceil(filtered.length / rowsPerPage), 1);
  const paginated = filtered.slice((page - 1) * rowsPerPage, page * rowsPerPage);
  const totalSales = filtered.reduce((s, b) => s + (b.total || 0), 0);
  const avgBill = filtered.length ? Math.round(totalSales / filtered.length) : 0;

  const AVATAR_GRADS = ["from-red-500 to-pink-500", "from-blue-500 to-indigo-500", "from-emerald-500 to-teal-500", "from-orange-500 to-amber-500", "from-violet-500 to-purple-500"];
  const ORDER_BADGE: Record<string, string> = {
    DINE_IN: "bg-blue-50 text-blue-600",
    ONLINE: "bg-violet-50 text-violet-600",
    TAKEAWAY: "bg-orange-50 text-orange-600",
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-red-500" />
          <p className="text-[12px] text-gray-500">Loading bills...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-3">

        {/* ── HEADER ─────────────────────────────────────── */}
        <div className="relative overflow-hidden rounded-xl border border-gray-200 bg-white px-5 py-4 shadow-sm">
          <div className="absolute -right-10 -top-10 h-24 w-24 rounded-full bg-red-100/50 blur-3xl" />
          <div className="relative z-10 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-pink-500 shadow-sm">
                <ReceiptPercentIcon className="h-4 w-4 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-black tracking-tight text-gray-900">Billing Overview</h1>
                <p className="mt-0.5 text-[12px] text-gray-500">Revenue, payments and transaction history</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { label: "Revenue", value: `₹${totalSales.toLocaleString()}`, icon: IndianRupeeIcon, cls: "border-emerald-100 bg-emerald-50", val: "text-emerald-700", icon_bg: "bg-emerald-100", icon_cls: "text-emerald-600" },
                { label: "Orders", value: filtered.length, icon: ShoppingBagIcon, cls: "border-blue-100 bg-blue-50", val: "text-blue-700", icon_bg: "bg-blue-100", icon_cls: "text-blue-600" },
                { label: "Avg Bill", value: `₹${avgBill.toLocaleString()}`, icon: ChartBarIcon, cls: "border-orange-100 bg-orange-50", val: "text-orange-700", icon_bg: "bg-orange-100", icon_cls: "text-orange-600" },
                { label: "Paid", value: filtered.filter(b => b.status === "PAID").length, icon: CalendarDaysIcon, cls: "border-violet-100 bg-violet-50", val: "text-violet-700", icon_bg: "bg-violet-100", icon_cls: "text-violet-600" },
              ].map(k => {
                const Icon = k.icon;
                return (
                  <div key={k.label} className={`flex items-center gap-2 rounded-xl border px-2.5 py-1.5 shadow-sm ${k.cls}`}>
                    <div className={`flex h-6 w-6 items-center justify-center rounded-lg ${k.icon_bg}`}>
                      <Icon className={`h-3 w-3 ${k.icon_cls}`} />
                    </div>
                    <div>
                      <p className={`text-[8px] font-bold uppercase tracking-[0.12em] ${k.val} opacity-70`}>{k.label}</p>
                      <p className={`text-[13px] font-black leading-none ${k.val}`}>{k.value}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── BILLS TABLE ────────────────────────────────── */}
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          {/* Table header */}
          <div className="border-b border-gray-100 px-5 py-3">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="inline-flex rounded-full bg-red-50 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.18em] text-red-600">
                  Transactions
                </div>
                <h2 className="mt-1.5 text-[17px] font-bold text-gray-900">Recent Bills</h2>
                <p className="mt-0.5 text-[11px] text-gray-500">Billing history · {filtered.length} records</p>
              </div>
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
                <input
                  placeholder="Search by customer, amount, type..."
                  value={search}
                  onChange={e => { setSearch(e.target.value); setPage(1); }}
                  className="h-9 w-full rounded-xl border border-gray-200 bg-white pl-8 pr-3 text-[12px] outline-none transition focus:border-red-400 focus:ring-2 focus:ring-red-100 lg:w-72"
                />
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full text-[12px]">
              <thead className="bg-gray-50">
                <tr className="border-b border-gray-100">
                  {["Bill", "Customer", "Order Type", "Payment", "Amount", "Status", "Date & Time"].map(h => (
                    <th key={h} className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginated.length > 0 ? paginated.map((b: any) => {
                  const grad = AVATAR_GRADS[(b.customer?.name?.charCodeAt(0) || 0) % AVATAR_GRADS.length];
                  return (
                    <tr key={b.id} className="border-b border-gray-50 transition hover:bg-gray-50/60">
                      <td className="px-4 py-2.5">
                        <p className="font-bold text-gray-900">{b.billNo || `#${b.id}`}</p>
                        <p className="text-[10px] text-gray-400">ID #{b.id}</p>
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <div className={`flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br ${grad} text-[10px] font-bold text-white`}>
                            {b.customer?.name?.charAt(0) || "G"}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{b.customer?.name || "Guest"}</p>
                            <p className="text-[10px] text-gray-400">{b.customer?.phone || "—"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${ORDER_BADGE[b.orderType] || "bg-gray-100 text-gray-600"}`}>
                          {(b.orderType || "—").replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-600">
                          {b.paymentMethod}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <p className="font-bold text-emerald-600">₹{Number(b.total || 0).toLocaleString()}</p>
                        <p className="text-[10px] text-gray-400">GST ₹{Number(b.gst || 0).toLocaleString()}</p>
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex flex-col gap-1">
                          <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${b.status === "PAID" ? "bg-emerald-50 text-emerald-600" : "bg-yellow-50 text-yellow-600"}`}>
                            {b.status}
                          </span>
                          {b.orderStatus && (
                            <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                              b.orderStatus === "COMPLETED" ? "bg-blue-50 text-blue-600" : b.orderStatus === "ACTIVE" ? "bg-orange-50 text-orange-600" : "bg-gray-100 text-gray-600"
                            }`}>
                              {b.orderStatus}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-2.5">
                        <p className="text-[12px] font-medium text-gray-700">{new Date(b.createdAt).toLocaleDateString("en-IN")}</p>
                        <p className="text-[10px] text-gray-400">{new Date(b.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</p>
                      </td>
                    </tr>
                  );
                }) : (
                  <tr>
                    <td colSpan={7} className="py-16 text-center text-[12px] text-gray-400">
                      {search ? "No bills match your search" : "No bills found for this branch"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-gray-100 px-5 py-3">
            <p className="text-[11px] text-gray-500">
              Showing <span className="font-semibold text-gray-700">{paginated.length}</span> of <span className="font-semibold text-gray-700">{filtered.length}</span> bills
            </p>
            <div className="flex items-center gap-1.5">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
                className="rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40">
                Previous
              </button>
              <div className="rounded-xl bg-red-50 px-3 py-1.5 text-[11px] font-bold text-red-600">
                {page} / {totalPages}
              </div>
              <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}
                className="rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40">
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
