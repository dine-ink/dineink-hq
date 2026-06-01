import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

interface ReportParams {
  restaurantName: string;
  branchName: string;
  from: string;
  to: string;
  restaurantId: number;
  branchId: number;
  token: string;
  apiUrl: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const INR = (v: any) => `₹${Number(v || 0).toLocaleString("en-IN")}`;

function headerRow(ws: ExcelJS.Worksheet, text: string, cols: number, color = "EF4444") {
  const row = ws.addRow([text]);
  row.font = { bold: true, size: 13, color: { argb: "FFFFFFFF" } };
  row.fill = { type: "pattern", pattern: "solid", fgColor: { argb: `FF${color}` } };
  row.height = 22;
  ws.mergeCells(row.number, 1, row.number, cols);
  row.getCell(1).alignment = { horizontal: "left", vertical: "middle", indent: 1 };
  ws.addRow([]); // blank spacer
}

function subHeaderRow(ws: ExcelJS.Worksheet, headers: string[]) {
  const row = ws.addRow(headers);
  row.font = { bold: true, size: 10 };
  row.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFEF2F2" } };
  row.eachCell(cell => {
    cell.border = {
      bottom: { style: "medium", color: { argb: "FFEF4444" } },
    };
    cell.alignment = { vertical: "middle" };
  });
  row.height = 18;
}

function dataRow(ws: ExcelJS.Worksheet, values: any[], altBg = false) {
  const row = ws.addRow(values);
  if (altBg) {
    row.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFDF4F4" } };
  }
  row.eachCell(cell => {
    cell.alignment = { vertical: "middle" };
    cell.border = {
      bottom: { style: "hair", color: { argb: "FFE5E7EB" } },
    };
  });
  row.height = 16;
}

// ─── Main export function ────────────────────────────────────────────────────

export async function downloadReport(params: ReportParams): Promise<void> {
  const { restaurantName, branchName, from, to, restaurantId, branchId, token, apiUrl } = params;
  const h = { Authorization: `Bearer ${token}` };
  const bParam = `branchId=${branchId}`;

  // Fetch all data in parallel
  const [analyticsRes, billsRes, expensesRes] = await Promise.all([
    fetch(`${apiUrl}/api/analytics/${restaurantId}/restaurantDashboardOverview?${bParam}&range=custom&from=${from}&to=${to}`, { headers: h }),
    fetch(`${apiUrl}/api/bills/${restaurantId}/restaurantwise?${bParam}&from=${from}&to=${to}`, { headers: h }),
    fetch(`${apiUrl}/api/reports/expenses?${bParam}&from=${from}&to=${to}`, { headers: h }),
  ]);

  const [analyticsJson, billsJson, expensesJson] = await Promise.all([
    analyticsRes.json(), billsRes.json(), expensesRes.json(),
  ]);

  const analytics = analyticsJson.success ? analyticsJson.data : {};
  const bills: any[] = billsJson.success ? billsJson.bills || [] : [];
  const expenses: any[] = expensesJson.success ? expensesJson.data || [] : [];

  // Build derived metrics
  const totalRevenue = bills.reduce((s, b) => s + Number(b.total || 0), 0);
  const totalGST = bills.reduce((s, b) => s + Number(b.cgst || 0) + Number(b.sgst || 0), 0);
  const totalDiscount = bills.reduce((s, b) => s + Number(b.discount || 0), 0);
  const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount || 0), 0);
  const netProfit = totalRevenue - totalGST - totalExpenses;
  const paidBills = bills.filter(b => b.status === "PAID");

  // ─── Workbook setup ────────────────────────────────────────────────────────
  const wb = new ExcelJS.Workbook();
  wb.creator = "DineInk";
  wb.created = new Date();

  // ═══════════════════════════════════════════════════════════════════════════
  // SHEET 1 — SUMMARY
  // ═══════════════════════════════════════════════════════════════════════════
  const s1 = wb.addWorksheet("📊 Summary");
  s1.columns = [
    { width: 28 }, { width: 22 }, { width: 22 }, { width: 18 },
  ];

  // Title block
  const title = s1.addRow(["DineInk — Full Business Report"]);
  title.font = { bold: true, size: 16, color: { argb: "FFEF4444" } };
  title.height = 28;

  s1.addRow(["Restaurant", restaurantName || "—"]);
  s1.addRow(["Branch", branchName || "—"]);
  s1.addRow(["Period", `${from}  →  ${to}`]);
  s1.addRow(["Generated", new Date().toLocaleString("en-IN")]);
  s1.addRow([]);

  // KPI block
  headerRow(s1, "KEY PERFORMANCE INDICATORS", 4);
  subHeaderRow(s1, ["Metric", "Value", "Notes"]);
  const kpis = [
    ["Total Revenue", INR(totalRevenue), `${bills.length} bills`],
    ["Paid Revenue", INR(paidBills.reduce((s, b) => s + Number(b.total || 0), 0)), `${paidBills.length} paid bills`],
    ["Total Orders", String(analytics.totalOrders || bills.length), "completed"],
    ["Avg Bill Value", INR((analytics.avgOrderValue || (bills.length ? totalRevenue / bills.length : 0))), "per transaction"],
    ["Total GST Collected", INR(totalGST), "CGST + SGST"],
    ["Total Discounts Given", INR(totalDiscount), "revenue given away"],
    ["Total Expenses", INR(totalExpenses), `${expenses.length} entries`],
    ["Net Profit (est.)", INR(netProfit), "Revenue − GST − Expenses"],
    ["Unique Customers", String(analytics.totalCustomers || 0), "visited in period"],
    ["Peak Hours", analytics.peakHours || "—", "busiest time slot"],
  ];
  kpis.forEach((r, i) => dataRow(s1, r, i % 2 === 0));
  s1.addRow([]);

  // P&L block
  headerRow(s1, "PROFIT & LOSS SNAPSHOT", 4, "059669");
  subHeaderRow(s1, ["Item", "Amount", "% of Revenue"]);
  const pnl = [
    ["Gross Revenue (all bills)", INR(totalRevenue + totalDiscount), "100%"],
    ["(−) Discounts Given", `−${INR(totalDiscount)}`, totalRevenue > 0 ? `-${((totalDiscount / (totalRevenue + totalDiscount)) * 100).toFixed(1)}%` : "0%"],
    ["Net Revenue", INR(totalRevenue), ""],
    ["(−) GST Collected", `−${INR(totalGST)}`, totalRevenue > 0 ? `-${((totalGST / totalRevenue) * 100).toFixed(1)}%` : "0%"],
    ["(−) Operating Expenses", `−${INR(totalExpenses)}`, totalRevenue > 0 ? `-${((totalExpenses / totalRevenue) * 100).toFixed(1)}%` : "0%"],
    ["Estimated Net Profit", INR(netProfit), totalRevenue > 0 ? `${((netProfit / totalRevenue) * 100).toFixed(1)}%` : "0%"],
  ];
  pnl.forEach((r, i) => {
    const row = dataRow(s1, r, i % 2 === 0);
    if (i === pnl.length - 1) {
      const pRow = s1.lastRow!;
      pRow.font = { bold: true };
      pRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: netProfit >= 0 ? "FFD1FAE5" : "FFFEE2E2" } };
    }
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // SHEET 2 — DAILY REVENUE
  // ═══════════════════════════════════════════════════════════════════════════
  const s2 = wb.addWorksheet("📅 Daily Revenue");
  s2.columns = [{ width: 16 }, { width: 18 }, { width: 14 }, { width: 16 }];

  headerRow(s2, "DAILY REVENUE BREAKDOWN", 4);
  subHeaderRow(s2, ["Date", "Revenue (₹)", "Orders", "Avg Bill (₹)"]);

  // Group bills by date
  const byDate: Record<string, { revenue: number; orders: number }> = {};
  bills.forEach(b => {
    const d = new Date(b.createdAt).toLocaleDateString("en-IN");
    if (!byDate[d]) byDate[d] = { revenue: 0, orders: 0 };
    byDate[d].revenue += Number(b.total || 0);
    byDate[d].orders++;
  });

  Object.entries(byDate)
    .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
    .forEach(([date, d], i) => {
      dataRow(s2, [date, d.revenue, d.orders, d.orders ? Math.round(d.revenue / d.orders) : 0], i % 2 === 0);
    });

  if (Object.keys(byDate).length === 0) {
    s2.addRow(["No data for this period"]);
  }

  // Totals row
  const totalRow = s2.addRow(["TOTAL", totalRevenue, bills.length, bills.length ? Math.round(totalRevenue / bills.length) : 0]);
  totalRow.font = { bold: true };
  totalRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFEF2F2" } };

  // ═══════════════════════════════════════════════════════════════════════════
  // SHEET 3 — TOP ITEMS
  // ═══════════════════════════════════════════════════════════════════════════
  const s3 = wb.addWorksheet("🍽️ Top Items");
  s3.columns = [{ width: 6 }, { width: 30 }, { width: 16 }, { width: 18 }];

  headerRow(s3, "TOP SELLING MENU ITEMS", 4);
  subHeaderRow(s3, ["#", "Item Name", "Qty Sold", "Revenue (₹)"]);

  // Aggregate from bills items
  const itemMap: Record<string, { qty: number; revenue: number }> = {};
  bills.forEach(b => {
    (b.items || []).forEach((item: any) => {
      if (!itemMap[item.itemName]) itemMap[item.itemName] = { qty: 0, revenue: 0 };
      itemMap[item.itemName].qty += Number(item.quantity || 0);
      itemMap[item.itemName].revenue += Number(item.total || 0);
    });
  });

  // Also use analytics.topItems if available
  const topItemsData = Object.entries(itemMap).length > 0
    ? Object.entries(itemMap).map(([name, d]) => ({ name, ...d })).sort((a, b) => b.qty - a.qty)
    : (analytics.topItems || []).map((i: any) => ({ name: i.name, qty: i.quantity, revenue: 0 }));

  topItemsData.slice(0, 50).forEach((item, i) => {
    dataRow(s3, [i + 1, item.name, item.qty, item.revenue || "—"], i % 2 === 0);
  });

  if (topItemsData.length === 0) s3.addRow(["No item data available"]);

  // ═══════════════════════════════════════════════════════════════════════════
  // SHEET 4 — PAYMENT METHODS
  // ═══════════════════════════════════════════════════════════════════════════
  const s4 = wb.addWorksheet("💳 Payments");
  s4.columns = [{ width: 22 }, { width: 16 }, { width: 16 }, { width: 16 }];

  headerRow(s4, "PAYMENT METHOD BREAKDOWN", 4);
  subHeaderRow(s4, ["Payment Method", "Bills", "Revenue (₹)", "Share (%)"]);

  const payMap: Record<string, { count: number; revenue: number }> = {};
  bills.forEach(b => {
    const m = b.paymentMethod || "Unknown";
    if (!payMap[m]) payMap[m] = { count: 0, revenue: 0 };
    payMap[m].count++;
    payMap[m].revenue += Number(b.total || 0);
  });

  Object.entries(payMap)
    .sort((a, b) => b[1].revenue - a[1].revenue)
    .forEach(([method, d], i) => {
      const share = totalRevenue > 0 ? ((d.revenue / totalRevenue) * 100).toFixed(1) : "0.0";
      dataRow(s4, [method, d.count, d.revenue, `${share}%`], i % 2 === 0);
    });

  // ═══════════════════════════════════════════════════════════════════════════
  // SHEET 5 — ALL BILLS
  // ═══════════════════════════════════════════════════════════════════════════
  const s5 = wb.addWorksheet("🧾 All Bills");
  s5.columns = [
    { width: 22 }, { width: 16 }, { width: 18 }, { width: 16 },
    { width: 14 }, { width: 12 }, { width: 12 }, { width: 12 },
    { width: 14 }, { width: 12 }, { width: 20 },
  ];

  headerRow(s5, `ALL BILLS — ${from} to ${to}`, 11);
  subHeaderRow(s5, ["Bill No", "Date", "Customer", "Order Type", "Payment", "Subtotal", "GST", "Discount", "Total", "Status", "Notes"]);

  bills.forEach((b, i) => {
    dataRow(s5, [
      b.billNo || `#${b.id}`,
      new Date(b.createdAt).toLocaleDateString("en-IN"),
      b.customer?.name || "Guest",
      b.orderType || "—",
      b.paymentMethod || "—",
      Number(b.subtotal || 0),
      Number((b.cgst || 0) + (b.sgst || 0)),
      Number(b.discount || 0),
      Number(b.total || 0),
      b.status || "—",
      b.notes || "",
    ], i % 2 === 0);
  });

  if (bills.length === 0) s5.addRow(["No bills in this period"]);

  // Footer totals
  s5.addRow([]);
  const billTotalRow = s5.addRow([
    "TOTALS", "", "", "", "",
    bills.reduce((s, b) => s + Number(b.subtotal || 0), 0),
    totalGST,
    totalDiscount,
    totalRevenue,
    `${paidBills.length} paid`,
    "",
  ]);
  billTotalRow.font = { bold: true };
  billTotalRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFEF2F2" } };

  // ═══════════════════════════════════════════════════════════════════════════
  // SHEET 6 — EXPENSES
  // ═══════════════════════════════════════════════════════════════════════════
  const s6 = wb.addWorksheet("💰 Expenses");
  s6.columns = [
    { width: 28 }, { width: 18 }, { width: 18 }, { width: 16 }, { width: 22 },
  ];

  headerRow(s6, "OPERATING EXPENSES", 5, "7C3AED");
  subHeaderRow(s6, ["Title", "Type", "Date", "Amount (₹)", "Paid By"]);

  expenses.forEach((e, i) => {
    dataRow(s6, [
      e.title || "—",
      e.expenseType || "—",
      new Date(e.expenseDate || e.createdAt).toLocaleDateString("en-IN"),
      Number(e.amount || 0),
      e.paidByUser?.name || "—",
    ], i % 2 === 0);
  });

  if (expenses.length === 0) s6.addRow(["No expenses recorded in this period"]);

  const expTotalRow = s6.addRow(["TOTAL EXPENSES", "", "", totalExpenses, ""]);
  expTotalRow.font = { bold: true };
  expTotalRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF3E8FF" } };

  // ─── Download ─────────────────────────────────────────────────────────────
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const filename = `DineInk-Report-${branchName.replace(/\s+/g, "-")}-${from}-to-${to}.xlsx`;
  saveAs(blob, filename);
}
