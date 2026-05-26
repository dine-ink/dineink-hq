import { useState, useEffect } from "react";
import Dropdown from "../../components/common/Dropdown";
import CommonTable from "@/components/common/CommonTable";

import {
  EyeIcon,
  UsersIcon,
  ArrowPathRoundedSquareIcon,
  CurrencyRupeeIcon,
  ChartBarIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import { BarChart3Icon, IndianRupeeIcon, RepeatIcon } from "lucide-react";

export default function Customers() {
  const branches = JSON.parse(localStorage.getItem("branches") || "[]");
  const [selectedBranch, setSelectedBranch] = useState<any>(() => {
    const savedBranch = localStorage.getItem("selectedBranch");

    if (savedBranch) {
      return JSON.parse(savedBranch);
    }

    return branches[0] || null;
  });
  const [dateRange, setDateRange] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [customers, setCustomers] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const rowsPerPage = 5;
  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search),
  );
  const API_URL = import.meta.env.VITE_API_URL;
  const totalPages = Math.ceil(filtered.length / rowsPerPage);
  const paginatedCustomers = filtered.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage,
  );
  // ================= STATS =================
  const total = filtered.length;
  const repeat = filtered.filter((c) => c.visits > 1).length;
  const revenue = filtered.reduce((s, c) => s + c.spend, 0);
  const avg = total ? Math.round(revenue / total) : 0;
  const stats = [
    {
      name: "Customers",
      value: total,
      icon: UsersIcon,
      color: "from-blue-500 to-indigo-500",
      text: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      name: "Repeat",
      value: repeat,
      icon: ArrowPathRoundedSquareIcon,
      color: "from-emerald-500 to-teal-500",
      text: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      name: "Avg Spend",
      value: `₹${avg}`,
      icon: CurrencyRupeeIcon,
      color: "from-orange-500 to-amber-500",
      text: "text-orange-600",
      bg: "bg-orange-50",
    },
    {
      name: "Revenue",
      value: `₹${revenue}`,
      icon: ChartBarIcon,
      color: "from-red-500 to-pink-500",
      text: "text-red-600",
      bg: "bg-red-50",
    },
  ];

  useEffect(() => {
    fetchCustomers();
  }, [selectedBranch]);

  const fetchCustomers = async () => {
    try {
      const token = localStorage.getItem("token");
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      if (!selectedBranch?.id) return;

      let url = `${API_URL}/api/customers/${user.restaurantId}/${selectedBranch.id}/customerByBranch`;
      // 🔥 ADD BRANCH FILTER
      if (selectedBranch.id !== 0) {
        url += `?branchId=${selectedBranch.id}`;
      }
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data.success) {
        setCustomers(data.customers);
      }
    } catch (err) {
      console.log(err);
    }
  };
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
    <main className="h-full flex-1 overflow-auto rounded-md border border-white/40 bg-gray-50/70 backdrop-blur-xl">
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
                <UsersIcon className="h-4 w-4 text-white" />
              </div>

              {/* CONTENT */}
              <div>
                {/* TITLE */}
                <h1 className="text-[20px] font-black leading-none tracking-tight text-gray-900">
                  Customer Overview
                </h1>

                {/* SUBTITLE */}
                <p className="mt-1 text-[12px] text-gray-500">
                  Monitor repeat customers and spending analytics
                </p>
              </div>
            </div>

            {/* RIGHT KPI CHIPS */}

            <div className="flex flex-wrap items-center gap-1.5">
              {/* TOTAL CUSTOMERS */}
              <div className="flex items-center gap-2 rounded-lg border border-blue-100 bg-blue-50 px-2.5 py-1.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100">
                  <UsersIcon className="h-3.5 w-3.5 text-blue-600" />
                </div>

                <div>
                  <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-blue-400">
                    Customers
                  </p>

                  <p className="text-[14px] font-black leading-none text-blue-700">
                    {total || 0}
                  </p>
                </div>
              </div>

              {/* REPEAT */}
              <div className="flex items-center gap-2 rounded-lg border border-emerald-100 bg-emerald-50 px-2.5 py-1.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100">
                  <RepeatIcon className="h-3.5 w-3.5 text-emerald-600" />
                </div>

                <div>
                  <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-emerald-400">
                    Repeat
                  </p>

                  <p className="text-[14px] font-black leading-none text-emerald-700">
                    {repeat}%
                  </p>
                </div>
              </div>

              {/* AVG SPEND */}
              <div className="flex items-center gap-2 rounded-lg border border-orange-100 bg-orange-50 px-2.5 py-1.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-100">
                  <IndianRupeeIcon className="h-3.5 w-3.5 text-orange-600" />
                </div>

                <div>
                  <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-orange-400">
                    Avg Spend
                  </p>

                  <p className="text-[14px] font-black leading-none text-orange-700">
                    ₹{avg}
                  </p>
                </div>
              </div>

              {/* REVENUE */}
              <div className="flex items-center gap-2 rounded-lg border border-red-100 bg-red-50 px-2.5 py-1.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-100">
                  <BarChart3Icon className="h-3.5 w-3.5 text-red-600" />
                </div>

                <div>
                  <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-red-400">
                    Revenue
                  </p>

                  <p className="text-[14px] font-black leading-none text-red-700">
                    ₹{revenue}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ================= TABLE ================= */}
        {/* ================= TABLE ================= */}

        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          {/* HEADER */}

          <div className="border-b border-gray-100 px-4 py-3">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              {/* LEFT */}
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-red-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-red-600">
                  Analytics Table
                </div>

                <h2 className="mt-2 text-[20px] font-black text-gray-900">
                  Customer Insights
                </h2>

                <p className="mt-1 text-[12px] text-gray-500">
                  Visits, spending pattern & engagement analytics
                </p>
              </div>

              {/* SEARCH */}
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

                <input
                  placeholder="Search customer..."
                  className="h-10 w-full rounded-xl border border-gray-200 bg-white pl-10 pr-3 text-[13px] outline-none transition-all focus:border-red-400 lg:w-64"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
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
                      className="px-4 py-2 text-left text-[10px] font-bold uppercase tracking-[0.16em] text-gray-400"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>

              {/* TABLE BODY */}

              <tbody>
                {paginatedCustomers.map((c: any) => {
                  const avgBill = c.visits ? Math.round(c.spend / c.visits) : 0;

                  const preferred = c.bills?.[0]?.orderType || "-";

                  const segment =
                    c.spend > 5000 ? "VIP" : c.visits > 3 ? "Regular" : "New";

                  return (
                    <tr
                      key={c.id}
                      className="border-b border-gray-100 transition-all hover:bg-gray-50/60"
                    >
                      {/* CUSTOMER */}

                      <td className="px-4 py-2">
                        <div className="flex items-center gap-2.5">
                          {/* AVATAR */}

                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-red-500 to-pink-500 text-[11px] font-bold text-white">
                            {c.name?.charAt(0)}
                          </div>

                          {/* INFO */}

                          <div>
                            <p className="text-[13px] font-semibold text-gray-900">
                              {c.name}
                            </p>

                            <p className="text-[11px] text-gray-400">
                              {c.phone}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* VISITS */}

                      <td className="px-4 py-2">
                        <span className="inline-flex rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-600">
                          {c.visits} Visits
                        </span>
                      </td>

                      {/* AVG BILL */}

                      <td className="px-4 py-2">
                        <p className="text-[13px] font-semibold text-gray-800">
                          ₹{avgBill}
                        </p>
                      </td>

                      {/* SPEND */}

                      <td className="px-4 py-2">
                        <p className="text-[13px] font-bold text-emerald-600">
                          ₹{c.spend}
                        </p>
                      </td>

                      {/* PREFERRED */}

                      <td className="px-4 py-2">
                        <span
                          className={`
                    inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold
                    ${
                      preferred === "DINE_IN"
                        ? "bg-blue-50 text-blue-600"
                        : "bg-orange-50 text-orange-600"
                    }
                  `}
                        >
                          {preferred.replace("_", " ")}
                        </span>
                      </td>

                      {/* LAST VISIT */}

                      <td className="px-4 py-2">
                        <div className="text-[12px] text-gray-500">
                          {c.lastVisit
                            ? new Date(c.lastVisit).toLocaleDateString()
                            : "-"}
                        </div>
                      </td>

                      {/* SEGMENT */}

                      <td className="px-4 py-2">
                        <span
                          className={`
                    inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold
                    ${
                      segment === "VIP"
                        ? "bg-purple-50 text-purple-600"
                        : segment === "Regular"
                          ? "bg-blue-50 text-blue-600"
                          : "bg-gray-100 text-gray-600"
                    }
                  `}
                        >
                          {segment}
                        </span>
                      </td>

                      {/* ACTION */}

                      <td className="px-4 py-2">
                        <button
                          onClick={() => setSelectedCustomer(c)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 transition hover:bg-red-50"
                        >
                          <EyeIcon className="h-4 w-4 text-gray-600 hover:text-red-600" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* FOOTER */}

          <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3">
            <p className="text-[12px] text-gray-500">
              Showing{" "}
              <span className="font-semibold text-gray-700">
                {paginatedCustomers.length}
              </span>{" "}
              customers
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
