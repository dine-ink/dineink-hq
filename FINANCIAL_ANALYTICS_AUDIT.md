# DineInk Financial Analytics — Audit Report (Phases 1–3)

**Scope of this document**: a complete, evidence-based audit of DineInk's existing
financial analytics/reporting capability, compared against the target KPI list
from the SAP reference model. This is Phases 1–3 only (audit, feature
inventory, SAP comparison) — a prioritized implementation proposal for Phases
4–25 follows in the next section of the conversation, not in this file.

**Stack correction**: this is a **Node.js 22 + Express 5 + TypeScript + Prisma 7**
backend and a **React 19 + TypeScript + Vite** frontend — not Java. Confirmed
directly from `dineink-backend/package.json`. Any implementation plan must
target this stack.

---

## 1. Executive Summary

The good news: DineInk already has a **surprisingly complete** analytics
surface for a product this stage — branch/city comparison with proper
`groupBy` queries and rankings, a real waste/wastage-cost engine, GST filing,
menu engineering (Star/Plowhorse/Puzzle/Dog), customer RFM segmentation, a
27-sheet Excel export and an 11-section branded PDF export. This is not a
greenfield build.

The bad news, in priority order:

1. **No single source of truth for financial formulas.** EBITDA, Net Profit,
   and Prime Cost are each computed independently in `Insights.tsx`,
   `Dashboard.tsx`, `generatePDF.ts`, `generateExcel.ts`, and
   `branchComparison.service.ts` — and they've already drifted:
   - `Insights.tsx`: `netProfit = revenue - totalExpenses` (totalExpenses
     includes food cost).
   - `branchComparison.service.ts:118`: `netProfit = revenue - gst - expenses
     - labourCost` — **does not subtract food cost at all.** Different KPI,
     same name.
   - `Dashboard.tsx` prorates fixed/labour costs to the selected date range;
     `Insights.tsx` never prorates (always full-month cost vs. MTD revenue).
     Same restaurant, same day, two different EBITDA numbers depending which
     screen you're on.
2. **No time dimension beyond "rolling window."** The only presets anywhere
   in the app are Today / 7D / 30D / 90D / Custom. There is no calendar year,
   no calendar quarter, no "This Month vs Last Month," no YoY — anywhere.
   Insights.tsx additionally ignores the global date picker entirely and is
   hardcoded to month-to-date.
3. **One fake feature found.** `Dashboard.tsx`'s "Swiggy/Zomato" labels on the
   online-orders panel are `i % 2 === 0 ? "Swiggy" : "Zomato"` — alternating
   by array index, not real platform data. There is no delivery-platform
   field anywhere in the schema.
4. **Zero budget / forecast / scenario / investment infrastructure**, at the
   database level — confirmed by grep, not inference.
5. **Real performance risk** in a handful of specific endpoints (customer
   RFM, vendor history, the admin dashboard, the expense report) that fetch
   entire tables with no date bound and no pagination.

None of this is "build from scratch" work. Most of it is *consolidate,
correct, and extend* work — which is good news for how fast this can move,
but bad news if we skip straight to building IRR/NPV/scenario engines on top
of formulas that already disagree with each other.

---

## 2. Feature Inventory

Legend: ✔ COMPLETE · ⚠ PARTIAL · ❌ MISSING · 🐛 BUG (present but wrong)

### 2.1 Revenue & Sales

| Feature | Status | Files | Notes |
|---|---|---|---|
| Gross Sales / Net Sales | ✔ | `Report.tsx` (P&L Statement tab) | Gross Revenue, Discounts, Net Revenue all shown |
| Daily Sales | ✔ | `Dashboard.tsx`, `Report.tsx` (Day Analysis, Hourly Heatmap) | |
| Average Daily Sales (ADS) | ❌ | — | Never surfaced as a named KPI; not used in break-even calc either |
| Monthly Sales | ✔ | `Insights.tsx` (hardcoded MTD) | |
| Quarterly Sales | ⚠ | `dateRangeSlice.ts` | "90D" = rolling 90 days, **not** calendar Q1–Q4 |
| Yearly Sales | ❌ | — | No yearly preset exists at all |
| Custom Date Sales | ✔ | `DashboardLayout.tsx` Custom picker | |
| Sales Growth / Revenue Growth | ❌ | — | `expectedMonthlyGrowth` is an input *assumption*, never compared to actual growth |
| Average Order Value | ✔ | `Dashboard.tsx`, `analytics.service.ts` | |
| Orders / Customer Count / Repeat Customers | ✔ | multiple | |
| Sales Mix / Channel Mix / Delivery % / Dine-In % / Takeaway % | ✔ | `Report.tsx` P&L, Sales Analytics tabs | |
| Swiggy / Zomato split | 🐛 | `Dashboard.tsx` | **Fake** — `i % 2 === 0 ? "Swiggy" : "Zomato"`, no real platform field in schema |
| QR Orders | ❌ | — | No QR-specific order-source field in `Order`/`Bill`/`RunningOrder` |

### 2.2 Food Cost / COGS

| Feature | Status | Files |
|---|---|---|
| Food Cost, Food Cost % | ✔ | `Insights.tsx` (`effectiveFoodCost`, 3-tier fallback: manual → live inventory value → restock history) |
| Recipe Cost, Ingredient Cost | ✔ | `analyticsAdvanced.service.ts` `recipeCostOf()`, `MenuManagement.tsx` |
| Inventory Consumption, Inventory Value | ✔ | `inventory.service.ts` `getIngredientLifecycleService` |
| Stock Movement | ✔ | `InventoryRestock`, `InventoryAdjustment`, `DailyStockAudit` |
| Purchase Cost | ✔ | `VendorInvoice` |
| Waste Cost / Spoilage | ✔ | `inventory.service.ts` (wastageQty/Percentage/Cost, unaccountedWastage) |
| Prime Cost | ⚠ | `Insights.tsx` only, MTD only, client-side only |
| Gross Profit / Gross Margin % | ✔ | `Insights.tsx` |
| Inventory valuation method (FIFO/weighted-avg) | ❌ | — | Only `qty × current pricePerUnit`, no costing-method ledger |

### 2.3 Labour

| Feature | Status | Files |
|---|---|---|
| Labour Cost, Labour % | ✔ | `branchComparison.service.ts`, `Insights.tsx` |
| Attendance | ✔ | `Attendance`, `AttendanceBreak` models, `Attendance.tsx` |
| Payroll (as a run/period concept) | ⚠ | Only base `User.salary` + hours; no payroll-run entity |
| Bonuses / Incentives / Employer Contributions | ❌ | — | No schema fields anywhere |

### 2.4 Occupancy / Utilities / Opex

| Feature | Status | Files |
|---|---|---|
| Rent | ✔ | `RestaurantInsights.monthlyRent` |
| CAM | ❌ | — | No field, anywhere |
| **Occupancy Cost %** (rent+CAM ÷ revenue) | ❌ | — | Does not exist. **Naming collision warning**: the app already has an "Occupancy %" metric (`Insights.tsx` seat/table utilization) that means something completely different (physical seat usage, not a cost ratio). Building the real financial metric under the same name will be confusing — needs a distinct label. |
| Electricity, Gas, Internet, Maintenance, Marketing, Packaging, Licenses | ✔ | `RestaurantInsights` fields | Static monthly assumptions, not linked to dated `ShopExpense` transactions |
| Water, Cleaning (as distinct line items) | ❌ | — | No dedicated fields (would fall under Misc/Maintenance today) |
| Operating Expenses (aggregate) | ✔ | `Insights.tsx` `totalFixedExpenses + totalVariableExpenses` |

### 2.5 Commissions / Fees

| Feature | Status | Files |
|---|---|---|
| Delivery/Platform Commission | ✔ | `RestaurantInsights.aggregatorCommission` | Single blended %, not split Swiggy vs. Zomato |
| Franchise Fee, Royalty, Marketing Royalty | ❌ | — | No fields anywhere |

### 2.6 Profitability

| Feature | Status | Files |
|---|---|---|
| EBITDA / EBITDA % | 🐛 | `Insights.tsx`, `Dashboard.tsx`, `generatePDF.ts`, `generateExcel.ts` | Computed 4 separate times; **Dashboard prorates to date range, Insights does not** — same restaurant, different numbers |
| Operating Profit | 🐛 | `branchComparison.service.ts:118` | Excludes food cost entirely — mislabeled as "net profit" |
| Net Profit | 🐛 | see Executive Summary | Two incompatible definitions in the same codebase |
| Cash Flow | ❌ | — | `DailyCashSession` is till reconciliation, not a cash-flow statement |
| Contribution Margin | ✔ | `Insights.tsx` |
| Break-even Sales / Orders | ⚠ | `Insights.tsx` | Present, MTD only |
| Break-even ADS | ❌ | — | Not explicitly computed |
| Margin of Safety | ❌ | — | Not found anywhere |
| Break-even Month (multi-month tracking) | ❌ | — | Only current-month snapshot |

### 2.7 Time Dimension (Phase 4 target)

| Period | Status |
|---|---|
| Today, Last 7/30/90 Days, Custom | ✔ |
| Yesterday, Current/Previous Week, Current/Previous Month | ❌ |
| Current/Previous Quarter (calendar-aligned) | ❌ |
| Current/Previous Year | ❌ |
| Rolling 12 Months | ❌ |

### 2.8 Ratios / Variance / Trend (Phase 5 target)

❌ **Missing almost entirely.** A few KPIs show a single current-vs-target
snapshot (EBITDA/food-cost/gross-margin/prime-cost vs. their
`RestaurantInsights` target fields) with no history, no variance-over-time,
no trend arrows, no MoM/QoQ/YoY. The Excel export literally has a "YoY %"
column that always renders `"—"` (`generateExcel.ts:481`) — a placeholder
that was never wired up.

### 2.9 Financial Assumptions Engine (Phase 6 target)

⚠ **Partial** — `RestaurantInsights` + the "Insights Setup" UI already cover
~35 configurable fields (all fixed/variable expenses, 4 financial targets,
GST%, 4 business-assumption %, `manualFoodCost`, `initialInvestment`) and
immediately affect calculations, which is exactly the right pattern. Missing
specifically: rent/sq ft, CAM/sq ft, chargeable area (though `Branch.areaSqFt`
exists and could be reused), labour cost target %, salary increment %, rent
escalation %, utility escalation %, per-platform commission (Swiggy vs.
Zomato vs. direct), franchise fee %, royalty %, working days, and a
formal tax % (only GST% exists, no income-tax assumption).

### 2.10 Scenario Analysis (Phase 7)

❌ **Missing entirely.** Zero matches for "scenario" anywhere in the backend.

### 2.11 Budget vs. Actual (Phase 8)

❌ **Missing entirely.** No `Budget` model, no time-scoped budget entity —
the existing "targets" in `RestaurantInsights` are single live values that get
overwritten on every save, not a per-period budget you can compare a specific
month's actuals against.

### 2.12 Forecasting (Phase 9)

⚠ **Partial.** One forecast exists: `getRevenueForecastService` — a 7-day
rolling-average projection with a flat ±15% band (not derived from historical
variance). No food-cost, labour, profit, or EBITDA forecast. No
monthly/quarterly/yearly horizon — only 7 days out.

### 2.13 Break-even Analysis (Phase 10)

⚠ **Partial** — see 2.6. Core formula exists and works; missing ADS variant,
margin of safety, and month-over-month break-even tracking.

### 2.14 Investment Analysis (Phase 11)

❌ **Missing almost entirely.** Only `RestaurantInsights.initialInvestment`
(one scalar) + a simplistic `ROI% = EBITDA/investment`, `payback =
investment/EBITDA` using *this month's* EBITDA extrapolated — not a real
multi-period cash-flow model. No CAPEX line items (kitchen equipment,
furniture, POS, interior, licenses, security deposit, working capital), no
depreciation, no IRR, no NPV.

### 2.15 Multi-Branch Analytics (Phase 12)

✔ **This is one of the best-built areas in the app.** Proper Prisma
`groupBy`-based branch and city comparison, ranking, winner badges, 13
compared metrics. Gap: food cost, waste, and inventory are not part of the
compared metric set today (only revenue/orders/expenses/labour/profit/
customers).

### 2.16 KPI Targets (Phase 13)

⚠ **Partial.** EBITDA/food-cost/gross-margin/prime-cost have targets +
color-coded health status. Labour %, utility %, occupancy %, delivery % do
not have targets, and there's no single unified "traffic light" summary
widget — the status indicators are scattered across separate advisory cards.

### 2.17 Drill-Down Analytics (Phase 14)

❌ **Missing entirely.** Confirmed zero click-through interactions on any KPI
card across `Insights.tsx`, `Dashboard.tsx`, `Report.tsx`, `BranchComparison.tsx`.

### 2.18 Financial Formula Engine (Phase 15)

❌ **Missing — and the highest-leverage gap in this whole audit.** No backend
calculation service exists for EBITDA/Prime Cost/Net Profit/Break-even at
all (confirmed: these strings appear only in comments in the backend). Every
number is computed independently, client-side, in up to 5 different files.
This is *why* Net Profit and EBITDA already disagree between screens — it's
not a hypothetical risk, it's an active bug.

### 2.19 Dashboards / Reports / Charts (Phases 16–19)

✔ Mostly complete and genuinely good: `Insights.tsx` (2 tabs, ~15 KPI cards),
`Dashboard.tsx` (revenue/orders/EBITDA strip + 6 charts), `Report.tsx` (**12
report tabs**: P&L, Tax, Expense Tracker, Sales Analytics, Discount Analysis,
Menu Engineering, Table Analytics, Waste Report, Stock Lifecycle, Hourly
Heatmap, Day Analysis, Revenue Forecast), `BranchComparison.tsx` (branch +
city comparison). Charts use `recharts` throughout (Bar/Area/Pie/Scatter) plus
a manual heatmap grid. Exports: global "Download" button → ZIP (PDF + Excel +
README), Tax Report tab → standalone Excel. **Gaps**: no CSV export, no print,
no MoM/QoQ/YoY trend arrows anywhere, no drill-down.

### 2.20 Database / Backend / Performance (Phases 20–22)

See the Executive Summary and the detailed backend/schema audit notes below.
Key unbounded-query risks found (no date filter and/or no pagination):
`getCustomerRFMService` (all customers + all their bills, ever),
`getVendorPaymentsService`/`getVendorInvoicesService` (entire vendor history),
`getExpensesReportService` (all expenses when no date range given),
`getDashboardOverviewDataService` (admin dashboard — **no restaurant filter at
all**, scans every tenant). No job scheduler, no Redis, only a 60-second
in-process `Map` cache on one endpoint whose invalidation function has no
callers.

---

## 3. Complete Model Catalog (Prisma) — financial relevance

*(44 models total; full field-by-field detail available in the research
transcript — summarized here to keep this document navigable.)*

Branch-level granularity is present on almost every finance table
(`RestaurantInsights`, `ShopExpense`, `Attendance`, `VendorInvoice`,
`VendorPayment`, `InventoryAdjustment`, `DailyStockAudit`) — good. Two notable
exceptions: `Ingredient` and `IngredientPriceHistory` are restaurant-scoped
only (no `branchId`), so a multi-branch restaurant can't see per-branch
ingredient price differences. `Bill.branchId` and `MenuItem.branchId` are
nullable, meaning some rows can fall outside a branch-level rollup.

No `Budget`, `Forecast`, `Scenario`, `KpiGoal`, `Investment`/`Capex`,
`Depreciation`, or summary/rollup table (`MonthlySummary` etc.) exists in the
schema today.

---

*End of Phase 1–3 audit. See the accompanying chat message for the proposed
Phase 4–25 implementation roadmap and prioritization questions.*
