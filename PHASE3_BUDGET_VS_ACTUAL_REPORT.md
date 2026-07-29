# Phase 3 — Budget vs Actual

A complete Budget vs Actual module built on top of the Phase 1 (Financial Correctness) and Phase 2 (Financial Foundation) work. The Finance Engine, Ratio Engine, Financial Statements, and Financial Assumptions Engine were **not modified** except one additive, backward-compatible change (see §2) — every actual value in this phase is read from them, never recomputed.

---

## 1. Features Added

1. **Budget Management** — create yearly budgets (restaurant-wide or per-branch) with a monthly-default auto-generator that expands one value into all 12 months of the financial year (Apr–Mar, matching the existing `InvoiceSequence` FY convention); edit individual months; publish/archive; duplicate; copy to next financial year (shifts every item's calendar year by the FY delta).
2. **19 budgetable categories**: Revenue, Orders, Average Order Value, Food Cost (₹ and %), Prime Cost, Labour (₹ and %), Rent, Utilities, Marketing, Maintenance, Cleaning, Packaging, Delivery Commission, Operating Expenses, EBITDA, Net Profit, Cash Flow — extensible by adding one entry to a single category list (`budget.types.ts` / `budgetCategories.ts`), no other file needs to change for most new categories.
3. **Variance Engine** — for every category: Budget, Actual, Variance, Variance %, direction-aware Achievement % (a lower actual against a lower-is-better target like Food Cost still reads ≥100%), Status (on-track/warning/critical/no-data), and Trend (vs the prior equivalent period).
4. **Budget vs Actual dashboard** (new "Overview" tab) — KPI cards for Revenue/Food Cost/Labour/EBITDA/Net Profit with budget/actual/variance/achievement/trend, an "Attention Needed" panel surfacing categories in warning/critical status, and a full 19-row variance table. Supports Current Month/Quarter/Year and a Custom Date Range.
5. **Budget Reports** — Monthly/Quarterly/Yearly/Variance Report (one flexible generator across period granularities) plus Branch/Restaurant Budget Report (a matter of which budget — branch-scoped or restaurant-wide — is selected), exported as PDF/Excel/CSV/Print via the same generic renderer pattern built in Phase 2's Financial Statements.
6. **6 charts**: Budget vs Actual (Revenue), Monthly Variance %, Revenue/Expense/EBITDA/Food Cost Trend — each switchable between Line/Bar/Area.
7. **Branch Comparison + ranking** — every published branch-level budget's Revenue/Food Cost/EBITDA/Net Profit actuals side by side, ranked by average achievement % across those four categories (🏆 for #1).
8. **Visual indicators** — color-coded card borders/badges (emerald/amber/red) and an "Attention Needed" list for revenue below budget, cost categories above target, and EBITDA below target.
9. A genuine timezone-adjacent proration bug was caught and fixed during this phase's own build: `aggregateBudgetForCategory`'s month-overlap calculation initially risked the same day-boundary off-by-one already fixed in Phase 1's `daysInRange` — floors both ends to local midnight before diffing, verified by a dedicated unit test.

## 2. Database Changes

- **New models** `Budget` (header: restaurant, optional branch, financial year, name, notes, status, audit fields) and `BudgetItem` (one row per category × calendar month × amount), migration `20260726060000_add_budget_module`.
- `category` on `BudgetItem` is a plain string validated against a maintained list, not a DB enum — adding a new budgetable category never requires a migration.
- No `BudgetVersion` model — "duplicate" and "copy to next year" are implemented as creating another `Budget` row with copied items; nothing in the spec called for browsing/diffing historical versions, so that complexity wasn't built.
- **One additive change to the Finance Engine's output type**: `FinancialMetrics` (in `finance.types.ts`) now also exposes `orders` and `avgOrderValue` — both were already computed internally by `computePeriodMetrics` but previously discarded before being returned. This was necessary so the Budget module's Orders/AOV categories could read real actuals from the engine instead of duplicating that query, per the explicit instruction to never calculate actuals independently. No existing formula changed; no existing consumer's behavior changed (pure field addition, confirmed by the full Phase 1/2 test suite still passing unchanged).

## 3. Prisma Changes

- `Budget`, `BudgetItem` models; `BudgetStatus` enum (`DRAFT` | `PUBLISHED` | `ARCHIVED`).
- Back-relations: `Restaurant.budgets`, `Branch.budgets`, `User.budgetsCreated` / `budgetsUpdated`.
- Indexes: `Budget(restaurantId)`, `Budget(branchId)`, `Budget(restaurantId, financialYear)`, `BudgetItem(budgetId)`, unique `BudgetItem(budgetId, category, year, month)`.

## 4. APIs Added

All under JWT auth + `requireOwnRestaurant()` (a budget's own `restaurantId` is verified inside the service layer on every read/write; a budget's `branchId`, if set, necessarily already belongs to that same restaurant).

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/budgets/:restaurantId` | Create a budget, optionally auto-generating 12 monthly items per category from `monthlyDefaults` |
| GET | `/api/budgets/:restaurantId` | List budgets (filter by `branchId`, `financialYear`, `status`) |
| GET | `/api/budgets/:restaurantId/:budgetId` | Budget detail with all items |
| PUT | `/api/budgets/:restaurantId/:budgetId` | Update name/notes/status (Draft → Published → Archived) |
| PUT | `/api/budgets/:restaurantId/:budgetId/items` | Bulk upsert individual month/category items |
| POST | `/api/budgets/:restaurantId/:budgetId/duplicate` | Duplicate, optionally overriding name/financialYear/branchId (financialYear override shifts every item's year) |
| GET | `/api/budgets/:restaurantId/:budgetId/variance` | The Variance Engine — every category's budget/actual/variance/achievement/trend for a period |

## 5. UI Screens Added

- **New "Budget vs Actual" sidebar entry**, one page with 4 tabs: Overview, Budgets, Branch Comparison, Reports.
- **Budgets tab** — list view, create form (name/FY/scope/per-category monthly defaults), detail/edit view (a 19-category × 12-month grid grouped by Property/Targets/Channel/Franchise/Escalation/Tax sections — mirroring the Phase 2 Financial Assumptions grid pattern), Publish/Archive/Duplicate/Copy-to-Next-Year actions.
- **Overview tab** — KPI cards, attention alerts, 6 charts, full variance table, period selector including Custom Range.
- **Branch Comparison tab** — ranked table with trophy badge for the top performer.
- **Reports tab** — report-type + budget selector, PDF/Excel/CSV/Print export buttons.

## 6. Dashboard Changes

The main app Dashboard (Phase 2) was not modified in this phase — Budget vs Actual has its own dedicated Overview tab rather than adding more cards to the already-populated main Dashboard, keeping that page's scope stable.

## 7. Reports Added

Monthly Budget Report, Quarterly Budget Report, Yearly Budget Report, Variance Report (custom range), Branch Budget Report, Restaurant Budget Report — all backed by the single `/variance` endpoint at different periods/scopes, all exportable as PDF/Excel/CSV/Print.

## 8. Charts Added

Budget vs Actual (Revenue), Monthly Variance % (Revenue), Revenue Trend, Expense Trend, EBITDA Trend, Food Cost Trend — Line/Bar/Area toggle applies to all 6.

## 9. Tests Added

- **82 total fast unit tests** (`npm test`, no database): the 69 from Phase 1/2 (all still passing unchanged) plus **13 new** —
  - `budget.service.test.ts` — `aggregateBudgetForCategory`'s month-overlap proration (whole months, partial custom ranges, missing months return `null` not `0`) and its sum-vs-day-weighted-average distinction between currency/count and percentage categories; `statusFor`'s on-track/warning/critical/no-data thresholds.
- **7 integration tests** (`npm run test:integration`, hits the real configured database, excluded from the default fast run): budget creation with auto-generated monthly items, listing, editing an individual month without disturbing others, publishing, variance calculation matched against hand-computed expected values from real bill/ingredient data, duplication, and copy-to-next-year's year-shifting. Creates and fully deletes its own isolated fixture restaurant every run — verified zero orphaned rows left behind.
- **Live UI verification** performed during development (Playwright against the real dev servers + real database, not part of the checked-in suite): 27 assertions on the variance engine (including multi-branch aggregation), 10 on the Budgets management UI, 6 on the Overview dashboard, 5 on Reports/exports, 10 on charts, 4 on Branch Comparison — 62 total, all passing, all test data cleaned up.

## 10. Performance

- Fixed a real duplicate query: `getBudgetVarianceService` was fetching `RestaurantInsights` (and, for restaurant-wide budgets, the branch list) twice per request — once for the current period, once for the previous period — even though neither varies by date range. Now fetched once and reused, mirroring the same fix already applied to `getMenuItemCostMap` in Phase 2.
- Multi-branch (restaurant-wide) budget variance sums raw ₹ inputs across branches and runs them through `computeFinancialMetrics` **once**, so consolidated percentages come from the same shared engine function as everywhere else, not a hand-rolled aggregate formula.
- `BudgetItem` queries are bounded (fetched once per budget via a single `include`, filtered in-memory per category) — no N+1.
- Known, deliberately-accepted trade-off: the Overview tab's 6-month-trend charts fire 12 parallel calls to the existing `/variance` endpoint (one per month) rather than a new consolidated endpoint. This is correct (reuses the same engine, no duplicate calculation logic) and loads in ~2-3 seconds in testing; per "don't optimize prematurely," a dedicated trend endpoint wasn't built without evidence this is a real bottleneck.

## 11. Files Modified

**dineink-backend**
- `prisma/schema.prisma`, `prisma/migrations/20260726060000_add_budget_module/migration.sql` (new)
- `src/modules/budget/budget.types.ts`, `.validation.ts`, `.service.ts`, `.controller.ts`, `.routes.ts`, `.service.test.ts`, `.integration.test.ts` (new)
- `src/modules/finance/finance.types.ts`, `finance.formulas.ts` (additive `orders`/`avgOrderValue` passthrough)
- `src/routes/index.ts` (registered `/budgets`)
- `vitest.integration.config.ts` (new), `tsconfig.json` (exclude it from `tsc`), `package.json` (`test:integration` script)

**owner-web**
- `src/pages/budget/BudgetVsActual.tsx`, `BudgetsTab.tsx`, `OverviewTab.tsx`, `BranchComparisonTab.tsx`, `ReportsTab.tsx`, `BudgetCharts.tsx`, `budgetCategories.ts` (new)
- `src/routes/AppRoutes.tsx`, `src/layouts/DashboardLayout.tsx` (route + sidebar entry)

---

## Final Validation

- Backend: `npm run build` — clean. `npm test` — 82/82 passing. `npm run test:integration` — 7/7 passing against the real database, confirmed zero orphaned rows afterward.
- Frontend: `npm run build` — clean.
- Manually verified Budget vs Actual numbers against hand-calculated expected values for a real sample scenario (₹2000 actual revenue vs ₹2200 budget → -9.1% variance, 90.9% achievement, "warning"; 10% actual food cost vs 20% budget → 200% achievement, "on-track") — matched exactly.
- Confirmed every dashboard/report/chart value traces back to `computePeriodMetrics`/`computeFinancialMetrics` (or a direct, already-established `RestaurantInsights` proration) — no independent financial formula exists anywhere in the new frontend or backend code.

## Not done in this phase (explicitly out of scope)

Forecasting, Scenario Analysis, Investment/IRR/NPV Analysis, AI insights.
