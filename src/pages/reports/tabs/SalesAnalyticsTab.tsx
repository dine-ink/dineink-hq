import MobileTableCards from "@/components/common/MobileTableCards";

/**
 * Sales mix — paid versus outstanding, revenue by order type, and the payment-method split.
 *
 * Extracted from Report.tsx as part of breaking up a 4,254-line component.
 * Chosen by measurement: it referenced 8 values from the
 * parent scope, now its props. The characterisation suite in
 * Report.characterisation.test.tsx is what verifies the move changed nothing.
 */

interface SalesAnalyticsTabProps {
  totalRevenue: any;
  paidBills: any[];
  unpaidBills: any[];
  dineInRevenue: any;
  takeawayRevenue: any;
  deliveryRevenue: any;
  paymentBreakdown: any;
  bills: any[];
}

export default function SalesAnalyticsTab({ totalRevenue, paidBills, unpaidBills, dineInRevenue, takeawayRevenue, deliveryRevenue, paymentBreakdown, bills }: SalesAnalyticsTabProps) {
  return (
          <div className="space-y-3">
            {/* PAYMENT METHOD BREAKDOWN */}
            <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
              <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="border-b border-gray-100 px-4 py-3">
                  <h3 className="text-[15px] font-bold text-gray-900">
                    Payment Method Revenue
                  </h3>
                </div>
                <div className="divide-y divide-gray-50">
                  {Object.entries(paymentBreakdown).map(
                    ([method, data]: any) => {
                      const pct =
                        totalRevenue > 0
                          ? Math.round((data.amount / totalRevenue) * 100)
                          : 0;
                      return (
                        <div key={method} className="px-4 py-3">
                          <div className="flex items-center justify-between">
                            <p className="text-[13px] font-semibold text-gray-900">
                              {method}
                            </p>
                            <div className="text-right">
                              <p className="text-[13px] font-bold text-gray-900">
                                ₹{data.amount.toLocaleString("en-IN")}
                              </p>
                              <p className="text-[10px] text-gray-400">
                                {data.count} bills
                              </p>
                            </div>
                          </div>
                          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-gray-100">
                            <div
                              className="h-full rounded-full bg-[#b10000] transition-all"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <p className="mt-1 text-[10px] text-gray-400">
                            {pct}% of total revenue
                          </p>
                        </div>
                      );
                    },
                  )}
                  {Object.keys(paymentBreakdown).length === 0 && (
                    <div className="py-10 text-center text-[12px] text-gray-400">
                      No payment data for this period
                    </div>
                  )}
                </div>
              </div>

              {/* ORDER TYPE SPLIT */}
              <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="border-b border-gray-100 px-4 py-3">
                  <h3 className="text-[15px] font-bold text-gray-900">
                    Order Channel Performance
                  </h3>
                </div>
                <div className="space-y-3 p-4">
                  {[
                    {
                      label: "Dine In",
                      value: dineInRevenue,
                      count: bills.filter((b) => b.orderType === "DINE_IN")
                        .length,
                      color: "text-red-600",
                      bg: "bg-[#b10000]",
                    },
                    {
                      label: "Takeaway",
                      value: takeawayRevenue,
                      count: bills.filter((b) => b.orderType === "TAKEAWAY")
                        .length,
                      color: "text-orange-600",
                      bg: "bg-orange-500",
                    },
                    {
                      label: "Delivery",
                      value: deliveryRevenue,
                      count: bills.filter((b) => b.orderType === "DELIVERY")
                        .length,
                      color: "text-blue-600",
                      bg: "bg-blue-500",
                    },
                  ].map((row) => {
                    const pct =
                      totalRevenue > 0
                        ? Math.round((row.value / totalRevenue) * 100)
                        : 0;
                    return (
                      <div key={row.label}>
                        <div className="flex items-center justify-between">
                          <p className="text-[13px] font-semibold text-gray-900">
                            {row.label}
                          </p>
                          <p className={`text-[13px] font-bold ${row.color}`}>
                            ₹{row.value.toLocaleString("en-IN")}{" "}
                            <span className="text-[10px] text-gray-400">
                              ({row.count} bills)
                            </span>
                          </p>
                        </div>
                        <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-gray-100">
                          <div
                            className={`h-full rounded-full ${row.bg} transition-all`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <p className="mt-0.5 text-[10px] text-gray-400">
                          {pct}% of revenue
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* BILLS SUMMARY */}
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-100 px-4 py-3 flex items-center justify-between">
                <div>
                  <h3 className="text-[15px] font-bold text-gray-900">
                    Bills Summary
                  </h3>
                  <p className="mt-0.5 text-[11px] text-gray-500">
                    Payment status breakdown
                  </p>
                </div>
                <div className="flex gap-3">
                  <div className="rounded-lg bg-emerald-50 px-3 py-2 text-center">
                    <p className="text-[11px] font-semibold text-emerald-700">
                      {paidBills.length} Paid
                    </p>
                    <p className="text-[10px] text-gray-400">
                      ₹
                      {paidBills
                        .reduce((s, b) => s + Number(b.total || 0), 0)
                        .toLocaleString("en-IN")}
                    </p>
                  </div>
                  <div className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-center">
                    <p className="text-[11px] font-semibold text-red-700">
                      {unpaidBills.length} Unpaid
                    </p>
                    <p className="text-[10px] text-gray-400">
                      ₹
                      {unpaidBills
                        .reduce((s, b) => s + Number(b.total || 0), 0)
                        .toLocaleString("en-IN")}
                    </p>
                  </div>
                </div>
              </div>
              <div className="overflow-x-auto">
                <MobileTableCards>
                <table className="min-w-full text-[12px]">
                  <thead className="bg-gray-50">
                    <tr className="border-b border-gray-100">
                      {[
                        "Bill No",
                        "Customer",
                        "Order Type",
                        "Payment",
                        "Subtotal",
                        "GST",
                        "Discount",
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
                    {bills.slice(0, 15).map((b: any) => (
                      <tr
                        key={b.id}
                        className="border-b border-gray-50 hover:bg-gray-50/60"
                      >
                        <td className="px-4 py-2 font-semibold text-gray-900">
                          {b.billNo}
                        </td>
                        <td className="px-4 py-2 text-gray-600">
                          {b.customer?.name || "Guest"}
                        </td>
                        <td className="px-4 py-2">
                          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-700">
                            {b.orderType}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-gray-600">
                          {b.paymentMethod}
                        </td>
                        <td className="px-4 py-2 text-gray-700">
                          ₹{Number(b.subtotal || 0).toLocaleString("en-IN")}
                        </td>
                        <td className="px-4 py-2 text-red-600">
                          ₹
                          {(
                            Number(b.cgst || 0) + Number(b.sgst || 0)
                          ).toLocaleString("en-IN")}
                        </td>
                        <td className="px-4 py-2 text-orange-600">
                          {Number(b.discount || 0) > 0
                            ? `-₹${Number(b.discount).toLocaleString("en-IN")}`
                            : "-"}
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
                          No bills for this period
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
