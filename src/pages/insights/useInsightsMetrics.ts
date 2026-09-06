import { useMemo } from "react";

/**
 * Every figure the Insights page derives — the KPIs the page exists to show.
 *
 * These were eighty-eight `const`s in the middle of a 4,370-line component,
 * reachable only by mounting the whole page with a dozen mocked requests. They
 * are what an owner judges EBITDA, prime cost, break-even and cash conversion
 * by, and they had no direct test at all.
 *
 * The shape throughout is `fm ? fm.x : localX`: prefer the shared finance
 * engine (finance.formulas.ts, the same numbers Dashboard, Branch Comparison
 * and the exports use) and fall back to a client-side estimate only until that
 * fetch resolves. Both halves are kept, deliberately — the fallback is what the
 * page shows for the first second of every visit.
 *
 * Pure: no fetching, no state, no effects. The page still owns loading; this
 * only shapes what it loaded.
 */

export interface InsightsMetricsInput {
  financeSummary: any;
  insightsData: any;
  mtdAnalytics: any;
  restockHistory: any[];
  inventoryStockValue: number;
  accountsPayable: number;
  selectedBranch: any;
  /** Salaries here are the local labour-cost estimate, used until fm loads. */
  staffData: any[];
}

export function useInsightsMetrics({
  financeSummary,
  insightsData,
  mtdAnalytics,
  restockHistory,
  inventoryStockValue,
  accountsPayable,
  selectedBranch,
  staffData,
}: InsightsMetricsInput) {
  return useMemo(() => {
    const n = (v: any) => Number(v) || 0;
    // The canonical current-month figures from the shared finance engine
    // (finance.formulas.ts) — every KPI below prefers `fm` when it has loaded,
    // falling back to the old client-side estimate only until the fetch
    // completes (see fetchFinanceSummary below), so the numbers shown here
    // always agree with Dashboard, Branch Comparison, and the PDF/Excel
    // exports instead of being independently re-derived.
    const fm = financeSummary?.current;
    // Targets — from FinancialAssumptions (via financeSummary.targets) once
    // loaded, the single source of truth going forward; falls back to the
    // legacy RestaurantInsights target fields (still editable in Insights
    // Setup below) only until that fetch resolves.
    const targets = financeSummary?.targets;
    const targetEbitda = targets
      ? (targets.targetEbitda ?? 0)
      : n(insightsData["targetEbitda"]);
    const targetFoodCost = targets
      ? (targets.targetFoodCost ?? 0)
      : n(insightsData["targetFoodCost"]);
    const targetPrimeCost = targets
      ? (targets.targetPrimeCost ?? 0)
      : n(insightsData["targetPrimeCost"]);
    const targetGrossMargin = targets
      ? (targets.targetGrossMargin ?? 0)
      : n(insightsData["targetGrossMargin"]);
    // Setup readiness — hoisted out of the sidebar's JSX because the compact
    // mobile strip and the full desktop card both display it.
    const setupCompletion = (() => {
      const fields = [
        insightsData.monthlyRent,
        insightsData.loanEmi,
        insightsData.internet,
        insightsData.phoneBills,
        insightsData.accounting,
        insightsData.insurance,
        insightsData.licenses,

        insightsData.deliveryCharges,
        insightsData.packaging,
        insightsData.paymentGateway,
        insightsData.aggregatorCommission,
        insightsData.electricity,
        insightsData.gas,
        insightsData.maintenance,
        insightsData.fuel,

        targetEbitda,
        targetFoodCost,
        targetGrossMargin,
        targetPrimeCost,
        insightsData.monthlyRevenueGoal,
        insightsData.monthlyProfitGoal,

        insightsData.gstPercentage,
        insightsData.monthlyLoanEmi,
        insightsData.monthlyInterestPayments,
        insightsData.caFees,
        insightsData.insuranceCost,
        insightsData.otherTaxes,

        insightsData.expectedMonthlyGrowth,
        insightsData.expectedDeliveryGrowth,
        insightsData.seasonalImpact,
        insightsData.weekendSalesIncrease,

        insightsData.plannedExpansion,
      ];
      const filled = fields.filter(
        (field) =>
          field !== null && field !== undefined && field !== "" && field !== 0,
      ).length;
      return Math.round((filled / fields.length) * 100);
    })();

    const localTotalFixedExpenses =
      n(insightsData.monthlyRent) +
      n(insightsData.loanEmi) +
      n(insightsData.internet) +
      n(insightsData.phoneBills) +
      n(insightsData.accounting) +
      n(insightsData.insurance) +
      n(insightsData.licenses);
    const localTotalVariableExpenses =
      n(insightsData.deliveryCharges) +
      n(insightsData.packaging) +
      n(insightsData.paymentGateway) +
      n(insightsData.aggregatorCommission) +
      n(insightsData.electricity) +
      n(insightsData.gas) +
      n(insightsData.maintenance) +
      n(insightsData.fuel) +
      n(insightsData.marketingSpend);
    const localTotalLabourCost =
      staffData?.reduce((sum: number, s: any) => sum + (s.salary || 0), 0) || 0;
    const localTotalFinanceCost =
      n(insightsData.monthlyLoanEmi) +
      n(insightsData.monthlyInterestPayments) +
      n(insightsData.caFees) +
      n(insightsData.insuranceCost) +
      n(insightsData.otherTaxes);
    const localRevenue = insightsData.revenue || 0;
    const manualFoodCostSet = n(insightsData.manualFoodCost) > 0;
    const restockData = restockHistory || [];
    /* INVENTORY VALUE */
    const inventoryValue = restockData.reduce((sum: number, item: any) => {
      return sum + Number(item.MonthClosingValue || 0);
    }, 0);
    /* STARTING INVENTORY */
    const startingInventory = restockData.reduce((sum: number, item: any) => {
      return sum + Number(item.OpeningStockValue || 0);
    }, 0);
    /* ACTUAL FOOD COST */
    const actualFoodCost = restockData.reduce((sum: number, item: any) => {
      return sum + Number(item.MonthlyRMExpense || 0);
    }, 0);
    // Use manual entry when set, otherwise use inventory-calculated food cost
    // Priority: manual entry → live inventory stock value → restock-history RM expense
    const localEffectiveFoodCost = manualFoodCostSet
      ? n(insightsData.manualFoodCost)
      : inventoryStockValue > 0
        ? inventoryStockValue
        : actualFoodCost;
    const localTotalExpenses =
      localTotalFixedExpenses +
      localTotalVariableExpenses +
      localTotalLabourCost +
      localTotalFinanceCost +
      localEffectiveFoodCost;
    const localEbitda = localRevenue - localTotalExpenses;
    const localPrimeCost = localEffectiveFoodCost + localTotalLabourCost;
    const localGrossProfit = localRevenue - localEffectiveFoodCost;

    // Public values consumed below — sourced from the finance engine
    // (real period revenue, recipe-cost-based food cost, EBITDA/Prime
    // Cost/Net Profit computed by finance.formulas.ts) once loaded.
    const revenue = fm ? fm.revenue : localRevenue;
    const totalFixedExpenses = fm ? fm.fixedExpenses : localTotalFixedExpenses;
    const totalVariableExpenses = fm
      ? fm.variableExpenses
      : localTotalVariableExpenses;
    const totalLabourCost = fm ? fm.labourCost : localTotalLabourCost;
    const totalFinanceCost = fm ? fm.financeCost : localTotalFinanceCost;
    const effectiveFoodCost = fm ? fm.foodCost : localEffectiveFoodCost;
    const totalExpenses = fm ? fm.totalExpenses : localTotalExpenses;
    const ebitda = fm ? fm.ebitda : localEbitda;
    const ebitdaPercentage = fm
      ? fm.ebitdaPercentage
      : revenue
        ? ((ebitda / revenue) * 100).toFixed(1)
        : 0;
    /* FOOD COST % */
    const actualFoodCostPercentage = fm
      ? fm.foodCostPercentage
      : revenue
        ? ((effectiveFoodCost / revenue) * 100).toFixed(1)
        : "0";
    /* PRIME COST % — Food Cost + Labour Cost, NOT variable overhead + labour. */
    const primeCost = fm ? fm.primeCost : localPrimeCost;
    const primeCostPercentage = fm
      ? fm.primeCostPercentage
      : revenue
        ? ((primeCost / revenue) * 100).toFixed(1)
        : 0;
    /* GROSS PROFIT — Net Sales − COGS (COGS ≈ food/raw-material cost) */
    const grossProfit = fm ? fm.grossProfit : localGrossProfit;
    const grossProfitMarginPercentage = fm
      ? fm.grossProfitMarginPercentage
      : revenue
        ? ((grossProfit / revenue) * 100).toFixed(1)
        : "0";
    /* LABOUR COST % */
    const labourCostPercentage = fm
      ? fm.labourCostPercentage
      : revenue
        ? ((totalLabourCost / revenue) * 100).toFixed(1)
        : "0";
    /* NET PROFIT — EBITDA − Finance Cost (matches finance.formulas.ts;
       used by the Net Profit KPI card below). */
    const netProfit = fm ? fm.netProfit : ebitda - totalFinanceCost;

    /* ================= BREAK-EVEN & MONTHLY PROGRESS ================= */
    const today = new Date();
    const daysInMonth = new Date(
      today.getFullYear(),
      today.getMonth() + 1,
      0,
    ).getDate();
    const daysElapsed = today.getDate();
    const mtdRevenue = n(mtdAnalytics?.totalRevenue);
    const mtdOrders = n(mtdAnalytics?.totalOrders);
    // Break-even Sales = Fixed Costs ÷ Contribution Margin %. Labour and
    // finance costs are treated as fixed here (staff are scheduled and paid
    // regardless of exact covers on a given day, unlike food cost or
    // per-order variable expenses, which scale directly with volume).
    const localBreakEvenFixedCosts =
      localTotalFixedExpenses + localTotalLabourCost + localTotalFinanceCost;
    const localBreakEvenVariableCosts =
      localTotalVariableExpenses + localEffectiveFoodCost;
    const localContributionMargin = localRevenue - localBreakEvenVariableCosts;
    const localContributionMarginPercentage =
      localRevenue > 0 ? localContributionMargin / localRevenue : 0;
    const localBreakEvenRevenue =
      localContributionMarginPercentage > 0
        ? localBreakEvenFixedCosts / localContributionMarginPercentage
        : localTotalExpenses; // fallback if contribution margin is 0/negative
    const localContributionPerOrder =
      mtdOrders > 0 ? localContributionMargin / mtdOrders : 0;
    const localBreakEvenOrders =
      localContributionPerOrder > 0
        ? Math.ceil(localBreakEvenFixedCosts / localContributionPerOrder)
        : null;

    // contributionMarginPercentage is kept as a fraction (0–1) here, matching
    // the pre-engine convention — the engine returns percentage points, so it's
    // divided back down rather than touching every display site below.
    const contributionMarginPercentage = fm
      ? fm.contributionMarginPercentage / 100
      : localContributionMarginPercentage;
    const breakEvenRevenue = fm
      ? (fm.breakEvenRevenue ?? totalExpenses)
      : localBreakEvenRevenue;
    const breakEvenOrders = fm ? fm.breakEvenOrders : localBreakEvenOrders;
    const dailyRunRate = daysElapsed > 0 ? mtdRevenue / daysElapsed : 0;
    const projectedMonthEndRevenue = dailyRunRate * daysInMonth;
    const monthlyTarget =
      n(insightsData.monthlyRevenueGoal) > 0
        ? n(insightsData.monthlyRevenueGoal)
        : breakEvenRevenue;
    const pctOfMonthElapsed = (daysElapsed / daysInMonth) * 100;
    const pctOfBreakEvenCovered = breakEvenRevenue
      ? Math.min((mtdRevenue / breakEvenRevenue) * 100, 100)
      : 0;
    const breakEvenDay =
      dailyRunRate > 0 ? Math.ceil(breakEvenRevenue / dailyRunRate) : null;
    const hasBrokenEven = mtdRevenue >= breakEvenRevenue && breakEvenRevenue > 0;
    const onTrackForTarget = projectedMonthEndRevenue >= monthlyTarget;

    /* ================= INVENTORY TURNOVER, DIO, CASH CONVERSION CYCLE ======== */
    // Average Inventory = (opening + closing stock value) ÷ 2, from the same
    // restock-history figures that already power effectiveFoodCost above.
    // Falls back to the live ingredient stock value when no restock history
    // exists yet, since that's the only inventory figure available then.
    const averageInventoryValue =
      startingInventory > 0 || inventoryValue > 0
        ? (startingInventory + inventoryValue) / 2
        : inventoryStockValue;
    const inventoryTurnover =
      averageInventoryValue > 0
        ? effectiveFoodCost / averageInventoryValue
        : null;
    const daysInventoryOutstanding =
      inventoryTurnover && inventoryTurnover > 0
        ? daysInMonth / inventoryTurnover
        : null;
    // Days Sales Outstanding is 0 — a POS restaurant is paid in full at the
    // time of sale, so there's no customer receivable to track.
    const daysSalesOutstanding = 0;
    const daysPayableOutstanding =
      effectiveFoodCost > 0
        ? (accountsPayable / effectiveFoodCost) * daysInMonth
        : null;
    const cashConversionCycle =
      daysInventoryOutstanding !== null && daysPayableOutstanding !== null
        ? daysInventoryOutstanding + daysSalesOutstanding - daysPayableOutstanding
        : null;

    /* ================= SALES PER SQUARE FOOT ================= */
    // Annualizes this month's revenue (×12) since areaSqFt is a fixed,
    // point-in-time figure — there's no trailing-12-month revenue query here.
    const branchAreaSqFt = n(selectedBranch?.areaSqFt);
    const salesPerSqFt =
      branchAreaSqFt > 0 ? (revenue * 12) / branchAreaSqFt : null;

    /* ================= REFUND % ============================================ */
    // Real BillRefund records (partial/full refunds) plus cancelled bills —
    // both are "money given back to a guest this month".
    const cancelledTotal = n(mtdAnalytics?.cancelledTotal);
    const refundedTotal = n(mtdAnalytics?.refundedTotal);
    const totalGivenBack = cancelledTotal + refundedTotal;
    // mtdRevenue already reflects refunds (bill.total is reduced at refund
    // time), so add back what was refunded to get the gross sold-before-refund
    // figure for the denominator, alongside cancelled bills.
    const grossSalesIncludingCancelled =
      mtdRevenue + cancelledTotal + refundedTotal;
    const refundPercentage =
      grossSalesIncludingCancelled > 0
        ? (totalGivenBack / grossSalesIncludingCancelled) * 100
        : 0;

    /* ================= DELIVERY / AGGREGATOR PROFITABILITY ================= */
    const revenueByOrderType = mtdAnalytics?.revenueByOrderType || {};
    const deliveryRevenue =
      n(revenueByOrderType.ONLINE) + n(revenueByOrderType.DELIVERY);
    const dineInTakeawayRevenue = Object.entries(revenueByOrderType)
      .filter(([type]) => type !== "ONLINE" && type !== "DELIVERY")
      .reduce((sum, [, v]) => sum + n(v), 0);
    const deliveryRelatedCost =
      n(insightsData.deliveryCharges) + n(insightsData.aggregatorCommission);
    const deliveryMargin = deliveryRevenue - deliveryRelatedCost;
    const deliveryCostPercentage = deliveryRevenue
      ? (deliveryRelatedCost / deliveryRevenue) * 100
      : 0;
    // Pure aggregator commission % — distinct from the combined delivery+
    // packaging cost ratio above, matching the standard "Commission Paid ÷
    // Delivery Sales" definition.
    const aggregatorCommissionPercentage = deliveryRevenue
      ? (n(insightsData.aggregatorCommission) / deliveryRevenue) * 100
      : 0;
    const hasDeliveryOrders = deliveryRevenue > 0;

    /* ================= CAC, ROI ================= */
    const newCustomersThisMonth = n(mtdAnalytics?.newCustomersCount);
    const customerAcquisitionCost =
      newCustomersThisMonth > 0
        ? n(insightsData.marketingSpend) / newCustomersThisMonth
        : 0;
    // True cumulative ROI would need a running P&L history since the
    // investment was made — Insights only stores this month's snapshot (each
    // save overwrites the last), so there's no historical ledger to sum. This
    // shows the return AT THIS MONTH'S RATE instead, plus an implied payback
    // period, which is honest about what the data actually supports.
    const initialInvestment = n(insightsData.initialInvestment);
    const monthlyRoiPercentage =
      initialInvestment > 0 ? (ebitda / initialInvestment) * 100 : null;
    const paybackMonths =
      initialInvestment > 0 && ebitda > 0
        ? Math.ceil(initialInvestment / ebitda)
        : null;
    return {
      fm,
      targetEbitda,
      targetFoodCost,
      targetPrimeCost,
      targetGrossMargin,
      setupCompletion,
      manualFoodCostSet,
      revenue,
      totalFixedExpenses,
      totalVariableExpenses,
      totalLabourCost,
      totalFinanceCost,
      effectiveFoodCost,
      totalExpenses,
      ebitdaPercentage,
      actualFoodCostPercentage,
      primeCostPercentage,
      grossProfit,
      grossProfitMarginPercentage,
      labourCostPercentage,
      netProfit,
      daysInMonth,
      daysElapsed,
      mtdRevenue,
      contributionMarginPercentage,
      breakEvenRevenue,
      breakEvenOrders,
      dailyRunRate,
      projectedMonthEndRevenue,
      pctOfMonthElapsed,
      pctOfBreakEvenCovered,
      breakEvenDay,
      hasBrokenEven,
      onTrackForTarget,
      inventoryTurnover,
      daysInventoryOutstanding,
      daysPayableOutstanding,
      cashConversionCycle,
      salesPerSqFt,
      refundPercentage,
      deliveryRevenue,
      dineInTakeawayRevenue,
      deliveryRelatedCost,
      deliveryMargin,
      deliveryCostPercentage,
      aggregatorCommissionPercentage,
      hasDeliveryOrders,
      newCustomersThisMonth,
      customerAcquisitionCost,
      initialInvestment,
      monthlyRoiPercentage,
      paybackMonths,
    };
  }, [
    financeSummary,
    insightsData,
    mtdAnalytics,
    restockHistory,
    inventoryStockValue,
    accountsPayable,
    selectedBranch,
    staffData,
  ]);
}

export type InsightsMetrics = ReturnType<typeof useInsightsMetrics>;
