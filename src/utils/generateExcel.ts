import ExcelJS from "exceljs";
import type { FullReportData } from "./reportData";

// ─── Design tokens ─────────────────────────────────────────────────────────
const T = {
  brand:    "FFB10000",   // DineInk #b10000
  brandLt:  "FFFEF2F2",  // very light red
  brandMd:  "FFFCA5A5",  // medium red
  ink:      "FF1E293B",   // dark body text
  slate:    "FF475569",
  muted:    "FF64748B",
  faint:    "FF94A3B8",
  border:   "FFE2E8F0",
  surface:  "FFF8FAFC",  // alt rows
  white:    "FFFFFFFF",
  green:    "FF059669",  greenDk: "FF047857", greenLt: "FFD1FAE5",
  blue:     "FF2563EB",  blueLt:  "FFDBEAFE",
  amber:    "FFB45309",  amberLt: "FFFEF3C7",
  purple:   "FF7C3AED",  purpleLt:"FFEDE9FE",
  teal:     "FF0D9488",  tealLt:  "FFCCFBF1",
  lossRed:  "FFFEE2E2",  lossText:"FFB91C1C",
  // aliases for backward-compat inside this file
  redDk:    "FF991B1B",
};

type ARGB = string;

// ─── Helpers ────────────────────────────────────────────────────────────────
const n = (v: any) => Number(v || 0);
const inr = (v: any) => `₹${n(v).toLocaleString("en-IN")}`;
const pct = (v: number, total: number) => total > 0 ? `${((v / total) * 100).toFixed(1)}%` : "0.0%";

function fill(argb: ARGB): ExcelJS.Fill {
  return { type: "pattern", pattern: "solid", fgColor: { argb } };
}
function bdr(style: ExcelJS.BorderStyle = "thin", c = T.border): Partial<ExcelJS.Borders> {
  const s = { style, color: { argb: c } };
  return { top: s, left: s, bottom: s, right: s };
}
function hairBdr(c = T.border): Partial<ExcelJS.Borders> {
  return { bottom: { style: "hair", color: { argb: c } } };
}

// ─── Sheet builders ─────────────────────────────────────────────────────────

function newSheet(wb: ExcelJS.Workbook, name: string, widths: number[]): ExcelJS.Worksheet {
  const ws = wb.addWorksheet(name);
  ws.columns = widths.map(w => ({ width: w }));
  return ws;
}

/** Freeze panes at a specific row */
function freezeAt(ws: ExcelJS.Worksheet, row: number) {
  ws.views = [{ state: "frozen", xSplit: 0, ySplit: row, activeCell: `A${row + 1}` }];
}

/** Big coloured title + accent strip + subtitle */
function title(ws: ExcelJS.Worksheet, main: string, sub: string, cols: number, bg = T.brand) {
  const r1 = ws.addRow([main]);
  r1.height = 32;
  r1.getCell(1).font      = { bold: true, size: 14, color: { argb: T.white }, name: "Calibri" };
  r1.getCell(1).fill      = fill(bg);
  r1.getCell(1).alignment = { vertical: "middle", indent: 2 };
  ws.mergeCells(r1.number, 1, r1.number, cols);

  // Red accent strip
  const strip = ws.addRow([""]);
  strip.height = 3;
  for (let c = 1; c <= cols; c++) strip.getCell(c).fill = fill(T.brand);

  if (sub) {
    const r2 = ws.addRow([sub]);
    r2.height = 14;
    r2.getCell(1).font      = { size: 8, italic: true, color: { argb: T.muted }, name: "Calibri" };
    r2.getCell(1).fill      = fill(T.brandLt);
    r2.getCell(1).alignment = { vertical: "middle", indent: 2 };
    ws.mergeCells(r2.number, 1, r2.number, cols);
  }
  ws.addRow([]);
}

/** Section sub-header */
function section(ws: ExcelJS.Worksheet, label: string, cols: number, bg = T.brand, fg = T.white) {
  ws.addRow([]);
  const r = ws.addRow([label]);
  r.height = 17;
  r.getCell(1).font      = { bold: true, size: 8.5, color: { argb: fg }, name: "Calibri" };
  r.getCell(1).fill      = fill(bg);
  r.getCell(1).alignment = { vertical: "middle", indent: 2 };
  ws.mergeCells(r.number, 1, r.number, cols);
  ws.addRow([]);
}

/** Column headers */
function thead(
  ws: ExcelJS.Worksheet,
  headers: string[],
  bg = T.brand,
  fg = T.white,
  autoFilter = false,
) {
  const r = ws.addRow(headers);
  r.height = 18;
  r.eachCell((cell, col) => {
    cell.font      = { bold: true, size: 8.5, color: { argb: fg }, name: "Calibri" };
    cell.fill      = fill(bg);
    cell.alignment = { vertical: "middle", horizontal: col === 1 ? "left" : "center", indent: col === 1 ? 1 : 0 };
    cell.border    = { bottom: { style: "medium", color: { argb: T.white } } };
  });
  if (autoFilter) {
    ws.autoFilter = {
      from: { row: r.number, column: 1 },
      to:   { row: r.number, column: headers.length },
    };
  }
  return r;
}

/** Data row alternating */
function drow(ws: ExcelJS.Worksheet, vals: any[], alt = false, rightCols: number[] = []) {
  const r = ws.addRow(vals);
  r.height = 15;
  r.eachCell((cell, col) => {
    cell.fill      = fill(alt ? T.surface : T.white);
    cell.font      = { size: 8.5, color: { argb: T.ink }, name: "Calibri" };
    cell.alignment = { vertical: "middle", horizontal: rightCols.includes(col) ? "right" : col === 1 ? "left" : "center", indent: col === 1 ? 1 : 0 };
    cell.border    = hairBdr();
  });
  return r;
}

/** Summary / total row */
function srow(ws: ExcelJS.Worksheet, vals: any[], bg = T.brandLt, fg = T.lossText) {
  const r = ws.addRow(vals);
  r.height = 17;
  r.eachCell(cell => {
    cell.font      = { bold: true, size: 9, color: { argb: fg }, name: "Calibri" };
    cell.fill      = fill(bg);
    cell.alignment = { vertical: "middle", indent: 1 };
    cell.border    = bdr("medium", T.brand);
  });
  return r;
}

/** Inline KPI pair: label | value */
function kpi(ws: ExcelJS.Worksheet, label: string, value: string, accent = T.brand, col = 1) {
  const r = ws.addRow([]);
  r.height = 20;
  const lc = r.getCell(col);
  lc.value     = label;
  lc.font      = { size: 8, color: { argb: T.muted }, name: "Calibri" };
  lc.fill      = fill(T.brandLt);
  lc.alignment = { vertical: "middle", indent: 1 };
  const vc = r.getCell(col + 1);
  vc.value     = value;
  vc.font      = { bold: true, size: 13, color: { argb: accent }, name: "Calibri" };
  vc.fill      = fill(T.brandLt);
  vc.alignment = { vertical: "middle", indent: 1 };
  return r;
}

// ─── MAIN GENERATOR ─────────────────────────────────────────────────────────

export async function generateExcelReport(
  data: FullReportData,
  meta: { restaurantName: string; branchName: string; from: string; to: string },
): Promise<ArrayBuffer> {

  const wb = new ExcelJS.Workbook();
  wb.creator = "DineInk"; wb.created = new Date(); wb.modified = new Date();

  const { analytics, bills, expenses, customers, menuItems,
    kitchenData, attendance, allStaff, cashSessions,
    branchComparison, cityComparison, heatmap, forecast, rfm,
    insightsData, inventoryAdjustments, staffProductivity, financeSummary } = data;

  // ─── Pre-compute shared metrics ─────────────────────────────────────────
  const totalRev    = bills.reduce((s, b) => s + n(b.total), 0);
  const totalGST    = bills.reduce((s, b) => s + n(b.cgst) + n(b.sgst), 0);
  const totalDisc   = bills.reduce((s, b) => s + n(b.discount), 0);
  const totalExp    = expenses.reduce((s, e) => s + n(e.amount), 0);
  // Canonical figures from the shared finance engine (finance.formulas.ts) —
  // same numbers as Dashboard/Insights/Branch Comparison. Falls back to the
  // old local estimate only if the finance-summary fetch failed.
  const fin = financeSummary?.current;
  const netProfit   = fin ? fin.netProfit : totalRev - totalGST - totalExp;
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

  // Insights — every cost figure below prefers the Finance Engine (fin) when
  // available, falling back to the local re-derivation only if the
  // finance-summary fetch failed. Previously only ebitda/primeCostPct/
  // foodCostPct/grossMarginPct (below) were finance-engine-sourced while the
  // Expense Distribution table and Revenue Targets section always used the
  // local totalCosts/foodExp even on a successful fetch.
  const ins = insightsData || {};
  const inventoryStockValue = (data.ingredients || []).reduce(
    (sum: number, ing: any) => sum + n(ing.quantity) * n(ing.pricePerUnit), 0
  );
  const localFoodExp = n(ins.manualFoodCost) > 0
    ? n(ins.manualFoodCost)
    : inventoryStockValue > 0 ? inventoryStockValue : 0;
  const fixedExp  = fin ? fin.fixedExpenses : (n(ins.monthlyRent) + n(ins.loanEmi) + n(ins.internet) + n(ins.phoneBills) + n(ins.accounting) + n(ins.insurance) + n(ins.licenses));
  const varExp    = fin ? fin.variableExpenses : (n(ins.deliveryCharges) + n(ins.packaging) + n(ins.paymentGateway) + n(ins.aggregatorCommission) + n(ins.electricity) + n(ins.gas) + n(ins.maintenance) + n(ins.fuel));
  const labourExp = fin ? fin.labourCost : allStaff.reduce((s, st) => s + n(st.salary), 0);
  const finExp    = fin ? fin.financeCost : (n(ins.monthlyLoanEmi) + n(ins.monthlyInterestPayments) + n(ins.caFees) + n(ins.insuranceCost) + n(ins.otherTaxes));
  const insRev    = fin ? fin.revenue : (n(ins.revenue) || totalRev);
  const foodExp   = fin ? fin.foodCost : localFoodExp;

  const ebitda    = fin ? fin.ebitdaPercentage.toFixed(1) : (insRev > 0 ? ((insRev - (fixedExp + varExp + labourExp + finExp + foodExp)) / insRev * 100).toFixed(1) : "0");
  const primeCostPct = fin ? fin.primeCostPercentage.toFixed(1) : (insRev > 0 ? ((foodExp + labourExp) / insRev * 100).toFixed(1) : "0");
  // Targets — from FinancialAssumptions (via financeSummary.targets) once available.
  const targets = financeSummary?.targets;
  const targetEbitda = targets?.targetEbitda ?? n(ins.targetEbitda);
  const targetFoodCostVal = targets?.targetFoodCost ?? n(ins.targetFoodCost);
  const targetPrimeCostVal = targets?.targetPrimeCost ?? n(ins.targetPrimeCost);
  const targetGrossMarginVal = targets?.targetGrossMargin ?? n(ins.targetGrossMargin);
  const foodCostPct = fin ? fin.foodCostPercentage.toFixed(1) : (insRev > 0 ? ((foodExp / insRev) * 100).toFixed(1) : "0");
  const grossMarginPct = fin ? fin.grossProfitMarginPercentage.toFixed(1) : (insRev > 0 ? (((insRev - foodExp) / insRev) * 100).toFixed(1) : "0");
  const ebitdaAmount = fin ? fin.ebitda : insRev - fixedExp - varExp - labourExp - foodExp;

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
  const cov = newSheet(wb, "Cover", [3, 28, 28, 24, 3]);

  // Top banner
  const tRow = cov.addRow(["DineInk  |  Business Intelligence Report"]);
  tRow.height = 36;
  const tc = tRow.getCell(1);
  tc.font      = { bold: true, size: 18, color: { argb: T.white }, name: "Calibri" };
  tc.fill      = fill(T.brand);
  tc.alignment = { vertical: "middle", indent: 2 };
  cov.mergeCells(tRow.number, 1, tRow.number, 5);

  // Accent strip
  const acr = cov.addRow([""]); acr.height = 4;
  for (let c = 1; c <= 5; c++) acr.getCell(c).fill = fill(T.brand);

  // Subtitle
  const subRow = cov.addRow(["27 Sheets  ·  Comprehensive Financial & Operational Data"]);
  subRow.height = 16;
  const sc2 = subRow.getCell(1);
  sc2.font      = { size: 9, italic: true, color: { argb: T.muted }, name: "Calibri" };
  sc2.fill      = fill(T.brandLt);
  sc2.alignment = { vertical: "middle", indent: 2 };
  cov.mergeCells(subRow.number, 1, subRow.number, 5);

  cov.addRow([]);

  // Info section
  const infoRows: [string, string, string][] = [
    ["Restaurant",     meta.restaurantName,                   T.brand],
    ["Branch",         meta.branchName,                       T.blue],
    ["Report Period",  `${meta.from} to ${meta.to}`,          T.purple],
    ["Generated On",   new Date().toLocaleString("en-IN"),    T.muted],
  ];
  const infoFontSizes: number[] = [12, 11, 10, 9];
  infoRows.forEach(([lbl, val, color], idx) => {
    const r = cov.addRow(["", lbl, val]);
    r.height = 22;
    r.getCell(2).font      = { bold: true, size: 10, color: { argb: T.slate }, name: "Calibri" };
    r.getCell(2).fill      = fill(T.brandLt);
    r.getCell(2).alignment = { vertical: "middle", indent: 1 };
    r.getCell(2).border    = bdr("thin", T.border);
    r.getCell(3).font      = { bold: true, size: infoFontSizes[idx], color: { argb: color }, name: "Calibri" };
    r.getCell(3).fill      = fill(T.white);
    r.getCell(3).alignment = { vertical: "middle", indent: 1 };
    r.getCell(3).border    = bdr("thin", T.border);
  });

  cov.addRow([]); cov.addRow([]);

  // Section header — SNAPSHOT METRICS
  section(cov, "SNAPSHOT METRICS", 5);

  // KPI rows
  const covKpis: [string, string, string][] = [
    ["Total Revenue",   inr(totalRev),          T.brand],
    ["Net Profit",      inr(netProfit),          netProfit >= 0 ? T.green : T.brand],
    ["Total Orders",    String(bills.length),    T.blue],
    ["Customers",       String(customers.length), T.purple],
    ["GST Collected",   inr(totalGST),           T.amber],
    ["Expenses",        inr(totalExp),           T.slate],
  ];
  covKpis.forEach(([lbl, val, color]) => {
    const r = cov.addRow(["", lbl, val]);
    r.height = 24;
    r.getCell(1).fill = fill(T.brandLt);
    r.getCell(2).font      = { size: 9, color: { argb: T.muted }, name: "Calibri" };
    r.getCell(2).fill      = fill(T.brandLt);
    r.getCell(2).alignment = { vertical: "middle", indent: 1 };
    r.getCell(3).font      = { bold: true, size: 14, color: { argb: color }, name: "Calibri" };
    r.getCell(3).fill      = fill(T.brandLt);
    r.getCell(3).alignment = { vertical: "middle", indent: 1 };
    r.getCell(4).fill = fill(T.brandLt);
    r.getCell(5).fill = fill(T.brandLt);
  });

  cov.addRow([]); cov.addRow([]);

  // TOC header
  section(cov, "SHEETS IN THIS WORKBOOK", 5);

  const sheetNames = [
    "Cover", "Executive Summary", "Analytics Overview", "Revenue & Orders",
    "Billing Overview", "Customer Overview", "Customer Churn", "Customer RFM",
    "Menu Analytics", "Menu Engineering", "Insights Dashboard",
    "P&L Statement", "Tax Report", "Expense Tracker", "Sales Analytics",
    "Discount Analysis", "Table Analytics", "Waste Report",
    "Hourly Heatmap", "Day Analysis", "Revenue Forecast",
    "Staff Attendance", "Staff Productivity", "Cash Reconciliation",
    "Kitchen Analytics", "Branch Comparison", "City Comparison",
  ];
  sheetNames.forEach((s, i) => {
    const r = cov.addRow(["", String(i + 1).padStart(2, "0"), s]);
    r.height = 14;
    r.getCell(2).font      = { bold: true, size: 8.5, color: { argb: T.brand }, name: "Calibri" };
    r.getCell(2).fill      = fill(T.white);
    r.getCell(3).font      = { size: 8.5, color: { argb: T.ink }, name: "Calibri" };
    r.getCell(3).fill      = fill(T.white);
  });

  // ════════════════════════════════════════════════════
  // SHEET 2 — EXECUTIVE SUMMARY
  // ════════════════════════════════════════════════════
  {
    const ws = newSheet(wb, "Executive Summary", [30, 22, 20, 18, 18]);
    title(ws, "Executive Summary", `${meta.restaurantName}  |  ${meta.branchName}  |  ${meta.from} to ${meta.to}`, 5);
    section(ws, "KEY PERFORMANCE INDICATORS", 5);
    const h = thead(ws, ["Metric", "Value", "Secondary Info", "Period", "Status"], T.brand, T.white, true);
    freezeAt(ws, h.number);
    const kpiRows = [
      ["Total Revenue",      inr(totalRev),             `${bills.length} bills`,                              "Period",   "OK"],
      ["Paid Revenue",       inr(paidBills.reduce((s, b) => s + n(b.total), 0)), `${paidBills.length} paid bills`, "Period", "OK"],
      ["Total Orders",       String(bills.length),       `${analytics.totalOrders || bills.length} completed`, "Period",  "OK"],
      ["Avg Order Value",    inr(bills.length ? Math.round(totalRev / bills.length) : 0), "per transaction",  "Period",   "—"],
      ["GST Collected",      inr(totalGST),              "CGST + SGST",                                       "Period",   "—"],
      ["Discounts Given",    inr(totalDisc),             pct(totalDisc, gross) + " of gross",                 "Period",   "Warn"],
      ["Operating Expenses", inr(totalExp),              `${expenses.length} entries`,                        "Period",   "—"],
      ["Net Profit",         inr(netProfit),             `${totalRev > 0 ? ((netProfit / totalRev) * 100).toFixed(1) : 0}% margin`, "Period", netProfit >= 0 ? "OK" : "Loss"],
      ["Unique Customers",   String(customers.length),   `${customers.filter((c: any) => c.visits > 1).length} repeat`, "All time", "—"],
      ["Repeat Rate",        pct(customers.filter((c: any) => c.visits > 1).length, customers.length), "returning customers", "All time", "—"],
      ["Peak Hours",         analytics.peakHours || "—", "Busiest slot",                                      "Period",   "—"],
      ["Active Customers",   String(activeC.length),     "visited in 30 days",                                "All time", "OK"],
      ["At Risk Customers",  String(atRiskC.length),     "30-90 days since visit",                            "All time", "Warn"],
      ["Churned Customers",  String(churnedC.length),    "90+ days away",                                     "All time", "Loss"],
    ];
    kpiRows.forEach((row, i) => {
      const r = drow(ws, row, i % 2 === 0, [2]);
      if (row[0] === "Net Profit") {
        r.eachCell(c => { c.font = { bold: true, size: 9, color: { argb: netProfit >= 0 ? T.green : T.redDk }, name: "Calibri" }; c.fill = fill(netProfit >= 0 ? T.greenLt : T.lossRed); });
      }
    });
    section(ws, "P&L SNAPSHOT", 5, T.green);
    const h2 = thead(ws, ["Line Item", "Amount (INR)", "% of Revenue", "Notes", ""], T.green, T.white, true);
    freezeAt(ws, h2.number);
    [
      ["Gross Revenue", inr(gross),        "100.0%",               "Before discounts", ""],
      ["(-) Discounts", `-${inr(totalDisc)}`, `-${pct(totalDisc, gross)}`, "Staff-applied", ""],
      ["Net Revenue",   inr(totalRev),     "—",                    "After discounts", ""],
      ["(-) GST",       `-${inr(totalGST)}`, `-${pct(totalGST, totalRev)}`, "Tax liability", ""],
      ["(-) Expenses",  `-${inr(totalExp)}`, `-${pct(totalExp, totalRev)}`, "Operating costs", ""],
    ].forEach((row, i) => drow(ws, row, i % 2 === 0, [2]));
    srow(ws, ["NET PROFIT", inr(netProfit), pct(netProfit, totalRev), "Revenue-GST-Expenses", ""], netProfit >= 0 ? T.greenLt : T.lossRed, netProfit >= 0 ? T.greenDk : T.lossText);
  }

  // ════════════════════════════════════════════════════
  // SHEET 3 — ANALYTICS OVERVIEW (DASHBOARD)
  // ════════════════════════════════════════════════════
  {
    const ws = newSheet(wb, "Analytics Overview", [20, 18, 14, 18, 20, 20]);
    title(ws, "Analytics Overview — Dashboard", "Live operational metrics mirroring the main dashboard", 6);
    section(ws, "SUMMARY KPIs", 6);
    const h = thead(ws, ["KPI", "Value", "Orders", "Avg Value", "Customers", "Peak Hours"], T.brand, T.white, true);
    freezeAt(ws, h.number);
    drow(ws, [meta.branchName, inr(totalRev), String(bills.length), inr(bills.length ? Math.round(totalRev / bills.length) : 0), String(customers.length), analytics.peakHours || "—"], false, [2, 4]);
    section(ws, "DAILY REVENUE TREND", 6);
    const h2 = thead(ws, ["Date", "Revenue (INR)", "Orders", "Avg Bill (INR)", "Order Types", "Payment Methods"], T.brand, T.white, true);
    freezeAt(ws, h2.number);
    dailyArr.forEach(([date, d], i) => {
      const ots = bills.filter(b => new Date(b.createdAt).toLocaleDateString("en-IN") === date);
      const otStr = Object.entries(ots.reduce((a, b: any) => { a[b.orderType || "?"] = (a[b.orderType || "?"] || 0) + 1; return a; }, {} as any)).map(([k, v]) => `${k.replace("_", " ")}: ${v}`).join(", ");
      const pmStr = Object.entries(ots.reduce((a, b: any) => { a[b.paymentMethod || "?"] = (a[b.paymentMethod || "?"] || 0) + 1; return a; }, {} as any)).map(([k, v]) => `${k}: ${v}`).join(", ");
      drow(ws, [date, d.rev, d.orders, d.orders ? Math.round(d.rev / d.orders) : 0, otStr, pmStr], i % 2 === 0, [2, 4]);
    });
    srow(ws, ["TOTAL", inr(totalRev), String(bills.length), inr(bills.length ? Math.round(totalRev / bills.length) : 0), "", ""], T.brandLt);
    section(ws, "ORDER SPLIT", 6);
    thead(ws, ["Order Type", "Count", "Revenue (INR)", "Revenue %", "Avg Bill (INR)", ""], T.brand, T.white, true);
    Object.entries(otMap).sort((a, b) => b[1].rev - a[1].rev).forEach(([t, d], i) => {
      drow(ws, [t, d.count, d.rev, pct(d.rev, totalRev), d.count ? Math.round(d.rev / d.count) : 0, ""], i % 2 === 0, [2, 3, 5]);
    });
    section(ws, "PAYMENT SPLIT", 6);
    thead(ws, ["Payment Method", "Bills", "Revenue (INR)", "Revenue %", "Avg Bill (INR)", ""], T.brand, T.white, true);
    Object.entries(payMap).sort((a, b) => b[1].rev - a[1].rev).forEach(([m, d], i) => {
      drow(ws, [m, d.count, d.rev, pct(d.rev, totalRev), d.count ? Math.round(d.rev / d.count) : 0, ""], i % 2 === 0, [2, 3, 5]);
    });
    section(ws, "TOP SELLING ITEMS", 6);
    thead(ws, ["#", "Item Name", "Qty Sold", "Revenue (INR)", "Category", "Sales %"], T.brand, T.white, true);
    topItems.slice(0, 30).forEach(([name, d], i) => {
      drow(ws, [i + 1, name, d.qty, d.rev, d.cat, pct(d.rev, totalRev)], i % 2 === 0, [3, 4]);
    });
  }

  // ════════════════════════════════════════════════════
  // SHEET 4 — REVENUE & ORDERS
  // ════════════════════════════════════════════════════
  {
    const ws = newSheet(wb, "Revenue & Orders", [18, 20, 12, 18, 16, 20]);
    title(ws, "Revenue & Orders", `${meta.from} to ${meta.to}`, 6);
    section(ws, "DAILY REVENUE & ORDERS", 6);
    const h = thead(ws, ["Date", "Revenue (INR)", "Orders", "Avg Bill (INR)", "YoY %", "Notes"], T.brand, T.white, true);
    freezeAt(ws, h.number);
    dailyArr.forEach(([d, v], i) => drow(ws, [d, v.rev, v.orders, v.orders ? Math.round(v.rev / v.orders) : 0, "—", ""], i % 2 === 0, [2, 4]));
    srow(ws, ["TOTAL", inr(totalRev), bills.length, bills.length ? Math.round(totalRev / bills.length) : 0, "", ""], T.brandLt);
    section(ws, "HOURLY ANALYTICS", 6);
    const h2 = thead(ws, ["Hour", "Revenue (INR)", "Orders", "Avg Bill (INR)", "Revenue %", ""], T.brand, T.white, true);
    freezeAt(ws, h2.number);
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
    const ws = newSheet(wb, "Billing Overview", [22, 14, 20, 16, 14, 12, 12, 12, 14, 12, 18]);
    title(ws, "Billing Overview", `${bills.length} bills  ·  ${meta.from} to ${meta.to}`, 11);
    section(ws, "BILLING KPIs", 6);
    [["Total Revenue", inr(totalRev), T.brand], ["Total Orders", String(bills.length), T.blue],
     ["Avg Bill Value", inr(bills.length ? Math.round(totalRev / bills.length) : 0), T.purple],
     ["Paid Bills", String(paidBills.length), T.green], ["GST Collected", inr(totalGST), T.amber]].forEach(([l, v, c]) => kpi(ws, l as string, v as string, c as string));
    section(ws, "RECENT BILLS", 11);
    const h = thead(ws, ["Bill No", "Date", "Customer", "Order Type", "Payment", "Subtotal", "GST", "Discount", "Total", "Status", "Time"], T.brand, T.white, true);
    freezeAt(ws, h.number);
    bills.forEach((b: any, i: number) => {
      const r = drow(ws, [b.billNo || `#${b.id}`, new Date(b.createdAt).toLocaleDateString("en-IN"), b.customer?.name || "Guest", (b.orderType || "").replace("_", " "), b.paymentMethod || "—", n(b.subtotal), n(b.cgst) + n(b.sgst), n(b.discount), n(b.total), b.status || "—", new Date(b.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })], i % 2 === 0, [6, 7, 8, 9]);
      if (b.status === "PAID") r.getCell(10).font = { bold: true, size: 8.5, color: { argb: T.green }, name: "Calibri" };
      else if (b.status === "UNPAID") r.getCell(10).font = { bold: true, size: 8.5, color: { argb: T.redDk }, name: "Calibri" };
    });
    srow(ws, ["TOTALS", "", `${bills.length} bills`, "", "", bills.reduce((s, b) => s + n(b.subtotal), 0), totalGST, totalDisc, totalRev, `${paidBills.length} paid`, ""], T.brandLt);
  }

  // ════════════════════════════════════════════════════
  // SHEET 6 — CUSTOMER OVERVIEW
  // ════════════════════════════════════════════════════
  {
    const ws = newSheet(wb, "Customer Overview", [24, 16, 12, 18, 16, 20, 16, 14]);
    title(ws, "Customer Overview", `${customers.length} customers  ·  all-time data`, 8);
    section(ws, "CUSTOMER KPIs", 5);
    [["Total Customers", String(customers.length), T.blue], ["Repeat Customers", String(customers.filter((c: any) => c.visits > 1).length), T.green],
     ["Avg Spend", inr(avgCLV), T.purple], ["Total Revenue", inr(customers.reduce((s: number, c: any) => s + n(c.spend), 0)), T.brand]].forEach(([l, v, c]) => kpi(ws, l as string, v as string, c as string));
    section(ws, "CUSTOMER INSIGHTS TABLE", 8);
    const h = thead(ws, ["Customer Name", "Phone", "Visits", "Avg Bill (INR)", "Total Spend (INR)", "Preferred Order", "Last Visit", "Segment"], T.brand, T.white, true);
    freezeAt(ws, h.number);
    customers.sort((a: any, b: any) => b.spend - a.spend).forEach((c: any, i: number) => {
      const seg = c.spend > 5000 ? "VIP" : c.visits > 3 ? "Regular" : "New";
      const r = drow(ws, [c.name, c.phone, c.visits, c.visits ? Math.round(n(c.spend) / c.visits) : 0, c.spend, c.preferredOrderType || "—", c.lastVisit ? new Date(c.lastVisit).toLocaleDateString("en-IN") : "—", rfmMap[c.phone]?.segment || seg], i % 2 === 0, [4, 5]);
      const segC: Record<string, string> = { Champion: T.green, Loyal: T.blue, Potential: T.purple, "At Risk": T.amber, Lost: T.redDk, VIP: T.green, Regular: T.blue, New: T.muted };
      const sc = r.getCell(8);
      sc.font = { bold: true, size: 8.5, color: { argb: segC[rfmMap[c.phone]?.segment || seg] || T.slate }, name: "Calibri" };
    });
  }

  // ════════════════════════════════════════════════════
  // SHEET 7 — CUSTOMER CHURN
  // ════════════════════════════════════════════════════
  {
    const ws = newSheet(wb, "Customer Churn", [24, 16, 14, 18, 16, 12, 16]);
    title(ws, "Customer Churn Analysis", "Active  ·  At Risk  ·  Churned customer segmentation", 7);
    section(ws, "CHURN KPIs", 5);
    [["Active (<=30 days)", String(activeC.length), T.green], ["At Risk (30-90 days)", String(atRiskC.length), T.amber],
     ["Churned (90+ days)", String(churnedC.length), T.redDk], ["Avg CLV", inr(avgCLV), T.purple]].forEach(([l, v, c]) => kpi(ws, l as string, v as string, c as string));
    section(ws, "TOP CUSTOMERS BY SPEND", 7, T.blue);
    const h1 = thead(ws, ["Customer", "Phone", "Total Spend (INR)", "Visits", "Avg Bill (INR)", "Last Visit", "Segment"], T.blue, T.white, true);
    freezeAt(ws, h1.number);
    customers.sort((a: any, b: any) => b.spend - a.spend).slice(0, 20).forEach((c: any, i: number) => {
      drow(ws, [c.name, c.phone, c.spend, c.visits, c.visits ? Math.round(n(c.spend) / c.visits) : 0, c.lastVisit ? new Date(c.lastVisit).toLocaleDateString("en-IN") : "—", rfmMap[c.phone]?.segment || "—"], i % 2 === 0, [3, 5]);
    });
    section(ws, "AT RISK CUSTOMERS (30-90 days)", 7, T.amber);
    const h2 = thead(ws, ["Customer", "Phone", "Last Visit", "Days Since", "Total Spend (INR)", "Visits", "Avg Bill (INR)"], T.amber, T.white, true);
    freezeAt(ws, h2.number);
    atRiskC.sort((a: any, b: any) => a.spend - b.spend).forEach((c: any, i: number) => {
      const days = c.lastVisit ? Math.floor((now - new Date(c.lastVisit).getTime()) / 86400000) : 999;
      drow(ws, [c.name, c.phone, c.lastVisit ? new Date(c.lastVisit).toLocaleDateString("en-IN") : "—", days, c.spend, c.visits, c.visits ? Math.round(n(c.spend) / c.visits) : 0], i % 2 === 0, [5, 7]);
    });
    section(ws, "CHURNED CUSTOMERS (90+ days)", 7, T.redDk);
    const h3 = thead(ws, ["Customer", "Phone", "Total Visits", "Total Spend (INR)", "Last Visit", "Days Since", "Avg Bill (INR)"], T.redDk, T.white, true);
    freezeAt(ws, h3.number);
    churnedC.sort((a: any, b: any) => b.spend - a.spend).forEach((c: any, i: number) => {
      const days = c.lastVisit ? Math.floor((now - new Date(c.lastVisit).getTime()) / 86400000) : 999;
      drow(ws, [c.name, c.phone, c.visits, c.spend, c.lastVisit ? new Date(c.lastVisit).toLocaleDateString("en-IN") : "Never", days, c.visits ? Math.round(n(c.spend) / c.visits) : 0], i % 2 === 0, [4, 7]);
    });
  }

  // ════════════════════════════════════════════════════
  // SHEET 8 — CUSTOMER RFM
  // ════════════════════════════════════════════════════
  {
    const ws = newSheet(wb, "Customer RFM", [24, 16, 16, 10, 10, 10, 12, 16, 12, 16]);
    title(ws, "Customer RFM Analysis", "Recency  ·  Frequency  ·  Monetary scoring model", 10);
    section(ws, "SEGMENT OVERVIEW", 6);
    [["Champion", T.green], ["Loyal", T.blue], ["Potential", T.purple], ["At Risk", T.amber], ["Lost", T.redDk]].forEach(([seg, c]) => {
      kpi(ws, `${seg} Customers`, `${segCounts[seg] || 0} customers  |  INR ${((rfm?.segmentRevenue?.[seg] || 0)).toLocaleString("en-IN")} revenue`, c as string);
    });
    section(ws, "RFM SCORING EXPLANATION", 6);
    const expRow = ws.addRow(["R = Recency (1-5): days since last visit  ·  F = Frequency (1-5): total visits  ·  M = Monetary (1-5): total spend  ·  Total 13-15 = Champion  ·  10-12 = Loyal  ·  7-9 = Potential  ·  5-6 = At Risk  ·  3-4 = Lost"]);
    expRow.getCell(1).font = { size: 8.5, italic: true, color: { argb: T.slate }, name: "Calibri" };
    expRow.height = 14; ws.mergeCells(expRow.number, 1, expRow.number, 10);
    ws.addRow([]);
    section(ws, "FULL RFM CUSTOMER TABLE", 10);
    const h = thead(ws, ["Customer", "Phone", "Segment", "R Score", "F Score", "M Score", "Total /15", "Last Visit", "Visits", "Spend (INR)"], T.brand, T.white, true);
    freezeAt(ws, h.number);
    const segColors: Record<string, string> = { Champion: T.green, Loyal: T.blue, Potential: T.purple, "At Risk": T.amber, Lost: T.redDk };
    (rfm?.customers || []).forEach((c: any, i: number) => {
      const r = drow(ws, [c.name, c.phone, c.segment, c.R, c.F, c.M, `${c.rfm}/15`, c.lastVisit ? new Date(c.lastVisit).toLocaleDateString("en-IN") : "—", c.frequency, c.monetary], i % 2 === 0, [10]);
      r.getCell(3).font = { bold: true, size: 8.5, color: { argb: segColors[c.segment] || T.slate }, name: "Calibri" };
    });
  }

  // ════════════════════════════════════════════════════
  // SHEET 9 — MENU ANALYTICS
  // ════════════════════════════════════════════════════
  {
    const ws = newSheet(wb, "Menu Analytics", [28, 14, 18, 18, 16, 16]);
    title(ws, "Menu Analytics", "Ingredient intelligence, food cost and operational metrics", 6);
    section(ws, "MENU KPIs", 5);
    const invVal = (data.ingredients as any[]).reduce((s, i) => s + n(i.quantity) * n(i.pricePerUnit), 0);
    [["Inventory Value", inr(invVal), T.blue], ["Total Ingredients", String((data.ingredients as any[]).length), T.purple],
     ["Mapped Items", String(mappedItems.length), T.green], ["Unmapped Items", String(menuItems.length - mappedItems.length), T.amber]].forEach(([l, v, c]) => kpi(ws, l as string, v as string, c as string));
    section(ws, "INGREDIENT INTELLIGENCE — CONSUMPTION", 6);
    const h = thead(ws, ["Ingredient", "Category", "Stock Qty", "Unit", "Price/Unit (INR)", "Total Value (INR)"], T.brand, T.white, true);
    freezeAt(ws, h.number);
    (data.ingredients as any[]).sort((a, b) => n(b.quantity) * n(b.pricePerUnit) - n(a.quantity) * n(a.pricePerUnit)).forEach((ing: any, i: number) => {
      drow(ws, [ing.name, ing.category?.name || "—", ing.quantity || 0, ing.unit || "—", ing.pricePerUnit || 0, (n(ing.quantity) * n(ing.pricePerUnit)).toFixed(2)], i % 2 === 0, [3, 5, 6]);
    });
    section(ws, "OPERATIONAL ALERTS", 6);
    const h2 = thead(ws, ["Alert Type", "Item", "Detail", "Priority", "", ""], T.brand, T.white, true);
    freezeAt(ws, h2.number);
    [["Highest Usage Item", topItems[0]?.[0] || "—", `${topItems[0]?.[1]?.qty || 0} units sold`, "HIGH", "", ""],
     ["Top Revenue Item", topItems[0]?.[0] || "—", inr(topItems[0]?.[1]?.rev), "HIGH", "", ""],
     ["Inventory Status", invVal > 0 ? "Healthy" : "Low Stock", `INR ${invVal.toLocaleString("en-IN")} value`, invVal > 0 ? "OK" : "WARN", "", ""],
    ].forEach((row, i) => drow(ws, row, i % 2 === 0));
  }

  // ════════════════════════════════════════════════════
  // SHEET 10 — MENU ENGINEERING
  // ════════════════════════════════════════════════════
  {
    const ws = newSheet(wb, "Menu Engineering", [30, 18, 14, 16, 14, 14, 12]);
    title(ws, "Menu Engineering Matrix", "Stars  ·  Puzzles  ·  Plowhorses  ·  Dogs", 7);
    section(ws, "QUADRANT EXPLANATION", 7);
    [["Stars",       "High popularity + High margin — Promote heavily"],
     ["Puzzles",     "Low popularity + High margin — Better marketing"],
     ["Plowhorses",  "High popularity + Low margin — Reprice or reduce cost"],
     ["Dogs",        "Low popularity + Low margin — Consider removing"]].forEach(([q, desc]) => {
      const r = ws.addRow([q, desc]); r.height = 14;
      r.getCell(1).font = { bold: true, size: 9, color: { argb: T.ink }, name: "Calibri" };
      r.getCell(2).font = { size: 8.5, color: { argb: T.slate }, name: "Calibri" };
    });
    section(ws, "ALL MENU ITEMS — ENGINEERING ANALYSIS", 7);
    const h = thead(ws, ["Item Name", "Category", "Qty Sold", "Revenue (INR)", "Food Cost (INR)", "Margin %", "Quadrant"], T.brand, T.white, true);
    freezeAt(ws, h.number);
    const medianQty = itemsSales.length > 0 ? itemsSales[Math.floor(itemsSales.length / 2)].qty : 0;
    const medianMargin = itemsSales.length > 0 ? parseFloat(itemsSales.map(i => parseFloat(i.margin as string) || 0).sort((a, b) => a - b)[Math.floor(itemsSales.length / 2)].toFixed(1)) : 50;
    const quadColors: Record<string, string> = { "Star": T.green, "Puzzle": T.blue, "Plowhorse": T.amber, "Dog": T.redDk };
    itemsSales.forEach((item, i) => {
      const marg = parseFloat(item.margin as string) || 0;
      const hiQty = item.qty >= medianQty;
      const hiMargin = marg >= medianMargin;
      const quad = hiQty && hiMargin ? "Star" : !hiQty && hiMargin ? "Puzzle" : hiQty && !hiMargin ? "Plowhorse" : "Dog";
      const r = drow(ws, [item.name, item.cat, item.qty, item.rev, item.cost, `${item.margin}%`, quad], i % 2 === 0, [3, 4]);
      r.getCell(7).font = { bold: true, size: 8.5, color: { argb: quadColors[quad] || T.slate }, name: "Calibri" };
    });
  }

  // ════════════════════════════════════════════════════
  // SHEET 11 — INSIGHTS DASHBOARD
  // ════════════════════════════════════════════════════
  {
    const ws = newSheet(wb, "Insights Dashboard", [28, 20, 18, 16, 16]);
    title(ws, "Insights Dashboard", "EBITDA  ·  Profitability  ·  Revenue targets  ·  Expense distribution", 5);
    section(ws, "INSIGHTS KPIs", 5);
    [["Revenue (Monthly)", inr(insRev), T.brand], ["EBITDA", inr(ebitdaAmount), T.green],
     ["EBITDA %", `${ebitda}%`, T.purple], ["Prime Cost %", `${primeCostPct}%`, T.amber]].forEach(([l, v, c]) => kpi(ws, l as string, v as string, c as string));
    section(ws, "PROFITABILITY HEALTH", 5);
    const h = thead(ws, ["Metric", "Current", "Target", "Gap", "Status"], T.brand, T.white, true);
    freezeAt(ws, h.number);
    [
      ["EBITDA %", `${ebitda}%`, `${targetEbitda || 0}%`, `${(parseFloat(ebitda) - (targetEbitda || 0)).toFixed(1)}%`, parseFloat(ebitda) >= (targetEbitda || 0) ? "Healthy" : "Critical"],
      ["Food Cost %", `${foodCostPct}%`, `${targetFoodCostVal || 0}%`, "—", "—"],
      ["Gross Margin %", `${grossMarginPct}%`, `${targetGrossMarginVal || 0}%`, "—", "—"],
      ["Prime Cost %", `${primeCostPct}%`, `${targetPrimeCostVal || 0}%`, "—", "—"],
    ].forEach((row, i) => drow(ws, row, i % 2 === 0));
    section(ws, "REVENUE TARGETS (EBITDA SCENARIOS)", 5);
    const h2 = thead(ws, ["EBITDA Target %", "Revenue Required (INR)", "Current Revenue (INR)", "Gap (INR)", "Status"], T.brand, T.white, true);
    freezeAt(ws, h2.number);
    [0, 5, 10, 15, 20, 25].forEach((target, i) => {
      const req  = (fixedExp + varExp + labourExp + foodExp) / (1 - target / 100);
      const gap  = req - insRev;
      const done = gap <= 0;
      const r = drow(ws, [`${target}% EBITDA`, inr(req), inr(insRev), done ? "—" : `+${inr(gap)}`, done ? "Achieved" : "Gap"], i % 2 === 0, [2, 3, 4]);
      if (done) r.eachCell(c => { c.font = { bold: true, size: 8.5, color: { argb: T.green }, name: "Calibri" }; c.fill = fill(T.greenLt); });
    });
    section(ws, "EXPENSE DISTRIBUTION", 5);
    thead(ws, ["Expense Category", "Amount (INR)", "% of Total Expenses", "Notes", ""], T.brand, T.white, true);
    const totalAllExp = fixedExp + varExp + labourExp + finExp;
    [["Fixed Expenses", fixedExp, "Rent, EMI, Internet, Insurance"],
     ["Variable Expenses", varExp, "Utilities, Delivery, Packaging"],
     ["Labour Cost", labourExp, "Staff salaries"],
     ["Finance & Tax", finExp, "Loans, CA fees, Insurance, Taxes"]].forEach(([l, v, note], i) => {
      drow(ws, [l, inr(v), pct(v as number, totalAllExp), note, ""], i % 2 === 0, [2]);
    });
    srow(ws, ["TOTAL", inr(totalAllExp), "100%", "", ""], T.brandLt);
  }

  // ════════════════════════════════════════════════════
  // SHEETS 12–18: Financial reports
  // ════════════════════════════════════════════════════

  // P&L Statement
  {
    const ws = newSheet(wb, "P&L Statement", [32, 22, 18, 20, 18]);
    title(ws, "P&L Statement", `${meta.from} to ${meta.to}`, 5);
    section(ws, "REVENUE SECTION", 5, T.green);
    const h = thead(ws, ["Line Item", "Amount (INR)", "% of Gross", "Notes", ""], T.green, T.white, true);
    freezeAt(ws, h.number);
    [["Gross Revenue (all bills)", inr(gross), "100.0%", "Before discounts", ""],
     ["(-) Discounts Given", `-${inr(totalDisc)}`, `-${pct(totalDisc, gross)}`, "Revenue reduction", ""],
     ["Net Revenue", inr(totalRev), pct(totalRev, gross), "After discounts", ""],
     ["Service Charges Collected", inr(bills.reduce((s, b) => s + n(b.serviceCharge), 0)), "—", "Service charges", ""]].forEach((row, i) => drow(ws, row, i % 2 === 0, [2]));
    section(ws, "TAX SECTION", 5, T.amber);
    const h2 = thead(ws, ["Tax Type", "Amount (INR)", "% of Net Revenue", "Notes", ""], T.amber, T.white, true);
    freezeAt(ws, h2.number);
    [["CGST", inr(bills.reduce((s, b) => s + n(b.cgst), 0)), pct(bills.reduce((s, b) => s + n(b.cgst), 0), totalRev), "Central GST", ""],
     ["SGST", inr(bills.reduce((s, b) => s + n(b.sgst), 0)), pct(bills.reduce((s, b) => s + n(b.sgst), 0), totalRev), "State GST", ""],
     ["Total GST", inr(totalGST), pct(totalGST, totalRev), "Total tax collected", ""]].forEach((row, i) => drow(ws, row, i % 2 === 0, [2]));
    section(ws, "EXPENSE SECTION", 5, T.purple);
    const h3 = thead(ws, ["Expense Category", "Amount (INR)", "% of Revenue", "Entries", ""], T.purple, T.white, true);
    freezeAt(ws, h3.number);
    Object.entries(expByType).sort((a, b) => b[1] - a[1]).forEach(([type, amt], i) => {
      const cnt = expenses.filter(e => (e.expenseType || "Other") === type).length;
      drow(ws, [type, inr(amt), pct(amt, totalRev), String(cnt), ""], i % 2 === 0, [2]);
    });
    srow(ws, ["TOTAL EXPENSES", inr(totalExp), pct(totalExp, totalRev), String(expenses.length), ""], T.purpleLt, T.purple);
    section(ws, "NET RESULT", 5, netProfit >= 0 ? T.green : T.redDk);
    srow(ws, ["ESTIMATED NET PROFIT / LOSS", inr(netProfit), pct(netProfit, totalRev), "Revenue - GST - Expenses", ""], netProfit >= 0 ? T.greenLt : T.lossRed, netProfit >= 0 ? T.greenDk : T.lossText);
  }

  // Tax Report
  {
    const ws = newSheet(wb, "Tax Report", [22, 14, 18, 14, 14, 14, 14, 14, 12]);
    title(ws, "Tax Report (GST)", `CGST + SGST breakdown  ·  ${meta.from} to ${meta.to}`, 9);
    section(ws, "TAX KPIs", 5);
    const cgstTotal = bills.reduce((s, b) => s + n(b.cgst), 0);
    const sgstTotal = bills.reduce((s, b) => s + n(b.sgst), 0);
    [["Total CGST", inr(cgstTotal), T.blue], ["Total SGST", inr(sgstTotal), T.purple],
     ["Total GST", inr(totalGST), T.brand], ["Taxable Revenue", inr(totalRev - totalGST), T.green]].forEach(([l, v, c]) => kpi(ws, l as string, v as string, c as string));
    section(ws, "GST BILL-WISE BREAKDOWN", 9);
    const h = thead(ws, ["Bill No", "Date", "Order Type", "Subtotal (INR)", "CGST (INR)", "SGST (INR)", "Total GST (INR)", "Total (INR)", "Status"], T.brand, T.white, true);
    freezeAt(ws, h.number);
    bills.forEach((b: any, i: number) => {
      drow(ws, [b.billNo || `#${b.id}`, new Date(b.createdAt).toLocaleDateString("en-IN"), (b.orderType || "").replace("_", " "), n(b.subtotal), n(b.cgst), n(b.sgst), n(b.cgst) + n(b.sgst), n(b.total), b.status || "—"], i % 2 === 0, [4, 5, 6, 7, 8]);
    });
    srow(ws, ["TOTALS", "", "", bills.reduce((s, b) => s + n(b.subtotal), 0), cgstTotal, sgstTotal, totalGST, totalRev, `${paidBills.length} paid`], T.amberLt, T.amber);
  }

  // Expense Tracker
  {
    const ws = newSheet(wb, "Expense Tracker", [28, 18, 14, 18, 22]);
    title(ws, "Expense Tracker", `${expenses.length} entries  ·  Total: ${inr(totalExp)}`, 5);
    section(ws, "EXPENSE KPIs", 5);
    [["Total Expenses", inr(totalExp), T.purple], ["Expense Categories", String(Object.keys(expByType).length), T.blue],
     ["Avg per Entry", inr(expenses.length ? Math.round(totalExp / expenses.length) : 0), T.amber],
     ["Expense/Revenue Ratio", pct(totalExp, totalRev), totalExp / totalRev < 0.3 ? T.green : T.redDk]].forEach(([l, v, c]) => kpi(ws, l as string, v as string, c as string));
    section(ws, "EXPENSE BY CATEGORY", 5, T.purple);
    const h1 = thead(ws, ["Category", "Amount (INR)", "% of Total", "Entries", ""], T.purple, T.white, true);
    freezeAt(ws, h1.number);
    Object.entries(expByType).sort((a, b) => b[1] - a[1]).forEach(([type, amt], i) => {
      drow(ws, [type, inr(amt), pct(amt, totalExp), String(expenses.filter(e => (e.expenseType || "Other") === type).length), ""], i % 2 === 0, [2]);
    });
    section(ws, "EXPENSE LOG", 5, T.purple);
    const h2 = thead(ws, ["Expense Name", "Category", "Date", "Amount (INR)", "Paid By"], T.purple, T.white, true);
    freezeAt(ws, h2.number);
    expenses.forEach((e: any, i: number) => {
      drow(ws, [e.title || "—", e.expenseType || "—", new Date(e.expenseDate || e.createdAt).toLocaleDateString("en-IN"), n(e.amount), e.paidByUser?.name || "—"], i % 2 === 0, [4]);
    });
    srow(ws, ["TOTAL EXPENSES", "", "", inr(totalExp), ""], T.purpleLt, T.purple);
  }

  // Sales Analytics
  {
    const ws = newSheet(wb, "Sales Analytics", [24, 14, 18, 16, 16]);
    title(ws, "Sales Analytics", "Payment methods  ·  Order channels  ·  Bills summary", 5);
    section(ws, "PAYMENT METHOD REVENUE", 5, T.blue);
    const h1 = thead(ws, ["Payment Method", "Bills", "Revenue (INR)", "Avg Bill (INR)", "Share %"], T.blue, T.white, true);
    freezeAt(ws, h1.number);
    Object.entries(payMap).sort((a, b) => b[1].rev - a[1].rev).forEach(([m, d], i) => {
      drow(ws, [m, d.count, inr(d.rev), inr(d.count ? Math.round(d.rev / d.count) : 0), pct(d.rev, totalRev)], i % 2 === 0, [2, 3, 4]);
    });
    section(ws, "ORDER CHANNEL PERFORMANCE", 5, T.blue);
    const h2 = thead(ws, ["Channel", "Revenue (INR)", "Orders", "Avg Bill (INR)", "Revenue %"], T.blue, T.white, true);
    freezeAt(ws, h2.number);
    Object.entries(otMap).sort((a, b) => b[1].rev - a[1].rev).forEach(([t, d], i) => {
      drow(ws, [t, inr(d.rev), d.count, inr(d.count ? Math.round(d.rev / d.count) : 0), pct(d.rev, totalRev)], i % 2 === 0, [2, 4]);
    });
    section(ws, "BILLS SUMMARY TABLE", 5);
    const h3 = thead(ws, ["Bill No", "Customer", "Order Type", "Payment", "Subtotal (INR)", "GST (INR)", "Discount (INR)", "Total (INR)", "Status"], T.brand, T.white, true);
    freezeAt(ws, h3.number);
    bills.forEach((b: any, i: number) => {
      const r = drow(ws, [b.billNo || `#${b.id}`, b.customer?.name || "Guest", (b.orderType || "").replace("_", " "), b.paymentMethod || "—", n(b.subtotal), n(b.cgst) + n(b.sgst), n(b.discount), n(b.total), b.status || "—"], i % 2 === 0, [5, 6, 7, 8]);
      if (b.status === "PAID") r.getCell(9).font = { bold: true, size: 8.5, color: { argb: T.green }, name: "Calibri" };
    });
  }

  // Discount Analysis
  {
    const ws = newSheet(wb, "Discount Analysis", [22, 14, 20, 16, 14, 14, 14, 12]);
    title(ws, "Discount Analysis", "Track every discount — identify patterns, prevent abuse", 8);
    section(ws, "DISCOUNT KPIs", 5);
    const discBills = bills.filter(b => n(b.discount) > 0);
    [["Total Discounts", inr(totalDisc), T.amber], ["Bills with Discount", String(discBills.length), T.blue],
     ["Avg Discount/Bill", inr(discBills.length ? Math.round(totalDisc / discBills.length) : 0), T.purple],
     ["Discount % of Revenue", pct(totalDisc, gross), totalDisc / gross < 0.05 ? T.green : T.redDk]].forEach(([l, v, c]) => kpi(ws, l as string, v as string, c as string));
    section(ws, "DISCOUNT BREAKDOWN TABLE", 8, T.amber);
    const h = thead(ws, ["Bill No", "Date", "Customer", "Order Type", "Gross Total (INR)", "Discount (INR)", "Net Total (INR)", "Discount %"], T.amber, T.white, true);
    freezeAt(ws, h.number);
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
    const ws = newSheet(wb, "Table Analytics", [22, 14, 16, 18, 18, 14]);
    title(ws, "Table Analytics", "Turn rate  ·  Revenue per table  ·  Occupancy", 6);
    const tableTurnData = kitchenData?.tableTurnData || [];
    section(ws, "TABLE KPIs", 5);
    [["Tables Active", String(tableTurnData.length), T.blue],
     ["Avg Turn Time", `${kitchenData?.summary?.avgTime || 0} min`, T.amber],
     ["Total Orders", String(tableTurnData.reduce((s: number, t: any) => s + n(t.count), 0)), T.green]].forEach(([l, v, c]) => kpi(ws, l as string, v as string, c as string));
    section(ws, "TABLE PERFORMANCE SUMMARY", 6);
    const h = thead(ws, ["Table", "Orders", "Avg Turn Time (min)", "Revenue (INR)", "Avg Revenue/Order (INR)", "Performance"], T.brand, T.white, true);
    freezeAt(ws, h.number);
    tableTurnData.sort((a: any, b: any) => b.count - a.count).forEach((t: any, i: number) => {
      const perf = t.count > (tableTurnData.reduce((s: number, x: any) => s + x.count, 0) / Math.max(tableTurnData.length, 1)) ? "High" : "Normal";
      const r = drow(ws, [t.name || t.tableName, t.count, t.avgTime, "—", "—", perf], i % 2 === 0);
      if (perf === "High") r.getCell(6).font = { bold: true, size: 8.5, color: { argb: T.green }, name: "Calibri" };
    });
  }

  // Waste Report
  {
    const ws = newSheet(wb, "Waste Report", [18, 22, 18, 16, 20, 20]);
    title(ws, "Waste & Inventory Report", `${inventoryAdjustments.length} adjustments logged`, 6);
    section(ws, "WASTE KPIs", 5);
    const wastage = inventoryAdjustments.filter(a => a.adjustmentType === "WASTAGE" || a.adjustmentType === "EXPIRED");
    const damage  = inventoryAdjustments.filter(a => a.adjustmentType === "DAMAGE");
    [["Total Adjustments", String(inventoryAdjustments.length), T.slate], ["Wastage/Expired", String(wastage.length), T.amber],
     ["Damage", String(damage.length), T.redDk], ["Unique Ingredients", String(Object.keys(wasteByIng).length), T.purple]].forEach(([l, v, c]) => kpi(ws, l as string, v as string, c as string));
    section(ws, "TOP WASTED INGREDIENTS", 6, T.amber);
    const h1 = thead(ws, ["Ingredient", "Total Qty Wasted", "Adjustments", "Avg Per Entry", "", ""], T.amber, T.white, true);
    freezeAt(ws, h1.number);
    Object.entries(wasteByIng).sort((a, b) => b[1].qty - a[1].qty).slice(0, 20).forEach(([name, d], i) => {
      drow(ws, [name, d.qty.toFixed(2), d.adj, d.adj > 0 ? (d.qty / d.adj).toFixed(2) : 0, "", ""], i % 2 === 0, [2, 4]);
    });
    section(ws, "ADJUSTMENT LOG", 6);
    const h2 = thead(ws, ["Date", "Ingredient", "Type", "Quantity", "Reason", "Updated By"], T.brand, T.white, true);
    freezeAt(ws, h2.number);
    inventoryAdjustments.forEach((a: any, i: number) => {
      const r = drow(ws, [new Date(a.createdAt).toLocaleDateString("en-IN"), a.ingredient?.name || "—", a.adjustmentType || "—", n(a.quantity).toFixed(2), a.reason || "—", a.updatedBy?.name || "—"], i % 2 === 0, [4]);
      const typeColors: Record<string, string> = { WASTAGE: T.amber, DAMAGE: T.redDk, EXPIRED: T.purple, MANUAL: T.muted };
      r.getCell(3).font = { bold: true, size: 8.5, color: { argb: typeColors[a.adjustmentType] || T.slate }, name: "Calibri" };
    });
  }

  // ════════════════════════════════════════════════════
  // SHEETS 19–21: Heatmap, Day Analysis, Forecast
  // ════════════════════════════════════════════════════

  // Hourly Heatmap
  {
    const ws = newSheet(wb, "Hourly Heatmap", [18, 18, 14, 18, 16, 20]);
    title(ws, "Hourly Revenue Heatmap", "Revenue patterns by hour and day of week", 6);
    const hd = heatmap?.hourlyData || [];
    const dd = heatmap?.dailyData || [];
    const ph = heatmap?.peakHour || {};
    const pd = heatmap?.peakDay || {};
    section(ws, "HEATMAP KPIs", 5);
    [["Peak Hour", ph.label || "—", T.brand], ["Best Day", pd.name || "—", T.blue],
     ["Peak Hour Orders", String(ph.orders || 0), T.green], ["Best Day Orders", String(pd.orders || 0), T.purple]].forEach(([l, v, c]) => kpi(ws, l as string, v as string, c as string));
    section(ws, "REVENUE BY HOUR", 6);
    const h1 = thead(ws, ["Hour", "Revenue (INR)", "Orders", "Avg Bill (INR)", "Revenue %", "Peak?"], T.brand, T.white, true);
    freezeAt(ws, h1.number);
    hd.filter((h: any) => h.hour >= 6).forEach((h: any, i: number) => {
      const r = drow(ws, [h.label, h.revenue, h.orders, h.orders ? Math.round(h.revenue / h.orders) : 0, pct(h.revenue, hd.reduce((s: number, x: any) => s + x.revenue, 0)), h.revenue === ph.revenue ? "Peak" : ""], i % 2 === 0, [2, 4]);
      if (h.revenue === ph.revenue) r.eachCell(c => { c.fill = fill(T.brandLt); });
    });
    section(ws, "REVENUE BY DAY OF WEEK", 6, T.blue);
    const h2 = thead(ws, ["Day", "Revenue (INR)", "Orders", "Avg Bill (INR)", "Revenue %", "Best?"], T.blue, T.white, true);
    freezeAt(ws, h2.number);
    dd.forEach((d: any, i: number) => {
      const r = drow(ws, [d.name, d.revenue, d.orders, d.orders ? Math.round(d.revenue / d.orders) : 0, pct(d.revenue, dd.reduce((s: number, x: any) => s + x.revenue, 0)), d.revenue === pd.revenue ? "Best" : ""], i % 2 === 0, [2, 4]);
      if (d.revenue === pd.revenue) r.eachCell(c => { c.fill = fill(T.blueLt); });
    });
  }

  // Day Analysis
  {
    const ws = newSheet(wb, "Day Analysis", [18, 18, 14, 16, 16, 20]);
    title(ws, "Day of Week Analysis", "Revenue, orders and performance by day", 6);
    const dd = heatmap?.dailyData || [];
    const maxDayRev = Math.max(...dd.map((d: any) => d.revenue), 1);
    section(ws, "DAILY PERFORMANCE TABLE", 6);
    const h = thead(ws, ["Day", "Revenue (INR)", "Orders", "Avg Bill (INR)", "Revenue Share %", "Performance"], T.brand, T.white, true);
    freezeAt(ws, h.number);
    dd.forEach((d: any, i: number) => {
      const share = pct(d.revenue, dd.reduce((s: number, x: any) => s + x.revenue, 0));
      const perf = d.revenue === 0 ? "No Data" : d.revenue / maxDayRev >= 0.9 ? "Peak Day" : d.revenue / maxDayRev < 0.5 ? "Slow Day" : "Normal";
      const r = drow(ws, [d.name, d.revenue, d.orders, d.orders ? Math.round(d.revenue / d.orders) : 0, share, perf], i % 2 === 0, [2, 4]);
      if (perf === "Peak Day") r.eachCell(c => { c.fill = fill(T.greenLt); c.font = { bold: true, size: 8.5, color: { argb: T.greenDk }, name: "Calibri" }; });
      else if (perf === "Slow Day") r.eachCell(c => { c.fill = fill(T.amberLt); });
    });
  }

  // Revenue Forecast
  {
    const ws = newSheet(wb, "Revenue Forecast", [18, 22, 22, 22, 16]);
    title(ws, "Revenue Forecast", "7-day prediction  ·  Rolling average  ·  Growth trends", 5);
    const fSum = (forecast as any)?.summary || {};
    section(ws, "FORECAST KPIs", 5);
    [["Last 7-Day Avg", inr(fSum.avg7 || 0), T.blue], ["Prev 7-Day Avg", inr(fSum.avgPrev7 || 0), T.slate],
     ["W-o-W Growth", `${fSum.growthPercent >= 0 ? "+" : ""}${fSum.growthPercent || 0}%`, (fSum.growthPercent || 0) >= 0 ? T.green : T.redDk],
     ["7-Day Forecast Total", inr(fSum.forecastTotal || 0), T.purple]].forEach(([l, v, c]) => kpi(ws, l as string, v as string, c as string));
    section(ws, "30-DAY HISTORY", 5);
    const h1 = thead(ws, ["Date", "Actual Revenue (INR)", "", "", ""], T.brand, T.white, true);
    freezeAt(ws, h1.number);
    ((forecast as any)?.history || []).forEach((f: any, i: number) => drow(ws, [f.date, f.revenue, "", "", ""], i % 2 === 0, [2]));
    section(ws, "7-DAY FORECAST TABLE", 5, T.purple);
    const h2 = thead(ws, ["Date", "Predicted Revenue (INR)", "Lower Range (INR)", "Upper Range (INR)", "Confidence"], T.purple, T.white, true);
    freezeAt(ws, h2.number);
    ((forecast as any)?.forecast || []).forEach((f: any, i: number) => {
      drow(ws, [f.date, inr(f.predicted), inr(f.lower), inr(f.upper), "+-15%"], i % 2 === 0, [2, 3, 4]);
    });
  }

  // ════════════════════════════════════════════════════
  // SHEETS 22–24: Attendance, Productivity, Cash
  // ════════════════════════════════════════════════════

  // Staff Attendance
  {
    const ws = newSheet(wb, "Staff Attendance", [24, 16, 16, 14, 12, 12, 12, 14, 14]);
    title(ws, "Staff Attendance", `${allStaff.length} staff  ·  Attendance register`, 9);
    const presentCount = new Set(attendance.filter(a => a.loginTime).map(a => a.userId)).size;
    const lateCount    = attendance.filter(a => a.loginTime && (new Date(a.loginTime).getHours() > 9 || (new Date(a.loginTime).getHours() === 9 && new Date(a.loginTime).getMinutes() > 15))).length;
    section(ws, "ATTENDANCE KPIs", 5);
    [["Total Staff", String(allStaff.length), T.blue], ["Present", String(presentCount), T.green],
     ["Absent", String(allStaff.length - presentCount), T.redDk], ["Late Arrivals", String(lateCount), T.amber],
     ["Total Hours", `${attendance.reduce((s, a) => s + n(a.totalHours), 0).toFixed(0)}h`, T.purple]].forEach(([l, v, c]) => kpi(ws, l as string, v as string, c as string));
    section(ws, "ATTENDANCE REGISTER", 9);
    const h = thead(ws, ["Staff Name", "Phone", "Department", "Role", "Clock In", "Clock Out", "Break (min)", "Hours", "Status"], T.brand, T.white, true);
    freezeAt(ws, h.number);
    allStaff.forEach((s: any, i: number) => {
      const att = attendance.find((a: any) => a.userId === s.id);
      const bm = (att?.breaks || []).reduce((sum: number, b: any) => sum + n(b.totalMinutes), 0);
      const isPresent = !!att?.loginTime;
      const isLate = isPresent && (new Date(att.loginTime).getHours() > 9 || (new Date(att.loginTime).getHours() === 9 && new Date(att.loginTime).getMinutes() > 15));
      const r = drow(ws, [s.name, s.phone || "—", s.department || "—", s.role, att?.loginTime ? new Date(att.loginTime).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "—", att?.logoutTime ? new Date(att.logoutTime).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "—", bm, n(att?.totalHours).toFixed(1), isPresent ? (isLate ? "Late" : "Present") : "Absent"], i % 2 === 0);
      const sc = r.getCell(9);
      if (isPresent && !isLate) sc.font = { bold: true, size: 8.5, color: { argb: T.green }, name: "Calibri" };
      else if (isLate) sc.font = { bold: true, size: 8.5, color: { argb: T.amber }, name: "Calibri" };
      else sc.font = { bold: true, size: 8.5, color: { argb: T.redDk }, name: "Calibri" };
    });
  }

  // Staff Productivity
  {
    const ws = newSheet(wb, "Staff Productivity", [24, 16, 14, 14, 12, 14, 14, 14]);
    title(ws, "Staff Productivity", "Labour cost, shift efficiency and department breakdown", 8);
    const sp = staffProductivity || {};
    section(ws, "PRODUCTIVITY KPIs", 5);
    [["Total Staff", String(sp.totals?.totalStaff || allStaff.length), T.blue], ["Hours Worked", `${sp.totals?.totalHoursWorked || 0}h`, T.amber],
     ["Monthly Labour Cost", inr(sp.totals?.totalLabourCost || allStaff.reduce((s, st) => s + n(st.salary), 0)), T.redDk],
     ["Avg Hours/Staff", sp.totals?.totalStaff ? `${Math.round((sp.totals?.totalHoursWorked || 0) / sp.totals.totalStaff)}h` : "—", T.green]].forEach(([l, v, c]) => kpi(ws, l as string, v as string, c as string));
    section(ws, "REVENUE BY SHIFT", 5, T.amber);
    const h1 = thead(ws, ["Shift", "Revenue (INR)", "% of Total", "", ""], T.amber, T.white, true);
    freezeAt(ws, h1.number);
    const srev = sp.shiftRevenue || {};
    const totalShiftRev = Object.values(srev).reduce<number>((s, v: any) => s + n(v), 0);
    [["Morning (6-12 AM)", srev.morning], ["Afternoon (12-5 PM)", srev.afternoon], ["Evening (5-10 PM)", srev.evening], ["Night (10 PM-6 AM)", srev.night]].forEach(([shift, rev], i) => {
      drow(ws, [shift, inr(rev), pct(n(rev), totalShiftRev), "", ""], i % 2 === 0, [2]);
    });
    section(ws, "DEPARTMENT COST BREAKDOWN", 5, T.blue);
    const h2 = thead(ws, ["Department", "Staff Count", "Hours Worked", "Avg Salary (INR)", "Total Salary (INR)", "", ""], T.blue, T.white, true);
    freezeAt(ws, h2.number);
    (sp.deptData || []).forEach((d: any, i: number) => {
      drow(ws, [d.dept, d.count, d.totalHours, inr(d.avgSalary), inr(d.totalSalary), "", ""], i % 2 === 0, [4, 5]);
    });
    section(ws, "STAFF EFFICIENCY TABLE", 8);
    const h3 = thead(ws, ["Staff", "Dept", "Shift", "Days Present", "Hours", "Attendance %", "Salary (INR)", "Cost/Hour (INR)"], T.brand, T.white, true);
    freezeAt(ws, h3.number);
    (sp.staff || allStaff).forEach((s: any, i: number) => {
      drow(ws, [s.name, s.department || "—", s.shift || "—", s.daysPresent || "—", s.totalHours || "—", s.attendanceRate !== undefined ? `${s.attendanceRate}%` : "—", inr(s.monthlySalary || s.salary), s.costPerHour ? inr(s.costPerHour) : "—"], i % 2 === 0, [7, 8]);
    });
  }

  // Cash Reconciliation
  {
    const ws = newSheet(wb, "Cash Reconciliation", [18, 20, 14, 16, 16, 16, 12, 16]);
    title(ws, "Cash Session Reconciliation", `${cashSessions.length} sessions`, 8);
    const shortfall = cashSessions.reduce((s, r) => s + Math.abs(Math.min(0, n(r.cashDifference))), 0);
    const surplus   = cashSessions.reduce((s, r) => s + Math.max(0, n(r.cashDifference)), 0);
    section(ws, "CASH KPIs", 5);
    [["Total Sessions", String(cashSessions.length), T.blue], ["Total Shortfall", inr(shortfall), T.redDk],
     ["Total Surplus", inr(surplus), T.green], ["Net Difference", inr(surplus - shortfall), surplus >= shortfall ? T.green : T.redDk]].forEach(([l, v, c]) => kpi(ws, l as string, v as string, c as string));
    section(ws, "SESSION HISTORY", 8);
    const h = thead(ws, ["Date", "Opened By", "Open Time", "Close Time", "Opening (INR)", "Expected (INR)", "Actual (INR)", "Diff (INR)"], T.brand, T.white, true);
    freezeAt(ws, h.number);
    cashSessions.forEach((s: any, i: number) => {
      const diff = n(s.cashDifference);
      const r = drow(ws, [new Date(s.businessDate).toLocaleDateString("en-IN"), s.openedBy?.name || "—", s.openedAt ? new Date(s.openedAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "—", s.closedAt ? new Date(s.closedAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "—", n(s.openingCash), n(s.expectedCash), n(s.actualCash || s.closingCash), diff], i % 2 === 0, [5, 6, 7, 8]);
      const dc = r.getCell(8);
      if (diff < 0) dc.font = { bold: true, size: 8.5, color: { argb: T.redDk }, name: "Calibri" };
      else if (diff > 0) dc.font = { bold: true, size: 8.5, color: { argb: T.green }, name: "Calibri" };
      else dc.font = { size: 8.5, color: { argb: T.muted }, name: "Calibri" };
    });
    srow(ws, ["TOTALS", "", "", "", cashSessions.reduce((s, r) => s + n(r.openingCash), 0), cashSessions.reduce((s, r) => s + n(r.expectedCash), 0), cashSessions.reduce((s, r) => s + n(r.actualCash || r.closingCash), 0), surplus - shortfall], T.greenLt, T.greenDk);
  }

  // ════════════════════════════════════════════════════
  // SHEETS 25–27: Kitchen, Branch, City
  // ════════════════════════════════════════════════════

  // Kitchen Analytics
  {
    const ws = newSheet(wb, "Kitchen Analytics", [24, 16, 18, 18, 16]);
    title(ws, "Kitchen Performance Analytics", "Order speed  ·  SLA compliance  ·  Throughput", 5, T.amber);
    const ks = kitchenData?.summary || {};
    section(ws, "KITCHEN KPIs", 5, T.amber);
    [["Total Orders", String(ks.totalOrders || 0), T.blue], ["Avg Completion", `${ks.avgTime || 0} min`, ks.avgTime <= 30 ? T.green : T.amber],
     ["SLA Compliance", `${ks.slaPercent || 0}%`, (ks.slaPercent || 0) >= 80 ? T.green : T.redDk],
     ["Fastest Order", `${ks.fastestOrder || 0} min`, T.green], ["Peak Hour", ks.peakHourLabel || "—", T.amber]].forEach(([l, v, c]) => kpi(ws, l as string, v as string, c as string));
    section(ws, "HOURLY THROUGHPUT", 5, T.amber);
    const h1 = thead(ws, ["Hour", "Orders", "Avg Time (min)", "SLA Status", ""], T.amber, T.white, true);
    freezeAt(ws, h1.number);
    (kitchenData?.hourlyData || []).filter((h: any) => h.orders > 0).forEach((h: any, i: number) => {
      drow(ws, [h.label, h.orders, h.avgTime, h.avgTime <= 30 ? "Within SLA" : "Over SLA", ""], i % 2 === 0);
    });
    section(ws, "SPEED BY ORDER TYPE", 5, T.amber);
    const h2 = thead(ws, ["Order Type", "Count", "Avg Time (min)", "SLA Status", ""], T.amber, T.white, true);
    freezeAt(ws, h2.number);
    (kitchenData?.orderTypeSpeeds || []).forEach((o: any, i: number) => {
      drow(ws, [o.type, o.count, o.avgTime, o.avgTime <= 30 ? "Within SLA" : "Over SLA", ""], i % 2 === 0);
    });
    section(ws, "TOP KITCHEN ITEMS", 5, T.amber);
    const h3 = thead(ws, ["Item Name", "Times Prepared", "Kitchen Load %", "", ""], T.amber, T.white, true);
    freezeAt(ws, h3.number);
    const maxKit = (kitchenData?.topItems || [])[0]?.count || 1;
    (kitchenData?.topItems || []).slice(0, 20).forEach((item: any, i: number) => {
      drow(ws, [item.name, item.count, `${((item.count / maxKit) * 100).toFixed(1)}%`, "", ""], i % 2 === 0);
    });
    section(ws, "SLOWEST ORDERS", 5, T.redDk);
    const h4 = thead(ws, ["Order ID", "Order Type", "Table", "Duration (min)", "Started At", "SLA Status"], T.redDk, T.white, true);
    freezeAt(ws, h4.number);
    (kitchenData?.slowestOrders || []).forEach((o: any, i: number) => {
      const r = drow(ws, [`#${o.id}`, (o.orderType || "").replace("_", " "), o.tableName || "—", o.durationMinutes, new Date(o.startedAt).toLocaleTimeString("en-IN"), o.durationMinutes <= 30 ? "Met" : "Missed"], i % 2 === 0);
      if (o.durationMinutes > 30) r.eachCell(c => { c.fill = fill(T.lossRed); });
    });
  }

  // Branch Comparison
  {
    const ws = newSheet(wb, "Branch Comparison", [24, 18, 12, 16, 14, 16, 14, 12]);
    title(ws, "Branch vs Branch Comparison", `${branchComparison.length} branches analysed`, 8, T.blue);
    section(ws, "BRANCH PERFORMANCE", 8, T.blue);
    const h = thead(ws, ["Branch", "Revenue (INR)", "Orders", "Avg Bill (INR)", "GST (INR)", "Net Profit (INR)", "Staff", "Winner"], T.blue, T.white, true);
    freezeAt(ws, h.number);
    const maxBRev = Math.max(...branchComparison.map(b => b.revenue), 1);
    branchComparison.forEach((b: any, i: number) => {
      const r = drow(ws, [b.branch?.name || "—", b.revenue, b.orders, b.orders ? Math.round(b.revenue / b.orders) : 0, b.gst, b.netProfit, b.staffCount, b.revenue === maxBRev ? "Top" : ""], i % 2 === 0, [2, 4, 5, 6]);
      if (b.revenue === maxBRev) r.eachCell(c => { c.fill = fill(T.greenLt); c.font = { bold: true, size: 8.5, color: { argb: T.greenDk }, name: "Calibri" }; });
    });
  }

  // City Comparison
  {
    const ws = newSheet(wb, "City Comparison", [20, 14, 18, 14, 16, 16, 14, 12]);
    title(ws, "City vs City Comparison", `${cityComparison.length} cities analysed`, 8, T.purple);
    if (cityComparison.length > 1) {
      section(ws, "CITY PERFORMANCE", 8, T.purple);
      const h = thead(ws, ["City", "Branches", "Revenue (INR)", "Orders", "Avg Bill (INR)", "Net Profit (INR)", "Staff", "Winner"], T.purple, T.white, true);
      freezeAt(ws, h.number);
      const maxCRev = Math.max(...cityComparison.map(c => c.revenue), 1);
      cityComparison.forEach((c: any, i: number) => {
        const r = drow(ws, [c.city || "—", c.branches?.length || 0, c.revenue, c.orders, c.orders ? Math.round(c.revenue / c.orders) : 0, c.netProfit, c.staffCount || "—", c.revenue === maxCRev ? "Top" : ""], i % 2 === 0, [3, 5, 6]);
        if (c.revenue === maxCRev) r.eachCell(c2 => { c2.fill = fill(T.purpleLt); c2.font = { bold: true, size: 8.5, color: { argb: T.purple }, name: "Calibri" }; });
      });
    } else {
      ws.addRow([]); const nr = ws.addRow(["Only one city found. Add branches with different cities in Settings to enable city comparison."]);
      nr.getCell(1).font = { italic: true, size: 10, color: { argb: T.muted }, name: "Calibri" };
    }
  }

  return wb.xlsx.writeBuffer();
}
