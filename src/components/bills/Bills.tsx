import { useState, useEffect } from "react";

import Dropdown from "../common/Dropdown";
import CommonTable from "@/components/common/CommonTable";

import {
  CurrencyRupeeIcon,
  ShoppingBagIcon,
  ChartBarIcon,
  MagnifyingGlassIcon,
  CreditCardIcon,
  ReceiptPercentIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";

type Bill = {
  id: number;
  date: string;
  type: "Online" | "Dine-in" | "Takeaway";
  amount: number;
  payment: string;
  customerName: string;
  customerPhone: string;
};

export default function Bills() {
  const API_URL = import.meta.env.VITE_API_URL;
  const [dateRange, setDateRange] = useState("today");
  const [search, setSearch] = useState("");
  const [bills, setBills] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const rowsPerPage = 5;
  const branches = JSON.parse(localStorage.getItem("branches") || "[]");
  const [selectedBranch, setSelectedBranch] = useState<any>(() => {
    const savedBranch = localStorage.getItem("selectedBranch");

    if (savedBranch) {
      return JSON.parse(savedBranch);
    }

    return branches[0] || null;
  });
  useEffect(() => {
    fetchBills();
  }, [selectedBranch]);
  const fetchBills = async () => {
    try {
      const token = localStorage.getItem("token");
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      console.log(user);
      if (!selectedBranch?.id) return;

      const res = await fetch(
        `${API_URL}/api/bills/${user.restaurantId}/${selectedBranch.id}/branchWise`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      const data = await res.json();
      if (data.success) {
        setBills(data.bills);
      }
    } catch (err) {
      console.log(err);
    }
  };

  // ================= FILTER =================

  const filteredBills = bills.filter((b) => {
    const customerName = b.customer?.name || "";
    const customerPhone = b.customer?.phone || "";
    const matchSearch =
      customerName.toLowerCase().includes(search.toLowerCase()) ||
      customerPhone.includes(search) ||
      b.paymentMethod.includes(search.toLowerCase()) ||
      b.orderType?.toLowerCase().includes(search.toLowerCase()) ||
      String(b.total).includes(search) ||
      String(b.id).includes(search);
    return matchSearch;
  });
  const totalPages = Math.ceil(filteredBills.length / rowsPerPage);
  const paginatedBills = filteredBills.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage,
  );

  // ================= STATS =================

  const totalSales = filteredBills.reduce((s, b) => s + b.total, 0);
  const totalOrders = filteredBills.length;
  const avg = totalOrders ? totalSales / totalOrders : 0;
  const stats = [
    {
      name: "Total Sales",
      value: `₹${totalSales.toLocaleString()}`,
      icon: CurrencyRupeeIcon,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      name: "Orders",
      value: totalOrders,
      icon: ShoppingBagIcon,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      name: "Avg Value",
      value: `₹${Math.round(avg).toLocaleString()}`,
      icon: ChartBarIcon,
      color: "text-orange-500",
      bg: "bg-orange-50",
    },
  ];

  const branchOptions = branches.map((b) => ({
    label: b.name,
    value: String(b.id),
  }));

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
  return (
    <main className="min-h-screen rounded-tl-3xl border border-white/40 bg-gray-50/80 px-6 py-6 backdrop-blur-xl">
      <div className="mx-auto space-y-5">
        {/* ================= HERO ================= */}

        <div className="grid grid-cols-1 gap-5">
          <div className="relative min-h-[320px] overflow-hidden rounded-[32px] border border-white/40 bg-gradient-to-br from-white via-white to-red-50 px-5 py-4 shadow-[0_10px_40px_rgba(0,0,0,0.06)]">
            {/* GLOW */}

            <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-red-200/40 blur-3xl"></div>

            <div className="absolute bottom-0 left-0 h-40 w-40 rounded-full bg-pink-100/30 blur-3xl"></div>

            <div className="relative z-10 flex h-full flex-col justify-between gap-3">
              {/* TOP */}

              <div className="flex items-start justify-between gap-6">
                {/* LEFT */}

                <div className="flex items-start gap-5">
                  <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-gradient-to-br from-red-500 to-pink-500 shadow-[0_15px_40px_rgba(255,0,80,0.25)]">
                    <ReceiptPercentIcon className="h-7 w-7 text-white" />
                  </div>

                  <div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-red-100 bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-red-600 backdrop-blur">
                      <div className="h-2 w-2 animate-pulse rounded-full bg-red-500"></div>
                      Billing Intelligence
                    </div>

                    <h1 className="mt-3 text-[34px] font-bold tracking-tight text-gray-900">
                      Billing Overview
                    </h1>

                    <p className="mt-1 max-w-[700px] text-[14px] leading-6 text-gray-500">
                      Real-time restaurant billing analytics & insights across
                      revenue, orders, payments and operational performance.
                    </p>
                  </div>
                </div>

                {/* RIGHT */}

                <div className="relative">
                  <select
                    value={dateRange}
                    onChange={(e) => setDateRange(e.target.value)}
                    className="h-[46px] min-w-[190px] appearance-none rounded-2xl border border-gray-200 bg-white/95 px-5 pr-12 text-sm font-semibold text-gray-700 shadow-[0_4px_15px_rgba(0,0,0,0.04)] outline-none transition-all duration-200 hover:border-red-300 focus:border-red-400 focus:shadow-[0_0_0_4px_rgba(255,0,80,0.06)]"
                  >
                    <option value="today">Today</option>

                    <option value="7days">Last 7 Days</option>

                    <option value="30days">Last 30 Days</option>
                  </select>

                  <ChevronDownIcon className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                </div>
              </div>

              {/* METRICS */}

              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                {/* REVENUE */}

                <div className="rounded-2xl border border-gray-100 bg-white/90 px-4 py-3 shadow-sm">
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                    Revenue
                  </p>

                  <p className="mt-2 text-[26px] font-bold text-emerald-600">
                    ₹{totalSales.toLocaleString()}
                  </p>
                </div>

                {/* ORDERS */}

                <div className="rounded-2xl border border-gray-100 bg-white/90 px-4 py-3 shadow-sm">
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                    Orders
                  </p>

                  <p className="mt-2 text-[26px] font-bold text-blue-600">
                    {totalOrders}
                  </p>
                </div>

                {/* AVG BILL */}

                <div className="rounded-2xl border border-gray-100 bg-white/90 px-4 py-3 shadow-sm">
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                    Avg Bill
                  </p>

                  <p className="mt-2 text-[26px] font-bold text-orange-600">
                    ₹{Math.round(avg).toLocaleString()}
                  </p>
                </div>

                {/* BRANCH */}

                <div className="rounded-2xl border border-gray-100 bg-white/90 px-4 py-3 shadow-sm">
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                    Branch
                  </p>

                  <p className="mt-2 text-[15px] font-bold text-gray-800">
                    {selectedBranch?.name || "Main Branch"}
                  </p>
                </div>
              </div>

              {/* STATUS */}

              <div className="flex flex-wrap items-center gap-3 border-t border-gray-100 pt-3">
                <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-600">
                  <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-500"></div>
                  Live Billing Active
                </div>

                <div className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-3 py-1 text-sm font-semibold text-orange-600">
                  <div className="h-2 w-2 rounded-full bg-orange-500"></div>
                  {totalOrders} Orders Processed
                </div>

                <div className="inline-flex items-center gap-2 rounded-full bg-violet-50 px-3 py-1 text-sm font-semibold text-violet-600">
                  <div className="h-2 w-2 rounded-full bg-violet-500"></div>
                  Real-Time Insights
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ================= TABLE ================= */}

        <div className="overflow-hidden rounded-[28px] border border-white/40 bg-white/80 shadow-[0_8px_30px_rgba(0,0,0,0.05)] backdrop-blur-xl">
          {/* HEADER */}

          <div className="flex flex-col gap-4 border-b border-gray-100 px-6 py-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-red-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-red-600">
                Billing Transactions
              </div>

              <h2 className="mt-3 text-xl font-bold text-gray-900">
                Recent Bills
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                View billing history, payment methods & customer orders
              </p>
            </div>

            {/* SEARCH */}

            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

              <input
                placeholder="Search bills, customers..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-[42px] w-full rounded-2xl border border-gray-200 bg-white pl-10 pr-4 text-sm outline-none transition-all duration-200 focus:border-red-400 focus:shadow-[0_0_0_4px_rgba(255,0,80,0.05)] lg:w-64"
              />
            </div>
          </div>

          {/* TABLE */}

          <CommonTable
            title=""
            subtitle=""
            data={paginatedBills}
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
            columns={[
              {
                header: "Bill",

                key: "bill",

                render: (b) => (
                  <div>
                    <div className="font-semibold text-gray-900">
                      {b.orderNo || `#${b.id}`}
                    </div>

                    <div className="mt-1 text-[11px] text-gray-400">
                      {b.source}
                    </div>
                  </div>
                ),
              },

              {
                header: "Customer",

                key: "customer",

                render: (b) => (
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-pink-500 text-xs font-bold text-white">
                      {b.customer?.name?.charAt(0) || "C"}
                    </div>

                    <div>
                      <div className="font-medium text-gray-900">
                        {b.customer?.name || "-"}
                      </div>

                      <div className="text-[11px] text-gray-400">
                        {b.customer?.phone || "-"}
                      </div>
                    </div>
                  </div>
                ),
              },

              {
                header: "Items",

                key: "items",

                render: (b) => (
                  <div className="max-w-[180px]">
                    <div className="truncate text-sm font-medium text-gray-700">
                      {b.items
                        ?.slice(0, 2)
                        ?.map((i: any) => `${i.itemName} x${i.quantity}`)
                        ?.join(", ")}
                    </div>

                    {b.items?.length > 2 && (
                      <div className="mt-1 text-[11px] text-gray-400">
                        +{b.items.length - 2} more
                      </div>
                    )}
                  </div>
                ),
              },

              {
                header: "Type",

                key: "type",

                render: (b) => (
                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                      b.orderType === "DINE_IN"
                        ? "bg-blue-50 text-blue-600"
                        : b.orderType === "ONLINE"
                          ? "bg-violet-50 text-violet-600"
                          : "bg-orange-50 text-orange-600"
                    }`}
                  >
                    {b.orderType}
                  </span>
                ),
              },

              {
                header: "Amount",

                key: "amount",

                render: (b) => (
                  <div>
                    <div className="font-bold text-emerald-600">
                      ₹{b.total?.toLocaleString()}
                    </div>

                    <div className="mt-1 text-[11px] text-gray-400">
                      {b.paymentMethod}
                    </div>
                  </div>
                ),
              },

              {
                header: "Status",

                key: "status",

                render: (b) => (
                  <div className="flex flex-col gap-1">
                    <span
                      className={`inline-flex w-fit rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                        b.paymentStatus === "PAID"
                          ? "bg-emerald-50 text-emerald-600"
                          : "bg-yellow-50 text-yellow-600"
                      }`}
                    >
                      {b.paymentStatus}
                    </span>

                    <span
                      className={`inline-flex w-fit rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                        b.orderStatus === "COMPLETED"
                          ? "bg-emerald-50 text-emerald-600"
                          : b.orderStatus === "ACTIVE"
                            ? "bg-orange-50 text-orange-600"
                            : "bg-red-50 text-red-600"
                      }`}
                    >
                      {b.orderStatus}
                    </span>
                  </div>
                ),
              },

              {
                header: "Date",

                key: "date",

                render: (b) => (
                  <div>
                    <div className="text-sm font-medium text-gray-700">
                      {new Date(b.createdAt).toLocaleDateString("en-IN")}
                    </div>

                    <div className="mt-1 text-[11px] text-gray-400">
                      {new Date(b.createdAt).toLocaleTimeString("en-IN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                ),
              },
            ]}
          />
        </div>
      </div>
    </main>
  );
}
