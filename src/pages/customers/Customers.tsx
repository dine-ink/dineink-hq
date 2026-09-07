import { useState } from "react";
import { useAppSelector } from "@/store";
import {
  useGetCustomersByBranchQuery,
  useGetCustomerRfmQuery,
} from "@/store/api/customersApi";
import { useGetDashboardOverviewQuery } from "@/store/api/dashboardApi";
import { useGetInsightsSetupQuery } from "@/store/api/insightsApi";
import {
  ArrowPathRoundedSquareIcon,
  CalendarDaysIcon,
  ChartBarIcon,
  ChatBubbleLeftRightIcon,
  CurrencyRupeeIcon,
  EyeIcon,
  MagnifyingGlassIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";
import SendWhatsAppDialog from "@/components/common/SendWhatsAppDialog";
import ResponsiveTable, {
  type ResponsiveColumn,
} from "@/components/common/ResponsiveTable";
import { getCustomerSegment } from "@/utils/customerSegments";

const AVATAR_GRADIENTS = [
  "from-red-500 to-pink-500",
  "from-blue-500 to-indigo-500",
  "from-emerald-500 to-teal-500",
  "from-orange-500 to-amber-500",
  "from-violet-500 to-purple-500",
];

const avatarGradient = (name?: string) =>
  AVATAR_GRADIENTS[(name?.charCodeAt(0) || 0) % AVATAR_GRADIENTS.length];

const avgBillOf = (c: any) => (c.visits ? Math.round(c.spend / c.visits) : 0);

const segmentOf = (c: any) =>
  c.spend > 5000 ? "VIP" : c.visits > 3 ? "Regular" : "New";

const RFM_SEGMENT_COLORS: Record<string, string> = {
  Champion: "bg-emerald-50 text-emerald-700",
  Loyal: "bg-blue-50 text-blue-700",
  Potential: "bg-violet-50 text-violet-700",
  "At Risk": "bg-orange-50 text-orange-700",
  Lost: "bg-red-100 text-red-700",
};

/** A single R, F or M score, coloured by band. */
function RfmScore({ value }: { value: number }) {
  return (
    <span
      className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold ${value >= 4 ? "bg-emerald-100 text-emerald-700" : value === 3 ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`}
    >
      {value}
    </span>
  );
}

/** Name + phone + avatar — the cell that identifies a customer row. */
function CustomerIdentity({ customer }: { customer: any }) {
  return (
    <div className="flex items-center gap-2">
      <div
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-gradient-to-br ${avatarGradient(customer.name)} text-[10px] font-bold text-white`}
      >
        {customer.name?.charAt(0)}
      </div>
      <div className="min-w-0">
        <p className="truncate text-[12px] font-semibold text-gray-900">
          {customer.name}
        </p>
        <p className="text-[9px] text-gray-400">{customer.phone}</p>
      </div>
    </div>
  );
}

export default function Customers() {
  const { selectedBranch } = useAppSelector((s) => s.branch);
  const { user } = useAppSelector((s) => s.auth);
  const [search, setSearch] = useState("");
  const [_selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [messageCustomer, setMessageCustomer] = useState<any>(null);
  const [page, setPage] = useState(1);
  const rowsPerPage = 5;

  /**
   * The two inputs behind LTV:CAC. Neither endpoint is defined here — the
   * overview is dashboardApi's and the Insights setup figures are insightsApi's
   * — so this page reads what Dashboard and Insights have already fetched
   * rather than asking again.
   */
  const mtdWindow = (() => {
    const now = new Date();
    return {
      from: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10),
      to: now.toISOString().slice(0, 10),
    };
  })();

  const scope = {
    restaurantId: user?.restaurantId as number,
    branchId: selectedBranch?.id as number,
  };
  const skip = { skip: !user?.restaurantId || !selectedBranch?.id };

  const { data: mtdAnalytics = null } = useGetDashboardOverviewQuery(
    { ...scope, preset: "month", ...mtdWindow },
    skip,
  );
  const { data: insightsSetup } = useGetInsightsSetupQuery(scope, skip);
  const marketingSpend = Number(insightsSetup?.marketingSpend || 0);

  // The AbortController this replaced was cancelling a superseded request,
  // which the query subscription does itself.
  const { data: customers = [], isFetching: loading } = useGetCustomersByBranchQuery(
    scope,
    skip,
  );
  const filtered = customers.filter(
    (c) =>
      (c.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (c.phone ?? "").includes(search),
  );
  const totalPages = Math.ceil(filtered.length / rowsPerPage);
  const paginatedCustomers = filtered.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage,
  );
  const [activeTab, setActiveTab] = useState<"overview" | "churn" | "rfm">(
    "overview",
  );
  const total = filtered.length;
  const repeat = filtered.filter((c) => c.visits > 1).length;
  const revenue = filtered.reduce((s, c) => s + c.spend, 0);
  const avg = total ? Math.round(revenue / total) : 0;

  // Churn analysis — thresholds live in utils/customerSegments.ts so every
  // screen that segments customers (this page, WhatsApp bulk send) agrees.
  const now = new Date();
  const active = customers.filter((c) => getCustomerSegment(c.lastVisit) === "active");
  const atRisk = customers.filter((c) => getCustomerSegment(c.lastVisit) === "at_risk");
  const churned = customers.filter((c) => getCustomerSegment(c.lastVisit) === "churned");
  const topCustomers = [...customers]
    .sort((a, b) => b.spend - a.spend)
    .slice(0, 10);
  const DAY_MS = 1000 * 60 * 60 * 24;
  const prevWindowStart = new Date(now.getTime() - 60 * DAY_MS);
  const prevWindowEnd = new Date(now.getTime() - 30 * DAY_MS);
  // Cohort-based Churn Rate = customers who purchased in the prior 30-day
  // window but did NOT return in the current 30-day window, ÷ that prior
  // cohort — the standard "lost ÷ start of period" formula, distinct from
  // the recency-bucket "Churned" count above (which is an operational
  // outreach list, not the KPI).
  const cohortCustomers = customers.filter((c) =>
    (c.bills || []).some((b: any) => {
      const t = new Date(b.createdAt).getTime();
      return t >= prevWindowStart.getTime() && t < prevWindowEnd.getTime();
    }),
  );
  const retainedFromCohort = cohortCustomers.filter((c) =>
    (c.bills || []).some(
      (b: any) => new Date(b.createdAt).getTime() >= prevWindowEnd.getTime(),
    ),
  );
  const monthlyChurnRate =
    cohortCustomers.length > 0
      ? (cohortCustomers.length - retainedFromCohort.length) /
        cohortCustomers.length
      : 0;
  const churnRatePercentage = monthlyChurnRate * 100;
  const repeatCustomerRatePercentage = total ? (repeat / total) * 100 : 0;

  // LTV = Avg Annual Revenue per Customer × Avg Customer Lifespan, with
  // lifespan implied by the churn rate (1 ÷ annualized churn) — the standard
  // substitute when true multi-year retention history isn't tracked. This is
  // revenue-based (not profit-based), since per-customer gross margin isn't
  // available here.
  const twelveMoAgo = new Date(now.getTime() - 365 * DAY_MS);
  const billsLast12Mo = customers.flatMap((c) =>
    (c.bills || []).filter(
      (b: any) => new Date(b.createdAt).getTime() >= twelveMoAgo.getTime(),
    ),
  );
  const revenueLast12Mo = billsLast12Mo.reduce(
    (s, b: any) => s + Number(b.total || 0),
    0,
  );
  const customersLast12Mo = customers.filter((c) =>
    (c.bills || []).some(
      (b: any) => new Date(b.createdAt).getTime() >= twelveMoAgo.getTime(),
    ),
  ).length;
  const avgAnnualRevenuePerCustomer =
    customersLast12Mo > 0 ? revenueLast12Mo / customersLast12Mo : 0;
  // Average Visit Frequency = total visits ÷ total customers, over a
  // trailing 12-month window (visits/year, not lifetime average).
  const avgVisitFrequency =
    customersLast12Mo > 0 ? billsLast12Mo.length / customersLast12Mo : 0;
  const annualChurnRate = 1 - Math.pow(1 - monthlyChurnRate, 12);
  const avgLifespanYears = annualChurnRate > 0 ? 1 / annualChurnRate : null;
  const ltv = avgLifespanYears
    ? avgAnnualRevenuePerCustomer * avgLifespanYears
    : avgAnnualRevenuePerCustomer;

  const newCustomersThisMonth = Number(mtdAnalytics?.newCustomersCount || 0);
  const cac =
    newCustomersThisMonth > 0 ? marketingSpend / newCustomersThisMonth : 0;
  const ltvCacRatio = cac > 0 ? ltv / cac : null;


  // Only asked for while its tab is open, which was an early return before.
  const { data: rfmData = null, isFetching: rfmLoading } = useGetCustomerRfmQuery(
    scope,
    { skip: !user?.restaurantId || !selectedBranch?.id || activeTab !== "rfm" },
  );

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

  const customerColumns: ResponsiveColumn<any>[] = [
    {
      header: "Customer",
      primary: true,
      render: (c) => <CustomerIdentity customer={c} />,
    },
    {
      header: "Visits",
      render: (c) => (
        <span className="inline-flex rounded-full bg-blue-50 px-1.5 py-[2px] text-[9px] font-semibold text-blue-600">
          {c.visits} Visits
        </span>
      ),
    },
    {
      header: "Avg Bill",
      render: (c) => (
        <p className="text-[12px] font-semibold text-gray-800">
          ₹{avgBillOf(c)}
        </p>
      ),
    },
    {
      header: "Spend",
      render: (c) => (
        <p className="text-[12px] font-bold text-emerald-600">₹{c.spend}</p>
      ),
    },
    {
      header: "Preferred",
      render: (c) => {
        const preferred = c.preferredOrderType || "-";
        return (
          <span
            className={`inline-flex rounded-full px-1.5 py-[2px] text-[9px] font-semibold ${
              preferred === "DINE_IN"
                ? "bg-blue-50 text-blue-600"
                : "bg-orange-50 text-orange-600"
            }`}
          >
            {preferred.replace("_", " ")}
          </span>
        );
      },
    },
    {
      header: "Last Visit",
      render: (c) => (
        <div className="text-[11px] text-gray-500">
          {c.lastVisit ? new Date(c.lastVisit).toLocaleDateString() : "-"}
        </div>
      ),
    },
    {
      header: "Segment",
      badge: true,
      render: (c) => {
        const segment = segmentOf(c);
        return (
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
        );
      },
    },
    {
      header: "Action",
      footer: true,
      render: (c) => (
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setSelectedCustomer(c)}
            title="View customer"
            className="group flex h-8 w-8 items-center justify-center rounded-md bg-gray-100 transition hover:bg-[#b10000] md:h-7 md:w-7"
          >
            <EyeIcon className="h-3.5 w-3.5 text-gray-600 transition-colors group-hover:text-white" />
          </button>
          <button
            onClick={() => setMessageCustomer(c)}
            title="Send WhatsApp message"
            className="group flex h-8 w-8 items-center justify-center rounded-md bg-gray-100 transition hover:bg-[#b10000] md:h-7 md:w-7"
          >
            <ChatBubbleLeftRightIcon className="h-3.5 w-3.5 text-gray-600 transition-colors group-hover:text-white" />
          </button>
        </div>
      ),
    },
  ];

  const churnedColumns: ResponsiveColumn<any>[] = [
    {
      header: "Customer",
      primary: true,
      render: (c) => (
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-red-100 text-[10px] font-bold text-red-600">
            {c.name?.charAt(0)}
          </div>
          <p className="min-w-0 truncate font-semibold text-gray-900">{c.name}</p>
        </div>
      ),
    },
    {
      header: "Days Since",
      badge: true,
      render: (c) => {
        const daysSince = c.lastVisit
          ? Math.floor(
              (Date.now() - new Date(c.lastVisit).getTime()) / DAY_MS,
            )
          : null;
        return (
          <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-700">
            {daysSince ? `${daysSince}d` : "—"}
          </span>
        );
      },
    },
    {
      header: "Phone",
      render: (c) => <span className="text-gray-500">{c.phone}</span>,
    },
    {
      header: "Total Visits",
      render: (c) => <span className="text-gray-700">{c.visits}</span>,
    },
    {
      header: "Total Spend",
      render: (c) => (
        <span className="font-semibold text-gray-900">
          ₹{Number(c.spend || 0).toLocaleString("en-IN")}
        </span>
      ),
    },
    {
      header: "Last Visit",
      render: (c) => (
        <span className="text-gray-500">
          {c.lastVisit ? new Date(c.lastVisit).toLocaleDateString() : "Never"}
        </span>
      ),
    },
    {
      header: "Avg Bill",
      render: (c) => (
        <span className="text-gray-600">
          ₹{c.visits ? Math.round(c.spend / c.visits) : 0}
        </span>
      ),
    },
  ];

  const rfmColumns: ResponsiveColumn<any>[] = [
    {
      header: "Customer",
      primary: true,
      render: (c) => (
        <div className="min-w-0">
          <p className="truncate font-semibold text-gray-900">{c.name}</p>
          <p className="text-[10px] text-gray-400">{c.phone}</p>
        </div>
      ),
    },
    {
      header: "Segment",
      badge: true,
      render: (c) => (
        <span
          className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${RFM_SEGMENT_COLORS[c.segment] || "bg-gray-100 text-gray-600"}`}
        >
          {c.segment}
        </span>
      ),
    },
    { header: "R Score", render: (c) => <RfmScore value={c.R} /> },
    { header: "F Score", render: (c) => <RfmScore value={c.F} /> },
    { header: "M Score", render: (c) => <RfmScore value={c.M} /> },
    {
      header: "Total",
      render: (c) => (
        <>
          <span className="text-[14px] font-black text-gray-900">{c.rfm}</span>
          <span className="text-[10px] text-gray-400">/15</span>
        </>
      ),
    },
    {
      header: "Last Visit",
      render: (c) => (
        <span className="text-gray-500">{c.recencyDays}d ago</span>
      ),
    },
    {
      header: "Visits",
      render: (c) => <span className="text-gray-700">{c.frequency}</span>,
    },
    {
      header: "Spend",
      render: (c) => (
        <span className="font-bold text-emerald-600">
          ₹{c.monetary.toLocaleString("en-IN")}
        </span>
      ),
    },
  ];

  return (
    <main className="h-full flex-1 overflow-auto rounded-xl border border-gray-200 bg-[#f8fafc]">
      <div className="mx-auto flex w-full  flex-col gap-2.5">
        <div className="relative overflow-hidden rounded-2xl border border-gray-100 bg-white px-5 py-4 shadow-sm transition-all duration-200 hover:shadow-md">
          <div className="absolute -right-10 -top-10 h-24 w-24 rounded-full bg-red-100/50 blur-3xl" />
          <div className="relative z-10 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            {/* Title and tabs share a row from sm up; on a phone the tabs get
                their own full-width row instead of being crushed beside the
                heading. */}
            <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#b10000] shadow-sm">
                  <UsersIcon className="h-4 w-4 text-white" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-[18px] font-bold leading-none tracking-tight text-gray-900">
                    Customers
                  </h1>
                  <p className="mt-1 text-[11px] text-gray-500">
                    Customer analytics, retention and churn intelligence
                  </p>
                </div>
              </div>

              <div className="-mx-1 overflow-x-auto px-1 sm:mx-0 sm:ml-2 sm:px-0">
                <div className="inline-flex overflow-hidden rounded-lg border border-gray-200 bg-white">
                  {(["overview", "churn", "rfm"] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setActiveTab(t)}
                      className={`shrink-0 px-3 py-2 text-[11px] font-semibold whitespace-nowrap transition sm:py-1.5 ${activeTab === t ? "bg-[#b10000] text-white" : "text-gray-600 hover:bg-gray-50"}`}
                    >
                      {t === "overview"
                        ? "Overview"
                        : t === "churn"
                          ? "Churn Analysis"
                          : "RFM Score"}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {[
                {
                  label: "Customers",
                  value: total,
                  Icon: UsersIcon,
                  cls: "border-blue-100 bg-blue-50",
                  ibg: "bg-blue-100",
                  ico: "text-blue-600",
                  val: "text-blue-700",
                  lbl: "text-blue-400",
                },
                {
                  label: "Repeat",
                  value: repeat,
                  Icon: ArrowPathRoundedSquareIcon,
                  cls: "border-emerald-100 bg-emerald-50",
                  ibg: "bg-emerald-100",
                  ico: "text-emerald-600",
                  val: "text-emerald-700",
                  lbl: "text-emerald-400",
                },
                {
                  label: "Avg Spend",
                  value: `₹${avg}`,
                  Icon: CurrencyRupeeIcon,
                  cls: "border-orange-100 bg-orange-50",
                  ibg: "bg-orange-100",
                  ico: "text-orange-600",
                  val: "text-orange-700",
                  lbl: "text-orange-400",
                },
                {
                  label: "Revenue",
                  value: `₹${revenue.toLocaleString("en-IN")}`,
                  Icon: ChartBarIcon,
                  cls: "border-red-100 bg-red-50",
                  ibg: "bg-red-100",
                  ico: "text-red-600",
                  val: "text-red-700",
                  lbl: "text-red-400",
                },
                {
                  label: "Visit Frequency",
                  value: `${avgVisitFrequency.toFixed(1)}/yr`,
                  Icon: CalendarDaysIcon,
                  cls: "border-violet-100 bg-violet-50",
                  ibg: "bg-violet-100",
                  ico: "text-violet-600",
                  val: "text-violet-700",
                  lbl: "text-violet-400",
                },
              ].map((k) => (
                <div
                  key={k.label}
                  className={`flex items-center gap-2 rounded-xl border px-2.5 py-1.5 shadow-sm ${k.cls}`}
                >
                  <div
                    className={`flex h-6 w-6 items-center justify-center rounded-lg ${k.ibg}`}
                  >
                    <k.Icon className={`h-3 w-3 ${k.ico}`} />
                  </div>
                  <div>
                    <p
                      className={`text-[8px] font-bold uppercase tracking-[0.12em] ${k.lbl}`}
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
              ))}
            </div>
          </div>
        </div>

        {activeTab === "overview" && (
          <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all duration-200 hover:shadow-md">
            {/* HEADER */}

            <div className="border-b border-gray-100 px-4 py-2.5">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                {/* LEFT */}

                <div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-[#b10000]/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.18em] text-[#b10000]">
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

            <div className="px-3 pb-3 md:px-0 md:pb-0">
              <ResponsiveTable
                columns={customerColumns}
                data={paginatedCustomers}
                rowKey={(c) => c.id}
                minWidth="48rem"
                emptyMessage="No customers yet"
              />
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

                <div className="rounded-md border border-gray-200 bg-gray-100 px-2.5 py-1 text-[11px] font-semibold text-gray-700">
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
          </div>
        )}

        {activeTab === "churn" && (
          <div className="space-y-3">
            {/* CHURN KPIs */}
            <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
              {[
                {
                  label: "Active",
                  value: active.length,
                  sub: "visited in last 30 days",
                  cls: "border-emerald-100 bg-emerald-50/60",
                  val: "text-emerald-700",
                },
                {
                  label: "At Risk",
                  value: atRisk.length,
                  sub: "30–90 days since visit",
                  cls: "border-orange-100 bg-orange-50/60",
                  val: "text-orange-700",
                },
                {
                  label: "Churned",
                  value: churned.length,
                  sub: "no visit in 90+ days",
                  cls: "border-red-100 bg-red-50/60",
                  val: "text-red-700",
                },
                {
                  label: "Lifetime Value",
                  value: `₹${Math.round(ltv).toLocaleString("en-IN")}`,
                  sub: avgLifespanYears
                    ? `${avgAnnualRevenuePerCustomer.toLocaleString(undefined, { maximumFractionDigits: 0 })}/yr × ${avgLifespanYears.toFixed(1)}yr lifespan`
                    : "annual revenue per customer",
                  cls: "border-violet-100 bg-violet-50/60",
                  val: "text-violet-700",
                },
              ].map((k) => (
                <div key={k.label} className={`rounded-xl border p-4 ${k.cls}`}>
                  <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500">
                    {k.label}
                  </p>
                  <p className={`mt-2 text-[22px] font-bold ${k.val}`}>
                    {k.value}
                  </p>
                  <p className="mt-1 text-[11px] text-gray-500">{k.sub}</p>
                </div>
              ))}
            </div>

            {/* COHORT CHURN, REPEAT RATE, CAC, LTV:CAC */}
            <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
              {[
                {
                  label: "Churn Rate",
                  value: `${churnRatePercentage.toFixed(1)}%`,
                  sub: "lost ÷ prior 30-day cohort",
                  cls: "border-red-100 bg-red-50/60",
                  val: "text-red-700",
                },
                {
                  label: "Repeat Rate",
                  value: `${repeatCustomerRatePercentage.toFixed(1)}%`,
                  sub: "customers with 2+ visits",
                  cls: "border-emerald-100 bg-emerald-50/60",
                  val: "text-emerald-700",
                },
                {
                  label: "CAC",
                  value:
                    newCustomersThisMonth > 0
                      ? `₹${Math.round(cac).toLocaleString("en-IN")}`
                      : "—",
                  // Customer records aren't tied to a single branch (a
                  // customer can visit any branch), so "new customers" here
                  // is always restaurant-wide, even while every other card
                  // on this page is scoped to the selected branch.
                  sub: "marketing spend ÷ new customers (restaurant-wide, MTD)",
                  cls: "border-orange-100 bg-orange-50/60",
                  val: "text-orange-700",
                },
                {
                  label: "LTV : CAC",
                  value:
                    ltvCacRatio !== null ? `${ltvCacRatio.toFixed(1)}x` : "—",
                  sub:
                    ltvCacRatio !== null && ltvCacRatio < 3
                      ? "below healthy 3x benchmark · LTV is branch-scoped, CAC is restaurant-wide"
                      : "branch-scoped LTV vs. restaurant-wide CAC",
                  cls: "border-blue-100 bg-blue-50/60",
                  val: "text-blue-700",
                },
              ].map((k) => (
                <div key={k.label} className={`rounded-xl border p-4 ${k.cls}`}>
                  <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500">
                    {k.label}
                  </p>
                  <p className={`mt-2 text-[22px] font-bold ${k.val}`}>
                    {k.value}
                  </p>
                  <p className="mt-1 text-[11px] text-gray-500">{k.sub}</p>
                </div>
              ))}
            </div>

            {/* TOP CUSTOMERS */}
            <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
              <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="border-b border-gray-100 px-4 py-3">
                  <h3 className="text-[15px] font-bold text-gray-900">
                    Top 10 Customers by Spend
                  </h3>
                  <p className="mt-0.5 text-[11px] text-gray-500">
                    Your highest-value customers — never lose these
                  </p>
                </div>
                <div className="divide-y divide-gray-50">
                  {topCustomers.map((c: any, i: number) => (
                    <div
                      key={c.id}
                      className="flex items-center gap-3 px-4 py-2.5"
                    >
                      <span className="w-5 text-center text-[11px] font-bold text-gray-400">
                        #{i + 1}
                      </span>
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#b10000] text-[11px] font-bold text-white">
                        {c.name?.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-gray-900 truncate">
                          {c.name}
                        </p>
                        <p className="text-[10px] text-gray-400">
                          {c.phone} · {c.visits} visits
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[13px] font-bold text-emerald-600">
                          ₹{Number(c.spend || 0).toLocaleString("en-IN")}
                        </p>
                        <p className="text-[9px] text-gray-400">
                          ₹{c.visits ? Math.round(c.spend / c.visits) : 0} avg
                        </p>
                      </div>
                    </div>
                  ))}
                  {topCustomers.length === 0 && (
                    <div className="py-10 text-center text-[12px] text-gray-400">
                      No customers yet
                    </div>
                  )}
                </div>
              </div>

              {/* AT-RISK CUSTOMERS */}
              <div className="overflow-hidden rounded-xl border border-orange-100 bg-white shadow-sm">
                <div className="border-b border-orange-100 bg-orange-50/40 px-4 py-3">
                  <h3 className="text-[15px] font-bold text-gray-900">
                    ⚠ At-Risk Customers
                  </h3>
                  <p className="mt-0.5 text-[11px] text-gray-500">
                    Haven't visited in 30–90 days — reach out now before they
                    churn
                  </p>
                </div>
                <div className="divide-y divide-gray-50 max-h-[320px] overflow-y-auto">
                  {atRisk.slice(0, 15).map((c: any) => {
                    const daysSince = c.lastVisit
                      ? Math.floor(
                          (Date.now() - new Date(c.lastVisit).getTime()) /
                            (1000 * 60 * 60 * 24),
                        )
                      : null;
                    return (
                      <div
                        key={c.id}
                        className="flex items-center gap-3 px-4 py-2.5"
                      >
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-100 text-[11px] font-bold text-orange-700">
                          {c.name?.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-semibold text-gray-900 truncate">
                            {c.name}
                          </p>
                          <p className="text-[10px] text-gray-400">
                            {c.phone} · {c.visits} visits · ₹{c.spend} total
                          </p>
                        </div>
                        <span className="rounded-full bg-orange-50 px-2 py-0.5 text-[10px] font-bold text-orange-600 whitespace-nowrap">
                          {daysSince}d ago
                        </span>
                      </div>
                    );
                  })}
                  {atRisk.length === 0 && (
                    <div className="py-10 text-center text-[12px] text-gray-400">
                      No at-risk customers — great retention!
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* CHURNED CUSTOMERS */}
            <div className="overflow-hidden rounded-xl border border-red-100 bg-white shadow-sm">
              <div className="border-b border-red-100 bg-red-50 px-4 py-3 flex items-center justify-between">
                <div>
                  <h3 className="text-[15px] font-bold text-gray-900">
                    Churned Customers
                  </h3>
                  <p className="mt-0.5 text-[11px] text-gray-500">
                    No visit in 90+ days — consider a win-back campaign
                  </p>
                </div>
                <span className="rounded-full bg-red-100 px-3 py-1 text-[11px] font-bold text-red-700">
                  {churned.length} churned
                </span>
              </div>
              <div className="px-3 pb-3 md:px-0 md:pb-0">
                <ResponsiveTable
                  columns={churnedColumns}
                  data={churned.slice(0, 20)}
                  rowKey={(c) => c.id}
                  minWidth="44rem"
                  emptyMessage="No churned customers — excellent retention!"
                />
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
                  <p className="text-[12px] text-gray-500">
                    Scoring customers...
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* Segment KPIs */}
                <div className="grid grid-cols-2 gap-3 xl:grid-cols-5">
                  {[
                    {
                      label: "Champion",
                      sub: "High R·F·M — best customers",
                      color: "emerald",
                    },
                    {
                      label: "Loyal",
                      sub: "Regular buyers, good spend",
                      color: "blue",
                    },
                    {
                      label: "Potential",
                      sub: "Occasional, growing",
                      color: "violet",
                    },
                    {
                      label: "At Risk",
                      sub: "Haven't visited recently",
                      color: "orange",
                    },
                    {
                      label: "Lost",
                      sub: "No visits in 90+ days",
                      color: "red",
                    },
                  ].map((s) => {
                    const count = rfmData?.segmentCounts?.[s.label] || 0;
                    const rev = rfmData?.segmentRevenue?.[s.label] || 0;
                    const colorMap: Record<string, string> = {
                      emerald:
                        "border-emerald-100 bg-emerald-50/60 text-emerald-700",
                      blue: "border-blue-100 bg-blue-50/60 text-blue-700",
                      violet:
                        "border-violet-100 bg-violet-50/60 text-violet-700",
                      orange:
                        "border-orange-100 bg-orange-50/60 text-orange-700",
                      red: "border-red-100 bg-red-50/60 text-red-700",
                    };
                    return (
                      <div
                        key={s.label}
                        className={`rounded-xl border p-4 ${colorMap[s.color]}`}
                      >
                        <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500">
                          {s.label}
                        </p>
                        <p
                          className={`mt-2 text-[24px] font-black ${colorMap[s.color].split(" ")[2]}`}
                        >
                          {count}
                        </p>
                        <p className="mt-0.5 text-[10px] text-gray-500">
                          ₹{Number(rev).toLocaleString("en-IN")} revenue
                        </p>
                        <p className="mt-1 text-[10px] text-gray-400">
                          {s.sub}
                        </p>
                      </div>
                    );
                  })}
                </div>

                {/* RFM explanation */}
                <div className="overflow-hidden rounded-xl border border-blue-100 bg-blue-50/40 px-4 py-3">
                  <p className="text-[12px] font-semibold text-blue-900">
                    How RFM scoring works
                  </p>
                  <p className="mt-1 text-[11px] text-blue-700">
                    Each customer is scored 1–5 on three dimensions:{" "}
                    <strong>R</strong>ecency (days since last visit),{" "}
                    <strong>F</strong>requency (total visits),{" "}
                    <strong>M</strong>onetary (total spend). Higher score =
                    better customer. Total 13–15 = Champion · 10–12 = Loyal ·
                    7–9 = Potential · 5–6 = At Risk · 3–4 = Lost.
                  </p>
                </div>

                {/* RFM Customer Table */}
                <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                  <div className="border-b border-gray-100 px-4 py-3">
                    <h3 className="text-[15px] font-bold text-gray-900">
                      All Customers — RFM Scores
                    </h3>
                    <p className="mt-0.5 text-[11px] text-gray-500">
                      {rfmData?.total || 0} customers scored · sorted by RFM
                      total (best first)
                    </p>
                  </div>
                  <div className="px-3 pb-3 md:px-0 md:pb-0">
                    <ResponsiveTable
                      columns={rfmColumns}
                      data={(rfmData?.customers || []).slice(0, 50)}
                      rowKey={(c) => c.id}
                      minWidth="52rem"
                      emptyMessage="No customer data available for RFM scoring"
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <SendWhatsAppDialog
        open={!!messageCustomer}
        onClose={() => setMessageCustomer(null)}
        defaultPhone={messageCustomer?.phone}
        templateType="CUSTOMER_MARKETING"
        relatedEntityType="Customer"
        relatedEntityId={messageCustomer?.id}
      />
    </main>
  );
}
