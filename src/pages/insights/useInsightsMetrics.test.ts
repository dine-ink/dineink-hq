import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useInsightsMetrics } from "./useInsightsMetrics";

/**
 * The arithmetic behind the Insights page, tested without rendering it.
 *
 * This is the reason the hook exists. These were eighty-eight `const`s in the
 * middle of a 4,370-line component, reachable only by mounting the whole page
 * with a dozen mocked requests. They are the figures an owner judges EBITDA,
 * prime cost, break-even and cash conversion by, and none of them had a direct
 * test.
 *
 * Two conventions worth knowing before reading these:
 *
 *  - Nearly every public figure is `fm ? fm.x : localX` — prefer the shared
 *    finance engine, fall back to a client-side estimate until that fetch
 *    resolves. Both paths matter: the fallback is what the page shows for the
 *    first second of every visit, so both are tested.
 *  - contributionMarginPercentage is a fraction (0–1) here while the engine
 *    returns percentage points, so the hook divides back down. That asymmetry
 *    is deliberate and pinned below.
 *
 * The month-relative figures are tested against a frozen clock. Without one
 * they pass or fail depending on the day of the month the suite runs.
 */

const FROZEN = new Date(2026, 3, 10, 12, 0, 0); // 10 April 2026 — 30-day month

const run = (over: Partial<Parameters<typeof useInsightsMetrics>[0]> = {}) =>
  renderHook(() =>
    useInsightsMetrics({
      financeSummary: null,
      insightsData: {},
      mtdAnalytics: null,
      restockHistory: [],
      inventoryStockValue: 0,
      accountsPayable: 0,
      selectedBranch: null,
      staffData: [],
      ...over,
    }),
  ).result.current;

/** A finance-engine payload — the `fm` path. */
const engine = (over: Record<string, unknown> = {}) => ({
  current: {
    revenue: 500000,
    fixedExpenses: 100000,
    variableExpenses: 50000,
    labourCost: 125000,
    financeCost: 10000,
    foodCost: 160000,
    totalExpenses: 445000,
    ebitda: 55000,
    ebitdaPercentage: 11,
    foodCostPercentage: 32,
    primeCost: 285000,
    primeCostPercentage: 57,
    grossProfit: 340000,
    grossProfitMarginPercentage: 68,
    labourCostPercentage: 25,
    netProfit: 45000,
    contributionMarginPercentage: 58,
    breakEvenRevenue: 400000,
    breakEvenOrders: 800,
    ...over,
  },
});

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(FROZEN);
});
afterEach(() => {
  vi.useRealTimers();
});

describe("useInsightsMetrics — the finance engine takes precedence", () => {
  it("uses the engine's figures when the summary has loaded", () => {
    const r = run({ financeSummary: engine(), insightsData: { monthlyRent: 999999 } });
    expect(r.revenue).toBe(500000);
    expect(r.totalExpenses).toBe(445000);
    expect(r.effectiveFoodCost).toBe(160000);
    expect(r.netProfit).toBe(45000);
    // The huge local rent is ignored entirely once the engine has answered.
    expect(r.totalFixedExpenses).toBe(100000);
  });

  it("converts the engine's contribution margin from points back to a fraction", () => {
    // The rest of the page was written against the 0–1 convention, so the hook
    // divides rather than every display site multiplying.
    expect(run({ financeSummary: engine() }).contributionMarginPercentage).toBe(0.58);
  });

  it("falls back to the local estimate until the summary arrives", () => {
    const r = run({
      insightsData: { monthlyRent: 50000, loanEmi: 20000, internet: 2000, revenue: 300000 },
      staffData: [{ salary: 30000 }, { salary: 20000 }],
    });
    expect(r.revenue).toBe(300000);
    expect(r.totalFixedExpenses).toBe(72000);
    expect(r.totalLabourCost).toBe(50000);
  });

  it("sums salaries for the local labour cost, treating a missing one as zero", () => {
    const r = run({ staffData: [{ salary: 30000 }, {}, { salary: null }] });
    expect(r.totalLabourCost).toBe(30000);
  });
});

describe("useInsightsMetrics — targets", () => {
  it("prefers the assumptions-derived targets the engine returns", () => {
    const fs = { ...engine(), targets: { targetEbitda: 20, targetFoodCost: 30 } };
    const r = run({ financeSummary: fs, insightsData: { targetEbitda: 99 } });
    expect(r.targetEbitda).toBe(20);
    expect(r.targetFoodCost).toBe(30);
  });

  it("reads a target the engine omitted as zero rather than falling back", () => {
    // Once `targets` exists it is the source of truth — a missing field means
    // "not set", not "use the legacy value".
    const fs = { ...engine(), targets: { targetEbitda: 20 } };
    expect(run({ financeSummary: fs, insightsData: { targetFoodCost: 99 } }).targetFoodCost).toBe(0);
  });

  it("uses the legacy Insights Setup fields until the engine responds", () => {
    expect(run({ insightsData: { targetEbitda: 15 } }).targetEbitda).toBe(15);
  });
});

describe("useInsightsMetrics — setup completion", () => {
  it("is zero for an empty setup", () => {
    expect(run().setupCompletion).toBe(0);
  });

  it("counts a filled field but not one left at zero", () => {
    // 32 fields; 0, "", null and undefined all read as not filled.
    const one = run({ insightsData: { monthlyRent: 50000 } }).setupCompletion;
    const zeroed = run({ insightsData: { monthlyRent: 0, loanEmi: "" } }).setupCompletion;
    expect(one).toBe(3); // 1/32 rounded
    expect(zeroed).toBe(0);
  });

  it("counts the targets too, wherever they came from", () => {
    const fs = { ...engine(), targets: { targetEbitda: 20, targetFoodCost: 30 } };
    expect(run({ financeSummary: fs }).setupCompletion).toBe(6); // 2/32
  });
});

describe("useInsightsMetrics — break-even", () => {
  it("takes break-even straight from the engine when it has loaded", () => {
    const r = run({ financeSummary: engine(), mtdAnalytics: { totalRevenue: 200000 } });
    expect(r.breakEvenRevenue).toBe(400000);
    expect(r.breakEvenOrders).toBe(800);
    expect(r.hasBrokenEven).toBe(false);
    expect(r.pctOfBreakEvenCovered).toBe(50);
  });

  it("caps break-even coverage at 100%", () => {
    const r = run({ financeSummary: engine(), mtdAnalytics: { totalRevenue: 900000 } });
    expect(r.pctOfBreakEvenCovered).toBe(100);
    expect(r.hasBrokenEven).toBe(true);
  });

  it("computes break-even locally as fixed costs over contribution margin", () => {
    // Fixed 100k (rent) + labour 0 + finance 0; variable 0 + food 100k against
    // revenue 200k → contribution margin 50% → break-even 200k.
    const r = run({
      insightsData: { monthlyRent: 100000, revenue: 200000, manualFoodCost: 100000 },
    });
    expect(r.breakEvenRevenue).toBe(200000);
  });

  it("falls back to total expenses when contribution margin is not positive", () => {
    // Food cost exceeds revenue, so the usual division is meaningless.
    const r = run({
      insightsData: { monthlyRent: 10000, revenue: 50000, manualFoodCost: 80000 },
    });
    expect(r.breakEvenRevenue).toBe(90000); // fixed 10k + food 80k
  });

  it("returns null break-even orders when there is no contribution per order", () => {
    expect(run().breakEvenOrders).toBeNull();
  });

  it("treats break-even as unreached when there is no break-even figure at all", () => {
    const r = run({ mtdAnalytics: { totalRevenue: 100000 } });
    expect(r.hasBrokenEven).toBe(false);
    expect(r.pctOfBreakEvenCovered).toBe(0);
  });
});

describe("useInsightsMetrics — month pacing", () => {
  it("projects month-end revenue from the run rate so far", () => {
    // 10 April: 10 days elapsed of 30. 200k so far → 20k/day → 600k projected.
    const r = run({ mtdAnalytics: { totalRevenue: 200000 } });
    expect(r.daysInMonth).toBe(30);
    expect(r.dailyRunRate).toBe(20000);
    expect(r.projectedMonthEndRevenue).toBe(600000);
    expect(r.pctOfMonthElapsed).toBeCloseTo(33.33, 1);
  });

  it("estimates which day of the month break-even lands on", () => {
    const r = run({ financeSummary: engine(), mtdAnalytics: { totalRevenue: 200000 } });
    expect(r.breakEvenDay).toBe(20); // 400k ÷ 20k a day
  });

  it("returns no break-even day when nothing has been sold", () => {
    expect(run({ financeSummary: engine() }).breakEvenDay).toBeNull();
  });
});

describe("useInsightsMetrics — working capital", () => {
  it("averages opening and closing stock from the restock history", () => {
    const r = run({
      financeSummary: engine(),
      restockHistory: [{ OpeningStockValue: 80000, MonthClosingValue: 40000 }],
    });
    // Average inventory 60k against 160k of food cost.
    expect(r.inventoryTurnover).toBeCloseTo(2.667, 2);
    expect(r.daysInventoryOutstanding).toBeCloseTo(11.25, 2);
  });

  it("falls back to live stock value when there is no restock history", () => {
    const r = run({ financeSummary: engine(), inventoryStockValue: 160000 });
    expect(r.inventoryTurnover).toBe(1);
    expect(r.daysInventoryOutstanding).toBe(30);
  });

  it("returns null turnover when there is no inventory figure at all", () => {
    const r = run({ financeSummary: engine() });
    expect(r.inventoryTurnover).toBeNull();
    expect(r.daysInventoryOutstanding).toBeNull();
    expect(r.cashConversionCycle).toBeNull();
  });

  it("derives days payable from what is owed against food cost", () => {
    const r = run({ financeSummary: engine(), accountsPayable: 80000 });
    expect(r.daysPayableOutstanding).toBe(15); // 80k/160k of a 30-day month
  });

  it("completes the cycle as inventory days minus payable days", () => {
    // Days sales outstanding is 0 by definition here: a POS restaurant is paid
    // at the till, so there is no customer receivable.
    const r = run({
      financeSummary: engine(),
      inventoryStockValue: 160000,
      accountsPayable: 80000,
    });
    expect(r.cashConversionCycle).toBe(15); // 30 + 0 - 15
  });
});

describe("useInsightsMetrics — refunds, delivery and return", () => {
  it("measures refunds against gross sales before refunds", () => {
    // mtdRevenue is already net of refunds, so the refunded amount is added
    // back into the denominator alongside cancelled bills.
    const r = run({
      mtdAnalytics: { totalRevenue: 90000, refundedTotal: 5000, cancelledTotal: 5000 },
    });
    expect(r.refundPercentage).toBe(10); // 10k of 100k
  });

  it("reports zero refunds rather than dividing by zero", () => {
    expect(run().refundPercentage).toBe(0);
  });

  it("counts both ONLINE and DELIVERY as delivery revenue", () => {
    const r = run({
      mtdAnalytics: { revenueByOrderType: { ONLINE: 30000, DELIVERY: 20000, DINE_IN: 100000 } },
      insightsData: { deliveryCharges: 5000, aggregatorCommission: 10000 },
    });
    expect(r.deliveryRevenue).toBe(50000);
    expect(r.dineInTakeawayRevenue).toBe(100000);
    expect(r.deliveryMargin).toBe(35000);
    expect(r.deliveryCostPercentage).toBe(30);
    // Commission alone, distinct from the combined cost ratio above.
    expect(r.aggregatorCommissionPercentage).toBe(20);
    expect(r.hasDeliveryOrders).toBe(true);
  });

  it("costs each new customer against marketing spend", () => {
    const r = run({
      mtdAnalytics: { newCustomersCount: 50 },
      insightsData: { marketingSpend: 25000 },
    });
    expect(r.customerAcquisitionCost).toBe(500);
  });

  it("shows return at this month's rate, with an implied payback period", () => {
    const r = run({ financeSummary: engine(), insightsData: { initialInvestment: 1100000 } });
    expect(r.monthlyRoiPercentage).toBeCloseTo(5, 5); // 55k of 1.1M
    expect(r.paybackMonths).toBe(20);
  });

  it("gives no payback period when the month lost money", () => {
    const r = run({
      financeSummary: engine({ ebitda: -5000 }),
      insightsData: { initialInvestment: 1100000 },
    });
    expect(r.paybackMonths).toBeNull();
    expect(r.monthlyRoiPercentage).toBeLessThan(0);
  });

  it("annualises revenue for sales per square foot", () => {
    const r = run({ financeSummary: engine(), selectedBranch: { areaSqFt: 1000 } });
    expect(r.salesPerSqFt).toBe(6000); // 500k x 12 / 1000
    expect(run({ financeSummary: engine() }).salesPerSqFt).toBeNull();
  });
});
