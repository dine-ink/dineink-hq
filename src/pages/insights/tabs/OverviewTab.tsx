import {
  ResponsiveContainer,
  PieChart as RePieChart,
  Pie,
  Cell,
  Tooltip as ReTooltip,
  BarChart as ReBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import {
  ArrowTrendingUpIcon,
  BuildingLibraryIcon,
  BuildingStorefrontIcon,
  CakeIcon,
  ChartBarIcon,
  ChartPieIcon,
  CurrencyRupeeIcon,
  RocketLaunchIcon,
  ShoppingCartIcon,
  TruckIcon,
  UsersIcon,
  ViewfinderCircleIcon,
  WalletIcon,
} from "@heroicons/react/24/outline";
import { tooltipFormatter } from "@/utils/chartFormatters";
import type { InsightsMetrics } from "@/pages/insights/useInsightsMetrics";

/**
 * Overview — the KPI dashboard: EBITDA against target, break-even pacing,
 * working-capital days, refund rate and delivery margin.
 *
 * Extracted from Insights.tsx as part of breaking up a 4,370-line component.
 * It borrowed twenty values; nineteen were derived figures now reachable
 * through the useInsightsMetrics object, so it takes that plus three pieces of
 * raw state the page fetches.
 */

interface OverviewTabProps {
  metrics: InsightsMetrics;
  financeSummaryError: boolean;
  hasVendorInvoices: boolean;
  tableOps: any;
}

/**
 * Label for a vertical ReferenceLine: short text on the chart, exact amount on
 * hover. Recharts injects `viewBox` when `label` is given an element.
 *
 * `dy` staggers stacked labels — two lines whose values are close would print
 * their labels on top of each other otherwise.
 */
function RefLineLabel({
  viewBox,
  text,
  amount,
  color,
  dy = 0,
}: {
  viewBox?: { x?: number; y?: number };
  text: string;
  amount: string;
  color: string;
  dy?: number;
}) {
  const x = viewBox?.x ?? 0;
  const y = (viewBox?.y ?? 0) + dy;
  return (
    <g style={{ cursor: "help" }}>
      <title>{`${text}: ${amount}`}</title>
      {/* Invisible, generous hover target — 10px text is a hard thing to hit. */}
      <rect
        x={x - 6}
        y={y - 2}
        width={84}
        height={16}
        fill="transparent"
        pointerEvents="all"
      />
      <text x={x + 4} y={y + 10} fill={color} fontSize={10} fontWeight={700}>
        {text}
      </text>
    </g>
  );
}

export default function OverviewTab({ metrics, financeSummaryError, hasVendorInvoices, tableOps }: OverviewTabProps) {
  // Aliased back to the names the markup already used, so this is a move
  // rather than a rewrite.
  const {
    fm,
    targetEbitda,
    revenue,
    totalFixedExpenses,
    totalVariableExpenses,
    totalLabourCost,
    totalFinanceCost,
    effectiveFoodCost,
    totalExpenses,
    ebitdaPercentage,
    primeCostPercentage,
    grossProfit,
    grossProfitMarginPercentage,
    labourCostPercentage,
    netProfit,
    daysInMonth,
    daysElapsed,
    mtdRevenue,
    contributionMarginPercentage,
    breakEvenRevenue,
    breakEvenOrders,
    dailyRunRate,
    projectedMonthEndRevenue,
    pctOfMonthElapsed,
    pctOfBreakEvenCovered,
    breakEvenDay,
    hasBrokenEven,
    onTrackForTarget,
    inventoryTurnover,
    daysInventoryOutstanding,
    daysPayableOutstanding,
    cashConversionCycle,
    salesPerSqFt,
    refundPercentage,
    deliveryRevenue,
    dineInTakeawayRevenue,
    deliveryRelatedCost,
    deliveryMargin,
    deliveryCostPercentage,
    aggregatorCommissionPercentage,
    hasDeliveryOrders,
    newCustomersThisMonth,
    customerAcquisitionCost,
    initialInvestment,
    monthlyRoiPercentage,
    paybackMonths,
  } = metrics;

  return (
            <div className="space-y-4">
              {financeSummaryError && !fm && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-[12px] text-amber-800">
                  <span className="font-semibold">
                    Showing estimated figures
                  </span>{" "}
                  — could not load the latest financial summary. EBITDA, Prime
                  Cost, Net Profit, and Break-even below use a fallback
                  calculation and may not match Dashboard, Branch Comparison, or
                  the PDF/Excel exports until this reconnects.
                </div>
              )}
              {/* TOP KPIs */}
              {/* ================= KPI ================= */}

              <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
                {[
                  {
                    label: "Revenue",
                    value: revenue.toLocaleString("en-IN", {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 2,
                    }),
                    sub: "Monthly earnings",
                    icon: CurrencyRupeeIcon,
                    color: "emerald",
                  },

                  {
                    label: "Net Profit",
                    value: `₹${isNaN(netProfit) ? 0 : Math.round(netProfit).toLocaleString("en-IN")}`,
                    sub: "EBITDA − finance cost",
                    icon: ArrowTrendingUpIcon,
                    color: "blue",
                  },

                  {
                    label: "EBITDA",
                    value: `${ebitdaPercentage}%`,
                    sub: "Profitability",
                    icon: ChartBarIcon,
                    color: "violet",
                  },

                  {
                    label: "Prime Cost",
                    value: `${primeCostPercentage}%`,
                    sub: "Food + labour",
                    icon: ChartPieIcon,
                    color: "orange",
                  },
                ].map((item) => {
                  const Icon = item.icon;

                  const colorMap: Record<
                    string,
                    { text: string; bg: string; icon: string }
                  > = {
                    emerald: {
                      text: "text-emerald-500",
                      bg: "bg-emerald-50",
                      icon: "text-emerald-600",
                    },
                    blue: {
                      text: "text-blue-500",
                      bg: "bg-blue-50",
                      icon: "text-blue-600",
                    },
                    violet: {
                      text: "text-violet-500",
                      bg: "bg-violet-50",
                      icon: "text-violet-600",
                    },
                    orange: {
                      text: "text-orange-500",
                      bg: "bg-orange-50",
                      icon: "text-orange-600",
                    },
                  };
                  const c = colorMap[item.color] || colorMap.orange;
                  return (
                    <div
                      key={item.label}
                      className="rounded-2xl border border-gray-200 bg-white p-3 shadow-sm"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p
                            className={`text-[10px] font-bold uppercase tracking-[0.14em] ${c.text}`}
                          >
                            {item.label}
                          </p>
                          <p className="mt-2 text-[22px] font-bold tracking-tight text-gray-900">
                            {item.value}
                          </p>
                          <p className="mt-1 text-[11px] text-gray-500">
                            {item.sub}
                          </p>
                        </div>
                        <div
                          className={`flex h-8 w-8 items-center justify-center rounded-lg ${c.bg}`}
                        >
                          <Icon className={`h-4 w-4 ${c.icon}`} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* ================= PROFITABILITY & EFFICIENCY ================= */}

              <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
                {[
                  {
                    label: "Gross Profit",
                    value: `₹${Math.round(grossProfit).toLocaleString("en-IN")}`,
                    sub: "Revenue − food cost",
                    icon: CurrencyRupeeIcon,
                    color: "emerald",
                  },
                  {
                    label: "Gross Margin",
                    value: `${grossProfitMarginPercentage}%`,
                    sub: "Gross profit ÷ revenue",
                    icon: ArrowTrendingUpIcon,
                    color: "blue",
                  },
                  {
                    label: "Labour Cost",
                    value: `${labourCostPercentage}%`,
                    sub: "Of revenue",
                    icon: UsersIcon,
                    color: "violet",
                  },
                  {
                    label: "Contribution Margin",
                    value: `${(contributionMarginPercentage * 100).toFixed(1)}%`,
                    sub: "Revenue after variable costs",
                    icon: ChartPieIcon,
                    color: "orange",
                  },
                ].map((item) => {
                  const Icon = item.icon;
                  const colorMap: Record<
                    string,
                    { text: string; bg: string; icon: string }
                  > = {
                    emerald: {
                      text: "text-emerald-500",
                      bg: "bg-emerald-50",
                      icon: "text-emerald-600",
                    },
                    blue: {
                      text: "text-blue-500",
                      bg: "bg-blue-50",
                      icon: "text-blue-600",
                    },
                    violet: {
                      text: "text-violet-500",
                      bg: "bg-violet-50",
                      icon: "text-violet-600",
                    },
                    orange: {
                      text: "text-orange-500",
                      bg: "bg-orange-50",
                      icon: "text-orange-600",
                    },
                  };
                  const c = colorMap[item.color];
                  return (
                    <div
                      key={item.label}
                      className="rounded-2xl border border-gray-200 bg-white p-3 shadow-sm"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p
                            className={`text-[10px] font-bold uppercase tracking-[0.14em] ${c.text}`}
                          >
                            {item.label}
                          </p>
                          <p className="mt-2 text-[22px] font-bold tracking-tight text-gray-900">
                            {item.value}
                          </p>
                          <p className="mt-1 text-[11px] text-gray-500">
                            {item.sub}
                          </p>
                        </div>
                        <div
                          className={`flex h-8 w-8 items-center justify-center rounded-lg ${c.bg}`}
                        >
                          <Icon className={`h-4 w-4 ${c.icon}`} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* ================= EBITDA HEALTH ================= */}

              <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                  {/* LEFT */}

                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50">
                      <ArrowTrendingUpIcon className="h-4 w-4 text-violet-600" />
                    </div>

                    <div>
                      <h3 className="text-[18px] font-bold tracking-tight text-gray-900">
                        Profitability Health
                      </h3>

                      <p className="mt-1 text-[12px] text-gray-500">
                        EBITDA performance tracking
                      </p>
                    </div>
                  </div>

                  {/* RIGHT */}

                  <div className="flex flex-wrap gap-2">
                    {[
                      {
                        label: "Status",
                        value:
                          Number(ebitdaPercentage) >= targetEbitda
                            ? "Healthy"
                            : "Critical",
                        color:
                          Number(ebitdaPercentage) >= targetEbitda
                            ? "emerald"
                            : "red",
                      },

                      {
                        label: "Current",
                        value: `${ebitdaPercentage}%`,
                        color: "violet",
                      },

                      {
                        label: "Target",
                        value: `${targetEbitda}%`,
                        color: "emerald",
                      },

                      {
                        label: "Gap",
                        value: `${(
                          Number(ebitdaPercentage) - targetEbitda
                        ).toFixed(1)}%`,
                        color: "orange",
                      },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2"
                      >
                        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">
                          {item.label}
                        </p>

                        <p
                          className={`text-[16px] font-bold ${
                            item.color === "emerald"
                              ? "text-emerald-600"
                              : item.color === "red"
                                ? "text-red-600"
                                : item.color === "violet"
                                  ? "text-violet-600"
                                  : "text-orange-600"
                          }`}
                        >
                          {item.value}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* PROGRESS */}

                <div className="mt-4">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-[11px] text-gray-500">EBITDA Progress</p>
                    <p className="text-[11px] font-semibold text-violet-600">
                      {targetEbitda > 0
                        ? Math.min(
                            Math.round(
                              (Number(ebitdaPercentage) / targetEbitda) * 100,
                            ),
                            100,
                          )
                        : 0}
                      %
                    </p>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full bg-violet-500"
                      style={{
                        width: `${targetEbitda > 0 ? Math.min((Number(ebitdaPercentage) / targetEbitda) * 100, 100) : 0}%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* ================= REVENUE TARGETS ================= */}

              <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                {/* HEADER */}

                <div className="mb-4 flex items-center justify-between">
                  {/* LEFT */}

                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#b10000]">
                      <ViewfinderCircleIcon className="h-4 w-4 text-white" />
                    </div>

                    <div>
                      <h3 className="text-[18px] font-bold tracking-tight text-gray-900">
                        Revenue Targets
                      </h3>

                      <p className="mt-1 text-[12px] text-gray-500">
                        EBITDA revenue planning
                      </p>
                    </div>
                  </div>

                  {/* BADGE */}

                  <span className="rounded-full bg-[#b10000]/10 px-3 py-1 text-[10px] font-semibold text-[#b10000]">
                    Financial Planning
                  </span>
                </div>

                {/* TARGET CHART */}

                {(() => {
                  const revenueTargetData = [0, 5, 10, 15, 20, 25].map(
                    (target) => ({
                      target: `${target}%`,
                      targetNum: target,
                      required: totalExpenses / (1 - target / 100),
                    }),
                  );
                  const inr = (v: number) =>
                    `₹${Math.round(v || 0).toLocaleString("en-IN")}`;
                  return (
                    <>
                      <div className="h-[260px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <ReBarChart
                            data={revenueTargetData}
                            layout="vertical"
                            margin={{ top: 20, right: 24, left: 0, bottom: 0 }}
                          >
                            <CartesianGrid
                              strokeDasharray="3 3"
                              horizontal={false}
                              stroke="#f1f5f9"
                            />
                            <XAxis
                              type="number"
                              tickFormatter={(v) => `₹${Math.round(v / 1000)}k`}
                              tick={{ fontSize: 10, fill: "#9ca3af" }}
                              axisLine={false}
                              tickLine={false}
                            />
                            <YAxis
                              type="category"
                              dataKey="target"
                              tick={{
                                fontSize: 11,
                                fill: "#374151",
                                fontWeight: 600,
                              }}
                              axisLine={false}
                              tickLine={false}
                              width={44}
                            />
                            <ReTooltip
                              formatter={tooltipFormatter((v) => [
                                `₹${Math.round(v).toLocaleString("en-IN")}`,
                                "Revenue Required",
                              ])}
                              labelFormatter={(l) => `${l} EBITDA target`}
                            />
                            <Bar
                              dataKey="required"
                              radius={[0, 6, 6, 0]}
                              barSize={20}
                            >
                              {revenueTargetData.map((d) => (
                                <Cell
                                  key={d.target}
                                  fill={
                                    d.targetNum >= 20
                                      ? "#10b981"
                                      : d.targetNum >= 10
                                        ? "#f97316"
                                        : "#9ca3af"
                                  }
                                />
                              ))}
                            </Bar>
                            <ReferenceLine
                              x={mtdRevenue}
                              stroke="#3b82f6"
                              strokeWidth={2}
                              label={
                                <RefLineLabel
                                  text="MTD"
                                  amount={inr(mtdRevenue)}
                                  color="#3b82f6"
                                />
                              }
                            />
                            <ReferenceLine
                              x={projectedMonthEndRevenue}
                              stroke="#b10000"
                              strokeDasharray="4 2"
                              strokeWidth={2}
                              label={
                                // dy offsets it one line below MTD so the two
                                // stay readable when the values sit close.
                                <RefLineLabel
                                  text="Projected"
                                  amount={inr(projectedMonthEndRevenue)}
                                  color="#b10000"
                                  dy={14}
                                />
                              }
                            />
                          </ReBarChart>
                        </ResponsiveContainer>
                      </div>
                      <p className="mt-2 text-[11px] text-gray-500">
                        Bars show the revenue needed to hit each EBITDA target
                        this month. Blue = revenue so far (MTD,{" "}
                        {inr(mtdRevenue)}), red dashed = projected month-end
                        revenue at the current daily pace (
                        {inr(projectedMonthEndRevenue)}).
                      </p>
                    </>
                  );
                })()}
              </div>

              {/* ================= COST BREAKDOWN ================= */}

              <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-100">
                      <ChartPieIcon className="h-4 w-4 text-gray-700" />
                    </div>
                    <div>
                      <h3 className="text-[18px] font-bold tracking-tight text-gray-900">
                        Expense Split
                      </h3>
                      <p className="mt-1 text-[12px] text-gray-500">
                        Where this month's costs are going
                      </p>
                    </div>
                  </div>
                  <span className="rounded-full bg-gray-100 px-3 py-1 text-[10px] font-semibold text-gray-600">
                    ₹{Math.round(totalExpenses).toLocaleString("en-IN")} total
                  </span>
                </div>

                {(() => {
                  const costBreakdownData = [
                    {
                      label: "Fixed",
                      value: totalFixedExpenses,
                      icon: WalletIcon,
                      color: "#3b82f6",
                    },
                    {
                      label: "Variable",
                      value: totalVariableExpenses,
                      icon: ChartBarIcon,
                      color: "#f97316",
                    },
                    {
                      label: "Labour",
                      value: totalLabourCost,
                      icon: UsersIcon,
                      color: "#10b981",
                    },
                    {
                      label: "Tax",
                      value: totalFinanceCost,
                      icon: BuildingLibraryIcon,
                      color: "#8b5cf6",
                    },
                    {
                      label: "Raw Material",
                      value: effectiveFoodCost,
                      icon: ShoppingCartIcon,
                      color: "#ef4444",
                    },
                  ].filter((d) => d.value > 0);

                  if (!costBreakdownData.length) {
                    return (
                      <div className="flex h-[180px] items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50">
                        <p className="text-[12px] text-gray-400">
                          No expense data yet — fill these in under Insights
                          Setup.
                        </p>
                      </div>
                    );
                  }

                  return (
                    <div className="flex flex-col items-center gap-4 lg:flex-row">
                      <div className="h-[220px] w-[220px] shrink-0">
                        <ResponsiveContainer width="100%" height="100%">
                          <RePieChart>
                            <Pie
                              data={costBreakdownData}
                              dataKey="value"
                              nameKey="label"
                              innerRadius={55}
                              outerRadius={90}
                              paddingAngle={2}
                            >
                              {costBreakdownData.map((d) => (
                                <Cell key={d.label} fill={d.color} />
                              ))}
                            </Pie>
                            <ReTooltip
                              formatter={tooltipFormatter(
                                (v) => `₹${Math.round(v).toLocaleString("en-IN")}`,
                              )}
                            />
                          </RePieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="w-full flex-1 space-y-2">
                        {costBreakdownData.map((item) => {
                          const Icon = item.icon;
                          return (
                            <div
                              key={item.label}
                              className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5"
                            >
                              <div className="flex items-center gap-2.5">
                                <span
                                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                                  style={{ background: item.color }}
                                />
                                <Icon className="h-3.5 w-3.5 text-gray-500" />
                                <span className="text-[12px] font-semibold text-gray-700">
                                  {item.label}
                                </span>
                              </div>
                              <div className="text-right">
                                <p className="text-[13px] font-bold text-gray-900">
                                  ₹
                                  {Math.round(item.value).toLocaleString(
                                    "en-IN",
                                  )}
                                </p>
                                <p className="text-[10px] text-gray-400">
                                  {totalExpenses > 0
                                    ? (
                                        (item.value / totalExpenses) *
                                        100
                                      ).toFixed(1)
                                    : "0.0"}
                                  % of expenses
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* ================= BREAK-EVEN & MONTHLY PROGRESS ================= */}

              <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50">
                      <RocketLaunchIcon className="h-4 w-4 text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="text-[18px] font-bold tracking-tight text-gray-900">
                        Break-Even & Monthly Progress
                      </h3>
                      <p className="mt-1 text-[12px] text-gray-500">
                        Day {daysElapsed} of {daysInMonth} · pace against this
                        month's costs
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {[
                      {
                        label: "MTD Revenue",
                        value: `₹${Math.round(mtdRevenue).toLocaleString("en-IN")}`,
                        color: "blue",
                      },
                      {
                        label: "Break-Even At",
                        value: `₹${Math.round(breakEvenRevenue).toLocaleString("en-IN")}`,
                        color: "violet",
                      },
                      {
                        label: "Break-Even Orders",
                        value: breakEvenOrders
                          ? breakEvenOrders.toLocaleString("en-IN")
                          : "—",
                        color: "blue",
                      },
                      {
                        label: "Refund Rate",
                        value: `${refundPercentage.toFixed(1)}%`,
                        color: refundPercentage > 5 ? "red" : "emerald",
                      },
                      {
                        label: "Status",
                        value: hasBrokenEven
                          ? "Costs Covered"
                          : breakEvenDay && breakEvenDay <= daysInMonth
                            ? `Break-even ~Day ${breakEvenDay}`
                            : "Behind Pace",
                        color: hasBrokenEven
                          ? "emerald"
                          : breakEvenDay && breakEvenDay <= daysInMonth
                            ? "orange"
                            : "red",
                      },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2"
                      >
                        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">
                          {item.label}
                        </p>
                        <p
                          className={`text-[15px] font-bold ${
                            item.color === "emerald"
                              ? "text-emerald-600"
                              : item.color === "red"
                                ? "text-red-600"
                                : item.color === "violet"
                                  ? "text-violet-600"
                                  : item.color === "orange"
                                    ? "text-orange-600"
                                    : "text-blue-600"
                          }`}
                        >
                          {item.value}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Break-even coverage bar */}
                <div className="mt-4">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-[11px] text-gray-500">
                      Break-even coverage (revenue vs. total costs)
                    </p>
                    <p className="text-[11px] font-semibold text-emerald-600">
                      {pctOfBreakEvenCovered.toFixed(0)}%
                    </p>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className={`h-full rounded-full ${hasBrokenEven ? "bg-emerald-500" : "bg-orange-500"}`}
                      style={{ width: `${pctOfBreakEvenCovered}%` }}
                    />
                  </div>
                </div>

                {/* Month elapsed vs projected month-end */}
                <div className="mt-4 flex flex-col gap-2 rounded-xl border border-gray-100 bg-gray-50 p-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-[12px] text-gray-600">
                    {pctOfMonthElapsed.toFixed(0)}% of the month has passed — at
                    the current daily pace (₹
                    {Math.round(dailyRunRate).toLocaleString("en-IN")}/day)
                    you're projected to close the month at{" "}
                    <span className="font-semibold text-gray-900">
                      ₹
                      {Math.round(projectedMonthEndRevenue).toLocaleString(
                        "en-IN",
                      )}
                    </span>
                    .
                  </p>
                  <span
                    className={`shrink-0 rounded-full px-3 py-1 text-[10px] font-bold ${
                      onTrackForTarget
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {onTrackForTarget ? "On Track" : "Behind Target"}
                  </span>
                </div>
              </div>

              {/* ================= DELIVERY / AGGREGATOR PROFITABILITY ================= */}

              <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50">
                      <TruckIcon className="h-4 w-4 text-orange-600" />
                    </div>
                    <div>
                      <h3 className="text-[18px] font-bold tracking-tight text-gray-900">
                        Delivery Profitability
                      </h3>
                      <p className="mt-1 text-[12px] text-gray-500">
                        Online/delivery revenue vs. delivery + aggregator costs,
                        this month
                      </p>
                    </div>
                  </div>
                  {hasDeliveryOrders && (
                    <span
                      className={`rounded-full px-3 py-1 text-[10px] font-bold ${
                        deliveryMargin >= 0
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {deliveryMargin >= 0 ? "Profitable" : "Loss-Making"}
                    </span>
                  )}
                </div>

                {hasDeliveryOrders ? (
                  <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
                    {[
                      {
                        label: "Delivery Revenue",
                        value: `₹${Math.round(deliveryRevenue).toLocaleString("en-IN")}`,
                        color: "blue",
                      },
                      {
                        label: "Dine-In / Takeaway",
                        value: `₹${Math.round(dineInTakeawayRevenue).toLocaleString("en-IN")}`,
                        color: "gray",
                      },
                      {
                        label: "Delivery + Aggregator Cost",
                        value: `₹${Math.round(deliveryRelatedCost).toLocaleString("en-IN")}`,
                        color: "red",
                      },
                      {
                        label: "Net Delivery Margin",
                        value: `₹${Math.round(deliveryMargin).toLocaleString("en-IN")}`,
                        color: deliveryMargin >= 0 ? "emerald" : "red",
                      },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className="rounded-xl border border-gray-200 bg-gray-50 p-3"
                      >
                        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">
                          {item.label}
                        </p>
                        <p
                          className={`mt-2 text-[18px] font-bold ${
                            item.color === "emerald"
                              ? "text-emerald-600"
                              : item.color === "red"
                                ? "text-red-600"
                                : item.color === "gray"
                                  ? "text-gray-700"
                                  : "text-blue-600"
                          }`}
                        >
                          {item.value}
                        </p>
                        {item.label === "Delivery + Aggregator Cost" && (
                          <>
                            <p className="mt-1 text-[11px] text-gray-500">
                              {deliveryCostPercentage.toFixed(1)}% of delivery
                              revenue
                            </p>
                            <p className="text-[11px] text-gray-400">
                              Aggregator commission:{" "}
                              {aggregatorCommissionPercentage.toFixed(1)}%
                            </p>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 py-8 text-center">
                    <p className="text-[12px] text-gray-400">
                      No online/delivery orders recorded this month yet.
                    </p>
                  </div>
                )}
              </div>

              {/* ================= CUSTOMER ACQUISITION & ROI ================= */}

              <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="mb-4 flex items-start gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50">
                    <ViewfinderCircleIcon className="h-4 w-4 text-violet-600" />
                  </div>
                  <div>
                    <h3 className="text-[18px] font-bold tracking-tight text-gray-900">
                      Customer Acquisition & ROI
                    </h3>
                    <p className="mt-1 text-[12px] text-gray-500">
                      Marketing efficiency and return on your branch investment,
                      this month
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
                  {[
                    {
                      label: "New Customers",
                      value: newCustomersThisMonth.toLocaleString("en-IN"),
                      sub: "First purchase this month",
                      color: "blue",
                    },
                    {
                      label: "CAC",
                      value:
                        newCustomersThisMonth > 0
                          ? `₹${Math.round(customerAcquisitionCost).toLocaleString("en-IN")}`
                          : "—",
                      sub: "Marketing spend ÷ new customers",
                      color: "orange",
                    },
                    {
                      label: "Monthly ROI",
                      value:
                        monthlyRoiPercentage !== null
                          ? `${monthlyRoiPercentage.toFixed(1)}%`
                          : "—",
                      sub: "EBITDA ÷ initial investment (this month's rate)",
                      color:
                        monthlyRoiPercentage !== null &&
                        monthlyRoiPercentage >= 0
                          ? "emerald"
                          : "red",
                    },
                    {
                      label: "Payback Period",
                      value: paybackMonths ? `${paybackMonths} mo` : "—",
                      sub: "Investment ÷ EBITDA, at this rate",
                      color: "violet",
                    },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="rounded-xl border border-gray-200 bg-gray-50 p-3"
                    >
                      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">
                        {item.label}
                      </p>
                      <p
                        className={`mt-2 text-[18px] font-bold ${
                          item.color === "emerald"
                            ? "text-emerald-600"
                            : item.color === "red"
                              ? "text-red-600"
                              : item.color === "violet"
                                ? "text-violet-600"
                                : item.color === "orange"
                                  ? "text-orange-600"
                                  : "text-blue-600"
                        }`}
                      >
                        {item.value}
                      </p>
                      <p className="mt-1 text-[11px] text-gray-500">
                        {item.sub}
                      </p>
                    </div>
                  ))}
                </div>
                {!initialInvestment && (
                  <p className="mt-3 text-[11px] text-gray-400">
                    Add an Initial Investment amount in Insights Setup →
                    Financial Targets to see ROI and payback period.
                  </p>
                )}
              </div>

              {/* ================= TABLE OPERATIONS ================= */}

              <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="mb-4 flex items-start gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50">
                    <CakeIcon className="h-4 w-4 text-teal-600" />
                  </div>
                  <div>
                    <h3 className="text-[18px] font-bold tracking-tight text-gray-900">
                      Table Operations & Space Efficiency
                    </h3>
                    <p className="mt-1 text-[12px] text-gray-500">
                      Table turnover, seat utilization and sales per sq. ft.,
                      this month
                    </p>
                  </div>
                </div>

                {tableOps && tableOps.totalTables > 0 ? (
                  <>
                    <div className="grid grid-cols-2 gap-3 xl:grid-cols-5">
                      {[
                        {
                          label: "Table Turnover",
                          value: tableOps.tableTurnoverRate.toFixed(1),
                          sub: "closed sessions ÷ total tables, this month",
                          color: "blue",
                        },
                        {
                          label: "Turns / Table / Day",
                          value: tableOps.turnsPerTablePerDay.toFixed(2),
                          sub: "average daily turnover pace",
                          color: "violet",
                        },
                        {
                          label: "Seat Utilization",
                          value: `${tableOps.seatUtilizationPercentage.toFixed(1)}%`,
                          sub: "occupied vs. available seat-hours",
                          color:
                            tableOps.seatUtilizationPercentage >= 50
                              ? "emerald"
                              : "orange",
                        },
                        {
                          label: "Total Seats",
                          value: tableOps.totalCapacity.toLocaleString("en-IN"),
                          sub: `${tableOps.totalTables} tables`,
                          color: "gray",
                        },
                        {
                          label: "Sales / Sq. Ft.",
                          value:
                            salesPerSqFt !== null
                              ? `₹${Math.round(salesPerSqFt).toLocaleString("en-IN")}`
                              : "—",
                          sub:
                            salesPerSqFt !== null
                              ? "annualized revenue ÷ area"
                              : "add Area (Sq. Ft.) in Settings",
                          color: "emerald",
                        },
                      ].map((item) => (
                        <div
                          key={item.label}
                          className="rounded-xl border border-gray-200 bg-gray-50 p-3"
                        >
                          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">
                            {item.label}
                          </p>
                          <p
                            className={`mt-2 text-[18px] font-bold ${
                              item.color === "emerald"
                                ? "text-emerald-600"
                                : item.color === "orange"
                                  ? "text-orange-600"
                                  : item.color === "violet"
                                    ? "text-violet-600"
                                    : item.color === "gray"
                                      ? "text-gray-700"
                                      : "text-blue-600"
                            }`}
                          >
                            {item.value}
                          </p>
                          <p className="mt-1 text-[11px] text-gray-500">
                            {item.sub}
                          </p>
                        </div>
                      ))}
                    </div>
                    <p className="mt-3 text-[11px] text-gray-400">
                      Seat Utilization assumes each occupied table is filled to
                      capacity for its duration — party-size isn't tracked, so
                      this is a time-occupancy estimate, not a true covers-based
                      figure.
                    </p>
                    {!tableOps.hasOperatingHours && (
                      <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-700">
                        ⚠ This branch's opening/closing time isn't set — Seat
                        Utilization is using a default 12-hour day estimate. Set
                        exact hours in Settings for a more accurate number.
                      </p>
                    )}
                    {tableOps.tablesWithMissingCapacity > 0 && (
                      <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-700">
                        ⚠ {tableOps.tablesWithMissingCapacity} table(s) have no
                        seat capacity set — Total Seats and Seat Utilization are
                        undercounting them. Set capacity in Shops → Tables.
                      </p>
                    )}
                  </>
                ) : (
                  <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 py-8 text-center">
                    <p className="text-[12px] text-gray-400">
                      No tables configured for this branch yet.
                    </p>
                  </div>
                )}
              </div>

              {/* ================= INVENTORY & CASH CONVERSION CYCLE ================= */}

              <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="mb-4 flex items-start gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50">
                    <BuildingStorefrontIcon className="h-4 w-4 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="text-[18px] font-bold tracking-tight text-gray-900">
                      Inventory & Cash Conversion Cycle
                    </h3>
                    <p className="mt-1 text-[12px] text-gray-500">
                      How fast stock turns over and cash comes back, this month
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
                  {[
                    {
                      label: "Inventory Turnover",
                      value:
                        inventoryTurnover !== null
                          ? `${inventoryTurnover.toFixed(1)}x`
                          : "—",
                      sub: "food cost ÷ avg. inventory value",
                      color: "blue",
                    },
                    {
                      label: "Days Inventory Outstanding",
                      value:
                        daysInventoryOutstanding !== null
                          ? `${Math.round(daysInventoryOutstanding)}d`
                          : "—",
                      sub: "days stock takes to turn over",
                      color: "violet",
                    },
                    {
                      label: "Days Payable Outstanding",
                      value:
                        daysPayableOutstanding !== null
                          ? `${Math.round(daysPayableOutstanding)}d`
                          : "—",
                      sub: "vendor dues outstanding vs. food cost",
                      color: "orange",
                    },
                    {
                      label: "Cash Conversion Cycle",
                      value:
                        cashConversionCycle !== null
                          ? `${Math.round(cashConversionCycle)}d`
                          : "—",
                      sub: "DIO + DSO (0) − DPO",
                      color:
                        cashConversionCycle !== null && cashConversionCycle <= 0
                          ? "emerald"
                          : "red",
                    },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="rounded-xl border border-gray-200 bg-gray-50 p-3"
                    >
                      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">
                        {item.label}
                      </p>
                      <p
                        className={`mt-2 text-[18px] font-bold ${
                          item.color === "emerald"
                            ? "text-emerald-600"
                            : item.color === "red"
                              ? "text-red-600"
                              : item.color === "violet"
                                ? "text-violet-600"
                                : item.color === "orange"
                                  ? "text-orange-600"
                                  : "text-blue-600"
                        }`}
                      >
                        {item.value}
                      </p>
                      <p className="mt-1 text-[11px] text-gray-500">
                        {item.sub}
                      </p>
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-[11px] text-gray-400">
                  Average Inventory uses this month's opening/closing restock
                  values (or live stock value if restock history isn't set up
                  yet). Days Sales Outstanding is 0 since guests pay in full at
                  the time of sale — there's no customer credit to collect.
                </p>
                {!hasVendorInvoices && (
                  <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-700">
                    ⚠ No vendor invoices logged for this branch — Days Payable
                    Outstanding is showing as 0, which may understate your real
                    payment cycle. Log invoices in Vendors to fix this.
                  </p>
                )}
              </div>
            </div>
  );
}
