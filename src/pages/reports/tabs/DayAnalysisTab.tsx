import MobileTableCards from "@/components/common/MobileTableCards";

/**
 * Day-of-week performance — which days carry revenue and orders, and how each compares to the weekly average.
 *
 * Extracted from Report.tsx as part of breaking up a 4,254-line component.
 * Chosen by measurement: it referenced 2 values from the
 * parent scope, now its props. The characterisation suite in
 * Report.characterisation.test.tsx is what verifies the move changed nothing.
 */

interface DayAnalysisTabProps {
  dailyData: any;
  heatmapData: any;
}

export default function DayAnalysisTab({ dailyData, heatmapData }: DayAnalysisTabProps) {
  return (
          <div className="space-y-3">
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-100 px-4 py-3">
                <h3 className="text-[15px] font-bold text-gray-900">
                  Day of Week — Full Breakdown
                </h3>
                <p className="mt-0.5 text-[11px] text-gray-500">
                  Revenue, order count and avg bill for each day of the week
                </p>
              </div>
              <div className="overflow-x-auto">
                <MobileTableCards>
                <table className="min-w-full text-[12px]">
                  <thead className="bg-gray-50">
                    <tr className="border-b border-gray-100">
                      {[
                        "Day",
                        "Revenue",
                        "Orders",
                        "Avg Bill",
                        "Revenue Share",
                        "Performance",
                      ].map((h) => (
                        <th
                          key={h}
                          className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wide text-gray-400"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(heatmapData?.dailyData || []).map((d: any) => {
                      const totalRev =
                        (heatmapData?.dailyData || []).reduce(
                          (s: number, x: any) => s + x.revenue,
                          0,
                        ) || 1;
                      const pct = Math.round((d.revenue / totalRev) * 100);
                      const isTop =
                        d.revenue ===
                        Math.max(
                          ...(heatmapData?.dailyData || []).map(
                            (x: any) => x.revenue,
                          ),
                        );
                      return (
                        <tr
                          key={d.day}
                          className={`border-b border-gray-50 hover:bg-gray-50/60 ${isTop ? "bg-emerald-50/30" : ""}`}
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              {isTop && (
                                <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[8px] font-bold text-emerald-700">
                                  BEST
                                </span>
                              )}
                              <p className="font-bold text-gray-900">
                                {d.name}
                              </p>
                            </div>
                          </td>
                          <td className="px-4 py-3 font-bold text-gray-900">
                            ₹{d.revenue.toLocaleString("en-IN")}
                          </td>
                          <td className="px-4 py-3 text-gray-700">
                            {d.orders}
                          </td>
                          <td className="px-4 py-3 text-gray-600">
                            ₹{d.avgBill.toLocaleString("en-IN")}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="h-2 w-28 overflow-hidden rounded-full bg-gray-100">
                                <div
                                  className="h-full rounded-full bg-[#b10000]"
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                              <span className="text-[11px] font-semibold text-gray-600">
                                {pct}%
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${d.revenue === 0 ? "bg-gray-100 text-gray-400" : pct >= 20 ? "bg-emerald-50 text-emerald-600" : pct >= 12 ? "bg-blue-50 text-blue-600" : "bg-gray-100 text-gray-500"}`}
                            >
                              {d.revenue === 0
                                ? "No Data"
                                : pct >= 20
                                  ? "Peak Day"
                                  : pct >= 12
                                    ? "Busy"
                                    : "Slow Day"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                    {!heatmapData?.dailyData?.length && (
                      <tr>
                        <td
                          colSpan={6}
                          className="py-10 text-center text-[12px] text-gray-400"
                        >
                          No day analysis data for this period
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
                </MobileTableCards>
              </div>
            </div>
          </div>
  );
}
