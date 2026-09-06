import MobileTableCards from "@/components/common/MobileTableCards";

/**
 * GST summary for the period, with the filing-ready export.
 *
 * Extracted from Report.tsx as part of breaking up a 4,254-line component.
 * Chosen by measurement: it referenced 7 values from the
 * parent scope, now its props. The characterisation suite in
 * Report.characterisation.test.tsx is what verifies the move changed nothing.
 */

interface TaxReportTabProps {
  totalRevenue: any;
  totalCGST: any;
  totalSGST: any;
  totalGST: any;
  bills: any[];
  downloadGstFiling: any;
  downloadingGst: any;
}

export default function TaxReportTab({ totalRevenue, totalCGST, totalSGST, totalGST, bills, downloadGstFiling, downloadingGst }: TaxReportTabProps) {
  return (
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
                <MobileTableCards>
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
                </MobileTableCards>
              </div>
            </div>
          </div>
  );
}
