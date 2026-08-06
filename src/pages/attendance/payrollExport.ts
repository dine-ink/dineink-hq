// Lightweight export helpers for a single Payroll Run's lines.
//
// generateExcel.ts / generatePDF.ts (src/utils) are full cross-module
// business-intelligence report builders — their exported
// generateExcelReport()/generatePDFReport() functions require a
// `FullReportData` bundle (bills, expenses, customers, menu items, kitchen
// data, branch/city comparison, RFM, forecast, vendor data, ~20 fields in
// all, fetched from ~15 different endpoints) and always render ~12-27 fixed
// sheets/sections built around that bundle. A payroll run's five columns
// have no home in that shape, and synthesizing a fake FullReportData just to
// reach one of those functions would fetch/build a large amount of unrelated
// data no user asked for. Instead, this reuses the same underlying
// libraries those files are built on (ExcelJS, jsPDF + jspdf-autotable —
// already app dependencies) and mirrors their visual conventions (brand red
// #B10000 header band, alternating rows, bold total row, ₹/Rs. formatting)
// so the exported files still look consistent with the rest of DineInk's
// exports.
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export interface PayrollRunLine {
  id: number;
  payrollRunId: number;
  userId: number;
  baseSalary: number;
  overtimePay: number;
  deductions: number;
  netPay: number;
  user: { id: number; name: string };
}

export interface PayrollRun {
  id: number;
  restaurantId: number;
  branchId: number;
  month: number;
  year: number;
  status: string;
  totalPayout: number;
  createdAt: string;
  lines: PayrollRunLine[];
}

export interface PayrollExportMeta {
  restaurantName: string;
  branchName: string;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export const payrollPeriodLabel = (run: PayrollRun) =>
  `${MONTH_NAMES[run.month - 1] || run.month} ${run.year}`;

const n = (v: any) => Number(v || 0);
const inr = (v: any) => `Rs.${Math.round(n(v)).toLocaleString("en-IN")}`;
const slug = (s: string) => s.replace(/\s+/g, "-");

const totals = (run: PayrollRun) => ({
  baseSalary: run.lines.reduce((s, l) => s + n(l.baseSalary), 0),
  overtimePay: run.lines.reduce((s, l) => s + n(l.overtimePay), 0),
  deductions: run.lines.reduce((s, l) => s + n(l.deductions), 0),
  netPay: n(run.totalPayout),
});

// ─── Excel export ───────────────────────────────────────────────────────────
export async function exportPayrollRunToExcel(
  run: PayrollRun,
  meta: PayrollExportMeta,
): Promise<void> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "DineInk";
  wb.created = new Date();

  const ws = wb.addWorksheet("Payroll Run");
  ws.columns = [{ width: 28 }, { width: 18 }, { width: 18 }, { width: 18 }, { width: 18 }];

  const title = ws.addRow([`DineInk — Payroll Run — ${payrollPeriodLabel(run)}`]);
  title.font = { bold: true, size: 14, color: { argb: "FFFFFFFF" } };
  title.height = 26;
  title.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFB10000" } };
  title.getCell(1).alignment = { vertical: "middle", indent: 1 };
  ws.mergeCells(title.number, 1, title.number, 5);

  const sub = ws.addRow([
    `${meta.restaurantName}  |  ${meta.branchName}  |  Run on ${new Date(run.createdAt).toLocaleString("en-IN")}`,
  ]);
  sub.font = { italic: true, size: 9, color: { argb: "FF64748B" } };
  ws.mergeCells(sub.number, 1, sub.number, 5);
  ws.addRow([]);

  const head = ws.addRow(["Employee", "Base Salary", "Overtime Pay", "Deductions", "Net Pay"]);
  head.height = 18;
  head.eachCell((cell) => {
    cell.font = { bold: true, size: 9.5, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFB10000" } };
    cell.alignment = { vertical: "middle" };
  });

  run.lines.forEach((l, i) => {
    const row = ws.addRow([
      l.user?.name || "—",
      n(l.baseSalary),
      n(l.overtimePay),
      n(l.deductions),
      n(l.netPay),
    ]);
    if (i % 2 === 0) {
      row.eachCell((cell) => {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFDF4F4" } };
      });
    }
  });

  if (run.lines.length === 0) {
    ws.addRow(["No lines in this payroll run"]);
  }

  const t = totals(run);
  const totalRow = ws.addRow(["TOTAL", t.baseSalary, t.overtimePay, t.deductions, t.netPay]);
  totalRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFB91C1C" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFEF2F2" } };
  });

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  saveAs(blob, `DineInk-Payroll-${slug(meta.branchName)}-${slug(payrollPeriodLabel(run))}.xlsx`);
}

// ─── PDF export ─────────────────────────────────────────────────────────────
export function exportPayrollRunToPDF(run: PayrollRun, meta: PayrollExportMeta): void {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  doc.setFillColor(177, 0, 0);
  doc.rect(0, 0, 210, 22, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("DineInk  |  Payroll Run", 14, 14);

  doc.setTextColor(30, 41, 59);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`${meta.restaurantName}  |  ${meta.branchName}`, 14, 30);
  doc.text(
    `Period: ${payrollPeriodLabel(run)}   Run on: ${new Date(run.createdAt).toLocaleString("en-IN")}`,
    14,
    36,
  );

  const t = totals(run);
  autoTable(doc, {
    startY: 42,
    head: [["Employee", "Base Salary", "Overtime Pay", "Deductions", "Net Pay"]],
    body: run.lines.map((l) => [
      l.user?.name || "—",
      inr(l.baseSalary),
      inr(l.overtimePay),
      inr(l.deductions),
      inr(l.netPay),
    ]),
    foot: [["TOTAL", inr(t.baseSalary), inr(t.overtimePay), inr(t.deductions), inr(t.netPay)]],
    headStyles: { fillColor: [177, 0, 0], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 8 },
    footStyles: { fillColor: [254, 242, 242], textColor: [185, 28, 28], fontStyle: "bold", fontSize: 8 },
    bodyStyles: { fontSize: 8, textColor: [30, 41, 59] },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    styles: { cellPadding: 3 },
    margin: { left: 14, right: 14 },
  });

  doc.save(`DineInk-Payroll-${slug(meta.branchName)}-${slug(payrollPeriodLabel(run))}.pdf`);
}
