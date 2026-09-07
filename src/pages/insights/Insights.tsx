import { useMemo, useState, useEffect } from "react";
import { ASSUMPTION_FIELD_GROUPS } from "./assumptionFields";
import { useFinanceAssumptions } from "./useFinanceAssumptions";
import {
  useGetInsightsSetupQuery,
  useGetTableOperationsQuery,
  useGetVendorInvoiceActivityQuery,
  useGetFinanceSummaryForPeriodQuery,
  useGetRestaurantIngredientsQuery,
  useSaveInsightsSetupMutation,
} from "@/store/api/insightsApi";
import { useGetVendorOutstandingQuery } from "@/store/api/vendorsApi";
import {
  useGetMenuManagementQuery,
  useGetRestockHistoryQuery,
} from "@/store/api/inventoryApi";
import {
  useGetDashboardOverviewQuery,
  useGetStaffQuery,
} from "@/store/api/dashboardApi";
import { useInsightsMetrics } from "./useInsightsMetrics";
import OverviewTab from "./tabs/OverviewTab";
import InsightsSetupTab from "./tabs/InsightsSetupTab";
import FinancialAssumptionsTab from "./tabs/FinancialAssumptionsTab";
import { useAppSelector } from "@/store";
import React from "react";
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
import MobileTableCards from "@/components/common/MobileTableCards";
import {
  ArrowDownTrayIcon,
  ArrowPathIcon,
  ArrowTrendingDownIcon,
  ArrowTrendingUpIcon,
  ArrowUpTrayIcon,
  BanknotesIcon,
  BeakerIcon,
  BoltIcon,
  BuildingLibraryIcon,
  BuildingOffice2Icon,
  BuildingStorefrontIcon,
  CakeIcon,
  CalendarDateRangeIcon,
  ChartBarIcon,
  ChartPieIcon,
  CheckBadgeIcon,
  CheckIcon,
  ChevronDownIcon,
  ClipboardDocumentListIcon,
  CreditCardIcon,
  CubeIcon,
  CubeTransparentIcon,
  CurrencyRupeeIcon,
  DocumentTextIcon,
  FireIcon,
  FolderIcon,
  MagnifyingGlassIcon,
  PercentBadgeIcon,
  PlusIcon,
  PresentationChartLineIcon,
  ReceiptPercentIcon,
  RocketLaunchIcon,
  ShieldCheckIcon,
  ShoppingCartIcon,
  SparklesIcon,
  TruckIcon,
  UsersIcon,
  ViewfinderCircleIcon,
  WalletIcon,
  WrenchIcon,
} from "@heroicons/react/24/outline";
import { notify } from "@/utils/notify";

const tabs = ["Overview", "Insights Setup", "Financial Assumptions"];



export default function Insights() {
  const { selectedBranch } = useAppSelector((s) => s.branch);
  const { user } = useAppSelector((s) => s.auth);
  const currentUser = user; // alias kept for existing code that uses currentUser

  const [activeTab, setActiveTab] = useState("Overview");
  const [staffData, setStaffData] = useState<any[]>([]);

  // Financial Assumptions: defaults, per-branch overrides and the save. The
  // page holds it only to hand it to that tab.
  const assumptions = useFinanceAssumptions(activeTab);

  const [_ingredients, setIngredients] = useState<any>({});
  const [insightsData, setInsightsData] = useState<any>({
    monthlyRent: 0,
    rentModel: "FIXED",
    rentSharePercentDineIn: 0,
    rentSharePercentTakeaway: 0,
    rentSharePercentDelivery: 0,
    loanEmi: 0,
    internet: 0,
    phoneBills: 0,
    accounting: 0,
    insurance: 0,
    licenses: 0,
    deliveryCharges: 0,
    packaging: 0,
    paymentGateway: 0,
    aggregatorCommission: 0,
    electricity: 0,
    gas: 0,
    maintenance: 0,
    fuel: 0,
    marketingSpend: 0,
    targetEbitda: 0,
    targetFoodCost: 0,
    targetGrossMargin: 0,
    targetPrimeCost: 0,
    monthlyRevenueGoal: 0,
    monthlyProfitGoal: 0,
    gstPercentage: 0,
    monthlyLoanEmi: 0,
    monthlyInterestPayments: 0,
    caFees: 0,
    insuranceCost: 0,
    otherTaxes: 0,
    expectedMonthlyGrowth: 0,
    expectedDeliveryGrowth: 0,
    expectedInflation: 0,
    seasonalImpact: 0,
    weekendSalesIncrease: 0,
    plannedExpansion: "",
    revenue: 0,
    manualFoodCost: 0,
    initialInvestment: 0,
  });
  // Every derived figure the tabs display. The page computes them once here and
  // reads none of them itself -- Overview takes 46, Insights Setup takes 8.
  /**
   * Eight requests that were eight functions inside one effect, each with its
   * own try/catch and its own piece of state.
   *
   * Three are not defined in insightsApi at all. The month-to-date overview and
   * the menu-management payload already had slices, so this page now shares
   * Dashboard's cache for the first and Menu Management's for the second rather
   * than fetching what the app already holds.
   */
  const scope = {
    restaurantId: user?.restaurantId as number,
    branchId: selectedBranch?.id as number,
  };
  const skip = { skip: !user?.restaurantId || !selectedBranch?.id };

  // Calendar month to date, not a rolling 30 days — the Break-Even Progress
  // and Delivery Profitability cards are both month-to-date figures.
  const mtd = (() => {
    const now = new Date();
    return {
      from: new Date(now.getFullYear(), now.getMonth(), 1)
        .toISOString()
        .slice(0, 10),
      to: now.toISOString().slice(0, 10),
    };
  })();

  const setupQ = useGetInsightsSetupQuery(scope, skip);
  const [saveInsightsSetup] = useSaveInsightsSetupMutation();
  const restockQ = useGetRestockHistoryQuery(
    { restaurantId: scope.restaurantId },
    { skip: !user?.restaurantId },
  );
  const stockQ = useGetMenuManagementQuery(scope, skip);
  const mtdQ = useGetDashboardOverviewQuery(
    { ...scope, preset: "month", ...mtd },
    skip,
  );
  const financeQ = useGetFinanceSummaryForPeriodQuery(
    { ...scope, period: "currentMonth" },
    skip,
  );
  const tableOpsQ = useGetTableOperationsQuery({ ...scope, ...mtd }, skip);
  const payableQ = useGetVendorOutstandingQuery(scope, skip);
  const invoiceActivityQ = useGetVendorInvoiceActivityQuery(scope, skip);

  const mtdAnalytics = mtdQ.data ?? null;
  const financeSummary = financeQ.data ?? null;
  // True when the summary could not be loaded *or* the server declined it.
  // The page shows an estimated-figures banner for either, as before.
  const financeSummaryError = financeQ.isError || financeQ.data === null;
  const tableOps = tableOpsQ.data ?? null;
  // The endpoint returns a row per vendor; this page wants the one number.
  // Summed here rather than in the slice so Vendors can share the same cache
  // entry for the list it actually displays.
  const accountsPayable = (payableQ.data ?? []).reduce(
    (sum: number, v: any) => sum + Number(v.outstanding || 0),
    0,
  );
  const hasVendorInvoices = !!invoiceActivityQ.data?.hasAnyInvoices;

  /**
   * Stock at hand, valued. The payload carries every ingredient with its
   * quantity and unit price; this is the only figure the page wants from it.
   *
   * The Array.isArray guard is not defensive noise. This reduce used to sit
   * inside a fetch function's try/catch, so a payload whose `ingredients` was
   * not an array threw and was swallowed — the figure stayed 0 and the page
   * carried on. In a useMemo it runs during render, where the same payload
   * takes the whole page down with it. Moving work out of a catch changes what
   * a bad response costs, and this is where that has to be paid for.
   */
  const inventoryStockValue = useMemo(() => {
    const rows = stockQ.data?.ingredients;
    if (!Array.isArray(rows)) return 0;
    return rows.reduce(
      (sum: number, ing: any) =>
        sum + Number(ing.quantity || 0) * Number(ing.pricePerUnit || 0),
      0,
    );
  }, [stockQ.data]);

  // This month's restock sheet, reshaped. Kept verbatim from the effect it
  // came out of — eighteen field mappings, several with cascading fallbacks
  // through Week5 down to Week1, which are not worth retyping.
  const restockHistory = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    const currentMonthData = (restockQ.data || []).find(
      (item: any) => item.month === currentMonth && item.year === currentYear,
    );
    if (!Array.isArray(currentMonthData?.data)) return [];
    return currentMonthData.data.map((item: any) => ({
      Category: item["Category"],
      Ingredient: item["Ingredient"],
      Unit: item["Unit"],
      OpeningStockQty: Number(item["Opening Stock Qty"] || 0),
      OpeningStockPrice: Number(item["Opening Stock Price"] || 0),
      OpeningStockValue: Number(item["Opening Stock Value"] || 0),
      Week1PurchaseQty: Number(item["Week1 Purchase Qty"] || 0),
      Week2PurchaseQty: Number(item["Week2 Purchase Qty"] || 0),
      Week3PurchaseQty: Number(item["Week3 Purchase Qty"] || 0),
      Week4PurchaseQty: Number(item["Week4 Purchase Qty"] || 0),
      Week5PurchaseQty: Number(item["Week5 Purchase Qty"] || 0),
      Week1Price: Number(item["Week1 Price"] || 0),
      Week5Price: Number(item["Week5 Price"] || 0),
      TotalPurchaseAmount: Number(item["Total Purchase Amount"] || 0),
      MonthClosingValue: Number(
        item["Month Closing Value"] ||
          item["Week5 Closing Value"] ||
          item["Week4 Closing Value"] ||
          item["Week3 Closing Value"] ||
          item["Week2 Closing Value"] ||
          item["Week1 Closing Value"] ||
          0,
      ),
      MonthlyRMExpense: Number(
        item["Monthly RM Expense"] ||
          Number(item["Opening Stock Value"] || 0) +
            Number(item["Total Purchase Amount"] || 0) -
            Number(
              item["Week5 Closing Value"] ||
                item["Week4 Closing Value"] ||
                item["Week3 Closing Value"] ||
                item["Week2 Closing Value"] ||
                item["Week1 Closing Value"] ||
                0,
            ),
      ),
      TotalPurchasedQty:
        Number(item["Week1 Purchase Qty"] || 0) +
        Number(item["Week2 Purchase Qty"] || 0) +
        Number(item["Week3 Purchase Qty"] || 0) +
        Number(item["Week4 Purchase Qty"] || 0) +
        Number(item["Week5 Purchase Qty"] || 0),
    }));
  }, [restockQ.data]);

  // The saved setup figures seed an editable form, so they are merged into
  // the draft rather than read straight off the cache. Nulls become 0 first:
  // downstream arithmetic sums these directly and would otherwise produce NaN.
  useEffect(() => {
    if (!setupQ.data) return;
    const normalized = Object.fromEntries(
      Object.entries(setupQ.data).map(([k, v]) => [
        k,
        v === null || v === undefined ? 0 : v,
      ]),
    );
    setInsightsData((prev: any) => ({ ...prev, ...normalized }));
  }, [setupQ.data]);

  const metrics = useInsightsMetrics({
    financeSummary,
    insightsData,
    mtdAnalytics,
    restockHistory,
    inventoryStockValue,
    accountsPayable,
    selectedBranch,
    staffData,
  });

  // Was refetched on every branch change even though the endpoint is
  // restaurant-scoped and returns the same rows for all of them.
  const ingredientsQ = useGetRestaurantIngredientsQuery(
    user?.restaurantId as number,
    { skip: !user?.restaurantId },
  );
  useEffect(() => {
    if (ingredientsQ.data) setIngredients(ingredientsQ.data);
  }, [ingredientsQ.data]);

  const handleSaveInsights = async () => {
    try {
      // token and user from Redux (outer scope)
      if (!selectedBranch?.id) {
        notify("Please select branch", "warning");
        return;
      }

      // A rejection throws here, which is what keeps the earlier fix in
      // place: the response used to be discarded outright, so neither a
      // refused save nor a thrown one reached the person who pressed Save.
      await saveInsightsSetup({
        ...insightsData,
        restaurantId: user.restaurantId,
        branchId: selectedBranch.id,
      }).unwrap();
    } catch {
      notify("Failed to save these insights");
    }
  };


  // The `skip` is the guard the old effect grew by hand. Without a branch it
  // used to build a URL ending in "/undefined" and ask for it.
  const staffQ = useGetStaffQuery(
    {
      restaurantId: currentUser?.restaurantId as number,
      branchId: selectedBranch?.id as number,
    },
    { skip: !currentUser?.restaurantId || !selectedBranch?.id },
  );
  useEffect(() => {
    if (staffQ.data) setStaffData(staffQ.data);
  }, [staffQ.data]);

  return (
    <main className="flex flex-col overflow-hidden bg-[#f5f6fa]">
      <div className="mx-auto flex h-full w-full flex-col gap-4 overflow-hidden">
        {/* HEADER */}
        <div className="relative overflow-hidden rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
          <div className="absolute -right-10 -top-10 h-24 w-24 rounded-full bg-red-100/50 blur-3xl" />

          <div className="relative z-10 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            {/* LEFT */}

            <div className="flex items-start gap-3">
              {/* ICON */}

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#b10000] shadow-sm">
                <ChartBarIcon className="h-4 w-4 text-white" />
              </div>

              {/* CONTENT */}

              <div>
                {/* TITLE */}

                <h1 className="text-[22px] font-black leading-none tracking-tight text-gray-900">
                  Insights
                </h1>

                {/* SUBTITLE */}

                <p className="mt-1 text-[12px] text-gray-500">
                  Restaurant operational analytics & expense intelligence
                </p>
              </div>
            </div>

            {/* RIGHT */}

            <div className="flex items-center gap-2">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`rounded-xl px-3.5 py-2 text-[12px] font-semibold transition-all duration-200 ${
                    activeTab === tab
                      ? "bg-[#b10000] text-white shadow-sm"
                      : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
        </div>
        {/* CONTENT */}
        <div className="min-h-0 flex-1 overflow-y-auto rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          {/* OVERVIEW */}
          {activeTab === "Overview" && (
            <OverviewTab metrics={metrics} financeSummaryError={financeSummaryError} hasVendorInvoices={hasVendorInvoices} tableOps={tableOps} />
          )}

          {/* Insights Setup */}
          {activeTab === "Insights Setup" && (
            <InsightsSetupTab metrics={metrics} insightsData={insightsData} setInsightsData={setInsightsData} inventoryStockValue={inventoryStockValue} staffData={staffData} setActiveTab={setActiveTab} handleSaveInsights={handleSaveInsights} />
          )}
          {activeTab === "Financial Assumptions" && (
            <FinancialAssumptionsTab assumptions={assumptions} selectedBranch={selectedBranch} />
          )}
        </div>
      </div>
    </main>
  );
}
