import MobileTableCards from "@/components/common/MobileTableCards";
import { useMemo } from "react";
import { Pagination, usePagination } from "@/design";

/**
 * Discount usage — how much was given away, on which bills, and what it cost as a share of revenue.
 *
 * Extracted from Report.tsx as part of breaking up a 4,254-line component.
 * Chosen by measurement: it referenced 4 values from the
 * parent scope, now its props. The characterisation suite in
 * Report.characterisation.test.tsx is what verifies the move changed nothing.
 */

interface DiscountAnalysisTabProps {
  totalRevenue: any;
  totalDiscount: any;
  bills: any[];
}

export default function DiscountAnalysisTab({ totalRevenue, totalDiscount, bills }: DiscountAnalysisTabProps) {
  const discountedBills = useMemo(() => bills.filter((b) => Number(b.discount) > 0), [bills]);
  const discountPager = usePagination(discountedBills, 10);
  return (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
              {[
                {
                  label: "Total Discounts Given",
                  value: `₹${totalDiscount.toLocaleString("en-IN")}`,
                  sub: "Revenue you gave away",
                  color: "red",
                },
                {
                  label: "Bills with Discount",
                  value: bills.filter((b) => Number(b.discount) > 0).length,
                  sub: `out of ${bills.length} total bills`,
                  color: "orange",
                },
                {
                  label: "Avg Discount per Bill",
                  value: `₹${bills.filter((b) => Number(b.discount) > 0).length ? Math.round(totalDiscount / bills.filter((b) => Number(b.discount) > 0).length).toLocaleString("en-IN") : 0}`,
                  sub: "when discount applied",
                  color: "blue",
                },
                {
                  label: "Discount % of Revenue",
                  value: `${totalRevenue > 0 ? ((totalDiscount / (totalRevenue + totalDiscount)) * 100).toFixed(1) : 0}%`,
                  sub: "revenue lost to discounts",
                  color: "violet",
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
                    className={`mt-2 text-[20px] font-bold ${item.color === "red" ? "text-red-600" : item.color === "orange" ? "text-orange-600" : item.color === "blue" ? "text-blue-600" : "text-violet-600"}`}
                  >
                    {item.value}
                  </p>
                  <p className="mt-1 text-[11px] text-gray-500">{item.sub}</p>
                </div>
              ))}
            </div>

            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-100 px-4 py-3">
                <h3 className="text-[15px] font-bold text-gray-900">
                  Bills with Discounts Applied
                </h3>
                <p className="mt-0.5 text-[11px] text-gray-500">
                  Track every discount given — identify patterns and prevent
                  abuse
                </p>
              </div>
              <div className="overflow-x-auto">
                <MobileTableCards>
                <table className="min-w-full text-[12px]">
                  <thead className="bg-gray-50">
                    <tr className="border-b border-gray-100">
                      {[
                        "Bill No",
                        "Date",
                        "Customer",
                        "Order Type",
                        "Gross Total",
                        "Discount",
                        "Net Total",
                        "Discount %",
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
                    {discountPager.pageRows.map((b: any) => {
                        const gross =
                          Number(b.total || 0) + Number(b.discount || 0);
                        const discountPct =
                          gross > 0
                            ? ((Number(b.discount) / gross) * 100).toFixed(1)
                            : "0";
                        return (
                          <tr
                            key={b.id}
                            className="border-b border-gray-50 hover:bg-orange-50/30"
                          >
                            <td className="px-4 py-2 font-semibold text-gray-900">
                              {b.billNo}
                            </td>
                            <td className="px-4 py-2 text-gray-500">
                              {new Date(b.createdAt).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-2 text-gray-600">
                              {b.customer?.name || "Guest"}
                            </td>
                            <td className="px-4 py-2">
                              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-700">
                                {b.orderType}
                              </span>
                            </td>
                            <td className="px-4 py-2 text-gray-700">
                              ₹{gross.toLocaleString("en-IN")}
                            </td>
                            <td className="px-4 py-2 font-bold text-orange-600">
                              -₹{Number(b.discount).toLocaleString("en-IN")}
                            </td>
                            <td className="px-4 py-2 font-bold text-gray-900">
                              ₹{Number(b.total || 0).toLocaleString("en-IN")}
                            </td>
                            <td className="px-4 py-2">
                              <span
                                className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${Number(discountPct) > 20 ? "bg-red-50 text-red-700" : "bg-orange-50 text-orange-600"}`}
                              >
                                {discountPct}%
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    {bills.filter((b) => Number(b.discount) > 0).length ===
                      0 && (
                      <tr>
                        <td
                          colSpan={8}
                          className="py-10 text-center text-[12px] text-gray-400"
                        >
                          No discounts given in this period
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
                </MobileTableCards>
              </div>
              <Pagination
                page={discountPager.page}
                totalPages={discountPager.totalPages}
                onPageChange={discountPager.setPage}
                pageSize={discountPager.pageSize}
                onPageSizeChange={discountPager.setPageSize}
                range={{ from: discountPager.from, to: discountPager.to, total: discountPager.total, noun: "discounted bills" }}
              />
            </div>
          </div>
  );
}
