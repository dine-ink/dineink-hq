# Phase 2 — Financial Foundation

Deliverable report for the Financial Assumptions Engine, Ratio/Period Engine, and Financial Statements system built on top of the Tier-1 correctness fixes (shared finance engine, real calendar periods, bounded queries).

Scope explicitly excluded from this phase, per instruction: Forecasting, Scenario Analysis, Budget vs Actual, ROI/IRR/NPV, AI insights.

---

## 1. Features Added

1. **Financial Assumptions Engine** — a configurable, two-tier (restaurant default + optional per-branch override) source for every target/rate/percentage assumption: property/occupancy rates, cost targets, channel commission %, franchise/royalty fees, escalation %, tax/operating calendar. Nothing hardcoded; every value editable from the owner-web UI.
2. **Ratio/Period Engine** — every core financial KPI (Revenue, Food Cost %, Prime Cost %, Labour %, Utilities, Rent, Occupancy %, Expenses, Gross Profit, Gross Margin %, EBITDA %, Net Profit, Break-even Revenue) computed simultaneously across Daily/Weekly/Monthly/Quarterly/Yearly, plus month-over-month and year-over-year comparison, target, direction-aware achievement %, and trend.
3. **Financial Statements** — 8 statement types (P&L, Income Statement, Expense Statement, Food Cost Report, Labour Report, Utility Report, Branch Financial Summary, Restaurant Financial Summary), each parameterized by period (daily/monthly/quarterly/yearly/custom), with PDF/Excel/CSV/Print export from a single generic renderer.
4. **Dashboard KPI enrichment** — the Revenue and EBITDA cards on the main Dashboard now show month-over-month trend, configured target, and achievement %, and are clickable, drilling down into the full Financial Statements view.
5. A real, previously-undetected **timezone bug** (UTC-based date-string slicing shifting calendar boundaries back a day under IST) was found and fixed in two places (backend statement date-range resolution, frontend export filenames) during live verification of this phase's own new code.

## 2. APIs Added

All under JWT auth (`authMiddleware` + `requireOwnRestaurant()` + `requireOwnBranch()` where applicable).

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/finance-assumptions/:restaurantId` | Restaurant-level default assumptions (raw, unresolved) |
| PUT | `/api/finance-assumptions/:restaurantId` | Upsert restaurant-level defaults |
| GET | `/api/finance-assumptions/:restaurantId/:branchId` | Resolved assumptions for a branch (default + override merged), with `overriddenFields` |
| PUT | `/api/finance-assumptions/:restaurantId/:branchId` | Upsert a branch's own override row |
| GET | `/api/finance/:restaurantId/:branchId/ratios` | The Ratio/Period Engine — every KPI × every period × target × trend |
| GET | `/api/finance/:restaurantId/:branchId/statements/:type` | Financial Statement generator (`type` = pnl\|income\|expense\|foodCost\|labour\|utility\|branchSummary\|restaurantSummary; query `period`, optional `from`/`to`) |

`/api/finance/:restaurantId/:branchId/summary` (Tier-1) was extended, not replaced: its `targets` block now sources `targetEbitda`/`targetFoodCost`/`targetPrimeCost`/`targetLabourCost`/`targetOccupancy`/`targetUtility` from the new Financial Assumptions engine instead of `RestaurantInsights`.

## 3. Database Changes

- **New model `FinancialAssumptions`** (migration `20260726020000_add_financial_assumptions`): `restaurantId`, nullable `branchId` (null = restaurant default), 21 rate/target fields, `updatedById` (audit — who last changed it, matching the existing `InventoryAdjustment.updatedById` convention), timestamps. Unique on `(restaurantId, branchId)` for the branch-override case; the "exactly one default row per restaurant" invariant is deliberately enforced in the service layer rather than a DB constraint, to avoid the migration-drift issues already seen in this project with partial/filtered indexes.
- No changes to `RestaurantInsights` — it continues to hold actual ₹ expense figures. Overlapping legacy target fields (`targetEbitda`, `targetFoodCost`, `targetPrimeCost`, `gstPercentage`, `aggregatorCommission`) are left in place (no data loss) but are no longer read by the finance engine; `targetGrossMargin`, `monthlyRevenueGoal`, `monthlyProfitGoal` remain live since they have no Financial Assumptions equivalent yet.
- Reviewed for duplicated financial-calculation logic across the whole codebase (frontend + backend grep sweep) — none found outside the finance module and its already-fixed Tier-1 consumers. `RestaurantInsights`'s unused "business assumption" fields (`expectedInflation`, `expectedMonthlyGrowth`, etc.) conceptually overlap with the new escalation fields but are inert placeholders for the not-yet-built Forecasting feature — recommend consolidating onto `FinancialAssumptions` when that phase is built, not now (nothing is currently reading the wrong source).

## 4. UI Changes

- **New "Financial Assumptions" tab** in Insights, with a Restaurant Defaults / This Branch's Overrides toggle, grouped fields (Property & Occupancy, Targets, Channel Mix & Commission, Franchise & Royalty, Escalation, Tax & Operating Calendar), per-field "Reset to default" when a branch override is active.
- The old "Financial Targets" form in Insights Setup had its now-redundant Target EBITDA/Food Cost/Prime Cost inputs removed, replaced with a note pointing to the new tab; Target Gross Margin/Monthly Revenue Goal/Monthly Profit Goal/Initial Investment stay (no new-model equivalent).
- **New "Financial Statements" page** (`/dashboard/financial-statements`, new sidebar entry) — statement type + period pickers, sectioned table view, PDF/Excel/CSV/Print export.
- **Dashboard KPI cards** (`StatsStrip`) — Revenue and EBITDA cards show trend arrow + variance %, target + achievement %, and are clickable (drill-down to Financial Statements).

## 5. Prisma Changes

- `FinancialAssumptions` model + 3 back-relation arrays (`Restaurant.financialAssumptions`, `Branch.financialAssumptions`, `User.financialAssumptionsUpdated`).
- Migration `20260726020000_add_financial_assumptions`, applied via `prisma migrate deploy` (additive-only, no data touched).

## 6. Financial Ratios Added

Per KPI (Revenue, Food Cost %, Prime Cost %, Labour Cost %, Utilities, Rent, Occupancy %, Expenses, Gross Profit, Gross Margin %, EBITDA %, Net Profit, Break-even Revenue): Daily, Weekly, Monthly, Quarterly, Yearly, Previous Month, Previous Year, Variance, Variance %, Target, Achievement % (direction-aware — a lower actual against a lower-is-better target still reads ≥100%), Trend Direction, Trend %.

## 7. Statements Added

Profit & Loss, Income Statement, Expense Statement, Food Cost Report, Labour Report, Utility Report, Branch Financial Summary, Restaurant Financial Summary — each daily/monthly/quarterly/yearly/custom, each exportable as PDF/Excel/CSV/Print.

## 8. Tests Added

New Vitest suite (`npm test`), 69 tests across 4 files, all passing:

- `finance.formulas.test.ts` (35 tests) — every pure formula (food cost %, prime cost, gross profit, EBITDA, net profit, contribution margin, break-even revenue/orders/ADS, margin of safety, the aggregate `computeFinancialMetrics`, and `computeVariance`), including edge cases (division by zero, null previous period).
- `dateRange.test.ts` (17 tests) — calendar period resolution for every period key, `getComparisonPeriod`'s calendar-true vs equal-length-window behavior, and an explicit regression test for the `daysInRange` off-by-one bug found and fixed during Tier-1.
- `finance.ratios.test.ts` (7 tests) — `computeAchievement`'s direction-aware logic for both higher-is-better and cost-type KPIs, plus null/zero-target edge cases.
- `finance.statements.test.ts` (7 tests) — `buildPnlSections` (extracted as a pure function from the P&L generator) against a hand-computed scenario, including a test that changing finance cost affects Net Profit but never EBITDA.

Additionally, every new API was verified live against the real database (not just unit-tested) during development: 16 assertions for Financial Assumptions resolution/override/validation/auth, 17 for the Ratio Engine, 34 for the 8 statement types, 6 for the Dashboard drill-down UI, 8 for the Financial Assumptions UI — all passing, all test data cleaned up afterward.

## 9. Performance

- The Ratio Engine's menu-item recipe-cost lookup (period-independent) was fetched once per request and reused across all 7 periods, instead of being re-queried per period (same fix applied to the Financial Summary endpoint's current/previous comparison) — a real, identified repeated-query reduction, not speculative.
- No summary/pre-computed tables were introduced — none of the new endpoints have been profiled as a bottleneck, and the existing `Bill` indexes (`restaurantId, branchId, createdAt`) already cover the new queries' WHERE clauses.

## 10. Files Modified

**dineink-backend**
- `prisma/schema.prisma`, `prisma/migrations/20260726020000_add_financial_assumptions/migration.sql` (new)
- `src/modules/finance/finance.ratios.ts`, `finance.statements.service.ts`, `finance.statements.controller.ts`, `finance.statements.types.ts` (new); `finance.service.ts`, `finance.types.ts`, `finance.controller.ts`, `finance.routes.ts` (extended)
- `src/modules/financeAssumptions/financeAssumptions.types.ts`, `.validation.ts`, `.service.ts`, `.controller.ts`, `.routes.ts` (new)
- `src/modules/analytics/branchComparison.service.ts` (Tier-1 net-profit fix, unrelated to Phase 2 but present in the working tree)
- `src/routes/index.ts` (registered `finance-assumptions`)
- `src/modules/finance/finance.formulas.test.ts`, `finance.ratios.test.ts`, `finance.statements.test.ts`, `src/utils/dateRange.test.ts` (new)
- `tsconfig.json` (exclude test files + vitest config from `tsc`), `vitest.config.ts` (new), `package.json`/`package-lock.json` (added `vitest`, `test` script)

**owner-web**
- `src/pages/insights/Insights.tsx` — new Financial Assumptions tab, targets re-sourced from `financeSummary.targets`
- `src/pages/dashboard/Dashboard.tsx` — Ratio Engine fetch, drill-down wiring
- `src/components/StatsStrip.tsx` — trend/target/achievement rendering, click-to-drill-down
- `src/pages/reports/FinancialStatements.tsx` (new page), `src/routes/AppRoutes.tsx`, `src/layouts/DashboardLayout.tsx` (route + sidebar entry)
- `src/utils/reportData.ts`, `generatePDF.ts`, `generateExcel.ts` (Tier-1 canonical-numbers fix, present in the working tree)

---

## Verification

- Backend: `npm run build` — clean. `npm test` — 69/69 passing.
- Frontend: `npm run build` — clean.
- Live integration (created + verified + cleaned up real test data against the actual database for every new endpoint and UI surface): 81 assertions, 0 failures, 0 orphaned rows left behind.

## Not done in this phase (explicitly out of scope)

Scenario Analysis, Budget vs Actual, Forecasting, Investment/IRR/NPV Analysis, KPI Targets traffic-light dashboard beyond the Ratio Engine's achievement %, Drill-Down Analytics beyond the Dashboard→Statements link, AI insights.
