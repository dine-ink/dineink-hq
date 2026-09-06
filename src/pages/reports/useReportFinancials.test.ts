import { describe, expect, it } from "vitest";
import { renderHook } from "@testing-library/react";
import { useReportFinancials } from "./useReportFinancials";

/**
 * The arithmetic behind the Reports page, tested without rendering it.
 *
 * That is the point of lifting these out: they were seventeen `const`s inside a
 * 4,000-line component, reachable only by mounting the whole page with nine
 * mocked requests. The numbers are what people file taxes and judge margins
 * from, and they had no direct test at all.
 */

const bill = (over: Record<string, unknown> = {}) => ({
  status: "PAID",
  total: 0,
  discount: 0,
  cgst: 0,
  sgst: 0,
  serviceCharge: 0,
  orderType: "DINE_IN",
  paymentMethod: "CASH",
  createdAt: "2026-03-02T10:00:00.000Z",
  ...over,
});

const run = (bills: any[], expenses: any[] = [], finance: any = null) =>
  renderHook(() => useReportFinancials(bills, expenses, finance)).result.current;

describe("useReportFinancials — totals", () => {
  it("sums revenue, discount and GST across bills", () => {
    const r = run([
      bill({ total: 1000, discount: 50, cgst: 25, sgst: 25, serviceCharge: 10 }),
      bill({ total: 500, discount: 0, cgst: 10, sgst: 10, serviceCharge: 0 }),
    ]);
    expect(r.totalRevenue).toBe(1500);
    expect(r.totalDiscount).toBe(50);
    expect(r.totalCGST).toBe(35);
    expect(r.totalSGST).toBe(35);
    expect(r.totalGST).toBe(70);
    expect(r.totalServiceCharge).toBe(10);
  });

  it("treats null and undefined amounts as zero", () => {
    const r = run([bill({ total: null }), bill({ total: undefined }), bill({ total: 100 })]);
    expect(r.totalRevenue).toBe(100);
  });

  it("still yields NaN for a non-numeric amount, as the original did", () => {
    // `Number(x || 0)` applies the fallback to the raw value, so a truthy
    // non-numeric string reaches Number() and poisons the total. Preserved
    // rather than fixed: this extraction's contract is that the numbers do not
    // change, and the case is unreachable while the API sends numbers or
    // numeric strings. Worth fixing on its own, not smuggled into a refactor.
    const r = run([bill({ total: "abc" }), bill({ total: 100 })]);
    expect(Number.isNaN(r.totalRevenue)).toBe(true);
  });

  it("returns zeroes for no bills at all", () => {
    const r = run([]);
    expect(r.totalRevenue).toBe(0);
    expect(r.profitMargin).toBe("0");
    expect(r.dailyData).toEqual([]);
  });
});

describe("useReportFinancials — expenses and profit", () => {
  it("falls back to the raw expense sum until the finance engine responds", () => {
    const r = run([bill({ total: 1000, cgst: 50, sgst: 50 })], [{ amount: 200 }, { amount: 50 }]);
    expect(r.localTotalExpenses).toBe(250);
    expect(r.totalExpenses).toBe(250);
    // revenue - GST - local expenses
    expect(r.netProfit).toBe(1000 - 100 - 250);
  });

  it("prefers the finance engine's figures once they arrive", () => {
    const finance = {
      current: {
        foodCost: 100,
        labourCost: 200,
        fixedExpenses: 50,
        variableExpenses: 25,
        financeCost: 25,
        netProfit: 600,
      },
    };
    const r = run([bill({ total: 1000 })], [{ amount: 9999 }], finance);
    // The engine's components, not the raw ShopExpense sum.
    expect(r.totalExpenses).toBe(400);
    expect(r.netProfit).toBe(600);
    // The local sum stays available for the fallback path's own display.
    expect(r.localTotalExpenses).toBe(9999);
  });

  it("formats profit margin to one decimal, as a string", () => {
    // Rendered directly, so a number here would print 93.33333333333333%.
    const r = run([bill({ total: 1500, cgst: 50, sgst: 50 })], []);
    expect(r.profitMargin).toBe("93.3");
    expect(typeof r.profitMargin).toBe("string");
  });

  it("does not divide by zero when there is no revenue", () => {
    const r = run([], [{ amount: 500 }]);
    expect(r.profitMargin).toBe("0");
  });
});

describe("useReportFinancials — breakdowns", () => {
  it("splits bills by payment status", () => {
    const r = run([
      bill({ status: "PAID", total: 100 }),
      bill({ status: "UNPAID", total: 50 }),
      bill({ status: "PARTIAL", total: 25 }),
      bill({ status: "CANCELLED", total: 10 }),
    ]);
    expect(r.paidBills).toHaveLength(1);
    // Partial counts as unpaid; cancelled counts as neither.
    expect(r.unpaidBills).toHaveLength(2);
  });

  it("splits revenue by order type and drops empty slices from the pie", () => {
    const r = run([
      bill({ orderType: "DINE_IN", total: 300 }),
      bill({ orderType: "DELIVERY", total: 200 }),
    ]);
    expect(r.dineInRevenue).toBe(300);
    expect(r.deliveryRevenue).toBe(200);
    expect(r.takeawayRevenue).toBe(0);
    expect(r.orderTypePieData.map((d) => d.name)).toEqual(["Dine In", "Delivery"]);
  });

  it("groups by payment method, with a bucket for bills that carry none", () => {
    const r = run([
      bill({ paymentMethod: "CASH", total: 100 }),
      bill({ paymentMethod: "CASH", total: 50 }),
      bill({ paymentMethod: null, total: 25 }),
    ]);
    expect(r.paymentBreakdown.CASH).toEqual({ count: 2, amount: 150 });
    expect(r.paymentBreakdown.Unknown).toEqual({ count: 1, amount: 25 });
  });

  it("groups daily revenue by date and returns it in chronological order", () => {
    const r = run([
      bill({ createdAt: "2026-03-05T10:00:00.000Z", total: 100 }),
      bill({ createdAt: "2026-03-02T10:00:00.000Z", total: 200, discount: 20 }),
      bill({ createdAt: "2026-03-02T18:00:00.000Z", total: 50 }),
    ]);
    expect(r.dailyData.map((d: any) => d.date)).toEqual(["02/03", "05/03"]);
    expect(r.dailyData[0]).toMatchObject({ revenue: 250, bills: 2, discount: 20 });
  });

  it("groups expenses by type, bucketing untyped ones as Other", () => {
    const r = run([], [
      { expenseType: "Rent", amount: 1000 },
      { expenseType: "Rent", amount: 500 },
      { amount: 75 },
    ]);
    expect(r.expenseByType).toEqual({ Rent: 1500, Other: 75 });
  });
});
