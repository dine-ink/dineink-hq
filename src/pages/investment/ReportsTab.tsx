import { useEffect, useState } from "react";
// @ts-ignore
import jsPDF from "jspdf";
// @ts-ignore
import autoTable from "jspdf-autotable";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { ArrowDownTrayIcon, PrinterIcon } from "@heroicons/react/24/outline";
import { useAppSelector } from "../../store";
import { fmtCategoryValue } from "./investmentCategories";

const REPORT_TYPES = [
  { key: "summary", label: "Investment Summary Report" },
  { key: "roi", label: "ROI Report" },
  { key: "npv", label: "NPV Report" },
  { key: "irr", label: "IRR Report" },
  { key: "payback", label: "Payback Report" },
  { key: "cashflow", label: "Cash Flow Report" },
  { key: "comparison", label: "Investment Comparison Report" },
];

export default function ReportsTab() {
  const { user, token } = useAppSelector((s) => s.auth);
  const API_URL = import.meta.env.VITE_API_URL;

  const [reportType, setReportType] = useState("summary");
  const [withMetrics, setWithMetrics] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [columns, setColumns] = useState<string[]>([]);
  const [rows, setRows] = useState<any[]>([]);

  useEffect(() => {
    const fetchAll = async () => {
      if (!user?.restaurantId) return;
      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/api/investments/${user.restaurantId}/with-metrics`, { headers: { Authorization: `Bearer ${token}` } });
        const json = await res.json();
        if (json.success) {
          setWithMetrics(json.data);
          setSelectedProjectId((prev) => prev ?? json.data[0]?.project.id ?? null);
        }
      } catch {
        // fetch error — silently ignored
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [user?.restaurantId]);

  useEffect(() => {
    if (withMetrics.length === 0) return;

    if (reportType === "cashflow") {
      const item = withMetrics.find((w) => w.project.id === selectedProjectId) || withMetrics[0];
      const n = item.metrics.projection.annualCashFlows.length;
      setColumns(["Start", ...Array.from({ length: n }, (_, i) => `Year ${i + 1}`)]);
      setRows([
        { label: "Annual Cash Flow", unit: "currency", values: [null, ...item.metrics.projection.annualCashFlows] },
        { label: "Cumulative Cash Flow", unit: "currency", values: item.metrics.projection.cumulativeCashFlows },
        { label: "Discounted Cash Flow", unit: "currency", values: item.metrics.projection.discountedCashFlows },
      ]);
      return;
    }

    const columnsByType: Record<string, string[]> = {
      summary: ["Branch", "Initial Investment", "ROI %", "NPV", "IRR %", "Payback (Years)", "Status"],
      comparison: ["Branch", "Initial Investment", "ROI %", "NPV", "IRR %", "Payback (Years)"],
      roi: ["ROI %", "Annualized ROI %"],
      npv: ["NPV", "Profitability Index"],
      irr: ["IRR %"],
      payback: ["Payback (Years)", "Discounted Payback (Years)"],
    };
    setColumns(columnsByType[reportType] || []);

    setRows(withMetrics.map(({ project, metrics }) => {
      const valuesByType: Record<string, (string | number)[]> = {
        summary: [
          project.branch?.name || "Restaurant-wide", fmtCategoryValue(project.initialInvestment, "currency"),
          metrics.roiPercentage != null ? `${metrics.roiPercentage.toFixed(1)}%` : "—", fmtCategoryValue(metrics.npv, "currency"),
          metrics.irrPercentage != null ? `${metrics.irrPercentage.toFixed(1)}%` : "—",
          metrics.paybackPeriodYears != null ? metrics.paybackPeriodYears.toFixed(2) : "Never", project.status,
        ],
        comparison: [
          project.branch?.name || "Restaurant-wide", fmtCategoryValue(project.initialInvestment, "currency"),
          metrics.roiPercentage != null ? `${metrics.roiPercentage.toFixed(1)}%` : "—", fmtCategoryValue(metrics.npv, "currency"),
          metrics.irrPercentage != null ? `${metrics.irrPercentage.toFixed(1)}%` : "—",
          metrics.paybackPeriodYears != null ? metrics.paybackPeriodYears.toFixed(2) : "Never",
        ],
        roi: [metrics.roiPercentage != null ? `${metrics.roiPercentage.toFixed(1)}%` : "—", metrics.annualizedRoiPercentage != null ? `${metrics.annualizedRoiPercentage.toFixed(1)}%` : "—"],
        npv: [fmtCategoryValue(metrics.npv, "currency"), metrics.profitabilityIndex != null ? metrics.profitabilityIndex.toFixed(3) : "—"],
        irr: [metrics.irrPercentage != null ? `${metrics.irrPercentage.toFixed(1)}%` : "No real root"],
        payback: [metrics.paybackPeriodYears != null ? metrics.paybackPeriodYears.toFixed(2) : "Never", metrics.discountedPaybackPeriodYears != null ? metrics.discountedPaybackPeriodYears.toFixed(2) : "Never"],
      };
      return { label: project.name, values: valuesByType[reportType] || [] };
    }));
  }, [reportType, withMetrics, selectedProjectId]);

  const reportTitle = REPORT_TYPES.find((r) => r.key === reportType)?.label || "Investment Report";
  const rowLabel = reportType === "cashflow" ? "Metric" : "Project";

  const cellValue = (v: any, unit?: string) => (v === null ? "—" : typeof v === "number" ? fmtCategoryValue(v, (unit as any) || "currency") : v);

  const handleExportPDF = () => {
    if (rows.length === 0) return;
    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    doc.setFontSize(16); doc.setTextColor(177, 0, 0); doc.text(reportTitle, 14, 16);
    autoTable(doc, {
      startY: 24,
      head: [[rowLabel, ...columns]],
      body: rows.map((r) => [r.label, ...r.values.map((v: any) => cellValue(v, r.unit))]),
      theme: "grid", headStyles: { fillColor: [177, 0, 0] }, styles: { fontSize: 9 }, margin: { left: 14, right: 14 },
    });
    doc.save(`investment-${reportType}-report.pdf`);
  };

  const handleExportExcel = async () => {
    if (rows.length === 0) return;
    const workbook = new ExcelJS.Workbook();
    const ws = workbook.addWorksheet("Investment Report");
    ws.columns = [{ width: 28 }, ...columns.map(() => ({ width: 18 }))];
    ws.addRow([reportTitle]).font = { bold: true, size: 14 };
    ws.addRow([]);
    ws.addRow([rowLabel, ...columns]).font = { bold: true };
    rows.forEach((r) => ws.addRow([r.label, ...r.values.map((v: any) => cellValue(v, r.unit))]));
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    saveAs(blob, `investment-${reportType}-report.xlsx`);
  };

  const handleExportCSV = () => {
    if (rows.length === 0) return;
    const lines: string[] = [reportTitle, "", [rowLabel, ...columns].join(",")];
    rows.forEach((r) => lines.push([`"${r.label}"`, ...r.values.map((v: any) => cellValue(v, r.unit))].join(",")));
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, `investment-${reportType}-report.csv`);
  };

  const handlePrint = () => window.print();

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between print:hidden">
        <div className="flex flex-wrap items-center gap-2">
          <select value={reportType} onChange={(e) => setReportType(e.target.value)} className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-[12px] font-semibold text-gray-700 outline-none">
            {REPORT_TYPES.map((r) => <option key={r.key} value={r.key}>{r.label}</option>)}
          </select>
          {reportType === "cashflow" && (
            <select value={selectedProjectId ?? ""} onChange={(e) => setSelectedProjectId(Number(e.target.value))} className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-[12px] font-semibold text-gray-700 outline-none">
              {withMetrics.map((w) => <option key={w.project.id} value={w.project.id}>{w.project.name}</option>)}
            </select>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={handleExportPDF} className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-[12px] font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"><ArrowDownTrayIcon className="h-3.5 w-3.5" /> PDF</button>
          <button type="button" onClick={handleExportExcel} className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-[12px] font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"><ArrowDownTrayIcon className="h-3.5 w-3.5" /> Excel</button>
          <button type="button" onClick={handleExportCSV} className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-[12px] font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"><ArrowDownTrayIcon className="h-3.5 w-3.5" /> CSV</button>
          <button type="button" onClick={handlePrint} className="flex items-center gap-1.5 rounded-xl bg-[#b10000] px-3 py-2 text-[12px] font-semibold text-white shadow-sm transition hover:bg-[#950000]"><PrinterIcon className="h-3.5 w-3.5" /> Print</button>
        </div>
      </div>

      {loading && <div className="flex h-24 items-center justify-center text-[12px] text-gray-400">Loading…</div>}

      {!loading && rows.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-[16px] font-bold text-gray-900">{reportTitle}</h3>
          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="w-full text-[12px]">
              <thead className="bg-gray-50 text-[10px] font-bold uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-4 py-2 text-left">{rowLabel}</th>
                  {columns.map((c) => <th key={c} className="px-3 py-2 text-right">{c}</th>)}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.label} className="border-t border-gray-100">
                    <td className="px-4 py-2 font-medium text-gray-700">{r.label}</td>
                    {r.values.map((v: any, i: number) => <td key={i} className="px-3 py-2 text-right text-gray-900">{cellValue(v, r.unit)}</td>)}
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
