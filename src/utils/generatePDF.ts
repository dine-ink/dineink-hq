// @ts-ignore
import jsPDF from "jspdf";
// @ts-ignore
import autoTable from "jspdf-autotable";
import type { FullReportData } from "./reportData";

// ─── Design system ────────────────────────────────────────────────────────────
type RGB = [number, number, number];

const C = {
  red: [239, 68, 68] as RGB,
  redDk: [185, 28, 28] as RGB,
  redLt: [254, 226, 226] as RGB,
  redXLt: [255, 245, 245] as RGB,
  green: [5, 150, 105] as RGB,
  greenDk: [4, 120, 87] as RGB,
  greenLt: [209, 250, 229] as RGB,
  blue: [37, 99, 235] as RGB,
  blueDk: [29, 78, 216] as RGB,
  blueLt: [219, 234, 254] as RGB,
  purple: [124, 58, 237] as RGB,
  purpleLt: [237, 233, 254] as RGB,
  amber: [217, 119, 6] as RGB,
  amberLt: [254, 243, 199] as RGB,
  teal: [13, 148, 136] as RGB,
  tealLt: [204, 251, 241] as RGB,
  s900: [15, 23, 42] as RGB,
  s800: [30, 41, 59] as RGB,
  s700: [51, 65, 85] as RGB,
  s600: [71, 85, 105] as RGB,
  s500: [100, 116, 139] as RGB,
  s400: [148, 163, 184] as RGB,
  s300: [203, 213, 225] as RGB,
  s200: [226, 232, 240] as RGB,
  s100: [241, 245, 249] as RGB,
  s50: [248, 250, 252] as RGB,
  white: [255, 255, 255] as RGB,
};

const PW = 210;
const PH = 297;
const ML = 14;
const MR = 14;
const CW = PW - ML - MR;
// jsPDF built-in Helvetica only covers Latin-1; use "Rs." instead of the
// Rupee sign (U+20B9) which renders as "1" and causes garbled output.
const INR = (v: any) => `Rs.${Number(v || 0).toLocaleString("en-IN")}`;
const PCT = (v: number, t: number) =>
  t > 0 ? `${((v / t) * 100).toFixed(1)}%` : "0.0%";
// Safe ASCII replacements for chars outside Latin-1
const safe = (s: string) =>
  s
    .replace(/₹/g, "Rs.")
    .replace(/→|➜|→/g, "->")
    .replace(/←/g, "<-")
    .replace(/✅/g, "[OK]")
    .replace(/❌/g, "[X]")
    .replace(/⚠️|⚠/g, "[!]")
    .replace(/⭐/g, "[STAR]")
    .replace(/🧩/g, "[PUZZLE]")
    .replace(/🐎/g, "[HORSE]")
    .replace(/🐕/g, "[DOG]")
    .replace(/🏆/g, "[TOP]")
    .replace(/🥇/g, "[1]")
    .replace(/🥈/g, "[2]")
    .replace(/🥉/g, "[3]")
    .replace(/−/g, "-") // Unicode minus sign
    .replace(/’/g, "'") // right single quotation mark
    .replace(/[^\x00-\xFF]/g, ""); // strip any remaining non-Latin-1

// ─── Low-level primitives ─────────────────────────────────────────────────────
const fr = (d: any, x: number, y: number, w: number, h: number, c: RGB) => {
  d.setFillColor(...c);
  d.rect(x, y, w, h, "F");
};
const rr = (
  d: any,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  c: RGB,
) => {
  d.setFillColor(...c);
  d.roundedRect(x, y, w, h, r, r, "F");
};
const ln = (
  d: any,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  c: RGB,
  lw = 0.3,
) => {
  d.setDrawColor(...c);
  d.setLineWidth(lw);
  d.line(x1, y1, x2, y2);
};
const txt = (
  d: any,
  s: string,
  x: number,
  y: number,
  o: {
    size?: number;
    bold?: boolean;
    italic?: boolean;
    color?: RGB;
    align?: "left" | "center" | "right";
  } = {},
) => {
  d.setFontSize(o.size || 9);
  d.setFont("helvetica", o.bold ? "bold" : o.italic ? "italic" : "normal");
  d.setTextColor(...(o.color || C.s900));
  d.text(safe(s), x, y, o.align ? { align: o.align } : undefined);
};

// ─── UI Components ────────────────────────────────────────────────────────────

function pageHeader(
  doc: any,
  page: number,
  total: number,
  meta: { restaurantName: string; branchName: string },
) {
  fr(doc, 0, PH - 10, PW, 10, C.s900);
  fr(doc, 0, PH - 10.5, PW, 0.5, C.red);
  txt(
    doc,
    "DineInk Business Intelligence Report  ·  Confidential",
    ML,
    PH - 4,
    { size: 6.5, color: C.s400 },
  );
  txt(doc, `${meta.restaurantName} — ${meta.branchName}`, PW / 2, PH - 4, {
    size: 6.5,
    color: C.s400,
    align: "center",
  });
  txt(doc, `${page} / ${total}`, PW - ML, PH - 4, {
    size: 6.5,
    bold: true,
    color: [170, 170, 170] as RGB,
    align: "right",
  });
}

function chapterBanner(
  doc: any,
  num: string,
  title: string,
  subtitle: string,
  y: number,
  accent: RGB = C.red,
): number {
  fr(doc, ML, y, CW, 12, C.s900);
  fr(doc, ML, y, 3, 12, accent);
  txt(doc, `${num}  ${title.toUpperCase()}`, ML + 6, y + 8.5, {
    size: 10,
    bold: true,
    color: C.white,
  });
  if (subtitle)
    txt(
      doc,
      subtitle,
      ML + 6 + doc.getTextWidth(`${num}  ${title.toUpperCase()}`) + 3,
      y + 8.5,
      { size: 7.5, color: C.s400 },
    );
  return y + 16;
}

function sectionLabel(
  doc: any,
  text: string,
  y: number,
  accent: RGB = C.s600,
): number {
  fr(doc, ML, y, CW, 7, C.s50);
  fr(doc, ML, y, 2, 7, accent);
  txt(doc, text, ML + 5, y + 5, { size: 7.5, bold: true, color: C.s700 });
  return y + 10;
}

function kpiRow(
  doc: any,
  items: { label: string; value: string; sub?: string; accent?: RGB }[],
  y: number,
  perRow = 4,
): number {
  const w = (CW - (perRow - 1) * 2) / perRow;
  const h = items[0]?.sub ? 22 : 18;
  items.slice(0, perRow * 2).forEach((k, i) => {
    const col = i % perRow;
    const row = Math.floor(i / perRow);
    const x = ML + col * (w + 2);
    const cy = y + row * (h + 2);
    const accent = k.accent || C.red;
    // Card
    rr(doc, x, cy, w, h, 2, C.white);
    doc.setDrawColor(...C.s200);
    doc.setLineWidth(0.25);
    doc.roundedRect(x, cy, w, h, 2, 2);
    fr(doc, x, cy, 2.5, h, accent);
    txt(doc, k.label.toUpperCase(), x + 4.5, cy + 5, {
      size: 5.5,
      bold: true,
      color: C.s400,
    });
    txt(doc, k.value, x + 4.5, cy + 12, {
      size: 13,
      bold: true,
      color: accent,
    });
    if (k.sub) txt(doc, k.sub, x + 4.5, cy + 17, { size: 6, color: C.s500 });
  });
  return y + Math.ceil(items.length / perRow) * (h + 2) + 3;
}

function hBar(
  doc: any,
  data: { label: string; value: number; color?: RGB }[],
  x: number,
  y: number,
  w: number,
  title: string,
): number {
  const max = Math.max(...data.map((d) => d.value), 1);
  const barH = 5.5;
  const gap = 2;
  const lw = 40;
  const vw = 18;
  const bw = w - lw - vw - 2;
  txt(doc, title, x, y, { size: 7.5, bold: true, color: C.s600 });
  y += 5;
  data.slice(0, 10).forEach((d, i) => {
    const by = y + i * (barH + gap);
    const fw = Math.max((d.value / max) * bw, 1);
    const c = d.color || C.red;
    rr(doc, x + lw, by, bw, barH, 1, C.s100);
    rr(doc, x + lw, by, fw, barH, 1, c);
    txt(
      doc,
      d.label.length > 19 ? d.label.slice(0, 18) + "…" : d.label,
      x + lw - 1,
      by + barH - 1.2,
      { size: 6.5, color: C.s600, align: "right" },
    );
    txt(doc, INR(d.value), x + lw + bw + 2, by + barH - 1.2, {
      size: 6.5,
      bold: true,
      color: c,
    });
  });
  return y + data.slice(0, 10).length * (barH + gap) + 3;
}

function colChart(
  doc: any,
  data: { label: string; value: number }[],
  x: number,
  y: number,
  w: number,
  h: number,
  c: RGB = C.red,
  title = "",
): number {
  if (title) {
    txt(doc, title, x, y, { size: 7.5, bold: true, color: C.s600 });
    y += 4;
  }
  const max = Math.max(...data.map((d) => d.value), 1);
  const n2 = data.length;
  const bw = Math.max((w - (n2 - 1)) / n2, 1.5);
  const ch = h - 6;
  fr(doc, x, y, w, ch, C.s50);
  for (let g = 1; g <= 3; g++)
    ln(
      doc,
      x,
      y + ch - (g / 3) * ch,
      x + w,
      y + ch - (g / 3) * ch,
      C.s200,
      0.2,
    );
  data.forEach((d, i) => {
    const bh2 = Math.max((d.value / max) * ch, 1);
    const bx = x + i * (bw + 1);
    const by = y + ch - bh2;
    doc.setFillColor(...c);
    doc.roundedRect(bx, by, bw, bh2, 0.8, 0.8, "F");
    if (i % Math.ceil(n2 / 8) === 0 && d.label)
      txt(doc, d.label.slice(0, 5), bx + bw / 2, y + h - 1, {
        size: 5,
        color: C.s500,
        align: "center",
      });
  });
  ln(doc, x, y + ch, x + w, y + ch, C.s300, 0.5);
  return y + h + 2;
}

function premTable(
  doc: any,
  head: string[][],
  body: any[][],
  startY: number,
  accentColor: RGB,
  opts: any = {},
) {
  const sanitize = (v: any) => (typeof v === "string" ? safe(v) : v);
  const safeHead = head.map((row) => row.map(sanitize));
  const safeBody = body.map((row) => row.map(sanitize));
  autoTable(doc, {
    head: safeHead,
    body: safeBody,
    startY,
    styles: {
      fontSize: 7.5,
      cellPadding: { top: 2.5, right: 3, bottom: 2.5, left: 3 },
      lineColor: C.s200,
      lineWidth: 0.2,
      overflow: "ellipsize",
    },
    headStyles: {
      fillColor: accentColor,
      textColor: C.white,
      fontStyle: "bold",
      fontSize: 8,
      cellPadding: { top: 3, right: 3, bottom: 3, left: 3 },
    },
    alternateRowStyles: { fillColor: C.s50 },
    bodyStyles: { textColor: C.s800 },
    tableLineColor: C.s200,
    tableLineWidth: 0.3,
    margin: { left: ML, right: MR },
    theme: "grid",
    ...opts,
  });
  return (doc as any).lastAutoTable.finalY + 4;
}

// ─── MAIN GENERATOR ───────────────────────────────────────────────────────────

export async function generatePDFReport(
  data: FullReportData,
  meta: {
    restaurantName: string;
    branchName: string;
    from: string;
    to: string;
  },
): Promise<Uint8Array> {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const {
    analytics,
    bills,
    expenses,
    customers,
    menuItems,
    kitchenData,
    attendance,
    allStaff,
    cashSessions,
    branchComparison,
    cityComparison,
    heatmap,
    forecast,
    rfm,
    insightsData,
    inventoryAdjustments,
    staffProductivity,
  } = data;

  const totalRev = bills.reduce(
    (s: number, b: any) => s + Number(b.total || 0),
    0,
  );
  const totalGST = bills.reduce(
    (s: number, b: any) => s + Number(b.cgst || 0) + Number(b.sgst || 0),
    0,
  );
  const totalDisc = bills.reduce(
    (s: number, b: any) => s + Number(b.discount || 0),
    0,
  );
  const totalExp = expenses.reduce(
    (s: number, e: any) => s + Number(e.amount || 0),
    0,
  );
  const netProfit = totalRev - totalGST - totalExp;
  const paidBills = bills.filter((b: any) => b.status === "PAID");
  const gross = totalRev + totalDisc;
  const margin = totalRev > 0 ? ((netProfit / totalRev) * 100).toFixed(1) : "0";

  // Pre-compute
  const now = Date.now();
  const activeC = customers.filter(
    (c: any) =>
      c.lastVisit && (now - new Date(c.lastVisit).getTime()) / 86400000 <= 30,
  );
  const atRiskC = customers.filter(
    (c: any) =>
      c.lastVisit &&
      (now - new Date(c.lastVisit).getTime()) / 86400000 > 30 &&
      (now - new Date(c.lastVisit).getTime()) / 86400000 <= 90,
  );
  const churnedC = customers.filter(
    (c: any) =>
      !c.lastVisit || (now - new Date(c.lastVisit).getTime()) / 86400000 > 90,
  );
  const rfmMap: Record<string, any> = {};
  (rfm?.customers || []).forEach((c: any) => {
    rfmMap[c.phone] = c;
  });
  const segCounts: Record<string, number> = {};
  (rfm?.customers || []).forEach((c: any) => {
    segCounts[c.segment] = (segCounts[c.segment] || 0) + 1;
  });
  const byDate: Record<string, { rev: number; orders: number }> = {};
  bills.forEach((b: any) => {
    const d = new Date(b.createdAt).toLocaleDateString("en-IN");
    if (!byDate[d]) byDate[d] = { rev: 0, orders: 0 };
    byDate[d].rev += Number(b.total || 0);
    byDate[d].orders++;
  });
  const dailyArr = Object.entries(byDate).sort(
    (a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime(),
  );
  const itemMap: Record<string, { qty: number; rev: number; cat: string }> = {};
  bills.forEach((b: any) => {
    (b.items || []).forEach((item: any) => {
      if (!itemMap[item.itemName])
        itemMap[item.itemName] = { qty: 0, rev: 0, cat: "—" };
      itemMap[item.itemName].qty += Number(item.quantity || 0);
      itemMap[item.itemName].rev += Number(item.total || 0);
    });
  });
  menuItems.forEach((m: any) => {
    if (itemMap[m.name]) itemMap[m.name].cat = m.category?.name || "—";
  });
  const topItems = Object.entries(itemMap).sort((a, b) => b[1].qty - a[1].qty);
  const payMap: Record<string, { count: number; rev: number }> = {};
  bills.forEach((b: any) => {
    const m = b.paymentMethod || "Unknown";
    if (!payMap[m]) payMap[m] = { count: 0, rev: 0 };
    payMap[m].count++;
    payMap[m].rev += Number(b.total || 0);
  });
  const otMap: Record<string, { count: number; rev: number }> = {};
  bills.forEach((b: any) => {
    const t = (b.orderType || "UNKNOWN").replace("_", " ");
    if (!otMap[t]) otMap[t] = { count: 0, rev: 0 };
    otMap[t].count++;
    otMap[t].rev += Number(b.total || 0);
  });
  const ins = insightsData || {};
  const fixedExp =
    Number(ins.monthlyRent || 0) +
    Number(ins.loanEmi || 0) +
    Number(ins.internet || 0) +
    Number(ins.phoneBills || 0) +
    Number(ins.accounting || 0) +
    Number(ins.insurance || 0) +
    Number(ins.licenses || 0);
  const varExp =
    Number(ins.deliveryCharges || 0) +
    Number(ins.packaging || 0) +
    Number(ins.paymentGateway || 0) +
    Number(ins.aggregatorCommission || 0) +
    Number(ins.electricity || 0) +
    Number(ins.gas || 0) +
    Number(ins.maintenance || 0) +
    Number(ins.fuel || 0);
  const labourExp = allStaff.reduce(
    (s: number, st: any) => s + Number(st.salary || 0),
    0,
  );
  const insRev = Number(ins.revenue || 0) || totalRev;
  const ebitda =
    insRev > 0
      ? (((insRev - (fixedExp + varExp + labourExp)) / insRev) * 100).toFixed(1)
      : "0";
  const expByType: Record<string, number> = {};
  expenses.forEach((e: any) => {
    expByType[e.expenseType || "Other"] =
      (expByType[e.expenseType || "Other"] || 0) + Number(e.amount || 0);
  });
  const wasteByIng: Record<string, { qty: number; adj: number }> = {};
  inventoryAdjustments.forEach((a: any) => {
    const nm = a.ingredient?.name || "Unknown";
    if (!wasteByIng[nm]) wasteByIng[nm] = { qty: 0, adj: 0 };
    wasteByIng[nm].qty += Number(a.quantity || 0);
    wasteByIng[nm].adj++;
  });

  // ──────────────────────────────────────────────────────────────────────────
  // PAGE 1 — COVER
  // ──────────────────────────────────────────────────────────────────────────
  fr(doc, 0, 0, PW, 105, C.s900);
  doc.setFillColor(30, 41, 59);
  doc.circle(PW - 20, 20, 38, "F");
  doc.setFillColor(51, 65, 85);
  doc.circle(PW - 18, 14, 20, "F");
  doc.setFillColor(239, 68, 68);
  doc.circle(PW - 22, 22, 8, "F");
  rr(doc, ML, 18, 20, 20, 4, C.red);
  txt(doc, "D", ML + 6.5, 30.5, { size: 13, bold: true, color: C.white });
  txt(doc, "DineInk", ML + 25, 26, { size: 20, bold: true, color: C.white });
  txt(doc, "Restaurant Intelligence Platform", ML + 25, 32, {
    size: 8,
    color: C.s400,
  });
  fr(doc, ML, 42, CW, 0.5, C.red);
  txt(doc, "FULL BUSINESS", ML, 54, { size: 24, bold: true, color: C.white });
  txt(doc, "INTELLIGENCE REPORT", ML, 64, {
    size: 24,
    bold: true,
    color: C.red,
  });
  txt(
    doc,
    "22 Modules · 90+ KPIs · 27 Data Sheets · Charts · Analytics · Forecasts",
    ML,
    72,
    { size: 8.5, color: C.s400 },
  );
  rr(doc, ML, 79, CW, 20, 3, C.s800);
  txt(doc, meta.restaurantName, ML + 5, 87, {
    size: 12,
    bold: true,
    color: C.white,
  });
  txt(doc, `Branch: ${meta.branchName}`, ML + 5, 93, {
    size: 8,
    color: C.s400,
  });
  txt(doc, `${meta.from} to${meta.to}`, PW - MR - 3, 87, {
    size: 8,
    color: C.s400,
    align: "right",
  });
  txt(
    doc,
    new Date().toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }),
    PW - MR - 3,
    93,
    { size: 8, bold: true, color: C.red, align: "right" },
  );

  let y = 110;
  y = kpiRow(
    doc,
    [
      {
        label: "Total Revenue",
        value: INR(totalRev),
        sub: `${bills.length} bills`,
        accent: C.red,
      },
      {
        label: "Net Profit",
        value: INR(netProfit),
        sub: `${margin}% margin`,
        accent: netProfit >= 0 ? C.green : C.redDk,
      },
      {
        label: "Total Orders",
        value: String(bills.length),
        sub: `${paidBills.length} paid`,
        accent: C.blue,
      },
      {
        label: "Customers",
        value: String(customers.length),
        sub: `${customers.filter((c: any) => c.visits > 1).length} repeat`,
        accent: C.purple,
      },
      {
        label: "GST Collected",
        value: INR(totalGST),
        sub: "CGST + SGST",
        accent: C.amber,
      },
      {
        label: "Expenses",
        value: INR(totalExp),
        sub: `${expenses.length} entries`,
        accent: C.s600,
      },
      {
        label: "Active Customers",
        value: String(activeC.length),
        sub: "last 30 days",
        accent: C.teal,
      },
      {
        label: "EBITDA",
        value: `${ebitda}%`,
        sub: "profitability",
        accent: C.purple,
      },
    ],
    y,
    4,
  );

  // TOC
  y += 4;
  txt(doc, "REPORT CONTENTS", ML, y, { size: 7, bold: true, color: C.s500 });
  y += 4;
  ln(doc, ML, y, PW - MR, y, C.s200, 0.3);
  y += 4;
  const tocItems = [
    ["01", "Analytics Overview Dashboard — KPIs, Revenue, Orders, Payments"],
    ["02", "Billing Overview — Bills, Transactions, Order Types"],
    ["03", "Customer Overview + Churn + RFM Analysis"],
    ["04", "Menu Analytics + Menu Engineering Matrix"],
    ["05", "Financial Reports — P&L, Tax (GST), Expenses, Sales, Discounts"],
    ["06", "Operations — Table Analytics, Waste Report, Heatmap, Day Analysis"],
    ["07", "Staff — Attendance, Productivity, Payroll"],
    ["08", "Cash Reconciliation — Sessions, Differences"],
    ["09", "Kitchen Analytics — Speed, SLA, Throughput, Items"],
    [
      "10",
      "Business Intelligence — Insights, Forecast, Branch/City Comparison",
    ],
  ];
  tocItems.forEach(([n2, t], i) => {
    rr(doc, ML, y + i * 7, 7, 5.5, 1, C.red);
    txt(doc, n2, ML + 1, y + i * 7 + 4, {
      size: 6,
      bold: true,
      color: C.white,
    });
    txt(doc, t, ML + 10, y + i * 7 + 4, { size: 7.5, color: C.s700 });
  });
  pageHeader(doc, 1, 1, meta); // placeholder, updated at end

  // ──────────────────────────────────────────────────────────────────────────
  // SECTION 01 — ANALYTICS OVERVIEW DASHBOARD
  // ──────────────────────────────────────────────────────────────────────────
  doc.addPage();
  y = ML;
  y = chapterBanner(
    doc,
    "01",
    "Analytics Overview Dashboard",
    "Live operational metrics",
    y,
  );

  y = kpiRow(
    doc,
    [
      {
        label: "Revenue",
        value: INR(totalRev),
        sub: "Total earnings",
        accent: C.red,
      },
      {
        label: "Orders",
        value: String(bills.length),
        sub: "Completed orders",
        accent: C.blue,
      },
      {
        label: "Avg Order Value",
        value: INR(bills.length ? Math.round(totalRev / bills.length) : 0),
        sub: "Per transaction",
        accent: C.purple,
      },
      {
        label: "Customers",
        value: String(customers.length),
        sub: "Unique visitors",
        accent: C.teal,
      },
      {
        label: "Peak Hours",
        value: analytics.peakHours || "—",
        sub: "Busiest time",
        accent: C.amber,
      },
      {
        label: "Repeat Rate",
        value: PCT(
          customers.filter((c: any) => c.visits > 1).length,
          customers.length,
        ),
        sub: "Returning guests",
        accent: C.green,
      },
    ],
    y,
    3,
  );

  y = sectionLabel(doc, "Revenue Trend", y);
  if (dailyArr.length > 0)
    y =
      colChart(
        doc,
        dailyArr.map(([d, v]) => ({ label: d.slice(0, 5), value: v.rev })),
        ML,
        y,
        CW,
        40,
      ) + 3;

  const half = (CW - 3) / 2;
  y = sectionLabel(doc, "Order Split  /  Payment Split", y);
  const otBars = Object.entries(otMap)
    .sort((a, b) => b[1].rev - a[1].rev)
    .map(([t, d], i) => ({
      label: t,
      value: d.rev,
      color: [C.red, C.blue, C.green, C.amber][i % 4] as RGB,
    }));
  const pmBars = Object.entries(payMap)
    .sort((a, b) => b[1].rev - a[1].rev)
    .map(([m, d], i) => ({
      label: m,
      value: d.rev,
      color: [C.blue, C.purple, C.green, C.amber][i % 4] as RGB,
    }));
  const ny1 = hBar(doc, otBars, ML, y, half, "Revenue by Order Type");
  const ny2 = hBar(
    doc,
    pmBars,
    ML + half + 3,
    y,
    half,
    "Revenue by Payment Method",
  );
  y = Math.max(ny1, ny2) + 3;

  y = sectionLabel(doc, "Top Selling Items", y);
  y = premTable(
    doc,
    [["#", "Item Name", "Qty Sold", "Revenue", "Category"]],
    topItems
      .slice(0, 10)
      .map(([name, d], i) => [i + 1, name, d.qty, INR(d.rev), d.cat]),
    y,
    C.red,
    {
      columnStyles: {
        0: { halign: "center", cellWidth: 10 },
        2: { halign: "center" },
        3: { halign: "right" },
      },
    },
  );

  // ──────────────────────────────────────────────────────────────────────────
  // SECTION 02 — BILLING OVERVIEW
  // ──────────────────────────────────────────────────────────────────────────
  doc.addPage();
  y = ML;
  y = chapterBanner(
    doc,
    "02",
    "Billing Overview",
    `${bills.length} bills · ${meta.from} to${meta.to}`,
    y,
  );

  y = kpiRow(
    doc,
    [
      {
        label: "Revenue",
        value: INR(totalRev),
        sub: "Total earnings",
        accent: C.red,
      },
      {
        label: "Orders",
        value: String(bills.length),
        sub: "Total bills",
        accent: C.blue,
      },
      {
        label: "Avg Bill",
        value: INR(bills.length ? Math.round(totalRev / bills.length) : 0),
        sub: "Per bill",
        accent: C.purple,
      },
      {
        label: "Paid Bills",
        value: String(paidBills.length),
        sub: "Completed",
        accent: C.green,
      },
    ],
    y,
    4,
  );

  y = sectionLabel(doc, "Recent Bills", y);
  y = premTable(
    doc,
    [
      [
        "Bill No",
        "Date",
        "Customer",
        "Order Type",
        "Payment",
        "Subtotal",
        "GST",
        "Total",
        "Status",
      ],
    ],
    bills
      .slice(0, 20)
      .map((b: any) => [
        b.billNo || `#${b.id}`,
        new Date(b.createdAt).toLocaleDateString("en-IN"),
        b.customer?.name || "Guest",
        (b.orderType || "").replace("_", " "),
        b.paymentMethod || "—",
        INR(b.subtotal),
        INR(Number(b.cgst || 0) + Number(b.sgst || 0)),
        INR(b.total),
        b.status || "—",
      ]),
    y,
    C.blue,
    {
      columnStyles: {
        5: { halign: "right" },
        6: { halign: "right" },
        7: { halign: "right" },
        8: { halign: "center" },
      },
    },
  );

  // ──────────────────────────────────────────────────────────────────────────
  // SECTION 03 — CUSTOMERS (Overview + Churn + RFM)
  // ──────────────────────────────────────────────────────────────────────────
  doc.addPage();
  y = ML;
  y = chapterBanner(
    doc,
    "03",
    "Customer Analytics",
    "Overview · Churn · RFM Segmentation",
    y,
    C.purple,
  );

  y = kpiRow(
    doc,
    [
      {
        label: "Total Customers",
        value: String(customers.length),
        sub: "all time",
        accent: C.blue,
      },
      {
        label: "Repeat Customers",
        value: String(customers.filter((c: any) => c.visits > 1).length),
        sub: "visited 2+ times",
        accent: C.green,
      },
      {
        label: "Avg Spend",
        value: INR(
          customers.length
            ? Math.round(
                customers.reduce(
                  (s: number, c: any) => s + Number(c.spend || 0),
                  0,
                ) / customers.length,
              )
            : 0,
        ),
        sub: "per customer",
        accent: C.purple,
      },
      {
        label: "Active",
        value: String(activeC.length),
        sub: "last 30 days",
        accent: C.teal,
      },
      {
        label: "At Risk",
        value: String(atRiskC.length),
        sub: "30–90 days",
        accent: C.amber,
      },
      {
        label: "Churned",
        value: String(churnedC.length),
        sub: "90+ days",
        accent: C.redDk,
      },
    ],
    y,
    3,
  );

  y = sectionLabel(doc, "Customer Overview Table", y);
  y = premTable(
    doc,
    [
      [
        "Customer",
        "Visits",
        "Total Spend",
        "Avg Bill",
        "Last Visit",
        "Segment",
      ],
    ],
    customers
      .sort((a: any, b: any) => b.spend - a.spend)
      .slice(0, 15)
      .map((c: any) => [
        c.name,
        c.visits,
        INR(c.spend),
        INR(c.visits ? Math.round(Number(c.spend) / c.visits) : 0),
        c.lastVisit ? new Date(c.lastVisit).toLocaleDateString("en-IN") : "—",
        rfmMap[c.phone]?.segment ||
          (c.spend > 5000 ? "VIP" : c.visits > 3 ? "Regular" : "New"),
      ]),
    y,
    C.purple,
    {
      columnStyles: {
        1: { halign: "center" },
        2: { halign: "right" },
        3: { halign: "right" },
        5: { halign: "center" },
      },
    },
  );

  y = sectionLabel(doc, "Churn Analysis — At Risk Customers", y, C.amber);
  y = premTable(
    doc,
    [["Customer", "Phone", "Last Visit", "Days Since", "Visits", "Spend"]],
    atRiskC
      .slice(0, 10)
      .map((c: any) => [
        c.name,
        c.phone,
        c.lastVisit ? new Date(c.lastVisit).toLocaleDateString("en-IN") : "—",
        Math.floor((now - new Date(c.lastVisit || now).getTime()) / 86400000),
        c.visits,
        INR(c.spend),
      ]),
    y,
    C.amber,
  );

  y = sectionLabel(doc, "RFM Segmentation", y, C.purple);
  const segC: Record<string, RGB> = {
    Champion: C.green,
    Loyal: C.blue,
    Potential: C.purple,
    "At Risk": C.amber,
    Lost: C.redDk,
  };
  y = kpiRow(
    doc,
    ["Champion", "Loyal", "Potential", "At Risk", "Lost"].map((seg) => ({
      label: seg,
      value: String(segCounts[seg] || 0),
      sub: `${rfm?.customers?.length > 0 ? PCT(segCounts[seg] || 0, rfm.customers.length) : "0%"} of total`,
      accent: segC[seg] || C.s500,
    })),
    y,
    5,
  );

  y = premTable(
    doc,
    [
      [
        "Customer",
        "Segment",
        "R",
        "F",
        "M",
        "Total /15",
        "Last Visit",
        "Spend",
      ],
    ],
    (rfm?.customers || [])
      .slice(0, 15)
      .map((c: any) => [
        c.name,
        c.segment,
        c.R,
        c.F,
        c.M,
        `${c.rfm}/15`,
        c.lastVisit ? new Date(c.lastVisit).toLocaleDateString("en-IN") : "—",
        INR(c.monetary),
      ]),
    y,
    C.purple,
    {
      columnStyles: {
        1: { halign: "center" },
        2: { halign: "center" },
        3: { halign: "center" },
        4: { halign: "center" },
        5: { halign: "center" },
        7: { halign: "right" },
      },
    },
  );

  // ──────────────────────────────────────────────────────────────────────────
  // SECTION 04 — MENU ANALYTICS + MENU ENGINEERING
  // ──────────────────────────────────────────────────────────────────────────
  doc.addPage();
  y = ML;
  y = chapterBanner(
    doc,
    "04",
    "Menu Analytics & Engineering",
    "Ingredient intelligence · Food cost · Quadrant matrix",
    y,
    C.teal,
  );

  const invVal = (data.ingredients as any[]).reduce(
    (s: number, i: any) =>
      s + Number(i.quantity || 0) * Number(i.pricePerUnit || 0),
    0,
  );
  y = kpiRow(
    doc,
    [
      {
        label: "Inventory Value",
        value: INR(invVal),
        sub: "current stock value",
        accent: C.blue,
      },
      {
        label: "Total Ingredients",
        value: String((data.ingredients as any[]).length),
        sub: "in system",
        accent: C.purple,
      },
      {
        label: "Top Item",
        value: topItems[0]?.[0] || "—",
        sub: `${topItems[0]?.[1]?.qty || 0} sold`,
        accent: C.red,
      },
      {
        label: "Menu Items",
        value: String(menuItems.length),
        sub: `${menuItems.filter((m: any) => (m.menuItemIngredients || []).length > 0).length} mapped`,
        accent: C.teal,
      },
    ],
    y,
    4,
  );

  y = sectionLabel(doc, "Top Selling Items — Menu Analytics", y);
  y =
    hBar(
      doc,
      topItems
        .slice(0, 10)
        .map(([name, d], i) => ({
          label: name,
          value: d.qty,
          color: [C.red, C.blue, C.green, C.amber, C.purple][i % 5] as RGB,
        })),
      ML,
      y,
      CW,
      "Items by Quantity Sold",
    ) + 4;

  y = sectionLabel(
    doc,
    "Menu Engineering Matrix (Stars / Puzzles / Plowhorses / Dogs)",
    y,
    C.teal,
  );
  const medQty =
    topItems.length > 0 ? topItems[Math.floor(topItems.length / 2)][1].qty : 0;
  const engBody = topItems.slice(0, 20).map(([name, d]) => {
    const mi = menuItems.find((m: any) => m.name === name);
    const cost = (mi?.menuItemIngredients || []).reduce(
      (acc: number, ing: any) =>
        acc +
        Number(ing.quantity || 0) * Number(ing.ingredient?.pricePerUnit || 0),
      0,
    );
    const sp = Number(mi?.price || 0);
    const marg = sp > 0 ? (((sp - cost) / sp) * 100).toFixed(1) : "0.0";
    const quad =
      d.qty >= medQty && parseFloat(marg) >= 50
        ? "⭐ Star"
        : d.qty < medQty && parseFloat(marg) >= 50
          ? "🧩 Puzzle"
          : d.qty >= medQty
            ? "🐎 Plowhorse"
            : "🐕 Dog";
    return [name, d.qty, INR(d.rev), d.cat, `${marg}%`, quad];
  });
  y = premTable(
    doc,
    [["Item Name", "Qty Sold", "Revenue", "Category", "Margin %", "Quadrant"]],
    engBody,
    y,
    C.teal,
    {
      columnStyles: {
        1: { halign: "center" },
        2: { halign: "right" },
        4: { halign: "center" },
        5: { halign: "center" },
      },
    },
  );

  // ──────────────────────────────────────────────────────────────────────────
  // SECTION 05 — FINANCIAL REPORTS
  // ──────────────────────────────────────────────────────────────────────────
  doc.addPage();
  y = ML;
  y = chapterBanner(
    doc,
    "05",
    "Financial Reports",
    "P&L · Tax (GST) · Expenses · Sales · Discounts",
    y,
    C.green,
  );

  y = kpiRow(
    doc,
    [
      {
        label: "Gross Revenue",
        value: INR(gross),
        sub: "before discounts",
        accent: C.red,
      },
      {
        label: "Net Revenue",
        value: INR(totalRev),
        sub: "after discounts",
        accent: C.blue,
      },
      {
        label: "GST Collected",
        value: INR(totalGST),
        sub: "CGST + SGST",
        accent: C.amber,
      },
      {
        label: "Total Expenses",
        value: INR(totalExp),
        sub: `${expenses.length} entries`,
        accent: C.purple,
      },
      {
        label: "Net Profit",
        value: INR(netProfit),
        sub: `${margin}% margin`,
        accent: netProfit >= 0 ? C.green : C.redDk,
      },
      {
        label: "Discounts",
        value: INR(totalDisc),
        sub: PCT(totalDisc, gross) + " of gross",
        accent: C.amber,
      },
    ],
    y,
    3,
  );

  y = sectionLabel(doc, "P&L Statement", y, C.green);
  y = premTable(
    doc,
    [["Line Item", "Amount", "% of Revenue", "Notes"]],
    [
      ["Gross Revenue (before discounts)", INR(gross), "100.0%", "Baseline"],
      [
        "(−) Discounts Applied",
        `−${INR(totalDisc)}`,
        `−${PCT(totalDisc, gross)}`,
        "Revenue reduction",
      ],
      ["Net Revenue", INR(totalRev), "—", "After discounts"],
      [
        "(−) GST Collected",
        `−${INR(totalGST)}`,
        `−${PCT(totalGST, totalRev)}`,
        "Tax liability",
      ],
      [
        "(−) Operating Expenses",
        `−${INR(totalExp)}`,
        `−${PCT(totalExp, totalRev)}`,
        `${expenses.length} entries`,
      ],
      [
        "ESTIMATED NET PROFIT",
        INR(netProfit),
        PCT(netProfit, totalRev),
        netProfit >= 0 ? "✓ Profitable" : "✗ Loss making",
      ],
    ],
    y,
    C.green,
    {
      columnStyles: { 1: { halign: "right" }, 2: { halign: "center" } },
      didParseCell: (h: any) => {
        if (h.row.index === 5) {
          h.cell.styles.fontStyle = "bold";
          h.cell.styles.fillColor =
            netProfit >= 0 ? C.greenLt : [254, 226, 226];
          h.cell.styles.textColor = netProfit >= 0 ? C.greenDk : C.redDk;
        }
      },
    },
  );

  y = sectionLabel(doc, "Expense Breakdown", y, C.purple);
  const expBars = Object.entries(expByType)
    .sort((a, b) => b[1] - a[1])
    .map(([t, v], i) => ({
      label: t,
      value: v,
      color: [C.purple, C.blue, C.amber, C.red, C.teal][i % 5] as RGB,
    }));
  y = hBar(doc, expBars, ML, y, CW, "Operating Expenses by Category") + 4;

  y = sectionLabel(doc, "Sales Analytics — Payment Channels", y, C.blue);
  y = premTable(
    doc,
    [["Payment Method", "Bills", "Revenue", "Avg Bill", "Share %"]],
    Object.entries(payMap)
      .sort((a, b) => b[1].rev - a[1].rev)
      .map(([m, d]) => [
        m,
        d.count,
        INR(d.rev),
        INR(d.count ? Math.round(d.rev / d.count) : 0),
        PCT(d.rev, totalRev),
      ]),
    y,
    C.blue,
    {
      columnStyles: {
        1: { halign: "center" },
        2: { halign: "right" },
        3: { halign: "right" },
        4: { halign: "center" },
      },
    },
  );

  y = sectionLabel(doc, "Order Channel Performance", y, C.blue);
  y = premTable(
    doc,
    [["Order Channel", "Bills", "Revenue", "Avg Bill", "Revenue %"]],
    Object.entries(otMap)
      .sort((a, b) => b[1].rev - a[1].rev)
      .map(([t, d]) => [
        t,
        d.count,
        INR(d.rev),
        INR(d.count ? Math.round(d.rev / d.count) : 0),
        PCT(d.rev, totalRev),
      ]),
    y,
    C.blue,
    {
      columnStyles: {
        1: { halign: "center" },
        2: { halign: "right" },
        3: { halign: "right" },
        4: { halign: "center" },
      },
    },
  );

  // ── TAX REPORT ────────────────────────────────────────────────────────────
  doc.addPage();
  y = ML;
  y = chapterBanner(
    doc,
    "05b",
    "Tax Report (GST)",
    "CGST + SGST breakdown per bill",
    y,
    C.amber,
  );

  const cgstTotal = bills.reduce(
    (s: number, b: any) => s + Number(b.cgst || 0),
    0,
  );
  const sgstTotal = bills.reduce(
    (s: number, b: any) => s + Number(b.sgst || 0),
    0,
  );
  y = kpiRow(
    doc,
    [
      {
        label: "Total CGST",
        value: INR(cgstTotal),
        sub: "Central GST collected",
        accent: C.blue,
      },
      {
        label: "Total SGST",
        value: INR(sgstTotal),
        sub: "State GST collected",
        accent: C.purple,
      },
      {
        label: "Total GST",
        value: INR(totalGST),
        sub: "CGST + SGST",
        accent: C.red,
      },
      {
        label: "Taxable Revenue",
        value: INR(totalRev - totalGST),
        sub: "excl. tax",
        accent: C.green,
      },
    ],
    y,
    4,
  );

  y = sectionLabel(doc, "GST Bill-wise Breakdown", y, C.amber);
  y = premTable(
    doc,
    [
      [
        "Bill No",
        "Date",
        "Order Type",
        "Subtotal",
        "CGST",
        "SGST",
        "Total GST",
        "Total",
        "Status",
      ],
    ],
    bills.map((b: any) => [
      b.billNo || `#${b.id}`,
      new Date(b.createdAt).toLocaleDateString("en-IN"),
      (b.orderType || "").replace("_", " "),
      INR(b.subtotal),
      INR(b.cgst),
      INR(b.sgst),
      INR(Number(b.cgst || 0) + Number(b.sgst || 0)),
      INR(b.total),
      b.status || "—",
    ]),
    y,
    C.amber,
    {
      columnStyles: {
        3: { halign: "right" },
        4: { halign: "right" },
        5: { halign: "right" },
        6: { halign: "right" },
        7: { halign: "right" },
        8: { halign: "center" },
      },
    },
  );

  // ── EXPENSE TRACKER ───────────────────────────────────────────────────────
  doc.addPage();
  y = ML;
  y = chapterBanner(
    doc,
    "05c",
    "Expense Tracker",
    `${expenses.length} entries · Total: ${INR(totalExp)}`,
    y,
    C.purple,
  );

  y = kpiRow(
    doc,
    [
      {
        label: "Total Expenses",
        value: INR(totalExp),
        sub: `${expenses.length} entries`,
        accent: C.purple,
      },
      {
        label: "Expense/Revenue",
        value: PCT(totalExp, totalRev),
        sub: "cost ratio",
        accent: totalExp / totalRev < 0.3 ? C.green : C.redDk,
      },
      {
        label: "Categories",
        value: String(Object.keys(expByType).length),
        sub: "expense types",
        accent: C.blue,
      },
      {
        label: "Avg per Entry",
        value: INR(
          expenses.length ? Math.round(totalExp / expenses.length) : 0,
        ),
        sub: "per expense",
        accent: C.amber,
      },
    ],
    y,
    4,
  );

  y = sectionLabel(doc, "Expense Entries", y, C.purple);
  y = premTable(
    doc,
    [["Expense Name", "Category", "Date", "Amount", "Paid By"]],
    expenses.map((e: any) => [
      e.title || "—",
      e.expenseType || "—",
      new Date(e.expenseDate || e.createdAt).toLocaleDateString("en-IN"),
      INR(e.amount),
      e.paidByUser?.name || "—",
    ]),
    y,
    C.purple,
    { columnStyles: { 3: { halign: "right" }, 4: { halign: "center" } } },
  );

  // ── DISCOUNT ANALYSIS ─────────────────────────────────────────────────────
  doc.addPage();
  y = ML;
  y = chapterBanner(
    doc,
    "05d",
    "Discount Analysis",
    "Track every discount — identify patterns and prevent abuse",
    y,
    C.amber,
  );

  const discBills = bills.filter((b: any) => Number(b.discount || 0) > 0);
  y = kpiRow(
    doc,
    [
      {
        label: "Total Discounts",
        value: INR(totalDisc),
        sub: "revenue given away",
        accent: C.amber,
      },
      {
        label: "Bills with Discount",
        value: String(discBills.length),
        sub: `of ${bills.length} total`,
        accent: C.blue,
      },
      {
        label: "Avg Discount per Bill",
        value: INR(
          discBills.length ? Math.round(totalDisc / discBills.length) : 0,
        ),
        sub: "when applied",
        accent: C.purple,
      },
      {
        label: "Discount % of Revenue",
        value: PCT(totalDisc, gross),
        sub: "revenue reduction",
        accent: totalDisc / gross < 0.05 ? C.green : C.redDk,
      },
    ],
    y,
    4,
  );

  y = sectionLabel(doc, "Discounted Bills", y, C.amber);
  y = premTable(
    doc,
    [
      [
        "Bill No",
        "Date",
        "Customer",
        "Order Type",
        "Gross Total",
        "Discount",
        "Net Total",
        "Discount %",
      ],
    ],
    discBills
      .sort((a: any, b: any) => Number(b.discount) - Number(a.discount))
      .map((b: any) => {
        const g = Number(b.total || 0) + Number(b.discount || 0);
        return [
          b.billNo || `#${b.id}`,
          new Date(b.createdAt).toLocaleDateString("en-IN"),
          b.customer?.name || "Guest",
          (b.orderType || "").replace("_", " "),
          INR(g),
          INR(b.discount),
          INR(b.total),
          g > 0 ? `${((Number(b.discount) / g) * 100).toFixed(1)}%` : "0%",
        ];
      }),
    y,
    C.amber,
    {
      columnStyles: {
        4: { halign: "right" },
        5: { halign: "right" },
        6: { halign: "right" },
        7: { halign: "center" },
      },
    },
  );

  // ── SALES ANALYTICS — FULL BILLS TABLE ───────────────────────────────────
  doc.addPage();
  y = ML;
  y = chapterBanner(
    doc,
    "05e",
    "Sales Analytics — Bills Summary",
    "Complete transaction log",
    y,
    C.blue,
  );

  y = premTable(
    doc,
    [
      [
        "Bill No",
        "Customer",
        "Order Type",
        "Payment",
        "Subtotal",
        "GST",
        "Discount",
        "Total",
        "Status",
      ],
    ],
    bills.map((b: any) => [
      b.billNo || `#${b.id}`,
      b.customer?.name || "Guest",
      (b.orderType || "").replace("_", " "),
      b.paymentMethod || "—",
      INR(b.subtotal),
      INR(Number(b.cgst || 0) + Number(b.sgst || 0)),
      INR(b.discount),
      INR(b.total),
      b.status || "—",
    ]),
    y,
    C.blue,
    {
      columnStyles: {
        4: { halign: "right" },
        5: { halign: "right" },
        6: { halign: "right" },
        7: { halign: "right" },
        8: { halign: "center" },
      },
    },
  );

  // ──────────────────────────────────────────────────────────────────────────
  // SECTION 06 — OPERATIONS (Table, Waste, Heatmap, Day)
  // ──────────────────────────────────────────────────────────────────────────
  doc.addPage();
  y = ML;
  y = chapterBanner(
    doc,
    "06",
    "Operations Analytics",
    "Tables · Waste · Hourly Heatmap · Day Analysis",
    y,
    C.amber,
  );

  const tableTurnData = kitchenData?.tableTurnData || [];
  y = kpiRow(
    doc,
    [
      {
        label: "Tables Active",
        value: String(tableTurnData.length),
        sub: "with orders",
        accent: C.blue,
      },
      {
        label: "Avg Turn Time",
        value: `${kitchenData?.summary?.avgTime || 0}m`,
        sub: "per order",
        accent: C.amber,
      },
      {
        label: "Waste Entries",
        value: String(inventoryAdjustments.length),
        sub: "adjustments",
        accent: C.redDk,
      },
      {
        label: "Peak Hour",
        value: heatmap?.peakHour?.label || "—",
        sub: INR(heatmap?.peakHour?.revenue || 0),
        accent: C.red,
      },
    ],
    y,
    4,
  );

  y = sectionLabel(doc, "Table Turn Rate", y, C.blue);
  y = premTable(
    doc,
    [["Table", "Orders", "Avg Turn Time (min)", "Performance"]],
    tableTurnData
      .slice(0, 12)
      .map((t: any) => [
        t.name || t.tableName,
        t.count,
        t.avgTime,
        t.avgTime <= 30 ? "✅ Fast" : t.avgTime <= 45 ? "⚡ Normal" : "⚠️ Slow",
      ]),
    y,
    C.blue,
    {
      columnStyles: {
        1: { halign: "center" },
        2: { halign: "center" },
        3: { halign: "center" },
      },
    },
  );

  y = sectionLabel(doc, "Top Wasted Ingredients", y, C.amber);
  y =
    hBar(
      doc,
      Object.entries(wasteByIng)
        .sort((a, b) => b[1].qty - a[1].qty)
        .slice(0, 8)
        .map(([name, d]) => ({ label: name, value: d.qty, color: C.amber })),
      ML,
      y,
      CW,
      "Waste by Ingredient (Qty)",
    ) + 3;

  y = sectionLabel(doc, "Hourly Revenue Pattern", y, C.red);
  const hourlyData = (heatmap?.hourlyData || []).filter(
    (h: any) => h.revenue > 0,
  );
  y =
    colChart(
      doc,
      hourlyData
        .filter((h: any) => h.hour >= 6)
        .map((h: any) => ({ label: h.label, value: h.revenue })),
      ML,
      y,
      CW,
      35,
      C.red,
    ) + 3;

  y = sectionLabel(doc, "Day of Week Analysis", y, C.purple);
  y = premTable(
    doc,
    [["Day", "Revenue", "Orders", "Avg Bill", "Revenue Share %", "Rating"]],
    (heatmap?.dailyData || []).map((d: any) => [
      d.name,
      INR(d.revenue),
      d.orders,
      INR(d.orders ? Math.round(d.revenue / d.orders) : 0),
      PCT(
        d.revenue,
        (heatmap?.dailyData || []).reduce(
          (s: number, x: any) => s + x.revenue,
          0,
        ),
      ),
      d.revenue ===
      Math.max(...(heatmap?.dailyData || []).map((x: any) => x.revenue))
        ? "[BEST]"
        : "Normal",
    ]),
    y,
    C.purple,
    {
      columnStyles: {
        1: { halign: "right" },
        2: { halign: "center" },
        3: { halign: "right" },
        4: { halign: "center" },
        5: { halign: "center" },
      },
    },
  );

  // ── HOURLY HEATMAP DETAILS ────────────────────────────────────────────────
  doc.addPage();
  y = ML;
  y = chapterBanner(
    doc,
    "06b",
    "Hourly Revenue Heatmap",
    "Revenue patterns by hour and day of week",
    y,
    C.red,
  );

  y = kpiRow(
    doc,
    [
      {
        label: "Peak Hour",
        value: heatmap?.peakHour?.label || "—",
        sub: INR(heatmap?.peakHour?.revenue || 0),
        accent: C.red,
      },
      {
        label: "Best Day",
        value: heatmap?.peakDay?.name || "—",
        sub: INR(heatmap?.peakDay?.revenue || 0),
        accent: C.blue,
      },
      {
        label: "Peak Hour Orders",
        value: String(heatmap?.peakHour?.orders || 0),
        sub: "orders in peak hour",
        accent: C.green,
      },
      {
        label: "Best Day Orders",
        value: String(heatmap?.peakDay?.orders || 0),
        sub: "orders on best day",
        accent: C.purple,
      },
    ],
    y,
    4,
  );

  y = sectionLabel(doc, "Revenue by Hour of Day", y, C.red);
  const hrAll = (heatmap?.hourlyData || []).filter((h: any) => h.hour >= 6);
  if (hrAll.length > 0)
    y =
      colChart(
        doc,
        hrAll.map((h: any) => ({ label: h.label, value: h.revenue })),
        ML,
        y,
        CW,
        38,
        C.red,
      ) + 3;
  y = premTable(
    doc,
    [["Hour", "Revenue", "Orders", "Avg Bill", "Revenue Share"]],
    hrAll.map((h: any) => [
      h.label,
      INR(h.revenue),
      h.orders,
      INR(h.orders ? Math.round(h.revenue / h.orders) : 0),
      PCT(
        h.revenue,
        (heatmap?.hourlyData || []).reduce(
          (s: number, x: any) => s + x.revenue,
          0,
        ),
      ),
    ]),
    y,
    C.red,
    {
      columnStyles: {
        1: { halign: "right" },
        2: { halign: "center" },
        3: { halign: "right" },
        4: { halign: "center" },
      },
    },
  );

  y = sectionLabel(doc, "Revenue by Day of Week", y, C.blue);
  const dayAll = heatmap?.dailyData || [];
  if (dayAll.length > 0)
    y =
      colChart(
        doc,
        dayAll.map((d: any) => ({
          label: d.short || d.name?.slice(0, 3),
          value: d.revenue,
        })),
        ML,
        y,
        CW,
        36,
        C.blue,
      ) + 3;
  y = premTable(
    doc,
    [["Day", "Revenue", "Orders", "Avg Bill", "Revenue Share", "Performance"]],
    dayAll.map((d: any) => [
      d.name,
      INR(d.revenue),
      d.orders,
      INR(d.avgBill || (d.orders ? Math.round(d.revenue / d.orders) : 0)),
      PCT(
        d.revenue,
        dayAll.reduce((s: number, x: any) => s + x.revenue, 0),
      ),
      d.revenue === Math.max(...dayAll.map((x: any) => x.revenue))
        ? "[BEST]"
        : d.revenue < Math.max(...dayAll.map((x: any) => x.revenue)) * 0.3
          ? "Slow"
          : "Normal",
    ]),
    y,
    C.blue,
    {
      columnStyles: {
        1: { halign: "right" },
        2: { halign: "center" },
        3: { halign: "right" },
        4: { halign: "center" },
        5: { halign: "center" },
      },
    },
  );

  // ── TABLE ANALYTICS DETAILED ──────────────────────────────────────────────
  doc.addPage();
  y = ML;
  y = chapterBanner(
    doc,
    "06c",
    "Table Analytics — Detailed",
    "Revenue per table · Turn rate · Performance",
    y,
    C.teal,
  );

  const tdFull = kitchenData?.tableTurnData || [];
  const totalTableRev = tdFull.reduce(
    (s: number, t: any) => s + Number(t.revenue || 0),
    0,
  );
  y = kpiRow(
    doc,
    [
      {
        label: "Tables Active",
        value: String(tdFull.length),
        sub: "with recorded orders",
        accent: C.blue,
      },
      {
        label: "Avg Turn Time",
        value: `${kitchenData?.summary?.avgTime || 0}m`,
        sub: "avg per order",
        accent: C.amber,
      },
      {
        label: "Total Orders",
        value: String(tdFull.reduce((s: number, t: any) => s + t.count, 0)),
        sub: "dine-in orders",
        accent: C.green,
      },
    ],
    y,
    3,
  );

  if (tdFull.length > 0) {
    const tRevBars = tdFull
      .sort((a: any, b: any) => b.count - a.count)
      .map((t: any, i: number) => ({
        label: t.name || t.tableName,
        value: t.count,
        color: [C.teal, C.blue, C.green, C.amber, C.red][i % 5] as RGB,
      }));
    const tTimeBars = tdFull
      .filter((t: any) => t.avgTime > 0)
      .sort((a: any, b: any) => b.avgTime - a.avgTime)
      .map((t: any) => ({
        label: t.name || t.tableName,
        value: t.avgTime,
        color: C.amber,
      }));
    const nt1 = hBar(doc, tRevBars, ML, y, half, "Orders per Table");
    const nt2 = hBar(
      doc,
      tTimeBars,
      ML + half + 3,
      y,
      half,
      "Avg Turn Time per Table (min)",
    );
    y = Math.max(nt1, nt2) + 4;
  }

  y = sectionLabel(doc, "Table Performance Summary", y, C.teal);
  y = premTable(
    doc,
    [
      [
        "Table",
        "Orders",
        "Avg Turn (min)",
        "Revenue",
        "Avg Rev/Order",
        "Performance",
      ],
    ],
    tdFull.map((t: any) => [
      t.name || t.tableName,
      t.count,
      t.avgTime,
      INR(t.revenue || 0),
      INR(t.count ? Math.round((t.revenue || 0) / t.count) : 0),
      t.avgTime <= 30 ? "Fast" : t.avgTime <= 45 ? "Normal" : "Slow",
    ]),
    y,
    C.teal,
    {
      columnStyles: {
        1: { halign: "center" },
        2: { halign: "center" },
        3: { halign: "right" },
        4: { halign: "right" },
        5: { halign: "center" },
      },
    },
  );

  // ── WASTE REPORT DETAILED ────────────────────────────────────────────────
  doc.addPage();
  y = ML;
  y = chapterBanner(
    doc,
    "06d",
    "Waste & Inventory Report",
    "Wastage · Damage · Expired · Adjustment Log",
    y,
    C.amber,
  );

  const wastage = inventoryAdjustments.filter(
    (a: any) =>
      a.adjustmentType === "WASTAGE" || a.adjustmentType === "EXPIRED",
  );
  const damage = inventoryAdjustments.filter(
    (a: any) => a.adjustmentType === "DAMAGE",
  );
  y = kpiRow(
    doc,
    [
      {
        label: "Total Adjustments",
        value: String(inventoryAdjustments.length),
        sub: "all types",
        accent: C.s600,
      },
      {
        label: "Wastage / Expired",
        value: String(wastage.length),
        sub: "items wasted",
        accent: C.amber,
      },
      {
        label: "Damage",
        value: String(damage.length),
        sub: "items damaged",
        accent: C.redDk,
      },
      {
        label: "Unique Ingredients",
        value: String(Object.keys(wasteByIng).length),
        sub: "affected",
        accent: C.purple,
      },
    ],
    y,
    4,
  );

  y = sectionLabel(doc, "Top Wasted Ingredients", y, C.amber);
  const wasteBars = Object.entries(wasteByIng)
    .sort((a, b) => b[1].qty - a[1].qty)
    .slice(0, 10)
    .map(([name, d]) => ({ label: name, value: d.qty, color: C.amber }));
  if (wasteBars.length > 0)
    y =
      hBar(doc, wasteBars, ML, y, CW, "Waste by Ingredient (Total Quantity)") +
      4;

  y = sectionLabel(doc, "Ingredient Waste Table", y, C.amber);
  y = premTable(
    doc,
    [["Ingredient", "Total Qty Wasted", "Adjustments", "Avg per Entry"]],
    Object.entries(wasteByIng)
      .sort((a, b) => b[1].qty - a[1].qty)
      .slice(0, 20)
      .map(([name, d]) => [
        name,
        d.qty.toFixed(2),
        d.adj,
        d.adj > 0 ? (d.qty / d.adj).toFixed(2) : 0,
      ]),
    y,
    C.amber,
    {
      columnStyles: {
        1: { halign: "center" },
        2: { halign: "center" },
        3: { halign: "center" },
      },
    },
  );

  y = sectionLabel(doc, "Waste Adjustment Log", y, C.redDk);
  y = premTable(
    doc,
    [["Date", "Ingredient", "Type", "Quantity", "Reason", "Updated By"]],
    inventoryAdjustments.map((a: any) => [
      new Date(a.createdAt).toLocaleDateString("en-IN"),
      a.ingredient?.name || "—",
      a.adjustmentType || "—",
      Number(a.quantity || 0).toFixed(2),
      a.reason || "—",
      a.updatedBy?.name || "—",
    ]),
    y,
    C.redDk,
    {
      columnStyles: {
        2: { halign: "center" },
        3: { halign: "center" },
        5: { halign: "center" },
      },
    },
  );

  // ──────────────────────────────────────────────────────────────────────────
  // SECTION 07 — STAFF (Attendance + Productivity + Payroll)
  // ──────────────────────────────────────────────────────────────────────────
  doc.addPage();
  y = ML;
  y = chapterBanner(
    doc,
    "07",
    "Staff Analytics",
    "Attendance · Productivity · Payroll",
    y,
    C.s700,
  );

  const presentCount = new Set(
    attendance.filter((a: any) => a.loginTime).map((a: any) => a.userId),
  ).size;
  const sp = staffProductivity || {};
  y = kpiRow(
    doc,
    [
      {
        label: "Total Staff",
        value: String(allStaff.length),
        sub: "registered",
        accent: C.blue,
      },
      {
        label: "Present Today",
        value: String(presentCount),
        sub: "clocked in",
        accent: C.green,
      },
      {
        label: "Absent",
        value: String(allStaff.length - presentCount),
        sub: "not in",
        accent: C.redDk,
      },
      {
        label: "Labour Cost",
        value: INR(
          sp.totals?.totalLabourCost ||
            allStaff.reduce(
              (s: number, st: any) => s + Number(st.salary || 0),
              0,
            ),
        ),
        sub: "monthly",
        accent: C.purple,
      },
      {
        label: "Hours Worked",
        value: `${sp.totals?.totalHoursWorked || 0}h`,
        sub: "total",
        accent: C.amber,
      },
      {
        label: "Avg Hours",
        value: sp.totals?.totalStaff
          ? `${Math.round((sp.totals?.totalHoursWorked || 0) / sp.totals.totalStaff)}h`
          : "—",
        sub: "per staff",
        accent: C.teal,
      },
    ],
    y,
    3,
  );

  y = sectionLabel(doc, "Attendance Register", y);
  y = premTable(
    doc,
    [
      [
        "Staff Name",
        "Dept",
        "Role",
        "Clock In",
        "Clock Out",
        "Hours",
        "Status",
      ],
    ],
    allStaff.slice(0, 15).map((s: any) => {
      const att = attendance.find((a: any) => a.userId === s.id);
      const isP = !!att?.loginTime;
      const isL = isP && new Date(att.loginTime).getHours() > 9;
      return [
        s.name,
        s.department || "—",
        s.role,
        att?.loginTime
          ? new Date(att.loginTime).toLocaleTimeString("en-IN", {
              hour: "2-digit",
              minute: "2-digit",
            })
          : "—",
        att?.logoutTime
          ? new Date(att.logoutTime).toLocaleTimeString("en-IN", {
              hour: "2-digit",
              minute: "2-digit",
            })
          : "—",
        Number(att?.totalHours || 0).toFixed(1),
        isP ? (isL ? "Late" : "Present") : "Absent",
      ];
    }),
    y,
    C.s800,
    {
      columnStyles: {
        3: { halign: "center" },
        4: { halign: "center" },
        5: { halign: "center" },
        6: { halign: "center" },
      },
    },
  );

  y = sectionLabel(doc, "Revenue by Shift", y, C.amber);
  const srev = sp.shiftRevenue || {};
  const totalShiftRev = Object.values(srev).reduce(
    (s: number, v: any) => s + Number(v),
    0,
  );
  y = premTable(
    doc,
    [["Shift", "Revenue", "% of Total"]],
    [
      [
        "Morning (6–12)",
        INR(srev.morning || 0),
        PCT(Number(srev.morning || 0), totalShiftRev),
      ],
      [
        "Afternoon (12–5)",
        INR(srev.afternoon || 0),
        PCT(Number(srev.afternoon || 0), totalShiftRev),
      ],
      [
        "Evening (5–10)",
        INR(srev.evening || 0),
        PCT(Number(srev.evening || 0), totalShiftRev),
      ],
      [
        "Night (10–6)",
        INR(srev.night || 0),
        PCT(Number(srev.night || 0), totalShiftRev),
      ],
    ],
    y,
    C.amber,
    { columnStyles: { 1: { halign: "right" }, 2: { halign: "center" } } },
  );

  y = sectionLabel(doc, "Department Cost Breakdown", y, C.purple);
  y = premTable(
    doc,
    [["Department", "Staff", "Hours", "Total Salary", "Avg Salary"]],
    (sp.deptData || []).map((d: any) => [
      d.dept,
      d.count,
      `${d.totalHours}h`,
      INR(d.totalSalary),
      INR(d.avgSalary),
    ]),
    y,
    C.purple,
    {
      columnStyles: {
        1: { halign: "center" },
        2: { halign: "center" },
        3: { halign: "right" },
        4: { halign: "right" },
      },
    },
  );

  // ── STAFF PRODUCTIVITY EFFICIENCY TABLE ───────────────────────────────────
  doc.addPage();
  y = ML;
  y = chapterBanner(
    doc,
    "07b",
    "Staff Productivity — Efficiency Table",
    "Hours worked · Cost per hour · Attendance rate",
    y,
    C.s700,
  );

  y = premTable(
    doc,
    [
      [
        "Staff Name",
        "Dept",
        "Shift",
        "Days Present",
        "Hours Worked",
        "Attendance %",
        "Monthly Salary",
        "Cost/Hour",
      ],
    ],
    (sp.staff || allStaff).map((s: any) => [
      s.name,
      s.department || "—",
      s.shift || "—",
      s.daysPresent !== undefined ? s.daysPresent : "—",
      s.totalHours !== undefined ? `${s.totalHours}h` : "—",
      s.attendanceRate !== undefined ? `${s.attendanceRate}%` : "—",
      INR(s.monthlySalary || s.salary),
      s.costPerHour ? INR(s.costPerHour) : "—",
    ]),
    y,
    C.s800,
    {
      columnStyles: {
        3: { halign: "center" },
        4: { halign: "center" },
        5: { halign: "center" },
        6: { halign: "right" },
        7: { halign: "right" },
      },
    },
  );

  // ──────────────────────────────────────────────────────────────────────────
  // SECTION 08 — CASH RECONCILIATION
  // ──────────────────────────────────────────────────────────────────────────
  doc.addPage();
  y = ML;
  y = chapterBanner(
    doc,
    "08",
    "Cash Reconciliation",
    `${cashSessions.length} daily sessions`,
    y,
    C.green,
  );

  const shortfall = cashSessions.reduce(
    (s: number, r: any) =>
      s + Math.abs(Math.min(0, Number(r.cashDifference || 0))),
    0,
  );
  const surplus = cashSessions.reduce(
    (s: number, r: any) => s + Math.max(0, Number(r.cashDifference || 0)),
    0,
  );
  y = kpiRow(
    doc,
    [
      {
        label: "Sessions",
        value: String(cashSessions.length),
        sub: "recorded",
        accent: C.blue,
      },
      {
        label: "Shortfall",
        value: INR(shortfall),
        sub: "total deficit",
        accent: C.redDk,
      },
      {
        label: "Surplus",
        value: INR(surplus),
        sub: "total excess",
        accent: C.green,
      },
      {
        label: "Net Difference",
        value: INR(surplus - shortfall),
        sub: "surplus − shortfall",
        accent: surplus >= shortfall ? C.green : C.redDk,
      },
    ],
    y,
    4,
  );

  if (cashSessions.length > 0) {
    y = sectionLabel(doc, "Cash Difference Trend", y, C.green);
    y =
      colChart(
        doc,
        cashSessions
          .slice(0, 20)
          .map((s: any) => ({
            label: new Date(s.businessDate)
              .toLocaleDateString("en-IN")
              .slice(0, 5),
            value: Math.abs(Number(s.cashDifference || 0)),
          })),
        ML,
        y,
        CW,
        32,
        C.green,
      ) + 3;
  }

  y = sectionLabel(doc, "Session History", y, C.green);
  y = premTable(
    doc,
    [["Date", "Opened By", "Opening", "Expected", "Actual", "Diff", "Status"]],
    cashSessions
      .slice(0, 15)
      .map((s: any) => [
        new Date(s.businessDate).toLocaleDateString("en-IN"),
        s.openedBy?.name || "—",
        INR(s.openingCash),
        INR(s.expectedCash),
        INR(s.actualCash || s.closingCash),
        INR(s.cashDifference),
        s.status || "OPEN",
      ]),
    y,
    C.green,
    {
      columnStyles: {
        2: { halign: "right" },
        3: { halign: "right" },
        4: { halign: "right" },
        5: { halign: "right" },
        6: { halign: "center" },
      },
    },
  );

  // ──────────────────────────────────────────────────────────────────────────
  // SECTION 09 — KITCHEN ANALYTICS
  // ──────────────────────────────────────────────────────────────────────────
  doc.addPage();
  y = ML;
  y = chapterBanner(
    doc,
    "09",
    "Kitchen Performance Analytics",
    "Speed · SLA · Throughput · Slowest Orders",
    y,
    C.amber,
  );

  const ks = kitchenData?.summary || {};
  y = kpiRow(
    doc,
    [
      {
        label: "Total Orders",
        value: String(ks.totalOrders || 0),
        sub: "completed",
        accent: C.blue,
      },
      {
        label: "Avg Completion",
        value: `${ks.avgTime || 0}m`,
        sub: "from order to serve",
        accent: ks.avgTime <= 30 ? C.green : C.amber,
      },
      {
        label: "SLA Compliance",
        value: `${ks.slaPercent || 0}%`,
        sub: "orders < 30 min",
        accent: (ks.slaPercent || 0) >= 80 ? C.green : C.redDk,
      },
      {
        label: "Fastest Order",
        value: `${ks.fastestOrder || 0}m`,
        sub: "best time",
        accent: C.green,
      },
      {
        label: "Peak Hour",
        value: ks.peakHourLabel || "—",
        sub: "highest load",
        accent: C.amber,
      },
    ],
    y,
    5,
  );

  y = sectionLabel(doc, "Kitchen Throughput by Hour", y, C.amber);
  const kHourly = (kitchenData?.hourlyData || []).filter(
    (h: any) => h.orders > 0,
  );
  if (kHourly.length > 0)
    y =
      colChart(
        doc,
        kHourly.map((h: any) => ({ label: h.label, value: h.orders })),
        ML,
        y,
        CW,
        35,
        C.amber,
      ) + 3;

  y = sectionLabel(doc, "Completion Time by Hour (vs 30-min SLA)", y, C.red);
  y = premTable(
    doc,
    [["Hour", "Orders", "Avg Time (min)", "SLA Status"]],
    kHourly.map((h: any) => [
      h.label,
      h.orders,
      `${h.avgTime} min`,
      h.avgTime <= 30 ? "✅ Within SLA" : "⚠️ Over SLA",
    ]),
    y,
    C.amber,
    {
      columnStyles: {
        1: { halign: "center" },
        2: { halign: "center" },
        3: { halign: "center" },
      },
    },
  );

  y = sectionLabel(
    doc,
    "Speed by Order Type  /  Top Kitchen Items",
    y,
    C.amber,
  );
  const kOtBars = (kitchenData?.orderTypeSpeeds || []).map((o: any) => ({
    label: o.type,
    value: o.avgTime,
    color: C.amber,
  }));
  const kItemBars = (kitchenData?.topItems || [])
    .slice(0, 8)
    .map((item: any) => ({
      label: item.name,
      value: item.count,
      color: C.red,
    }));
  const ky1 = hBar(
    doc,
    kOtBars,
    ML,
    y,
    half,
    "Avg Completion by Order Type (min)",
  );
  const ky2 = hBar(
    doc,
    kItemBars,
    ML + half + 3,
    y,
    half,
    "Top Kitchen Items (Qty Prepared)",
  );
  y = Math.max(ky1, ky2) + 3;

  y = sectionLabel(doc, "Slowest Orders — Investigation Needed", y, C.redDk);
  y = premTable(
    doc,
    [["Order ID", "Type", "Table", "Duration", "Started At", "SLA"]],
    (kitchenData?.slowestOrders || [])
      .slice(0, 10)
      .map((o: any) => [
        `#${o.id}`,
        (o.orderType || "").replace("_", " "),
        o.tableName || "—",
        `${o.durationMinutes} min`,
        new Date(o.startedAt).toLocaleTimeString("en-IN"),
        o.durationMinutes <= 30 ? "[OK]" : "[MISSED]",
      ]),
    y,
    C.redDk,
    { columnStyles: { 3: { halign: "center" }, 5: { halign: "center" } } },
  );

  y = sectionLabel(doc, "Top Kitchen Items", y, C.amber);
  y = premTable(
    doc,
    [["#", "Item Name", "Times Prepared", "Kitchen Load %"]],
    (kitchenData?.topItems || []).slice(0, 15).map((item: any, i: number) => {
      const maxKit = (kitchenData?.topItems || [])[0]?.count || 1;
      return [
        i + 1,
        item.name,
        item.count,
        `${((item.count / maxKit) * 100).toFixed(1)}%`,
      ];
    }),
    y,
    C.amber,
    {
      columnStyles: {
        0: { halign: "center", cellWidth: 12 },
        2: { halign: "center" },
        3: { halign: "center" },
      },
    },
  );

  y = sectionLabel(doc, "Daily Completion Trend", y, C.orange);
  y = premTable(
    doc,
    [["Date", "Orders Completed", "Avg Completion Time (min)", "SLA Status"]],
    (kitchenData?.dailyTrend || []).map((d: any) => [
      d.date,
      d.orders,
      `${d.avgTime} min`,
      d.orders === 0
        ? "—"
        : d.avgTime <= 30
          ? "[OK] Within SLA"
          : "[MISSED] Over SLA",
    ]),
    y,
    C.orange,
    {
      columnStyles: {
        1: { halign: "center" },
        2: { halign: "center" },
        3: { halign: "center" },
      },
    },
  );

  // ──────────────────────────────────────────────────────────────────────────
  // SECTION 10 — BUSINESS INTELLIGENCE (Insights + Forecast + Comparison)
  // ──────────────────────────────────────────────────────────────────────────
  doc.addPage();
  y = ML;
  y = chapterBanner(
    doc,
    "10",
    "Business Intelligence",
    "Insights · Revenue Forecast · Branch/City Comparison",
    y,
    C.purple,
  );

  y = kpiRow(
    doc,
    [
      {
        label: "EBITDA %",
        value: `${ebitda}%`,
        sub: `target: ${ins.targetEbitda || 0}%`,
        accent:
          parseFloat(ebitda) >= (ins.targetEbitda || 0) ? C.green : C.redDk,
      },
      {
        label: "Fixed Expenses",
        value: INR(fixedExp),
        sub: "monthly",
        accent: C.blue,
      },
      {
        label: "Variable Exp.",
        value: INR(varExp),
        sub: "monthly",
        accent: C.amber,
      },
      {
        label: "Labour Cost",
        value: INR(labourExp),
        sub: "monthly salaries",
        accent: C.purple,
      },
    ],
    y,
    4,
  );

  y = sectionLabel(doc, "Revenue Targets (EBITDA Scenarios)", y, C.purple);
  y = premTable(
    doc,
    [["EBITDA Target", "Revenue Required", "Gap", "Status"]],
    [0, 5, 10, 15, 20, 25].map((target) => {
      const req = (fixedExp + varExp + labourExp) / (1 - target / 100);
      const gap = req - insRev;
      return [
        `${target}%`,
        INR(req),
        gap <= 0 ? "—" : `+${INR(gap)}`,
        gap <= 0 ? "✅ Achieved" : "❌ Gap",
      ];
    }),
    y,
    C.purple,
    {
      columnStyles: {
        1: { halign: "right" },
        2: { halign: "right" },
        3: { halign: "center" },
      },
    },
  );

  y = sectionLabel(doc, "Revenue Forecast — 7-Day Prediction", y, C.blue);
  const fSum = (forecast as any)?.summary || {};
  y = kpiRow(
    doc,
    [
      {
        label: "Last 7-Day Avg",
        value: INR(fSum.avg7 || 0),
        sub: "daily",
        accent: C.blue,
      },
      {
        label: "Growth Rate",
        value: `${fSum.growthPercent >= 0 ? "+" : ""}${fSum.growthPercent || 0}%`,
        sub: "week-on-week",
        accent: (fSum.growthPercent || 0) >= 0 ? C.green : C.redDk,
      },
      {
        label: "Next 7D Total",
        value: INR(fSum.forecastTotal || 0),
        sub: "predicted",
        accent: C.purple,
      },
    ],
    y,
    3,
  );

  const fcBars = ((forecast as any)?.forecast || []).map((f: any) => ({
    label: f.date.slice(0, 5),
    value: f.predicted,
    color: C.purple,
  }));
  if (fcBars.length > 0)
    y =
      colChart(doc, fcBars, ML, y, CW, 35, C.purple, "7-Day Revenue Forecast") +
      3;

  if (branchComparison.length > 0) {
    y = sectionLabel(doc, "Branch vs Branch Comparison", y, C.blue);
    const branchBars = branchComparison.map((b: any, i: number) => ({
      label: b.branch?.name || "—",
      value: b.revenue,
      color: [C.red, C.blue, C.green, C.amber, C.purple][i % 5] as RGB,
    }));
    y = hBar(doc, branchBars, ML, y, CW, "Revenue by Branch") + 3;
    y = premTable(
      doc,
      [["Branch", "Revenue", "Orders", "Avg Bill", "Net Profit", "Staff"]],
      branchComparison.map((b: any) => [
        b.branch?.name || "—",
        INR(b.revenue),
        b.orders,
        INR(b.orders ? Math.round(b.revenue / b.orders) : 0),
        INR(b.netProfit),
        b.staffCount,
      ]),
      y,
      C.blue,
      {
        columnStyles: {
          1: { halign: "right" },
          2: { halign: "center" },
          3: { halign: "right" },
          4: { halign: "right" },
          5: { halign: "center" },
        },
      },
    );
  }

  if (cityComparison.length > 1) {
    y = sectionLabel(doc, "City vs City Comparison", y, C.purple);
    const cityBars = cityComparison.map((c: any, i: number) => ({
      label: c.city || "Unknown",
      value: c.revenue,
      color: [C.purple, C.blue, C.green, C.amber][i % 4] as RGB,
    }));
    y = hBar(doc, cityBars, ML, y, CW, "Revenue by City") + 3;
    y = premTable(
      doc,
      [["City", "Branches", "Revenue", "Orders", "Net Profit"]],
      cityComparison.map((c: any) => [
        c.city || "—",
        c.branches?.length || 0,
        INR(c.revenue),
        c.orders,
        INR(c.netProfit),
      ]),
      y,
      C.purple,
      {
        columnStyles: {
          1: { halign: "center" },
          2: { halign: "right" },
          3: { halign: "center" },
          4: { halign: "right" },
        },
      },
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // BACK-FILL PAGE FOOTERS
  // ──────────────────────────────────────────────────────────────────────────
  const total = doc.getNumberOfPages();
  for (let p = 1; p <= total; p++) {
    doc.setPage(p);
    pageHeader(doc, p, total, meta);
  }

  return doc.output("arraybuffer") as Uint8Array;
}
