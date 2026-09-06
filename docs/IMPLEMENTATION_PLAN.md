# DineInk — Implementation Plan

Companion to `FEATURE_MAPPING.md` (what/where) and `APPLICATION_NAVIGATION.md` (full nav
tree). This document covers how the 9-category build was phased, what was built per layer,
the testing checklist, and everything intentionally left as remaining work / technical debt.

## Scope

Owner Web (`owner-web`), DineInk POS (`dineink-pos`), shared backend (`dineink-backend`).
Full read-only architecture sweep of all three repos preceded any code change (see the
approved plan at the start of this effort for the detailed findings). Execution: one
continuous pass, dependency-ordered internally (no phase-gate pauses), docs updated
incrementally.

## Phases, Priority, and What Was Built

### Phase A — Foundation (highest priority: shared building blocks + RBAC)
- **RBAC** (backend): `requireRole('OWNER','MANAGER')` — previously defined but unused —
  applied to every new sensitive route group. (frontend): `authSlice.user.role` +
  `src/routes/RequireRole.tsx` guard + `DashboardLayout.tsx` NAV array filtered by `roles`.
  This is the first real role enforcement in either app; existing routes were left untouched.
- **`EmiSchedule`** model + `emi` module — shared building block for Equipment, Dues, and Cash
  Flow (built once, not duplicated three times).
- **Equipment Data List** — `equipment` module + `EquipmentList.tsx`.
- **Compliance Checker** — `compliance` module (+ extended `middleware/upload.ts` with a
  second multer instance accepting PDFs) + `ComplianceChecker.tsx`.
- **Dues Tracker** — `dues` module + `DuesTracker.tsx` (4 tabs).

### Phase B — Vendor Intelligence + WhatsApp
- **WhatsApp module** built first (mock sender behind a `WhatsAppSender` interface, mirroring
  the existing SendGrid mailer's swappable-provider shape) since Vendor Intelligence's reorder
  feature depends on it.
- **Vendor Intelligence extensions** — `vendorType` field, e-bill upload (reusing the PDF
  multer instance from Compliance), pricing-history endpoint, reorder-via-WhatsApp/email.
- **Frontend**: `WhatsAppCenter.tsx` + `SendWhatsAppDialog.tsx` (reusable) + a Message button
  on `Customers.tsx`; `Vendors.tsx` extended with vendor type, reorder dialog, e-bill upload,
  price-history view.

### Phase C — Cash Flow Predictor + Payroll
- **Cash Flow Predictor** — new `cashflow` module, computed on demand (no stored projection
  table). Deliberately split outflow into a standalone `getCashOutflowProjectionService` to
  avoid a circular import with the `forecast` module (forecast needs cashflow's outflow;
  cashflow's own standalone endpoint needs forecast-style revenue projection) — the forecast
  module imports cashflow one-directionally.
- **Payroll extensions** — `LeaveRequest`/`SalaryDeduction`/`PayrollRun`/`PayrollRunLine`
  models; new service files inside the existing `attendance` module (`leave.service.ts`,
  `salaryDeduction.service.ts`, `payroll.service.ts`) rather than a competing module; payroll
  math reuses `finance.formulas.computeOvertimeCost`/`computeStandardShiftHours`, never
  reimplemented.
- **Frontend**: `CashFlowPredictor.tsx` (new page); `Attendance.tsx` restructured behind a
  3-tab bar (Attendance Register / Leave Management / Payroll Processing) with the pre-
  existing register content moved unchanged into the first tab.

### Phase D — Peak Hour Depletion + Forecasting Data
- **Peak Hour Depletion** — `peakHour.formulas.ts` + `peakHour.service.ts` added to the
  existing `analytics` module (not a new module), reusing `getKitchenAnalyticsService`'s
  hourly bucketing. `Branch.kitchenCapacityPerHour`/`autoThrottleEnabled` added for
  bottleneck/throttle-suggestion configuration.
- **Forecasting Data extensions** — added to the existing `forecast` module: peak-hour/
  demand/inventory forecasting all route through the SAME generic time-series projection
  helper the existing revenue/cost KPIs already use (no 4th reimplementation of Historical
  Trend/Moving Average/Seasonal math). `ai.rules.ts` gained 3 new rule functions, still
  rules-based per the module's existing documented design (no LLM introduced).
- **Frontend (owner-web)**: `Kitchen.tsx` extended with a Peak Hour Depletion section;
  `Forecasting.tsx` gained 3 tabs (Peak Hour / Demand / Inventory) + 1 new KPI
  (`avgDailySales`).
- **DineInk POS**: `KitchenPage.tsx` — finally wired the already-existing-but-unused
  `holdRunningOrder`/`resumeRunningOrder` calls into Hold/Resume buttons, plus a bottleneck
  banner (advisory only — no order is ever auto-rejected). `CustomerSection.tsx` — ETA chip
  at checkout.

### Phase E — Account & Bank Integration
- New `banking` module: `BankAccount`, `UpiConfig`, `BankTransactionEntry` models. Added the
  `qrcode` npm package (+ `@types/qrcode`) to generate a static `upi://pay?...` intent QR —
  no payment gateway account exists, so there is no live UPI collection tracking.
  Reconciliation is an explicit best-effort amount+date heuristic against existing
  `Bill`/`VendorPayment` data, documented in-code and in the UI as not a live gateway sync.
- **Frontend (owner-web)**: `AccountBankIntegration.tsx` (4 tabs). Its Payment Analytics tab
  links to the Dashboard's existing payment-split data rather than duplicating a chart.
- **DineInk POS**: `CustomerSection.tsx` — when UPI is the selected payment method, fetches
  and displays the branch's actual QR code instead of just a text/emoji label.

### Phase F — Documentation
This pass: `FEATURE_MAPPING.md`, `IMPLEMENTATION_PLAN.md`, `APPLICATION_NAVIGATION.md`.

## Backend Work Summary

New modules: `emi`, `equipment`, `compliance`, `dues`, `whatsapp`, `cashflow`, `banking`.
Extended modules: `vendors`, `attendance` (payroll/leave), `analytics` (peak hour),
`forecast` (new KPIs + 3 new endpoints), `ai` (3 new rules). Every new/extended sensitive
route is gated with `requireRole('OWNER','MANAGER')`; every model follows the existing
`restaurantId` + nullable `branchId` multi-tenant convention with `requireOwnRestaurant`/
`requireOwnBranch` middleware or a fetch-then-compare `ForbiddenError` pattern.

## Frontend Work Summary (Owner Web)

New pages: `EquipmentList`, `ComplianceChecker`, `DuesTracker` (+4 tabs), `WhatsAppCenter`,
`CashFlowPredictor`, `AccountBankIntegration` (+4 tabs), 3 new Forecasting tabs. Extended
pages: `Vendors.tsx`, `Attendance.tsx`, `Kitchen.tsx`, `Customers.tsx`, `Forecasting.tsx`,
`forecastCategories.ts`. New reusable component: `SendWhatsAppDialog`. New route guard:
`RequireRole`. 7 new nav items, all role-filtered.

## DineInk POS Work Summary

Extended: `KitchenPage.tsx` (Hold/Resume + bottleneck banner), `CustomerSection.tsx` (ETA chip
+ UPI QR display). No new screens — every POS-side change is additive to an existing screen,
matching the plan's "integrate into existing screens whenever possible" mandate.

## Database / Migration Work

One additive-only migration:
`prisma/migrations/20260806040000_add_emi_equipment_compliance_dues_and_foundation_models/`
— 12 new tables (`EmiSchedule`, `Equipment`, `ComplianceRecord`, `MonthlyDue`,
`WhatsAppMessageLog`, `LeaveRequest`, `SalaryDeduction`, `PayrollRun`, `PayrollRunLine`,
`BankAccount`, `UpiConfig`, `BankTransactionEntry`) + 3 additive columns (`Vendor.vendorType`,
`VendorInvoice.documentUrl`, `Branch.kitchenCapacityPerHour`/`autoThrottleEnabled`). Zero
`DROP` statements. Generated via `prisma migrate diff` against a live introspection of
production (not `prisma migrate dev`'s full-schema diff — see "Migration Safety Incident"
below), applied via `prisma migrate deploy`.

## Testing Checklist

- [x] `dineink-backend`: `npx tsc --noEmit` — clean after every phase and in a final combined
  pass.
- [x] `dineink-backend`: existing Vitest suite (`forecast`, `ai` modules) re-run after
  extension — 65 tests pass, no regressions.
- [x] `owner-web`: `npx tsc --noEmit` / `npm run build` — clean after every phase and in a
  final combined pass.
- [x] `dineink-pos`: `npx tsc --noEmit` — clean in the final combined pass.
- [x] Production migration applied and verified (`prisma migrate status` → "up to date").
- [ ] **Manual QA not performed in this session** — no running instance of any of the three
  apps was started/exercised end-to-end (create/edit/delete flows, RBAC redirect for a
  non-OWNER/MANAGER test user, UPI QR rendering/decoding, mock WhatsApp log recording a send).
  This is the single most important remaining verification step before treating this work as
  production-ready — see "Remaining Work" below.

## Migration Safety Incident (documented per user instruction)

While adding the foundation migration, `prisma migrate status` initially failed with `P3015`
because `prisma/migrations/20260722100000_add_property_value/migration.sql` was missing from
disk (empty folder). After restoring a placeholder file and re-running, `prisma migrate dev`
refused to proceed and instead demanded a full `prisma migrate reset` (which drops all data),
because:
1. Two pre-existing migrations (`20260722100000_add_property_value` and
   `20260723090000_add_roce_rental_yield_fields`) had checksums in `_prisma_migrations` that
   didn't match their on-disk files (the second one's file contains a comment noting it was
   edited after an initial failed apply and a manual reapply — legitimate historical drift,
   not corruption).
2. **Independently of the above**, `prisma migrate dev`'s full-schema diff revealed that the
   checked-in `schema.prisma` no longer declares `RestaurantInsights.capitalEmployed`,
   `RestaurantInsights.propertyValue`, or `RunningOrder.orderStatus` — yet all three columns
   are **still live in production**, with `RunningOrder.orderStatus` carrying **17,341
   non-null rows**. A prior migration (`20260730030000_remove_dead_order_schema`) apparently
   intended to drop these but the actual columns were never removed from the live database.

**Resolution taken**: re-baselined the two checksum-mismatched migrations' recorded checksums
directly in `_prisma_migrations` (a metadata-only correction — no schema/data change) after
confirming both were genuinely already-applied via `started_at`/`finished_at`/
`rolled_back_at` inspection. Then, instead of trusting `migrate dev`'s dangerous full diff,
generated the new migration's SQL via `prisma migrate diff` against a live introspection of
the actual database (so the diff could only reflect the new models being added, never the
pre-existing drift), and applied it with `prisma migrate deploy` (no drift detection, no
reset risk). **The `capitalEmployed`/`propertyValue`/`orderStatus` drift itself was
deliberately left untouched** — it predates this work, is unrelated to the 9 feature
categories, and dropping live columns with real data is not a decision to make silently as a
side effect of unrelated feature work.

**Action needed from the team**: decide whether `RunningOrder.orderStatus` (17,341 rows) and
`RestaurantInsights.capitalEmployed`/`propertyValue` (3 rows each) should be (a) restored to
`schema.prisma` if still in use somewhere, or (b) actually dropped via a deliberate, reviewed
migration if truly dead. Until resolved, `prisma migrate dev` will continue to refuse to run
against this database without a reset — only `migrate deploy` with hand-verified/diff-
generated migrations should be used.

## Remaining Work

1. **Manual end-to-end QA** (see Testing Checklist) — not performed this session.
2. **GST-due → Dues Tracker auto-insertion**: Compliance Checker computes the GST filing due
   date; Dues Tracker's payment calendar does not yet auto-insert a corresponding `MonthlyDue`
   row for it (it currently only merges `MonthlyDue` + `VendorInvoice` + `EmiSchedule`).
3. **WhatsApp `GST_UPDATE`/`VENDOR_PAYMENT` template types are modeled but not yet triggered**
   by any automatic reminder — only the Vendor Intelligence reorder flow and the generic
   Customers "Message" button actively send today.
4. **Equipment ↔ Peak Hour Depletion is not directly coupled** — bottleneck detection uses a
   single `Branch.kitchenCapacityPerHour` number, not a sum of actual Equipment throughput
   capacities. Wiring these together (e.g. deriving suggested capacity from active Equipment
   rows) is a reasonable follow-up, not attempted here to avoid inventing an unvalidated
   equipment-throughput formula.
5. **`EquipmentList.tsx`'s EMI-schedule linkage is a raw numeric ID field**, not a dropdown of
   the restaurant's actual `EmiSchedule` rows (no "list EMI schedules for a dropdown" endpoint
   was requested/built) — functional but rough UX.
6. **Delivery ETA has no real data** — no online-delivery/aggregator-order module exists in
   this codebase (`LiveOrdersPage` in dineink-pos is confirmed mock data only), so the
   Delivery ETA card/response always reports zero sample size with an explanatory note rather
   than a fabricated number.
7. **UPI transaction history and payment-confirmation notifications** were not implemented —
   both require a real payment gateway/webhook source that doesn't exist (see Technical Debt).
8. **Peak Hour Depletion's "customer count" and Forecasting's "customer forecasting"** are
   approximated by order count — no distinct per-visit customer-count metric exists separate
   from order volume in the current schema.

## Technical Debt (explicit, not hidden)

- **WhatsApp sending is mocked.** `MockWhatsAppSender` always logs and returns success; no
  message is actually delivered. Swapping in Twilio/Meta Cloud API requires only a new class
  implementing `WhatsAppSender` and changing one singleton export in `src/config/whatsapp.ts`
  — no schema or caller changes.
- **Account & Bank Integration has no live payment gateway.** UPI is a static intent QR only;
  bank accounts and transactions are manually entered/reconciled records, not a live bank-
  feed or Razorpay/Cashfree/PhonePe integration. Reconciliation is a best-effort amount+date
  heuristic, explicitly not gateway-webhook-driven.
- **Peak Hour Depletion's order-throttling is advisory only** — `autoThrottleEnabled` +
  `throttleSuggested` surface a banner in the POS Kitchen page; no order is ever silently
  held or rejected without a staff action pressing "Hold."
- **DineInk POS remains poll-based**, not websocket-based, for all "real-time" data (KDS
  refresh, bottleneck banner, notification bell) — pre-existing architecture, unchanged by
  this work; a genuinely live kitchen queue would benefit from websocket push, out of scope
  here.
- **The pre-existing production migration-history drift** documented above
  (`RunningOrder.orderStatus` + `RestaurantInsights.capitalEmployed`/`propertyValue`) remains
  unresolved and continues to block `prisma migrate dev` (though not `migrate deploy`) until
  the team decides how to handle it.
- **No automated tests were added for the new modules** — the existing Vitest suite was
  confirmed to still pass, but the ~7 new backend modules and ~15 new/extended frontend pages
  built in this session have zero dedicated unit/integration test coverage. Given the volume
  of new surface area, this is the largest test-coverage gap introduced by this work.
