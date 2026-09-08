import {
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
} from "recharts";
import MobileTableCards from "@/components/common/MobileTableCards";
import { chartPalette } from "@/design";

// Same palette the parent used; the pie slices are coloured from it by index.
const COLORS = chartPalette;

/**
 * Profit and loss for the period — revenue, taxes, cost lines and the resulting margin.
 *
 * Extracted from Report.tsx as part of breaking up a 4,254-line component.
 * Chosen by measurement: it referenced 18 values from the
 * parent scope, now its props. The characterisation suite in
 * Report.characterisation.test.tsx is what verifies the move changed nothing.
 */

interface ProfitLossTabProps {
  fin: any;
  totalRevenue: any;
  totalDiscount: any;
  totalCGST: any;
  totalSGST: any;
  totalGST: any;
  totalServiceCharge: any;
  totalExpenses: any;
  netProfit: any;
  profitMargin: any;
  paidBills: any[];
  dailyData: any[];
  expenseByType: any;
  orderTypePieData: any[];
  expenses: any[];
}

export default function ProfitLossTab({ fin, totalRevenue, totalDiscount, totalCGST, totalSGST, totalGST, totalServiceCharge, totalExpenses, netProfit, profitMargin, paidBills, dailyData, expenseByType, orderTypePieData, expenses }: ProfitLossTabProps) {
  return (
          <div className="space-y-3">
            {/* TOP KPIs */}
            <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
              {[
                {
                  label: "Total Revenue",
                  value: `₹${totalRevenue.toLocaleString("en-IN")}`,
                  sub: `${paidBills.length} paid bills`,
                  color: "emerald",
                  badge: "+revenue",
                },
                {
                  label: "Total Expenses",
                  value: `₹${Math.round(totalExpenses).toLocaleString("en-IN")}`,
                  sub: fin
                    ? "food + labour + fixed + variable + finance cost"
                    : `${expenses.length} expense entries`,
                  color: "red",
                  badge: "outflow",
                },
                {
                  label: "GST Collected",
                  value: `₹${totalGST.toLocaleString("en-IN")}`,
                  sub: `CGST ₹${totalCGST.toLocaleString("en-IN")} + SGST ₹${totalSGST.toLocaleString("en-IN")}`,
                  color: "blue",
                  badge: "tax",
                },
                {
                  label: "Net Profit",
                  value: `₹${netProfit.toLocaleString("en-IN")}`,
                  sub: `${profitMargin}% margin`,
                  color: netProfit >= 0 ? "emerald" : "red",
                  badge: `${profitMargin}%`,
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className={`rounded-xl border p-4 ${item.color === "emerald" ? "border-emerald-100 bg-emerald-50/60" : item.color === "red" ? "border-red-100 bg-red-50/60" : "border-blue-100 bg-blue-50/60"}`}
                >
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-500">
                    {item.label}
                  </p>
                  <p
                    className={`mt-2 text-[22px] font-bold tracking-tight ${item.color === "emerald" ? "text-emerald-700" : item.color === "red" ? "text-red-700" : "text-blue-700"}`}
                  >
                    {item.value}
                  </p>
                  <p className="mt-1 text-[11px] text-gray-500">{item.sub}</p>
                </div>
              ))}
            </div>

            {/* P&L TABLE */}
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-100 px-4 py-3">
                <h3 className="text-[15px] font-bold text-gray-900">
                  Income & Expenditure Statement
                </h3>
                <p className="mt-0.5 text-[11px] text-gray-500">
                  Detailed breakdown of revenue and costs
                </p>
              </div>
              <div className="p-4">
                <MobileTableCards>
                <table className="w-full text-sm">
                  <tbody>
                    <tr className="border-b border-gray-100">
                      <td
                        colSpan={2}
                        className="py-2 text-[11px] font-bold uppercase tracking-wide text-gray-400"
                      >
                        REVENUE
                      </td>
                    </tr>
                    {[
                      {
                        label: "Gross Revenue (Billed)",
                        value: totalRevenue + totalDiscount,
                        positive: true,
                      },
                      {
                        label: "(-) Discounts Given",
                        value: -totalDiscount,
                        positive: false,
                      },
                      {
                        label: "Net Revenue",
                        value: totalRevenue,
                        positive: true,
                        bold: true,
                      },
                      {
                        label: "Service Charges Collected",
                        value: totalServiceCharge,
                        positive: true,
                      },
                    ].map((row) => (
                      <tr key={row.label} className="border-b border-gray-50">
                        <td
                          className={`py-2 pl-4 text-[13px] ${row.bold ? "font-bold text-gray-900" : "text-gray-600"}`}
                        >
                          {row.label}
                        </td>
                        <td
                          className={`py-2 pr-4 text-right text-[13px] font-semibold ${row.positive ? "text-emerald-600" : "text-red-600"}`}
                        >
                          {row.value < 0
                            ? `-₹${Math.abs(row.value).toLocaleString("en-IN")}`
                            : `₹${row.value.toLocaleString("en-IN")}`}
                        </td>
                      </tr>
                    ))}
                    <tr className="border-b border-gray-100">
                      <td
                        colSpan={2}
                        className="pb-1 pt-4 text-[11px] font-bold uppercase tracking-wide text-gray-400"
                      >
                        TAX DEDUCTIONS
                      </td>
                    </tr>
                    <tr>
                      <td
                        colSpan={2}
                        className="pb-2 text-[10px] italic text-gray-400"
                      >
                        Shown for reference — GST collected is held for the
                        government, not the restaurant's own expense, so it
                        isn't subtracted from Net Profit below (matching the
                        Finance Engine used across the app).
                      </td>
                    </tr>
                    {[
                      { label: "CGST", value: -totalCGST },
                      { label: "SGST", value: -totalSGST },
                      { label: "Total GST", value: -totalGST, bold: true },
                    ].map((row) => (
                      <tr key={row.label} className="border-b border-gray-50">
                        <td
                          className={`py-2 pl-4 text-[13px] ${row.bold ? "font-bold text-gray-900" : "text-gray-600"}`}
                        >
                          {row.label}
                        </td>
                        <td className="py-2 pr-4 text-right text-[13px] font-semibold text-red-600">
                          -₹{Math.abs(row.value).toLocaleString("en-IN")}
                        </td>
                      </tr>
                    ))}
                    <tr className="border-b border-gray-100">
                      <td
                        colSpan={2}
                        className="pb-2 pt-4 text-[11px] font-bold uppercase tracking-wide text-gray-400"
                      >
                        OPERATING EXPENSES
                      </td>
                    </tr>
                    {fin
                      ? // Canonical categories (Finance Engine) — matches
                        // Dashboard/Insights/Branch Comparison exactly. The raw
                        // ShopExpense-by-type ledger (previously shown here) is
                        // real data too, but is a different opex source than
                        // what everywhere else in the app uses to compute Net
                        // Profit — it's shown in full on the Expense Tracker
                        // tab instead of being duplicated (and mismatched) here.
                        [
                          { label: "Food Cost", value: fin.foodCost },
                          { label: "Labour Cost", value: fin.labourCost },
                          {
                            label: "Fixed Expenses (rent, utilities, etc.)",
                            value: fin.fixedExpenses,
                          },
                          {
                            label:
                              "Variable Expenses (marketing, packaging, etc.)",
                            value: fin.variableExpenses,
                          },
                          {
                            label: "Finance Cost (loan EMI, interest, etc.)",
                            value: fin.financeCost,
                          },
                        ].map((r) => (
                          <tr key={r.label} className="border-b border-gray-50">
                            <td className="py-2 pl-4 text-[13px] text-gray-600">
                              {r.label}
                            </td>
                            <td className="py-2 pr-4 text-right text-[13px] font-semibold text-red-600">
                              -₹{Math.round(r.value).toLocaleString("en-IN")}
                            </td>
                          </tr>
                        ))
                      : Object.entries(expenseByType).map(
                          ([type, amount]: any) => (
                            <tr key={type} className="border-b border-gray-50">
                              <td className="py-2 pl-4 text-[13px] text-gray-600">
                                {type}
                              </td>
                              <td className="py-2 pr-4 text-right text-[13px] font-semibold text-red-600">
                                -₹{Number(amount).toLocaleString("en-IN")}
                              </td>
                            </tr>
                          ),
                        )}
                    <tr className="border-b border-gray-100">
                      <td className="py-2 pl-4 text-[13px] font-bold text-gray-900">
                        Total Expenses
                      </td>
                      <td className="py-2 pr-4 text-right text-[13px] font-bold text-red-600">
                        -₹{Math.round(totalExpenses).toLocaleString("en-IN")}
                      </td>
                    </tr>
                    <tr
                      className={`${netProfit >= 0 ? "bg-emerald-50" : "bg-red-50"} rounded-lg`}
                    >
                      <td className="py-3 pl-4 text-[15px] font-black text-gray-900">
                        NET PROFIT / LOSS
                      </td>
                      <td
                        className={`py-3 pr-4 text-right text-[15px] font-black ${netProfit >= 0 ? "text-emerald-600" : "text-red-600"}`}
                      >
                        {netProfit >= 0 ? "+" : ""}₹
                        {netProfit.toLocaleString("en-IN")}
                      </td>
                    </tr>
                  </tbody>
                </table>
                </MobileTableCards>
              </div>
            </div>

            {/* REVENUE TREND CHART */}
            <div className="grid grid-cols-1 gap-3 xl:grid-cols-3">
              <div className="xl:col-span-2 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="border-b border-gray-100 px-4 py-3">
                  <h3 className="text-[15px] font-bold text-gray-900">
                    Daily Revenue vs Expenses
                  </h3>
                </div>
                <div className="p-3">
                  {dailyData.length > 1 ? (
                    <ResponsiveContainer width="100%" height={200}>
                      <AreaChart data={dailyData}>
                        <defs>
                          <linearGradient
                            id="revGrad"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="5%"
                              stopColor="#ef4444"
                              stopOpacity={0.15}
                            />
                            <stop
                              offset="95%"
                              stopColor="#ef4444"
                              stopOpacity={0}
                            />
                          </linearGradient>
                        </defs>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          stroke="#f1f5f9"
                        />
                        <XAxis
                          dataKey="date"
                          tick={{ fontSize: 10, fill: "#6b7280" }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          tick={{ fontSize: 10, fill: "#6b7280" }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip />
                        <Area
                          type="monotone"
                          dataKey="revenue"
                          name="Revenue"
                          stroke="#ef4444"
                          strokeWidth={2}
                          fill="url(#revGrad)"
                        />
                        <Area
                          type="monotone"
                          dataKey="discount"
                          name="Discount Lost"
                          stroke="#f59e0b"
                          strokeWidth={1.5}
                          fill="none"
                          strokeDasharray="4 2"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex h-[200px] items-center justify-center text-[12px] text-gray-400">
                      Not enough data for this period
                    </div>
                  )}
                </div>
              </div>
              <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="border-b border-gray-100 px-4 py-3">
                  <h3 className="text-[15px] font-bold text-gray-900">
                    Order Type Mix
                  </h3>
                </div>
                <div className="p-3">
                  {orderTypePieData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={orderTypePieData}
                          cx="50%"
                          cy="45%"
                          innerRadius={40}
                          outerRadius={70}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {orderTypePieData.map((_, i) => (
                            <Cell key={i} fill={COLORS[i]} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(v: any) =>
                            `₹${Number(v).toLocaleString("en-IN")}`
                          }
                        />
                        <Legend
                          verticalAlign="bottom"
                          height={20}
                          iconType="circle"
                          wrapperStyle={{ fontSize: "11px" }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex h-[200px] items-center justify-center text-[12px] text-gray-400">
                      No order data
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
  );
}
