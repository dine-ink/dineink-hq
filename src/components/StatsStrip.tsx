import {
  IndianRupee,
  ShoppingBag,
  BarChart3,
  Users,
  Clock3,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";

type RatioRow = {
  key: string;
  monthly: number | null;
  previousMonth: number | null;
  variancePercentage: number | null;
  target: number | null;
  achievementPercentage: number | null;
  trendDirection: "up" | "down" | "flat" | null;
  unit: "currency" | "percentage";
};

type Props = {
  analytics?: any;
  /** Finance-Engine-sourced revenue for the currently selected date range (GET /api/finance/.../summary) — preferred over analytics.totalRevenue, which is an independent, separately-computed figure from analytics.service.ts. */
  revenue?: number | null;
  ebitda?: number | null;
  ebitdaPct?: number | null;
  /** Ratio/Period Engine rows (GET /api/finance/:restaurantId/:branchId/ratios) — enriches the Revenue/EBITDA cards with previous-period, target, achievement %, and trend when supplied. */
  ratios?: RatioRow[];
  /** Drill-down — navigates to the full Financial Statements view when a finance-engine-backed card is clicked. */
  onDrillDown?: () => void;
};

const TrendIcon = ({
  direction,
}: {
  direction: "up" | "down" | "flat" | null;
}) => {
  if (direction === "up") return <TrendingUp className="h-3 w-3" />;
  if (direction === "down") return <TrendingDown className="h-3 w-3" />;
  return <Minus className="h-3 w-3" />;
};

export default function AnalyticsOverview({
  analytics,
  revenue,
  ebitda,
  ebitdaPct,
  ratios,
  onDrillDown,
}: Props) {
  const ebitdaPositive = ebitda == null || ebitda >= 0;
  const revenueRatio = ratios?.find((r) => r.key === "revenue");
  const ebitdaRatio = ratios?.find((r) => r.key === "ebitdaPercentage");

  const trendColor = (
    direction: "up" | "down" | "flat" | null,
    higherIsBetter: boolean,
  ) => {
    if (direction === "flat" || direction === null) return "text-gray-400";
    const isGood = higherIsBetter ? direction === "up" : direction === "down";
    return isGood ? "text-emerald-600" : "text-red-500";
  };

  const stats = [
    {
      name: "Revenue",
      value: `₹${Math.round(revenue ?? analytics?.totalRevenue ?? 0).toLocaleString("en-IN")}`,
      icon: IndianRupee,
      accent: "bg-red-500",
      iconBg: "bg-red-50",
      iconColor: "text-primary-600",
      sub: "Total earnings",
      ratio: revenueRatio,
      higherIsBetter: true,
      clickable: !!onDrillDown,
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
      value:
        ebitda == null ? "—" : `₹${Math.round(ebitda).toLocaleString("en-IN")}`,
      icon: TrendingUp,
      accent: ebitdaPositive ? "bg-emerald-500" : "bg-red-500",
      iconBg: ebitdaPositive ? "bg-emerald-50" : "bg-red-50",
      iconColor: ebitdaPositive ? "text-emerald-500" : "text-red-500",
      sub:
        ebitda == null
          ? "Set expenses in Insights"
          : ebitdaPct != null
            ? `${ebitdaPct > 0 ? "+" : ""}${ebitdaPct.toFixed(1)}% margin`
            : ebitdaPositive
              ? "Profitable period"
              : "Loss period",
      ratio: ebitdaRatio,
      higherIsBetter: true,
      clickable: !!onDrillDown,
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
          const ratio = (stat as any).ratio as RatioRow | undefined;
          return (
            <div
              key={stat.name}
              onClick={stat.clickable ? onDrillDown : undefined}
              className={`relative px-3 py-3 ${stat.clickable ? "cursor-pointer transition hover:bg-gray-50" : ""} ${
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
                {ratio && (
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                    {ratio.variancePercentage != null && (
                      <span
                        className={`flex items-center gap-0.5 text-[9px] font-semibold ${trendColor(ratio.trendDirection, (stat as any).higherIsBetter)}`}
                      >
                        <TrendIcon direction={ratio.trendDirection} />
                        {ratio.variancePercentage > 0 ? "+" : ""}
                        {ratio.variancePercentage.toFixed(1)}% vs last month
                      </span>
                    )}
                    {ratio.target != null && (
                      <span className="text-[9px] text-gray-400">
                        Target{" "}
                        {ratio.unit === "percentage"
                          ? `${ratio.target}%`
                          : `₹${Math.round(ratio.target).toLocaleString("en-IN")}`}
                        {ratio.achievementPercentage != null
                          ? ` · ${ratio.achievementPercentage.toFixed(0)}%`
                          : ""}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
