# DineInk — Feature Mapping

Generated after implementing the 9 feature categories (Cash Flow Predictor, Vendor
Intelligence, WhatsApp Integration, Compliance Checker, Dues Tracker, Equipment Data List,
Peak Hour Depletion, Forecasting Data, Account & Bank Integration) across `owner-web`,
`dineink-pos`, and the shared `dineink-backend`. One entry per feature/sub-feature so any
developer can locate it without searching the codebase.

Legend — **Status**: Existing (untouched) / Modified (extended) / New. **Project**: Owner Web
/ DineInk POS / Shared (backend only, consumed by both, or spans all three).

---

## 1. Cash Flow Predictor

| Sub-Feature | Status | Project | Navigation Path |
|---|---|---|---|
| Cash inflow (daily) | New | Owner Web + Shared | Cash Flow → Recent Daily Cash Inflow chart |
| Vendor payments tracking | Modified | Shared (reused) | Cash Flow → Upcoming Vendor Payments Due |
| Payroll → Attendance | Existing | Owner Web + Shared | Attendance → Attendance Register tab |
| Payroll → Overtime (OT) | Existing | Shared | computed via `finance.formulas.computeOvertimeCost`, shown in Attendance Register and Payroll Processing |
| Payroll → Leave management | New | Owner Web + Shared | Attendance → Leave Management tab |
| Payroll → Salary deductions | New | Owner Web + Shared | Attendance → Payroll Processing tab → Record Deduction |
| Payroll → Salary processing | New | Owner Web + Shared | Attendance → Payroll Processing tab → Run Payroll |
| GST due tracking | New | Owner Web + Shared | Compliance → GST Filing card; surfaced again in Cash Flow → GST outflow |
| GST filing | Existing (report) + New (due tracking) | Shared | `reports.service.ts` GSTR-3B report (existing); due-date tracking new in Compliance |
| EMI schedule tracking | New | Owner Web + Shared | Cash Flow → EMI outflow + Upcoming EMI Payments Due; also under Equipment (linked EMI) and Dues (EMI category) |

**Purpose**: project upcoming cash inflow vs. outflow (vendor dues, payroll, GST, EMI) over a
week/month/quarter horizon so an owner can see a projected shortfall before it happens.

**UI Screen**: `src/pages/cashflow/CashFlowPredictor.tsx` — horizon selector (Week/Month/
Quarter), KPI row (Projected Inflow / Outflow / Net Cash Flow + 4-way outflow breakdown),
danger `Alert` on negative net cash flow, inflow-vs-outflow bar chart, 30-day daily inflow
line chart, two due-items tables.

**Menu**: "Cash Flow" (owner-web sidebar, OWNER/MANAGER only) → `/dashboard/cash-flow`.

**Backend APIs**:
- `GET /api/cashflow/:restaurantId/:branchId/projection?horizon=week|month|quarter`
- `GET /api/cashflow/:restaurantId/:branchId/inflow-daily?from=&to=`
- Forecast module's `cashFlow` KPI (`GET /api/forecasts/...`) is wired to
  `getCashOutflowProjectionService` + the forecast's own revenue projection.

**Database Tables**: `EmiSchedule`, `MonthlyDue`, `VendorInvoice` (existing), `Bill` (existing),
`ComplianceRecord` (GST_FILING type), `User.salary` (existing).

**Backend Services**: `src/modules/cashflow/cashflow.service.ts` (`getCashFlowProjectionService`,
`getCashOutflowProjectionService`, `getDailyCashInflowService`); reuses
`getPaymentCalendarService` (dues), `computeNextGstFilingDueDate` + `getGstFilingReportService`
(compliance/reports), `finance.formulas.computeOvertimeCost`.

**Components/Hooks/Utils Used**: `PageContainer`, `PageHeader`, `MetricCard`, `Alert`,
`ChartCard`, `DataTable`, recharts.

**Permissions**: OWNER, MANAGER only (`requireRole` backend, `RequireRole` frontend guard).

**Dependencies/Related Features**: [[emi-schedule]], [[dues-tracker]], [[compliance-checker]]
(GST due date), [[payroll-extensions]].

---

## 2. Vendor Intelligence

| Sub-Feature | Status | Project | Navigation Path |
|---|---|---|---|
| Vendor types management | Modified | Owner Web + Shared | Vendors → vendor type field + filter pills |
| Payment schedule and tracking | Existing | Owner Web + Shared | Vendors → vendor detail → Invoices |
| Amount due tracking | Existing | Owner Web + Shared | Vendors → Outstanding column |
| Reorder through WhatsApp or email | New | Owner Web + Shared | Vendors → per-row Reorder action → dialog |
| E-bills tracking | New | Owner Web + Shared | Vendors → invoice form → "Attach e-bill" + "View e-bill" link |
| Pricing tracking → Previous pricing | Existing | Shared | `IngredientPriceHistory` model |
| Pricing tracking → Current pricing | Existing | Shared | `Ingredient.pricePerUnit` |
| Pricing tracking → Price comparison/history | New (UI) | Owner Web + Shared | Vendors → per-row Price History action → dialog |

**Purpose**: categorize vendors, track what's owed and due, trigger a reorder message to a
vendor, capture scanned e-bills against purchase invoices, and see how a vendor's ingredient
pricing has moved over time.

**UI Screen**: `src/pages/vendors/Vendors.tsx` (extended) + `src/pages/vendors/ReorderDialog.tsx`
(new).

**Menu**: "Vendors" (existing nav item) → `/dashboard/vendors`.

**Backend APIs**:
- Existing: `GET/POST /api/vendors/*` (payments, invoices, outstanding, performance) — now
  also accept/return `vendorType`.
- New: `GET /api/vendors/:vendorId/pricing-history`, `POST /api/vendors/:vendorId/reorder`
  (body `{channel: "whatsapp"|"email", ingredientIds}`).
- `POST /api/vendors/invoices` now accepts multipart with a `document` field for e-bill upload.

**Database Tables**: `Vendor` (+`vendorType`), `VendorInvoice` (+`documentUrl`),
`IngredientPriceHistory`, `IngredientVendor` (existing, reused for the pricing-history join).

**Backend Services**: `src/modules/vendors/vendor.service.ts` (`getVendorPricingHistoryService`,
`reorderVendorService`), `src/modules/ingredients/ingredient.service.ts` (vendorType on
create/update), `src/config/mailer.ts` (`sendReorderEmail`, new).

**Dialog/Drawer**: vendor create/edit modal (extended), reorder dialog (new), price-history
modal (new), invoice creation modal (extended with file input).

**Components/Utils Used**: `StatusChip` (vendor type badge), the app's hand-rolled modal
pattern (this page doesn't use the design-system `Dialog`), `middleware/upload.ts`'s
`uploadDocument` (shared with Compliance Checker).

**Permissions**: existing vendor routes unchanged (no new role gate); the two NEW routes
(pricing-history, reorder) require OWNER/MANAGER.

**Related Features**: [[whatsapp-integration]] (reorder channel), [[compliance-checker]]
(shares the `uploadDocument` multer instance).

---

## 3. WhatsApp Integration

| Sub-Feature | Status | Project | Navigation Path |
|---|---|---|---|
| Customer messaging through WhatsApp | New | Owner Web + Shared | Customers → per-row Message action |
| Vendor e-bill tracking | New (via reorder) | Owner Web + Shared | Vendors → Reorder dialog (channel: WhatsApp) |
| Vendor payment tracking | New (template type reserved) | Shared | `WhatsAppMessageLog.templateType = VENDOR_PAYMENT` (logged, not yet triggered by a specific UI action beyond reorder) |
| GST registration and filing updates via WhatsApp | New (template type reserved) | Shared | `WhatsAppMessageLog.templateType = GST_UPDATE` (model/API ready; not yet wired to an automatic GST-due reminder trigger — see tech debt) |

**Purpose**: send WhatsApp messages to customers/vendors and keep a log of what was sent —
currently backed by a **mock sender** (no real WhatsApp Business/Twilio/Meta Cloud API account
exists), so messages are logged, not actually delivered, until a real provider is configured.

**UI Screen**: `src/pages/whatsapp/WhatsAppCenter.tsx` (new) + reusable
`src/components/common/SendWhatsAppDialog.tsx` (new, also used from Customers.tsx and
Vendors.tsx's reorder flow indirectly via the backend service).

**Menu**: "WhatsApp" (owner-web sidebar, OWNER/MANAGER only) → `/dashboard/whatsapp`.

**Backend APIs**: `POST /api/whatsapp/send`, `GET /api/whatsapp/:restaurantId?branchId=&limit=`.

**Database Tables**: `WhatsAppMessageLog`.

**Backend Services**: `src/config/whatsapp.ts` (`WhatsAppSender` interface,
`MockWhatsAppSender`, singleton `whatsAppSender`), `src/modules/whatsapp/whatsapp.service.ts`
(`sendWhatsAppMessageService` — the one function every other module calls to send a message;
`getWhatsAppLogsService`).

**Components Used**: `SendWhatsAppDialog` (reusable), `DataTable`, `MetricCard`, `StatusChip`.

**Permissions**: OWNER, MANAGER only.

**Dependencies**: consumed by [[vendor-intelligence]] (reorder) and available for future
[[compliance-checker]] GST reminders. **Known limitation**: mock sender only — see
IMPLEMENTATION_PLAN.md technical debt.

---

## 4. Compliance Checker

| Sub-Feature | Status | Project | Navigation Path |
|---|---|---|---|
| FSSAI compliance tracking | New | Owner Web + Shared | Compliance → FSSAI card |
| Fire safety compliance | New | Owner Web + Shared | Compliance → Fire Safety card |
| Pest control compliance | New | Owner Web + Shared | Compliance → Pest Control card |
| GST filing compliance | Modified (reuses existing report) | Owner Web + Shared | Compliance → GST Filing card |

**Purpose**: track license/certificate numbers, issue/expiry/next-due dates, and renewal
status for the four compliance types a restaurant must maintain, with document upload.

**UI Screen**: `src/pages/compliance/ComplianceChecker.tsx` — one card per type (always
visible even with no record yet), KPI row (Valid/Expiring Soon/Expired/Due), Edit/Renew/
Upload/Delete actions.

**Menu**: "Compliance" (owner-web sidebar, OWNER/MANAGER only) → `/dashboard/compliance`.

**Backend APIs**: `GET /api/compliance/:restaurantId/:branchId`,
`GET /api/compliance/:restaurantId/:branchId/summary`, `POST /api/compliance`,
`PUT /api/compliance/:id`, `DELETE /api/compliance/:id`, `POST /api/compliance/upload`.

**Database Tables**: `ComplianceRecord`.

**Backend Services**: `src/modules/compliance/compliance.service.ts`
(`computeNextGstFilingDueDate` — reused by Cash Flow Predictor and Dues Tracker rather than
recomputed; `computeStatus`, full CRUD). `src/middleware/upload.ts`'s new `uploadDocument`
multer instance (images + PDF, 5MB) — shared with Vendor Intelligence's e-bill upload.

**Dialog/Drawer**: Add/Edit compliance record dialog (type locked to the card it was opened
from).

**Permissions**: OWNER, MANAGER only.

**Related Features**: GST due date is the single source of truth read by [[cash-flow-predictor]]
and [[dues-tracker]] — neither recomputes the GSTR-3B due-date rule itself.

---

## 5. Dues Tracker

| Sub-Feature | Status | Project | Navigation Path |
|---|---|---|---|
| Monthly expenses → EB | New | Owner Web + Shared | Dues → Monthly Expenses tab |
| Monthly expenses → Salaries | New | Owner Web + Shared | Dues → Monthly Expenses tab |
| Monthly expenses → Rent | New | Owner Web + Shared | Dues → Monthly Expenses tab |
| Monthly expenses → Operations | New | Owner Web + Shared | Dues → Monthly Expenses tab |
| Monthly expenses → Utilities | New | Owner Web + Shared | Dues → Monthly Expenses tab |
| Monthly expenses → Maintenance | New | Owner Web + Shared | Dues → Monthly Expenses tab |
| Monthly expenses → Miscellaneous | New | Owner Web + Shared | Dues → Monthly Expenses tab |
| Monthly expenses → EMI | New | Owner Web + Shared | Dues → Monthly Expenses tab (category=EMI) + EMI schedules |
| Payment day tracker | New | Owner Web + Shared | Dues → Payment Day Tracker tab |
| Vendor payment day tracker | Modified (reused) | Owner Web + Shared | Dues → Payment Day Tracker tab (source=VENDOR_INVOICE) |
| Previous month expenses | New | Owner Web + Shared | Dues → Month Comparison tab |
| Month-to-month comparison | New | Owner Web + Shared | Dues → Month Comparison tab (bar chart + % change table) |
| EBITDA tracking | Modified (reused) | Owner Web + Shared | Dues → EBITDA tab |

**Purpose**: track the 8 recurring monthly expense categories with due/paid status, a unified
payment calendar (dues + vendor invoices + EMI in one list), month-over-month comparison, and
an EBITDA snapshot — without recomputing EBITDA (calls the existing finance engine).

**UI Screen**: `src/pages/dues/DuesTracker.tsx` (tab container) + `MonthlyExpensesTab.tsx`,
`PaymentDayTrackerTab.tsx`, `MonthComparisonTab.tsx`, `EbitdaTab.tsx`, `duesShared.ts`.

**Menu**: "Dues" (owner-web sidebar, OWNER/MANAGER only) → `/dashboard/dues`.

**Backend APIs**: `GET /api/dues/:restaurantId/:branchId?month=&year=`,
`GET /api/dues/:restaurantId/:branchId/payment-calendar?from=&to=`,
`GET /api/dues/:restaurantId/:branchId/month-comparison?month=&year=`,
`GET /api/dues/:restaurantId/:branchId/ebitda-summary?month=&year=`,
`POST/PUT/DELETE /api/dues[...]`.

**Database Tables**: `MonthlyDue`, plus reads from `VendorInvoice` and `EmiSchedule` for the
payment calendar (no duplicate due-date model created).

**Backend Services**: `src/modules/dues/dues.service.ts` — its payment-calendar function
reuses `getUpcomingEmiDuesService` (emi module) rather than reimplementing the EMI due-date
walk; its EBITDA function calls `computePeriodMetrics` (finance module) rather than
recomputing EBITDA.

**Permissions**: OWNER, MANAGER only.

**Related Features**: [[emi-schedule]] (EMI category + calendar), [[compliance-checker]] (GST
due date, not yet auto-inserted as a MonthlyDue row — see tech debt).

---

## 6. Equipment Data List

| Sub-Feature | Status | Project | Navigation Path |
|---|---|---|---|
| Equipment master list | New | Owner Web + Shared | Equipment → main table |
| Equipment capacity | New | Owner Web + Shared | Equipment → Capacity column / form field |
| Volume | New | Owner Web + Shared | Equipment → Capacity/Volume column / form field |
| Number of items it can contain | New | Owner Web + Shared | Equipment → form field (`itemCapacityCount`) |
| Power consumption (kW) | New | Owner Web + Shared | Equipment → Power column / form field |
| Purchase price | New | Owner Web + Shared | Equipment → form field |
| EMI options | New | Owner Web + Shared | Equipment → EMI column (links to `EmiSchedule`) |
| Warranty | New | Owner Web + Shared | Equipment → Warranty Expiry column (color-coded) |
| Service details | New | Owner Web + Shared | Equipment → form fields (provider name/contact) |
| Installation date | New | Owner Web + Shared | Equipment → form field |
| Expected lifespan | New | Owner Web + Shared | Equipment → form field (months) |
| Maintenance schedule | New | Owner Web + Shared | Equipment → Next Maintenance column + KPI + Alert |

**Purpose**: a master inventory of a branch's kitchen/operational equipment with full
lifecycle data (purchase, EMI, warranty, maintenance), used elsewhere as a factual reference
(e.g. related to Peak Hour Depletion's bottleneck concept, though not yet directly coupled —
see tech debt).

**UI Screen**: `src/pages/equipment/EquipmentList.tsx`.

**Menu**: "Equipment" (owner-web sidebar, OWNER/MANAGER only) → `/dashboard/equipment`.

**Backend APIs**: `GET /api/equipment/:restaurantId/:branchId`,
`GET /api/equipment/:restaurantId/:branchId/maintenance-due?withinDays=`,
`POST /api/equipment`, `PUT /api/equipment/:id`, `DELETE /api/equipment/:id`.

**Database Tables**: `Equipment` (FK to `EmiSchedule`, optional).

**Backend Services**: `src/modules/equipment/equipment.service.ts`.

**Dialog/Drawer**: Add/Edit Equipment dialog (grouped: Basic Info / Capacity & Power /
Purchase & Financial / Installation & Warranty / Service & Maintenance).

**Permissions**: OWNER, MANAGER only.

**Related Features**: [[emi-schedule]] (financed equipment).

---

## 7. Peak Hour Depletion

| Sub-Feature | Status | Project | Navigation Path |
|---|---|---|---|
| Peak hour analysis | Modified (existing peak-hour label extended) | Owner Web + Shared | Kitchen → Peak Hour Depletion section |
| Customer count | Partial (order count only — no distinct customer-count metric exists) | Owner Web + Shared | Kitchen → Peak Hour Depletion (hourly orders) |
| Order count | Existing | Owner Web + Shared | Kitchen (existing hourly throughput chart) |
| Waiting time | Modified (relabeled `avgTime` as `avgWaitMinutes`) | Owner Web + Shared | Kitchen → Peak Hour Depletion |
| Staff requirement analysis | New | Owner Web + Shared | Kitchen → Peak Hour Depletion chart (staff bars) |
| Equipment requirement analysis | Partial (capacity-threshold based, not linked to specific Equipment rows — see tech debt) | Shared | `Branch.kitchenCapacityPerHour` bottleneck check |
| Kitchen space utilization | Partial (utilization % = orders ÷ configured capacity) | Owner Web + Shared | Kitchen → live status row |
| Equipment bottleneck detection | Partial (same capacity-threshold model) | Owner Web + Shared | Kitchen → live status row + hourly bar coloring |
| Kitchen capacity monitoring | New | Owner Web + Shared | Kitchen → live status row (queue depth, utilization %) |
| Automatic item hold/pause | New (advisory only) | DineInk POS + Shared | POS Kitchen page → bottleneck banner + manual Hold/Resume button |
| Dynamic order throttling | Partial (suggestion only, never automatic) | DineInk POS + Shared | `Branch.autoThrottleEnabled` + `throttleSuggested` flag |
| Live production queue | Existing (RunningOrder ACTIVE list) + New (queue depth exposed) | DineInk POS + Shared | POS Kitchen page (existing) + new `current.queueDepth` |
| Intelligent order completion time prediction → Dine-in ETA | New | Owner Web + DineInk POS + Shared | Kitchen page ETA card; POS checkout ETA chip |
| → Takeaway ETA | New | Owner Web + DineInk POS + Shared | same as above |
| → Delivery ETA | New (documented gap — no data yet) | Owner Web + Shared | Kitchen page ETA card shows "No delivery order data yet" |

**Purpose**: turn the existing historical kitchen analytics into a forward-looking capacity
signal — recommended staff headcount per hour, a live bottleneck/utilization indicator, and a
per-order-type completion-time estimate — surfaced on both the owner dashboard and the POS
kitchen display, with an advisory (never automatic) hold suggestion.

**UI Screen**: `src/pages/kitchen/Kitchen.tsx` (extended, owner-web);
`src/features/kitchen/pages/KitchenPage.tsx` (extended, dineink-pos);
`src/components/billing/CustomerSection.tsx` (extended, dineink-pos — ETA chip).

**Menu**: "Kitchen" (existing, owner-web) → `/dashboard/kitchen`; POS "Kitchen" tab (existing).

**Backend APIs**: `GET /api/analytics/:restaurantId/:branchId/peak-hour-analysis?from=&to=`,
`GET /api/analytics/:restaurantId/:branchId/eta-prediction?orderType=`.

**Database Tables**: `Branch` (+`kitchenCapacityPerHour`, +`autoThrottleEnabled`), reads from
`RunningOrder`.

**Backend Services**: `src/modules/analytics/peakHour.formulas.ts`
(`computeStaffRequirement`, `computeBottleneckStatus`, `computeEtaPrediction` — a documented
rules-based heuristic, not ML), `src/modules/analytics/peakHour.service.ts`
(`getPeakHourAnalysisService` reuses `getKitchenAnalyticsService`'s hourly bucketing;
`getEtaPredictionService`).

**Card/Widget**: live status `MetricCard` row + warning `Alert`, staff/bottleneck bar chart,
3 ETA `MetricCard`s (owner-web); orange bottleneck banner + Hold/Resume buttons + HELD
`StatusBadge` (POS); ETA chip (POS checkout).

**Permissions**: same as existing analytics/kitchen routes (no new role gate — kept
consistent with pre-existing access).

**Related Features**: [[forecasting-data]] reuses `computeStaffRequirement` for staff-
requirement *forecasting* (forward-projected, vs. this feature's current/historical view).

---

## 8. Forecasting Data

| Sub-Feature | Status | Project | Navigation Path |
|---|---|---|---|
| Revenue forecasting | Existing | Owner Web + Shared | Forecasting → Overview tab |
| Sales forecasting | Existing (= Orders KPI) | Owner Web + Shared | Forecasting → Overview tab |
| ADS forecasting | New (`avgDailySales` KPI) | Owner Web + Shared | Forecasting → Overview tab (Revenue & Volume group) |
| GPM forecasting | Existing (`grossProfitMarginPercentage`, confirmed no duplicate needed) | Owner Web + Shared | Forecasting → Overview tab (Profitability group) |
| EBITDA forecasting | Existing | Owner Web + Shared | Forecasting → Overview tab |
| Peak hour forecasting | New | Owner Web + Shared | Forecasting → Peak Hour tab |
| Customer forecasting | Partial (no distinct customer-count forecast; Orders KPI is the closest proxy) | Owner Web + Shared | Forecasting → Overview tab (Orders) |
| Order forecasting | Existing | Owner Web + Shared | Forecasting → Overview tab |
| Demand forecasting | New | Owner Web + Shared | Forecasting → Demand tab |
| Inventory & stock forecasting | New | Owner Web + Shared | Forecasting → Inventory tab |
| Stock usage analytics | Modified (feeds demand forecast) | Shared | consumption series built from paid Bills × recipes |
| Inventory forecasting | New | Owner Web + Shared | Forecasting → Inventory tab |
| Staff requirement forecasting | New | Owner Web + Shared | Forecasting → Peak Hour tab (Projected Staff Requirement card) |
| Cash flow forecasting | New (previously stubbed) | Owner Web + Shared | Forecasting → Overview tab (Cash Flow KPI), wired to [[cash-flow-predictor]] |
| Expense forecasting | Existing | Owner Web + Shared | Forecasting → Overview tab (Cost of Goods / Fixed & Operating Costs groups) |
| Profit forecasting | Existing | Owner Web + Shared | Forecasting → Overview tab (Profitability group) |
| EBITDA target forecasting | Existing | Owner Web + Shared | Forecasting → Overview + Accuracy tabs |
| Business trend analysis | Existing | Owner Web + Shared | Forecasting → Accuracy tab |
| Detailed forecasting analytics | Existing | Owner Web + Shared | Forecasting → Branch Comparison + Reports tabs |
| AI-driven recommendations | Modified (3 new rule functions) | Owner Web + Shared | AI Financial Advisor → Insights tab |

**Purpose**: extend the existing 3-model (Historical Trend/Moving Average/Seasonal) forecast
engine with the remaining requested forecast dimensions, reusing its generic time-series
projection helper rather than building a parallel forecasting mechanism per KPI.

**UI Screen**: `src/pages/forecast/Forecasting.tsx` (+3 tabs) — `PeakHourForecastTab.tsx`,
`DemandForecastTab.tsx`, `InventoryForecastTab.tsx` (new); `forecastCategories.ts` (+1 KPI).

**Menu**: "Forecasting" (existing) → `/dashboard/forecasting`.

**Backend APIs**: `GET /api/forecasts/:restaurantId/peak-hour?branchId=&period=&model=`,
`GET /api/forecasts/:restaurantId/demand?branchId=&period=&model=&topN=`,
`GET /api/forecasts/:restaurantId/inventory?branchId=&model=&topN=`. Existing
`generateForecastService` response now includes `avgDailySales` and a real (non-null)
`cashFlow` KPI.

**Database Tables**: reads `Bill`, `MenuItemIngredient`, `Ingredient` (no new tables).

**Backend Services**: `src/modules/forecast/forecast.service.ts` (extended:
`getPeakHourForecastService`, `getDemandForecastService`, `getInventoryForecastService`,
`buildIngredientConsumptionSeries`, `projectDailyConsumption`); `src/modules/ai/ai.rules.ts`
(+`predictedStockOutRisk`, `predictedStaffShortfallRisk`, `growingPeakHourDemandOpportunity`).

**Permissions**: same as existing `/forecasts` routes (unchanged).

**Related Features**: [[peak-hour-depletion]] (shared staff-requirement formula),
[[cash-flow-predictor]] (cashFlow KPI wiring).

---

## 9. Account & Bank Integration

| Sub-Feature | Status | Project | Navigation Path |
|---|---|---|---|
| Bank account integration | New (records only, no live bank connection) | Owner Web + Shared | Banking → Bank Accounts tab |
| UPI integration | New (static UPI ID, no gateway) | Owner Web + Shared | Banking → UPI tab |
| Display restaurant UPI QR code | New | Owner Web + DineInk POS + Shared | Banking → UPI tab; POS checkout (when UPI selected) |
| Display restaurant UPI ID | New | Owner Web + Shared | Banking → UPI tab |
| Accept customer payments | Partial (QR display only — payment itself happens in the customer's own UPI app, not tracked back to this system) | DineInk POS | POS checkout payment-method selection (existing) |
| Link multiple bank accounts | New | Owner Web + Shared | Banking → Bank Accounts tab (multi-branch) |
| Payment settlement tracking | Partial (manual transaction entry, not live settlement) | Owner Web + Shared | Banking → Transactions tab |
| Payment status tracking | Existing (Bill.status) | Shared | Bills page (existing) |
| Automatic payment reconciliation | Partial (best-effort amount+date heuristic, not a live gateway sync) | Owner Web + Shared | Banking → Transactions tab → Reconcile button |
| Daily bank transaction history | New (manual entry) | Owner Web + Shared | Banking → Transactions tab |
| UPI transaction history | Not implemented (no gateway to source this from) | — | — see tech debt |
| Payment analytics | Modified (links to existing Dashboard payment-split data, not duplicated) | Owner Web | Banking → Payment Analytics tab |
| QR code management | New | Owner Web + Shared | Banking → UPI tab |
| Multi-branch bank account management | New | Owner Web + Shared | Banking → Bank Accounts tab |
| Payment confirmation notifications | Not implemented | — | see tech debt |
| Automatic invoice/payment mapping | Partial (= the reconciliation heuristic above) | Owner Web + Shared | Banking → Transactions tab |
| Refund management | Existing (untouched) | Owner Web + DineInk POS + Shared | Orders page (POS) → Refund action; `BillRefund` model |

**Purpose**: give an owner a place to record their bank accounts and UPI ID, generate a
scannable UPI QR (no payment gateway account exists, so this is a static intent QR the
customer's own UPI app handles), and manually log/reconcile bank transactions against bills
and vendor payments. **Explicitly not** a live payment-gateway integration — documented as a
known limitation, not hidden.

**UI Screen**: `src/pages/banking/AccountBankIntegration.tsx` (tab container) +
`BankAccountsTab.tsx`, `UpiTab.tsx`, `TransactionsTab.tsx`, `PaymentAnalyticsTab.tsx`,
`types.ts`; `src/components/billing/CustomerSection.tsx` (dineink-pos, UPI QR at checkout).

**Menu**: "Banking" (owner-web sidebar, OWNER/MANAGER only) → `/dashboard/banking`.

**Backend APIs**: `GET/POST/PUT/DELETE /api/banking/accounts[...]`,
`GET /api/banking/upi/:restaurantId/:branchId`, `PUT /api/banking/upi`,
`GET /api/banking/upi/:restaurantId/:branchId/qr`,
`GET/POST/PUT/DELETE /api/banking/transactions[...]`,
`POST /api/banking/transactions/:restaurantId/:branchId/reconcile`.

**Database Tables**: `BankAccount`, `UpiConfig`, `BankTransactionEntry`. Refunds reuse the
existing `BillRefund`/`Bill.refundedAmount` — no duplicate model.

**Backend Services**: `src/modules/banking/banking.service.ts` (new `qrcode` npm dependency
for QR generation — `generateUpiQrService`; `reconcileTransactionsService`'s best-effort
matcher against `Bill.total` and `VendorPayment.amount`/`paymentDate`).

**Permissions**: OWNER, MANAGER only.

**Related Features**: refunds link to the existing Orders/Bills refund flow rather than
duplicating it.
