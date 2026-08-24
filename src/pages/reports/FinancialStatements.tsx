import { useEffect, useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import {
  DocumentTextIcon,
  ArrowDownTrayIcon,
  PrinterIcon,
} from "@heroicons/react/24/outline";
import { useAppSelector } from "../../store";
import MobileTableCards from "../../components/common/MobileTableCards";

const STATEMENT_TYPES: { key: string; label: string }[] = [
  { key: "pnl", label: "Profit & Loss" },
  { key: "income", label: "Income Statement" },
  { key: "expense", label: "Expense Statement" },
  { key: "foodCost", label: "Food Cost Report" },
  { key: "labour", label: "Labour Report" },
  { key: "utility", label: "Utility Report" },
  { key: "branchSummary", label: "Branch Financial Summary" },
  { key: "restaurantSummary", label: "Restaurant Financial Summary" },
];

const PERIODS: { key: string; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "currentWeek", label: "This Week" },
  { key: "currentMonth", label: "This Month" },
  { key: "currentQuarter", label: "This Quarter" },
  { key: "currentYear", label: "This Year" },
];

// Local calendar date (YYYY-MM-DD) for filenames — NOT isoString.slice(0, 10),
// which reads the UTC calendar date and silently goes a day off whenever the
// browser's timezone is ahead of UTC (e.g. IST), the same class of bug fixed
// in finance.statements.service.ts's fmtDate on the backend.
const localDateStr = (iso: string) => {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const fmtValue = (row: { value: number | string; unit?: string }) => {
  if (typeof row.value === "string") return row.value;
  if (row.unit === "percentage") return `${row.value.toFixed(1)}%`;
  if (row.unit === "count") return String(row.value);
  return `₹${Math.round(row.value).toLocaleString("en-IN")}`;
};

export default function FinancialStatements() {
  const { selectedBranch } = useAppSelector((s) => s.branch);
  const { user, token } = useAppSelector((s) => s.auth);
  const API_URL = import.meta.env.VITE_API_URL;

  const [statementType, setStatementType] = useState("pnl");
  const [period, setPeriod] = useState("currentMonth");
  const [statement, setStatement] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStatement = async () => {
      if (!user?.restaurantId || !selectedBranch?.id) return;
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `${API_URL}/api/finance/${user.restaurantId}/${selectedBranch.id}/statements/${statementType}?period=${period}`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        const json = await res.json();
        if (json.success) setStatement(json.data);
        else setError(json.message || "Failed to load statement");
      } catch {
        setError("Failed to load statement");
      } finally {
        setLoading(false);
      }
    };
    fetchStatement();
  }, [statementType, period, selectedBranch?.id, user?.restaurantId]);

  const handleExportPDF = () => {
    if (!statement) return;
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });
    doc.setFontSize(16);
    doc.setTextColor(177, 0, 0);
    doc.text(statement.title, 14, 16);
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(statement.subtitle, 14, 22);

    let y = 30;
    statement.sections.forEach((section: any) => {
      autoTable(doc, {
        startY: y,
        head: [[section.title, ""]],
        body: section.rows.map((r: any) => [r.label, fmtValue(r)]),
        theme: "grid",
        headStyles: { fillColor: [177, 0, 0] },
        styles: { fontSize: 9 },
        margin: { left: 14, right: 14 },
      });
      y = (doc as any).lastAutoTable.finalY + 8;
    });

    doc.save(`${statement.type}-${localDateStr(statement.startDate)}.pdf`);
  };

  const handleExportExcel = async () => {
    if (!statement) return;
    const workbook = new ExcelJS.Workbook();
    const ws = workbook.addWorksheet(statement.title.slice(0, 31));
    ws.columns = [{ width: 36 }, { width: 20 }];
    ws.addRow([statement.title]).font = { bold: true, size: 14 };
    ws.addRow([statement.subtitle]);
    ws.addRow([]);
    statement.sections.forEach((section: any) => {
      const headerRow = ws.addRow([section.title]);
      headerRow.font = { bold: true };
      section.rows.forEach((r: any) => {
        const row = ws.addRow([r.label, fmtValue(r)]);
        if (r.isTotal) row.font = { bold: true };
      });
      ws.addRow([]);
    });
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    saveAs(blob, `${statement.type}-${localDateStr(statement.startDate)}.xlsx`);
  };

  const handleExportCSV = () => {
    if (!statement) return;
    const lines: string[] = [statement.title, statement.subtitle, ""];
    statement.sections.forEach((section: any) => {
      lines.push(section.title);
      section.rows.forEach((r: any) => {
        lines.push(`"${r.label}","${fmtValue(r)}"`);
      });
      lines.push("");
    });
    const blob = new Blob([lines.join("\n")], {
      type: "text/csv;charset=utf-8;",
    });
    saveAs(blob, `${statement.type}-${localDateStr(statement.startDate)}.csv`);
  };

  const handlePrint = () => window.print();

  return (
    <main className="flex flex-col overflow-hidden bg-[#f5f6fa]">
      <div className="mx-auto flex h-full w-full flex-col gap-4 overflow-hidden">
        {/* HEADER */}
        <div className="relative overflow-hidden rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm print:hidden">
          <div className="relative z-10 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#b10000] shadow-sm">
                <DocumentTextIcon className="h-4 w-4 text-white" />
              </div>
              <div>
                <h1 className="text-[22px] font-black leading-none tracking-tight text-gray-900">
                  Financial Statements
                </h1>
                <p className="mt-1 text-[12px] text-gray-500">
                  Daily/Monthly/Quarterly/Yearly statements from the shared
                  finance engine
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                aria-label="Statement type"
                value={statementType}
                onChange={(e) => setStatementType(e.target.value)}
                className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-[12px] font-semibold text-gray-700 outline-none"
              >
                {STATEMENT_TYPES.map((t) => (
                  <option key={t.key} value={t.key}>
                    {t.label}
                  </option>
                ))}
              </select>
              <select
                aria-label="Statement period"
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-[12px] font-semibold text-gray-700 outline-none"
              >
                {PERIODS.map((p) => (
                  <option key={p.key} value={p.key}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* CONTENT */}
        <div className="min-h-0 flex-1 overflow-y-auto rounded-2xl border border-gray-200 bg-white p-5 shadow-sm print:border-none print:shadow-none">
          {loading && (
            <div className="flex h-40 items-center justify-center text-[12px] text-gray-400">
              Loading statement…
            </div>
          )}
          {!loading && error && (
            <div className="flex h-40 items-center justify-center text-[12px] text-red-500">
              {error}
            </div>
          )}
          {!loading && !error && statement && (
            <div className="space-y-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-[18px] font-bold text-gray-900">
                    {statement.title}
                  </h2>
                  <p className="text-[12px] text-gray-500">
                    {statement.subtitle}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 print:hidden">
                  <button
                    type="button"
                    onClick={handleExportPDF}
                    className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-[12px] font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
                  >
                    <ArrowDownTrayIcon className="h-3.5 w-3.5" /> PDF
                  </button>
                  <button
                    type="button"
                    onClick={handleExportExcel}
                    className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-[12px] font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
                  >
                    <ArrowDownTrayIcon className="h-3.5 w-3.5" /> Excel
                  </button>
                  <button
                    type="button"
                    onClick={handleExportCSV}
                    className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-[12px] font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
                  >
                    <ArrowDownTrayIcon className="h-3.5 w-3.5" /> CSV
                  </button>
                  <button
                    type="button"
                    onClick={handlePrint}
                    className="flex items-center gap-1.5 rounded-xl bg-[#b10000] px-3 py-2 text-[12px] font-semibold text-white shadow-sm transition hover:bg-[#950000]"
                  >
                    <PrinterIcon className="h-3.5 w-3.5" /> Print
                  </button>
                </div>
              </div>

              {statement.sections.length === 0 && (
                <div className="flex h-32 items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50 text-[12px] text-gray-400">
                  No data for this period.
                </div>
              )}

              {statement.sections.map((section: any, i: number) => (
                <div
                  key={i}
                  className="overflow-hidden rounded-xl border border-gray-200"
                >
                  <div className="bg-gray-50 px-4 py-2 text-[13px] font-bold text-gray-900">
                    {section.title}
                  </div>
                  {/* Two columns — label and value — so this fits any phone.
                      No min-width and no scroll container: both would force a
                      horizontal scroll for no reason. */}
                  <table className="w-full text-[13px]">
                    <tbody>
                      {section.rows.map((r: any, j: number) => (
                        <tr
                          key={j}
                          className={`border-t border-gray-100 ${r.isTotal ? "bg-red-50/40 font-bold text-gray-900" : "text-gray-700"}`}
                        >
                          <td className="px-4 py-2">{r.label}</td>
                          <td className="px-4 py-2 text-right">
                            {fmtValue(r)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
