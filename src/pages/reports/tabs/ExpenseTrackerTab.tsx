import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { Pagination, usePagination } from "@/design";

/**
 * Recorded shop expenses by type, and what they consume of revenue.
 *
 * Extracted from Report.tsx as part of breaking up a 4,254-line component.
 * Chosen by measurement: it referenced 4 values from the
 * parent scope, now its props. The characterisation suite in
 * Report.characterisation.test.tsx is what verifies the move changed nothing.
 */

interface ExpenseTrackerTabProps {
  totalRevenue: any;
  localTotalExpenses: any;
  expenseByType: any;
  expenses: any[];
}

export default function ExpenseTrackerTab({ totalRevenue, localTotalExpenses, expenseByType, expenses }: ExpenseTrackerTabProps) {
  const expensePager = usePagination(expenses, 10);
  return (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
              <div className="rounded-xl border border-red-100 bg-red-50/60 p-4">
                <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500">
                  Total Expenses
                </p>
                <p className="mt-2 text-[22px] font-bold text-red-700">
                  ₹{localTotalExpenses.toLocaleString("en-IN")}
                </p>
                <p className="mt-1 text-[11px] text-gray-500">
                  {expenses.length} entries
                </p>
              </div>
              <div className="rounded-xl border border-orange-100 bg-orange-50/60 p-4">
                <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500">
                  Expense Categories
                </p>
                <p className="mt-2 text-[22px] font-bold text-orange-700">
                  {Object.keys(expenseByType).length}
                </p>
                <p className="mt-1 text-[11px] text-gray-500">Distinct types</p>
              </div>
              <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4">
                <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500">
                  Avg per Entry
                </p>
                <p className="mt-2 text-[22px] font-bold text-blue-700">
                  ₹
                  {expenses.length
                    ? Math.round(
                        localTotalExpenses / expenses.length,
                      ).toLocaleString("en-IN")
                    : 0}
                </p>
                <p className="mt-1 text-[11px] text-gray-500">
                  Per expense logged
                </p>
              </div>
              <div className="rounded-xl border border-gray-200 bg-gray-50/60 p-4">
                <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500">
                  Expense / Revenue
                </p>
                <p className="mt-2 text-[22px] font-bold text-gray-900">
                  {totalRevenue > 0
                    ? ((localTotalExpenses / totalRevenue) * 100).toFixed(1)
                    : 0}
                  %
                </p>
                <p className="mt-1 text-[11px] text-gray-500">Cost ratio</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
              {/* EXPENSE BY TYPE */}
              <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="border-b border-gray-100 px-4 py-3">
                  <h3 className="text-[15px] font-bold text-gray-900">
                    Expense by Category
                  </h3>
                </div>
                {Object.keys(expenseByType).length > 0 ? (
                  <div className="p-3">
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart
                        data={Object.entries(expenseByType).map(([k, v]) => ({
                          type: k,
                          amount: v,
                        }))}
                        layout="vertical"
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          horizontal={false}
                          stroke="#f1f5f9"
                        />
                        <XAxis
                          type="number"
                          tick={{ fontSize: 10, fill: "#6b7280" }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          dataKey="type"
                          type="category"
                          tick={{ fontSize: 10, fill: "#6b7280" }}
                          axisLine={false}
                          tickLine={false}
                          width={90}
                        />
                        <Tooltip
                          formatter={(v: any) =>
                            `₹${Number(v).toLocaleString("en-IN")}`
                          }
                        />
                        <Bar
                          dataKey="amount"
                          fill="#ef4444"
                          radius={[0, 4, 4, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="flex h-[220px] items-center justify-center text-[12px] text-gray-400">
                    No expense data found
                  </div>
                )}
              </div>

              {/* EXPENSE LIST */}
              <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="border-b border-gray-100 px-4 py-3">
                  <h3 className="text-[15px] font-bold text-gray-900">
                    Recent Expenses
                  </h3>
                </div>
                <div className="divide-y divide-gray-50">
                  {expensePager.pageRows.map((e: any) => (
                    <div
                      key={e.id}
                      className="flex items-center justify-between px-4 py-2.5"
                    >
                      <div>
                        <p className="text-[13px] font-semibold text-gray-900">
                          {e.title}
                        </p>
                        <div className="mt-0.5 flex items-center gap-2">
                          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[9px] font-medium text-gray-600">
                            {e.expenseType}
                          </span>
                          <span className="text-[10px] text-gray-400">
                            {new Date(
                              e.expenseDate || e.createdAt,
                            ).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <p className="text-[14px] font-bold text-red-600">
                        ₹{Number(e.amount).toLocaleString("en-IN")}
                      </p>
                    </div>
                  ))}
                  {expenses.length === 0 && (
                    <div className="py-10 text-center text-[12px] text-gray-400">
                      No expenses logged for this period
                    </div>
                  )}
                </div>
                <Pagination
                  page={expensePager.page}
                  totalPages={expensePager.totalPages}
                  onPageChange={expensePager.setPage}
                  pageSize={expensePager.pageSize}
                  onPageSizeChange={expensePager.setPageSize}
                  range={{ from: expensePager.from, to: expensePager.to, total: expensePager.total, noun: "expenses" }}
                />
              </div>
            </div>
          </div>
  );
}
