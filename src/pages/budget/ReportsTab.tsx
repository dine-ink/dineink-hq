import { useEffect, useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { ArrowDownTrayIcon, PrinterIcon } from "@heroicons/react/24/outline";
import { useAppSelector } from "../../store";
import { fmtCategoryValue } from "./budgetCategories";

// Monthly/Quarterly/Yearly/Variance Report are all the same underlying
// Budget vs Actual data at a different period granularity — one flexible
// generator instead of four near-duplicate ones. Branch vs Restaurant
// report is just a matter of which budget (branch-scoped or
// restaurant-wide) is selected below, not a different data shape.
const REPORT_TYPES = [
  { key: "currentMonth", label: "Monthly Budget Report" },
  { key: "currentQuarter", label: "Quarterly Budget Report" },
  { key: "currentYear", label: "Yearly Budget Report" },
  { key: "custom", label: "Variance Report (Custom Range)" },
];

// Same local-date helper as FinancialStatements.tsx — avoids the UTC-slice
// off-by-one when the browser is ahead of UTC (IST).
const localDateStr = (iso: string) => {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export default function ReportsTab() {
  const { user, token } = useAppSelector((s) => s.auth);
  const API_URL = import.meta.env.VITE_API_URL;

  const [budgets, setBudgets] = useState<any[]>([]);
  const [selectedBudgetId, setSelectedBudgetId] = useState<number | null>(null);
  const [reportType, setReportType] = useState("currentMonth");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [variance, setVariance] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchBudgets = async () => {
      if (!user?.restaurantId) return;
      try {
        const res = await fetch(`${API_URL}/api/budgets/${user.restaurantId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        if (json.success) {
          setBudgets(json.data);
          setSelectedBudgetId(json.data[0]?.id ?? null);
        }
      } catch {
        // fetch error — silently ignored
      }
    };
    fetchBudgets();
  }, [user?.restaurantId]);

  useEffect(() => {
    const fetchVariance = async () => {
      if (!selectedBudgetId) {
        setVariance(null);
        return;
      }
      if (reportType === "custom" && (!customFrom || !customTo)) return;
      setLoading(true);
      try {
        const rangeParams = reportType === "custom" ? `&from=${customFrom}&to=${customTo}` : "";
        const res = await fetch(
          `${API_URL}/api/budgets/${user.restaurantId}/${selectedBudgetId}/variance?period=${reportType}${rangeParams}`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        const json = await res.json();
        if (json.success) setVariance(json.data);
      } catch {
        // fetch error — silently ignored
      } finally {
        setLoading(false);
      }
    };
    fetchVariance();
  }, [selectedBudgetId, reportType, customFrom, customTo]);

  const selectedBudget = budgets.find((b) => b.id === selectedBudgetId);
  const reportTitle = REPORT_TYPES.find((r) => r.key === reportType)?.label || "Budget Report";
  const reportSubtitle = selectedBudget
    ? `${selectedBudget.name} · ${selectedBudget.branch?.name || "Restaurant-wide"} · ${variance ? `${localDateStr(variance.startDate)} to ${localDateStr(variance.endDate)}` : ""}`
    : "";

  const handleExportPDF = () => {
    if (!variance) return;
    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    doc.setFontSize(16);
    doc.setTextColor(177, 0, 0);
    doc.text(reportTitle, 14, 16);
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(reportSubtitle, 14, 22);

    autoTable(doc, {
      startY: 28,
      head: [["Category", "Budget", "Actual", "Variance", "Variance %", "Achievement %", "Status"]],
      body: variance.rows.map((r: any) => [
        r.label,
        fmtCategoryValue(r.budget, r.unit),
        fmtCategoryValue(r.actual, r.unit),
        r.variance != null ? fmtCategoryValue(r.variance, r.unit) : "—",
        r.variancePercentage != null ? `${r.variancePercentage.toFixed(1)}%` : "—",
        r.achievementPercentage != null ? `${r.achievementPercentage.toFixed(0)}%` : "—",
        r.status,
      ]),
      theme: "grid",
      headStyles: { fillColor: [177, 0, 0] },
      styles: { fontSize: 9 },
      margin: { left: 14, right: 14 },
    });

    doc.save(`budget-report-${selectedBudgetId}-${localDateStr(variance.startDate)}.pdf`);
  };

  const handleExportExcel = async () => {
    if (!variance) return;
    const workbook = new ExcelJS.Workbook();
    const ws = workbook.addWorksheet("Budget Report");
    ws.columns = [{ width: 28 }, { width: 16 }, { width: 16 }, { width: 16 }, { width: 14 }, { width: 16 }, { width: 14 }];
    ws.addRow([reportTitle]).font = { bold: true, size: 14 };
    ws.addRow([reportSubtitle]);
    ws.addRow([]);
    const header = ws.addRow(["Category", "Budget", "Actual", "Variance", "Variance %", "Achievement %", "Status"]);
    header.font = { bold: true };
    variance.rows.forEach((r: any) => {
      ws.addRow([
        r.label,
        fmtCategoryValue(r.budget, r.unit),
        fmtCategoryValue(r.actual, r.unit),
        r.variance != null ? fmtCategoryValue(r.variance, r.unit) : "—",
        r.variancePercentage != null ? `${r.variancePercentage.toFixed(1)}%` : "—",
        r.achievementPercentage != null ? `${r.achievementPercentage.toFixed(0)}%` : "—",
        r.status,
      ]);
    });
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    saveAs(blob, `budget-report-${selectedBudgetId}-${localDateStr(variance.startDate)}.xlsx`);
  };

  const handleExportCSV = () => {
    if (!variance) return;
    const lines: string[] = [reportTitle, reportSubtitle, "", "Category,Budget,Actual,Variance,Variance %,Achievement %,Status"];
    variance.rows.forEach((r: any) => {
      lines.push(
        [
          `"${r.label}"`,
          fmtCategoryValue(r.budget, r.unit),
          fmtCategoryValue(r.actual, r.unit),
          r.variance != null ? fmtCategoryValue(r.variance, r.unit) : "—",
          r.variancePercentage != null ? `${r.variancePercentage.toFixed(1)}%` : "—",
          r.achievementPercentage != null ? `${r.achievementPercentage.toFixed(0)}%` : "—",
          r.status,
        ].join(","),
      );
    });
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, `budget-report-${selectedBudgetId}-${localDateStr(variance.startDate)}.csv`);
  };

  const handlePrint = () => window.print();

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between print:hidden">
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedBudgetId ?? ""}
            onChange={(e) => setSelectedBudgetId(Number(e.target.value))}
            className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-[12px] font-semibold text-gray-700 outline-none"
          >
            {budgets.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} ({b.branch?.name || "Restaurant-wide"})
              </option>
            ))}
          </select>
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
            className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-[12px] font-semibold text-gray-700 outline-none"
          >
            {REPORT_TYPES.map((r) => (
              <option key={r.key} value={r.key}>{r.label}</option>
            ))}
          </select>
          {reportType === "custom" && (
            <>
              <input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} className="rounded-xl border border-gray-200 bg-white px-2.5 py-1.5 text-[11px] outline-none" />
              <span className="text-[11px] text-gray-400">to</span>
              <input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} className="rounded-xl border border-gray-200 bg-white px-2.5 py-1.5 text-[11px] outline-none" />
            </>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={handleExportPDF} className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-[12px] font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50">
            <ArrowDownTrayIcon className="h-3.5 w-3.5" /> PDF
          </button>
          <button type="button" onClick={handleExportExcel} className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-[12px] font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50">
            <ArrowDownTrayIcon className="h-3.5 w-3.5" /> Excel
          </button>
          <button type="button" onClick={handleExportCSV} className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-[12px] font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50">
            <ArrowDownTrayIcon className="h-3.5 w-3.5" /> CSV
          </button>
          <button type="button" onClick={handlePrint} className="flex items-center gap-1.5 rounded-xl bg-[#b10000] px-3 py-2 text-[12px] font-semibold text-white shadow-sm transition hover:bg-[#950000]">
            <PrinterIcon className="h-3.5 w-3.5" /> Print
          </button>
        </div>
      </div>

      {loading && <div className="flex h-24 items-center justify-center text-[12px] text-gray-400">Loading…</div>}

      {!loading && variance && (
        <div className="space-y-3">
          <div>
            <h3 className="text-[16px] font-bold text-gray-900">{reportTitle}</h3>
            <p className="text-[12px] text-gray-500">{reportSubtitle}</p>
          </div>
          <div className="overflow-hidden rounded-xl border border-gray-200">
            <table className="w-full text-[12px]">
              <thead className="bg-gray-50 text-[10px] font-bold uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-4 py-2 text-left">Category</th>
                  <th className="px-3 py-2 text-right">Budget</th>
                  <th className="px-3 py-2 text-right">Actual</th>
                  <th className="px-3 py-2 text-right">Variance</th>
                  <th className="px-3 py-2 text-right">Variance %</th>
                  <th className="px-3 py-2 text-right">Achievement %</th>
                  <th className="px-3 py-2 text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {variance.rows.map((r: any) => (
                  <tr key={r.category} className="border-t border-gray-100">
                    <td className="px-4 py-2 font-medium text-gray-700">{r.label}</td>
                    <td className="px-3 py-2 text-right text-gray-600">{fmtCategoryValue(r.budget, r.unit)}</td>
                    <td className="px-3 py-2 text-right text-gray-900">{fmtCategoryValue(r.actual, r.unit)}</td>
                    <td className="px-3 py-2 text-right text-gray-600">{r.variance != null ? fmtCategoryValue(r.variance, r.unit) : "—"}</td>
                    <td className="px-3 py-2 text-right text-gray-600">{r.variancePercentage != null ? `${r.variancePercentage.toFixed(1)}%` : "—"}</td>
                    <td className="px-3 py-2 text-right text-gray-600">{r.achievementPercentage != null ? `${r.achievementPercentage.toFixed(0)}%` : "—"}</td>
                    <td className="px-3 py-2 text-center text-gray-500">{r.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
