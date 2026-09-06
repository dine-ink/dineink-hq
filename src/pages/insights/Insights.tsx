import { useState, useEffect } from "react";
import { ASSUMPTION_FIELD_GROUPS } from "./assumptionFields";
import { useFinanceAssumptions } from "./useFinanceAssumptions";
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

const tabs = ["Overview", "Insights Setup", "Financial Assumptions"];



export default function Insights() {
  const { selectedBranch } = useAppSelector((s) => s.branch);
  const { user, token } = useAppSelector((s) => s.auth);
  const currentUser = user; // alias kept for existing code that uses currentUser
  const API_URL = import.meta.env.VITE_API_URL;

  const [activeTab, setActiveTab] = useState("Overview");
  const [staffData, setStaffData] = useState<any[]>([]);

  // Financial Assumptions: defaults, per-branch overrides and the save. The
  // page holds it only to hand it to that tab.
  const assumptions = useFinanceAssumptions(activeTab);

  const [_ingredients, setIngredients] = useState<any>({});
  const [restockHistory, setRestockHistory] = useState<any[]>([]);
  const [inventoryStockValue, setInventoryStockValue] = useState(0);
  const [mtdAnalytics, setMtdAnalytics] = useState<any>(null);
  const [financeSummary, setFinanceSummary] = useState<any>(null);
  const [financeSummaryError, setFinanceSummaryError] = useState(false);
  const [tableOps, setTableOps] = useState<any>(null);
  const [accountsPayable, setAccountsPayable] = useState(0);
  const [hasVendorInvoices, setHasVendorInvoices] = useState(true);
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

  useEffect(() => {
    const fetchInsights = async () => {
      try {
        if (!selectedBranch?.id || !user?.restaurantId) return;

        const res = await fetch(
          `${API_URL}/api/analytics/insights/${user.restaurantId}/${selectedBranch.id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        const json = await res.json();

        if (json.success && json.data) {
          // Normalize null/undefined → 0 for all numeric fields so downstream
          // arithmetic (totalFixedExpenses + ...) never produces NaN
          const normalized = Object.fromEntries(
            Object.entries(json.data).map(([k, v]) => [
              k,
              v === null || v === undefined ? 0 : v,
            ]),
          );
          setInsightsData((prev: any) => ({ ...prev, ...normalized }));
        }
      } catch {
        // fetch error
      }
    };

    const fetchRestockHistory = async () => {
      try {
        if (!user?.restaurantId) return;
        const res = await fetch(
          `${API_URL}/api/inventory/${user.restaurantId}/get-restock-history`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );
        const response = await res.json();
        if (response.success) {
          const currentDate = new Date();
          const currentMonth = currentDate.getMonth() + 1;
          const currentYear = currentDate.getFullYear();
          const currentMonthData = response.data.find(
            (item: any) =>
              item.month === currentMonth && item.year === currentYear,
          );
          if (currentMonthData) {
            const formattedData = currentMonthData.data.map((item: any) => ({
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
            setRestockHistory(formattedData);
          } else {
            setRestockHistory([]);
          }
        }
      } catch {
        // fetch error
      }
    };
    const fetchInventoryStock = async () => {
      try {
        if (!user?.restaurantId || !selectedBranch?.id) return;
        const res = await fetch(
          `${API_URL}/api/inventory/${user.restaurantId}/menu-management?branchId=${selectedBranch.id}`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        const json = await res.json();
        if (json.success) {
          const total = (json.data?.ingredients || []).reduce(
            (sum: number, ing: any) =>
              sum + Number(ing.quantity || 0) * Number(ing.pricePerUnit || 0),
            0,
          );
          setInventoryStockValue(total);
        }
      } catch {
        // silently ignored
      }
    };

    // Month-to-date revenue (calendar month, not a rolling 30-day window) —
    // powers the Break-Even Progress and Delivery Profitability cards below.
    const fetchMtdAnalytics = async () => {
      try {
        if (!user?.restaurantId || !selectedBranch?.id) return;
        const now = new Date();
        const from = new Date(now.getFullYear(), now.getMonth(), 1)
          .toISOString()
          .slice(0, 10);
        const to = now.toISOString().slice(0, 10);
        const res = await fetch(
          `${API_URL}/api/analytics/${user.restaurantId}/restaurantDashboardOverview?branchId=${selectedBranch.id}&range=month&from=${from}&to=${to}`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        const json = await res.json();
        if (json.success) setMtdAnalytics(json.data);
      } catch {
        // silently ignored
      }
    };

    // The canonical EBITDA/Prime Cost/Net Profit/Break-even figures — same
    // finance.formulas.ts engine used by Dashboard, Branch Comparison, and
    // the PDF/Excel exports, so this page's numbers always agree with theirs.
    const fetchFinanceSummary = async () => {
      try {
        if (!user?.restaurantId || !selectedBranch?.id) return;
        const res = await fetch(
          `${API_URL}/api/finance/${user.restaurantId}/${selectedBranch.id}/summary?period=currentMonth`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        const json = await res.json();
        if (json.success) {
          setFinanceSummary(json.data);
          setFinanceSummaryError(false);
        } else {
          setFinanceSummaryError(true);
        }
      } catch {
        setFinanceSummaryError(true);
      }
    };

    const fetchTableOps = async () => {
      try {
        if (!user?.restaurantId || !selectedBranch?.id) return;
        const now = new Date();
        const from = new Date(now.getFullYear(), now.getMonth(), 1)
          .toISOString()
          .slice(0, 10);
        const to = now.toISOString().slice(0, 10);
        const res = await fetch(
          `${API_URL}/api/analytics/${user.restaurantId}/${selectedBranch.id}/table-operations?from=${from}&to=${to}`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        const json = await res.json();
        if (json.success) setTableOps(json.data);
      } catch {
        // silently ignored
      }
    };

    // Total outstanding vendor balances (Accounts Payable), for Days Payable
    // Outstanding in the Cash Conversion Cycle below.
    const fetchAccountsPayable = async () => {
      try {
        if (!user?.restaurantId || !selectedBranch?.id) return;
        const res = await fetch(
          `${API_URL}/api/vendors/outstanding/${user.restaurantId}/${selectedBranch.id}`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        const json = await res.json();
        const vendors = json?.data || json || [];
        const total = Array.isArray(vendors)
          ? vendors.reduce(
              (s: number, v: any) => s + Number(v.outstanding || 0),
              0,
            )
          : 0;
        setAccountsPayable(total);
      } catch {
        // silently ignored
      }
    };

    // Distinguishes "no vendor invoices logged" from "invoices exist and are
    // all fully paid" — both otherwise look identical (accountsPayable = 0).
    const fetchVendorInvoiceActivity = async () => {
      try {
        if (!user?.restaurantId || !selectedBranch?.id) return;
        const res = await fetch(
          `${API_URL}/api/vendors/invoice-activity/${user.restaurantId}/${selectedBranch.id}`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        const json = await res.json();
        if (json.success) setHasVendorInvoices(!!json.data.hasAnyInvoices);
      } catch {
        // silently ignored
      }
    };

    fetchInsights();
    fetchRestockHistory();
    fetchInventoryStock();
    fetchMtdAnalytics();
    fetchFinanceSummary();
    fetchTableOps();
    fetchAccountsPayable();
    fetchVendorInvoiceActivity();
  }, [selectedBranch]);
  const fetchIngredients = async () => {
    try {
      // token and user from Redux (outer scope)
      const res = await fetch(
        `${API_URL}/api/ingredients/${user.restaurantId}/getRestaurantIngredients`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      const data = await res.json();
      if (data.success && data.data) {
        setIngredients(data.data);
      }
    } catch {
      // error silently ignored
    }
  };

  useEffect(() => {
    fetchIngredients();
  }, [selectedBranch]);

  const handleSaveInsights = async () => {
    try {
      // token and user from Redux (outer scope)
      if (!selectedBranch?.id) {
        alert("Please select branch");
        return;
      }

      const res = await fetch(`${API_URL}/api/analytics/insights`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },

        body: JSON.stringify({
          ...insightsData,
          restaurantId: user.restaurantId,
          branchId: selectedBranch.id,
        }),
      });

      // The parsed body used to be discarded outright, so neither a rejected
      // save nor a thrown one reached the person who pressed Save.
      const json = await res.json().catch(() => null);
      if (!res.ok || json?.success === false) {
        alert(json?.message || "Failed to save these insights");
      }
    } catch {
      alert("Failed to save these insights");
    }
  };


  useEffect(() => {
    const fetchStaff = async () => {
      try {
        const res = await fetch(
          `${API_URL}/api/restaurant/staff/${currentUser.restaurantId}/${selectedBranch?.id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );
        const data = await res.json();
        if (data.success) {
          setStaffData(data.data);
        }
      } catch {
        // fetch error
      }
    };
    // selectedBranch was missing from this guard, so with no branch selected
    // the effect ran and dereferenced null building the URL. Requiring the id
    // here is what makes the optional chain above unreachable rather than a
    // request for ".../staff/12/undefined".
    if (currentUser?.restaurantId && selectedBranch?.id) {
      fetchStaff();
    }
  }, [selectedBranch]);

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
