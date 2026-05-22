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
    <main className="min-h-screen flex-1 rounded-tl-3xl border border-white/40 bg-gray-50/80 px-6 py-6 backdrop-blur-xl">
      <div className="mx-auto w-full max-w-[1600px] space-y-5">
        {/* ================= HERO HEADER ================= */}

        <div className="relative overflow-hidden rounded-[32px] border border-white/40 bg-gradient-to-br from-white via-white to-red-50 p-5 shadow-[0_10px_40px_rgba(0,0,0,0.06)]">
          {/* GLOW */}

          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-red-100 blur-3xl"></div>

          <div className="relative z-10 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            {/* LEFT */}

            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-gradient-to-br from-red-500 to-pink-500 shadow-[0_10px_30px_rgba(255,0,80,0.25)]">
                <UsersIcon className="h-7 w-7 text-white" />
              </div>

              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-red-100 bg-white/80 px-4 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-red-600 shadow-sm">
                  <div className="h-2 w-2 animate-pulse rounded-full bg-red-500"></div>
                  Customer Intelligence
                </div>

                <h1 className="mt-2 text-[40px] font-bold tracking-tight text-gray-900">
                  Customer Overview
                </h1>

                <p className="mt-1 max-w-2xl text-[15px] leading-7 text-gray-500">
                  Monitor repeat customers, spending behaviour, visit analytics
                  and customer engagement across your restaurant branches.
                </p>
              </div>
            </div>

            {/* RIGHT */}

            <div className="flex items-center gap-3">
              <Dropdown
                value={dateRange}
                onChange={setDateRange}
                options={[
                  {
                    label: "All Time",
                    value: "all",
                  },
                  {
                    label: "7 Days",
                    value: "7days",
                  },
                  {
                    label: "30 Days",
                    value: "30days",
                  },
                ]}
              />
            </div>
          </div>

          {/* KPI STRIP */}

          <div className="mt-5  ">
            <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
              {stats.map((stat) => {
                const Icon = stat.icon;

                return (
                  <div
                    key={stat.name}
                    className="group relative overflow-hidden rounded-[28px] border border-white/40 bg-white/90 px-5 py-4 shadow-[0_8px_30px_rgba(0,0,0,0.05)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_15px_40px_rgba(255,0,80,0.08)]"
                  >
                    {/* GLOW */}

                    <div
                      className={`absolute -right-10 -top-10 h-28 w-28 rounded-full blur-3xl ${stat.bg}`}
                    ></div>

                    <div className="relative z-10 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                          {stat.name}
                        </p>

                        <p
                          className={`mt-2 text-[34px] font-bold tracking-tight ${stat.text}`}
                        >
                          {stat.value}
                        </p>
                      </div>

                      <div
                        className={`flex h-14 w-14 items-center justify-center rounded-2xl ${stat.bg}`}
                      >
                        <Icon className={`h-7 w-7 ${stat.text}`} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ================= CUSTOMER TABLE ================= */}

        <div className="overflow-hidden rounded-[32px] border border-white/40 bg-white/80 shadow-[0_8px_30px_rgba(0,0,0,0.05)] backdrop-blur-xl">
          {/* HEADER */}

          <div className="border-b border-gray-100 px-6 py-4">
            <div className="flex items-center justify-between gap-4">
              {/* LEFT */}

              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-red-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-red-600">
                  Analytics Table
                </div>

                <h2 className="mt-3 text-2xl font-bold text-gray-900">
                  Customer Insights
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Customer list, visit frequency, spending pattern & engagement
                  analytics
                </p>
              </div>

              {/* SEARCH */}

              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

                <input
                  placeholder="Search customer..."
                  className="h-[46px] w-72 rounded-2xl border border-gray-200 bg-white/90 pl-10 pr-4 text-sm shadow-sm outline-none transition-all duration-200 focus:border-red-400 focus:shadow-[0_0_0_4px_rgba(255,0,80,0.05)]"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* TABLE */}

          <CommonTable
            title=""
            subtitle=""
            data={paginatedCustomers}
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
            columns={[
              {
                header: "Customer",
                key: "name",

                render: (c) => (
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500 to-pink-500 text-sm font-bold text-white shadow-sm">
                      {c.name?.charAt(0)}
                    </div>

                    <div>
                      <p className="font-semibold text-gray-900">{c.name}</p>

                      <p className="text-xs text-gray-400">Customer profile</p>
                    </div>
                  </div>
                ),
              },

              {
                header: "Phone",
                key: "phone",

                render: (c) => (
                  <div className="text-sm font-medium text-gray-700">
                    {c.phone}
                  </div>
                ),
              },

              {
                header: "Visits",
                key: "visits",

                render: (c) => (
                  <div className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600">
                    {c.visits} Visits
                  </div>
                ),
              },

              {
                header: "Spend",
                key: "spend",

                render: (c) => (
                  <p className="font-semibold text-emerald-600">₹{c.spend}</p>
                ),
              },

              {
                header: "Last Visit",
                key: "lastVisit",

                render: (c) => (
                  <div className="text-sm text-gray-500">
                    {c.lastVisit
                      ? new Date(c.lastVisit).toLocaleDateString()
                      : "-"}
                  </div>
                ),
              },

              {
                header: "Action",
                key: "action",

                render: (c) => (
                  <div className="flex justify-end">
                    <button
                      onClick={() => setSelectedCustomer(c)}
                      className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gray-100 transition hover:bg-red-50"
                    >
                      <EyeIcon className="h-4 w-4 text-gray-600 hover:text-red-600" />
                    </button>
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
