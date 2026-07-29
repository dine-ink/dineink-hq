# Phase 1 — Financial Correctness

Before any new financial capability was built, the existing app's financial calculations were audited and made internally consistent. This is the foundation Phases 2 and 3 were built on top of.

---

## 1. Problem

EBITDA, Net Profit, and Prime Cost were each computed independently in five different places — Dashboard, Insights, Branch Comparison, the PDF export, and the Excel export — with subtly different formulas. The same period could show a different EBITDA % on different screens. Two other real, unrelated bugs were found in the same audit pass: Branch Comparison's "Net Profit" never subtracted food cost at all, and Dashboard's "live orders" panel displayed fake `Swiggy`/`Zomato` labels alternating by array index with no real data behind them.

## 2. Fixes

1. **Removed an unscoped cross-tenant endpoint** (`GET /analytics/dashboardOverview`) — an admin-style query with no `restaurantId` filter, reachable by any authenticated user regardless of which restaurant they belonged to. Deleted the route, controller function, and service function entirely; nothing else referenced it.
2. **Fixed unbounded queries** — `vendor.service.ts`'s payment/invoice/outstanding history queries and `reports.service.ts`'s expense report (when no date range was supplied) fetched a branch's *entire* history with no cap. Added a `VENDOR_HISTORY_LIMIT = 500` bound and a rolling-12-month default range respectively.
3. **Built a calendar-aware date-range utility** (`src/utils/dateRange.ts`) — `resolveDateRange`, `getComparisonPeriod`, `daysInRange` for real calendar periods (this month vs the actual previous calendar month, not a rolling 30-day window), deliberately kept separate from `analytics.service.ts`'s existing rolling-window `getDateRange` so nothing that already depended on that one silently changed behavior.
4. **Built the Financial Calculation Engine** (`src/modules/finance/finance.formulas.ts`) — the single source of truth for every formula from here on: Prime Cost = Food Cost + Labour; Gross Profit = Revenue − Food Cost; EBITDA = Revenue − Food Cost − Labour − Fixed Opex − Variable Opex (excludes finance cost and GST by definition); Net Profit = EBITDA − Finance Cost; Contribution Margin = Revenue − Food Cost − Variable Opex; Break-even Revenue/Orders/ADS; Margin of Safety. Pure functions, no database access, fully unit-testable. `finance.service.ts` orchestrates the actual data fetching (period-accurate food cost via recipe cost × quantity sold, proration of monthly `RestaurantInsights` figures to the requested period) and calls the formulas; exposed via `GET /api/finance/:restaurantId/:branchId/summary`.
5. **Fixed Branch Comparison's Net Profit** to actually include food cost (previously `revenue − gst − expenses − labour`, silently omitting the single largest cost category), reusing the new engine's `computeEBITDA`/`computePrimeCost` rather than a hand-rolled formula.
6. **Removed the fake Swiggy/Zomato labels** in Dashboard.tsx, replacing them with the real `orderType === "ONLINE"` field.
7. **Migrated Insights.tsx and Dashboard.tsx** off their independent client-side EBITDA/Prime Cost/Net Profit/Break-even calculations onto the new `/finance/summary` endpoint, with the old calculation kept only as a same-formula fallback until the fetch resolves (never a different answer, just a brief loading state).
8. **Fixed the PDF/Excel export generators** to consume the same canonical numbers instead of recomputing independently — and in doing so, found and fixed two additional real bugs in `generateExcel.ts` that predated this phase: the "Food Cost %" and "Gross Margin %" cells were actually reading a *variable-expenses* value, not food cost.
9. **Verified the off-by-one bug** in `daysInRange` (a single calendar day was computing as 2 days because the diff wasn't floored to midnight before dividing) via hand-calculated test data before it could propagate into any of the above.

## 3. Files Modified

**dineink-backend**: `src/modules/analytics/analytics.routes.ts`, `analytics.controller.ts`, `analytics.service.ts` (removed the unscoped endpoint), `analyticsAdvanced.service.ts` (bounded RFM query), `branchComparison.service.ts` (Net Profit fix), `src/modules/vendors/vendor.service.ts` (bounded history), `src/modules/reports/reports.service.ts` (bounded expense report default range), `src/utils/dateRange.ts` (new), `src/modules/finance/finance.types.ts`, `finance.formulas.ts`, `finance.service.ts`, `finance.controller.ts`, `finance.routes.ts` (new), `src/routes/index.ts`.

**owner-web**: `src/pages/dashboard/Dashboard.tsx`, `src/pages/insights/Insights.tsx`, `src/components/StatsStrip.tsx`, `src/utils/reportData.ts`, `generatePDF.ts`, `generateExcel.ts`.

## 4. Verification

Backend build clean, no TypeScript errors. Live end-to-end verification against the real database with crafted test data across two branches — 16 assertions covering the finance summary endpoint and Branch Comparison's corrected Net Profit, all matching hand-calculated expected values exactly; test data cleaned up afterward. Frontend build clean.

## 5. Full feature audit

The complete Phase 1 audit deliverable — every existing financial feature classified COMPLETE / PARTIAL / MISSING / BUG with exact file:line references — is `FINANCIAL_ANALYTICS_AUDIT.md`. That audit is what the user reviewed before choosing to sequence the remaining work as "fix correctness first," which became this phase.
