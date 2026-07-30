import { useEffect, useState } from "react";
import { useAppSelector } from "../../store";
import { formatQty } from "../../utils/units";
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
import dayjs from "dayjs";
import { chartPalette } from "../../design";

// The app's one shared qualitative chart palette — see BranchComparison.tsx
// for the full duplication history this replaces.
const COLORS = chartPalette;

const reportTabs = [
  "P&L Statement",
  "Tax Report",
  "Expense Tracker",
  "Sales Analytics",
  "Discount Analysis",
  "Menu Engineering",
  "Table Analytics",
  "Waste Report",
  "Stock Lifecycle",
  "Hourly Heatmap",
  "Day Analysis",
  "Revenue Forecast",
];

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
  const [lifecycleData, setLifecycleData] = useState<any[]>([]);
  const [lifecycleLoading, setLifecycleLoading] = useState(false);
  const [lifecycleMonth, setLifecycleMonth] = useState(
    new Date().getMonth() + 1,
  );
  const [lifecycleYear, setLifecycleYear] = useState(new Date().getFullYear());
  const [expandedIngredients, setExpandedIngredients] = useState<Set<number>>(
    new Set(),
  );
  const [compareDishAId, setCompareDishAId] = useState("");
  const [compareDishBId, setCompareDishBId] = useState("");
  const [heatmapItemId, setHeatmapItemId] = useState("");
  const [heatmapCategoryId, setHeatmapCategoryId] = useState("");
  const [wastageSortBy, setWastageSortBy] = useState<
    "weight" | "price" | "product"
  >("weight");
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

  useEffect(() => {
    if (
      activeTab !== "Stock Lifecycle" ||
      !selectedBranch?.id ||
      !user?.restaurantId
    )
      return;
    const fetchLifecycle = async () => {
      setLifecycleLoading(true);
      try {
        const res = await fetch(
          `${API_URL}/api/inventory/lifecycle?branchId=${selectedBranch.id}&month=${lifecycleMonth}&year=${lifecycleYear}`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        const json = await res.json();
        if (json.success) setLifecycleData(json.data || []);
      } catch {
        /* silent */
      }
      setLifecycleLoading(false);
    };
    fetchLifecycle();
  }, [activeTab, lifecycleMonth, lifecycleYear, selectedBranch?.id]);

  useEffect(() => {
    if (
      activeTab !== "Hourly Heatmap" ||
      !selectedBranch?.id ||
      !user?.restaurantId
    )
      return;
    const fetchHeatmap = async () => {
      try {
        const bParam = `branchId=${selectedBranch.id}`;
        const filterParam = heatmapItemId
          ? `&itemId=${heatmapItemId}`
          : heatmapCategoryId
            ? `&categoryId=${heatmapCategoryId}`
            : "";
        const res = await fetch(
          `${API_URL}/api/analytics/${user.restaurantId}/hourly-heatmap?${bParam}&from=${from}&to=${to}${filterParam}`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        const json = await res.json();
        if (json.success) setHeatmapData(json.data);
      } catch {
        /* silent */
      }
    };
    fetchHeatmap();
  }, [
    activeTab,
    heatmapItemId,
    heatmapCategoryId,
    selectedBranch?.id,
    from,
    to,
  ]);

  // ===== COMPUTED METRICS =====
  const totalRevenue = bills.reduce((s, b) => s + Number(b.total || 0), 0);
  const totalDiscount = bills.reduce((s, b) => s + Number(b.discount || 0), 0);
  const totalCGST = bills.reduce((s, b) => s + Number(b.cgst || 0), 0);
  const totalSGST = bills.reduce((s, b) => s + Number(b.sgst || 0), 0);
  const totalGST = totalCGST + totalSGST;
  const totalServiceCharge = bills.reduce(
    (s, b) => s + Number(b.serviceCharge || 0),
    0,
  );
  // Canonical figures from the shared finance engine (finance.formulas.ts) —
  // same numbers Dashboard/Insights/Branch Comparison/PDF/Excel already show.
  // Falls back to the old local estimate (raw ShopExpense sum, no food/labour
  // cost) only until the fetch resolves, same pattern used in Insights.tsx.
  const fin = financeSummary?.current;
  const localTotalExpenses = expenses.reduce(
    (s, e) => s + Number(e.amount || 0),
    0,
  );
  const totalExpenses = fin
    ? fin.foodCost +
      fin.labourCost +
      fin.fixedExpenses +
      fin.variableExpenses +
      fin.financeCost
    : localTotalExpenses;
  const netProfit = fin
    ? fin.netProfit
    : totalRevenue - totalGST - localTotalExpenses;

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
  const profitMargin =
    totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : "0";
  const paidBills = bills.filter((b) => b.status === "PAID");
  const unpaidBills = bills.filter(
    (b) => b.status === "UNPAID" || b.status === "PARTIAL",
  );
  const dineInRevenue = bills
    .filter((b) => b.orderType === "DINE_IN")
    .reduce((s, b) => s + Number(b.total || 0), 0);
  const takeawayRevenue = bills
    .filter((b) => b.orderType === "TAKEAWAY")
    .reduce((s, b) => s + Number(b.total || 0), 0);
  const deliveryRevenue = bills
    .filter((b) => b.orderType === "DELIVERY")
    .reduce((s, b) => s + Number(b.total || 0), 0);

  // Payment method breakdown
  const paymentBreakdown = bills.reduce((acc: any, b) => {
    const method = b.paymentMethod || "Unknown";
    if (!acc[method]) acc[method] = { count: 0, amount: 0 };
    acc[method].count++;
    acc[method].amount += Number(b.total || 0);
    return acc;
  }, {});

  // Daily revenue for chart
  const dailyRevenue = bills.reduce((acc: any, b) => {
    const date = dayjs(b.createdAt).format("DD/MM");
    if (!acc[date]) acc[date] = { date, revenue: 0, bills: 0, discount: 0 };
    acc[date].revenue += Number(b.total || 0);
    acc[date].bills++;
    acc[date].discount += Number(b.discount || 0);
    return acc;
  }, {});
  const dailyData = Object.values(dailyRevenue).sort(
    (a: any, b: any) =>
      dayjs(a.date, "DD/MM").valueOf() - dayjs(b.date, "DD/MM").valueOf(),
  );

  // Expense by type
  const expenseByType = expenses.reduce((acc: any, e) => {
    const type = e.expenseType || "Other";
    if (!acc[type]) acc[type] = 0;
    acc[type] += Number(e.amount || 0);
    return acc;
  }, {});

  const orderTypePieData = [
    { name: "Dine In", value: dineInRevenue },
    { name: "Takeaway", value: takeawayRevenue },
    { name: "Delivery", value: deliveryRevenue },
  ].filter((d) => d.value > 0);

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
              <h1 className="text-xl font-black tracking-tight text-gray-900">
                Financial Reports
              </h1>
              <p className="mt-0.5 text-[13px] text-gray-500">
                P&L, tax, expenses and sales analytics
              </p>
            </div>
            <p className="text-[11px] text-gray-400">
              {from} → {to}
            </p>
          </div>
        </div>

        {/* TABS */}
        <div className="flex flex-wrap gap-2">
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
          <div className="space-y-3">
            {/* TOP KPIs */}
            <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
              {[
                {
                  label: "Total Revenue",
                  value: `₹${totalRevenue.toLocaleString("en-IN")}`,
                  sub: `${paidBills.length} paid bills`,
                  color: "emerald",
                  badge: "+revenue",
                },
                {
                  label: "Total Expenses",
                  value: `₹${Math.round(totalExpenses).toLocaleString("en-IN")}`,
                  sub: fin
                    ? "food + labour + fixed + variable + finance cost"
                    : `${expenses.length} expense entries`,
                  color: "red",
                  badge: "outflow",
                },
                {
                  label: "GST Collected",
                  value: `₹${totalGST.toLocaleString("en-IN")}`,
                  sub: `CGST ₹${totalCGST.toLocaleString("en-IN")} + SGST ₹${totalSGST.toLocaleString("en-IN")}`,
                  color: "blue",
                  badge: "tax",
                },
                {
                  label: "Net Profit",
                  value: `₹${netProfit.toLocaleString("en-IN")}`,
                  sub: `${profitMargin}% margin`,
                  color: netProfit >= 0 ? "emerald" : "red",
                  badge: `${profitMargin}%`,
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className={`rounded-xl border p-4 ${item.color === "emerald" ? "border-emerald-100 bg-emerald-50/60" : item.color === "red" ? "border-red-100 bg-red-50/60" : "border-blue-100 bg-blue-50/60"}`}
                >
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-500">
                    {item.label}
                  </p>
                  <p
                    className={`mt-2 text-[22px] font-bold tracking-tight ${item.color === "emerald" ? "text-emerald-700" : item.color === "red" ? "text-red-700" : "text-blue-700"}`}
                  >
                    {item.value}
                  </p>
                  <p className="mt-1 text-[11px] text-gray-500">{item.sub}</p>
                </div>
              ))}
            </div>

            {/* P&L TABLE */}
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-100 px-4 py-3">
                <h3 className="text-[15px] font-bold text-gray-900">
                  Income & Expenditure Statement
                </h3>
                <p className="mt-0.5 text-[11px] text-gray-500">
                  Detailed breakdown of revenue and costs
                </p>
              </div>
              <div className="p-4">
                <table className="w-full text-sm">
                  <tbody>
                    <tr className="border-b border-gray-100">
                      <td
                        colSpan={2}
                        className="py-2 text-[11px] font-bold uppercase tracking-wide text-gray-400"
                      >
                        REVENUE
                      </td>
                    </tr>
                    {[
                      {
                        label: "Gross Revenue (Billed)",
                        value: totalRevenue + totalDiscount,
                        positive: true,
                      },
                      {
                        label: "(-) Discounts Given",
                        value: -totalDiscount,
                        positive: false,
                      },
                      {
                        label: "Net Revenue",
                        value: totalRevenue,
                        positive: true,
                        bold: true,
                      },
                      {
                        label: "Service Charges Collected",
                        value: totalServiceCharge,
                        positive: true,
                      },
                    ].map((row) => (
                      <tr key={row.label} className="border-b border-gray-50">
                        <td
                          className={`py-2 pl-4 text-[13px] ${row.bold ? "font-bold text-gray-900" : "text-gray-600"}`}
                        >
                          {row.label}
                        </td>
                        <td
                          className={`py-2 pr-4 text-right text-[13px] font-semibold ${row.positive ? "text-emerald-600" : "text-red-600"}`}
                        >
                          {row.value < 0
                            ? `-₹${Math.abs(row.value).toLocaleString("en-IN")}`
                            : `₹${row.value.toLocaleString("en-IN")}`}
                        </td>
                      </tr>
                    ))}
                    <tr className="border-b border-gray-100">
                      <td
                        colSpan={2}
                        className="pb-1 pt-4 text-[11px] font-bold uppercase tracking-wide text-gray-400"
                      >
                        TAX DEDUCTIONS
                      </td>
                    </tr>
                    <tr>
                      <td
                        colSpan={2}
                        className="pb-2 text-[10px] italic text-gray-400"
                      >
                        Shown for reference — GST collected is held for the
                        government, not the restaurant's own expense, so it
                        isn't subtracted from Net Profit below (matching the
                        Finance Engine used across the app).
                      </td>
                    </tr>
                    {[
                      { label: "CGST", value: -totalCGST },
                      { label: "SGST", value: -totalSGST },
                      { label: "Total GST", value: -totalGST, bold: true },
                    ].map((row) => (
                      <tr key={row.label} className="border-b border-gray-50">
                        <td
                          className={`py-2 pl-4 text-[13px] ${row.bold ? "font-bold text-gray-900" : "text-gray-600"}`}
                        >
                          {row.label}
                        </td>
                        <td className="py-2 pr-4 text-right text-[13px] font-semibold text-red-600">
                          -₹{Math.abs(row.value).toLocaleString("en-IN")}
                        </td>
                      </tr>
                    ))}
                    <tr className="border-b border-gray-100">
                      <td
                        colSpan={2}
                        className="pb-2 pt-4 text-[11px] font-bold uppercase tracking-wide text-gray-400"
                      >
                        OPERATING EXPENSES
                      </td>
                    </tr>
                    {fin
                      ? // Canonical categories (Finance Engine) — matches
                        // Dashboard/Insights/Branch Comparison exactly. The raw
                        // ShopExpense-by-type ledger (previously shown here) is
                        // real data too, but is a different opex source than
                        // what everywhere else in the app uses to compute Net
                        // Profit — it's shown in full on the Expense Tracker
                        // tab instead of being duplicated (and mismatched) here.
                        [
                          { label: "Food Cost", value: fin.foodCost },
                          { label: "Labour Cost", value: fin.labourCost },
                          {
                            label: "Fixed Expenses (rent, utilities, etc.)",
                            value: fin.fixedExpenses,
                          },
                          {
                            label:
                              "Variable Expenses (marketing, packaging, etc.)",
                            value: fin.variableExpenses,
                          },
                          {
                            label: "Finance Cost (loan EMI, interest, etc.)",
                            value: fin.financeCost,
                          },
                        ].map((r) => (
                          <tr key={r.label} className="border-b border-gray-50">
                            <td className="py-2 pl-4 text-[13px] text-gray-600">
                              {r.label}
                            </td>
                            <td className="py-2 pr-4 text-right text-[13px] font-semibold text-red-600">
                              -₹{Math.round(r.value).toLocaleString("en-IN")}
                            </td>
                          </tr>
                        ))
                      : Object.entries(expenseByType).map(
                          ([type, amount]: any) => (
                            <tr key={type} className="border-b border-gray-50">
                              <td className="py-2 pl-4 text-[13px] text-gray-600">
                                {type}
                              </td>
                              <td className="py-2 pr-4 text-right text-[13px] font-semibold text-red-600">
                                -₹{Number(amount).toLocaleString("en-IN")}
                              </td>
                            </tr>
                          ),
                        )}
                    <tr className="border-b border-gray-100">
                      <td className="py-2 pl-4 text-[13px] font-bold text-gray-900">
                        Total Expenses
                      </td>
                      <td className="py-2 pr-4 text-right text-[13px] font-bold text-red-600">
                        -₹{Math.round(totalExpenses).toLocaleString("en-IN")}
                      </td>
                    </tr>
                    <tr
                      className={`${netProfit >= 0 ? "bg-emerald-50" : "bg-red-50"} rounded-lg`}
                    >
                      <td className="py-3 pl-4 text-[15px] font-black text-gray-900">
                        NET PROFIT / LOSS
                      </td>
                      <td
                        className={`py-3 pr-4 text-right text-[15px] font-black ${netProfit >= 0 ? "text-emerald-600" : "text-red-600"}`}
                      >
                        {netProfit >= 0 ? "+" : ""}₹
                        {netProfit.toLocaleString("en-IN")}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* REVENUE TREND CHART */}
            <div className="grid grid-cols-1 gap-3 xl:grid-cols-3">
              <div className="xl:col-span-2 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="border-b border-gray-100 px-4 py-3">
                  <h3 className="text-[15px] font-bold text-gray-900">
                    Daily Revenue vs Expenses
                  </h3>
                </div>
                <div className="p-3">
                  {dailyData.length > 1 ? (
                    <ResponsiveContainer width="100%" height={200}>
                      <AreaChart data={dailyData}>
                        <defs>
                          <linearGradient
                            id="revGrad"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="5%"
                              stopColor="#ef4444"
                              stopOpacity={0.15}
                            />
                            <stop
                              offset="95%"
                              stopColor="#ef4444"
                              stopOpacity={0}
                            />
                          </linearGradient>
                        </defs>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          stroke="#f1f5f9"
                        />
                        <XAxis
                          dataKey="date"
                          tick={{ fontSize: 10, fill: "#6b7280" }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          tick={{ fontSize: 10, fill: "#6b7280" }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip />
                        <Area
                          type="monotone"
                          dataKey="revenue"
                          name="Revenue"
                          stroke="#ef4444"
                          strokeWidth={2}
                          fill="url(#revGrad)"
                        />
                        <Area
                          type="monotone"
                          dataKey="discount"
                          name="Discount Lost"
                          stroke="#f59e0b"
                          strokeWidth={1.5}
                          fill="none"
                          strokeDasharray="4 2"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex h-[200px] items-center justify-center text-[12px] text-gray-400">
                      Not enough data for this period
                    </div>
                  )}
                </div>
              </div>
              <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="border-b border-gray-100 px-4 py-3">
                  <h3 className="text-[15px] font-bold text-gray-900">
                    Order Type Mix
                  </h3>
                </div>
                <div className="p-3">
                  {orderTypePieData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={orderTypePieData}
                          cx="50%"
                          cy="45%"
                          innerRadius={40}
                          outerRadius={70}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {orderTypePieData.map((_, i) => (
                            <Cell key={i} fill={COLORS[i]} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(v: any) =>
                            `₹${Number(v).toLocaleString("en-IN")}`
                          }
                        />
                        <Legend
                          verticalAlign="bottom"
                          height={20}
                          iconType="circle"
                          wrapperStyle={{ fontSize: "11px" }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex h-[200px] items-center justify-center text-[12px] text-gray-400">
                      No order data
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===== TAX REPORT ===== */}
        {activeTab === "Tax Report" && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
              {[
                { label: "Total CGST", value: totalCGST, color: "blue" },
                { label: "Total SGST", value: totalSGST, color: "violet" },
                {
                  label: "Total GST",
                  value: totalGST,
                  color: "red",
                  bold: true,
                },
                {
                  label: "Taxable Revenue",
                  value: totalRevenue - totalGST,
                  color: "emerald",
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
                >
                  <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">
                    {item.label}
                  </p>
                  <p
                    className={`mt-2 text-[20px] font-bold ${item.color === "emerald" ? "text-emerald-600" : item.color === "blue" ? "text-blue-600" : item.color === "violet" ? "text-violet-600" : "text-red-600"}`}
                  >
                    ₹{Number(item.value).toLocaleString("en-IN")}
                  </p>
                </div>
              ))}
            </div>

            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                <div>
                  <h3 className="text-[15px] font-bold text-gray-900">
                    GST Breakdown by Bill
                  </h3>
                  <p className="mt-0.5 text-[11px] text-gray-500">
                    Individual bill-wise tax detail for GST filing
                  </p>
                </div>
                <button
                  onClick={downloadGstFiling}
                  disabled={downloadingGst}
                  className="flex shrink-0 items-center gap-1.5 rounded-xl bg-[#b10000] px-3.5 py-2 text-[11px] font-bold text-white transition hover:bg-[#950000] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {downloadingGst ? "Preparing…" : "Download GST Summary"}
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-[12px]">
                  <thead className="bg-gray-50">
                    <tr className="border-b border-gray-100">
                      {[
                        "Bill No",
                        "Date",
                        "Order Type",
                        "Subtotal",
                        "CGST",
                        "SGST",
                        "Total GST",
                        "Total",
                        "Status",
                      ].map((h) => (
                        <th
                          key={h}
                          className="px-4 py-2 text-left text-[10px] font-bold uppercase tracking-wide text-gray-400"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {bills.slice(0, 20).map((b: any) => (
                      <tr
                        key={b.id}
                        className="border-b border-gray-50 hover:bg-gray-50/60"
                      >
                        <td className="px-4 py-2 font-semibold text-gray-900">
                          {b.billNo}
                        </td>
                        <td className="px-4 py-2 text-gray-500">
                          {new Date(b.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-2">
                          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-700">
                            {b.orderType}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-gray-700">
                          ₹{Number(b.subtotal || 0).toLocaleString("en-IN")}
                        </td>
                        <td className="px-4 py-2 text-blue-600">
                          ₹{Number(b.cgst || 0).toLocaleString("en-IN")}
                        </td>
                        <td className="px-4 py-2 text-violet-600">
                          ₹{Number(b.sgst || 0).toLocaleString("en-IN")}
                        </td>
                        <td className="px-4 py-2 font-semibold text-red-600">
                          ₹
                          {(
                            Number(b.cgst || 0) + Number(b.sgst || 0)
                          ).toLocaleString("en-IN")}
                        </td>
                        <td className="px-4 py-2 font-bold text-gray-900">
                          ₹{Number(b.total || 0).toLocaleString("en-IN")}
                        </td>
                        <td className="px-4 py-2">
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${b.status === "PAID" ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-700"}`}
                          >
                            {b.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {bills.length === 0 && (
                      <tr>
                        <td
                          colSpan={9}
                          className="py-10 text-center text-[12px] text-gray-400"
                        >
                          No bills found for this period
                        </td>
                      </tr>
                    )}
                  </tbody>
                  {bills.length > 0 && (
                    <tfoot className="border-t border-gray-200 bg-red-50/60">
                      <tr>
                        <td
                          colSpan={3}
                          className="px-4 py-3 text-[12px] font-bold text-gray-900"
                        >
                          TOTALS
                        </td>
                        <td className="px-4 py-3 text-[12px] font-bold text-gray-900">
                          ₹
                          {bills
                            .reduce((s, b) => s + Number(b.subtotal || 0), 0)
                            .toLocaleString("en-IN")}
                        </td>
                        <td className="px-4 py-3 text-[12px] font-bold text-blue-600">
                          ₹{totalCGST.toLocaleString("en-IN")}
                        </td>
                        <td className="px-4 py-3 text-[12px] font-bold text-violet-600">
                          ₹{totalSGST.toLocaleString("en-IN")}
                        </td>
                        <td className="px-4 py-3 text-[12px] font-bold text-red-600">
                          ₹{totalGST.toLocaleString("en-IN")}
                        </td>
                        <td className="px-4 py-3 text-[12px] font-bold text-gray-900">
                          ₹{totalRevenue.toLocaleString("en-IN")}
                        </td>
                        <td />
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ===== EXPENSE TRACKER ===== */}
        {activeTab === "Expense Tracker" && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
              <div className="rounded-xl border border-red-100 bg-red-50/60 p-4">
                <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500">
                  Total Expenses
                </p>
                <p className="mt-2 text-[22px] font-bold text-red-700">
                  ₹{localTotalExpenses.toLocaleString("en-IN")}
                </p>
                <p className="mt-1 text-[11px] text-gray-500">
                  {expenses.length} entries
                </p>
              </div>
              <div className="rounded-xl border border-orange-100 bg-orange-50/60 p-4">
                <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500">
                  Expense Categories
                </p>
                <p className="mt-2 text-[22px] font-bold text-orange-700">
                  {Object.keys(expenseByType).length}
                </p>
                <p className="mt-1 text-[11px] text-gray-500">Distinct types</p>
              </div>
              <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4">
                <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500">
                  Avg per Entry
                </p>
                <p className="mt-2 text-[22px] font-bold text-blue-700">
                  ₹
                  {expenses.length
                    ? Math.round(
                        localTotalExpenses / expenses.length,
                      ).toLocaleString("en-IN")
                    : 0}
                </p>
                <p className="mt-1 text-[11px] text-gray-500">
                  Per expense logged
                </p>
              </div>
              <div className="rounded-xl border border-gray-200 bg-gray-50/60 p-4">
                <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500">
                  Expense / Revenue
                </p>
                <p className="mt-2 text-[22px] font-bold text-gray-900">
                  {totalRevenue > 0
                    ? ((localTotalExpenses / totalRevenue) * 100).toFixed(1)
                    : 0}
                  %
                </p>
                <p className="mt-1 text-[11px] text-gray-500">Cost ratio</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
              {/* EXPENSE BY TYPE */}
              <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="border-b border-gray-100 px-4 py-3">
                  <h3 className="text-[15px] font-bold text-gray-900">
                    Expense by Category
                  </h3>
                </div>
                {Object.keys(expenseByType).length > 0 ? (
                  <div className="p-3">
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart
                        data={Object.entries(expenseByType).map(([k, v]) => ({
                          type: k,
                          amount: v,
                        }))}
                        layout="vertical"
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          horizontal={false}
                          stroke="#f1f5f9"
                        />
                        <XAxis
                          type="number"
                          tick={{ fontSize: 10, fill: "#6b7280" }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          dataKey="type"
                          type="category"
                          tick={{ fontSize: 10, fill: "#6b7280" }}
                          axisLine={false}
                          tickLine={false}
                          width={90}
                        />
                        <Tooltip
                          formatter={(v: any) =>
                            `₹${Number(v).toLocaleString("en-IN")}`
                          }
                        />
                        <Bar
                          dataKey="amount"
                          fill="#ef4444"
                          radius={[0, 4, 4, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="flex h-[220px] items-center justify-center text-[12px] text-gray-400">
                    No expense data found
                  </div>
                )}
              </div>

              {/* EXPENSE LIST */}
              <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="border-b border-gray-100 px-4 py-3">
                  <h3 className="text-[15px] font-bold text-gray-900">
                    Recent Expenses
                  </h3>
                </div>
                <div className="divide-y divide-gray-50">
                  {expenses.slice(0, 8).map((e: any) => (
                    <div
                      key={e.id}
                      className="flex items-center justify-between px-4 py-2.5"
                    >
                      <div>
                        <p className="text-[13px] font-semibold text-gray-900">
                          {e.title}
                        </p>
                        <div className="mt-0.5 flex items-center gap-2">
                          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[9px] font-medium text-gray-600">
                            {e.expenseType}
                          </span>
                          <span className="text-[10px] text-gray-400">
                            {new Date(
                              e.expenseDate || e.createdAt,
                            ).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <p className="text-[14px] font-bold text-red-600">
                        ₹{Number(e.amount).toLocaleString("en-IN")}
                      </p>
                    </div>
                  ))}
                  {expenses.length === 0 && (
                    <div className="py-10 text-center text-[12px] text-gray-400">
                      No expenses logged for this period
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===== SALES ANALYTICS ===== */}
        {activeTab === "Sales Analytics" && (
          <div className="space-y-3">
            {/* PAYMENT METHOD BREAKDOWN */}
            <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
              <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="border-b border-gray-100 px-4 py-3">
                  <h3 className="text-[15px] font-bold text-gray-900">
                    Payment Method Revenue
                  </h3>
                </div>
                <div className="divide-y divide-gray-50">
                  {Object.entries(paymentBreakdown).map(
                    ([method, data]: any) => {
                      const pct =
                        totalRevenue > 0
                          ? Math.round((data.amount / totalRevenue) * 100)
                          : 0;
                      return (
                        <div key={method} className="px-4 py-3">
                          <div className="flex items-center justify-between">
                            <p className="text-[13px] font-semibold text-gray-900">
                              {method}
                            </p>
                            <div className="text-right">
                              <p className="text-[13px] font-bold text-gray-900">
                                ₹{data.amount.toLocaleString("en-IN")}
                              </p>
                              <p className="text-[10px] text-gray-400">
                                {data.count} bills
                              </p>
                            </div>
                          </div>
                          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-gray-100">
                            <div
                              className="h-full rounded-full bg-[#b10000] transition-all"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <p className="mt-1 text-[10px] text-gray-400">
                            {pct}% of total revenue
                          </p>
                        </div>
                      );
                    },
                  )}
                  {Object.keys(paymentBreakdown).length === 0 && (
                    <div className="py-10 text-center text-[12px] text-gray-400">
                      No payment data for this period
                    </div>
                  )}
                </div>
              </div>

              {/* ORDER TYPE SPLIT */}
              <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="border-b border-gray-100 px-4 py-3">
                  <h3 className="text-[15px] font-bold text-gray-900">
                    Order Channel Performance
                  </h3>
                </div>
                <div className="space-y-3 p-4">
                  {[
                    {
                      label: "Dine In",
                      value: dineInRevenue,
                      count: bills.filter((b) => b.orderType === "DINE_IN")
                        .length,
                      color: "text-red-600",
                      bg: "bg-[#b10000]",
                    },
                    {
                      label: "Takeaway",
                      value: takeawayRevenue,
                      count: bills.filter((b) => b.orderType === "TAKEAWAY")
                        .length,
                      color: "text-orange-600",
                      bg: "bg-orange-500",
                    },
                    {
                      label: "Delivery",
                      value: deliveryRevenue,
                      count: bills.filter((b) => b.orderType === "DELIVERY")
                        .length,
                      color: "text-blue-600",
                      bg: "bg-blue-500",
                    },
                  ].map((row) => {
                    const pct =
                      totalRevenue > 0
                        ? Math.round((row.value / totalRevenue) * 100)
                        : 0;
                    return (
                      <div key={row.label}>
                        <div className="flex items-center justify-between">
                          <p className="text-[13px] font-semibold text-gray-900">
                            {row.label}
                          </p>
                          <p className={`text-[13px] font-bold ${row.color}`}>
                            ₹{row.value.toLocaleString("en-IN")}{" "}
                            <span className="text-[10px] text-gray-400">
                              ({row.count} bills)
                            </span>
                          </p>
                        </div>
                        <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-gray-100">
                          <div
                            className={`h-full rounded-full ${row.bg} transition-all`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <p className="mt-0.5 text-[10px] text-gray-400">
                          {pct}% of revenue
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* BILLS SUMMARY */}
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-100 px-4 py-3 flex items-center justify-between">
                <div>
                  <h3 className="text-[15px] font-bold text-gray-900">
                    Bills Summary
                  </h3>
                  <p className="mt-0.5 text-[11px] text-gray-500">
                    Payment status breakdown
                  </p>
                </div>
                <div className="flex gap-3">
                  <div className="rounded-lg bg-emerald-50 px-3 py-2 text-center">
                    <p className="text-[11px] font-semibold text-emerald-700">
                      {paidBills.length} Paid
                    </p>
                    <p className="text-[10px] text-gray-400">
                      ₹
                      {paidBills
                        .reduce((s, b) => s + Number(b.total || 0), 0)
                        .toLocaleString("en-IN")}
                    </p>
                  </div>
                  <div className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-center">
                    <p className="text-[11px] font-semibold text-red-700">
                      {unpaidBills.length} Unpaid
                    </p>
                    <p className="text-[10px] text-gray-400">
                      ₹
                      {unpaidBills
                        .reduce((s, b) => s + Number(b.total || 0), 0)
                        .toLocaleString("en-IN")}
                    </p>
                  </div>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-[12px]">
                  <thead className="bg-gray-50">
                    <tr className="border-b border-gray-100">
                      {[
                        "Bill No",
                        "Customer",
                        "Order Type",
                        "Payment",
                        "Subtotal",
                        "GST",
                        "Discount",
                        "Total",
                        "Status",
                      ].map((h) => (
                        <th
                          key={h}
                          className="px-4 py-2 text-left text-[10px] font-bold uppercase tracking-wide text-gray-400"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {bills.slice(0, 15).map((b: any) => (
                      <tr
                        key={b.id}
                        className="border-b border-gray-50 hover:bg-gray-50/60"
                      >
                        <td className="px-4 py-2 font-semibold text-gray-900">
                          {b.billNo}
                        </td>
                        <td className="px-4 py-2 text-gray-600">
                          {b.customer?.name || "Guest"}
                        </td>
                        <td className="px-4 py-2">
                          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-700">
                            {b.orderType}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-gray-600">
                          {b.paymentMethod}
                        </td>
                        <td className="px-4 py-2 text-gray-700">
                          ₹{Number(b.subtotal || 0).toLocaleString("en-IN")}
                        </td>
                        <td className="px-4 py-2 text-red-600">
                          ₹
                          {(
                            Number(b.cgst || 0) + Number(b.sgst || 0)
                          ).toLocaleString("en-IN")}
                        </td>
                        <td className="px-4 py-2 text-orange-600">
                          {Number(b.discount || 0) > 0
                            ? `-₹${Number(b.discount).toLocaleString("en-IN")}`
                            : "-"}
                        </td>
                        <td className="px-4 py-2 font-bold text-gray-900">
                          ₹{Number(b.total || 0).toLocaleString("en-IN")}
                        </td>
                        <td className="px-4 py-2">
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${b.status === "PAID" ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-700"}`}
                          >
                            {b.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {bills.length === 0 && (
                      <tr>
                        <td
                          colSpan={9}
                          className="py-10 text-center text-[12px] text-gray-400"
                        >
                          No bills for this period
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ===== DISCOUNT ANALYSIS ===== */}
        {activeTab === "Discount Analysis" && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
              {[
                {
                  label: "Total Discounts Given",
                  value: `₹${totalDiscount.toLocaleString("en-IN")}`,
                  sub: "Revenue you gave away",
                  color: "red",
                },
                {
                  label: "Bills with Discount",
                  value: bills.filter((b) => Number(b.discount) > 0).length,
                  sub: `out of ${bills.length} total bills`,
                  color: "orange",
                },
                {
                  label: "Avg Discount per Bill",
                  value: `₹${bills.filter((b) => Number(b.discount) > 0).length ? Math.round(totalDiscount / bills.filter((b) => Number(b.discount) > 0).length).toLocaleString("en-IN") : 0}`,
                  sub: "when discount applied",
                  color: "blue",
                },
                {
                  label: "Discount % of Revenue",
                  value: `${totalRevenue > 0 ? ((totalDiscount / (totalRevenue + totalDiscount)) * 100).toFixed(1) : 0}%`,
                  sub: "revenue lost to discounts",
                  color: "violet",
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
                >
                  <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">
                    {item.label}
                  </p>
                  <p
                    className={`mt-2 text-[20px] font-bold ${item.color === "red" ? "text-red-600" : item.color === "orange" ? "text-orange-600" : item.color === "blue" ? "text-blue-600" : "text-violet-600"}`}
                  >
                    {item.value}
                  </p>
                  <p className="mt-1 text-[11px] text-gray-500">{item.sub}</p>
                </div>
              ))}
            </div>

            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-100 px-4 py-3">
                <h3 className="text-[15px] font-bold text-gray-900">
                  Bills with Discounts Applied
                </h3>
                <p className="mt-0.5 text-[11px] text-gray-500">
                  Track every discount given — identify patterns and prevent
                  abuse
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-[12px]">
                  <thead className="bg-gray-50">
                    <tr className="border-b border-gray-100">
                      {[
                        "Bill No",
                        "Date",
                        "Customer",
                        "Order Type",
                        "Gross Total",
                        "Discount",
                        "Net Total",
                        "Discount %",
                      ].map((h) => (
                        <th
                          key={h}
                          className="px-4 py-2 text-left text-[10px] font-bold uppercase tracking-wide text-gray-400"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {bills
                      .filter((b) => Number(b.discount) > 0)
                      .slice(0, 20)
                      .map((b: any) => {
                        const gross =
                          Number(b.total || 0) + Number(b.discount || 0);
                        const discountPct =
                          gross > 0
                            ? ((Number(b.discount) / gross) * 100).toFixed(1)
                            : "0";
                        return (
                          <tr
                            key={b.id}
                            className="border-b border-gray-50 hover:bg-orange-50/30"
                          >
                            <td className="px-4 py-2 font-semibold text-gray-900">
                              {b.billNo}
                            </td>
                            <td className="px-4 py-2 text-gray-500">
                              {new Date(b.createdAt).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-2 text-gray-600">
                              {b.customer?.name || "Guest"}
                            </td>
                            <td className="px-4 py-2">
                              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-700">
                                {b.orderType}
                              </span>
                            </td>
                            <td className="px-4 py-2 text-gray-700">
                              ₹{gross.toLocaleString("en-IN")}
                            </td>
                            <td className="px-4 py-2 font-bold text-orange-600">
                              -₹{Number(b.discount).toLocaleString("en-IN")}
                            </td>
                            <td className="px-4 py-2 font-bold text-gray-900">
                              ₹{Number(b.total || 0).toLocaleString("en-IN")}
                            </td>
                            <td className="px-4 py-2">
                              <span
                                className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${Number(discountPct) > 20 ? "bg-red-50 text-red-700" : "bg-orange-50 text-orange-600"}`}
                              >
                                {discountPct}%
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    {bills.filter((b) => Number(b.discount) > 0).length ===
                      0 && (
                      <tr>
                        <td
                          colSpan={8}
                          className="py-10 text-center text-[12px] text-gray-400"
                        >
                          No discounts given in this period
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ===== MENU ENGINEERING ===== */}
        {activeTab === "Menu Engineering" &&
          (() => {
            // Build item sales map from BillItems
            const itemSales: Record<
              string,
              { name: string; qty: number; revenue: number; price: number }
            > = {};
            bills.forEach((b: any) => {
              (b.items || []).forEach((item: any) => {
                const id = item.menuItemId || item.itemName;
                if (!itemSales[id])
                  itemSales[id] = {
                    name: item.itemName,
                    qty: 0,
                    revenue: 0,
                    price: Number(item.price || 0),
                  };
                itemSales[id].qty += Number(item.quantity || 0);
                itemSales[id].revenue += Number(item.total || 0);
              });
            });

            // Compute food cost from menuItemIngredients
            const itemsWithCost = menuItems.map((mi: any) => {
              const sales = itemSales[mi.id] || {
                name: mi.name,
                qty: 0,
                revenue: 0,
                price: Number(mi.price || 0),
              };
              const recipeCost = (mi.menuItemIngredients || []).reduce(
                (acc: number, m: any) => {
                  const ing = m.ingredient;
                  if (!ing) return acc;
                  const qty = Number(m.quantity || 0);
                  const price = Number(ing.pricePerUnit || 0);
                  const mu = m.unit?.toLowerCase();
                  const iu = ing.unit?.toLowerCase();
                  let cost = qty * price;
                  if (iu === "kg" && (mu === "gram" || mu === "gm"))
                    cost = (qty / 1000) * price;
                  else if (iu === "litre" && mu === "ml")
                    cost = (qty / 1000) * price;
                  return acc + cost;
                },
                0,
              );
              const sellingPrice = Number(mi.price || 0);
              const margin =
                sellingPrice > 0
                  ? ((sellingPrice - recipeCost) / sellingPrice) * 100
                  : 0;
              const foodCostPercent =
                sellingPrice > 0 ? (recipeCost / sellingPrice) * 100 : 0;
              // Price that would yield a 65% profit margin (35% food cost ratio)
              const suggestedPrice = recipeCost > 0 ? recipeCost / 0.35 : 0;
              return {
                ...mi,
                ...sales,
                recipeCost,
                margin,
                foodCostPercent,
                suggestedPrice,
              };
            });

            // ── Best sellers — ranked by quantity sold, not bucketed ──────────
            const bestSellers = [...itemsWithCost]
              .sort((a, b) => b.qty - a.qty)
              .slice(0, 10);

            // ── Profitability rankings — across all dishes, and per category ──
            const mostProfitableOverall = itemsWithCost
              .filter((i) => i.price > 0)
              .slice()
              .sort((a, b) => b.margin - a.margin)
              .slice(0, 10);

            const categoryStatsMap: Record<string, any> = {};
            itemsWithCost.forEach((item: any) => {
              const catName = item.category?.name || "Uncategorized";
              if (!categoryStatsMap[catName]) {
                categoryStatsMap[catName] = {
                  name: catName,
                  items: [] as any[],
                };
              }
              categoryStatsMap[catName].items.push(item);
            });
            const categoryRanking = Object.values(categoryStatsMap)
              .map((c: any) => {
                const priced = c.items.filter((i: any) => i.price > 0);
                const avgMargin = priced.length
                  ? priced.reduce((s: number, i: any) => s + i.margin, 0) /
                    priced.length
                  : 0;
                const avgFoodCostPercent = priced.length
                  ? priced.reduce(
                      (s: number, i: any) => s + i.foodCostPercent,
                      0,
                    ) / priced.length
                  : 0;
                const topDish = [...c.items].sort(
                  (a: any, b: any) => b.margin - a.margin,
                )[0];
                return {
                  name: c.name,
                  count: c.items.length,
                  avgMargin,
                  avgFoodCostPercent,
                  topDish,
                };
              })
              .sort((a: any, b: any) => b.avgMargin - a.avgMargin);

            const medianQty =
              itemsWithCost.length > 0
                ? itemsWithCost.map((i) => i.qty).sort((a, b) => a - b)[
                    Math.floor(itemsWithCost.length / 2)
                  ]
                : 0;
            const medianMargin =
              itemsWithCost.length > 0
                ? itemsWithCost.map((i) => i.margin).sort((a, b) => a - b)[
                    Math.floor(itemsWithCost.length / 2)
                  ]
                : 50;

            const classify = (item: any) => {
              const highQty = item.qty >= medianQty;
              const highMargin = item.margin >= medianMargin;
              if (highQty && highMargin)
                return {
                  label: "Star",
                  color: "bg-emerald-100 text-emerald-700 border-emerald-200",
                  dot: "bg-emerald-500",
                  tip: "Promote heavily — high demand, high profit",
                };
              if (!highQty && highMargin)
                return {
                  label: "Puzzle",
                  color: "bg-blue-100 text-blue-700 border-blue-200",
                  dot: "bg-blue-500",
                  tip: "Good margin but needs better visibility",
                };
              if (highQty && !highMargin)
                return {
                  label: "Plowhorse",
                  color: "bg-orange-100 text-orange-700 border-orange-200",
                  dot: "bg-orange-500",
                  tip: "Popular but low margin — reprice or reduce cost",
                };
              return {
                label: "Dog",
                color: "bg-red-100 text-red-700 border-red-200",
                dot: "bg-[#b10000]",
                tip: "Low demand, low margin — consider removing",
              };
            };

            const quadrants = {
              Star: [] as any[],
              Puzzle: [] as any[],
              Plowhorse: [] as any[],
              Dog: [] as any[],
            };
            itemsWithCost.forEach((item) => {
              const c = classify(item);
              (quadrants as any)[c.label].push({ ...item, cls: c });
            });
            Object.values(quadrants).forEach((arr) =>
              arr.sort((a: any, b: any) => b.qty - a.qty),
            );

            return (
              <div className="space-y-6">
                {/* ===== BEST SELLERS (ranked by qty, with food cost% + margin) ===== */}
                <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                  <div className="px-4 py-3">
                    <h3 className="text-[15px] font-bold text-gray-900">
                      Best Sellers
                    </h3>
                    <p className="mt-0.5 text-[11px] text-gray-500">
                      Ranked by units sold · food cost% and margin% shown side
                      by side · suggested price targets a 65% profit margin
                    </p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-[12px]">
                      <thead className="bg-gray-50/70">
                        <tr className="border-b border-gray-100">
                          {[
                            "Item",
                            "Category",
                            "Sold",
                            "Revenue",
                            "Price",
                            "Food Cost %",
                            "Margin %",
                            "Suggested Price (65% profit)",
                          ].map((h) => (
                            <th
                              key={h}
                              className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wide text-gray-400"
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {bestSellers.map((item: any) => (
                          <tr
                            key={item.id}
                            className="border-b border-gray-100 hover:bg-gray-50/40"
                          >
                            <td className="px-3 py-2 font-semibold text-gray-900">
                              {item.name}
                            </td>
                            <td className="px-3 py-2 text-gray-500">
                              {item.category?.name || "—"}
                            </td>
                            <td className="px-3 py-2 font-bold text-gray-900">
                              {item.qty}
                            </td>
                            <td className="px-3 py-2 text-gray-700">
                              ₹
                              {Math.round(item.revenue).toLocaleString("en-IN")}
                            </td>
                            <td className="px-3 py-2 text-gray-700">
                              ₹{item.price}
                            </td>
                            <td className="px-3 py-2 text-gray-600">
                              {item.foodCostPercent.toFixed(1)}%
                            </td>
                            <td className="px-3 py-2">
                              <span
                                className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${item.margin >= 60 ? "bg-emerald-100 text-emerald-700" : item.margin >= 40 ? "bg-orange-100 text-orange-700" : "bg-red-100 text-red-700"}`}
                              >
                                {item.margin.toFixed(1)}%
                              </span>
                            </td>
                            <td className="px-3 py-2 text-gray-700">
                              {item.suggestedPrice > 0
                                ? `₹${Math.round(item.suggestedPrice)}`
                                : "—"}
                            </td>
                          </tr>
                        ))}
                        {bestSellers.length === 0 && (
                          <tr>
                            <td
                              colSpan={8}
                              className="px-3 py-6 text-center text-[11px] text-gray-400"
                            >
                              No sales data yet
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* ===== ALTERNATE DISH COMPARE ===== */}
                {(() => {
                  const dishA = itemsWithCost.find(
                    (i: any) => String(i.id) === compareDishAId,
                  );
                  const dishB = itemsWithCost.find(
                    (i: any) => String(i.id) === compareDishBId,
                  );
                  const rows: Array<{
                    label: string;
                    a: any;
                    b: any;
                    format?: (v: any) => string;
                  }> = [
                    {
                      label: "Category",
                      a: dishA?.category?.name,
                      b: dishB?.category?.name,
                    },
                    {
                      label: "Selling Price",
                      a: dishA?.price,
                      b: dishB?.price,
                      format: (v) => (v != null ? `₹${v}` : "—"),
                    },
                    {
                      label: "Recipe (Food) Cost",
                      a: dishA?.recipeCost,
                      b: dishB?.recipeCost,
                      format: (v) =>
                        v != null ? `₹${Number(v).toFixed(2)}` : "—",
                    },
                    {
                      label: "Food Cost %",
                      a: dishA?.foodCostPercent,
                      b: dishB?.foodCostPercent,
                      format: (v) =>
                        v != null ? `${Number(v).toFixed(1)}%` : "—",
                    },
                    {
                      label: "Profit Margin %",
                      a: dishA?.margin,
                      b: dishB?.margin,
                      format: (v) =>
                        v != null ? `${Number(v).toFixed(1)}%` : "—",
                    },
                    {
                      label: "Units Sold",
                      a: dishA?.qty,
                      b: dishB?.qty,
                    },
                    {
                      label: "Suggested Price (65% profit)",
                      a: dishA?.suggestedPrice,
                      b: dishB?.suggestedPrice,
                      format: (v) => (v > 0 ? `₹${Math.round(v)}` : "—"),
                    },
                  ];
                  return (
                    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                      <div className="px-4 py-3">
                        <h3 className="text-[15px] font-bold text-gray-900">
                          Compare Dishes
                        </h3>
                        <p className="mt-0.5 text-[11px] text-gray-500">
                          Compare a proposed/alternate dish against an existing
                          one on cost, price and margin
                        </p>
                      </div>
                      <div className="grid grid-cols-1 gap-3 px-4 pb-4 sm:grid-cols-2">
                        <select
                          value={compareDishAId}
                          onChange={(e) => setCompareDishAId(e.target.value)}
                          className="h-9 rounded-xl border border-gray-200 bg-white px-3 text-[12px] font-medium text-gray-700 outline-none"
                        >
                          <option value="">Select existing dish…</option>
                          {itemsWithCost.map((i: any) => (
                            <option key={i.id} value={String(i.id)}>
                              {i.name}
                            </option>
                          ))}
                        </select>
                        <select
                          value={compareDishBId}
                          onChange={(e) => setCompareDishBId(e.target.value)}
                          className="h-9 rounded-xl border border-gray-200 bg-white px-3 text-[12px] font-medium text-gray-700 outline-none"
                        >
                          <option value="">Select alternate dish…</option>
                          {itemsWithCost.map((i: any) => (
                            <option key={i.id} value={String(i.id)}>
                              {i.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      {dishA && dishB ? (
                        <div className="overflow-x-auto border-t border-gray-100">
                          <table className="min-w-full text-[12px]">
                            <thead className="bg-gray-50/70">
                              <tr className="border-b border-gray-100">
                                <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wide text-gray-400">
                                  Metric
                                </th>
                                <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wide text-gray-400">
                                  {dishA.name}
                                </th>
                                <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wide text-gray-400">
                                  {dishB.name}
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {rows.map((r) => (
                                <tr
                                  key={r.label}
                                  className="border-b border-gray-100"
                                >
                                  <td className="px-3 py-2 font-semibold text-gray-500">
                                    {r.label}
                                  </td>
                                  <td className="px-3 py-2 text-gray-900">
                                    {r.format ? r.format(r.a) : (r.a ?? "—")}
                                  </td>
                                  <td className="px-3 py-2 text-gray-900">
                                    {r.format ? r.format(r.b) : (r.b ?? "—")}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p className="px-4 pb-4 text-[12px] text-gray-400">
                          Pick two dishes above to compare them
                        </p>
                      )}
                    </div>
                  );
                })()}

                {/* ===== MENU ITEM SPLIT — PRICE HIGH / USAGE HIGH ===== */}
                {(() => {
                  const highestPriced = [...itemsWithCost]
                    .sort((a, b) => b.price - a.price)
                    .slice(0, 10);
                  const highestUsage = [...itemsWithCost]
                    .sort((a, b) => b.qty - a.qty)
                    .slice(0, 10);
                  return (
                    <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
                      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                        <div className="px-4 py-3">
                          <h3 className="text-[15px] font-bold text-gray-900">
                            Menu Split — Price High
                          </h3>
                          <p className="mt-0.5 text-[11px] text-gray-500">
                            Highest priced items on the menu
                          </p>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="min-w-full text-[12px]">
                            <thead className="bg-gray-50/70">
                              <tr className="border-b border-gray-100">
                                {["Item", "Category", "Price", "Sold"].map(
                                  (h) => (
                                    <th
                                      key={h}
                                      className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wide text-gray-400"
                                    >
                                      {h}
                                    </th>
                                  ),
                                )}
                              </tr>
                            </thead>
                            <tbody>
                              {highestPriced.map((item: any) => (
                                <tr
                                  key={item.id}
                                  className="border-b border-gray-100 hover:bg-gray-50/40"
                                >
                                  <td className="px-3 py-2 font-semibold text-gray-900">
                                    {item.name}
                                  </td>
                                  <td className="px-3 py-2 text-gray-500">
                                    {item.category?.name || "—"}
                                  </td>
                                  <td className="px-3 py-2 font-bold text-gray-900">
                                    ₹{item.price}
                                  </td>
                                  <td className="px-3 py-2 text-gray-600">
                                    {item.qty}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                        <div className="px-4 py-3">
                          <h3 className="text-[15px] font-bold text-gray-900">
                            Menu Split — Usage High
                          </h3>
                          <p className="mt-0.5 text-[11px] text-gray-500">
                            Highest volume/most-ordered items on the menu
                          </p>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="min-w-full text-[12px]">
                            <thead className="bg-gray-50/70">
                              <tr className="border-b border-gray-100">
                                {["Item", "Category", "Sold", "Price"].map(
                                  (h) => (
                                    <th
                                      key={h}
                                      className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wide text-gray-400"
                                    >
                                      {h}
                                    </th>
                                  ),
                                )}
                              </tr>
                            </thead>
                            <tbody>
                              {highestUsage.map((item: any) => (
                                <tr
                                  key={item.id}
                                  className="border-b border-gray-100 hover:bg-gray-50/40"
                                >
                                  <td className="px-3 py-2 font-semibold text-gray-900">
                                    {item.name}
                                  </td>
                                  <td className="px-3 py-2 text-gray-500">
                                    {item.category?.name || "—"}
                                  </td>
                                  <td className="px-3 py-2 font-bold text-gray-900">
                                    {item.qty}
                                  </td>
                                  <td className="px-3 py-2 text-gray-600">
                                    ₹{item.price}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* ===== PROFITABILITY RANKINGS ===== */}
                <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
                  <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                    <div className="px-4 py-3">
                      <h3 className="text-[15px] font-bold text-gray-900">
                        Most Profitable Dishes — All Menu
                      </h3>
                      <p className="mt-0.5 text-[11px] text-gray-500">
                        Ranked by profit margin %, across every dish
                      </p>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-[12px]">
                        <thead className="bg-gray-50/70">
                          <tr className="border-b border-gray-100">
                            {["Rank", "Item", "Category", "Margin %"].map(
                              (h) => (
                                <th
                                  key={h}
                                  className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wide text-gray-400"
                                >
                                  {h}
                                </th>
                              ),
                            )}
                          </tr>
                        </thead>
                        <tbody>
                          {mostProfitableOverall.map(
                            (item: any, idx: number) => (
                              <tr
                                key={item.id}
                                className="border-b border-gray-100 hover:bg-gray-50/40"
                              >
                                <td className="px-3 py-2 text-gray-400">
                                  #{idx + 1}
                                </td>
                                <td className="px-3 py-2 font-semibold text-gray-900">
                                  {item.name}
                                </td>
                                <td className="px-3 py-2 text-gray-500">
                                  {item.category?.name || "—"}
                                </td>
                                <td className="px-3 py-2">
                                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                                    {item.margin.toFixed(1)}%
                                  </span>
                                </td>
                              </tr>
                            ),
                          )}
                          {mostProfitableOverall.length === 0 && (
                            <tr>
                              <td
                                colSpan={4}
                                className="px-3 py-6 text-center text-[11px] text-gray-400"
                              >
                                No priced dishes yet
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                    <div className="px-4 py-3">
                      <h3 className="text-[15px] font-bold text-gray-900">
                        Category Food Cost &amp; Profitability
                      </h3>
                      <p className="mt-0.5 text-[11px] text-gray-500">
                        Avg. food cost% and margin% per menu category, ranked by
                        margin — with each category's most profitable dish
                      </p>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-[12px]">
                        <thead className="bg-gray-50/70">
                          <tr className="border-b border-gray-100">
                            {[
                              "Category",
                              "Items",
                              "Food Cost %",
                              "Margin %",
                              "Top Dish",
                            ].map((h) => (
                              <th
                                key={h}
                                className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wide text-gray-400"
                              >
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {categoryRanking.map((cat: any) => (
                            <tr
                              key={cat.name}
                              className="border-b border-gray-100 hover:bg-gray-50/40"
                            >
                              <td className="px-3 py-2 font-semibold text-gray-900">
                                {cat.name}
                              </td>
                              <td className="px-3 py-2 text-gray-500">
                                {cat.count}
                              </td>
                              <td className="px-3 py-2 text-gray-600">
                                {cat.avgFoodCostPercent.toFixed(1)}%
                              </td>
                              <td className="px-3 py-2">
                                <span
                                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${cat.avgMargin >= 60 ? "bg-emerald-100 text-emerald-700" : cat.avgMargin >= 40 ? "bg-orange-100 text-orange-700" : "bg-red-100 text-red-700"}`}
                                >
                                  {cat.avgMargin.toFixed(1)}%
                                </span>
                              </td>
                              <td className="px-3 py-2 text-gray-500">
                                {cat.topDish?.name || "—"}
                              </td>
                            </tr>
                          ))}
                          {categoryRanking.length === 0 && (
                            <tr>
                              <td
                                colSpan={5}
                                className="px-3 py-6 text-center text-[11px] text-gray-400"
                              >
                                No categories yet
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
                  {[
                    {
                      label: "Stars",
                      count: quadrants.Star.length,
                      desc: "High qty · High margin",
                      color:
                        "bg-emerald-50 border-emerald-100 text-emerald-700",
                    },
                    {
                      label: "Puzzles",
                      count: quadrants.Puzzle.length,
                      desc: "Low qty · High margin",
                      color: "bg-blue-50 border-blue-100 text-blue-700",
                    },
                    {
                      label: "Plowhorses",
                      count: quadrants.Plowhorse.length,
                      desc: "High qty · Low margin",
                      color: "bg-orange-50 border-orange-100 text-orange-700",
                    },
                    {
                      label: "Dogs",
                      count: quadrants.Dog.length,
                      desc: "Low qty · Low margin",
                      color: "bg-red-50 border-red-100 text-red-700",
                    },
                  ].map((k) => (
                    <div
                      key={k.label}
                      className={`rounded-xl border p-4 ${k.color.split(" ").slice(0, 2).join(" ")}`}
                    >
                      <p
                        className={`text-[22px] font-black ${k.color.split(" ")[2]}`}
                      >
                        {k.count}
                      </p>
                      <p className="mt-1 text-[13px] font-bold text-gray-900">
                        {k.label}
                      </p>
                      <p className="mt-0.5 text-[11px] text-gray-500">
                        {k.desc}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
                  {(Object.entries(quadrants) as [string, any[]][]).map(
                    ([label, items]) => {
                      const colors: Record<string, string> = {
                        Star: "border-emerald-200 bg-emerald-50/40",
                        Puzzle: "border-blue-200 bg-blue-50/40",
                        Plowhorse: "border-orange-200 bg-orange-50/40",
                        Dog: "border-red-200 bg-red-50/40",
                      };
                      const tips: Record<string, string> = {
                        Star: "Promote on menu, push to customers, protect margins",
                        Puzzle:
                          "Better photos, staff recommendations, combo deals",
                        Plowhorse:
                          "Increase price by 5–10% or reduce recipe cost",
                        Dog: "Remove, rename, or run as a special to test demand",
                      };
                      return (
                        <div
                          key={label}
                          className={`overflow-hidden rounded-xl border ${colors[label]} shadow-sm`}
                        >
                          <div className="flex items-center gap-3 px-4 py-3">
                            <div>
                              <h3 className="text-[15px] font-bold text-gray-900">
                                {label}s ({items.length})
                              </h3>
                              <p className="mt-0.5 text-[11px] text-gray-500">
                                {tips[label]}
                              </p>
                            </div>
                          </div>
                          <div className="overflow-x-auto">
                            <table className="min-w-full text-[12px]">
                              <thead className="bg-white/60">
                                <tr className="border-b border-white/60">
                                  {[
                                    "Item",
                                    "Category",
                                    "Sold",
                                    "Revenue",
                                    "Food Cost",
                                    "Margin",
                                  ].map((h) => (
                                    <th
                                      key={h}
                                      className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wide text-gray-400"
                                    >
                                      {h}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {items.slice(0, 6).map((item: any) => (
                                  <tr
                                    key={item.id}
                                    className="border-b border-white/40 hover:bg-white/50"
                                  >
                                    <td className="px-3 py-2 font-semibold text-gray-900">
                                      {item.name}
                                    </td>
                                    <td className="px-3 py-2 text-gray-500">
                                      {item.category?.name || "—"}
                                    </td>
                                    <td className="px-3 py-2 font-bold text-gray-900">
                                      {item.qty}
                                    </td>
                                    <td className="px-3 py-2 text-gray-700">
                                      ₹
                                      {Math.round(item.revenue).toLocaleString(
                                        "en-IN",
                                      )}
                                    </td>
                                    <td className="px-3 py-2 text-gray-600">
                                      ₹{item.recipeCost.toFixed(2)}
                                      <span className="ml-1 text-gray-400">
                                        ({item.foodCostPercent.toFixed(0)}%)
                                      </span>
                                    </td>
                                    <td className="px-3 py-2">
                                      <span
                                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${item.margin >= 60 ? "bg-emerald-100 text-emerald-700" : item.margin >= 40 ? "bg-orange-100 text-orange-700" : "bg-red-100 text-red-700"}`}
                                      >
                                        {item.margin.toFixed(1)}%
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                                {items.length === 0 && (
                                  <tr>
                                    <td
                                      colSpan={6}
                                      className="px-3 py-6 text-center text-[11px] text-gray-400"
                                    >
                                      No items in this quadrant
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      );
                    },
                  )}
                </div>
              </div>
            );
          })()}

        {/* ===== TABLE ANALYTICS ===== */}
        {activeTab === "Table Analytics" &&
          (() => {
            // Compute table turn metrics from running orders
            const tableMap: Record<
              string,
              {
                tableId: string;
                tableName: string;
                orders: number;
                totalMins: number;
                revenue: number;
              }
            > = {};
            runningOrders.forEach((o: any) => {
              if (!o.tableId) return;
              const key = String(o.tableId);
              if (!tableMap[key])
                tableMap[key] = {
                  tableId: key,
                  tableName: o.table?.name || `Table ${key}`,
                  orders: 0,
                  totalMins: 0,
                  revenue: 0,
                };
              tableMap[key].orders++;
              if (o.startedAt && o.completedAt) {
                const mins = dayjs(o.completedAt).diff(
                  dayjs(o.startedAt),
                  "minute",
                );
                if (mins > 0 && mins < 300) tableMap[key].totalMins += mins;
              }
              tableMap[key].revenue += Number(
                o.finalAmount || o.totalAmount || 0,
              );
            });

            const tableData = Object.values(tableMap)
              .map((t) => ({
                ...t,
                avgTurnMins:
                  t.orders > 0 ? Math.round(t.totalMins / t.orders) : 0,
                avgRevenue: t.orders > 0 ? Math.round(t.revenue / t.orders) : 0,
              }))
              .sort((a, b) => b.revenue - a.revenue);

            const quickServiceOrders = runningOrders.filter(
              (o: any) => !o.tableId,
            ).length;
            const avgTurnTime =
              tableData.length > 0
                ? Math.round(
                    tableData.reduce((s, t) => s + t.avgTurnMins, 0) /
                      tableData.length,
                  )
                : 0;
            const totalTableRevenue = tableData.reduce(
              (s, t) => s + t.revenue,
              0,
            );

            return (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
                  {[
                    {
                      label: "Tables Active",
                      value: tableData.length,
                      sub: "tables with orders",
                      cls: "border-blue-100 bg-blue-50/60",
                      val: "text-blue-700",
                    },
                    {
                      label: "Avg Turn Time",
                      value: `${avgTurnTime}m`,
                      sub: "per table per order",
                      cls: "border-orange-100 bg-orange-50/60",
                      val: "text-orange-700",
                    },
                    {
                      label: "Table Revenue",
                      value: `₹${totalTableRevenue.toLocaleString("en-IN")}`,
                      sub: "dine-in channel",
                      cls: "border-emerald-100 bg-emerald-50/60",
                      val: "text-emerald-700",
                    },
                    {
                      label: "Quick Orders",
                      value: quickServiceOrders,
                      sub: "no table assigned",
                      cls: "border-violet-100 bg-violet-50/60",
                      val: "text-violet-700",
                    },
                  ].map((k) => (
                    <div
                      key={k.label}
                      className={`rounded-xl border p-4 ${k.cls}`}
                    >
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
                <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
                  <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                    <div className="border-b border-gray-100 px-4 py-3">
                      <h3 className="text-[15px] font-bold text-gray-900">
                        Revenue by Table
                      </h3>
                    </div>
                    <div className="p-3">
                      {tableData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={220}>
                          <BarChart data={tableData.slice(0, 12)}>
                            <CartesianGrid
                              strokeDasharray="3 3"
                              vertical={false}
                              stroke="#f1f5f9"
                            />
                            <XAxis
                              dataKey="tableName"
                              tick={{ fontSize: 9, fill: "#6b7280" }}
                              axisLine={false}
                              tickLine={false}
                            />
                            <YAxis
                              tick={{ fontSize: 9, fill: "#6b7280" }}
                              axisLine={false}
                              tickLine={false}
                            />
                            <Tooltip
                              formatter={(v: any) =>
                                `₹${Number(v).toLocaleString("en-IN")}`
                              }
                            />
                            <Bar
                              dataKey="revenue"
                              name="Revenue"
                              fill="#ef4444"
                              radius={[3, 3, 0, 0]}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex h-[220px] items-center justify-center text-[12px] text-gray-400">
                          No table order data available
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                    <div className="border-b border-gray-100 px-4 py-3">
                      <h3 className="text-[15px] font-bold text-gray-900">
                        Avg Turn Time by Table
                      </h3>
                      <p className="mt-0.5 text-[11px] text-gray-500">
                        Minutes from order start to completion
                      </p>
                    </div>
                    <div className="p-3">
                      {tableData.filter((t) => t.avgTurnMins > 0).length > 0 ? (
                        <ResponsiveContainer width="100%" height={220}>
                          <BarChart
                            data={tableData
                              .filter((t) => t.avgTurnMins > 0)
                              .slice(0, 12)}
                          >
                            <CartesianGrid
                              strokeDasharray="3 3"
                              vertical={false}
                              stroke="#f1f5f9"
                            />
                            <XAxis
                              dataKey="tableName"
                              tick={{ fontSize: 9, fill: "#6b7280" }}
                              axisLine={false}
                              tickLine={false}
                            />
                            <YAxis
                              tick={{ fontSize: 9, fill: "#6b7280" }}
                              axisLine={false}
                              tickLine={false}
                            />
                            <Tooltip formatter={(v: any) => `${v} mins`} />
                            <Bar
                              dataKey="avgTurnMins"
                              name="Avg Turn (mins)"
                              fill="#3b82f6"
                              radius={[3, 3, 0, 0]}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex h-[220px] items-center justify-center text-[12px] text-gray-400">
                          No turn time data (need order start/end timestamps)
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                  <div className="border-b border-gray-100 px-4 py-3">
                    <h3 className="text-[15px] font-bold text-gray-900">
                      Table Performance Summary
                    </h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-[12px]">
                      <thead className="bg-gray-50">
                        <tr className="border-b border-gray-100">
                          {[
                            "Table",
                            "Orders",
                            "Avg Turn Time",
                            "Total Revenue",
                            "Avg Revenue/Order",
                            "Performance",
                          ].map((h) => (
                            <th
                              key={h}
                              className="px-4 py-2 text-left text-[10px] font-bold uppercase tracking-wide text-gray-400"
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {tableData.map((t: any) => {
                          const perf =
                            t.revenue >
                            totalTableRevenue / Math.max(tableData.length, 1)
                              ? "High"
                              : "Low";
                          return (
                            <tr
                              key={t.tableId}
                              className="border-b border-gray-50 hover:bg-gray-50/60"
                            >
                              <td className="px-4 py-2.5 font-semibold text-gray-900">
                                {t.tableName}
                              </td>
                              <td className="px-4 py-2.5 text-gray-700">
                                {t.orders}
                              </td>
                              <td className="px-4 py-2.5 text-gray-600">
                                {t.avgTurnMins > 0 ? `${t.avgTurnMins}m` : "—"}
                              </td>
                              <td className="px-4 py-2.5 font-bold text-gray-900">
                                ₹{t.revenue.toLocaleString("en-IN")}
                              </td>
                              <td className="px-4 py-2.5 text-gray-600">
                                ₹{t.avgRevenue.toLocaleString("en-IN")}
                              </td>
                              <td className="px-4 py-2.5">
                                <span
                                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${perf === "High" ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 text-gray-500"}`}
                                >
                                  {perf}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                        {tableData.length === 0 && (
                          <tr>
                            <td
                              colSpan={6}
                              className="py-12 text-center text-[12px] text-gray-400"
                            >
                              No table orders found for this period
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            );
          })()}

        {/* ===== WASTE REPORT ===== */}
        {activeTab === "Waste Report" &&
          (() => {
            const byType = inventoryAdjustments.reduce((acc: any, a: any) => {
              const t = a.adjustmentType || "UNKNOWN";
              if (!acc[t]) acc[t] = { type: t, count: 0, items: [] };
              acc[t].count++;
              acc[t].items.push(a);
              return acc;
            }, {});
            const totalAdjustments = inventoryAdjustments.length;
            const wastageItems = inventoryAdjustments.filter(
              (a: any) =>
                a.adjustmentType === "WASTAGE" ||
                a.adjustmentType === "EXPIRED",
            );
            const damageItems = inventoryAdjustments.filter(
              (a: any) => a.adjustmentType === "DAMAGE",
            );
            // SALE_DEDUCTION rows are routine stock decrements auto-logged on
            // every paid bill — not wastage — so they're excluded here even
            // though they still count toward "Total Adjustments" above.
            const wastageByIngredient = inventoryAdjustments
              .filter((a: any) => a.adjustmentType !== "SALE_DEDUCTION")
              .reduce(
                (acc: any, a: any) => {
                  const name = a.ingredient?.name || "Unknown";
                  if (!acc[name])
                    acc[name] = { name, qty: 0, cost: 0, adjustments: 0 };
                  const qty = Number(a.quantity || 0);
                  acc[name].qty += qty;
                  acc[name].cost +=
                    qty * Number(a.ingredient?.pricePerUnit || 0);
                  acc[name].adjustments++;
                  return acc;
                },
                {} as Record<string, any>,
              );
            const topWaste = Object.values(wastageByIngredient)
              .sort((a: any, b: any) => b.qty - a.qty)
              .slice(0, 10);
            const totalWastageCost = Object.values(
              wastageByIngredient,
            ).reduce<number>((s, i: any) => s + i.cost, 0);

            return (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
                  {[
                    {
                      label: "Total Adjustments",
                      value: totalAdjustments,
                      sub: "this period",
                      cls: "border-gray-200 bg-gray-50/60",
                      val: "text-gray-700",
                    },
                    {
                      label: "Wastage / Expired",
                      value: wastageItems.length,
                      sub: "items wasted",
                      cls: "border-orange-100 bg-orange-50/60",
                      val: "text-orange-700",
                    },
                    {
                      label: "Damage",
                      value: damageItems.length,
                      sub: "items damaged",
                      cls: "border-red-100 bg-red-50/60",
                      val: "text-red-700",
                    },
                    {
                      label: "Unique Ingredients",
                      value: Object.keys(wastageByIngredient).length,
                      sub: "affected",
                      cls: "border-violet-100 bg-violet-50/60",
                      val: "text-violet-700",
                    },
                    {
                      label: "Total Wastage Cost",
                      value: `₹${Math.round(totalWastageCost).toLocaleString("en-IN")}`,
                      sub: "qty × unit price",
                      cls: "border-amber-100 bg-amber-50/60",
                      val: "text-amber-700",
                    },
                  ].map((k) => (
                    <div
                      key={k.label}
                      className={`rounded-xl border p-4 ${k.cls}`}
                    >
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
                <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
                  <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                    <div className="border-b border-gray-100 px-4 py-3">
                      <h3 className="text-[15px] font-bold text-gray-900">
                        Top Wasted Ingredients
                      </h3>
                      <p className="mt-0.5 text-[11px] text-gray-500">
                        By total quantity adjusted
                      </p>
                    </div>
                    {topWaste.length > 0 ? (
                      <div className="p-3">
                        <ResponsiveContainer width="100%" height={230}>
                          <BarChart data={topWaste} layout="vertical">
                            <CartesianGrid
                              strokeDasharray="3 3"
                              horizontal={false}
                              stroke="#f1f5f9"
                            />
                            <XAxis
                              type="number"
                              tick={{ fontSize: 10, fill: "#6b7280" }}
                              axisLine={false}
                              tickLine={false}
                            />
                            <YAxis
                              dataKey="name"
                              type="category"
                              tick={{ fontSize: 10, fill: "#6b7280" }}
                              axisLine={false}
                              tickLine={false}
                              width={100}
                            />
                            <Tooltip />
                            <Bar
                              dataKey="qty"
                              name="Qty Wasted"
                              fill="#f59e0b"
                              radius={[0, 4, 4, 0]}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <div className="flex h-[230px] items-center justify-center text-[12px] text-gray-400">
                        No inventory adjustments for this period
                      </div>
                    )}
                  </div>
                  <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                    <div className="border-b border-gray-100 px-4 py-3">
                      <h3 className="text-[15px] font-bold text-gray-900">
                        By Adjustment Type
                      </h3>
                    </div>
                    <div className="divide-y divide-gray-50">
                      {Object.values(byType).map((t: any) => (
                        <div
                          key={t.type}
                          className="flex items-center justify-between px-4 py-3"
                        >
                          <div>
                            <span
                              className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
                                t.type === "WASTAGE"
                                  ? "bg-orange-100 text-orange-700"
                                  : t.type === "DAMAGE"
                                    ? "bg-red-100 text-red-700"
                                    : t.type === "EXPIRED"
                                      ? "bg-yellow-100 text-yellow-700"
                                      : "bg-gray-100 text-gray-700"
                              }`}
                            >
                              {t.type}
                            </span>
                          </div>
                          <p className="text-[14px] font-bold text-gray-900">
                            {t.count} entries
                          </p>
                        </div>
                      ))}
                      {Object.keys(byType).length === 0 && (
                        <div className="py-10 text-center text-[12px] text-gray-400">
                          No inventory adjustments recorded
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                  <div className="border-b border-gray-100 px-4 py-3">
                    <h3 className="text-[15px] font-bold text-gray-900">
                      Adjustment Log
                    </h3>
                    <p className="mt-0.5 text-[11px] text-gray-500">
                      Every inventory write-down with reason and staff
                      responsible
                    </p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-[12px]">
                      <thead className="bg-gray-50">
                        <tr className="border-b border-gray-100">
                          {[
                            "Date",
                            "Ingredient",
                            "Type",
                            "Quantity",
                            "Cost",
                            "Reason",
                            "Updated By",
                          ].map((h) => (
                            <th
                              key={h}
                              className="px-4 py-2 text-left text-[10px] font-bold uppercase tracking-wide text-gray-400"
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {inventoryAdjustments.slice(0, 20).map((a: any) => (
                          <tr
                            key={a.id}
                            className="border-b border-gray-50 hover:bg-gray-50/60"
                          >
                            <td className="px-4 py-2.5 text-gray-500">
                              {dayjs(a.createdAt).format("DD MMM YYYY")}
                            </td>
                            <td className="px-4 py-2.5 font-semibold text-gray-900">
                              {a.ingredient?.name || "—"}
                            </td>
                            <td className="px-4 py-2.5">
                              <span
                                className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                                  a.adjustmentType === "WASTAGE"
                                    ? "bg-orange-50 text-orange-600"
                                    : a.adjustmentType === "DAMAGE"
                                      ? "bg-red-50 text-red-700"
                                      : a.adjustmentType === "EXPIRED"
                                        ? "bg-yellow-50 text-yellow-600"
                                        : "bg-gray-100 text-gray-600"
                                }`}
                              >
                                {a.adjustmentType}
                              </span>
                            </td>
                            <td className="px-4 py-2.5 font-bold text-gray-900">
                              {Number(a.quantity || 0).toFixed(2)}{" "}
                              {a.ingredient?.unit || ""}
                            </td>
                            <td className="px-4 py-2.5 text-gray-700">
                              ₹
                              {(
                                Number(a.quantity || 0) *
                                Number(a.ingredient?.pricePerUnit || 0)
                              ).toFixed(2)}
                            </td>
                            <td className="px-4 py-2.5 text-gray-600 max-w-[180px] truncate">
                              {a.reason || "—"}
                            </td>
                            <td className="px-4 py-2.5 text-gray-500">
                              {a.updatedBy?.name || "—"}
                            </td>
                          </tr>
                        ))}
                        {inventoryAdjustments.length === 0 && (
                          <tr>
                            <td
                              colSpan={7}
                              className="py-12 text-center text-[12px] text-gray-400"
                            >
                              No inventory adjustments logged. Use the
                              Operations page to record wastage and damage.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            );
          })()}

        {/* ===== STOCK LIFECYCLE ===== */}
        {activeTab === "Stock Lifecycle" &&
          (() => {
            const months = [
              "Jan",
              "Feb",
              "Mar",
              "Apr",
              "May",
              "Jun",
              "Jul",
              "Aug",
              "Sep",
              "Oct",
              "Nov",
              "Dec",
            ];
            const currentY = new Date().getFullYear();
            const yearOptions = [currentY - 2, currentY - 1, currentY];
            const toggleIngredient = (id: number) => {
              setExpandedIngredients((prev) => {
                const next = new Set(prev);
                if (next.has(id)) next.delete(id);
                else next.add(id);
                return next;
              });
            };
            // Quantities arrive from the API in the canonical unit (Kg/Litre/Piece);
            // this auto-scales small amounts to grams/ml so they're readable.
            const fmt = (n: number, unit: string) => formatQty(n, unit);
            const adjBadge: Record<string, string> = {
              WASTAGE: "bg-amber-100 text-amber-800",
              DAMAGE: "bg-red-100 text-red-700",
              EXPIRED: "bg-purple-100 text-purple-800",
              MANUAL: "bg-gray-100 text-gray-600",
            };

            // Summary KPIs across all ingredients
            const totalWastageQty = lifecycleData.reduce(
              (s: number, i: any) => s + i.wastageQty,
              0,
            );
            const totalWastageCost = lifecycleData.reduce(
              (s: number, i: any) => s + i.wastageCost,
              0,
            );
            const totalAvailable = lifecycleData.reduce(
              (s: number, i: any) => s + i.available,
              0,
            );
            const overallWastePct =
              totalAvailable > 0
                ? ((totalWastageQty / totalAvailable) * 100).toFixed(1)
                : "0";
            const worstIng = [...lifecycleData].sort(
              (a: any, b: any) => b.wastagePercentage - a.wastagePercentage,
            )[0];

            return (
              <div className="space-y-3">
                {/* Month / Year selector */}
                <div className="flex flex-wrap items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                  <div>
                    <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-gray-500">
                      Period
                    </p>
                    <div className="flex gap-2">
                      <select
                        value={lifecycleMonth}
                        onChange={(e) =>
                          setLifecycleMonth(Number(e.target.value))
                        }
                        className="rounded-lg border border-gray-200 px-2 py-1.5 text-[12px] focus:outline-none focus:ring-1 focus:ring-[#b10000]"
                      >
                        {months.map((m, i) => (
                          <option key={i} value={i + 1}>
                            {m}
                          </option>
                        ))}
                      </select>
                      <select
                        value={lifecycleYear}
                        onChange={(e) =>
                          setLifecycleYear(Number(e.target.value))
                        }
                        className="rounded-lg border border-gray-200 px-2 py-1.5 text-[12px] focus:outline-none focus:ring-1 focus:ring-[#b10000]"
                      >
                        {yearOptions.map((y) => (
                          <option key={y} value={y}>
                            {y}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="ml-auto text-right">
                    <p className="text-[12px] font-semibold text-gray-700">
                      {lifecycleData.length} ingredient
                      {lifecycleData.length !== 1 ? "s" : ""} tracked
                    </p>
                    <p className="text-[11px] text-gray-400">
                      {months[lifecycleMonth - 1]} {lifecycleYear}
                    </p>
                  </div>
                </div>

                {lifecycleLoading ? (
                  <div className="rounded-xl border border-gray-200 bg-white py-12 text-center text-[12px] text-gray-400">
                    Loading lifecycle data…
                  </div>
                ) : lifecycleData.length === 0 ? (
                  <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
                    <p className="text-[13px] font-semibold text-gray-600">
                      No stock data for this period
                    </p>
                    <p className="mt-1 text-[11px] text-gray-400">
                      Upload monthly restock data in Operations → Restock, or
                      log inventory adjustments in the POS app.
                    </p>
                  </div>
                ) : (
                  <>
                    {/* KPI summary */}
                    <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
                      {[
                        {
                          label: "Overall Wastage %",
                          value: `${overallWastePct}%`,
                          sub: "of total stock received",
                          color: "red",
                        },
                        {
                          label: "Total Wastage Cost",
                          value: `₹${totalWastageCost.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`,
                          sub: "wastage × unit price",
                          color: "amber",
                        },
                        {
                          label: "Highest Waste Ingredient",
                          value: worstIng?.name || "—",
                          sub: worstIng
                            ? `${worstIng.wastagePercentage}% wastage`
                            : "",
                          color: "purple",
                        },
                        {
                          label: "Ingredients Tracked",
                          value: lifecycleData.length,
                          sub: `${months[lifecycleMonth - 1]} ${lifecycleYear}`,
                          color: "blue",
                        },
                      ].map((k: any) => (
                        <div
                          key={k.label}
                          className={`rounded-xl border p-4 ${k.color === "red" ? "border-red-100 bg-red-50/60" : k.color === "amber" ? "border-amber-100 bg-amber-50/60" : k.color === "purple" ? "border-purple-100 bg-purple-50/60" : "border-blue-100 bg-blue-50/60"}`}
                        >
                          <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500">
                            {k.label}
                          </p>
                          <p
                            className={`mt-2 text-[20px] font-bold truncate ${k.color === "red" ? "text-red-700" : k.color === "amber" ? "text-amber-700" : k.color === "purple" ? "text-purple-700" : "text-blue-700"}`}
                          >
                            {k.value}
                          </p>
                          <p className="mt-1 text-[11px] text-gray-500">
                            {k.sub}
                          </p>
                        </div>
                      ))}
                    </div>

                    {/* Formula legend */}
                    <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-[11px] text-gray-500">
                      <span className="font-semibold text-gray-700">
                        Wastage Formula:{" "}
                      </span>
                      Wastage = Opening Stock + Purchases − Closing Stock −
                      Expected Consumption per SOP (recipe qty × dishes sold)
                      &nbsp;&nbsp;|&nbsp;&nbsp;
                      <span className="font-semibold text-gray-700">
                        Wastage %{" "}
                      </span>
                      = (Wastage ÷ Total Received) × 100
                      &nbsp;&nbsp;|&nbsp;&nbsp;
                      <span className="font-semibold text-gray-700">
                        Wastage Cost{" "}
                      </span>
                      = Wastage Qty × Unit Price
                    </div>

                    {/* Wastage report view — weight / product / price */}
                    <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white p-2">
                      <span className="pl-2 text-[11px] font-bold uppercase tracking-wide text-gray-400">
                        View by
                      </span>
                      {(
                        [
                          { key: "weight", label: "Weightage" },
                          { key: "product", label: "Product" },
                          { key: "price", label: "Price" },
                        ] as const
                      ).map((v) => (
                        <button
                          key={v.key}
                          onClick={() => setWastageSortBy(v.key)}
                          className={`rounded-lg px-3 py-1.5 text-[12px] font-semibold transition ${wastageSortBy === v.key ? "bg-[#b10000] text-white" : "text-gray-500 hover:bg-gray-50"}`}
                        >
                          {v.label}
                        </button>
                      ))}
                    </div>

                    {/* Per-ingredient cards */}
                    {[...lifecycleData]
                      .sort((a: any, b: any) => {
                        if (wastageSortBy === "price")
                          return b.wastageCost - a.wastageCost;
                        if (wastageSortBy === "product")
                          return a.name.localeCompare(b.name);
                        return b.wastageQty - a.wastageQty;
                      })
                      .map((ing: any) => {
                        const expanded = expandedIngredients.has(
                          ing.ingredientId,
                        );
                        const avail = ing.available || 1;
                        const dishPct = Math.min(
                          100,
                          (ing.expectedConsumption / avail) * 100,
                        );
                        const wastePct = Math.max(
                          0,
                          Math.min(100, (ing.wastageQty / avail) * 100),
                        );
                        const closePct = Math.min(
                          100,
                          (ing.closingQty / avail) * 100,
                        );
                        return (
                          <div
                            key={ing.ingredientId}
                            className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
                          >
                            {/* Header */}
                            <button
                              className="flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-gray-50"
                              onClick={() => toggleIngredient(ing.ingredientId)}
                            >
                              <div className="flex-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="text-[13px] font-bold text-gray-800">
                                    {ing.name}
                                  </span>
                                  <span className="text-[10px] text-gray-400">
                                    {ing.unit}
                                  </span>
                                  {!ing.hasRestockData && (
                                    <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[9px] font-semibold text-amber-700">
                                      No restock data
                                    </span>
                                  )}
                                  {ing.wastagePercentage > 0 && (
                                    <span
                                      className={`rounded px-1.5 py-0.5 text-[9px] font-bold ${ing.wastagePercentage > 15 ? "bg-red-100 text-red-700" : ing.wastagePercentage > 8 ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"}`}
                                    >
                                      {ing.wastagePercentage}% waste
                                    </span>
                                  )}
                                  {ing.wastagePercentage < 0 && (
                                    <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[9px] font-bold text-blue-700">
                                      {Math.abs(ing.wastagePercentage)}%
                                      under-used
                                    </span>
                                  )}
                                </div>
                                <div className="mt-1 flex flex-wrap gap-3 text-[11px]">
                                  <span className="text-gray-500">
                                    Received:{" "}
                                    <span className="font-semibold text-gray-700">
                                      {fmt(ing.available, ing.unit)}
                                    </span>
                                  </span>
                                  <span className="text-emerald-600">
                                    Dishes:{" "}
                                    <span className="font-semibold">
                                      {fmt(ing.expectedConsumption, ing.unit)}
                                    </span>
                                  </span>
                                  {ing.wastageQty < 0 ? (
                                    <span className="text-blue-600">
                                      Under-used:{" "}
                                      <span className="font-semibold">
                                        {fmt(
                                          Math.abs(ing.wastageQty),
                                          ing.unit,
                                        )}
                                      </span>
                                    </span>
                                  ) : (
                                    <span className="text-red-600">
                                      Wastage:{" "}
                                      <span className="font-semibold">
                                        {fmt(ing.wastageQty, ing.unit)}
                                      </span>
                                    </span>
                                  )}
                                  {ing.pricePerUnit > 0 &&
                                    ing.wastageQty > 0 && (
                                      <span className="text-gray-500">
                                        Cost:{" "}
                                        <span className="font-semibold text-red-700">
                                          ₹
                                          {ing.wastageCost.toLocaleString(
                                            "en-IN",
                                            { maximumFractionDigits: 0 },
                                          )}
                                        </span>
                                      </span>
                                    )}
                                </div>
                                {/* Progress bar: dishes (green) | wastage (red) | closing (blue) */}
                                {ing.available > 0 && (
                                  <div className="mt-2 flex h-2 w-full overflow-hidden rounded-full bg-gray-100">
                                    <div
                                      className="bg-emerald-400"
                                      style={{ width: `${dishPct}%` }}
                                      title={`Dishes: ${fmt(ing.expectedConsumption, ing.unit)}`}
                                    />
                                    <div
                                      className="bg-red-400"
                                      style={{ width: `${wastePct}%` }}
                                      title={`Wastage: ${fmt(ing.wastageQty, ing.unit)}`}
                                    />
                                    <div
                                      className="bg-blue-300"
                                      style={{ width: `${closePct}%` }}
                                      title={`Closing: ${fmt(ing.closingQty, ing.unit)}`}
                                    />
                                  </div>
                                )}
                              </div>
                              <span className="mt-1 shrink-0 text-[14px] text-gray-400">
                                {expanded ? "▲" : "▼"}
                              </span>
                            </button>

                            {/* Expanded detail */}
                            {expanded && (
                              <div className="border-t border-gray-100 px-4 pb-4 pt-3 space-y-3 text-[12px]">
                                {/* Step 1: Stock in */}
                                <div className="rounded-lg bg-gray-50 p-3 space-y-1">
                                  <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-2">
                                    Total Stock Received
                                  </p>
                                  <div className="flex justify-between text-gray-600">
                                    <span>Opening stock</span>
                                    <span className="font-semibold">
                                      {fmt(ing.openingQty, ing.unit)}
                                    </span>
                                  </div>
                                  <div className="flex justify-between text-gray-600">
                                    <span>+ Purchased this month</span>
                                    <span className="font-semibold">
                                      {fmt(ing.purchases, ing.unit)}
                                    </span>
                                  </div>
                                  <div className="flex justify-between border-t border-gray-200 pt-1 font-bold text-gray-800">
                                    <span>= Total Received</span>
                                    <span>{fmt(ing.available, ing.unit)}</span>
                                  </div>
                                </div>

                                {/* Step 2: Expected Consumption (dishes) */}
                                <div className="rounded-lg bg-emerald-50 p-3">
                                  <div className="flex justify-between font-semibold text-emerald-800 mb-2">
                                    <span>
                                      Expected Consumption{" "}
                                      <span className="text-[10px] font-normal text-emerald-600">
                                        (Σ Qty Sold × Recipe Qty)
                                      </span>
                                    </span>
                                    <span>
                                      {fmt(ing.expectedConsumption, ing.unit)}
                                    </span>
                                  </div>
                                  {ing.usedInDishesByDish.length > 0 ? (
                                    <div className="space-y-1 pl-3">
                                      {ing.usedInDishesByDish.map(
                                        (d: any, idx: number) => (
                                          <div
                                            key={idx}
                                            className="flex justify-between text-emerald-700"
                                          >
                                            <span className="flex items-center gap-1.5">
                                              <span className="text-emerald-400">
                                                └
                                              </span>
                                              {d.dishName}
                                              <span className="text-[10px] text-emerald-500">
                                                ({d.orders} sold)
                                              </span>
                                            </span>
                                            <span>{fmt(d.qty, ing.unit)}</span>
                                          </div>
                                        ),
                                      )}
                                    </div>
                                  ) : (
                                    <p className="pl-3 text-[11px] text-emerald-600/70">
                                      {ing.expectedConsumption > 0
                                        ? "Menu-ingredient mapping needed for dish breakdown."
                                        : "No dish usage this period."}
                                    </p>
                                  )}
                                </div>

                                {/* Step 3: Closing stock */}
                                <div className="rounded-lg bg-blue-50 p-3 flex justify-between font-semibold text-blue-800">
                                  <span>
                                    Closing Stock{" "}
                                    <span className="text-[10px] font-normal text-blue-600">
                                      (end of period)
                                    </span>
                                  </span>
                                  <span>{fmt(ing.closingQty, ing.unit)}</span>
                                </div>

                                {/* Step 4: Wastage result */}
                                <div className="rounded-lg bg-red-50 p-3 space-y-2">
                                  <div className="flex justify-between font-bold text-red-800">
                                    <span>
                                      Wastage
                                      <span className="ml-1 text-[10px] font-normal text-red-600">
                                        = Total Received − Closing − Expected
                                        Consumption
                                      </span>
                                    </span>
                                    <span>{fmt(ing.wastageQty, ing.unit)}</span>
                                  </div>
                                  <div className="flex flex-wrap gap-4 text-[11px] text-red-700 border-t border-red-100 pt-2">
                                    <span>
                                      Wastage % ={" "}
                                      <strong>{ing.wastagePercentage}%</strong>{" "}
                                      <span className="text-[10px] text-red-500">
                                        (÷ Total Received × 100)
                                      </span>
                                    </span>
                                    {ing.pricePerUnit > 0 && (
                                      <span>
                                        Wastage Cost ={" "}
                                        <strong>
                                          ₹
                                          {ing.wastageCost.toLocaleString(
                                            "en-IN",
                                            { maximumFractionDigits: 0 },
                                          )}
                                        </strong>{" "}
                                        <span className="text-[10px] text-red-500">
                                          ({fmt(ing.wastageQty, ing.unit)} × ₹
                                          {ing.pricePerUnit}/unit)
                                        </span>
                                      </span>
                                    )}
                                  </div>

                                  {/* Wastage breakdown: logged entries + unaccounted */}
                                  {ing.wastageQty > 0.01 && (
                                    <div className="border-t border-red-100 pt-2 space-y-1">
                                      <p className="text-[10px] font-semibold text-red-600 uppercase tracking-wide">
                                        Wastage Breakdown
                                      </p>
                                      {ing.adjustmentEntries.length > 0 && (
                                        <div className="space-y-1">
                                          {ing.adjustmentEntries.map(
                                            (a: any, idx: number) => (
                                              <div
                                                key={idx}
                                                className="flex items-center justify-between gap-2 text-red-700 pl-2"
                                              >
                                                <span className="flex items-center gap-1.5 flex-wrap">
                                                  <span className="text-red-400">
                                                    └
                                                  </span>
                                                  <span
                                                    className={`rounded px-1 py-0.5 text-[9px] font-bold ${adjBadge[a.type] || "bg-gray-100 text-gray-600"}`}
                                                  >
                                                    {a.type}
                                                  </span>
                                                  {a.reason && (
                                                    <span>{a.reason}</span>
                                                  )}
                                                  {a.by && (
                                                    <span className="text-[10px] text-red-400">
                                                      by {a.by}
                                                    </span>
                                                  )}
                                                  <span className="text-[10px] text-red-400">
                                                    {new Date(
                                                      a.date,
                                                    ).toLocaleDateString(
                                                      "en-IN",
                                                    )}
                                                  </span>
                                                </span>
                                                <span className="shrink-0 font-semibold">
                                                  {fmt(a.qty, ing.unit)}
                                                </span>
                                              </div>
                                            ),
                                          )}
                                        </div>
                                      )}
                                      {ing.unaccountedWastage > 0.01 && (
                                        <div className="flex justify-between text-red-700 pl-2 font-semibold">
                                          <span className="flex items-center gap-1.5">
                                            <span className="text-red-400">
                                              └
                                            </span>
                                            <span className="rounded bg-red-100 px-1 py-0.5 text-[9px] font-bold text-red-700">
                                              UNACCOUNTED
                                            </span>
                                            <span className="text-[10px] font-normal text-red-500">
                                              no log entry
                                            </span>
                                          </span>
                                          <span>
                                            {fmt(
                                              ing.unaccountedWastage,
                                              ing.unit,
                                            )}
                                          </span>
                                        </div>
                                      )}
                                      {ing.loggedWastage > 0 && (
                                        <div className="flex justify-between text-[11px] text-red-600 pl-2 border-t border-red-100 pt-1">
                                          <span>Logged entries total</span>
                                          <span className="font-semibold">
                                            {fmt(ing.loggedWastage, ing.unit)}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>

                                {/* Legend */}
                                <div className="flex flex-wrap gap-3 pt-1">
                                  <span className="flex items-center gap-1 text-[10px] text-gray-500">
                                    <span className="inline-block h-2 w-3 rounded-sm bg-emerald-400" />{" "}
                                    Expected (dishes)
                                  </span>
                                  <span className="flex items-center gap-1 text-[10px] text-gray-500">
                                    <span className="inline-block h-2 w-3 rounded-sm bg-red-400" />{" "}
                                    Wastage
                                  </span>
                                  <span className="flex items-center gap-1 text-[10px] text-gray-500">
                                    <span className="inline-block h-2 w-3 rounded-sm bg-blue-300" />{" "}
                                    Closing stock
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </>
                )}
              </div>
            );
          })()}

        {/* ===== HOURLY HEATMAP ===== */}
        {activeTab === "Hourly Heatmap" && (
          <div className="space-y-3">
            {/* ===== DEMAND BY ITEM / CATEGORY FILTER ===== */}
            <div className="flex flex-wrap items-center gap-2 rounded-xl border border-gray-200 bg-white p-3">
              <span className="text-[11px] font-bold uppercase tracking-wide text-gray-400">
                Demand for
              </span>
              <select
                value={heatmapItemId}
                onChange={(e) => {
                  setHeatmapItemId(e.target.value);
                  setHeatmapCategoryId("");
                }}
                className="h-9 rounded-xl border border-gray-200 bg-white px-3 text-[12px] font-medium text-gray-700 outline-none"
              >
                <option value="">Whole Menu (all orders)</option>
                {menuItems.map((mi: any) => (
                  <option key={mi.id} value={String(mi.id)}>
                    {mi.name}
                  </option>
                ))}
              </select>
              <span className="text-[11px] text-gray-400">or category</span>
              <select
                value={heatmapCategoryId}
                onChange={(e) => {
                  setHeatmapCategoryId(e.target.value);
                  setHeatmapItemId("");
                }}
                className="h-9 rounded-xl border border-gray-200 bg-white px-3 text-[12px] font-medium text-gray-700 outline-none"
              >
                <option value="">All Categories</option>
                {[
                  ...new Map(
                    menuItems
                      .filter((mi: any) => mi.category)
                      .map((mi: any) => [mi.category.id, mi.category]),
                  ).values(),
                ].map((cat: any) => (
                  <option key={cat.id} value={String(cat.id)}>
                    {cat.name}
                  </option>
                ))}
              </select>
              {(heatmapItemId || heatmapCategoryId) && (
                <button
                  onClick={() => {
                    setHeatmapItemId("");
                    setHeatmapCategoryId("");
                  }}
                  className="text-[11px] font-semibold text-[#b10000] underline decoration-dotted"
                >
                  Clear filter
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
              {[
                {
                  label: "Peak Hour",
                  value: heatmapData?.peakHour?.label || "—",
                  sub: heatmapData?.itemFiltered
                    ? `${heatmapData?.peakHour?.orders || 0} sold in that hour`
                    : `₹${(heatmapData?.peakHour?.revenue || 0).toLocaleString("en-IN")} revenue`,
                  color: "red",
                },
                {
                  label: "Best Day",
                  value: heatmapData?.peakDay?.name || "—",
                  sub: heatmapData?.itemFiltered
                    ? `${heatmapData?.peakDay?.orders || 0} sold that day`
                    : `₹${(heatmapData?.peakDay?.revenue || 0).toLocaleString("en-IN")} revenue`,
                  color: "emerald",
                },
                {
                  label: heatmapData?.itemFiltered
                    ? "Peak Hour Qty"
                    : "Peak Hour Orders",
                  value: heatmapData?.peakHour?.orders || 0,
                  sub: heatmapData?.itemFiltered
                    ? "units sold in that hour"
                    : "orders in that hour",
                  color: "blue",
                },
                {
                  label: heatmapData?.itemFiltered
                    ? "Best Day Qty"
                    : "Best Day Orders",
                  value: heatmapData?.peakDay?.orders || 0,
                  sub: heatmapData?.itemFiltered
                    ? "units sold that day"
                    : "orders on that day",
                  color: "orange",
                },
              ].map((k) => (
                <div
                  key={k.label}
                  className={`rounded-xl border p-4 ${k.color === "red" ? "border-red-100 bg-red-50/60" : k.color === "emerald" ? "border-emerald-100 bg-emerald-50/60" : k.color === "blue" ? "border-blue-100 bg-blue-50/60" : "border-orange-100 bg-orange-50/60"}`}
                >
                  <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500">
                    {k.label}
                  </p>
                  <p
                    className={`mt-2 text-[20px] font-bold ${k.color === "red" ? "text-red-700" : k.color === "emerald" ? "text-emerald-700" : k.color === "blue" ? "text-blue-700" : "text-orange-700"}`}
                  >
                    {k.value}
                  </p>
                  <p className="mt-1 text-[11px] text-gray-500">{k.sub}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
              <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="border-b border-gray-100 px-4 py-3">
                  <h3 className="text-[15px] font-bold text-gray-900">
                    Revenue by Hour of Day
                  </h3>
                  <p className="mt-0.5 text-[11px] text-gray-500">
                    Which hour generates most revenue across all days
                  </p>
                </div>
                <div className="p-3">
                  {heatmapData?.hourlyData?.filter((h: any) => h.revenue > 0)
                    .length > 0 ? (
                    <ResponsiveContainer width="100%" height={230}>
                      <BarChart
                        data={(heatmapData.hourlyData || []).filter(
                          (h: any) => h.hour >= 6 && h.hour <= 23,
                        )}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          stroke="#f1f5f9"
                        />
                        <XAxis
                          dataKey="label"
                          tick={{ fontSize: 9, fill: "#6b7280" }}
                          axisLine={false}
                          tickLine={false}
                          interval={2}
                        />
                        <YAxis
                          tick={{ fontSize: 9, fill: "#6b7280" }}
                          axisLine={false}
                          tickLine={false}
                          tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                        />
                        <Tooltip
                          formatter={(v: any) =>
                            `₹${Number(v).toLocaleString("en-IN")}`
                          }
                        />
                        <Bar
                          dataKey="revenue"
                          name="Revenue"
                          fill="#ef4444"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex h-[230px] items-center justify-center text-[12px] text-gray-400">
                      No hourly data
                    </div>
                  )}
                </div>
              </div>

              <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="border-b border-gray-100 px-4 py-3">
                  <h3 className="text-[15px] font-bold text-gray-900">
                    Revenue by Day of Week
                  </h3>
                  <p className="mt-0.5 text-[11px] text-gray-500">
                    Which day is strongest across the period
                  </p>
                </div>
                <div className="p-3">
                  {heatmapData?.dailyData?.filter((d: any) => d.revenue > 0)
                    .length > 0 ? (
                    <ResponsiveContainer width="100%" height={230}>
                      <BarChart data={heatmapData.dailyData}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          stroke="#f1f5f9"
                        />
                        <XAxis
                          dataKey="short"
                          tick={{ fontSize: 10, fill: "#6b7280" }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          tick={{ fontSize: 9, fill: "#6b7280" }}
                          axisLine={false}
                          tickLine={false}
                          tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                        />
                        <Tooltip
                          formatter={(v: any) =>
                            `₹${Number(v).toLocaleString("en-IN")}`
                          }
                        />
                        <Bar
                          dataKey="revenue"
                          name="Revenue"
                          fill="#3b82f6"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex h-[230px] items-center justify-center text-[12px] text-gray-400">
                      No daily data
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Heatmap Grid */}
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-100 px-4 py-3">
                <h3 className="text-[15px] font-bold text-gray-900">
                  Revenue Heatmap — Day × Hour
                </h3>
                <p className="mt-0.5 text-[11px] text-gray-500">
                  Darker red = higher revenue in that time slot
                </p>
              </div>
              <div className="overflow-x-auto p-4">
                {heatmapData?.heatmapGrid?.length > 0 ? (
                  (() => {
                    const hours = [
                      6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
                      21, 22, 23,
                    ];
                    const days = heatmapData.dailyData || [];
                    const maxRev = Math.max(
                      ...heatmapData.heatmapGrid.map((c: any) => c.revenue),
                      1,
                    );
                    const cell = (day: number, h: number) => {
                      const c = heatmapData.heatmapGrid.find(
                        (g: any) => g.day === day && g.h === h,
                      );
                      const intensity = c
                        ? Math.round((c.revenue / maxRev) * 100)
                        : 0;
                      return (
                        <td
                          key={h}
                          title={`₹${(c?.revenue || 0).toLocaleString("en-IN")}`}
                          className="border border-white p-0"
                          style={{
                            background:
                              intensity === 0
                                ? "#f9fafb"
                                : `rgba(239,68,68,${0.1 + intensity * 0.009})`,
                            width: 32,
                            height: 24,
                          }}
                        />
                      );
                    };
                    return (
                      <table className="text-[9px]">
                        <thead>
                          <tr>
                            <th className="w-14 pr-2 text-right text-gray-400" />
                            {hours.map((h) => (
                              <th
                                key={h}
                                className="w-8 text-center text-gray-400 font-normal"
                              >
                                {h === 12
                                  ? "12P"
                                  : h > 12
                                    ? `${h - 12}P`
                                    : `${h}A`}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {days.map((d: any) => (
                            <tr key={d.day}>
                              <td className="pr-2 text-right text-[10px] font-semibold text-gray-600">
                                {d.short}
                              </td>
                              {hours.map((h) => cell(d.day, h))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    );
                  })()
                ) : (
                  <div className="py-8 text-center text-[12px] text-gray-400">
                    No heatmap data for this period
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ===== DAY ANALYSIS ===== */}
        {activeTab === "Day Analysis" && (
          <div className="space-y-3">
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-100 px-4 py-3">
                <h3 className="text-[15px] font-bold text-gray-900">
                  Day of Week — Full Breakdown
                </h3>
                <p className="mt-0.5 text-[11px] text-gray-500">
                  Revenue, order count and avg bill for each day of the week
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-[12px]">
                  <thead className="bg-gray-50">
                    <tr className="border-b border-gray-100">
                      {[
                        "Day",
                        "Revenue",
                        "Orders",
                        "Avg Bill",
                        "Revenue Share",
                        "Performance",
                      ].map((h) => (
                        <th
                          key={h}
                          className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wide text-gray-400"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(heatmapData?.dailyData || []).map((d: any) => {
                      const totalRev =
                        (heatmapData?.dailyData || []).reduce(
                          (s: number, x: any) => s + x.revenue,
                          0,
                        ) || 1;
                      const pct = Math.round((d.revenue / totalRev) * 100);
                      const isTop =
                        d.revenue ===
                        Math.max(
                          ...(heatmapData?.dailyData || []).map(
                            (x: any) => x.revenue,
                          ),
                        );
                      return (
                        <tr
                          key={d.day}
                          className={`border-b border-gray-50 hover:bg-gray-50/60 ${isTop ? "bg-emerald-50/30" : ""}`}
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              {isTop && (
                                <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[8px] font-bold text-emerald-700">
                                  BEST
                                </span>
                              )}
                              <p className="font-bold text-gray-900">
                                {d.name}
                              </p>
                            </div>
                          </td>
                          <td className="px-4 py-3 font-bold text-gray-900">
                            ₹{d.revenue.toLocaleString("en-IN")}
                          </td>
                          <td className="px-4 py-3 text-gray-700">
                            {d.orders}
                          </td>
                          <td className="px-4 py-3 text-gray-600">
                            ₹{d.avgBill.toLocaleString("en-IN")}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="h-2 w-28 overflow-hidden rounded-full bg-gray-100">
                                <div
                                  className="h-full rounded-full bg-[#b10000]"
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                              <span className="text-[11px] font-semibold text-gray-600">
                                {pct}%
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${d.revenue === 0 ? "bg-gray-100 text-gray-400" : pct >= 20 ? "bg-emerald-50 text-emerald-600" : pct >= 12 ? "bg-blue-50 text-blue-600" : "bg-gray-100 text-gray-500"}`}
                            >
                              {d.revenue === 0
                                ? "No Data"
                                : pct >= 20
                                  ? "Peak Day"
                                  : pct >= 12
                                    ? "Busy"
                                    : "Slow Day"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                    {!heatmapData?.dailyData?.length && (
                      <tr>
                        <td
                          colSpan={6}
                          className="py-10 text-center text-[12px] text-gray-400"
                        >
                          No day analysis data for this period
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ===== REVENUE FORECAST ===== */}
        {activeTab === "Revenue Forecast" && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
              {[
                {
                  label: "Last 7-Day Avg",
                  value: `₹${(forecastData?.summary?.avg7 || 0).toLocaleString("en-IN")}`,
                  sub: "daily average",
                  color: "blue",
                },
                {
                  label: "Prev 7-Day Avg",
                  value: `₹${(forecastData?.summary?.avgPrev7 || 0).toLocaleString("en-IN")}`,
                  sub: "comparison period",
                  color: "gray",
                },
                {
                  label: "Growth Rate",
                  value: `${forecastData?.summary?.growthPercent >= 0 ? "+" : ""}${forecastData?.summary?.growthPercent || 0}%`,
                  sub: "week over week",
                  color:
                    (forecastData?.summary?.growthPercent || 0) >= 0
                      ? "emerald"
                      : "red",
                },
                {
                  label: "Forecast (7 days)",
                  value: `₹${(forecastData?.summary?.forecastTotal || 0).toLocaleString("en-IN")}`,
                  sub: "predicted next week",
                  color: "violet",
                },
              ].map((k) => (
                <div
                  key={k.label}
                  className={`rounded-xl border p-4 ${k.color === "blue" ? "border-blue-100 bg-blue-50/60" : k.color === "emerald" ? "border-emerald-100 bg-emerald-50/60" : k.color === "red" ? "border-red-100 bg-red-50/60" : k.color === "violet" ? "border-violet-100 bg-violet-50/60" : "border-gray-200 bg-gray-50"}`}
                >
                  <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500">
                    {k.label}
                  </p>
                  <p
                    className={`mt-2 text-[20px] font-bold ${k.color === "blue" ? "text-blue-700" : k.color === "emerald" ? "text-emerald-700" : k.color === "red" ? "text-red-700" : k.color === "violet" ? "text-violet-700" : "text-gray-700"}`}
                  >
                    {k.value}
                  </p>
                  <p className="mt-1 text-[11px] text-gray-500">{k.sub}</p>
                </div>
              ))}
            </div>

            {/* History + Forecast chart */}
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-100 px-4 py-3">
                <h3 className="text-[15px] font-bold text-gray-900">
                  30-Day History + 7-Day Forecast
                </h3>
                <p className="mt-0.5 text-[11px] text-gray-500">
                  Solid line = actual · Dashed area = predicted range (±15%)
                </p>
              </div>
              <div className="p-3">
                {forecastData?.history?.length > 0 ? (
                  (() => {
                    const combined = [
                      ...(forecastData.history || []).map((d: any) => ({
                        ...d,
                        type: "actual",
                      })),
                      ...(forecastData.forecast || []).map((d: any) => ({
                        date: d.date,
                        revenue: d.predicted,
                        lower: d.lower,
                        upper: d.upper,
                        type: "forecast",
                      })),
                    ];
                    return (
                      <ResponsiveContainer width="100%" height={260}>
                        <AreaChart data={combined}>
                          <defs>
                            <linearGradient id="fg" x1="0" y1="0" x2="0" y2="1">
                              <stop
                                offset="5%"
                                stopColor="#8b5cf6"
                                stopOpacity={0.12}
                              />
                              <stop
                                offset="95%"
                                stopColor="#8b5cf6"
                                stopOpacity={0}
                              />
                            </linearGradient>
                            <linearGradient id="ag" x1="0" y1="0" x2="0" y2="1">
                              <stop
                                offset="5%"
                                stopColor="#ef4444"
                                stopOpacity={0.12}
                              />
                              <stop
                                offset="95%"
                                stopColor="#ef4444"
                                stopOpacity={0}
                              />
                            </linearGradient>
                          </defs>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            vertical={false}
                            stroke="#f1f5f9"
                          />
                          <XAxis
                            dataKey="date"
                            tick={{ fontSize: 9, fill: "#6b7280" }}
                            axisLine={false}
                            tickLine={false}
                            interval={4}
                          />
                          <YAxis
                            tick={{ fontSize: 9, fill: "#6b7280" }}
                            axisLine={false}
                            tickLine={false}
                            tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                          />
                          <Tooltip
                            formatter={(v: any) =>
                              `₹${Number(v).toLocaleString("en-IN")}`
                            }
                          />
                          <Area
                            type="monotone"
                            dataKey="revenue"
                            stroke="#ef4444"
                            strokeWidth={2}
                            fill="url(#ag)"
                            name="Actual Revenue"
                          />
                          <Area
                            type="monotone"
                            dataKey="upper"
                            stroke="#8b5cf6"
                            strokeWidth={1}
                            strokeDasharray="4 2"
                            fill="url(#fg)"
                            name="Upper Forecast"
                          />
                          <Line
                            type="monotone"
                            dataKey="lower"
                            stroke="#8b5cf6"
                            strokeWidth={1}
                            strokeDasharray="4 2"
                            dot={false}
                            name="Lower Forecast"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    );
                  })()
                ) : (
                  <div className="flex h-[260px] items-center justify-center text-[12px] text-gray-400">
                    Not enough historical data for forecast
                  </div>
                )}
              </div>
            </div>

            {/* Weekly breakdown + 7-day forecast table */}
            <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
              <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="border-b border-gray-100 px-4 py-3">
                  <h3 className="text-[15px] font-bold text-gray-900">
                    Last 4 Weeks Revenue
                  </h3>
                </div>
                <div className="p-3">
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={forecastData?.weeklyRevenue || []}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="#f1f5f9"
                      />
                      <XAxis
                        dataKey="week"
                        tick={{ fontSize: 10, fill: "#6b7280" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 9, fill: "#6b7280" }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                      />
                      <Tooltip
                        formatter={(v: any) =>
                          `₹${Number(v).toLocaleString("en-IN")}`
                        }
                      />
                      <Bar
                        dataKey="revenue"
                        name="Revenue"
                        fill="#ef4444"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="overflow-hidden rounded-xl border border-violet-100 bg-white shadow-sm">
                <div className="border-b border-violet-100 bg-violet-50/40 px-4 py-3">
                  <h3 className="text-[15px] font-bold text-gray-900">
                    7-Day Revenue Forecast
                  </h3>
                  <p className="mt-0.5 text-[11px] text-gray-500">
                    Based on 7-day rolling average + growth rate
                  </p>
                </div>
                <div className="divide-y divide-gray-50">
                  {(forecastData?.forecast || []).map((f: any) => (
                    <div
                      key={f.date}
                      className="flex items-center justify-between px-4 py-2.5"
                    >
                      <p className="text-[12px] font-semibold text-gray-900">
                        {f.date}
                      </p>
                      <div className="text-right">
                        <p className="text-[13px] font-bold text-violet-700">
                          ₹{f.predicted.toLocaleString("en-IN")}
                        </p>
                        <p className="text-[10px] text-gray-400">
                          ₹{f.lower.toLocaleString("en-IN")} – ₹
                          {f.upper.toLocaleString("en-IN")}
                        </p>
                      </div>
                    </div>
                  ))}
                  {!forecastData?.forecast?.length && (
                    <div className="py-8 text-center text-[12px] text-gray-400">
                      No forecast data available
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
