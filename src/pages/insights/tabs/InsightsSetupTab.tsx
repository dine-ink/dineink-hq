import { useState } from "react";
import {
  ArrowTrendingUpIcon,
  BanknotesIcon,
  BuildingLibraryIcon,
  BuildingOffice2Icon,
  CakeIcon,
  CalendarDateRangeIcon,
  ChartBarIcon,
  ChartPieIcon,
  CheckBadgeIcon,
  CheckIcon,
  ClipboardDocumentListIcon,
  DocumentTextIcon,
  PercentBadgeIcon,
  PresentationChartLineIcon,
  RocketLaunchIcon,
  ShieldCheckIcon,
  ShoppingCartIcon,
  SparklesIcon,
  TruckIcon,
  UsersIcon,
  ViewfinderCircleIcon,
  WalletIcon,
} from "@heroicons/react/24/outline";
import MobileTableCards from "@/components/common/MobileTableCards";
import type { InsightsMetrics } from "@/pages/insights/useInsightsMetrics";

/**
 * Insights Setup — the form behind every figure on Overview: fixed and variable
 * expenses, labour, targets, tax, growth assumptions and the initial
 * investment.
 *
 * The last of the three tabs to come out of Insights.tsx. It is the largest at
 * 1,932 lines, but it is also the plainest: a sectioned form over one piece of
 * state. `insightsSection` (which section is open) came down with it, being used
 * nowhere else.
 *
 * handleSaveInsights stays on the page and arrives as a prop. It writes the
 * same insightsData the page owns and then refetches, so moving it would have
 * split one save across two files.
 */

interface InsightsSetupTabProps {
  metrics: InsightsMetrics;
  insightsData: any;
  setInsightsData: React.Dispatch<React.SetStateAction<any>>;
  inventoryStockValue: number;
  staffData: any[];
  setActiveTab: (tab: string) => void;
  handleSaveInsights: () => Promise<void>;
}

export default function InsightsSetupTab({ metrics, insightsData, setInsightsData, inventoryStockValue, staffData, setActiveTab, handleSaveInsights }: InsightsSetupTabProps) {
  // Which section of the form is open. Used by this tab alone, so it lives
  // here rather than on the page.
  const [insightsSection, setInsightsSection] = useState("Fixed Expenses");

  // Aliased back to the names the markup already used, so this is a move
  // rather than a rewrite.
  const {
    targetEbitda,
    targetFoodCost,
    targetPrimeCost,
    targetGrossMargin,
    setupCompletion,
    manualFoodCostSet,
    effectiveFoodCost,
    actualFoodCostPercentage,
  } = metrics;

  return (
            <div className="flex flex-col bg-[#f6f7fb] lg:h-full lg:flex-row lg:overflow-hidden">
              {/* ================= SIDEBAR ================= */}

              {/* On a phone this is not a sidebar but a slim sticky strip —
                  readiness, Save, and a swipeable section picker — so the first
                  form field is visible immediately instead of ~575px down. */}
              <div className="hide-scrollbar sticky top-0 z-30 w-full shrink-0 space-y-2 border-b border-gray-200 bg-white px-3 py-2 lg:static lg:h-full lg:w-[230px] lg:space-y-0 lg:overflow-y-auto lg:border-r lg:border-b-0 lg:p-4">
                {/* AI CARD */}

                {/* Decorative on a phone — 155px of vertical space that pushes
                    the actual form off-screen, so it is desktop-only. */}
                <div className="hidden rounded-xl border border-red-100 bg-[#b10000] p-4 shadow-sm lg:block">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15">
                    <SparklesIcon className="h-5 w-5 text-white" />
                  </div>

                  <h2 className="mt-4 text-[18px] font-bold text-white">
                    Financial Intelligence
                  </h2>

                  <p className="mt-1 text-[12px] leading-6 text-red-100">
                    AI forecasting & profitability engine
                  </p>

                  <div className="mt-4 inline-flex rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold text-white">
                    AI Active
                  </div>
                </div>

                {/* COMPLETION */}

                {/* Mobile: one slim line inside the sticky strip, with Save
                    alongside so it stays reachable down a long form. */}
                <div className="flex items-center gap-3 lg:hidden">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-[11px] font-semibold text-gray-600">
                        Setup readiness
                      </span>
                      <span className="text-[12px] font-bold text-[#b10000]">
                        {setupCompletion}%
                      </span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-gray-100">
                      <div
                        className="h-full rounded-full bg-[#b10000] transition-all duration-500"
                        style={{ width: `${setupCompletion}%` }}
                      />
                    </div>
                  </div>
                  {insightsSection !== "Labour" && (
                    <button
                      onClick={handleSaveInsights}
                      className="flex shrink-0 items-center gap-1.5 rounded-xl bg-[#b10000] px-3 py-2 text-[12px] font-semibold text-white"
                    >
                      <CheckIcon className="h-3.5 w-3.5" />
                      Save
                    </button>
                  )}
                </div>

                {/* Desktop: the full readiness card. */}
                <div className="mt-4 hidden rounded-xl border border-gray-200 bg-white p-4 lg:block">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        Setup Readiness
                      </p>
                      <p className="mt-1 text-[11px] text-gray-500">
                        AI configuration progress
                      </p>
                    </div>
                    <p className="text-xl font-bold text-[#b10000]">
                      {setupCompletion}%
                    </p>
                  </div>
                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full bg-[#b10000] transition-all duration-500"
                      style={{ width: `${setupCompletion}%` }}
                    />
                  </div>
                </div>

                {/* NAVIGATION — swipeable pill strip on a phone, vertical list
                    from lg up. */}

                <div className="hide-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-0.5 lg:mx-0 lg:mt-4 lg:flex-col lg:gap-0 lg:space-y-1.5 lg:overflow-x-visible lg:px-0 lg:pb-0">
                  {[
                    {
                      label: "Fixed Expenses",
                      icon: BuildingOffice2Icon,
                    },
                    {
                      label: "Variable Expenses",
                      icon: PresentationChartLineIcon,
                    },
                    {
                      label: "Raw Material Cost",
                      icon: ShoppingCartIcon,
                    },
                    {
                      label: "Labour",
                      icon: UsersIcon,
                    },
                    {
                      label: "Financial Targets",
                      icon: ViewfinderCircleIcon,
                    },
                    {
                      label: "Tax & Finance",
                      icon: BuildingLibraryIcon,
                    },
                    {
                      label: "Business Assumptions",
                      icon: ArrowTrendingUpIcon,
                    },
                  ].map((item) => {
                    const Icon = item.icon;

                    return (
                      <button
                        key={item.label}
                        onClick={() => setInsightsSection(item.label)}
                        aria-current={
                          insightsSection === item.label ? "true" : undefined
                        }
                        className={`flex shrink-0 items-center gap-2 rounded-full border px-3 py-2 text-left text-[12px] font-semibold whitespace-nowrap transition-all duration-200 lg:w-full lg:gap-3 lg:rounded-xl lg:border-0 lg:px-3 lg:py-2.5 lg:text-sm lg:font-medium ${
                          insightsSection === item.label
                            ? "border-[#b10000] bg-[#b10000] text-white shadow-sm"
                            : "border-gray-200 text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        <Icon className="h-4 w-4 shrink-0" />

                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ================= CONTENT ================= */}

              <div className="flex-1 overflow-y-auto p-4">
                <div className="mx-auto max-w-7xl space-y-4">
                  {/* TOP HEADER */}

                  {/* Static on a phone — the sticky strip above already holds
                      the section picker and Save, and two stacked sticky
                      elements at top-0 would overlap. */}
                  <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm lg:sticky lg:top-0 lg:z-20">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      {/* LEFT */}

                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#b10000]">
                          <SparklesIcon className="h-4 w-4 text-white" />
                        </div>

                        <div>
                          <h1 className="text-xl font-bold tracking-tight text-gray-900">
                            {insightsSection === "Labour"
                              ? "Labour Intelligence"
                              : insightsSection === "Raw Material Cost"
                                ? "Raw Material / Food Cost"
                                : insightsSection}
                          </h1>

                          <p className="mt-0.5 text-[12px] text-gray-500">
                            AI-powered operational intelligence
                          </p>
                        </div>
                      </div>

                      {/* BUTTON */}

                      {insightsSection !== "Labour" && (
                        <button
                          onClick={handleSaveInsights}
                          className="hidden items-center gap-2 rounded-xl bg-[#b10000] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-[#950000] lg:flex"
                        >
                          <CheckIcon className="h-4 w-4" />
                          Save Setup
                        </button>
                      )}
                    </div>
                  </div>

                  {/* ================= FIXED EXPENSES ================= */}

                  {insightsSection === "Fixed Expenses" && (
                    <div className="space-y-4">
                      {/* KPI */}

                      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                        {/* MONTHLY FIXED */}

                        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                          <p className="text-[12px] font-medium uppercase tracking-wide text-gray-400">
                            Monthly Fixed Cost
                          </p>

                          <p className="mt-2 text-2xl font-bold tracking-tight text-gray-900">
                            ₹
                            {(
                              insightsData.monthlyRent +
                              insightsData.loanEmi +
                              insightsData.internet +
                              insightsData.phoneBills +
                              insightsData.accounting +
                              insightsData.insurance +
                              insightsData.licenses
                            ).toLocaleString("en-IN")}
                          </p>

                          <p className="mt-2 text-[12px] text-gray-500">
                            Operational commitments
                          </p>
                        </div>

                        {/* HEALTH */}

                        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                          <p className="text-[12px] font-medium uppercase tracking-wide text-gray-400">
                            Expense Health
                          </p>

                          <p className="mt-2 text-2xl font-bold tracking-tight text-emerald-600">
                            Stable
                          </p>

                          <p className="mt-2 text-[12px] text-gray-500">
                            Financial commitments manageable
                          </p>
                        </div>

                        {/* AI */}

                        <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
                          <div className="flex items-start gap-3">
                            <SparklesIcon className="mt-0.5 h-4 w-4 text-blue-600" />

                            <p className="text-sm leading-6 text-blue-900">
                              Fixed cost ratio is currently within healthy
                              operational range.
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* FORM */}

                      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                        <div className="mb-5">
                          <h3 className="text-lg font-semibold text-gray-900">
                            Monthly Fixed Expenses
                          </h3>

                          <p className="mt-1 text-sm text-gray-500">
                            Configure recurring operational commitments
                          </p>
                        </div>

                        <div className="rounded-xl border border-gray-200 bg-white p-3 mb-3">
                          <div className="mb-2 flex items-center justify-between">
                            <label className="block text-sm font-medium text-gray-700">
                              Rent
                            </label>
                            <div className="flex rounded-lg border border-gray-200 bg-gray-50 p-0.5 text-[11px] font-semibold">
                              <button
                                type="button"
                                onClick={() =>
                                  setInsightsData({ ...insightsData, rentModel: "FIXED" })
                                }
                                className={`rounded-md px-2.5 py-1 transition-all ${
                                  (insightsData.rentModel || "FIXED") === "FIXED"
                                    ? "bg-[#b10000] text-white shadow-sm"
                                    : "text-gray-500"
                                }`}
                              >
                                Fixed Monthly
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setInsightsData({ ...insightsData, rentModel: "REVENUE_SHARE" })
                                }
                                className={`rounded-md px-2.5 py-1 transition-all ${
                                  insightsData.rentModel === "REVENUE_SHARE"
                                    ? "bg-[#b10000] text-white shadow-sm"
                                    : "text-gray-500"
                                }`}
                              >
                                Revenue Share
                              </button>
                            </div>
                          </div>

                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                              ₹
                            </span>
                            <input
                              type="number"
                              value={insightsData.monthlyRent || ""}
                              disabled={insightsData.rentModel === "REVENUE_SHARE"}
                              onChange={(e) =>
                                setInsightsData({
                                  ...insightsData,
                                  monthlyRent: Number(e.target.value),
                                })
                              }
                              placeholder="0"
                              className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-8 pr-3 text-sm outline-none transition-all duration-200 focus:border-red-300 focus:bg-white disabled:text-gray-400"
                            />
                          </div>
                          <p className="mt-2 text-[11px] text-gray-400">
                            {insightsData.rentModel === "REVENUE_SHARE"
                              ? "Rent is calculated automatically from sales — see percentages below."
                              : "Fixed monthly operational expense"}
                          </p>

                          {insightsData.rentModel === "REVENUE_SHARE" && (
                            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                              {[
                                { label: "Dine-In", key: "rentSharePercentDineIn" },
                                { label: "Takeaway", key: "rentSharePercentTakeaway" },
                                { label: "Delivery", key: "rentSharePercentDelivery" },
                              ].map((f) => (
                                <div key={f.key}>
                                  <label className="mb-1 block text-[11px] font-medium text-gray-600">
                                    {f.label} %
                                  </label>
                                  <div className="relative">
                                    <input
                                      type="number"
                                      min="0"
                                      max="100"
                                      value={insightsData[f.key] || ""}
                                      onChange={(e) =>
                                        setInsightsData({
                                          ...insightsData,
                                          [f.key]: Number(e.target.value),
                                        })
                                      }
                                      placeholder="0"
                                      className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2 pl-3 pr-7 text-sm outline-none focus:border-red-300 focus:bg-white"
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-gray-400">
                                      %
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                          {[
                            {
                              label: "Loan EMI",
                              key: "loanEmi",
                            },
                            {
                              label: "Internet",
                              key: "internet",
                            },
                            {
                              label: "Phone Bills",
                              key: "phoneBills",
                            },
                            {
                              label: "Accounting",
                              key: "accounting",
                            },
                            {
                              label: "Insurance",
                              key: "insurance",
                            },
                            {
                              label: "Licenses",
                              key: "licenses",
                            },
                          ].map((field) => (
                            <div
                              key={field.key}
                              className="rounded-xl border border-gray-200 bg-white p-3"
                            >
                              <label className="mb-2 block text-sm font-medium text-gray-700">
                                {field.label}
                              </label>

                              <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                                  ₹
                                </span>

                                <input
                                  type="number"
                                  value={insightsData[field.key] || ""}
                                  onChange={(e) =>
                                    setInsightsData({
                                      ...insightsData,
                                      [field.key]: Number(e.target.value),
                                    })
                                  }
                                  placeholder="0"
                                  className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-8 pr-3 text-sm outline-none transition-all duration-200 focus:border-red-300 focus:bg-white"
                                />
                              </div>

                              <p className="mt-2 text-[11px] text-gray-400">
                                Monthly operational expense
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                  {/* ================= VARIABLE EXPENSES ================= */}

                  {insightsSection === "Variable Expenses" && (
                    <div className="space-y-4">
                      {/* KPI */}

                      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                        {/* MONTHLY VARIABLE */}

                        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                          <p className="text-[12px] font-medium uppercase tracking-wide text-gray-400">
                            Monthly Variable Cost
                          </p>

                          <p className="mt-2 text-2xl font-bold tracking-tight text-gray-900">
                            ₹
                            {(
                              insightsData.deliveryCharges +
                              insightsData.packaging +
                              insightsData.paymentGateway +
                              insightsData.aggregatorCommission +
                              insightsData.electricity +
                              insightsData.gas +
                              insightsData.maintenance +
                              insightsData.fuel
                            ).toLocaleString("en-IN")}
                          </p>

                          <p className="mt-2 text-[12px] text-gray-500">
                            Operational running expenses
                          </p>
                        </div>

                        {/* HEALTH */}

                        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                          <p className="text-[12px] font-medium uppercase tracking-wide text-gray-400">
                            Expense Health
                          </p>

                          <p className="mt-2 text-2xl font-bold tracking-tight text-orange-500">
                            Moderate
                          </p>

                          <p className="mt-2 text-[12px] text-gray-500">
                            Utility & operational costs increasing
                          </p>
                        </div>

                        {/* AI */}

                        <div className="rounded-xl border border-orange-100 bg-orange-50 p-4">
                          <div className="flex items-start gap-3">
                            <SparklesIcon className="mt-0.5 h-4 w-4 text-orange-600" />

                            <p className="text-sm leading-6 text-orange-900">
                              Electricity and aggregator charges are
                              contributing heavily to monthly variable expenses.
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* FORM */}

                      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                        <div className="mb-5">
                          <h3 className="text-lg font-semibold text-gray-900">
                            Monthly Variable Expenses
                          </h3>

                          <p className="mt-1 text-sm text-gray-500">
                            Configure operational & utility based expenses
                          </p>
                        </div>

                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                          {[
                            {
                              label: "Delivery Charges",
                              key: "deliveryCharges",
                            },
                            {
                              label: "Packaging",
                              key: "packaging",
                            },
                            {
                              label: "Payment Gateway",
                              key: "paymentGateway",
                            },
                            {
                              label: "Aggregator Commission",
                              key: "aggregatorCommission",
                            },
                            {
                              label: "Electricity",
                              key: "electricity",
                            },
                            {
                              label: "Gas",
                              key: "gas",
                            },
                            {
                              label: "Maintenance",
                              key: "maintenance",
                            },
                            {
                              label: "Fuel",
                              key: "fuel",
                            },
                            {
                              label: "Marketing Spend",
                              key: "marketingSpend",
                            },
                          ].map((field) => (
                            <div
                              key={field.key}
                              className="rounded-xl border border-gray-200 bg-white p-3"
                            >
                              <label className="mb-2 block text-sm font-medium text-gray-700">
                                {field.label}
                              </label>

                              <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                                  ₹
                                </span>

                                <input
                                  type="number"
                                  value={insightsData[field.key] || ""}
                                  onChange={(e) =>
                                    setInsightsData({
                                      ...insightsData,
                                      [field.key]: Number(e.target.value),
                                    })
                                  }
                                  placeholder="0"
                                  className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-8 pr-3 text-sm outline-none transition-all duration-200 focus:border-red-300 focus:bg-white"
                                />
                              </div>

                              <p className="mt-2 text-[11px] text-gray-400">
                                Monthly operational expense
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                  {insightsSection === "Raw Material Cost" && (
                    <div className="space-y-4">
                      {/* KPI */}
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                          <p className="text-[12px] font-medium uppercase tracking-wide text-gray-400">
                            This Month's Food Cost
                          </p>
                          <p className="mt-2 text-2xl font-bold tracking-tight text-gray-900">
                            ₹{effectiveFoodCost.toLocaleString("en-IN")}
                          </p>
                          <p className="mt-2 text-[12px] text-gray-500">
                            {manualFoodCostSet
                              ? "Manual entry"
                              : "From inventory data"}
                          </p>
                        </div>
                        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                          <p className="text-[12px] font-medium uppercase tracking-wide text-gray-400">
                            Food Cost %
                          </p>
                          <p
                            className={`mt-2 text-2xl font-bold tracking-tight ${Number(actualFoodCostPercentage) > 35 ? "text-red-600" : "text-emerald-600"}`}
                          >
                            {actualFoodCostPercentage}%
                          </p>
                          <p className="mt-2 text-[12px] text-gray-500">
                            Target: &lt;35% of revenue
                          </p>
                        </div>
                        <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
                          <div className="flex items-start gap-3">
                            <SparklesIcon className="mt-0.5 h-4 w-4 text-blue-600" />
                            <p className="text-sm leading-6 text-blue-900">
                              {manualFoodCostSet
                                ? "Using your manually entered raw material cost for EBITDA calculation."
                                : inventoryStockValue > 0
                                  ? "No manual entry set. Using current inventory stock value (qty × unit price) for EBITDA. Enter a total below to override."
                                  : "No manual entry set and no inventory stock found. Enter a total below to include raw material cost in EBITDA."}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* FORM */}
                      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                        <div className="mb-5">
                          <h3 className="text-lg font-semibold text-gray-900">
                            Manual Raw Material Cost
                          </h3>
                          <p className="mt-1 text-sm text-gray-500">
                            Enter your total monthly spend on raw materials /
                            groceries. When set, this overrides the
                            per-ingredient inventory calculation in your EBITDA.
                          </p>
                        </div>

                        <div className="max-w-sm">
                          <label className="mb-2 block text-sm font-medium text-gray-700">
                            Monthly Total RM Spend
                          </label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                              ₹
                            </span>
                            <input
                              type="number"
                              value={insightsData.manualFoodCost || ""}
                              onChange={(e) =>
                                setInsightsData({
                                  ...insightsData,
                                  manualFoodCost: Number(e.target.value),
                                })
                              }
                              placeholder="0"
                              className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-8 pr-3 text-sm outline-none transition-all duration-200 focus:border-red-300 focus:bg-white"
                            />
                          </div>
                          <p className="mt-2 text-[11px] text-gray-400">
                            Leave at 0 to auto-calculate from inventory restock
                            data
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  {insightsSection === "Labour" && (
                    <div className="space-y-4">
                      {/* ================= KPI ================= */}

                      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
                        {/* TOTAL STAFF */}

                        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">
                                Staff
                              </p>

                              <p className="mt-2 text-2xl font-bold tracking-tight text-gray-900">
                                {staffData?.length || 0}
                              </p>

                              <p className="mt-1 text-[11px] text-gray-500">
                                Active workforce
                              </p>
                            </div>

                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
                              <UsersIcon className="h-4 w-4 text-blue-600" />
                            </div>
                          </div>
                        </div>

                        {/* LABOUR COST */}

                        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">
                                Labour Cost
                              </p>

                              <p className="mt-2 text-2xl font-bold tracking-tight text-gray-900">
                                ₹
                                {(
                                  staffData?.reduce(
                                    (sum: number, s: any) =>
                                      sum + (s.salary || 0),
                                    0,
                                  ) || 0
                                ).toLocaleString("en-IN")}
                              </p>

                              <p className="mt-1 text-[11px] text-gray-500">
                                Monthly salary
                              </p>
                            </div>

                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#b10000]">
                              <WalletIcon className="h-4 w-4 text-white" />
                            </div>
                          </div>
                        </div>

                        {/* AVG SALARY */}

                        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">
                                Avg Salary
                              </p>

                              <p className="mt-2 text-2xl font-bold tracking-tight text-gray-900">
                                ₹
                                {staffData?.length
                                  ? Math.round(
                                      staffData.reduce(
                                        (sum: number, s: any) =>
                                          sum + (s.salary || 0),
                                        0,
                                      ) / staffData.length,
                                    ).toLocaleString("en-IN")
                                  : 0}
                              </p>

                              <p className="mt-1 text-[11px] text-gray-500">
                                Per employee
                              </p>
                            </div>

                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50">
                              <BanknotesIcon className="h-4 w-4 text-violet-600" />
                            </div>
                          </div>
                        </div>

                        {/* FULL TIME */}

                        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">
                                Full Time
                              </p>

                              <p className="mt-2 text-2xl font-bold tracking-tight text-gray-900">
                                {staffData?.filter(
                                  (s: any) => s.employmentType === "FULL_TIME",
                                ).length || 0}
                              </p>

                              <p className="mt-1 text-[11px] text-gray-500">
                                Permanent staff
                              </p>
                            </div>

                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50">
                              <CheckBadgeIcon className="h-4 w-4 text-emerald-600" />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* ================= DEPARTMENT BREAKDOWN ================= */}

                      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                        {/* HEADER */}

                        <div className="mb-5 flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50">
                            <BuildingOffice2Icon className="h-4 w-4 text-indigo-600" />
                          </div>

                          <div>
                            <h3 className="text-[18px] font-semibold text-gray-900">
                              Department Breakdown
                            </h3>

                            <p className="mt-1 text-[12px] text-gray-500">
                              Salary distribution by department
                            </p>
                          </div>
                        </div>

                        {/* GRID */}

                        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
                          {[
                            "KITCHEN",
                            "SERVICE",
                            "DELIVERY",
                            "CLEANING",
                            "ADMIN",
                            "SECURITY",
                            "PURCHASE",
                            "MAINTENANCE",
                          ].map((dept) => {
                            const deptStaff =
                              staffData?.filter(
                                (s: any) => s.department === dept,
                              ) || [];

                            const deptSalary = deptStaff.reduce(
                              (sum: number, s: any) => sum + (s.salary || 0),
                              0,
                            );

                            return (
                              <div
                                key={dept}
                                className="rounded-xl border border-gray-200 bg-gray-50 p-4 transition-all duration-200 hover:bg-white"
                              >
                                <div className="flex items-start justify-between">
                                  <div>
                                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">
                                      {dept}
                                    </p>

                                    <p className="mt-2 text-xl font-bold tracking-tight text-gray-900">
                                      ₹{deptSalary.toLocaleString("en-IN")}
                                    </p>

                                    <p className="mt-1 text-[11px] text-gray-500">
                                      {deptStaff.length} staff members
                                    </p>
                                  </div>

                                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#b10000]">
                                    <UsersIcon className="h-4 w-4 text-white" />
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* ================= STAFF TABLE ================= */}

                      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                        {/* HEADER */}

                        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#b10000]">
                              <ClipboardDocumentListIcon className="h-4 w-4 text-white" />
                            </div>

                            <div>
                              <h3 className="text-[18px] font-semibold text-gray-900">
                                Staff Overview
                              </h3>

                              <p className="mt-1 text-[12px] text-gray-500">
                                Restaurant workforce summary
                              </p>
                            </div>
                          </div>

                          <div className="rounded-full bg-[#b10000]/10 px-3 py-1 text-[11px] font-semibold text-[#b10000]">
                            {staffData?.length || 0} Employees
                          </div>
                        </div>

                        {/* TABLE */}

                        <div className="overflow-x-auto">
                          <MobileTableCards>
                          <table className="min-w-full">
                            {/* HEAD */}

                            <thead className="bg-gray-50">
                              <tr>
                                {[
                                  "Name",
                                  "Role",
                                  "Department",
                                  "Salary",
                                  "Employment",
                                  "Shift",
                                  "Hours",
                                ].map((head) => (
                                  <th
                                    key={head}
                                    className="
                    whitespace-nowrap
                    px-4
                    py-3
                    text-left
                    text-[10px]
                    font-bold
                    uppercase
                    tracking-[0.14em]
                    text-gray-400
                  "
                                  >
                                    {head}
                                  </th>
                                ))}
                              </tr>
                            </thead>

                            {/* BODY */}

                            <tbody>
                              {staffData?.map((staff: any, index: number) => (
                                <tr
                                  key={index}
                                  className="border-t border-gray-100 transition hover:bg-gray-50"
                                >
                                  {/* NAME */}

                                  <td className="px-4 py-3">
                                    <div className="flex items-center gap-3">
                                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-100 text-sm font-semibold text-gray-700">
                                        {staff.name?.charAt(0)}
                                      </div>

                                      <div>
                                        <p className="text-sm font-semibold text-gray-900">
                                          {staff.name}
                                        </p>

                                        <p className="text-[11px] text-gray-400">
                                          Staff member
                                        </p>
                                      </div>
                                    </div>
                                  </td>

                                  {/* ROLE */}

                                  <td className="px-4 py-3 text-sm text-gray-600">
                                    {staff.role}
                                  </td>

                                  {/* DEPARTMENT */}

                                  <td className="px-4 py-3">
                                    <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-600">
                                      {staff.department}
                                    </span>
                                  </td>

                                  {/* SALARY */}

                                  <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                                    ₹{staff.salary?.toLocaleString("en-IN")}
                                  </td>

                                  {/* EMPLOYMENT */}

                                  <td className="px-4 py-3">
                                    <span
                                      className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                                        staff.employmentType === "FULL_TIME"
                                          ? "bg-emerald-50 text-emerald-600"
                                          : "bg-amber-50 text-amber-600"
                                      }`}
                                    >
                                      {staff.employmentType}
                                    </span>
                                  </td>

                                  {/* SHIFT */}

                                  <td className="px-4 py-3 text-sm text-gray-600">
                                    {staff.shift}
                                  </td>

                                  {/* HOURS */}

                                  <td className="px-4 py-3 text-sm text-gray-600">
                                    {staff.monthlyWorkingHours}h
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          </MobileTableCards>
                        </div>
                      </div>
                    </div>
                  )}
                  {/* ================= FINANCIAL TARGETS ================= */}

                  {insightsSection === "Financial Targets" && (
                    <div className="space-y-4">
                      {/* ================= KPI ================= */}

                      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
                        {/* TARGET EBITDA */}

                        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">
                                EBITDA Target
                              </p>

                              <p className="mt-2 text-2xl font-bold tracking-tight text-gray-900">
                                {targetEbitda || 0}%
                              </p>

                              <p className="mt-1 text-[11px] text-gray-500">
                                Profitability goal
                              </p>
                            </div>

                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50">
                              <ArrowTrendingUpIcon className="h-4 w-4 text-violet-600" />
                            </div>
                          </div>
                        </div>

                        {/* FOOD COST */}

                        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">
                                Food Cost
                              </p>

                              <p className="mt-2 text-2xl font-bold tracking-tight text-gray-900">
                                {targetFoodCost || 0}%
                              </p>

                              <p className="mt-1 text-[11px] text-gray-500">
                                Inventory efficiency
                              </p>
                            </div>

                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50">
                              <CakeIcon className="h-4 w-4 text-orange-600" />
                            </div>
                          </div>
                        </div>

                        {/* GROSS MARGIN */}

                        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">
                                Gross Margin
                              </p>

                              <p className="mt-2 text-2xl font-bold tracking-tight text-gray-900">
                                {targetGrossMargin || 0}%
                              </p>

                              <p className="mt-1 text-[11px] text-gray-500">
                                Revenue margin target
                              </p>
                            </div>

                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50">
                              <ChartBarIcon className="h-4 w-4 text-emerald-600" />
                            </div>
                          </div>
                        </div>

                        {/* PRIME COST */}

                        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">
                                Prime Cost
                              </p>

                              <p className="mt-2 text-2xl font-bold tracking-tight text-gray-900">
                                {targetPrimeCost || 0}%
                              </p>

                              <p className="mt-1 text-[11px] text-gray-500">
                                Labour + food cost
                              </p>
                            </div>

                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#b10000]">
                              <ChartPieIcon className="h-4 w-4 text-white" />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* ================= TARGET FORM ================= */}

                      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                        {/* HEADER */}

                        <div className="mb-5 flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#b10000]">
                            <ViewfinderCircleIcon className="h-4 w-4 text-white" />
                          </div>

                          <div>
                            <h3 className="text-[18px] font-semibold text-gray-900">
                              Financial Goal Configuration
                            </h3>

                            <p className="mt-1 text-[12px] text-gray-500">
                              Configure profitability & operational targets
                            </p>
                          </div>
                        </div>

                        <p className="mb-4 rounded-lg bg-blue-50 px-3 py-2 text-[11px] text-blue-700">
                          Target EBITDA, Food Cost %, and Prime Cost % are now
                          configured under the{" "}
                          <button
                            type="button"
                            onClick={() =>
                              setActiveTab("Financial Assumptions")
                            }
                            className="font-semibold underline"
                          >
                            Financial Assumptions
                          </button>{" "}
                          tab, with restaurant-wide defaults and per-branch
                          overrides.
                        </p>

                        {/* FORM GRID */}

                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                          {[
                            {
                              label: "Target Gross Margin %",
                              key: "targetGrossMargin",
                              helper: "Revenue profitability expectation",
                            },

                            {
                              label: "Monthly Revenue Goal",
                              key: "monthlyRevenueGoal",
                              helper: "Target monthly restaurant revenue",
                              prefix: "₹",
                            },

                            {
                              label: "Monthly Profit Goal",
                              key: "monthlyProfitGoal",
                              helper: "Expected monthly net profit",
                              prefix: "₹",
                            },

                            {
                              label: "Initial Investment",
                              key: "initialInvestment",
                              helper: "One-time capital invested, for ROI",
                              prefix: "₹",
                            },
                          ].map((field) => (
                            <div
                              key={field.key}
                              className="rounded-xl border border-gray-200 bg-white p-3"
                            >
                              <label className="mb-2 block text-sm font-medium text-gray-700">
                                {field.label}
                              </label>

                              <div className="relative">
                                {field.prefix ? (
                                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                                    {field.prefix}
                                  </span>
                                ) : (
                                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                                    %
                                  </span>
                                )}

                                <input
                                  type="number"
                                  value={insightsData[field.key] || ""}
                                  onChange={(e) =>
                                    setInsightsData({
                                      ...insightsData,
                                      [field.key]: Number(e.target.value),
                                    })
                                  }
                                  placeholder="0"
                                  className={`w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 text-sm outline-none transition-all duration-200 focus:border-red-300 focus:bg-white ${
                                    field.prefix ? "pl-8 pr-3" : "pl-3 pr-8"
                                  }`}
                                />
                              </div>

                              <p className="mt-2 text-[11px] text-gray-400">
                                {field.helper}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* ================= TARGET INSIGHTS ================= */}

                      <div className="grid grid-cols-1 gap-3 xl:grid-cols-3">
                        {/* EBITDA */}

                        <div className="rounded-xl border border-violet-100 bg-violet-50 p-4">
                          <div className="flex items-start gap-3">
                            <ArrowTrendingUpIcon className="mt-0.5 h-4 w-4 text-violet-600" />

                            <div>
                              <p className="text-sm font-semibold text-violet-900">
                                EBITDA Strategy
                              </p>

                              <p className="mt-1 text-[12px] leading-6 text-violet-800">
                                Maintaining EBITDA above 15% is considered
                                healthy for most restaurant operations.
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* FOOD */}

                        <div className="rounded-xl border border-orange-100 bg-orange-50 p-4">
                          <div className="flex items-start gap-3">
                            <CakeIcon className="mt-0.5 h-4 w-4 text-orange-600" />

                            <div>
                              <p className="text-sm font-semibold text-orange-900">
                                Food Cost Control
                              </p>

                              <p className="mt-1 text-[12px] leading-6 text-orange-800">
                                Restaurants usually maintain food cost between
                                28%–35% for sustainable profitability.
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* PRIME */}

                        <div className="rounded-xl border border-[#b10000]/20 bg-red-50 p-4">
                          <div className="flex items-start gap-3">
                            <ChartPieIcon className="mt-0.5 h-4 w-4 text-[#b10000]" />

                            <div>
                              <p className="text-sm font-semibold text-[#b10000]">
                                Prime Cost Health
                              </p>

                              <p className="mt-1 text-[12px] leading-6 text-gray-600">
                                Prime cost should ideally stay below 60% for
                                strong operational performance.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ================= TAX & FINANCE ================= */}

                  {insightsSection === "Tax & Finance" && (
                    <div className="space-y-4">
                      {/* ================= KPI ================= */}

                      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
                        {/* GST */}

                        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">
                                GST
                              </p>

                              <p className="mt-2 text-2xl font-bold tracking-tight text-gray-900">
                                {insightsData.gstPercentage || 0}%
                              </p>

                              <p className="mt-1 text-[11px] text-gray-500">
                                Tax percentage
                              </p>
                            </div>

                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
                              <DocumentTextIcon className="h-4 w-4 text-blue-600" />
                            </div>
                          </div>
                        </div>

                        {/* EMI */}

                        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">
                                Loan EMI
                              </p>

                              <p className="mt-2 text-2xl font-bold tracking-tight text-gray-900">
                                ₹
                                {(
                                  insightsData.monthlyLoanEmi || 0
                                ).toLocaleString("en-IN")}
                              </p>

                              <p className="mt-1 text-[11px] text-gray-500">
                                Monthly repayments
                              </p>
                            </div>

                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#b10000]">
                              <WalletIcon className="h-4 w-4 text-white" />
                            </div>
                          </div>
                        </div>

                        {/* INTEREST */}

                        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">
                                Interest
                              </p>

                              <p className="mt-2 text-2xl font-bold tracking-tight text-gray-900">
                                ₹
                                {(
                                  insightsData.monthlyInterestPayments || 0
                                ).toLocaleString("en-IN")}
                              </p>

                              <p className="mt-1 text-[11px] text-gray-500">
                                Financing charges
                              </p>
                            </div>

                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50">
                              <PercentBadgeIcon className="h-4 w-4 text-orange-600" />
                            </div>
                          </div>
                        </div>

                        {/* TOTAL */}

                        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">
                                Finance Cost
                              </p>

                              <p className="mt-2 text-2xl font-bold tracking-tight text-gray-900">
                                ₹
                                {(
                                  (insightsData.monthlyLoanEmi || 0) +
                                  (insightsData.monthlyInterestPayments || 0) +
                                  (insightsData.caFees || 0) +
                                  (insightsData.insuranceCost || 0) +
                                  (insightsData.otherTaxes || 0)
                                ).toLocaleString("en-IN")}
                              </p>

                              <p className="mt-1 text-[11px] text-gray-500">
                                Total financial overhead
                              </p>
                            </div>

                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50">
                              <BuildingLibraryIcon className="h-4 w-4 text-violet-600" />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* ================= FORM ================= */}

                      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                        {/* HEADER */}

                        <div className="mb-5 flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50">
                            <BuildingLibraryIcon className="h-4 w-4 text-violet-600" />
                          </div>

                          <div>
                            <h3 className="text-[18px] font-semibold text-gray-900">
                              Tax & Financial Configuration
                            </h3>

                            <p className="mt-1 text-[12px] text-gray-500">
                              Configure tax liabilities & financing expenses
                            </p>
                          </div>
                        </div>

                        {/* GRID */}

                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                          {[
                            {
                              label: "GST Percentage",
                              key: "gstPercentage",
                              helper: "Applicable restaurant GST %",
                              suffix: "%",
                            },

                            {
                              label: "Monthly Loan EMI",
                              key: "monthlyLoanEmi",
                              helper: "Monthly repayment amount",
                              prefix: "₹",
                            },

                            {
                              label: "Interest Payments",
                              key: "monthlyInterestPayments",
                              helper: "Monthly financing interest",
                              prefix: "₹",
                            },

                            {
                              label: "CA / Accounting Fees",
                              key: "caFees",
                              helper: "Professional accounting expense",
                              prefix: "₹",
                            },

                            {
                              label: "Insurance Cost",
                              key: "insuranceCost",
                              helper: "Monthly business insurance",
                              prefix: "₹",
                            },

                            {
                              label: "Other Taxes",
                              key: "otherTaxes",
                              helper: "Additional tax obligations",
                              prefix: "₹",
                            },
                          ].map((field) => (
                            <div
                              key={field.key}
                              className="rounded-xl border border-gray-200 bg-white p-3"
                            >
                              <label className="mb-2 block text-sm font-medium text-gray-700">
                                {field.label}
                              </label>

                              <div className="relative">
                                {field.prefix && (
                                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                                    {field.prefix}
                                  </span>
                                )}

                                {field.suffix && (
                                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                                    {field.suffix}
                                  </span>
                                )}

                                <input
                                  type="number"
                                  value={insightsData[field.key] || ""}
                                  onChange={(e) =>
                                    setInsightsData({
                                      ...insightsData,
                                      [field.key]: Number(e.target.value),
                                    })
                                  }
                                  placeholder="0"
                                  className={`w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 text-sm outline-none transition-all duration-200 focus:border-red-300 focus:bg-white ${
                                    field.prefix
                                      ? "pl-8 pr-3"
                                      : field.suffix
                                        ? "pl-3 pr-8"
                                        : "px-3"
                                  }`}
                                />
                              </div>

                              <p className="mt-2 text-[11px] text-gray-400">
                                {field.helper}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* ================= INSIGHTS ================= */}

                      <div className="grid grid-cols-1 gap-3 xl:grid-cols-3">
                        {/* TAX */}

                        <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
                          <div className="flex items-start gap-3">
                            <DocumentTextIcon className="mt-0.5 h-4 w-4 text-blue-600" />

                            <div>
                              <p className="text-sm font-semibold text-blue-900">
                                GST Planning
                              </p>

                              <p className="mt-1 text-[12px] leading-6 text-blue-800">
                                Restaurants generally operate under 5% GST
                                without input tax credit for simplified
                                taxation.
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* LOAN */}

                        <div className="rounded-xl border border-orange-100 bg-orange-50 p-4">
                          <div className="flex items-start gap-3">
                            <WalletIcon className="mt-0.5 h-4 w-4 text-orange-600" />

                            <div>
                              <p className="text-sm font-semibold text-orange-900">
                                Financing Health
                              </p>

                              <p className="mt-1 text-[12px] leading-6 text-orange-800">
                                Loan repayment should ideally remain below 15%
                                of monthly revenue for healthy cash flow.
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* INSURANCE */}

                        <div className="rounded-xl border border-violet-100 bg-violet-50 p-4">
                          <div className="flex items-start gap-3">
                            <ShieldCheckIcon className="mt-0.5 h-4 w-4 text-violet-600" />

                            <div>
                              <p className="text-sm font-semibold text-violet-900">
                                Risk Protection
                              </p>

                              <p className="mt-1 text-[12px] leading-6 text-violet-800">
                                Insurance coverage protects restaurant
                                operations against unexpected liabilities &
                                operational risks.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  {/* ================= BUSINESS ASSUMPTIONS ================= */}

                  {insightsSection === "Business Assumptions" && (
                    <div className="space-y-4">
                      {/* ================= KPI ================= */}

                      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
                        {/* GROWTH */}

                        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">
                                Revenue Growth
                              </p>

                              <p className="mt-2 text-2xl font-bold tracking-tight text-emerald-600">
                                +{insightsData.expectedMonthlyGrowth || 0}%
                              </p>

                              <p className="mt-1 text-[11px] text-gray-500">
                                Monthly projection
                              </p>
                            </div>

                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50">
                              <ArrowTrendingUpIcon className="h-4 w-4 text-emerald-600" />
                            </div>
                          </div>
                        </div>

                        {/* DELIVERY */}

                        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">
                                Delivery
                              </p>

                              <p className="mt-2 text-2xl font-bold tracking-tight text-blue-600">
                                +{insightsData.expectedDeliveryGrowth || 0}%
                              </p>

                              <p className="mt-1 text-[11px] text-gray-500">
                                Online expansion
                              </p>
                            </div>

                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
                              <TruckIcon className="h-4 w-4 text-blue-600" />
                            </div>
                          </div>
                        </div>

                        {/* WEEKEND */}

                        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">
                                Weekend Boost
                              </p>

                              <p className="mt-2 text-2xl font-bold tracking-tight text-violet-600">
                                +{insightsData.weekendSalesIncrease || 0}%
                              </p>

                              <p className="mt-1 text-[11px] text-gray-500">
                                Weekend uplift
                              </p>
                            </div>

                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50">
                              <RocketLaunchIcon className="h-4 w-4 text-violet-600" />
                            </div>
                          </div>
                        </div>

                        {/* SEASONAL */}

                        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">
                                Seasonal
                              </p>

                              <p className="mt-2 text-2xl font-bold tracking-tight text-pink-500">
                                {insightsData.seasonalImpact || 0}%
                              </p>

                              <p className="mt-1 text-[11px] text-gray-500">
                                Seasonal fluctuation
                              </p>
                            </div>

                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-pink-50">
                              <CalendarDateRangeIcon className="h-4 w-4 text-pink-500" />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* ================= FORECAST ENGINE ================= */}

                      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                        {/* HEADER */}

                        <div className="mb-5 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#b10000]">
                              <SparklesIcon className="h-4 w-4 text-white" />
                            </div>

                            <div>
                              <h3 className="text-[18px] font-semibold text-gray-900">
                                Business Forecast Engine
                              </h3>

                              <p className="mt-1 text-[12px] text-gray-500">
                                Future growth & operational assumptions
                              </p>
                            </div>
                          </div>

                          <div className="rounded-full bg-[#b10000]/10 px-3 py-1 text-[11px] font-semibold text-[#b10000]">
                            AI Forecast Active
                          </div>
                        </div>

                        {/* INPUT GRID */}

                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                          {[
                            {
                              label: "Expected Monthly Growth %",
                              key: "expectedMonthlyGrowth",
                              placeholder: "10",
                              icon: ArrowTrendingUpIcon,
                              color: "emerald",
                            },

                            {
                              label: "Expected Delivery Growth %",
                              key: "expectedDeliveryGrowth",
                              placeholder: "15",
                              icon: TruckIcon,
                              color: "blue",
                            },

                            {
                              label: "Seasonal Impact %",
                              key: "seasonalImpact",
                              placeholder: "20",
                              icon: CalendarDateRangeIcon,
                              color: "pink",
                            },

                            {
                              label: "Weekend Sales Increase %",
                              key: "weekendSalesIncrease",
                              placeholder: "25",
                              icon: RocketLaunchIcon,
                              color: "violet",
                            },
                          ].map((field) => {
                            const Icon = field.icon;

                            return (
                              <div
                                key={field.key}
                                className="rounded-xl border border-gray-200 bg-white p-3"
                              >
                                {/* TOP */}

                                <div className="mb-3 flex items-center gap-3">
                                  <div
                                    className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                                      field.color === "emerald"
                                        ? "bg-emerald-50"
                                        : field.color === "blue"
                                          ? "bg-blue-50"
                                          : field.color === "pink"
                                            ? "bg-pink-50"
                                            : "bg-violet-50"
                                    }`}
                                  >
                                    <Icon
                                      className={`h-4 w-4 ${
                                        field.color === "emerald"
                                          ? "text-emerald-600"
                                          : field.color === "blue"
                                            ? "text-blue-600"
                                            : field.color === "pink"
                                              ? "text-pink-500"
                                              : "text-violet-600"
                                      }`}
                                    />
                                  </div>

                                  <div>
                                    <label className="text-sm font-medium text-gray-800">
                                      {field.label}
                                    </label>

                                    <p className="mt-0.5 text-[11px] text-gray-400">
                                      Forecast configuration
                                    </p>
                                  </div>
                                </div>

                                {/* INPUT */}

                                <div className="relative">
                                  <input
                                    type="number"
                                    value={insightsData[field.key] || ""}
                                    onChange={(e) =>
                                      setInsightsData({
                                        ...insightsData,
                                        [field.key]: Number(e.target.value),
                                      })
                                    }
                                    placeholder={field.placeholder}
                                    className="
                    w-full
                    rounded-xl
                    border
                    border-gray-200
                    bg-gray-50
                    py-2.5
                    pl-3
                    pr-8
                    text-sm
                    outline-none
                    transition-all
                    duration-200
                    focus:border-red-300
                    focus:bg-white
                  "
                                  />

                                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                                    %
                                  </span>
                                </div>

                                {/* RANGE */}

                                <input
                                  type="range"
                                  min="0"
                                  max="100"
                                  value={insightsData[field.key] || ""}
                                  onChange={(e) =>
                                    setInsightsData({
                                      ...insightsData,
                                      [field.key]: Number(e.target.value),
                                    })
                                  }
                                  className="mt-3 w-full accent-red-500"
                                />
                              </div>
                            );
                          })}

                          {/* EXPANSION */}

                          <div className="rounded-xl border border-gray-200 bg-white p-3 md:col-span-2 xl:col-span-1">
                            <div className="mb-3 flex items-center gap-3">
                              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#b10000]">
                                <BuildingOffice2Icon className="h-4 w-4 text-white" />
                              </div>

                              <div>
                                <label className="text-sm font-medium text-gray-800">
                                  Planned Expansion
                                </label>

                                <p className="mt-0.5 text-[11px] text-gray-400">
                                  Future scaling strategy
                                </p>
                              </div>
                            </div>

                            <select
                              value={insightsData.plannedExpansion}
                              onChange={(e) =>
                                setInsightsData({
                                  ...insightsData,
                                  plannedExpansion: e.target.value,
                                })
                              }
                              className="
              w-full
              rounded-xl
              border
              border-gray-200
              bg-gray-50
              px-3
              py-2.5
              text-sm
              outline-none
              transition-all
              duration-200
              focus:border-red-300
              focus:bg-white
            "
                            >
                              <option value="">Select Expansion</option>

                              <option value="NONE">No Expansion</option>

                              <option value="NEW_BRANCH">New Branch</option>

                              <option value="CLOUD_KITCHEN">
                                Cloud Kitchen
                              </option>

                              <option value="MULTI_CITY">
                                Multi City Expansion
                              </option>
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* ================= AI INSIGHT ================= */}

                      <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4">
                        <div className="flex items-start gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500">
                            <SparklesIcon className="h-4 w-4 text-white" />
                          </div>

                          <div>
                            <h4 className="text-sm font-semibold text-emerald-900">
                              AI Forecast Analysis
                            </h4>

                            <p className="mt-1 text-[13px] leading-6 text-emerald-800">
                              Based on current assumptions, the restaurant shows
                              healthy delivery scalability, improving weekend
                              performance and stable operational growth
                              potential.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
  );
}
