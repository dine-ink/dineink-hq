import {
  IndianRupee,
  ShoppingBag,
  BarChart3,
  Users,
  Clock3,
  TrendingUp,
} from "lucide-react";

type Props = {
  analytics?: any;
  ebitda?: number | null;
  ebitdaPct?: number | null;
};

export default function AnalyticsOverview({ analytics, ebitda, ebitdaPct }: Props) {
  const ebitdaPositive = ebitda == null || ebitda >= 0;

  const stats = [
    {
      name: "Revenue",
      value: `₹${Math.round(analytics?.totalRevenue || 0).toLocaleString()}`,
      icon: IndianRupee,
      accent: "bg-red-500",
      iconBg: "bg-red-50",
      iconColor: "text-[#b10000]",
      sub: "Total earnings",
    },
    {
      name: "Orders",
      value: analytics?.totalOrders || 0,
      icon: ShoppingBag,
      accent: "bg-blue-500",
      iconBg: "bg-blue-50",
      iconColor: "text-blue-500",
      sub: "Completed orders",
    },
    {
      name: "Avg Order",
      value: `₹${Math.round(analytics?.avgOrderValue || 0)}`,
      icon: BarChart3,
      accent: "bg-orange-500",
      iconBg: "bg-orange-50",
      iconColor: "text-orange-500",
      sub: "Per transaction",
    },
    {
      name: "Customers",
      value: analytics?.totalCustomers || 0,
      icon: Users,
      accent: "bg-emerald-500",
      iconBg: "bg-emerald-50",
      iconColor: "text-emerald-500",
      sub: "Unique visitors",
    },
    {
      name: "Peak Hours",
      value: analytics?.peakHours || "N/A",
      icon: Clock3,
      accent: "bg-violet-500",
      iconBg: "bg-violet-50",
      iconColor: "text-violet-500",
      sub: "Busiest time",
    },
    {
      name: "EBITDA",
      value: ebitda == null ? "—" : `₹${Math.round(ebitda).toLocaleString()}`,
      icon: TrendingUp,
      accent: ebitdaPositive ? "bg-emerald-500" : "bg-red-500",
      iconBg: ebitdaPositive ? "bg-emerald-50" : "bg-red-50",
      iconColor: ebitdaPositive ? "text-emerald-500" : "text-red-500",
      sub: ebitda == null
        ? "Set expenses in Insights"
        : ebitdaPct != null
          ? `${ebitdaPct > 0 ? "+" : ""}${ebitdaPct.toFixed(1)}% margin`
          : ebitdaPositive ? "Profitable period" : "Loss period",
    },
  ];

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      {/* HEADER */}
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-2.5">
        <div>
          <h2 className="text-[15px] font-bold tracking-tight text-gray-900">
            Analytics Overview
          </h2>
          <p className="mt-0.5 text-[11px] text-gray-500">
            Live operational metrics
          </p>
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
          <span className="text-[10px] font-bold text-emerald-600">LIVE</span>
        </div>
      </div>

      {/* KPI GRID */}
      <div className="grid grid-cols-2 xl:grid-cols-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.name}
              className={`relative px-3 py-3 ${
                index !== stats.length - 1
                  ? "border-b border-gray-100 xl:border-b-0 xl:border-r"
                  : ""
              }`}
            >
              {/* ACCENT BAR */}
              <div
                className={`absolute left-0 top-3 bottom-3 w-0.5 rounded-r-full ${stat.accent}`}
              />

              {/* TOP */}
              <div className="flex items-start justify-between pl-2">
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-gray-400">
                    {stat.name}
                  </p>
                  <h3 className="mt-1.5 text-[18px] font-extrabold tracking-tight text-gray-900">
                    {stat.value}
                  </h3>
                </div>

                {/* ICON */}
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-lg ${stat.iconBg}`}
                >
                  <Icon className={`h-3.5 w-3.5 ${stat.iconColor}`} />
                </div>
              </div>

              {/* FOOTER */}
              <div className="mt-2 pl-2">
                <p className="text-[10px] text-gray-400">{stat.sub}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
