import { useMemo } from "react";
import dayjs from "dayjs";

/**
 * Every figure the Reports page derives from its raw bills, expenses and the
 * finance engine's summary.
 *
 * These were seventeen `const`s in the middle of Report.tsx, which is why the
 * last five tabs could not be extracted the way the first seven were: unlike
 * Stock Lifecycle or Table Analytics, they do not read their own data — they
 * read numbers computed once at the top of a 4,000-line component. Moving a
 * tab out meant either duplicating the arithmetic or threading a dozen props
 * through it.
 *
 * As a hook, the arithmetic has one home and each tab takes the handful of
 * figures it actually uses. It is deliberately pure: no fetching, no state, no
 * effects — the page still owns loading, and this only shapes what it loaded.
 * That is also what makes it testable without rendering anything.
 */

export interface FinanceSummaryCurrent {
  foodCost: number;
  labourCost: number;
  fixedExpenses: number;
  variableExpenses: number;
  financeCost: number;
  netProfit: number;
  [key: string]: unknown;
}

export interface ReportFinancials {
  /**
   * The finance engine's own summary for the period, passed through rather than
   * hidden: the P&L tab reads its individual cost lines directly, and its
   * absence is what selects the fallback arithmetic below.
   */
  fin: FinanceSummaryCurrent | undefined;
  totalRevenue: number;
  totalDiscount: number;
  totalCGST: number;
  totalSGST: number;
  totalGST: number;
  totalServiceCharge: number;
  localTotalExpenses: number;
  totalExpenses: number;
  netProfit: number;
  /**
   * A pre-formatted string, not a number — `(x).toFixed(1)`, or "0" when there
   * is no revenue. It is rendered directly, so returning a number here would
   * print 93.33333333333333% where the page shows 93.3%.
   */
  profitMargin: string;
  paidBills: any[];
  unpaidBills: any[];
  dineInRevenue: number;
  takeawayRevenue: number;
  deliveryRevenue: number;
  paymentBreakdown: Record<string, { count: number; amount: number }>;
  dailyData: any[];
  expenseByType: Record<string, number>;
  orderTypePieData: { name: string; value: number }[];
}

const sum = (rows: any[], field: string) =>
  rows.reduce((total, row) => total + Number(row?.[field] || 0), 0);

const revenueForOrderType = (bills: any[], orderType: string) =>
  sum(bills.filter((b) => b.orderType === orderType), "total");

export function useReportFinancials(
  bills: any[],
  expenses: any[],
  financeSummary: { current?: FinanceSummaryCurrent } | null,
): ReportFinancials {
  return useMemo(() => {
    const totalRevenue = sum(bills, "total");
    const totalDiscount = sum(bills, "discount");
    const totalCGST = sum(bills, "cgst");
    const totalSGST = sum(bills, "sgst");
    const totalGST = totalCGST + totalSGST;
    const totalServiceCharge = sum(bills, "serviceCharge");

    /**
     * Canonical figures from the shared finance engine (finance.formulas.ts) —
     * the same numbers Dashboard, Insights, Branch Comparison and the exports
     * already show. The local estimate below is a raw ShopExpense sum with no
     * food or labour cost in it, and stands in only until that fetch resolves.
     */
    const fin = financeSummary?.current;
    const localTotalExpenses = sum(expenses, "amount");
    const totalExpenses = fin
      ? fin.foodCost + fin.labourCost + fin.fixedExpenses + fin.variableExpenses + fin.financeCost
      : localTotalExpenses;
    const netProfit = fin ? fin.netProfit : totalRevenue - totalGST - localTotalExpenses;
    const profitMargin =
      totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : "0";

    const dineInRevenue = revenueForOrderType(bills, "DINE_IN");
    const takeawayRevenue = revenueForOrderType(bills, "TAKEAWAY");
    const deliveryRevenue = revenueForOrderType(bills, "DELIVERY");

    const paymentBreakdown = bills.reduce((acc: any, b) => {
      const method = b.paymentMethod || "Unknown";
      if (!acc[method]) acc[method] = { count: 0, amount: 0 };
      acc[method].count++;
      acc[method].amount += Number(b.total || 0);
      return acc;
    }, {});

    const dailyRevenue = bills.reduce((acc: any, b) => {
      const date = dayjs(b.createdAt).format("DD/MM");
      if (!acc[date]) acc[date] = { date, revenue: 0, bills: 0, discount: 0 };
      acc[date].revenue += Number(b.total || 0);
      acc[date].bills++;
      acc[date].discount += Number(b.discount || 0);
      return acc;
    }, {});
    const dailyData = Object.values(dailyRevenue).sort(
      (a: any, b: any) => dayjs(a.date, "DD/MM").valueOf() - dayjs(b.date, "DD/MM").valueOf(),
    );

    const expenseByType = expenses.reduce((acc: any, e) => {
      const type = e.expenseType || "Other";
      if (!acc[type]) acc[type] = 0;
      acc[type] += Number(e.amount || 0);
      return acc;
    }, {});

    const orderTypePieData = [
      { name: "Dine In", value: dineInRevenue },
      { name: "Takeaway", value: takeawayRevenue },
      { name: "Delivery", value: deliveryRevenue },
    ].filter((d) => d.value > 0);

    return {
      fin,
      totalRevenue, totalDiscount, totalCGST, totalSGST, totalGST, totalServiceCharge,
      localTotalExpenses, totalExpenses, netProfit, profitMargin,
      paidBills: bills.filter((b) => b.status === "PAID"),
      unpaidBills: bills.filter((b) => b.status === "UNPAID" || b.status === "PARTIAL"),
      dineInRevenue, takeawayRevenue, deliveryRevenue,
      paymentBreakdown, dailyData, expenseByType, orderTypePieData,
    };
  }, [bills, expenses, financeSummary]);
}
