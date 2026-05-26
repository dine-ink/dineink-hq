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
  CalendarDaysIcon,
} from "@heroicons/react/24/outline";
import { IndianRupeeIcon } from "lucide-react";

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
    <main className="h-full rounded-md border border-white/40 bg-gray-50/80 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-4">
        {/* ================= HERO ================= */}

        <div className="relative overflow-hidden rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
          {/* GLOW */}
          <div className="absolute -right-10 -top-10 h-24 w-24 rounded-full bg-red-100/50 blur-3xl" />

          <div className="relative z-10 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            {/* LEFT */}
            <div className="flex items-center gap-3">
              {/* ICON */}
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-pink-500 shadow-sm">
                <ReceiptPercentIcon className="h-4 w-4 text-white" />
              </div>

              {/* CONTENT */}
              <div>
                {/* TITLE */}
                <h1 className="text-[20px] font-black leading-none tracking-tight text-gray-900">
                  Billing Overview
                </h1>

                {/* SUBTITLE */}
                <p className="mt-1 text-[12px] text-gray-500">
                  Revenue, payments and billing analytics
                </p>
              </div>
            </div>

            {/* RIGHT KPI CHIPS */}

            <div className="flex flex-wrap items-center gap-1.5">
              {/* REVENUE */}
              <div className="flex items-center gap-2 rounded-lg border border-emerald-100 bg-emerald-50 px-2.5 py-1.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100">
                  <IndianRupeeIcon className="h-3.5 w-3.5 text-emerald-600" />
                </div>

                <div>
                  <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-emerald-400">
                    Revenue
                  </p>

                  <p className="text-[14px] font-black leading-none text-emerald-700">
                    ₹{totalSales.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* ORDERS */}
              <div className="flex items-center gap-2 rounded-lg border border-blue-100 bg-blue-50 px-2.5 py-1.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100">
                  <ReceiptPercentIcon className="h-3.5 w-3.5 text-blue-600" />
                </div>

                <div>
                  <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-blue-400">
                    Orders
                  </p>

                  <p className="text-[14px] font-black leading-none text-blue-700">
                    {totalOrders}
                  </p>
                </div>
              </div>

              {/* AVG BILL */}
              <div className="flex items-center gap-2 rounded-lg border border-orange-100 bg-orange-50 px-2.5 py-1.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-100">
                  <ChartBarIcon className="h-3.5 w-3.5 text-orange-600" />
                </div>

                <div>
                  <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-orange-400">
                    Avg Bill
                  </p>

                  <p className="text-[14px] font-black leading-none text-orange-700">
                    ₹{Math.round(avg).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* RANGE */}
              <div className="flex items-center gap-2 rounded-lg border border-red-100 bg-red-50 px-2.5 py-1.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-100">
                  <CalendarDaysIcon className="h-3.5 w-3.5 text-red-600" />
                </div>

                <div>
                  <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-red-400">
                    Range
                  </p>

                  <p className="text-[14px] font-black leading-none text-red-700">
                    {dateRange === "today"
                      ? "Today"
                      : dateRange === "7days"
                        ? "7 Days"
                        : "30 Days"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ================= TABLE ================= */}

        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          {/* HEADER */}

          <div className="border-b border-gray-100 px-4 py-3">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              {/* LEFT */}
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-red-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-red-600">
                  Transactions
                </div>

                <h2 className="mt-2 text-[20px] font-black text-gray-900">
                  Recent Bills
                </h2>

                <p className="mt-1 text-[12px] text-gray-500">
                  Billing history and payment analytics
                </p>
              </div>

              {/* SEARCH */}

              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

                <input
                  placeholder="Search bills..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-10 w-full rounded-xl border border-gray-200 bg-white pl-9 pr-3 text-[13px] outline-none transition-all focus:border-red-400 lg:w-60"
                />
              </div>
            </div>
          </div>

          {/* TABLE */}

          <div className="overflow-x-auto">
            <table className="min-w-full text-[13px]">
              {/* TABLE HEAD */}

              <thead className="bg-gray-50">
                <tr className="border-b border-gray-100">
                  {[
                    "Bill",
                    "Customer",
                    "Order",
                    "Payment",
                    "Amount",
                    "Status",
                    "Date",
                  ].map((header) => (
                    <th
                      key={header}
                      className="px-4 py-2 text-left text-[10px] font-bold uppercase tracking-[0.16em] text-gray-400"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>

              {/* TABLE BODY */}

              <tbody>
                {paginatedBills.map((b: any) => (
                  <tr
                    key={b.id}
                    className="border-b border-gray-100 transition-all hover:bg-gray-50/60"
                  >
                    {/* BILL */}

                    <td className="px-4 py-2">
                      <div>
                        <div className="font-semibold text-gray-900">
                          {b.billNo || `#${b.id}`}
                        </div>

                        <div className="text-[10px] text-gray-400">#{b.id}</div>
                      </div>
                    </td>

                    {/* CUSTOMER */}

                    <td className="px-4 py-2">
                      <div className="flex items-center gap-2.5">
                        {/* AVATAR */}

                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-red-500 to-pink-500 text-[11px] font-bold text-white">
                          {b.customer?.name?.charAt(0) || "C"}
                        </div>

                        {/* INFO */}

                        <div>
                          <div className="font-medium text-gray-900">
                            {b.customer?.name || "-"}
                          </div>

                          <div className="text-[10px] text-gray-400">
                            {b.customer?.phone || "-"}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* ORDER */}

                    <td className="px-4 py-2">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          b.orderType === "DINE_IN"
                            ? "bg-blue-50 text-blue-600"
                            : b.orderType === "ONLINE"
                              ? "bg-violet-50 text-violet-600"
                              : "bg-orange-50 text-orange-600"
                        }`}
                      >
                        {b.orderType?.replace("_", " ")}
                      </span>
                    </td>

                    {/* PAYMENT */}

                    <td className="px-4 py-2">
                      <span className="inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-600">
                        {b.paymentMethod}
                      </span>
                    </td>

                    {/* AMOUNT */}

                    <td className="px-4 py-2">
                      <div>
                        <div className="font-bold text-emerald-600">
                          ₹{b.total?.toLocaleString()}
                        </div>

                        <div className="text-[10px] text-gray-400">
                          GST ₹{b.gst || 0}
                        </div>
                      </div>
                    </td>

                    {/* STATUS */}

                    <td className="px-4 py-2">
                      <div className="flex items-center gap-1.5">
                        {/* PAYMENT STATUS */}

                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                            b.status === "PAID"
                              ? "bg-emerald-50 text-emerald-600"
                              : "bg-yellow-50 text-yellow-600"
                          }`}
                        >
                          {b.status}
                        </span>

                        {/* ORDER STATUS */}

                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                            b.orderStatus === "COMPLETED"
                              ? "bg-blue-50 text-blue-600"
                              : b.orderStatus === "ACTIVE"
                                ? "bg-orange-50 text-orange-600"
                                : "bg-red-50 text-red-600"
                          }`}
                        >
                          {b.orderStatus}
                        </span>
                      </div>
                    </td>

                    {/* DATE */}

                    <td className="px-4 py-2">
                      <div>
                        <div className="text-[12px] font-medium text-gray-700">
                          {new Date(b.createdAt).toLocaleDateString("en-IN")}
                        </div>

                        <div className="text-[10px] text-gray-400">
                          {new Date(b.createdAt).toLocaleTimeString("en-IN", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* FOOTER */}

          <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3">
            <p className="text-[12px] text-gray-500">
              Showing{" "}
              <span className="font-semibold text-gray-700">
                {paginatedBills.length}
              </span>{" "}
              bills
            </p>

            <div className="flex items-center gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
                className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-[12px] font-semibold text-gray-700 transition-all hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Previous
              </button>

              <div className="rounded-lg bg-red-50 px-3 py-1.5 text-[12px] font-semibold text-red-600">
                {page} / {totalPages}
              </div>

              <button
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
                className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-[12px] font-semibold text-gray-700 transition-all hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
