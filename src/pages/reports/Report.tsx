import { useEffect, useState } from "react";
import { useAppSelector } from "@/store";
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
  const API_URL = import.meta.env.VITE_API_URL;
  const { from, to, preset } = useAppSelector((s) => s.dateRange);
  const { selectedBranch } = useAppSelector((s) => s.branch);
  const { user, token } = useAppSelector((s) => s.auth);

  const [activeTab, setActiveTab] = useState("P&L Statement");
  const [loading, setLoading] = useState(false);
  const [_reportData, setReportData] = useState<any>(null);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [bills, setBills] = useState<any[]>([]);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [runningOrders, setRunningOrders] = useState<any[]>([]);
  const [inventoryAdjustments, setInventoryAdjustments] = useState<any[]>([]);
  const [heatmapData, setHeatmapData] = useState<any>(null);
  const [forecastData, setForecastData] = useState<any>(null);
  const [financeSummary, setFinanceSummary] = useState<any>(null);

  useEffect(() => {
    const fetchReports = async () => {
      if (!selectedBranch?.id || !user?.restaurantId) return;
      try {
        setLoading(true);
        const headers = { Authorization: `Bearer ${token}` };
        const bParam = `branchId=${selectedBranch.id}`;
        const [
          analyticsRes,
          expensesRes,
          billsRes,
          menuRes,
          ordersRes,
          adjustRes,
          heatmapRes,
          forecastRes,
          financeSummaryRes,
        ] = await Promise.all([
          fetch(
            `${API_URL}/api/analytics/${user.restaurantId}/restaurantDashboardOverview?${bParam}&range=${preset}&from=${from}&to=${to}`,
            { headers },
          ),
          fetch(
            `${API_URL}/api/reports/expenses?${bParam}&from=${from}&to=${to}`,
            { headers },
          ),
          fetch(
            `${API_URL}/api/bills/${user.restaurantId}/restaurantwise?${bParam}&from=${from}&to=${to}`,
            { headers },
          ),
          fetch(
            `${API_URL}/api/inventory/${user.restaurantId}/menu-management?${bParam}`,
            { headers },
          ),
          fetch(
            `${API_URL}/api/orders/running?${bParam}&from=${from}&to=${to}`,
            { headers },
          ),
          fetch(
            `${API_URL}/api/inventory/adjustments?${bParam}&from=${from}&to=${to}`,
            { headers },
          ),
          fetch(
            `${API_URL}/api/analytics/${user.restaurantId}/hourly-heatmap?${bParam}&from=${from}&to=${to}`,
            { headers },
          ),
          fetch(
            `${API_URL}/api/analytics/${user.restaurantId}/revenue-forecast?${bParam}`,
            { headers },
          ),
          // Canonical EBITDA/Net Profit/Food Cost/Labour Cost — same
          // finance.formulas.ts engine used by Dashboard/Insights/Branch
          // Comparison/PDF/Excel exports, so the P&L Statement tab below
          // agrees with every other screen instead of re-deriving Net
          // Profit from just revenue/GST/generic ShopExpense rows (which
          // omitted food cost and labour cost entirely).
          fetch(
            `${API_URL}/api/finance/${user.restaurantId}/${selectedBranch.id}/summary?period=custom&from=${from}&to=${to}`,
            { headers },
          ),
        ]);
        const [
          analyticsData,
          expensesData,
          billsData,
          menuData,
          ordersData,
          adjustData,
          heatmapJson,
          forecastJson,
          financeSummaryJson,
        ] = await Promise.all([
          analyticsRes.json(),
          expensesRes.json(),
          billsRes.json(),
          menuRes.json(),
          ordersRes.json(),
          adjustRes.json(),
          heatmapRes.json(),
          forecastRes.json(),
          financeSummaryRes.json(),
        ]);
        if (analyticsData.success) setReportData(analyticsData.data);
        if (expensesData.success) setExpenses(expensesData.data || []);
        if (billsData.success) setBills(billsData.bills || []);
        if (menuData.success) setMenuItems(menuData.data?.menuItems || []);
        if (ordersData.success) setRunningOrders(ordersData.data || []);
        if (adjustData.success) setInventoryAdjustments(adjustData.data || []);
        if (heatmapJson.success) setHeatmapData(heatmapJson.data);
        if (forecastJson.success) setForecastData(forecastJson.data);
        if (financeSummaryJson.success)
          setFinanceSummary(financeSummaryJson.data);
      } catch {
        /* silent */
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, [selectedBranch?.id, from, to]);



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
      const res = await fetch(
        `${API_URL}/api/reports/gst-filing/${user.restaurantId}/${selectedBranch.id}?from=${from}&to=${to}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const json = await res.json();
      if (!json.success) {
        alert(json.message || "Failed to generate GST report");
        return;
      }
      const { restaurant, branch, gstPercentage, monthly, grandTotal } =
        json.data;

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
            heatmapData={heatmapData}
            setHeatmapData={setHeatmapData}
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
