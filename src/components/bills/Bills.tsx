import { useState, useEffect } from "react";
import { useAppSelector } from "../../store";
import {
  ReceiptPercentIcon,
  MagnifyingGlassIcon,
  ChartBarIcon,
  CalendarDaysIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { IndianRupeeIcon, ShoppingBagIcon } from "lucide-react";

export default function Bills() {
  const API_URL = import.meta.env.VITE_API_URL;
  const { selectedBranch } = useAppSelector((s) => s.branch);
  const { user, token } = useAppSelector((s) => s.auth);
  const [search, setSearch] = useState("");
  const [bills, setBills] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [selectedBill, setSelectedBill] = useState<any>(null);
  const rowsPerPage = 10;

  useEffect(() => {
    const controller = new AbortController();
    fetchBills(controller.signal);
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBranch?.id, dateFrom, dateTo]);

  const fetchBills = async (signal?: AbortSignal) => {
    if (!selectedBranch?.id || !user?.restaurantId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      // The date filter below used to be purely client-side, re-filtering
      // whatever the backend happened to return — but the backend had no
      // date bound of its own and was capped to the 200 most recent bills,
      // so a selected range earlier than that cutoff would silently show
      // nothing rather than the real (missing) data. Passing from/to
      // through makes the backend apply a real date filter instead.
      const params = new URLSearchParams();
      if (dateFrom) params.set("from", dateFrom);
      if (dateTo) params.set("to", dateTo);
      const qs = params.toString();
      const res = await fetch(
        `${API_URL}/api/bills/${user.restaurantId}/${selectedBranch.id}/branchwise${qs ? `?${qs}` : ""}`,
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

  const filtered = bills.filter((b) => {
    const s = search.toLowerCase();
    const customerName =
      typeof b.customer === "string" ? b.customer : b.customer?.name || "";
    const customerPhone = b.customerPhone || b.customer?.phone || "";
    const billStatus = b.paymentStatus || b.status || "";
    const matchesSearch =
      customerName.toLowerCase().includes(s) ||
      customerPhone.includes(search) ||
      (b.paymentMethod || "").toLowerCase().includes(s) ||
      (b.orderType || "").toLowerCase().includes(s) ||
      String(b.total).includes(search) ||
      String(b.id).includes(search);
    const matchesStatus = statusFilter === "ALL" || billStatus === statusFilter;
    const billDate = b.createdAt ? new Date(b.createdAt) : null;
    const matchesFrom =
      !dateFrom || (billDate && billDate >= new Date(dateFrom));
    const matchesTo =
      !dateTo || (billDate && billDate <= new Date(dateTo + "T23:59:59"));
    return matchesSearch && matchesStatus && matchesFrom && matchesTo;
  });

  const totalPages = Math.max(Math.ceil(filtered.length / rowsPerPage), 1);
  const paginated = filtered.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage,
  );
  const activeBills = filtered.filter(
    (b) => (b.paymentStatus || b.status) !== "CANCELLED",
  );
  // Revenue/Avg Bill must count only PAID bills — matching the definition
  // used everywhere else in the app (Finance Engine, Dashboard, Insights).
  // "Bills" (activeBills.length below) intentionally still includes
  // unpaid/pending transactions and in-progress kitchen orders, since this
  // page's own job is showing what needs to be collected/completed, not
  // just what's already been paid.
  const paidBills = filtered.filter(
    (b) => (b.paymentStatus || b.status) === "PAID",
  );
  const totalSales = paidBills.reduce((s, b) => s + (b.total || 0), 0);
  const avgBill = paidBills.length
    ? Math.round(totalSales / paidBills.length)
    : 0;

  const AVATAR_GRADS = [
    "from-red-500 to-pink-500",
    "from-blue-500 to-indigo-500",
    "from-emerald-500 to-teal-500",
    "from-orange-500 to-amber-500",
    "from-violet-500 to-purple-500",
  ];
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
      <div className="mx-auto flex w-full flex-col gap-3">
        {/* ── HEADER ─────────────────────────────────────── */}
        <div className="relative overflow-hidden rounded-xl border border-gray-200 bg-white px-5 py-4 shadow-sm">
          <div className="absolute -right-10 -top-10 h-24 w-24 rounded-full bg-red-100/50 blur-3xl" />
          <div className="relative z-10 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#b10000] shadow-sm">
                <ReceiptPercentIcon className="h-4 w-4 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-black tracking-tight text-gray-900">
                  Billing Overview
                </h1>
                <p className="mt-0.5 text-[12px] text-gray-500">
                  Revenue, payments and transaction history
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                {
                  label: "Revenue",
                  value: `₹${totalSales.toLocaleString()}`,
                  icon: IndianRupeeIcon,
                  cls: "border-emerald-100 bg-emerald-50",
                  val: "text-emerald-700",
                  icon_bg: "bg-emerald-100",
                  icon_cls: "text-emerald-600",
                },
                {
                  label: "Bills",
                  value: activeBills.length,
                  icon: ShoppingBagIcon,
                  cls: "border-blue-100 bg-blue-50",
                  val: "text-blue-700",
                  icon_bg: "bg-blue-100",
                  icon_cls: "text-blue-600",
                },
                {
                  label: "Avg Bill",
                  value: `₹${avgBill.toLocaleString()}`,
                  icon: ChartBarIcon,
                  cls: "border-orange-100 bg-orange-50",
                  val: "text-orange-700",
                  icon_bg: "bg-orange-100",
                  icon_cls: "text-orange-600",
                },
                {
                  label: "Paid",
                  value: filtered.filter(
                    (b) => (b.paymentStatus || b.status) === "PAID",
                  ).length,
                  icon: CalendarDaysIcon,
                  cls: "border-violet-100 bg-violet-50",
                  val: "text-violet-700",
                  icon_bg: "bg-violet-100",
                  icon_cls: "text-violet-600",
                },
              ].map((k) => {
                const Icon = k.icon;
                return (
                  <div
                    key={k.label}
                    className={`flex items-center gap-2 rounded-xl border px-2.5 py-1.5 shadow-sm ${k.cls}`}
                  >
                    <div
                      className={`flex h-6 w-6 items-center justify-center rounded-lg ${k.icon_bg}`}
                    >
                      <Icon className={`h-3 w-3 ${k.icon_cls}`} />
                    </div>
                    <div>
                      <p
                        className={`text-[8px] font-bold uppercase tracking-[0.12em] ${k.val} opacity-70`}
                      >
                        {k.label}
                      </p>
                      <p
                        className={`text-[13px] font-black leading-none ${k.val}`}
                      >
                        {k.value}
                      </p>
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
                <div className="inline-flex rounded-full bg-[#b10000]/10 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.18em] text-[#b10000]">
                  Transactions
                </div>
                <h2 className="mt-1.5 text-[17px] font-bold text-gray-900">
                  Recent Bills
                </h2>
                <p className="mt-0.5 text-[11px] text-gray-500">
                  Billing history · {filtered.length} records · click a row to
                  view details
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-2.5 h-9">
                  <CalendarDaysIcon className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => {
                      setDateFrom(e.target.value);
                      setPage(1);
                    }}
                    className="text-[12px] text-gray-700 outline-none bg-transparent"
                  />
                  <span className="text-[11px] text-gray-300">—</span>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => {
                      setDateTo(e.target.value);
                      setPage(1);
                    }}
                    className="text-[12px] text-gray-700 outline-none bg-transparent"
                  />
                  {(dateFrom || dateTo) && (
                    <button
                      onClick={() => {
                        setDateFrom("");
                        setDateTo("");
                        setPage(1);
                      }}
                      className="ml-1 text-[10px] font-bold text-gray-400 hover:text-red-500 transition"
                    >
                      ✕
                    </button>
                  )}
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setPage(1);
                  }}
                  className="h-9 rounded-xl border border-gray-200 bg-white px-3 text-[12px] text-gray-700 outline-none transition focus:border-red-400 focus:ring-2 focus:ring-red-100"
                >
                  <option value="ALL">All Status</option>
                  <option value="PAID">Paid</option>
                  <option value="UNPAID">Unpaid</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
                  <input
                    placeholder="Search by customer, amount, type..."
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setPage(1);
                    }}
                    className="h-9 w-full rounded-xl border border-gray-200 bg-white pl-8 pr-3 text-[12px] outline-none transition focus:border-red-400 focus:ring-2 focus:ring-red-100 lg:w-64"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full text-[12px]">
              <thead className="bg-gray-50">
                <tr className="border-b border-gray-100">
                  {[
                    "Bill",
                    "Customer",
                    "Order Type",
                    "Payment",
                    "Amount",
                    "Status",
                    "Date & Time",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginated.length > 0 ? (
                  paginated.map((b: any) => {
                    const custName =
                      typeof b.customer === "string"
                        ? b.customer
                        : b.customer?.name || "Guest";
                    const custPhone =
                      b.customerPhone || b.customer?.phone || "—";
                    const billStatus = b.paymentStatus || b.status || "—";
                    const billNo = b.billNo || b.orderNo || `#${b.id}`;
                    const grad =
                      AVATAR_GRADS[
                        (custName.charCodeAt(0) || 0) % AVATAR_GRADS.length
                      ];
                    return (
                      <tr
                        key={b.id}
                        onClick={() => setSelectedBill(b)}
                        className="cursor-pointer border-b border-gray-50 transition hover:bg-red-50/40"
                      >
                        <td className="px-4 py-2.5">
                          <p className="font-bold text-gray-900">{billNo}</p>
                          <p className="text-[10px] text-gray-400">
                            ID #{b.id}
                          </p>
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-2">
                            <div
                              className={`flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br ${grad} text-[10px] font-bold text-white`}
                            >
                              {custName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">
                                {custName}
                              </p>
                              <p className="text-[10px] text-gray-400">
                                {custPhone}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-2.5">
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${ORDER_BADGE[b.orderType] || "bg-gray-100 text-gray-600"}`}
                          >
                            {(b.orderType || "—").replace("_", " ")}
                          </span>
                        </td>
                        <td className="px-4 py-2.5">
                          <span className="inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-600">
                            {b.paymentMethod || "—"}
                          </span>
                        </td>
                        <td className="px-4 py-2.5">
                          <p className="font-bold text-emerald-600">
                            ₹{Number(b.total || 0).toLocaleString()}
                          </p>
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="flex flex-col gap-1">
                            <span
                              className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                billStatus === "PAID"
                                  ? "bg-emerald-50 text-emerald-600"
                                  : billStatus === "CANCELLED"
                                    ? "bg-red-50 text-[#b10000]"
                                    : "bg-yellow-50 text-yellow-600"
                              }`}
                            >
                              {billStatus}
                            </span>
                            {b.orderStatus && (
                              <span
                                className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                  b.orderStatus === "COMPLETED"
                                    ? "bg-blue-50 text-blue-600"
                                    : b.orderStatus === "ACTIVE"
                                      ? "bg-orange-50 text-orange-600"
                                      : "bg-gray-100 text-gray-600"
                                }`}
                              >
                                {b.orderStatus}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-2.5">
                          <p className="text-[12px] font-medium text-gray-700">
                            {new Date(b.createdAt).toLocaleDateString("en-IN")}
                          </p>
                          <p className="text-[10px] text-gray-400">
                            {new Date(b.createdAt).toLocaleTimeString("en-IN", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan={7}
                      className="py-16 text-center text-[12px] text-gray-400"
                    >
                      {search
                        ? "No bills match your search"
                        : "No bills found for this branch"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-gray-100 px-5 py-3">
            <p className="text-[11px] text-gray-500">
              Showing{" "}
              <span className="font-semibold text-gray-700">
                {paginated.length}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-gray-700">
                {filtered.length}
              </span>{" "}
              bills
            </p>
            <div className="flex items-center gap-1.5">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Previous
              </button>
              <div className="rounded-xl border border-gray-200 bg-gray-100 px-3 py-1.5 text-[11px] font-bold text-gray-700">
                {page} / {totalPages}
              </div>
              <button
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── BILL DETAIL DRAWER ───────────────────────── */}
      {selectedBill && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="flex-1 bg-black/40 backdrop-blur-sm"
            onClick={() => setSelectedBill(null)}
          />
          {/* Panel */}
          <div className="flex h-full w-full max-w-md flex-col overflow-hidden bg-white shadow-2xl">
            {/* Drawer header */}
            <div className="flex items-center justify-between border-b border-gray-100 bg-white px-5 py-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#b10000]">
                  Bill Details
                </p>
                <h2 className="mt-0.5 text-[17px] font-black text-gray-900">
                  {selectedBill.billNo ||
                    selectedBill.orderNo ||
                    `#${selectedBill.id}`}
                </h2>
              </div>
              <button
                onClick={() => setSelectedBill(null)}
                className="flex h-8 w-8 items-center justify-center rounded-xl border border-gray-200 text-gray-400 transition hover:border-red-300 hover:bg-red-50 hover:text-red-500"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {/* Meta info */}
              <div className="grid grid-cols-2 gap-3 border-b border-gray-100 px-5 py-4">
                {[
                  {
                    label: "Customer",
                    value:
                      typeof selectedBill.customer === "string"
                        ? selectedBill.customer
                        : selectedBill.customer?.name || "Walk-in",
                  },
                  {
                    label: "Phone",
                    value:
                      selectedBill.customerPhone ||
                      selectedBill.customer?.phone ||
                      "—",
                  },
                  {
                    label: "Order Type",
                    value: (selectedBill.orderType || "—").replace("_", " "),
                  },
                  {
                    label: "Payment",
                    value: selectedBill.paymentMethod || "—",
                  },
                  {
                    label: "Status",
                    value:
                      selectedBill.paymentStatus || selectedBill.status || "—",
                  },
                  {
                    label: "Date",
                    value: selectedBill.createdAt
                      ? new Date(selectedBill.createdAt).toLocaleString(
                          "en-IN",
                          {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          },
                        )
                      : "—",
                  },
                ].map((f) => (
                  <div key={f.label}>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-400">
                      {f.label}
                    </p>
                    <p className="mt-0.5 text-[12px] font-semibold text-gray-800">
                      {f.value}
                    </p>
                  </div>
                ))}
              </div>

              {/* Items */}
              <div className="px-5 py-4">
                <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.16em] text-gray-400">
                  Items Ordered
                </p>
                {(selectedBill.items || []).length === 0 ? (
                  <p className="text-[12px] text-gray-400">No items found</p>
                ) : (
                  <div className="flex flex-col gap-1.5">
                    {/* Header row */}
                    <div className="grid grid-cols-[1fr_48px_72px_72px] gap-2 pb-1.5 border-b border-gray-100">
                      {["Item", "Qty", "Price", "Total"].map((h) => (
                        <p
                          key={h}
                          className="text-[10px] font-bold uppercase tracking-[0.12em] text-gray-400 last:text-right"
                        >
                          {h}
                        </p>
                      ))}
                    </div>
                    {(selectedBill.items || []).map(
                      (item: any, idx: number) => (
                        <div
                          key={item.id ?? idx}
                          className="grid grid-cols-[1fr_48px_72px_72px] gap-2 rounded-lg px-0 py-1.5 items-center"
                        >
                          <p className="text-[12px] font-semibold text-gray-800 leading-tight">
                            {item.itemName || item.name || "—"}
                          </p>
                          <p className="text-[12px] text-gray-500 text-center">
                            ×{item.quantity}
                          </p>
                          <p className="text-[12px] text-gray-500 text-right">
                            ₹{Number(item.price || 0).toLocaleString()}
                          </p>
                          <p className="text-[12px] font-semibold text-gray-800 text-right">
                            ₹{Number(item.total || 0).toLocaleString()}
                          </p>
                        </div>
                      ),
                    )}
                  </div>
                )}
              </div>

              {/* Financial summary */}
              <div className="border-t border-gray-100 px-5 py-4">
                <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.16em] text-gray-400">
                  Bill Summary
                </p>
                <div className="flex flex-col gap-2">
                  {[
                    { label: "Subtotal", value: selectedBill.subtotal },
                    selectedBill.discount > 0 && {
                      label: "Discount",
                      value: -selectedBill.discount,
                      cls: "text-emerald-600",
                    },
                    selectedBill.gst > 0 && {
                      label: "GST",
                      value: selectedBill.gst,
                    },
                    (selectedBill.cgst > 0 || selectedBill.sgst > 0) && {
                      label: `CGST / SGST`,
                      value:
                        (selectedBill.cgst || 0) + (selectedBill.sgst || 0),
                    },
                    selectedBill.serviceCharge > 0 && {
                      label: "Service Charge",
                      value: selectedBill.serviceCharge,
                    },
                    selectedBill.packingCharge > 0 && {
                      label: "Packing Charge",
                      value: selectedBill.packingCharge,
                    },
                  ]
                    .filter(Boolean)
                    .map((row: any) => (
                      <div
                        key={row.label}
                        className="flex items-center justify-between"
                      >
                        <p className="text-[12px] text-gray-500">{row.label}</p>
                        <p
                          className={`text-[12px] font-semibold ${row.cls || "text-gray-800"}`}
                        >
                          {row.value < 0 ? "−" : ""}₹
                          {Math.abs(Number(row.value || 0)).toLocaleString()}
                        </p>
                      </div>
                    ))}

                  <div className="mt-1 flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2.5">
                    <p className="text-[13px] font-black text-gray-900">
                      Total
                    </p>
                    <p className="text-[15px] font-black text-[#b10000]">
                      ₹{Number(selectedBill.total || 0).toLocaleString()}
                    </p>
                  </div>

                  {selectedBill.notes && (
                    <div className="mt-1 rounded-xl border border-gray-100 bg-yellow-50/60 px-3 py-2">
                      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-yellow-600">
                        Notes
                      </p>
                      <p className="mt-0.5 text-[12px] text-gray-700">
                        {selectedBill.notes}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
