// @ts-ignore
import jsPDF from "jspdf";
// @ts-ignore
import autoTable from "jspdf-autotable";
import type { FullReportData } from "./reportData";

// ─── Design tokens ────────────────────────────────────────────────────────────
type RGB = [number, number, number];

const C = {
  brand:    [177,   0,   0] as RGB,   // DineInk #b10000
  brandLt:  [254, 242, 242] as RGB,   // very light red
  brandMd:  [254, 202, 202] as RGB,
  ink:      [ 15,  23,  42] as RGB,   // slate-900
  slate:    [ 51,  65,  85] as RGB,   // slate-700
  muted:    [100, 116, 139] as RGB,   // slate-500
  faint:    [148, 163, 184] as RGB,   // slate-400
  border:   [226, 232, 240] as RGB,   // slate-200
  surface:  [248, 250, 252] as RGB,   // slate-50
  white:    [255, 255, 255] as RGB,
  green:    [  5, 150, 105] as RGB,
  greenLt:  [209, 250, 229] as RGB,
  blue:     [ 37,  99, 235] as RGB,
  blueLt:   [219, 234, 254] as RGB,
  amber:    [180, 100,   0] as RGB,
  amberLt:  [254, 243, 199] as RGB,
  purple:   [109,  40, 217] as RGB,
  purpleLt: [237, 233, 254] as RGB,
  teal:     [ 13, 148, 136] as RGB,
};

const PW = 210;   // A4 width mm
const PH = 297;   // A4 height mm
const ML = 16;    // left margin
const MR = 16;    // right margin
const CW = PW - ML - MR;

// jsPDF built-in fonts cover only Latin-1 — replace rupee sign and unicode chars
const RS = (v: any) => `Rs.${Math.round(Number(v || 0)).toLocaleString("en-IN")}`;
const PCT = (v: number, t: number) =>
  t > 0 ? `${((v / t) * 100).toFixed(1)}%` : "0%";
const safe = (s: string) =>
  String(s)
    .replace(/₹/g, "Rs.")
    .replace(/[→➜]/g, "->")
    .replace(/✅/g, "OK")
    .replace(/❌/g, "X")
    .replace(/[^\x00-\xFF]/g, "");

// ─── Primitives ───────────────────────────────────────────────────────────────
const fr = (d: any, x: number, y: number, w: number, h: number, c: RGB) => {
  d.setFillColor(...c);
  d.rect(x, y, w, h, "F");
};
const rr = (d: any, x: number, y: number, w: number, h: number, r: number, c: RGB) => {
  d.setFillColor(...c);
  d.roundedRect(x, y, w, h, r, r, "F");
};
const ln = (d: any, x1: number, y1: number, x2: number, y2: number, c: RGB, lw = 0.25) => {
  d.setDrawColor(...c);
  d.setLineWidth(lw);
  d.line(x1, y1, x2, y2);
};
const box = (d: any, x: number, y: number, w: number, h: number, c: RGB, lw = 0.3) => {
  d.setDrawColor(...c);
  d.setLineWidth(lw);
  d.rect(x, y, w, h);
};
const txt = (
  d: any, s: string, x: number, y: number,
  o: { size?: number; bold?: boolean; italic?: boolean; color?: RGB; align?: "left"|"center"|"right" } = {},
) => {
  d.setFontSize(o.size || 9);
  d.setFont("helvetica", o.bold ? "bold" : o.italic ? "italic" : "normal");
  d.setTextColor(...(o.color || C.ink));
  d.text(safe(s), x, y, o.align ? { align: o.align } : undefined);
};

// ─── Page chrome ──────────────────────────────────────────────────────────────
function pageFooter(doc: any, page: number, total: number, meta: { restaurantName: string; branchName: string; from: string; to: string }) {
  const fy = PH - 8;
  ln(doc, ML, fy, PW - MR, fy, C.border, 0.3);
  txt(doc, `${meta.restaurantName}  |  ${meta.branchName}`, ML, fy + 4, { size: 6.5, color: C.faint });
  txt(doc, `${meta.from}  to  ${meta.to}`, PW / 2, fy + 4, { size: 6.5, color: C.faint, align: "center" });
  txt(doc, `Page ${page} of ${total}`, PW - MR, fy + 4, { size: 6.5, bold: true, color: C.brand, align: "right" });
}

// ─── Section heading ──────────────────────────────────────────────────────────
function sectionHead(doc: any, title: string, subtitle: string, y: number, accent: RGB = C.brand): number {
  fr(doc, ML, y, CW, 13, C.surface);
  fr(doc, ML, y, 3.5, 13, accent);
  txt(doc, title.toUpperCase(), ML + 7, y + 5.5, { size: 8, bold: true, color: C.ink });
  if (subtitle) txt(doc, subtitle, ML + 7, y + 10.5, { size: 6.5, color: C.muted, italic: true });
  return y + 17;
}

// ─── Sub-section divider ──────────────────────────────────────────────────────
function divider(doc: any, label: string, y: number, accent: RGB = C.brand): number {
  ln(doc, ML, y, PW - MR, y, C.border, 0.3);
  fr(doc, ML, y, 2.5, 6.5, accent);
  txt(doc, label, ML + 5, y + 5, { size: 7, bold: true, color: C.slate });
  return y + 9;
}

// ─── KPI card grid ────────────────────────────────────────────────────────────
function kpiGrid(
  doc: any,
  items: { label: string; value: string; sub?: string; accent?: RGB }[],
  y: number,
  cols = 4,
): number {
  const gap = 3;
  const w = (CW - gap * (cols - 1)) / cols;
  const h = items.some((k) => k.sub) ? 22 : 18;
  items.forEach((k, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = ML + col * (w + gap);
    const cy = y + row * (h + gap);
    const ac = k.accent || C.brand;
    // card background + border
    rr(doc, x, cy, w, h, 2, C.white);
    doc.setDrawColor(...C.border);
    doc.setLineWidth(0.3);
    doc.roundedRect(x, cy, w, h, 2, 2);
    // top accent stripe
    fr(doc, x, cy, w, 2.5, ac);
    // label
    txt(doc, k.label.toUpperCase(), x + 4, cy + 8, { size: 5.5, bold: true, color: C.faint });
    // value
    txt(doc, k.value, x + 4, cy + 15, { size: 12, bold: true, color: ac });
    if (k.sub) txt(doc, k.sub, x + 4, cy + 20, { size: 5.5, color: C.muted });
  });
  const rows = Math.ceil(items.length / cols);
  return y + rows * (h + gap) + 3;
}

// ─── Two-column KPI row (label : value) ───────────────────────────────────────
function labelValueRows(doc: any, rows: [string, string, RGB?][], y: number): number {
  rows.forEach(([label, value, ac], i) => {
    const bg = i % 2 === 0 ? C.white : C.surface;
    fr(doc, ML, y, CW, 7, bg);
    txt(doc, label, ML + 3, y + 5, { size: 7.5, color: C.slate });
    txt(doc, value, PW - MR - 3, y + 5, { size: 7.5, bold: true, color: ac || C.ink, align: "right" });
    y += 7;
  });
  return y + 2;
}

// ─── Auto table wrapper ───────────────────────────────────────────────────────
function table(
  doc: any,
  head: string[][],
  body: (string | number)[][],
  y: number,
  accent: RGB = C.brand,
  opts: any = {},
): number {
  if (body.length === 0) return y;
  autoTable(doc, {
    startY: y,
    head,
    body,
    headStyles: {
      fillColor: accent,
      textColor: [255, 255, 255],
      fontSize: 7,
      fontStyle: "bold",
      cellPadding: 3,
    },
    bodyStyles: {
      fontSize: 7,
      cellPadding: 3,
      textColor: C.ink,
    },
    alternateRowStyles: { fillColor: C.surface },
    styles: { overflow: "ellipsize" },
    margin: { left: ML, right: MR },
    theme: "plain",
    ...opts,
  });
  return (doc as any).lastAutoTable.finalY + 5;
}

// ─── Horizontal bar chart ─────────────────────────────────────────────────────
function hBars(
  doc: any, data: { label: string; value: number; color?: RGB }[],
  x: number, y: number, w: number, title?: string,
): number {
  if (data.length === 0) return y;
  if (title) { txt(doc, title, x, y, { size: 7, bold: true, color: C.slate }); y += 6; }
  const max = Math.max(...data.map((d) => d.value), 1);
  const bh = 5.5, gap = 2.5, lw = 44, vw = 22, bw = w - lw - vw - 2;
  data.slice(0, 8).forEach((d, i) => {
    const by = y + i * (bh + gap);
    const fw = Math.max((d.value / max) * bw, 1.5);
    const c = d.color || C.brand;
    fr(doc, x + lw, by, bw, bh, C.surface);
    rr(doc, x + lw, by, fw, bh, 1, c);
    const lbl = d.label.length > 22 ? d.label.slice(0, 21) + "…" : d.label;
    txt(doc, lbl, x + lw - 2, by + bh - 1, { size: 6.5, color: C.slate, align: "right" });
    txt(doc, RS(d.value), x + lw + bw + 2, by + bh - 1, { size: 6.5, bold: true, color: C.ink });
  });
  return y + data.slice(0, 8).length * (bh + gap) + 5;
}

// ─── Forecast bar chart (smart baseline, clear value + date labels) ───────────
function forecastBars(
  doc: any,
  data: { label: string; value: number }[],
  x: number, y: number, w: number,
): number {
  if (data.length === 0) return y;

  const h      = 50;
  const yAxisW = 22;
  const chartX = x + yAxisW;
  const chartW = w - yAxisW;
  const n      = data.length;
  const vals   = data.map((d) => d.value);
  const maxV   = Math.max(...vals, 1);
  const minV   = Math.min(...vals, 0);

  // Use a smart baseline: start at 80% of min so differences are visible
  const baseline = minV > 0 ? Math.floor(minV * 0.75) : 0;
  const range    = Math.max(maxV - baseline, 1);

  const barGap = Math.max(2, chartW / n * 0.3);
  const barW   = Math.max(4, (chartW - barGap * (n + 1)) / n);

  // Background
  fr(doc, chartX, y, chartW, h, C.surface);

  // Horizontal grid lines (4 levels)
  const steps = 4;
  for (let g = 0; g <= steps; g++) {
    const gy  = y + h - (g / steps) * h;
    const val = baseline + (g / steps) * range;
    const lbl = val >= 1000 ? `Rs.${(val / 1000).toFixed(1)}k` : `Rs.${Math.round(val)}`;
    doc.setDrawColor(...(C.border as number[]));
    doc.setLineWidth(0.2);
    doc.line(chartX, gy, chartX + chartW, gy);
    txt(doc, lbl, chartX - 2, gy + 1.2, { size: 4.5, color: C.faint, align: "right" });
  }

  // Baseline axis
  doc.setDrawColor(...(C.slate as number[]));
  doc.setLineWidth(0.4);
  doc.line(chartX, y + h, chartX + chartW, y + h);

  // Bars
  data.forEach((d, i) => {
    const bh  = Math.max(((d.value - baseline) / range) * (h - 3), 3);
    const bx  = chartX + barGap + i * (barW + barGap);
    const by  = y + h - bh;

    // soft shadow
    doc.setFillColor(180, 140, 220);
    doc.roundedRect(bx + 0.6, by + 0.6, barW, bh, 1.5, 1.5, "F");

    // bar
    rr(doc, bx, by, barW, bh, 1.5, C.purple);

    // value label above bar
    const valLbl = d.value >= 1000
      ? `Rs.${(d.value / 1000).toFixed(1)}k`
      : `Rs.${Math.round(d.value)}`;
    doc.setFontSize(5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...(C.ink as number[]));
    doc.text(valLbl, bx + barW / 2, by - 1.5, { align: "center" });

    // date label below bar
    doc.setFontSize(5.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...(C.slate as number[]));
    doc.text(d.label, bx + barW / 2, y + h + 5, { align: "center" });
  });

  // "Predicted Revenue" legend
  txt(doc, "Predicted daily revenue (next 7 days)", x, y + h + 10, { size: 6, color: C.muted, italic: true });

  return y + h + 16;
}

// ─── Column bar chart ─────────────────────────────────────────────────────────
function colBars(
  doc: any, data: { label: string; value: number }[],
  x: number, y: number, w: number, h: number, title?: string, color: RGB = C.brand,
): number {
  if (data.length === 0) return y;
  if (title) { txt(doc, title, x, y, { size: 7, bold: true, color: C.slate }); y += 5; }

  const max    = Math.max(...data.map((d) => d.value), 1);
  const n      = Math.min(data.length, 30);
  const items  = data.slice(0, n);
  const yAxisW = 18;                          // left axis labels area
  const chartX = x + yAxisW;
  const chartW = w - yAxisW;
  const chartH = h;
  const barGap = Math.max(1.5, chartW / n * 0.25);
  const barW   = Math.max(2, (chartW - barGap * (n + 1)) / n);

  // chart background
  fr(doc, chartX, y, chartW, chartH, C.surface);

  // horizontal grid lines + y-axis labels (4 lines)
  const gridLines = 4;
  for (let g = 0; g <= gridLines; g++) {
    const gy = y + chartH - (g / gridLines) * chartH;
    const val = (g / gridLines) * max;
    // grid line
    doc.setDrawColor(...C.border);
    doc.setLineWidth(0.2);
    doc.line(chartX, gy, chartX + chartW, gy);
    // y-axis label
    const label = val >= 1000 ? `${Math.round(val / 1000)}k` : String(Math.round(val));
    txt(doc, label, chartX - 2, gy + 1, { size: 5, color: C.faint, align: "right" });
  }

  // baseline
  doc.setDrawColor(...C.border);
  doc.setLineWidth(0.4);
  doc.line(chartX, y + chartH, chartX + chartW, y + chartH);

  // bars
  items.forEach((d, i) => {
    const bh  = Math.max((d.value / max) * (chartH - 2), 1.5);
    const bx  = chartX + barGap + i * (barW + barGap);
    const by  = y + chartH - bh;

    // bar shadow (subtle)
    doc.setFillColor(200, 200, 200);
    doc.roundedRect(bx + 0.5, by + 0.5, barW, bh, 1, 1, "F");

    // bar
    rr(doc, bx, by, barW, bh, 1, color);

    // value label on top of bar (only when bars are wide enough)
    if (barW >= 5) {
      const valLabel = d.value >= 1000 ? `${(d.value / 1000).toFixed(1)}k` : String(Math.round(d.value));
      doc.setFontSize(4.5);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...C.ink);
      doc.text(valLabel, bx + barW / 2, by - 1.2, { align: "center" });
    }

    // x-axis label
    if (barW >= 3) {
      const lbl = d.label.slice(0, 6);
      doc.setFontSize(4.5);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...C.faint);
      doc.text(lbl, bx + barW / 2, y + chartH + 4, { align: "center" });
    }
  });

  return y + chartH + 10;
}

// ─── MAIN ENTRY ───────────────────────────────────────────────────────────────
export async function generatePDFReport(
  data: FullReportData,
  meta: { restaurantName: string; branchName: string; from: string; to: string },
): Promise<Uint8Array> {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const {
    analytics, bills, expenses, customers, menuItems,
    kitchenData, attendance, allStaff, cashSessions,
    branchComparison, forecast, rfm, insightsData, inventoryAdjustments,
  } = data;

  // ── Pre-compute shared numbers ─────────────────────────────────────────────
  const activeBills = bills.filter((b: any) => b.status !== "CANCELLED");
  const totalRev   = activeBills.reduce((s: number, b: any) => s + Number(b.total || 0), 0);
  const totalGST   = activeBills.reduce((s: number, b: any) => s + Number(b.cgst || 0) + Number(b.sgst || 0), 0);
  const totalDisc  = activeBills.reduce((s: number, b: any) => s + Number(b.discount || 0), 0);
  const totalExp   = expenses.reduce((s: number, e: any) => s + Number(e.amount || 0), 0);
  const paidBills  = activeBills.filter((b: any) => b.status === "PAID");
  const margin     = totalRev > 0 ? ((( totalRev - totalGST - totalExp) / totalRev) * 100).toFixed(1) : "0";

  const ins = insightsData || {};
  const n   = (v: any) => Number(v || 0);
  const fixedExp  = n(ins.monthlyRent) + n(ins.loanEmi) + n(ins.internet) + n(ins.phoneBills) + n(ins.accounting) + n(ins.insurance) + n(ins.licenses);
  const varExp    = n(ins.deliveryCharges) + n(ins.packaging) + n(ins.paymentGateway) + n(ins.aggregatorCommission) + n(ins.electricity) + n(ins.gas) + n(ins.maintenance) + n(ins.fuel);
  const labourExp = allStaff.reduce((s: number, st: any) => s + n(st.salary), 0);
  const finExp    = n(ins.monthlyLoanEmi) + n(ins.monthlyInterestPayments) + n(ins.caFees) + n(ins.insuranceCost) + n(ins.otherTaxes);
  // Same priority as Insights.tsx: manual entry → live inventory stock value
  const inventoryStockValue = (data.ingredients || []).reduce(
    (sum: number, ing: any) => sum + n(ing.quantity) * n(ing.pricePerUnit), 0,
  );
  const foodExp = n(ins.manualFoodCost) > 0
    ? n(ins.manualFoodCost)
    : inventoryStockValue > 0
      ? inventoryStockValue
      : 0;
  const insRev    = n(ins.revenue) || totalRev;
  const totalCosts = fixedExp + varExp + labourExp + finExp + foodExp;
  const ebitdaAmt  = insRev - totalCosts;
  const ebitdaPct  = insRev > 0 ? ((ebitdaAmt / insRev) * 100).toFixed(1) : "0";

  // customers
  const now = Date.now();
  const repeatC  = customers.filter((c: any) => c.visits > 1).length;
  const activeC  = customers.filter((c: any) => c.lastVisit && (now - new Date(c.lastVisit).getTime()) / 86400000 <= 30);

  // items
  const itemMap: Record<string, { qty: number; rev: number; cat: string }> = {};
  activeBills.forEach((b: any) => {
    (b.items || []).forEach((item: any) => {
      if (!itemMap[item.itemName]) itemMap[item.itemName] = { qty: 0, rev: 0, cat: "—" };
      itemMap[item.itemName].qty += Number(item.quantity || 0);
      itemMap[item.itemName].rev += Number(item.total || 0);
    });
  });
  menuItems.forEach((m: any) => { if (itemMap[m.name]) itemMap[m.name].cat = m.category?.name || "—"; });
  const topItems = Object.entries(itemMap).sort((a, b) => b[1].rev - a[1].rev);

  // payment & order-type splits
  const payMap: Record<string, number> = {};
  const otMap:  Record<string, number> = {};
  activeBills.forEach((b: any) => {
    const pm = b.paymentMethod || "Other";
    const ot = (b.orderType || "OTHER").replace(/_/g, " ");
    payMap[pm] = (payMap[pm] || 0) + Number(b.total || 0);
    otMap[ot]  = (otMap[ot]  || 0) + Number(b.total || 0);
  });

  // daily revenue
  const byDate: Record<string, number> = {};
  activeBills.forEach((b: any) => {
    const d = new Date(b.createdAt).toLocaleDateString("en-IN");
    byDate[d] = (byDate[d] || 0) + Number(b.total || 0);
  });
  const dailyArr = Object.entries(byDate).sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime());

  // kitchen
  const avgKitchenTime = kitchenData?.avgPrepTime || kitchenData?.averageTime || 0;
  const kitchenOrders  = kitchenData?.totalOrders || activeBills.length;

  // ══════════════════════════════════════════════════════════════════════════
  //  COVER PAGE
  // ══════════════════════════════════════════════════════════════════════════
  // Brand header band
  fr(doc, 0, 0, PW, 55, C.brand);

  // White DineInk wordmark area
  fr(doc, ML, 10, 55, 14, C.white);
  txt(doc, "Dine", ML + 3, 20, { size: 13, bold: true, color: C.brand });
  txt(doc, "Ink", ML + 3 + doc.getTextWidth("Dine"), 20, { size: 13, bold: true, color: C.ink });
  txt(doc, "RESTAURANT INTELLIGENCE", ML + 62, 18, { size: 7.5, bold: true, color: C.white });
  txt(doc, "PLATFORM", ML + 62, 24, { size: 7.5, color: [254, 202, 202] as RGB });

  // Horizontal rule in band
  fr(doc, ML, 35, CW, 0.5, [254, 202, 202] as RGB);

  // Main title in band
  txt(doc, "BUSINESS PERFORMANCE", ML, 44, { size: 18, bold: true, color: C.white });
  txt(doc, "REPORT", PW - MR - 2, 44, { size: 18, bold: true, color: [254, 202, 202] as RGB, align: "right" });

  // Subtitle
  txt(doc, "Comprehensive Financial & Operational Intelligence", ML, 52, { size: 8, color: [254, 226, 226] as RGB });

  // Restaurant info block
  fr(doc, 0, 55, PW, 38, C.surface);
  fr(doc, ML, 62, 3.5, 22, C.brand);
  txt(doc, meta.restaurantName, ML + 7, 70, { size: 17, bold: true, color: C.ink });
  txt(doc, `Branch: ${meta.branchName}`, ML + 7, 78, { size: 9, color: C.slate });
  txt(doc, `Reporting Period: ${meta.from}  to  ${meta.to}`, ML + 7, 85, { size: 8, color: C.muted });
  txt(doc, `Generated: ${new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}`, PW - MR - 3, 85, { size: 7.5, color: C.brand, bold: true, align: "right" });
  ln(doc, 0, 93, PW, 93, C.border, 0.5);

  // ── Snapshot KPIs on cover ─────────────────────────────────────────────────
  let y = 100;
  y = kpiGrid(doc, [
    { label: "Total Revenue",   value: RS(totalRev),       sub: `${activeBills.length} orders`, accent: C.brand },
    { label: "Net Profit",      value: RS(totalRev - totalGST - totalExp), sub: `${margin}% margin`,   accent: Number(margin) >= 0 ? C.green : C.brand },
    { label: "EBITDA",          value: `${ebitdaPct}%`,    sub: `target ${n(ins.targetEbitda) || 0}%`, accent: Number(ebitdaPct) >= n(ins.targetEbitda) ? C.green : C.brand },
    { label: "Avg Order Value", value: RS(activeBills.length ? totalRev / activeBills.length : 0), sub: "per transaction", accent: C.blue },
    { label: "Customers",       value: String(customers.length), sub: `${repeatC} returning`, accent: C.purple },
    { label: "Total GST",       value: RS(totalGST),        sub: "CGST + SGST",         accent: C.amber },
    { label: "Active Customers",value: String(activeC.length), sub: "last 30 days",     accent: C.teal },
    { label: "Discounts Given", value: RS(totalDisc),       sub: "across all orders",   accent: C.slate },
  ], y, 4);

  // Table of Contents
  y += 4;
  ln(doc, ML, y, PW - MR, y, C.border, 0.3);
  y += 6;
  txt(doc, "REPORT CONTENTS", ML, y, { size: 6.5, bold: true, color: C.faint });
  y += 6;
  const toc = [
    ["01", "Executive Summary"],
    ["02", "Revenue & Order Analysis"],
    ["03", "Menu Performance"],
    ["04", "Financial Overview — P&L, Expenses & EBITDA"],
    ["05", "Customer Intelligence"],
    ["06", "Operations & Staff"],
  ];
  toc.forEach(([num, title], i) => {
    const col = i < 3 ? 0 : 1;
    const row = i < 3 ? i : i - 3;
    const tx = ML + col * (CW / 2 + 3);
    const ty = y + row * 8;
    fr(doc, tx, ty - 3.5, 7, 6, C.brand);
    txt(doc, num, tx + 1.5, ty + 0.5, { size: 5.5, bold: true, color: C.white });
    txt(doc, title, tx + 10, ty + 0.5, { size: 7.5, color: C.slate });
  });

  // Confidential footer on cover
  y = PH - 20;
  ln(doc, ML, y, PW - MR, y, C.border, 0.3);
  txt(doc, "CONFIDENTIAL — For internal use only. Prepared by DineInk Restaurant Intelligence Platform.", ML, y + 5, { size: 6, color: C.faint, italic: true });

  // ══════════════════════════════════════════════════════════════════════════
  //  SECTION 01 — EXECUTIVE SUMMARY
  // ══════════════════════════════════════════════════════════════════════════
  doc.addPage();
  y = ML;
  y = sectionHead(doc, "01  Executive Summary", "Key performance indicators at a glance", y);

  y = kpiGrid(doc, [
    { label: "Revenue",          value: RS(totalRev),        sub: "Total billings",         accent: C.brand },
    { label: "Orders",           value: String(activeBills.length), sub: `${paidBills.length} paid`, accent: C.blue },
    { label: "Avg Order Value",  value: RS(activeBills.length ? totalRev / activeBills.length : 0), sub: "per bill", accent: C.teal },
    { label: "Gross Revenue",    value: RS(totalRev + totalDisc), sub: "before discounts",  accent: C.slate },
    { label: "Discounts",        value: RS(totalDisc),       sub: "total given",            accent: C.amber },
    { label: "GST Collected",    value: RS(totalGST),        sub: "CGST + SGST",            accent: C.purple },
    { label: "Net Revenue",      value: RS(totalRev - totalGST), sub: "after tax",          accent: C.ink },
    { label: "Net Profit (est.)", value: RS(totalRev - totalGST - totalExp), sub: `${margin}% margin`, accent: Number(margin) >= 0 ? C.green : C.brand },
  ], y, 4);

  y = divider(doc, "Performance Highlights", y);

  // P&L snapshot table
  const netRev = totalRev - totalGST;
  y = labelValueRows(doc, [
    ["Gross Revenue (before discounts)",    RS(totalRev + totalDisc)],
    ["Less: Discounts",                    `(${RS(totalDisc)})`,   C.brand],
    ["Net Revenue",                        RS(totalRev)],
    ["Less: GST (CGST + SGST)",            `(${RS(totalGST)})`,    C.amber],
    ["Revenue after Tax",                  RS(netRev),              C.slate],
    ["Less: Recorded Expenses",            `(${RS(totalExp)})`,    C.brand],
    ["Estimated Net Profit",               RS(totalRev - totalGST - totalExp), Number(margin) >= 0 ? C.green : C.brand],
  ], y);

  y = divider(doc, "EBITDA Snapshot", y, C.purple);
  y = labelValueRows(doc, [
    ["Revenue",                     RS(insRev)],
    ["Fixed Expenses",              `(${RS(fixedExp)})`,  C.slate],
    ["Variable Expenses",           `(${RS(varExp)})`,    C.slate],
    ["Labour Cost",                 `(${RS(labourExp)})`, C.slate],
    ["Finance / Tax",               `(${RS(finExp)})`,    C.slate],
    ["Raw Material / Food Cost",    `(${RS(foodExp)})`,   C.slate],
    ["EBITDA",                      `${RS(ebitdaAmt)}  (${ebitdaPct}%)`, Number(ebitdaPct) >= 0 ? C.green : C.brand],
  ], y);

  // ══════════════════════════════════════════════════════════════════════════
  //  SECTION 02 — REVENUE & ORDER ANALYSIS
  // ══════════════════════════════════════════════════════════════════════════
  doc.addPage();
  y = ML;
  y = sectionHead(doc, "02  Revenue & Order Analysis", "Trends, payment methods & order types", y);

  y = divider(doc, "Daily Revenue Trend", y);
  if (dailyArr.length > 0) {
    y = colBars(
      doc,
      dailyArr.map(([d, rev]) => ({ label: d.slice(0, 5), value: rev })),
      ML, y, CW, 42, undefined, C.brand,
    );
  } else {
    txt(doc, "No daily revenue data available.", ML, y + 5, { size: 7.5, color: C.muted, italic: true });
    y += 12;
  }

  // Payment method + Order type splits side by side
  const halfW = (CW - 5) / 2;
  y = divider(doc, "Revenue by Payment Method  /  Revenue by Order Type", y);
  const pmData = Object.entries(payMap).sort((a, b) => b[1] - a[1]).map(([l, v], i) => ({
    label: l, value: v, color: ([C.brand, C.blue, C.green, C.amber, C.teal] as RGB[])[i % 5],
  }));
  const otData = Object.entries(otMap).sort((a, b) => b[1] - a[1]).map(([l, v], i) => ({
    label: l, value: v, color: ([C.purple, C.teal, C.green, C.amber] as RGB[])[i % 4],
  }));
  const yBefore = y;
  hBars(doc, pmData, ML, y, halfW);
  hBars(doc, otData, ML + halfW + 5, yBefore, halfW);
  y = yBefore + Math.max(pmData.length, otData.length) * 8 + 10;

  y = divider(doc, "Daily Revenue Details", y);
  y = table(doc,
    [["Date", "Revenue", "Orders"]],
    dailyArr.slice(0, 20).map(([d, rev]) => {
      const dayOrders = activeBills.filter((b: any) => new Date(b.createdAt).toLocaleDateString("en-IN") === d).length;
      return [d, RS(rev), String(dayOrders)];
    }),
    y, C.brand,
    { columnStyles: { 1: { halign: "right" }, 2: { halign: "center" } } },
  );

  // ══════════════════════════════════════════════════════════════════════════
  //  SECTION 03 — MENU PERFORMANCE
  // ══════════════════════════════════════════════════════════════════════════
  doc.addPage();
  y = ML;
  y = sectionHead(doc, "03  Menu Performance", "Top-selling items by revenue and quantity", y);

  y = divider(doc, "Top 10 Items by Revenue", y);
  y = hBars(doc, topItems.slice(0, 10).map(([name, d]) => ({ label: name, value: d.rev })), ML, y, CW);

  y = divider(doc, "Full Item Performance Table", y);
  y = table(doc,
    [["Item", "Category", "Qty Sold", "Revenue", "Avg Price", "Revenue Share"]],
    topItems.slice(0, 30).map(([name, d]) => [
      name,
      d.cat,
      String(d.qty),
      RS(d.rev),
      RS(d.qty ? d.rev / d.qty : 0),
      PCT(d.rev, totalRev),
    ]),
    y, C.brand,
    {
      columnStyles: {
        2: { halign: "center" },
        3: { halign: "right" },
        4: { halign: "right" },
        5: { halign: "center" },
      },
    },
  );

  // ══════════════════════════════════════════════════════════════════════════
  //  SECTION 04 — FINANCIAL OVERVIEW
  // ══════════════════════════════════════════════════════════════════════════
  doc.addPage();
  y = ML;
  y = sectionHead(doc, "04  Financial Overview", "P&L, Expense Breakdown & EBITDA Analysis", y);

  y = kpiGrid(doc, [
    { label: "EBITDA %",      value: `${ebitdaPct}%`,   sub: `target ${n(ins.targetEbitda) || 0}%`,  accent: Number(ebitdaPct) >= n(ins.targetEbitda) ? C.green : C.brand },
    { label: "Fixed Costs",   value: RS(fixedExp),       sub: "monthly",            accent: C.blue },
    { label: "Variable Costs",value: RS(varExp),         sub: "monthly",            accent: C.amber },
    { label: "Labour",        value: RS(labourExp),      sub: `${allStaff.length} staff`, accent: C.purple },
    { label: "Finance / Tax", value: RS(finExp),         sub: "monthly",            accent: C.teal },
    { label: "Raw Material",  value: RS(foodExp),        sub: "food cost",          accent: C.brand },
    { label: "Total Costs",   value: RS(totalCosts),     sub: "all categories",     accent: C.slate },
    { label: "Revenue",       value: RS(insRev),         sub: "target / actual",    accent: C.ink },
  ], y, 4);

  y = divider(doc, "EBITDA Scenario Planning — Revenue Required to Hit Targets", y, C.purple);
  y = table(doc,
    [["EBITDA Target", "Revenue Required", "Current Revenue", "Gap", "Status"]],
    [0, 5, 10, 15, 20, 25].map((target) => {
      const req  = totalCosts / (1 - target / 100);
      const gap  = req - insRev;
      return [
        `${target}%`,
        RS(req),
        RS(insRev),
        gap <= 0 ? "Achieved" : `+${RS(gap)}`,
        gap <= 0 ? "Achieved" : "Gap",
      ];
    }),
    y, C.purple,
    {
      columnStyles: {
        1: { halign: "right" },
        2: { halign: "right" },
        3: { halign: "right" },
        4: { halign: "center" },
      },
    },
  );

  y = divider(doc, "Expense Breakdown", y);
  y = table(doc,
    [["Expense Category", "Amount", "% of Total Costs"]],
    [
      ["Fixed (Rent, EMI, Licenses…)",    RS(fixedExp),  PCT(fixedExp,  totalCosts)],
      ["Variable (Electricity, Packaging…)", RS(varExp), PCT(varExp,   totalCosts)],
      ["Labour (Staff Salaries)",         RS(labourExp), PCT(labourExp, totalCosts)],
      ["Finance / Tax",                   RS(finExp),    PCT(finExp,    totalCosts)],
      ["Raw Material / Food",             RS(foodExp),   PCT(foodExp,   totalCosts)],
      ["Total",                           RS(totalCosts), "100%"],
    ],
    y, C.brand,
    { columnStyles: { 1: { halign: "right" }, 2: { halign: "center" } } },
  );

  if (expenses.length > 0) {
    // Group expenses by type
    const expByType: Record<string, number> = {};
    expenses.forEach((e: any) => { expByType[e.expenseType || "Other"] = (expByType[e.expenseType || "Other"] || 0) + n(e.amount); });
    y = divider(doc, "Recorded Expense Entries by Category", y);
    y = table(doc,
      [["Category", "Amount", "% of Recorded Expenses"]],
      Object.entries(expByType).sort((a, b) => b[1] - a[1]).map(([cat, amt]) => [cat, RS(amt), PCT(amt, totalExp)]),
      y, C.brand,
      { columnStyles: { 1: { halign: "right" }, 2: { halign: "center" } } },
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  SECTION 05 — CUSTOMER INTELLIGENCE
  // ══════════════════════════════════════════════════════════════════════════
  doc.addPage();
  y = ML;
  y = sectionHead(doc, "05  Customer Intelligence", "Retention, frequency & lifetime value", y);

  const atRiskC  = customers.filter((c: any) => c.lastVisit && (now - new Date(c.lastVisit).getTime()) / 86400000 > 30 && (now - new Date(c.lastVisit).getTime()) / 86400000 <= 90);
  const churnedC = customers.filter((c: any) => !c.lastVisit || (now - new Date(c.lastVisit).getTime()) / 86400000 > 90);

  y = kpiGrid(doc, [
    { label: "Total Customers",   value: String(customers.length),   sub: "all time",            accent: C.brand },
    { label: "Repeat Customers",  value: String(repeatC),             sub: PCT(repeatC, customers.length), accent: C.green },
    { label: "Active (30 days)",  value: String(activeC.length),      sub: "recently visited",    accent: C.teal },
    { label: "At Risk (30–90d)",  value: String(atRiskC.length),      sub: "need re-engagement",  accent: C.amber },
    { label: "Churned (>90d)",    value: String(churnedC.length),     sub: "lost customers",      accent: C.brand },
    { label: "New Customers",     value: String(customers.filter((c: any) => c.visits === 1).length), sub: "visited once", accent: C.blue },
    { label: "Avg Visits",        value: customers.length ? (customers.reduce((s: number, c: any) => s + (c.visits || 0), 0) / customers.length).toFixed(1) : "0", sub: "per customer", accent: C.purple },
    { label: "Avg Spend/Customer",value: RS(customers.length ? totalRev / customers.length : 0), sub: "lifetime avg",    accent: C.slate },
  ], y, 4);

  y = divider(doc, "Customer Retention Summary", y);
  y = table(doc,
    [["Segment", "Count", "% of Base", "Description"]],
    [
      ["Active",   String(activeC.length),  PCT(activeC.length,  customers.length), "Visited in last 30 days"],
      ["At Risk",  String(atRiskC.length),  PCT(atRiskC.length,  customers.length), "Last visit 30–90 days ago"],
      ["Churned",  String(churnedC.length), PCT(churnedC.length, customers.length), "Not seen in 90+ days"],
    ],
    y, C.teal,
    { columnStyles: { 1: { halign: "center" }, 2: { halign: "center" } } },
  );

  if (customers.length > 0) {
    const topCustomers = [...customers]
      .sort((a: any, b: any) => (b.totalSpend || 0) - (a.totalSpend || 0))
      .slice(0, 15);
    y = divider(doc, "Top Customers by Total Spend", y);
    y = table(doc,
      [["Customer", "Phone", "Visits", "Total Spend", "Avg per Visit"]],
      topCustomers.map((c: any) => [
        c.name || "Walk-in",
        c.phone || "—",
        String(c.visits || 0),
        RS(c.totalSpend || 0),
        RS(c.visits ? (c.totalSpend || 0) / c.visits : 0),
      ]),
      y, C.brand,
      { columnStyles: { 2: { halign: "center" }, 3: { halign: "right" }, 4: { halign: "right" } } },
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  SECTION 06 — OPERATIONS & STAFF
  // ══════════════════════════════════════════════════════════════════════════
  doc.addPage();
  y = ML;
  y = sectionHead(doc, "06  Operations & Staff", "Kitchen performance, attendance & payroll", y);

  y = kpiGrid(doc, [
    { label: "Total Staff",       value: String(allStaff.length),    sub: "on payroll",          accent: C.brand },
    { label: "Monthly Payroll",   value: RS(labourExp),              sub: "total salaries",       accent: C.blue },
    { label: "Avg Salary",        value: RS(allStaff.length ? labourExp / allStaff.length : 0), sub: "per staff", accent: C.purple },
    { label: "Kitchen Orders",    value: String(kitchenOrders),      sub: "processed",            accent: C.teal },
    { label: "Avg Prep Time",     value: `${avgKitchenTime} min`,    sub: "kitchen speed",        accent: avgKitchenTime <= 30 ? C.green : C.amber },
    { label: "Cash Sessions",     value: String(cashSessions.length), sub: "reconciliation sessions", accent: C.slate },
  ], y, 3);

  if (allStaff.length > 0) {
    y = divider(doc, "Staff Payroll Summary", y);
    y = table(doc,
      [["Name", "Role", "Monthly Salary", "% of Labour Cost"]],
      [...allStaff].sort((a: any, b: any) => (b.salary || 0) - (a.salary || 0)).map((st: any) => [
        st.name || "—",
        st.role || "—",
        RS(st.salary || 0),
        PCT(n(st.salary), labourExp),
      ]),
      y, C.brand,
      { columnStyles: { 2: { halign: "right" }, 3: { halign: "center" } } },
    );
  }

  if (cashSessions.length > 0) {
    y = divider(doc, "Cash Reconciliation Sessions", y);
    y = table(doc,
      [["Date", "Opening", "Closing", "Expected", "Difference", "Status"]],
      cashSessions.slice(0, 15).map((s: any) => {
        const diff = n(s.closingBalance) - n(s.expectedBalance);
        return [
          s.date ? new Date(s.date).toLocaleDateString("en-IN") : "—",
          RS(s.openingBalance),
          RS(s.closingBalance),
          RS(s.expectedBalance),
          diff === 0 ? "Rs.0" : (diff > 0 ? `+${RS(diff)}` : RS(diff)),
          Math.abs(diff) < 50 ? "Balanced" : diff > 0 ? "Surplus" : "Short",
        ];
      }),
      y, C.teal,
      {
        columnStyles: {
          1: { halign: "right" },
          2: { halign: "right" },
          3: { halign: "right" },
          4: { halign: "right" },
          5: { halign: "center" },
        },
      },
    );
  }

  if (inventoryAdjustments.length > 0) {
    const wasteMap: Record<string, number> = {};
    inventoryAdjustments.filter((a: any) => a.adjustmentType === "WASTE").forEach((a: any) => {
      const nm = a.ingredient?.name || "Unknown";
      wasteMap[nm] = (wasteMap[nm] || 0) + n(a.quantity);
    });
    if (Object.keys(wasteMap).length > 0) {
      y = divider(doc, "Inventory Waste Summary", y, C.amber);
      y = table(doc,
        [["Ingredient", "Qty Wasted", "Unit"]],
        Object.entries(wasteMap).sort((a, b) => b[1] - a[1]).slice(0, 12).map(([ing, qty]) => {
          const unit = inventoryAdjustments.find((a: any) => a.ingredient?.name === ing)?.ingredient?.unit || "—";
          return [ing, qty.toFixed(2), unit];
        }),
        y, C.amber,
        { columnStyles: { 1: { halign: "right" }, 2: { halign: "center" } } },
      );
    }
  }

  // Forecast — show as table only (predicted, not actual data)
  const fSum = (forecast as any)?.summary || {};
  if (fSum.forecastTotal) {
    y = divider(doc, "7-Day Revenue Forecast  (Estimated — Not Actual Data)", y, C.purple);
    y = kpiGrid(doc, [
      { label: "7-Day Avg",     value: RS(fSum.avg7 || 0),           sub: "daily average",    accent: C.blue   },
      { label: "Growth Rate",   value: `${fSum.growthPercent >= 0 ? "+" : ""}${fSum.growthPercent || 0}%`, sub: "week-on-week", accent: (fSum.growthPercent || 0) >= 0 ? C.green : C.brand },
      { label: "Next 7D Total", value: RS(fSum.forecastTotal || 0),  sub: "predicted",        accent: C.purple },
    ], y, 3);
    const fcRows = ((forecast as any)?.forecast || []).map((f: any, i: number) => [
      `Day ${i + 1}`,
      f.date.slice(5, 10).replace("-", "/"),
      RS(f.predicted),
      i === 0 ? "—" : (() => {
        const prev = (forecast as any).forecast[i - 1]?.predicted || 0;
        const diff = f.predicted - prev;
        return diff === 0 ? "No change" : (diff > 0 ? `+${RS(diff)}` : RS(diff));
      })(),
    ]);
    if (fcRows.length > 0) {
      txt(doc, "Note: These are algorithm-generated estimates based on historical trends.", ML, y, { size: 6, color: C.muted, italic: true });
      y += 6;
      y = table(doc,
        [["Day", "Date", "Predicted Revenue", "Change vs Prior Day"]],
        fcRows,
        y, C.purple,
        { columnStyles: { 2: { halign: "right" }, 3: { halign: "right" } } },
      );
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  BACK-FILL FOOTERS
  // ══════════════════════════════════════════════════════════════════════════
  const total = doc.getNumberOfPages();
  for (let p = 1; p <= total; p++) {
    doc.setPage(p);
    pageFooter(doc, p, total, meta);
  }

  return doc.output("arraybuffer") as Uint8Array;
}
