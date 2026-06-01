import ExcelJS from "exceljs";
import type { FullReportData } from "./reportData";

// ─── Design tokens ─────────────────────────────────────────────────────────
const T = {
  red:      "FFEF4444", redDk:    "FFC52020", redLt:    "FFFEF2F2", redXLt:   "FFFFF5F5",
  green:    "FF059669", greenDk:  "FF047857", greenLt:  "FFD1FAE5",
  blue:     "FF2563EB", blueDk:   "FF1D4ED8", blueLt:   "FFDBEAFE",
  purple:   "FF7C3AED", purpleLt: "FFEDE9FE",
  amber:    "FFD97706", amberLt:  "FFFEF3C7",
  teal:     "FF0D9488", tealLt:   "FFCCFBF1",
  orange:   "FFEA580C", orangeLt: "FFFFEDD5",
  s900:     "FF0F172A", s800:     "FF1E293B", s700:     "FF334155",
  s600:     "FF475569", s500:     "FF64748B", s400:     "FF94A3B8",
  s300:     "FFCBD5E1", s200:     "FFE2E8F0", s100:     "FFF1F5F9",
  s50:      "FFF8FAFC", white:    "FFFFFFFF",
  lossRed:  "FFFEE2E2", lossText: "FFB91C1C",
};

type ARGB = string;

// ─── Helpers ────────────────────────────────────────────────────────────────
const n = (v: any) => Number(v || 0);
const inr = (v: any) => `₹${n(v).toLocaleString("en-IN")}`;
const pct = (v: number, total: number) => total > 0 ? `${((v / total) * 100).toFixed(1)}%` : "0.0%";

function fill(argb: ARGB): ExcelJS.Fill {
  return { type: "pattern", pattern: "solid", fgColor: { argb } };
}
function bdr(style: ExcelJS.BorderStyle = "thin", c = T.s200): Partial<ExcelJS.Borders> {
  const s = { style, color: { argb: c } };
  return { top: s, left: s, bottom: s, right: s };
}
function bottomBdr(c = T.red, style: ExcelJS.BorderStyle = "medium"): Partial<ExcelJS.Borders> {
  return { bottom: { style, color: { argb: c } } };
}

// ─── Sheet builders ─────────────────────────────────────────────────────────

function newSheet(wb: ExcelJS.Workbook, name: string, widths: number[]): ExcelJS.Worksheet {
  const ws = wb.addWorksheet(name);
  ws.columns = widths.map(w => ({ width: w }));
  return ws;
}

/** Big coloured title + subtitle */
function title(ws: ExcelJS.Worksheet, main: string, sub: string, cols: number, bg = T.s900) {
  const r1 = ws.addRow([main]);
  r1.height = 30;
  r1.getCell(1).font  = { bold: true, size: 15, color: { argb: T.white } };
  r1.getCell(1).fill  = fill(bg);
  r1.getCell(1).alignment = { vertical: "middle", indent: 1 };
  ws.mergeCells(r1.number, 1, r1.number, cols);
  // Red accent strip
  const r1b = ws.addRow([""]);
  r1b.height = 3;
  for (let c = 1; c <= cols; c++) r1b.getCell(c).fill = fill(T.red);
  if (sub) {
    const r2 = ws.addRow([sub]);
    r2.height = 14;
    r2.getCell(1).font  = { size: 8.5, italic: true, color: { argb: T.s500 } };
    r2.getCell(1).fill  = fill(T.s800);
    r2.getCell(1).alignment = { vertical: "middle", indent: 1 };
    ws.mergeCells(r2.number, 1, r2.number, cols);
  }
  ws.addRow([]);
}

/** Section sub-header */
function section(ws: ExcelJS.Worksheet, label: string, cols: number, bg = T.red, fg = T.white) {
  ws.addRow([]);
  const r = ws.addRow([label]);
  r.height = 17;
  r.getCell(1).font  = { bold: true, size: 9.5, color: { argb: fg } };
  r.getCell(1).fill  = fill(bg);
  r.getCell(1).alignment = { vertical: "middle", indent: 1 };
  ws.mergeCells(r.number, 1, r.number, cols);
  ws.addRow([]);
}

/** Column headers */
function thead(ws: ExcelJS.Worksheet, headers: string[], bg = T.s800, fg = T.white) {
  const r = ws.addRow(headers);
  r.height = 17;
  r.eachCell((cell, col) => {
    cell.font  = { bold: true, size: 9, color: { argb: fg } };
    cell.fill  = fill(bg);
    cell.alignment = { vertical: "middle", horizontal: col === 1 ? "left" : "center", indent: col === 1 ? 1 : 0 };
    cell.border = bottomBdr(T.red);
  });
}

/** Data row alternating */
function drow(ws: ExcelJS.Worksheet, vals: any[], alt = false, rightCols: number[] = []) {
  const r = ws.addRow(vals);
  r.height = 14;
  r.eachCell((cell, col) => {
    cell.fill = fill(alt ? T.s50 : T.white);
    cell.font = { size: 8.5, color: { argb: T.s700 } };
    cell.alignment = { vertical: "middle", horizontal: rightCols.includes(col) ? "right" : col === 1 ? "left" : "center", indent: col === 1 ? 1 : 0 };
    cell.border = bottomBdr(T.s200, "hair");
  });
  return r;
}

/** Summary/total row */
function srow(ws: ExcelJS.Worksheet, vals: any[], bg = T.redLt, fg = T.redDk) {
  const r = ws.addRow(vals);
  r.height = 16;
  r.eachCell(cell => {
    cell.font = { bold: true, size: 9, color: { argb: fg } };
    cell.fill = fill(bg);
    cell.alignment = { vertical: "middle", indent: 1 };
    cell.border = bdr("medium", T.red);
  });
  return r;
}

/** Inline KPI pair: label | value */
function kpi(ws: ExcelJS.Worksheet, label: string, value: string, accent = T.red, col = 1) {
  const r = ws.addRow([]);
  r.height = 18;
  const lc = r.getCell(col);
  lc.value = label; lc.font = { size: 8.5, color: { argb: T.s500 } };
  lc.fill = fill(T.s50); lc.alignment = { vertical: "middle", indent: 1 };
  const vc = r.getCell(col + 1);
  vc.value = value; vc.font = { bold: true, size: 12, color: { argb: accent } };
  vc.fill = fill(T.s50); vc.alignment = { vertical: "middle", indent: 1 };
  return r;
}

// ─── MAIN GENERATOR ─────────────────────────────────────────────────────────

export async function generateExcelReport(
  data: FullReportData,
  meta: { restaurantName: string; branchName: string; from: string; to: string },
): Promise<ArrayBuffer> {

  const wb = new ExcelJS.Workbook();
  wb.creator = "DineInk"; wb.created = new Date(); wb.modified = new Date();

  const { analytics, bills, expenses, customers, menuItems, ingredients,
    kitchenData, attendance, allStaff, cashSessions,
    branchComparison, cityComparison, heatmap, forecast, rfm,
    insightsData, inventoryAdjustments, staffProductivity } = data;

  // ─── Pre-compute shared metrics ─────────────────────────────────────────
  const totalRev    = bills.reduce((s, b) => s + n(b.total), 0);
  const totalGST    = bills.reduce((s, b) => s + n(b.cgst) + n(b.sgst), 0);
  const totalDisc   = bills.reduce((s, b) => s + n(b.discount), 0);
  const totalExp    = expenses.reduce((s, e) => s + n(e.amount), 0);
  const netProfit   = totalRev - totalGST - totalExp;
  const paidBills   = bills.filter(b => b.status === "PAID");
  const gross       = totalRev + totalDisc;

  // Item aggregation from bills
  const itemMap: Record<string, { qty: number; rev: number; cat: string }> = {};
  bills.forEach(b => {
    (b.items || []).forEach((item: any) => {
      if (!itemMap[item.itemName]) itemMap[item.itemName] = { qty: 0, rev: 0, cat: "—" };
      itemMap[item.itemName].qty += n(item.quantity);
      itemMap[item.itemName].rev += n(item.total);
    });
  });
  menuItems.forEach((m: any) => { if (itemMap[m.name]) itemMap[m.name].cat = m.category?.name || "—"; });
  const topItems = Object.entries(itemMap).sort((a, b) => b[1].qty - a[1].qty);

  // Payment map
  const payMap: Record<string, { count: number; rev: number }> = {};
  bills.forEach(b => {
    const m = b.paymentMethod || "Unknown";
    if (!payMap[m]) payMap[m] = { count: 0, rev: 0 };
    payMap[m].count++; payMap[m].rev += n(b.total);
  });

  // Daily data
  const byDate: Record<string, { rev: number; orders: number }> = {};
  bills.forEach(b => {
    const d = new Date(b.createdAt).toLocaleDateString("en-IN");
    if (!byDate[d]) byDate[d] = { rev: 0, orders: 0 };
    byDate[d].rev += n(b.total); byDate[d].orders++;
  });
  const dailyArr = Object.entries(byDate).sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime());

  // Order type map
  const otMap: Record<string, { count: number; rev: number }> = {};
  bills.forEach(b => {
    const t = (b.orderType || "UNKNOWN").replace("_", " ");
    if (!otMap[t]) otMap[t] = { count: 0, rev: 0 };
    otMap[t].count++; otMap[t].rev += n(b.total);
  });

  // Customer churn
  const now = Date.now();
  const activeC    = customers.filter((c: any) => c.lastVisit && (now - new Date(c.lastVisit).getTime()) / 86400000 <= 30);
  const atRiskC    = customers.filter((c: any) => c.lastVisit && (now - new Date(c.lastVisit).getTime()) / 86400000 > 30 && (now - new Date(c.lastVisit).getTime()) / 86400000 <= 90);
  const churnedC   = customers.filter((c: any) => !c.lastVisit || (now - new Date(c.lastVisit).getTime()) / 86400000 > 90);
  const avgCLV     = customers.length ? Math.round(customers.reduce((s: number, c: any) => s + n(c.spend), 0) / customers.length) : 0;

  // RFM segment map
  const rfmMap: Record<string, any> = {};
  (rfm?.customers || []).forEach((c: any) => { rfmMap[c.phone] = c; });
  const segCounts: Record<string, number> = {};
  (rfm?.customers || []).forEach((c: any) => { segCounts[c.segment] = (segCounts[c.segment] || 0) + 1; });

  // Menu engineering
  const mappedItems = menuItems.filter((m: any) => (m.menuItemIngredients || []).length > 0);
  const itemsSales = topItems.slice(0, 50).map(([name, d]) => {
    const mi = menuItems.find((m: any) => m.name === name);
    const cost = (mi?.menuItemIngredients || []).reduce((acc: number, ing: any) => {
      const price = n(ing.ingredient?.pricePerUnit);
      const qty   = n(ing.quantity);
      return acc + qty * price;
    }, 0);
    const sp = n(mi?.price);
    const margin = sp > 0 ? ((sp - cost) / sp * 100).toFixed(1) : "—";
    return { name, qty: d.qty, rev: d.rev, cat: d.cat, cost: cost.toFixed(2), price: sp, margin };
  });

  // Insights
  const ins = insightsData || {};
  const fixedExp  = n(ins.monthlyRent) + n(ins.loanEmi) + n(ins.internet) + n(ins.phoneBills) + n(ins.accounting) + n(ins.insurance) + n(ins.licenses);
  const varExp    = n(ins.deliveryCharges) + n(ins.packaging) + n(ins.paymentGateway) + n(ins.aggregatorCommission) + n(ins.electricity) + n(ins.gas) + n(ins.maintenance) + n(ins.fuel);
  const labourExp = allStaff.reduce((s, st) => s + n(st.salary), 0);
  const finExp    = n(ins.monthlyLoanEmi) + n(ins.monthlyInterestPayments) + n(ins.caFees) + n(ins.insuranceCost) + n(ins.otherTaxes);
  const insRev    = n(ins.revenue) || totalRev;
  const ebitda    = insRev > 0 ? ((insRev - (fixedExp + varExp + labourExp + finExp)) / insRev * 100).toFixed(1) : "0";

  // Expense by type
  const expByType: Record<string, number> = {};
  expenses.forEach(e => { expByType[e.expenseType || "Other"] = (expByType[e.expenseType || "Other"] || 0) + n(e.amount); });

  // Waste map
  const wasteByType: Record<string, { count: number; items: any[] }> = {};
  inventoryAdjustments.forEach(a => {
    const t = a.adjustmentType || "UNKNOWN";
    if (!wasteByType[t]) wasteByType[t] = { count: 0, items: [] };
    wasteByType[t].count++; wasteByType[t].items.push(a);
  });
  const wasteByIng: Record<string, { qty: number; adj: number }> = {};
  inventoryAdjustments.forEach(a => {
    const nm = a.ingredient?.name || "Unknown";
    if (!wasteByIng[nm]) wasteByIng[nm] = { qty: 0, adj: 0 };
    wasteByIng[nm].qty += n(a.quantity); wasteByIng[nm].adj++;
  });

  // ════════════════════════════════════════════════════
  // SHEET 1 — COVER
  // ════════════════════════════════════════════════════
  const cov = newSheet(wb, "🏠 Cover", [3, 28, 28, 24, 3]);
  const tRow = cov.addRow(["", "DineInk — Full Business Intelligence Report"]);
  tRow.height = 38;
  const tc = tRow.getCell(2);
  tc.value = "DineInk — Full Business Intelligence Report";
  tc.font = { bold: true, size: 20, color: { argb: T.white } };
  tc.fill = fill(T.s900); tc.alignment = { vertical: "middle", indent: 1 };
  cov.mergeCells(tRow.number, 1, tRow.number, 5);
  tRow.getCell(1).fill = fill(T.s900);
  const acr = cov.addRow([""]); acr.height = 4;
  for (let c = 1; c <= 5; c++) acr.getCell(c).fill = fill(T.red);
  const sub = cov.addRow(["", "22 Modules · 90+ KPI Cards · 27 Data Sheets · Charts & Analytics"]);
  sub.height = 16; sub.getCell(2).font = { size: 9, italic: true, color: { argb: T.s500 } };
  sub.getCell(2).fill = fill(T.s800); cov.mergeCells(sub.number, 1, sub.number, 5);
  for (let c = 1; c <= 5; c++) sub.getCell(c).fill = fill(T.s800);
  cov.addRow([]);
  [["Restaurant", meta.restaurantName, T.red], ["Branch", meta.branchName, T.blue],
   ["Period", `${meta.from}  →  ${meta.to}`, T.purple], ["Generated", new Date().toLocaleString("en-IN"), T.s600],
   ["Platform", "DineInk Restaurant Intelligence", T.green]].forEach(([lbl, val, color]) => {
    const r = cov.addRow(["", lbl, val]);
    r.height = 20;
    r.getCell(2).font = { bold: true, size: 10, color: { argb: T.s700 } };
    r.getCell(2).fill = fill(T.s100); r.getCell(2).alignment = { vertical: "middle", indent: 1 };
    r.getCell(2).border = bdr("thin", T.s200);
    r.getCell(3).font = { bold: true, size: 11, color: { argb: color as string } };
    r.getCell(3).fill = fill(T.white); r.getCell(3).alignment = { vertical: "middle", indent: 1 };
    r.getCell(3).border = bdr("thin", T.s200);
  });
  cov.addRow([]); cov.addRow([]);
  // KPI grid
  const kpis = [
    ["Total Revenue", inr(totalRev), T.red], ["Net Profit", inr(netProfit), netProfit >= 0 ? T.green : T.redDk],
    ["Total Orders", String(bills.length), T.blue], ["Customers", String(customers.length), T.purple],
    ["GST Collected", inr(totalGST), T.amber], ["Expenses", inr(totalExp), T.s600],
  ];
  kpis.forEach(([lbl, val, color]) => {
    const r = cov.addRow(["", lbl, val]);
    r.height = 24;
    r.getCell(2).font = { size: 9, color: { argb: T.s500 } };
    r.getCell(2).fill = fill(T.s50); r.getCell(2).alignment = { vertical: "middle", indent: 1 };
    r.getCell(3).font = { bold: true, size: 14, color: { argb: color as string } };
    r.getCell(3).fill = fill(T.s50); r.getCell(3).alignment = { vertical: "middle", indent: 1 };
  });
  // TOC
  cov.addRow([]); cov.addRow([]);
  const tocHdr = cov.addRow(["", "SHEETS IN THIS WORKBOOK"]);
  tocHdr.getCell(2).font = { bold: true, size: 9, color: { argb: T.s500 } }; tocHdr.height = 16;
  const sheets = [
    "🏠 Cover", "📊 Executive Summary", "📈 Analytics Overview", "💰 Revenue & Orders",
    "🧾 Billing Overview", "👥 Customer Overview", "🔄 Customer Churn", "🎯 Customer RFM",
    "🍽️ Menu Analytics", "⚙️ Menu Engineering", "💹 Insights Dashboard",
    "📋 P&L Statement", "🏛️ Tax Report", "💸 Expense Tracker", "📊 Sales Analytics",
    "🏷️ Discount Analysis", "🪑 Table Analytics", "🗑️ Waste Report",
    "⏰ Hourly Heatmap", "📅 Day Analysis", "📈 Revenue Forecast",
    "📋 Staff Attendance", "⚡ Staff Productivity", "💵 Cash Reconciliation",
    "🔥 Kitchen Analytics", "🏪 Branch Comparison", "🏙️ City Comparison",
  ];
  sheets.forEach((s, i) => {
    const r = cov.addRow(["", String(i + 1).padStart(2, "0"), s]);
    r.height = 13;
    r.getCell(2).font = { bold: true, size: 8.5, color: { argb: T.red } };
    r.getCell(3).font = { size: 8.5, color: { argb: T.s700 } };
  });

  // ════════════════════════════════════════════════════
  // SHEET 2 — EXECUTIVE SUMMARY
  // ════════════════════════════════════════════════════
  {
    const ws = newSheet(wb, "📊 Executive Summary", [30, 22, 20, 18, 18]);
    title(ws, "Executive Summary", `${meta.restaurantName}  |  ${meta.branchName}  |  ${meta.from} → ${meta.to}`, 5);
    section(ws, "KEY PERFORMANCE INDICATORS", 5);
    thead(ws, ["Metric", "Value", "Secondary Info", "Period", "Status"]);
    const kpiRows = [
      ["Total Revenue",     inr(totalRev),             `${bills.length} bills`,                          "Period",   "✅"],
      ["Paid Revenue",      inr(paidBills.reduce((s, b) => s + n(b.total), 0)), `${paidBills.length} paid bills`, "Period", "✅"],
      ["Total Orders",      String(bills.length),       `${analytics.totalOrders || bills.length} completed`, "Period", "✅"],
      ["Avg Order Value",   inr(bills.length ? Math.round(totalRev / bills.length) : 0), "per transaction", "Period", "📋"],
      ["GST Collected",     inr(totalGST),              "CGST + SGST",                                   "Period",   "📋"],
      ["Discounts Given",   inr(totalDisc),             pct(totalDisc, gross) + " of gross",             "Period",   "⚠️"],
      ["Operating Expenses",inr(totalExp),              `${expenses.length} entries`,                    "Period",   "💰"],
      ["Net Profit",        inr(netProfit),             `${totalRev > 0 ? ((netProfit / totalRev) * 100).toFixed(1) : 0}% margin`, "Period", netProfit >= 0 ? "✅" : "❌"],
      ["Unique Customers",  String(customers.length),   `${customers.filter((c: any) => c.visits > 1).length} repeat`, "All time", "👥"],
      ["Repeat Rate",       pct(customers.filter((c: any) => c.visits > 1).length, customers.length), "returning customers", "All time", "🔄"],
      ["Peak Hours",        analytics.peakHours || "—","Busiest slot",                                 "Period",   "⏰"],
      ["Active Customers",  String(activeC.length),     "visited in 30 days",                           "All time", "✅"],
      ["At Risk Customers", String(atRiskC.length),     "30–90 days since visit",                       "All time", "⚠️"],
      ["Churned Customers", String(churnedC.length),    "90+ days away",                                "All time", "❌"],
    ];
    kpiRows.forEach((row, i) => {
      const r = drow(ws, row, i % 2 === 0, [2]);
      if (row[0] === "Net Profit") {
        r.eachCell(c => { c.font = { bold: true, size: 9, color: { argb: netProfit >= 0 ? T.green : T.redDk } }; c.fill = fill(netProfit >= 0 ? T.greenLt : T.lossRed); });
      }
    });
    section(ws, "P&L SNAPSHOT", 5, T.green);
    thead(ws, ["Line Item", "Amount (₹)", "% of Revenue", "Notes", ""], T.green);
    [
      ["Gross Revenue", inr(gross), "100.0%", "Before discounts", ""],
      ["(−) Discounts", `−${inr(totalDisc)}`, `−${pct(totalDisc, gross)}`, "Staff-applied", ""],
      ["Net Revenue", inr(totalRev), "—", "After discounts", ""],
      ["(−) GST", `−${inr(totalGST)}`, `−${pct(totalGST, totalRev)}`, "Tax liability", ""],
      ["(−) Expenses", `−${inr(totalExp)}`, `−${pct(totalExp, totalRev)}`, "Operating costs", ""],
    ].forEach((row, i) => drow(ws, row, i % 2 === 0, [2]));
    srow(ws, ["NET PROFIT", inr(netProfit), pct(netProfit, totalRev), "Revenue−GST−Expenses", ""], netProfit >= 0 ? T.greenLt : T.lossRed, netProfit >= 0 ? T.greenDk : T.lossText);
  }

  // ════════════════════════════════════════════════════
  // SHEET 3 — ANALYTICS OVERVIEW (DASHBOARD)
  // ════════════════════════════════════════════════════
  {
    const ws = newSheet(wb, "📈 Analytics Overview", [20, 18, 14, 18, 20, 20]);
    title(ws, "Analytics Overview — Dashboard", "Live operational metrics mirroring the main dashboard", 6);
    section(ws, "SUMMARY KPIs", 6);
    thead(ws, ["KPI", "Value", "Orders", "Avg Value", "Customers", "Peak Hours"]);
    drow(ws, [meta.branchName, inr(totalRev), String(bills.length), inr(bills.length ? Math.round(totalRev / bills.length) : 0), String(customers.length), analytics.peakHours || "—"], false, [2, 4]);
    section(ws, "DAILY REVENUE TREND", 6);
    thead(ws, ["Date", "Revenue (₹)", "Orders", "Avg Bill (₹)", "Order Types", "Payment Methods"]);
    dailyArr.forEach(([date, d], i) => {
      const ots = bills.filter(b => new Date(b.createdAt).toLocaleDateString("en-IN") === date);
      const otStr = Object.entries(ots.reduce((a, b: any) => { a[b.orderType || "?"] = (a[b.orderType || "?"] || 0) + 1; return a; }, {} as any)).map(([k, v]) => `${k.replace("_", " ")}: ${v}`).join(", ");
      const pmStr = Object.entries(ots.reduce((a, b: any) => { a[b.paymentMethod || "?"] = (a[b.paymentMethod || "?"] || 0) + 1; return a; }, {} as any)).map(([k, v]) => `${k}: ${v}`).join(", ");
      drow(ws, [date, d.rev, d.orders, d.orders ? Math.round(d.rev / d.orders) : 0, otStr, pmStr], i % 2 === 0, [2, 4]);
    });
    srow(ws, ["TOTAL", inr(totalRev), String(bills.length), inr(bills.length ? Math.round(totalRev / bills.length) : 0), "", ""], T.redLt);
    section(ws, "ORDER SPLIT", 6);
    thead(ws, ["Order Type", "Count", "Revenue (₹)", "Revenue %", "Avg Bill (₹)", ""]);
    Object.entries(otMap).sort((a, b) => b[1].rev - a[1].rev).forEach(([t, d], i) => {
      drow(ws, [t, d.count, d.rev, pct(d.rev, totalRev), d.count ? Math.round(d.rev / d.count) : 0, ""], i % 2 === 0, [2, 3, 5]);
    });
    section(ws, "PAYMENT SPLIT", 6);
    thead(ws, ["Payment Method", "Bills", "Revenue (₹)", "Revenue %", "Avg Bill (₹)", ""]);
    Object.entries(payMap).sort((a, b) => b[1].rev - a[1].rev).forEach(([m, d], i) => {
      drow(ws, [m, d.count, d.rev, pct(d.rev, totalRev), d.count ? Math.round(d.rev / d.count) : 0, ""], i % 2 === 0, [2, 3, 5]);
    });
    section(ws, "TOP SELLING ITEMS", 6);
    thead(ws, ["#", "Item Name", "Qty Sold", "Revenue (₹)", "Category", "Sales %"]);
    topItems.slice(0, 30).forEach(([name, d], i) => {
      drow(ws, [i + 1, i < 3 ? `${["🥇","🥈","🥉"][i]} ${name}` : name, d.qty, d.rev, d.cat, pct(d.rev, totalRev)], i % 2 === 0, [3, 4]);
    });
  }

  // ════════════════════════════════════════════════════
  // SHEET 4 — REVENUE & ORDERS
  // ════════════════════════════════════════════════════
  {
    const ws = newSheet(wb, "💰 Revenue & Orders", [18, 20, 12, 18, 16, 20]);
    title(ws, "Revenue & Orders", `${meta.from} → ${meta.to}`, 6);
    section(ws, "DAILY REVENUE & ORDERS", 6);
    thead(ws, ["Date", "Revenue (₹)", "Orders", "Avg Bill (₹)", "YoY %", "Notes"]);
    dailyArr.forEach(([d, v], i) => drow(ws, [d, v.rev, v.orders, v.orders ? Math.round(v.rev / v.orders) : 0, "—", ""], i % 2 === 0, [2, 4]));
    srow(ws, ["TOTAL", inr(totalRev), bills.length, bills.length ? Math.round(totalRev / bills.length) : 0, "", ""], T.redLt);
    section(ws, "HOURLY ANALYTICS", 6);
    thead(ws, ["Hour", "Revenue (₹)", "Orders", "Avg Bill (₹)", "Revenue %", ""]);
    const hourlyData = Object.entries(analytics.hourlyAnalytics || {}).sort((a, b) => Number(a[0]) - Number(b[0]));
    hourlyData.forEach(([h, d]: any, i) => {
      const label = Number(h) === 0 ? "12 AM" : Number(h) < 12 ? `${h} AM` : Number(h) === 12 ? "12 PM" : `${Number(h) - 12} PM`;
      drow(ws, [label, d.revenue, d.orders, d.orders ? Math.round(d.revenue / d.orders) : 0, pct(d.revenue, totalRev), ""], i % 2 === 0, [2, 4]);
    });
  }

  // ════════════════════════════════════════════════════
  // SHEET 5 — BILLING OVERVIEW
  // ════════════════════════════════════════════════════
  {
    const ws = newSheet(wb, "🧾 Billing Overview", [22, 14, 20, 16, 14, 12, 12, 12, 14, 12, 18]);
    title(ws, "Billing Overview", `${bills.length} bills · ${meta.from} → ${meta.to}`, 11);
    section(ws, "BILLING KPIs", 6);
    [["Total Revenue", inr(totalRev), T.red], ["Total Orders", String(bills.length), T.blue],
     ["Avg Bill Value", inr(bills.length ? Math.round(totalRev / bills.length) : 0), T.purple],
     ["Paid Bills", String(paidBills.length), T.green], ["GST Collected", inr(totalGST), T.amber]].forEach(([l, v, c]) => kpi(ws, l as string, v as string, c as string));
    section(ws, "RECENT BILLS", 11);
    thead(ws, ["Bill No", "Date", "Customer", "Order Type", "Payment", "Subtotal", "GST", "Discount", "Total", "Status", "Time"]);
    bills.forEach((b: any, i: number) => {
      const r = drow(ws, [b.billNo || `#${b.id}`, new Date(b.createdAt).toLocaleDateString("en-IN"), b.customer?.name || "Guest", (b.orderType || "").replace("_", " "), b.paymentMethod || "—", n(b.subtotal), n(b.cgst) + n(b.sgst), n(b.discount), n(b.total), b.status || "—", new Date(b.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })], i % 2 === 0, [6, 7, 8, 9]);
      if (b.status === "PAID") r.getCell(10).font = { bold: true, size: 8.5, color: { argb: T.green } };
      else if (b.status === "UNPAID") r.getCell(10).font = { bold: true, size: 8.5, color: { argb: T.redDk } };
    });
    srow(ws, ["TOTALS", "", `${bills.length} bills`, "", "", bills.reduce((s, b) => s + n(b.subtotal), 0), totalGST, totalDisc, totalRev, `${paidBills.length} paid`, ""], T.redLt);
  }

  // ════════════════════════════════════════════════════
  // SHEET 6 — CUSTOMER OVERVIEW
  // ════════════════════════════════════════════════════
  {
    const ws = newSheet(wb, "👥 Customer Overview", [24, 16, 12, 18, 16, 20, 16, 14]);
    title(ws, "Customer Overview", `${customers.length} customers · all-time data`, 8);
    section(ws, "CUSTOMER KPIs", 5);
    [["Total Customers", String(customers.length), T.blue], ["Repeat Customers", String(customers.filter((c: any) => c.visits > 1).length), T.green],
     ["Avg Spend", inr(avgCLV), T.purple], ["Total Revenue", inr(customers.reduce((s: number, c: any) => s + n(c.spend), 0)), T.red]].forEach(([l, v, c]) => kpi(ws, l as string, v as string, c as string));
    section(ws, "CUSTOMER INSIGHTS TABLE", 8);
    thead(ws, ["Customer Name", "Phone", "Visits", "Avg Bill (₹)", "Total Spend (₹)", "Preferred Order", "Last Visit", "Segment"]);
    customers.sort((a: any, b: any) => b.spend - a.spend).forEach((c: any, i: number) => {
      const seg = c.spend > 5000 ? "VIP" : c.visits > 3 ? "Regular" : "New";
      const r = drow(ws, [c.name, c.phone, c.visits, c.visits ? Math.round(n(c.spend) / c.visits) : 0, c.spend, c.preferredOrderType || "—", c.lastVisit ? new Date(c.lastVisit).toLocaleDateString("en-IN") : "—", rfmMap[c.phone]?.segment || seg], i % 2 === 0, [4, 5]);
      const segC: Record<string, string> = { Champion: T.green, Loyal: T.blue, Potential: T.purple, "At Risk": T.amber, Lost: T.redDk, VIP: T.green, Regular: T.blue, New: T.s500 };
      const sc = r.getCell(8);
      sc.font = { bold: true, size: 8.5, color: { argb: segC[rfmMap[c.phone]?.segment || seg] || T.s600 } };
    });
  }

  // ════════════════════════════════════════════════════
  // SHEET 7 — CUSTOMER CHURN
  // ════════════════════════════════════════════════════
  {
    const ws = newSheet(wb, "🔄 Customer Churn", [24, 16, 14, 18, 16, 12, 16]);
    title(ws, "Customer Churn Analysis", "Active · At Risk · Churned customer segmentation", 7);
    section(ws, "CHURN KPIs", 5);
    [["Active (≤30 days)", String(activeC.length), T.green], ["At Risk (30–90 days)", String(atRiskC.length), T.amber],
     ["Churned (90+ days)", String(churnedC.length), T.redDk], ["Avg CLV", inr(avgCLV), T.purple]].forEach(([l, v, c]) => kpi(ws, l as string, v as string, c as string));
    section(ws, "TOP CUSTOMERS BY SPEND", 7, T.blue);
    thead(ws, ["Customer", "Phone", "Total Spend (₹)", "Visits", "Avg Bill (₹)", "Last Visit", "Segment"], T.blue);
    customers.sort((a: any, b: any) => b.spend - a.spend).slice(0, 20).forEach((c: any, i: number) => {
      drow(ws, [c.name, c.phone, c.spend, c.visits, c.visits ? Math.round(n(c.spend) / c.visits) : 0, c.lastVisit ? new Date(c.lastVisit).toLocaleDateString("en-IN") : "—", rfmMap[c.phone]?.segment || "—"], i % 2 === 0, [3, 5]);
    });
    section(ws, "AT RISK CUSTOMERS (30–90 days)", 7, T.amber);
    thead(ws, ["Customer", "Phone", "Last Visit", "Days Since", "Total Spend (₹)", "Visits", "Avg Bill (₹)"], T.amber);
    atRiskC.sort((a: any, b: any) => a.spend - b.spend).forEach((c: any, i: number) => {
      const days = c.lastVisit ? Math.floor((now - new Date(c.lastVisit).getTime()) / 86400000) : 999;
      drow(ws, [c.name, c.phone, c.lastVisit ? new Date(c.lastVisit).toLocaleDateString("en-IN") : "—", days, c.spend, c.visits, c.visits ? Math.round(n(c.spend) / c.visits) : 0], i % 2 === 0, [5, 7]);
    });
    section(ws, "CHURNED CUSTOMERS (90+ days)", 7, T.redDk);
    thead(ws, ["Customer", "Phone", "Total Visits", "Total Spend (₹)", "Last Visit", "Days Since", "Avg Bill (₹)"], T.redDk);
    churnedC.sort((a: any, b: any) => b.spend - a.spend).forEach((c: any, i: number) => {
      const days = c.lastVisit ? Math.floor((now - new Date(c.lastVisit).getTime()) / 86400000) : 999;
      drow(ws, [c.name, c.phone, c.visits, c.spend, c.lastVisit ? new Date(c.lastVisit).toLocaleDateString("en-IN") : "Never", days, c.visits ? Math.round(n(c.spend) / c.visits) : 0], i % 2 === 0, [4, 7]);
    });
  }

  // ════════════════════════════════════════════════════
  // SHEET 8 — CUSTOMER RFM
  // ════════════════════════════════════════════════════
  {
    const ws = newSheet(wb, "🎯 Customer RFM", [24, 16, 16, 10, 10, 10, 12, 16, 12, 16]);
    title(ws, "Customer RFM Analysis", "Recency · Frequency · Monetary scoring model", 10);
    section(ws, "SEGMENT OVERVIEW", 6);
    [["Champion", T.green], ["Loyal", T.blue], ["Potential", T.purple], ["At Risk", T.amber], ["Lost", T.redDk]].forEach(([seg, c]) => {
      kpi(ws, `${seg} Customers`, `${segCounts[seg] || 0} customers  |  ₹${((rfm?.segmentRevenue?.[seg] || 0)).toLocaleString("en-IN")} revenue`, c as string);
    });
    section(ws, "RFM SCORING EXPLANATION", 6);
    const expRow = ws.addRow(["R = Recency (1–5): days since last visit  ·  F = Frequency (1–5): total visits  ·  M = Monetary (1–5): total spend  ·  Total 13–15 = Champion · 10–12 = Loyal · 7–9 = Potential · 5–6 = At Risk · 3–4 = Lost"]);
    expRow.getCell(1).font = { size: 8.5, italic: true, color: { argb: T.s600 } };
    expRow.height = 14; ws.mergeCells(expRow.number, 1, expRow.number, 10);
    ws.addRow([]);
    section(ws, "FULL RFM CUSTOMER TABLE", 10);
    thead(ws, ["Customer", "Phone", "Segment", "R Score", "F Score", "M Score", "Total /15", "Last Visit", "Visits", "Spend (₹)"]);
    const segColors: Record<string, string> = { Champion: T.green, Loyal: T.blue, Potential: T.purple, "At Risk": T.amber, Lost: T.redDk };
    (rfm?.customers || []).forEach((c: any, i: number) => {
      const r = drow(ws, [c.name, c.phone, c.segment, c.R, c.F, c.M, `${c.rfm}/15`, c.lastVisit ? new Date(c.lastVisit).toLocaleDateString("en-IN") : "—", c.frequency, c.monetary], i % 2 === 0, [10]);
      r.getCell(3).font = { bold: true, size: 8.5, color: { argb: segColors[c.segment] || T.s600 } };
    });
  }

  // ════════════════════════════════════════════════════
  // SHEET 9 — MENU ANALYTICS
  // ════════════════════════════════════════════════════
  {
    const ws = newSheet(wb, "🍽️ Menu Analytics", [28, 14, 18, 18, 16, 16]);
    title(ws, "Menu Analytics", "Ingredient intelligence, food cost and operational metrics", 6);
    section(ws, "MENU KPIs", 5);
    const invVal = (data.ingredients as any[]).reduce((s, i) => s + n(i.quantity) * n(i.pricePerUnit), 0);
    [["Inventory Value", inr(invVal), T.blue], ["Total Ingredients", String((data.ingredients as any[]).length), T.purple],
     ["Mapped Items", String(mappedItems.length), T.green], ["Unmapped Items", String(menuItems.length - mappedItems.length), T.amber]].forEach(([l, v, c]) => kpi(ws, l as string, v as string, c as string));
    section(ws, "INGREDIENT INTELLIGENCE — CONSUMPTION", 6);
    thead(ws, ["Ingredient", "Category", "Stock Qty", "Unit", "Price/Unit (₹)", "Total Value (₹)"]);
    (data.ingredients as any[]).sort((a, b) => n(b.quantity) * n(b.pricePerUnit) - n(a.quantity) * n(a.pricePerUnit)).forEach((ing: any, i: number) => {
      drow(ws, [ing.name, ing.category?.name || "—", ing.quantity || 0, ing.unit || "—", ing.pricePerUnit || 0, (n(ing.quantity) * n(ing.pricePerUnit)).toFixed(2)], i % 2 === 0, [3, 5, 6]);
    });
    section(ws, "OPERATIONAL ALERTS", 6);
    thead(ws, ["Alert Type", "Item", "Detail", "Priority", "", ""]);
    [["Highest Usage Item", topItems[0]?.[0] || "—", `${topItems[0]?.[1]?.qty || 0} units sold`, "HIGH", "", ""],
     ["Top Revenue Item", topItems[0]?.[0] || "—", inr(topItems[0]?.[1]?.rev), "HIGH", "", ""],
     ["Inventory Status", invVal > 0 ? "✅ Healthy" : "⚠️ Low Stock", `₹${invVal.toLocaleString("en-IN")} value`, invVal > 0 ? "OK" : "WARN", "", ""],
    ].forEach((row, i) => drow(ws, row, i % 2 === 0));
  }

  // ════════════════════════════════════════════════════
  // SHEET 10 — MENU ENGINEERING
  // ════════════════════════════════════════════════════
  {
    const ws = newSheet(wb, "⚙️ Menu Engineering", [30, 18, 14, 16, 14, 14, 12]);
    title(ws, "Menu Engineering Matrix", "Stars · Puzzles · Plowhorses · Dogs", 7);
    section(ws, "QUADRANT EXPLANATION", 7);
    [["⭐ Stars", "High popularity + High margin → Promote heavily"], ["🧩 Puzzles", "Low popularity + High margin → Better marketing"],
     ["🐎 Plowhorses", "High popularity + Low margin → Reprice or reduce cost"], ["🐕 Dogs", "Low popularity + Low margin → Consider removing"]].forEach(([q, desc]) => {
      const r = ws.addRow([q, desc]); r.height = 14;
      r.getCell(1).font = { bold: true, size: 9 }; r.getCell(2).font = { size: 8.5, color: { argb: T.s600 } };
    });
    section(ws, "ALL MENU ITEMS — ENGINEERING ANALYSIS", 7);
    thead(ws, ["Item Name", "Category", "Qty Sold", "Revenue (₹)", "Food Cost (₹)", "Margin %", "Quadrant"]);
    const medianQty = itemsSales.length > 0 ? itemsSales[Math.floor(itemsSales.length / 2)].qty : 0;
    const medianMargin = itemsSales.length > 0 ? parseFloat(itemsSales.map(i => parseFloat(i.margin as string) || 0).sort((a, b) => a - b)[Math.floor(itemsSales.length / 2)].toFixed(1)) : 50;
    const quadColors: Record<string, string> = { "⭐ Star": T.green, "🧩 Puzzle": T.blue, "🐎 Plowhorse": T.amber, "🐕 Dog": T.redDk };
    itemsSales.forEach((item, i) => {
      const marg = parseFloat(item.margin as string) || 0;
      const hiQty = item.qty >= medianQty;
      const hiMargin = marg >= medianMargin;
      const quad = hiQty && hiMargin ? "⭐ Star" : !hiQty && hiMargin ? "🧩 Puzzle" : hiQty && !hiMargin ? "🐎 Plowhorse" : "🐕 Dog";
      const r = drow(ws, [item.name, item.cat, item.qty, item.rev, item.cost, `${item.margin}%`, quad], i % 2 === 0, [3, 4]);
      r.getCell(7).font = { bold: true, size: 8.5, color: { argb: quadColors[quad] || T.s600 } };
    });
  }

  // ════════════════════════════════════════════════════
  // SHEET 11 — INSIGHTS DASHBOARD
  // ════════════════════════════════════════════════════
  {
    const ws = newSheet(wb, "💹 Insights Dashboard", [28, 20, 18, 16, 16]);
    title(ws, "Insights Dashboard", "EBITDA · Profitability · Revenue targets · Expense distribution", 5);
    section(ws, "INSIGHTS KPIs", 5);
    [["Revenue (Monthly)", inr(insRev), T.red], ["Net Profit (Est.)", inr(insRev - fixedExp - varExp - labourExp - finExp), T.green],
     ["EBITDA %", `${ebitda}%`, T.purple], ["Prime Cost %", insRev > 0 ? pct(varExp + labourExp, insRev) : "0%", T.amber]].forEach(([l, v, c]) => kpi(ws, l as string, v as string, c as string));
    section(ws, "PROFITABILITY HEALTH", 5);
    thead(ws, ["Metric", "Current", "Target", "Gap", "Status"]);
    [
      ["EBITDA %", `${ebitda}%`, `${ins.targetEbitda || 0}%`, `${(parseFloat(ebitda) - (ins.targetEbitda || 0)).toFixed(1)}%`, parseFloat(ebitda) >= (ins.targetEbitda || 0) ? "✅ Healthy" : "❌ Critical"],
      ["Food Cost %", pct(varExp, insRev), `${ins.targetFoodCost || 0}%`, "—", "📋"],
      ["Gross Margin %", insRev > 0 ? pct(insRev - varExp, insRev) : "0%", `${ins.targetGrossMargin || 0}%`, "—", "📋"],
      ["Prime Cost %", insRev > 0 ? pct(varExp + labourExp, insRev) : "0%", `${ins.targetPrimeCost || 0}%`, "—", "📋"],
    ].forEach((row, i) => drow(ws, row, i % 2 === 0));
    section(ws, "REVENUE TARGETS (EBITDA SCENARIOS)", 5);
    thead(ws, ["EBITDA Target %", "Revenue Required (₹)", "Current Revenue (₹)", "Gap (₹)", "Status"]);
    [0, 5, 10, 15, 20, 25].forEach((target, i) => {
      const req  = (fixedExp + varExp + labourExp + finExp) / (1 - target / 100);
      const gap  = req - insRev;
      const done = gap <= 0;
      const r = drow(ws, [`${target}% EBITDA`, inr(req), inr(insRev), done ? "—" : `+${inr(gap)}`, done ? "✅ Achieved" : "❌ Gap"], i % 2 === 0, [2, 3, 4]);
      if (done) r.eachCell(c => { c.font = { bold: true, size: 8.5, color: { argb: T.green } }; c.fill = fill(T.greenLt); });
    });
    section(ws, "EXPENSE DISTRIBUTION", 5);
    thead(ws, ["Expense Category", "Amount (₹)", "% of Total Expenses", "Notes", ""]);
    const totalAllExp = fixedExp + varExp + labourExp + finExp;
    [["Fixed Expenses", fixedExp, "Rent, EMI, Internet, Insurance"],
     ["Variable Expenses", varExp, "Utilities, Delivery, Packaging"],
     ["Labour Cost", labourExp, "Staff salaries"],
     ["Finance & Tax", finExp, "Loans, CA fees, Insurance, Taxes"]].forEach(([l, v, note], i) => {
      drow(ws, [l, inr(v), pct(v as number, totalAllExp), note, ""], i % 2 === 0, [2]);
    });
    srow(ws, ["TOTAL", inr(totalAllExp), "100%", "", ""], T.redLt);
  }

  // ════════════════════════════════════════════════════
  // SHEETS 12–18: Financial reports
  // ════════════════════════════════════════════════════

  // P&L Statement
  {
    const ws = newSheet(wb, "📋 P&L Statement", [32, 22, 18, 20, 18]);
    title(ws, "P&L Statement", `${meta.from} → ${meta.to}`, 5);
    section(ws, "REVENUE SECTION", 5, T.green);
    thead(ws, ["Line Item", "Amount (₹)", "% of Gross", "Notes", ""], T.green);
    [["Gross Revenue (all bills)", inr(gross), "100.0%", "Before discounts", ""],
     ["(−) Discounts Given", `−${inr(totalDisc)}`, `−${pct(totalDisc, gross)}`, "Revenue reduction", ""],
     ["Net Revenue", inr(totalRev), pct(totalRev, gross), "After discounts", ""],
     ["Service Charges Collected", inr(bills.reduce((s, b) => s + n(b.serviceCharge), 0)), "—", "Service charges", ""]].forEach((row, i) => drow(ws, row, i % 2 === 0, [2]));
    section(ws, "TAX SECTION", 5, T.amber);
    thead(ws, ["Tax Type", "Amount (₹)", "% of Net Revenue", "Notes", ""], T.amber);
    [["CGST", inr(bills.reduce((s, b) => s + n(b.cgst), 0)), pct(bills.reduce((s, b) => s + n(b.cgst), 0), totalRev), "Central GST", ""],
     ["SGST", inr(bills.reduce((s, b) => s + n(b.sgst), 0)), pct(bills.reduce((s, b) => s + n(b.sgst), 0), totalRev), "State GST", ""],
     ["Total GST", inr(totalGST), pct(totalGST, totalRev), "Total tax collected", ""]].forEach((row, i) => drow(ws, row, i % 2 === 0, [2]));
    section(ws, "EXPENSE SECTION", 5, T.purple);
    thead(ws, ["Expense Category", "Amount (₹)", "% of Revenue", "Entries", ""], T.purple);
    Object.entries(expByType).sort((a, b) => b[1] - a[1]).forEach(([type, amt], i) => {
      const cnt = expenses.filter(e => (e.expenseType || "Other") === type).length;
      drow(ws, [type, inr(amt), pct(amt, totalRev), String(cnt), ""], i % 2 === 0, [2]);
    });
    srow(ws, ["TOTAL EXPENSES", inr(totalExp), pct(totalExp, totalRev), String(expenses.length), ""], T.purpleLt, T.purple);
    section(ws, "NET RESULT", 5, netProfit >= 0 ? T.green : T.redDk);
    srow(ws, ["ESTIMATED NET PROFIT / LOSS", inr(netProfit), pct(netProfit, totalRev), "Revenue − GST − Expenses", ""], netProfit >= 0 ? T.greenLt : T.lossRed, netProfit >= 0 ? T.greenDk : T.lossText);
  }

  // Tax Report
  {
    const ws = newSheet(wb, "🏛️ Tax Report", [22, 14, 18, 14, 14, 14, 14, 14, 12]);
    title(ws, "Tax Report (GST)", `CGST + SGST breakdown · ${meta.from} → ${meta.to}`, 9);
    section(ws, "TAX KPIs", 5);
    const cgstTotal = bills.reduce((s, b) => s + n(b.cgst), 0);
    const sgstTotal = bills.reduce((s, b) => s + n(b.sgst), 0);
    [["Total CGST", inr(cgstTotal), T.blue], ["Total SGST", inr(sgstTotal), T.purple],
     ["Total GST", inr(totalGST), T.red], ["Taxable Revenue", inr(totalRev - totalGST), T.green]].forEach(([l, v, c]) => kpi(ws, l as string, v as string, c as string));
    section(ws, "GST BILL-WISE BREAKDOWN", 9);
    thead(ws, ["Bill No", "Date", "Order Type", "Subtotal (₹)", "CGST (₹)", "SGST (₹)", "Total GST (₹)", "Total (₹)", "Status"]);
    bills.forEach((b: any, i: number) => {
      drow(ws, [b.billNo || `#${b.id}`, new Date(b.createdAt).toLocaleDateString("en-IN"), (b.orderType || "").replace("_", " "), n(b.subtotal), n(b.cgst), n(b.sgst), n(b.cgst) + n(b.sgst), n(b.total), b.status || "—"], i % 2 === 0, [4, 5, 6, 7, 8]);
    });
    srow(ws, ["TOTALS", "", "", bills.reduce((s, b) => s + n(b.subtotal), 0), cgstTotal, sgstTotal, totalGST, totalRev, `${paidBills.length} paid`], T.amberLt, T.amber);
  }

  // Expense Tracker
  {
    const ws = newSheet(wb, "💸 Expense Tracker", [28, 18, 14, 18, 22]);
    title(ws, "Expense Tracker", `${expenses.length} entries · Total: ${inr(totalExp)}`, 5);
    section(ws, "EXPENSE KPIs", 5);
    [["Total Expenses", inr(totalExp), T.purple], ["Expense Categories", String(Object.keys(expByType).length), T.blue],
     ["Avg per Entry", inr(expenses.length ? Math.round(totalExp / expenses.length) : 0), T.amber],
     ["Expense/Revenue Ratio", pct(totalExp, totalRev), totalExp / totalRev < 0.3 ? T.green : T.redDk]].forEach(([l, v, c]) => kpi(ws, l as string, v as string, c as string));
    section(ws, "EXPENSE BY CATEGORY", 5, T.purple);
    thead(ws, ["Category", "Amount (₹)", "% of Total", "Entries", ""], T.purple);
    Object.entries(expByType).sort((a, b) => b[1] - a[1]).forEach(([type, amt], i) => {
      drow(ws, [type, inr(amt), pct(amt, totalExp), String(expenses.filter(e => (e.expenseType || "Other") === type).length), ""], i % 2 === 0, [2]);
    });
    section(ws, "EXPENSE LOG", 5, T.purple);
    thead(ws, ["Expense Name", "Category", "Date", "Amount (₹)", "Paid By"], T.purple);
    expenses.forEach((e: any, i: number) => {
      drow(ws, [e.title || "—", e.expenseType || "—", new Date(e.expenseDate || e.createdAt).toLocaleDateString("en-IN"), n(e.amount), e.paidByUser?.name || "—"], i % 2 === 0, [4]);
    });
    srow(ws, ["TOTAL EXPENSES", "", "", inr(totalExp), ""], T.purpleLt, T.purple);
  }

  // Sales Analytics
  {
    const ws = newSheet(wb, "📊 Sales Analytics", [24, 14, 18, 16, 16]);
    title(ws, "Sales Analytics", "Payment methods · Order channels · Bills summary", 5);
    section(ws, "PAYMENT METHOD REVENUE", 5, T.blue);
    thead(ws, ["Payment Method", "Bills", "Revenue (₹)", "Avg Bill (₹)", "Share %"], T.blue);
    Object.entries(payMap).sort((a, b) => b[1].rev - a[1].rev).forEach(([m, d], i) => {
      drow(ws, [m, d.count, inr(d.rev), inr(d.count ? Math.round(d.rev / d.count) : 0), pct(d.rev, totalRev)], i % 2 === 0, [2, 3, 4]);
    });
    section(ws, "ORDER CHANNEL PERFORMANCE", 5, T.blue);
    thead(ws, ["Channel", "Revenue (₹)", "Orders", "Avg Bill (₹)", "Revenue %"], T.blue);
    Object.entries(otMap).sort((a, b) => b[1].rev - a[1].rev).forEach(([t, d], i) => {
      drow(ws, [t, inr(d.rev), d.count, inr(d.count ? Math.round(d.rev / d.count) : 0), pct(d.rev, totalRev)], i % 2 === 0, [2, 4]);
    });
    section(ws, "BILLS SUMMARY TABLE", 5);
    thead(ws, ["Bill No", "Customer", "Order Type", "Payment", "Subtotal (₹)", "GST (₹)", "Discount (₹)", "Total (₹)", "Status"]);
    bills.forEach((b: any, i: number) => {
      const r = drow(ws, [b.billNo || `#${b.id}`, b.customer?.name || "Guest", (b.orderType || "").replace("_", " "), b.paymentMethod || "—", n(b.subtotal), n(b.cgst) + n(b.sgst), n(b.discount), n(b.total), b.status || "—"], i % 2 === 0, [5, 6, 7, 8]);
      if (b.status === "PAID") r.getCell(9).font = { bold: true, size: 8.5, color: { argb: T.green } };
    });
  }

  // Discount Analysis
  {
    const ws = newSheet(wb, "🏷️ Discount Analysis", [22, 14, 20, 16, 14, 14, 14, 12]);
    title(ws, "Discount Analysis", "Track every discount — identify patterns, prevent abuse", 8);
    section(ws, "DISCOUNT KPIs", 5);
    const discBills = bills.filter(b => n(b.discount) > 0);
    [["Total Discounts", inr(totalDisc), T.amber], ["Bills with Discount", String(discBills.length), T.blue],
     ["Avg Discount/Bill", inr(discBills.length ? Math.round(totalDisc / discBills.length) : 0), T.purple],
     ["Discount % of Revenue", pct(totalDisc, gross), totalDisc / gross < 0.05 ? T.green : T.redDk]].forEach(([l, v, c]) => kpi(ws, l as string, v as string, c as string));
    section(ws, "DISCOUNT BREAKDOWN TABLE", 8, T.amber);
    thead(ws, ["Bill No", "Date", "Customer", "Order Type", "Gross Total (₹)", "Discount (₹)", "Net Total (₹)", "Discount %"], T.amber);
    discBills.sort((a: any, b: any) => n(b.discount) - n(a.discount)).forEach((b: any, i: number) => {
      const g = n(b.total) + n(b.discount);
      const dp = g > 0 ? ((n(b.discount) / g) * 100).toFixed(1) : "0";
      const r = drow(ws, [b.billNo || `#${b.id}`, new Date(b.createdAt).toLocaleDateString("en-IN"), b.customer?.name || "Guest", (b.orderType || "").replace("_", " "), inr(g), inr(b.discount), inr(b.total), `${dp}%`], i % 2 === 0, [5, 6, 7]);
      if (parseFloat(dp) > 20) r.eachCell(c => { c.fill = fill(T.lossRed); });
    });
    srow(ws, ["TOTALS", "", `${discBills.length} bills`, "", inr(gross + totalDisc), inr(totalDisc), inr(totalRev - totalDisc), pct(totalDisc, gross)], T.amberLt, T.amber);
  }

  // Table Analytics
  {
    const ws = newSheet(wb, "🪑 Table Analytics", [22, 14, 16, 18, 18, 14]);
    title(ws, "Table Analytics", "Turn rate · Revenue per table · Occupancy", 6);
    const tableTurnData = kitchenData?.tableTurnData || [];
    const totalTableRev = tableTurnData.reduce((s: number, t: any) => s + n(t.totalMins), 0);
    section(ws, "TABLE KPIs", 5);
    [["Tables Active", String(tableTurnData.length), T.blue],
     ["Avg Turn Time", `${kitchenData?.summary?.avgTime || 0} min`, T.amber],
     ["Total Orders", String(tableTurnData.reduce((s: number, t: any) => s + n(t.count), 0)), T.green]].forEach(([l, v, c]) => kpi(ws, l as string, v as string, c as string));
    section(ws, "TABLE PERFORMANCE SUMMARY", 6);
    thead(ws, ["Table", "Orders", "Avg Turn Time (min)", "Revenue (₹)", "Avg Revenue/Order (₹)", "Performance"]);
    const totalTableRevAll = tableTurnData.reduce((s: number, t: any) => s + n(t.totalMins), 0);
    tableTurnData.sort((a: any, b: any) => b.count - a.count).forEach((t: any, i: number) => {
      const perf = t.count > (tableTurnData.reduce((s: number, x: any) => s + x.count, 0) / Math.max(tableTurnData.length, 1)) ? "High" : "Normal";
      const r = drow(ws, [t.name || t.tableName, t.count, t.avgTime, "—", "—", perf], i % 2 === 0);
      if (perf === "High") r.getCell(6).font = { bold: true, size: 8.5, color: { argb: T.green } };
    });
  }

  // Waste Report
  {
    const ws = newSheet(wb, "🗑️ Waste Report", [18, 22, 18, 16, 20, 20]);
    title(ws, "Waste & Inventory Report", `${inventoryAdjustments.length} adjustments logged`, 6);
    section(ws, "WASTE KPIs", 5);
    const wastage = inventoryAdjustments.filter(a => a.adjustmentType === "WASTAGE" || a.adjustmentType === "EXPIRED");
    const damage  = inventoryAdjustments.filter(a => a.adjustmentType === "DAMAGE");
    [["Total Adjustments", String(inventoryAdjustments.length), T.s600], ["Wastage/Expired", String(wastage.length), T.amber],
     ["Damage", String(damage.length), T.redDk], ["Unique Ingredients", String(Object.keys(wasteByIng).length), T.purple]].forEach(([l, v, c]) => kpi(ws, l as string, v as string, c as string));
    section(ws, "TOP WASTED INGREDIENTS", 6, T.amber);
    thead(ws, ["Ingredient", "Total Qty Wasted", "Adjustments", "Avg Per Entry", "", ""], T.amber);
    Object.entries(wasteByIng).sort((a, b) => b[1].qty - a[1].qty).slice(0, 20).forEach(([name, d], i) => {
      drow(ws, [name, d.qty.toFixed(2), d.adj, d.adj > 0 ? (d.qty / d.adj).toFixed(2) : 0, "", ""], i % 2 === 0, [2, 4]);
    });
    section(ws, "ADJUSTMENT LOG", 6);
    thead(ws, ["Date", "Ingredient", "Type", "Quantity", "Reason", "Updated By"]);
    inventoryAdjustments.forEach((a: any, i: number) => {
      const r = drow(ws, [new Date(a.createdAt).toLocaleDateString("en-IN"), a.ingredient?.name || "—", a.adjustmentType || "—", n(a.quantity).toFixed(2), a.reason || "—", a.updatedBy?.name || "—"], i % 2 === 0, [4]);
      const typeColors: Record<string, string> = { WASTAGE: T.amber, DAMAGE: T.redDk, EXPIRED: T.purple, MANUAL: T.s500 };
      r.getCell(3).font = { bold: true, size: 8.5, color: { argb: typeColors[a.adjustmentType] || T.s600 } };
    });
  }

  // ════════════════════════════════════════════════════
  // SHEETS 19–21: Heatmap, Day Analysis, Forecast
  // ════════════════════════════════════════════════════

  // Hourly Heatmap
  {
    const ws = newSheet(wb, "⏰ Hourly Heatmap", [18, 18, 14, 18, 16, 20]);
    title(ws, "Hourly Revenue Heatmap", "Revenue patterns by hour and day of week", 6);
    const hd = heatmap?.hourlyData || [];
    const dd = heatmap?.dailyData || [];
    const ph = heatmap?.peakHour || {};
    const pd = heatmap?.peakDay || {};
    section(ws, "HEATMAP KPIs", 5);
    [["Peak Hour", ph.label || "—", T.red], ["Best Day", pd.name || "—", T.blue],
     ["Peak Hour Orders", String(ph.orders || 0), T.green], ["Best Day Orders", String(pd.orders || 0), T.purple]].forEach(([l, v, c]) => kpi(ws, l as string, v as string, c as string));
    section(ws, "REVENUE BY HOUR", 6);
    thead(ws, ["Hour", "Revenue (₹)", "Orders", "Avg Bill (₹)", "Revenue %", "Peak?"]);
    hd.filter((h: any) => h.hour >= 6).forEach((h: any, i: number) => {
      const r = drow(ws, [h.label, h.revenue, h.orders, h.orders ? Math.round(h.revenue / h.orders) : 0, pct(h.revenue, hd.reduce((s: number, x: any) => s + x.revenue, 0)), h.revenue === ph.revenue ? "🔥 Peak" : ""], i % 2 === 0, [2, 4]);
      if (h.revenue === ph.revenue) r.eachCell(c => { c.fill = fill(T.redXLt); });
    });
    section(ws, "REVENUE BY DAY OF WEEK", 6, T.blue);
    thead(ws, ["Day", "Revenue (₹)", "Orders", "Avg Bill (₹)", "Revenue %", "Best?"], T.blue);
    const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    dd.forEach((d: any, i: number) => {
      const r = drow(ws, [d.name || DAY_NAMES[d.day], d.revenue, d.orders, d.orders ? Math.round(d.revenue / d.orders) : 0, pct(d.revenue, dd.reduce((s: number, x: any) => s + x.revenue, 0)), d.revenue === pd.revenue ? "⭐ Best" : ""], i % 2 === 0, [2, 4]);
      if (d.revenue === pd.revenue) r.eachCell(c => { c.fill = fill(T.blueLt); });
    });
  }

  // Day Analysis
  {
    const ws = newSheet(wb, "📅 Day Analysis", [18, 18, 14, 16, 16, 20]);
    title(ws, "Day of Week Analysis", "Revenue, orders and performance by day", 6);
    const dd = heatmap?.dailyData || [];
    const maxDayRev = Math.max(...dd.map((d: any) => d.revenue), 1);
    section(ws, "DAILY PERFORMANCE TABLE", 6);
    thead(ws, ["Day", "Revenue (₹)", "Orders", "Avg Bill (₹)", "Revenue Share %", "Performance"]);
    dd.forEach((d: any, i: number) => {
      const share = pct(d.revenue, dd.reduce((s: number, x: any) => s + x.revenue, 0));
      const perf = d.revenue === 0 ? "No Data" : d.revenue / maxDayRev >= 0.9 ? "Peak Day" : d.revenue / maxDayRev < 0.5 ? "Slow Day" : "Normal";
      const r = drow(ws, [d.name, d.revenue, d.orders, d.orders ? Math.round(d.revenue / d.orders) : 0, share, perf], i % 2 === 0, [2, 4]);
      if (perf === "Peak Day") r.eachCell(c => { c.fill = fill(T.greenLt); c.font = { bold: true, size: 8.5, color: { argb: T.greenDk } }; });
      else if (perf === "Slow Day") r.eachCell(c => { c.fill = fill(T.amberLt); });
    });
  }

  // Revenue Forecast
  {
    const ws = newSheet(wb, "📈 Revenue Forecast", [18, 22, 22, 22, 16]);
    title(ws, "Revenue Forecast", "7-day prediction · Rolling average · Growth trends", 5);
    const fSum = (forecast as any)?.summary || {};
    section(ws, "FORECAST KPIs", 5);
    [["Last 7-Day Avg", inr(fSum.avg7 || 0), T.blue], ["Prev 7-Day Avg", inr(fSum.avgPrev7 || 0), T.s600],
     ["W-o-W Growth", `${fSum.growthPercent >= 0 ? "+" : ""}${fSum.growthPercent || 0}%`, (fSum.growthPercent || 0) >= 0 ? T.green : T.redDk],
     ["7-Day Forecast Total", inr(fSum.forecastTotal || 0), T.purple]].forEach(([l, v, c]) => kpi(ws, l as string, v as string, c as string));
    section(ws, "30-DAY HISTORY", 5);
    thead(ws, ["Date", "Actual Revenue (₹)", "", "", ""]);
    ((forecast as any)?.history || []).forEach((f: any, i: number) => drow(ws, [f.date, f.revenue, "", "", ""], i % 2 === 0, [2]));
    section(ws, "7-DAY FORECAST TABLE", 5, T.purple);
    thead(ws, ["Date", "Predicted Revenue (₹)", "Lower Range (₹)", "Upper Range (₹)", "Confidence"], T.purple);
    ((forecast as any)?.forecast || []).forEach((f: any, i: number) => {
      drow(ws, [f.date, inr(f.predicted), inr(f.lower), inr(f.upper), "±15%"], i % 2 === 0, [2, 3, 4]);
    });
  }

  // ════════════════════════════════════════════════════
  // SHEETS 22–24: Attendance, Productivity, Cash
  // ════════════════════════════════════════════════════

  // Staff Attendance
  {
    const ws = newSheet(wb, "📋 Staff Attendance", [24, 16, 16, 14, 12, 12, 12, 14, 14]);
    title(ws, "Staff Attendance", `${allStaff.length} staff · Attendance register`, 9);
    const presentCount = new Set(attendance.filter(a => a.loginTime).map(a => a.userId)).size;
    const lateCount    = attendance.filter(a => a.loginTime && (new Date(a.loginTime).getHours() > 9 || (new Date(a.loginTime).getHours() === 9 && new Date(a.loginTime).getMinutes() > 15))).length;
    section(ws, "ATTENDANCE KPIs", 5);
    [["Total Staff", String(allStaff.length), T.blue], ["Present", String(presentCount), T.green],
     ["Absent", String(allStaff.length - presentCount), T.redDk], ["Late Arrivals", String(lateCount), T.amber],
     ["Total Hours", `${attendance.reduce((s, a) => s + n(a.totalHours), 0).toFixed(0)}h`, T.purple]].forEach(([l, v, c]) => kpi(ws, l as string, v as string, c as string));
    section(ws, "ATTENDANCE REGISTER", 9);
    thead(ws, ["Staff Name", "Phone", "Department", "Role", "Clock In", "Clock Out", "Break (min)", "Hours", "Status"]);
    allStaff.forEach((s: any, i: number) => {
      const att = attendance.find((a: any) => a.userId === s.id);
      const bm = (att?.breaks || []).reduce((sum: number, b: any) => sum + n(b.totalMinutes), 0);
      const isPresent = !!att?.loginTime;
      const isLate = isPresent && (new Date(att.loginTime).getHours() > 9 || (new Date(att.loginTime).getHours() === 9 && new Date(att.loginTime).getMinutes() > 15));
      const r = drow(ws, [s.name, s.phone || "—", s.department || "—", s.role, att?.loginTime ? new Date(att.loginTime).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "—", att?.logoutTime ? new Date(att.logoutTime).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "—", bm, n(att?.totalHours).toFixed(1), isPresent ? (isLate ? "Late" : "Present") : "Absent"], i % 2 === 0);
      const sc = r.getCell(9);
      if (isPresent && !isLate) sc.font = { bold: true, size: 8.5, color: { argb: T.green } };
      else if (isLate) sc.font = { bold: true, size: 8.5, color: { argb: T.amber } };
      else sc.font = { bold: true, size: 8.5, color: { argb: T.redDk } };
    });
  }

  // Staff Productivity
  {
    const ws = newSheet(wb, "⚡ Staff Productivity", [24, 16, 14, 14, 12, 14, 14, 14]);
    title(ws, "Staff Productivity", "Labour cost, shift efficiency and department breakdown", 8);
    const sp = staffProductivity || {};
    section(ws, "PRODUCTIVITY KPIs", 5);
    [["Total Staff", String(sp.totals?.totalStaff || allStaff.length), T.blue], ["Hours Worked", `${sp.totals?.totalHoursWorked || 0}h`, T.amber],
     ["Monthly Labour Cost", inr(sp.totals?.totalLabourCost || allStaff.reduce((s, st) => s + n(st.salary), 0)), T.redDk],
     ["Avg Hours/Staff", sp.totals?.totalStaff ? `${Math.round((sp.totals?.totalHoursWorked || 0) / sp.totals.totalStaff)}h` : "—", T.green]].forEach(([l, v, c]) => kpi(ws, l as string, v as string, c as string));
    section(ws, "REVENUE BY SHIFT", 5, T.amber);
    thead(ws, ["Shift", "Revenue (₹)", "% of Total", "", ""], T.amber);
    const srev = sp.shiftRevenue || {};
    const totalShiftRev = Object.values(srev).reduce((s: number, v: any) => s + n(v), 0);
    [["Morning (6–12 AM)", srev.morning], ["Afternoon (12–5 PM)", srev.afternoon], ["Evening (5–10 PM)", srev.evening], ["Night (10 PM–6 AM)", srev.night]].forEach(([shift, rev], i) => {
      drow(ws, [shift, inr(rev), pct(n(rev), totalShiftRev), "", ""], i % 2 === 0, [2]);
    });
    section(ws, "DEPARTMENT COST BREAKDOWN", 5, T.blue);
    thead(ws, ["Department", "Staff Count", "Hours Worked", "Avg Salary (₹)", "Total Salary (₹)", "", ""], T.blue);
    (sp.deptData || []).forEach((d: any, i: number) => {
      drow(ws, [d.dept, d.count, d.totalHours, inr(d.avgSalary), inr(d.totalSalary), "", ""], i % 2 === 0, [4, 5]);
    });
    section(ws, "STAFF EFFICIENCY TABLE", 8);
    thead(ws, ["Staff", "Dept", "Shift", "Days Present", "Hours", "Attendance %", "Salary (₹)", "Cost/Hour (₹)"]);
    (sp.staff || allStaff).forEach((s: any, i: number) => {
      drow(ws, [s.name, s.department || "—", s.shift || "—", s.daysPresent || "—", s.totalHours || "—", s.attendanceRate !== undefined ? `${s.attendanceRate}%` : "—", inr(s.monthlySalary || s.salary), s.costPerHour ? inr(s.costPerHour) : "—"], i % 2 === 0, [7, 8]);
    });
  }

  // Cash Reconciliation
  {
    const ws = newSheet(wb, "💵 Cash Reconciliation", [18, 20, 14, 16, 16, 16, 12, 16]);
    title(ws, "Cash Session Reconciliation", `${cashSessions.length} sessions`, 8);
    const shortfall = cashSessions.reduce((s, r) => s + Math.abs(Math.min(0, n(r.cashDifference))), 0);
    const surplus   = cashSessions.reduce((s, r) => s + Math.max(0, n(r.cashDifference)), 0);
    section(ws, "CASH KPIs", 5);
    [["Total Sessions", String(cashSessions.length), T.blue], ["Total Shortfall", inr(shortfall), T.redDk],
     ["Total Surplus", inr(surplus), T.green], ["Net Difference", inr(surplus - shortfall), surplus >= shortfall ? T.green : T.redDk]].forEach(([l, v, c]) => kpi(ws, l as string, v as string, c as string));
    section(ws, "SESSION HISTORY", 8);
    thead(ws, ["Date", "Opened By", "Open Time", "Close Time", "Opening (₹)", "Expected (₹)", "Actual (₹)", "Diff (₹)"]);
    cashSessions.forEach((s: any, i: number) => {
      const diff = n(s.cashDifference);
      const r = drow(ws, [new Date(s.businessDate).toLocaleDateString("en-IN"), s.openedBy?.name || "—", s.openedAt ? new Date(s.openedAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "—", s.closedAt ? new Date(s.closedAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "—", n(s.openingCash), n(s.expectedCash), n(s.actualCash || s.closingCash), diff], i % 2 === 0, [5, 6, 7, 8]);
      const dc = r.getCell(8);
      if (diff < 0) dc.font = { bold: true, size: 8.5, color: { argb: T.redDk } };
      else if (diff > 0) dc.font = { bold: true, size: 8.5, color: { argb: T.green } };
      else dc.font = { size: 8.5, color: { argb: T.s500 } };
    });
    srow(ws, ["TOTALS", "", "", "", cashSessions.reduce((s, r) => s + n(r.openingCash), 0), cashSessions.reduce((s, r) => s + n(r.expectedCash), 0), cashSessions.reduce((s, r) => s + n(r.actualCash || r.closingCash), 0), surplus - shortfall], T.greenLt, T.greenDk);
  }

  // ════════════════════════════════════════════════════
  // SHEETS 25–27: Kitchen, Branch, City
  // ════════════════════════════════════════════════════

  // Kitchen Analytics
  {
    const ws = newSheet(wb, "🔥 Kitchen Analytics", [24, 16, 18, 18, 16]);
    title(ws, "Kitchen Performance Analytics", "Order speed · SLA compliance · Throughput", 5, T.amber);
    const ks = kitchenData?.summary || {};
    section(ws, "KITCHEN KPIs", 5, T.amber);
    [["Total Orders", String(ks.totalOrders || 0), T.blue], ["Avg Completion", `${ks.avgTime || 0} min`, ks.avgTime <= 30 ? T.green : T.amber],
     ["SLA Compliance", `${ks.slaPercent || 0}%`, (ks.slaPercent || 0) >= 80 ? T.green : T.redDk],
     ["Fastest Order", `${ks.fastestOrder || 0} min`, T.green], ["Peak Hour", ks.peakHourLabel || "—", T.amber]].forEach(([l, v, c]) => kpi(ws, l as string, v as string, c as string));
    section(ws, "HOURLY THROUGHPUT", 5, T.amber);
    thead(ws, ["Hour", "Orders", "Avg Time (min)", "SLA Status", ""], T.amber);
    (kitchenData?.hourlyData || []).filter((h: any) => h.orders > 0).forEach((h: any, i: number) => {
      drow(ws, [h.label, h.orders, h.avgTime, h.avgTime <= 30 ? "✅ Within SLA" : "⚠️ Over SLA", ""], i % 2 === 0);
    });
    section(ws, "SPEED BY ORDER TYPE", 5, T.amber);
    thead(ws, ["Order Type", "Count", "Avg Time (min)", "SLA Status", ""], T.amber);
    (kitchenData?.orderTypeSpeeds || []).forEach((o: any, i: number) => {
      drow(ws, [o.type, o.count, o.avgTime, o.avgTime <= 30 ? "✅ Within SLA" : "⚠️ Over SLA", ""], i % 2 === 0);
    });
    section(ws, "TOP KITCHEN ITEMS", 5, T.amber);
    thead(ws, ["Item Name", "Times Prepared", "Kitchen Load %", "", ""], T.amber);
    const maxKit = (kitchenData?.topItems || [])[0]?.count || 1;
    (kitchenData?.topItems || []).slice(0, 20).forEach((item: any, i: number) => {
      drow(ws, [item.name, item.count, `${((item.count / maxKit) * 100).toFixed(1)}%`, "", ""], i % 2 === 0);
    });
    section(ws, "SLOWEST ORDERS", 5, T.redDk);
    thead(ws, ["Order ID", "Order Type", "Table", "Duration (min)", "Started At", "SLA Status"], T.redDk);
    (kitchenData?.slowestOrders || []).forEach((o: any, i: number) => {
      const r = drow(ws, [`#${o.id}`, (o.orderType || "").replace("_", " "), o.tableName || "—", o.durationMinutes, new Date(o.startedAt).toLocaleTimeString("en-IN"), o.durationMinutes <= 30 ? "✅ Met" : "❌ Missed"], i % 2 === 0);
      if (o.durationMinutes > 30) r.eachCell(c => { c.fill = fill(T.lossRed); });
    });
  }

  // Branch Comparison
  {
    const ws = newSheet(wb, "🏪 Branch Comparison", [24, 18, 12, 16, 14, 16, 14, 12]);
    title(ws, "Branch vs Branch Comparison", `${branchComparison.length} branches analysed`, 8, T.blue);
    section(ws, "BRANCH PERFORMANCE", 8, T.blue);
    thead(ws, ["Branch", "Revenue (₹)", "Orders", "Avg Bill (₹)", "GST (₹)", "Net Profit (₹)", "Staff", "Winner"], T.blue);
    const maxBRev = Math.max(...branchComparison.map(b => b.revenue), 1);
    branchComparison.forEach((b: any, i: number) => {
      const r = drow(ws, [b.branch?.name || "—", b.revenue, b.orders, b.orders ? Math.round(b.revenue / b.orders) : 0, b.gst, b.netProfit, b.staffCount, b.revenue === maxBRev ? "🏆 Top" : ""], i % 2 === 0, [2, 4, 5, 6]);
      if (b.revenue === maxBRev) r.eachCell(c => { c.fill = fill(T.greenLt); c.font = { bold: true, size: 8.5, color: { argb: T.greenDk } }; });
    });
  }

  // City Comparison
  {
    const ws = newSheet(wb, "🏙️ City Comparison", [20, 14, 18, 14, 16, 16, 14, 12]);
    title(ws, "City vs City Comparison", `${cityComparison.length} cities analysed`, 8, T.purple);
    if (cityComparison.length > 1) {
      section(ws, "CITY PERFORMANCE", 8, T.purple);
      thead(ws, ["City", "Branches", "Revenue (₹)", "Orders", "Avg Bill (₹)", "Net Profit (₹)", "Staff", "Winner"], T.purple);
      const maxCRev = Math.max(...cityComparison.map(c => c.revenue), 1);
      cityComparison.forEach((c: any, i: number) => {
        const r = drow(ws, [c.city || "—", c.branches?.length || 0, c.revenue, c.orders, c.orders ? Math.round(c.revenue / c.orders) : 0, c.netProfit, c.staffCount || "—", c.revenue === maxCRev ? "🏆 Top" : ""], i % 2 === 0, [3, 5, 6]);
        if (c.revenue === maxCRev) r.eachCell(c2 => { c2.fill = fill(T.purpleLt); c2.font = { bold: true, size: 8.5, color: { argb: T.purple } }; });
      });
    } else {
      ws.addRow([]); const nr = ws.addRow(["Only one city found. Add branches with different cities in Settings to enable city comparison."]);
      nr.getCell(1).font = { italic: true, size: 10, color: { argb: T.s500 } };
    }
  }

  return wb.xlsx.writeBuffer();
}
