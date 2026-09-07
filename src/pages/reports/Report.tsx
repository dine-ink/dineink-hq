import { useState } from "react";
import { useAppDispatch, useAppSelector } from "@/store";
import {
  useGetDashboardOverviewQuery,
  useGetFinanceSummaryQuery,
} from "@/store/api/dashboardApi";
import { useGetBillsQuery } from "@/store/api/billsApi";
import { useGetMenuManagementQuery } from "@/store/api/inventoryApi";
import {
  reportsApi,
  useGetReportExpensesQuery,
  useGetRunningOrdersQuery,
  useGetInventoryAdjustmentsQuery,
  useGetHourlyHeatmapQuery,
  useGetRevenueForecastQuery,
} from "@/store/api/reportsApi";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  ResponsiveContainer,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";
import { chartPalette } from "@/design";
import MobileTableCards from "@/components/common/MobileTableCards";
import ProfitLossTab from "./tabs/ProfitLossTab";
import TaxReportTab from "./tabs/TaxReportTab";
import SalesAnalyticsTab from "./tabs/SalesAnalyticsTab";
import ExpenseTrackerTab from "./tabs/ExpenseTrackerTab";
import DiscountAnalysisTab from "./tabs/DiscountAnalysisTab";
import { useReportFinancials } from "./useReportFinancials";
import HourlyHeatmapTab from "./tabs/HourlyHeatmapTab";
import DayAnalysisTab from "./tabs/DayAnalysisTab";
import StockLifecycleTab from "./tabs/StockLifecycleTab";
import RevenueForecastTab from "./tabs/RevenueForecastTab";
import WasteReportTab from "./tabs/WasteReportTab";
import TableAnalyticsTab from "./tabs/TableAnalyticsTab";
import MenuEngineeringTab from "./tabs/MenuEngineeringTab";

// The app's one shared qualitative chart palette — see BranchComparison.tsx
// for the full duplication history this replaces.
const COLORS = chartPalette;

// Grouped for the mobile picker; the desktop pill row is the flattened list.
// Twelve pills wrap to six rows on a 375px screen — ~268px of navigation before
// any report — so phones get a single grouped <select> instead.
const REPORT_TAB_GROUPS = [
  { label: "Financial", tabs: ["P&L Statement", "Tax Report", "Expense Tracker"] },
  {
    label: "Sales & Menu",
    tabs: [
      "Sales Analytics",
      "Discount Analysis",
      "Menu Engineering",
      "Table Analytics",
    ],
  },
  { label: "Operations", tabs: ["Waste Report", "Stock Lifecycle"] },
  {
    label: "Timing & Forecast",
    tabs: ["Hourly Heatmap", "Day Analysis", "Revenue Forecast"],
  },
];

const reportTabs = REPORT_TAB_GROUPS.flatMap((group) => group.tabs);

export default function Report() {
  const dispatch = useAppDispatch();
  const { from, to, preset } = useAppSelector((s) => s.dateRange);
  const { selectedBranch } = useAppSelector((s) => s.branch);
  const { user } = useAppSelector((s) => s.auth);

  const [activeTab, setActiveTab] = useState("P&L Statement");

  /**
   * Nine requests that used to be one `Promise.all` feeding nine pieces of
   * state. Two of them are not defined here at all: the dashboard overview and
   * the finance summary already live in dashboardApi, and the bills and
   * menu-management calls in billsApi and inventoryApi — so this page now
   * shares Dashboard's cache for the first two and Menu Management's for the
   * others instead of refetching what the app already has.
   *
   * `loading` is the OR of them rather than one flag around the batch. That is
   * a small improvement on its own: the old version showed a spinner until the
   * slowest of nine resolved, even for tabs that needed only the fastest.
   */
  const scope = {
    restaurantId: user?.restaurantId as number,
    branchId: selectedBranch?.id as number,
    from,
    to,
  };
  const ready = !!user?.restaurantId && !!selectedBranch?.id;
  const skip = { skip: !ready };

  const overview = useGetDashboardOverviewQuery({ ...scope, preset }, skip);
  const expensesQ = useGetReportExpensesQuery(scope, skip);
  const billsQ = useGetBillsQuery(scope, skip);
  const menuQ = useGetMenuManagementQuery(
    { restaurantId: scope.restaurantId, branchId: scope.branchId },
    skip,
  );
  const ordersQ = useGetRunningOrdersQuery(scope, skip);
  const adjustQ = useGetInventoryAdjustmentsQuery(scope, skip);
  const heatmapQ = useGetHourlyHeatmapQuery(scope, skip);
  const forecastQ = useGetRevenueForecastQuery(
    { restaurantId: scope.restaurantId, branchId: scope.branchId },
    skip,
  );
  const financeQ = useGetFinanceSummaryQuery({ ...scope, preset }, skip);

  const loading =
    overview.isFetching ||
    expensesQ.isFetching ||
    billsQ.isFetching ||
    menuQ.isFetching ||
    ordersQ.isFetching ||
    adjustQ.isFetching ||
    heatmapQ.isFetching ||
    forecastQ.isFetching ||
    financeQ.isFetching;

  const expenses = expensesQ.data ?? [];
  const bills = billsQ.data ?? [];
  const menuItems = menuQ.data?.menuItems ?? [];
  const runningOrders = ordersQ.data ?? [];
  const inventoryAdjustments = adjustQ.data ?? [];
  const heatmapData = heatmapQ.data ?? null;
  const forecastData = forecastQ.data ?? null;
  const financeSummary = financeQ.data ?? null;



  // Every derived figure now comes from one place — see useReportFinancials.
  // Extracted so the financial tabs could move out without either
  // duplicating the arithmetic or threading a dozen props through them.
  const {
    fin,
    totalRevenue, totalDiscount, totalCGST, totalSGST, totalGST, totalServiceCharge,
    localTotalExpenses, totalExpenses, netProfit, profitMargin,
    paidBills, unpaidBills, dineInRevenue, takeawayRevenue, deliveryRevenue,
    paymentBreakdown, dailyData, expenseByType, orderTypePieData,
  } = useReportFinancials(bills, expenses, financeSummary);

  const [downloadingGst, setDownloadingGst] = useState(false);
  const downloadGstFiling = async () => {
    if (!user?.restaurantId || !selectedBranch?.id) return;
    try {
      setDownloadingGst(true);
      // A button-triggered read, so `initiate` rather than a hook. Not
      // forceRefetch: the filing is derived from bills in a closed date range,
      // and asking twice in a minute gives the same answer.
      const { restaurant, branch, gstPercentage, monthly, grandTotal } =
        await dispatch(
          reportsApi.endpoints.getGstFiling.initiate(scope),
        ).unwrap();

      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet("GST Summary");
      ws.columns = [
        { width: 12 },
        { width: 10 },
        { width: 16 },
        { width: 14 },
        { width: 14 },
        { width: 14 },
        { width: 16 },
      ];
      ws.addRow([restaurant?.name || ""]);
      ws.getRow(ws.rowCount).font = { bold: true, size: 14 };
      ws.addRow([`GSTIN: ${restaurant?.gstNumber || "Not set"}`]);
      ws.addRow([
        `Branch: ${branch?.name || ""}${gstPercentage != null ? ` · GST Rate: ${gstPercentage}%` : ""}`,
      ]);
      ws.addRow([]);
      ws.addRow([
        "Month",
        "Invoices",
        "Taxable Value (₹)",
        "CGST (₹)",
        "SGST (₹)",
        "Total Tax (₹)",
        "Invoice Value (₹)",
      ]);
      ws.getRow(ws.rowCount).font = { bold: true };
      (monthly || []).forEach((m: any) => {
        ws.addRow([
          m.month,
          m.invoiceCount,
          m.taxableValue,
          m.cgst,
          m.sgst,
          m.totalTax,
          m.invoiceValue,
        ]);
      });
      ws.addRow([
        "TOTAL",
        grandTotal.invoiceCount,
        grandTotal.taxableValue,
        grandTotal.cgst,
        grandTotal.sgst,
        grandTotal.totalTax,
        grandTotal.invoiceValue,
      ]);
      ws.getRow(ws.rowCount).font = { bold: true };

      const buffer = await wb.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      saveAs(blob, `GST-Filing-Summary-${from}-to-${to}.xlsx`);
    } catch {
      alert("Failed to generate GST report");
    } finally {
      setDownloadingGst(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-red-500" />
          <p className="text-[12px] text-gray-500">Loading reports...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto flex flex-col gap-3">
        {/* HEADER */}
        <div className="relative overflow-hidden rounded-md border border-gray-200 bg-white px-4 py-3 shadow-sm">
          <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-red-100/40 blur-3xl" />
          <div className="relative z-10 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h1 className="text-lg font-black tracking-tight text-gray-900 sm:text-xl">
                Financial Reports
              </h1>
              {/* The strap line and date both repeat below on mobile — the
                  picker bar already shows the range. */}
              <p className="mt-0.5 hidden text-[13px] text-gray-500 sm:block">
                P&L, tax, expenses and sales analytics
              </p>
            </div>
            <p className="hidden text-[11px] text-gray-400 sm:block">
              {from} → {to}
            </p>
          </div>
        </div>

        {/* TABS — mobile: one sticky grouped picker. Desktop: the pill row. */}
        <div className="sticky top-0 z-30 -mx-3 flex items-center gap-2 border-b border-gray-200 bg-white/95 px-3 py-2 backdrop-blur lg:hidden">
          <label htmlFor="report-picker" className="sr-only">
            Choose a report
          </label>
          <select
            id="report-picker"
            value={activeTab}
            onChange={(e) => setActiveTab(e.target.value)}
            className="h-10 min-w-0 flex-1 rounded-xl border border-gray-200 bg-white px-3 font-semibold text-gray-900 outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100"
          >
            {REPORT_TAB_GROUPS.map((group) => (
              <optgroup key={group.label} label={group.label}>
                {group.tabs.map((tab) => (
                  <option key={tab} value={tab}>
                    {tab}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
          <span className="shrink-0 text-[10px] leading-tight text-gray-400">
            {from}
            <br />
            {to}
          </span>
        </div>

        <div className="hidden flex-wrap gap-2 lg:flex">
          {reportTabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`rounded-xl px-4 py-2 text-[12px] font-semibold transition-all ${
                activeTab === tab
                  ? "bg-[#b10000] text-white shadow-sm"
                  : "border border-gray-200 bg-white text-gray-600 hover:bg-[#b10000]/10 hover:text-[#b10000]"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* ===== P&L STATEMENT ===== */}
        {activeTab === "P&L Statement" && (
          <ProfitLossTab fin={fin} totalRevenue={totalRevenue} totalDiscount={totalDiscount} totalCGST={totalCGST} totalSGST={totalSGST} totalGST={totalGST} totalServiceCharge={totalServiceCharge} totalExpenses={totalExpenses} netProfit={netProfit} profitMargin={profitMargin} paidBills={paidBills} dailyData={dailyData} expenseByType={expenseByType} orderTypePieData={orderTypePieData} expenses={expenses} />
        )}

        {/* ===== TAX REPORT ===== */}
        {activeTab === "Tax Report" && (
          <TaxReportTab totalRevenue={totalRevenue} totalCGST={totalCGST} totalSGST={totalSGST} totalGST={totalGST} bills={bills} downloadGstFiling={downloadGstFiling} downloadingGst={downloadingGst} />
        )}

        {/* ===== EXPENSE TRACKER ===== */}
        {activeTab === "Expense Tracker" && (
          <ExpenseTrackerTab totalRevenue={totalRevenue} localTotalExpenses={localTotalExpenses} expenseByType={expenseByType} expenses={expenses} />
        )}

        {/* ===== SALES ANALYTICS ===== */}
        {activeTab === "Sales Analytics" && (
          <SalesAnalyticsTab totalRevenue={totalRevenue} paidBills={paidBills} unpaidBills={unpaidBills} dineInRevenue={dineInRevenue} takeawayRevenue={takeawayRevenue} deliveryRevenue={deliveryRevenue} paymentBreakdown={paymentBreakdown} bills={bills} />
        )}

        {/* ===== DISCOUNT ANALYSIS ===== */}
        {activeTab === "Discount Analysis" && (
          <DiscountAnalysisTab totalRevenue={totalRevenue} totalDiscount={totalDiscount} bills={bills} />
        )}

        {/* ===== MENU ENGINEERING ===== */}
        {activeTab === "Menu Engineering" && (
          <MenuEngineeringTab bills={bills} menuItems={menuItems} />
        )}

        {/* ===== TABLE ANALYTICS ===== */}
        {activeTab === "Table Analytics" && (
          <TableAnalyticsTab runningOrders={runningOrders} />
        )}

        {/* ===== WASTE REPORT ===== */}
        {activeTab === "Waste Report" && (
          <WasteReportTab inventoryAdjustments={inventoryAdjustments} />
        )}

        {/* ===== STOCK LIFECYCLE ===== */}
        {activeTab === "Stock Lifecycle" && <StockLifecycleTab />}

        {/* ===== HOURLY HEATMAP ===== */}
        {activeTab === "Hourly Heatmap" && (
          <HourlyHeatmapTab
            menuItems={menuItems}
            from={from}
            to={to}
          />
        )}

        {/* ===== DAY ANALYSIS ===== */}
        {activeTab === "Day Analysis" && (
          <DayAnalysisTab heatmapData={heatmapData} />
        )}

        {/* ===== REVENUE FORECAST ===== */}
        {activeTab === "Revenue Forecast" && (
          <RevenueForecastTab forecastData={forecastData} />
        )}
      </div>
    </main>
  );
}
