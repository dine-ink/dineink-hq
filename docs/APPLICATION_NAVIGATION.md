# DineInk — Application Navigation

Full navigation tree for **Owner Web** and **DineInk POS** after this build. Items marked
🆕 were added in this effort; everything else pre-existed. Owner Web's sidebar is a flat list
(no sub-menus) — items marked 🔒 are visible/reachable only to `OWNER`/`MANAGER` roles (new
in this effort — RBAC didn't previously exist on this frontend).

---

## Owner Web (`owner-web`)

Sidebar (`src/layouts/DashboardLayout.tsx`), in on-screen order:

1. **Dashboard** → `/dashboard` — EBITDA/revenue/expense KPIs, breakeven, delivery
   profitability. *(Payment Analytics tab in Banking links back here for the existing
   payment-method-split data.)*
2. **Shops** → `/dashboard/shops` — branches, tables, QR ordering, GST/service-charge config.
3. **Bills** → `/dashboard/bills` — bill list, detail drawer, date/status filter.
4. **Customers** → `/dashboard/customers` — customer list/analytics, repeat rate.
   - 🆕 **Message** action per row → opens `SendWhatsAppDialog` (recipient prefilled,
     template `CUSTOMER_MARKETING`).
5. **Operations** (Menu Management) → `/dashboard/menu-management` — menu engineering,
   ingredients, add-ons, SOP, vendor-linked restock.
6. **Insights** → `/dashboard/insights` — EBITDA/break-even/finance-cost KPI dashboard.
7. **Reports** → `/dashboard/reports` — Excel/PDF report generation.
8. **Financial Statements** → `/dashboard/financial-statements` — P&L-style statements.
9. **Budget vs Actual** → `/dashboard/budget` — Overview / Budgets / Branch Comparison /
   Reports tabs.
10. **Scenario Analysis** → `/dashboard/scenario-analysis` — What-If Engine (Overview /
    Scenarios / Comparison / Branch Comparison / Reports).
11. **Forecasting** → `/dashboard/forecasting`
    - Overview tab — KPI groups incl. Revenue & Volume (now includes 🆕 **Average Daily
      Sales**), Cost of Goods, Labour, Fixed & Operating Costs, Profitability, Break-even,
      and the now-real (previously stubbed) Cash Flow KPI.
    - Branch Comparison tab.
    - Accuracy tab.
    - 🆕 **Peak Hour tab** — projected peak hour + staff requirement, hourly bar chart.
    - 🆕 **Demand tab** — top-N item/ingredient demand projection table.
    - 🆕 **Inventory tab** — days-until-stockout + reorder-recommended table.
    - Reports tab.
12. **Investment Analysis** → `/dashboard/investment-analysis` — ROI/NPV/IRR/Payback (Overview
    / Projects / Branch Comparison / Reports).
13. **Executive Dashboard** → `/dashboard/executive` — health score, scorecards, multi-branch,
    timeline, reports.
14. **AI Financial Advisor** → `/dashboard/ai-advisor` — Ask / Brief / Insights (now includes
    🆕 3 new rule-based insight types: predicted stock-out risk, predicted staff shortfall,
    growing peak-hour demand opportunity) / Branch Narratives / Reports / Timeline.
15. **Stock Audit** → `/dashboard/daily-stock-audit` — daily opening/consumed/closing audit.
16. **Attendance** → `/dashboard/attendance`
    - **Attendance Register** tab (pre-existing content, now behind a tab instead of the
      only view) — clock-in/out, hours editing, overtime, monthly salary totals.
    - 🆕 **Leave Management** tab — status-filtered list, Approve/Reject, Add Leave Request
      dialog.
    - 🆕 **Payroll Processing** tab — month selector, Run Payroll, payroll-run lines table +
      total, Record Deduction dialog, past-runs history, Excel/PDF export.
17. **Cash** → `/dashboard/cash` — cash-drawer session open/close, shortfall/surplus.
18. **Vendors** → `/dashboard/vendors`
    - Vendor list — 🆕 vendor type field/filter badge.
    - 🆕 **Reorder** action per row → `ReorderDialog` (WhatsApp/Email channel + ingredient
      picker).
    - 🆕 **Price History** action per row → dialog (current vs. previous price, % change).
    - Vendor detail modal — payments, invoices (🆕 e-bill upload + "View e-bill" link),
      performance.
19. **Procurement Intelligence** → `/dashboard/procurement-intelligence` — external supplier
    price comparison (Hyperpure/Zepto/Instamart via Chrome extension or cached data).
20. **Compare** → `/dashboard/comparison` — multi-branch/city KPI comparison.
21. **Kitchen** → `/dashboard/kitchen` — kitchen analytics (peak hour label, hourly load,
    table turn, slowest orders).
    - 🆕 **Peak Hour Depletion section** — live queue depth/utilization `MetricCard`s,
      capacity warning `Alert`, staff-requirement + bottleneck bar chart, 3 ETA `MetricCard`s
      (Dine-In / Takeaway / Delivery).
22. 🆕🔒 **Cash Flow** → `/dashboard/cash-flow` — horizon selector, inflow/outflow/net KPIs,
    outflow breakdown (Vendor Dues/Payroll/GST/EMI), shortfall `Alert`, inflow-vs-outflow
    chart, 30-day daily inflow trend, upcoming vendor-payment and EMI tables.
23. 🆕🔒 **Dues** → `/dashboard/dues`
    - **Monthly Expenses** tab — 8 fixed categories (EB/Salaries/Rent/Operations/Utilities/
      Maintenance/Misc/EMI), Add/Edit/Delete.
    - **Payment Day Tracker** tab — chronological calendar merging Monthly Dues + Vendor
      Invoices + EMI schedules.
    - **Month Comparison** tab — current vs. previous month bar chart + % change table.
    - **EBITDA** tab — defensive KPI-grid render of the finance engine's EBITDA summary.
24. 🆕🔒 **Equipment** → `/dashboard/equipment` — master list (capacity/volume/power/purchase/
    EMI/warranty/install date/lifespan/maintenance), maintenance-due `Alert`, Add/Edit/Delete
    dialog.
25. 🆕🔒 **Compliance** → `/dashboard/compliance` — 4 cards (FSSAI / Fire Safety / Pest
    Control / GST Filing), status `MetricCard` row, Add/Edit/Renew/Upload/Delete per card.
26. 🆕🔒 **WhatsApp** → `/dashboard/whatsapp` — message log `DataTable`, Send Message dialog,
    Total/Sent/Failed `MetricCard`s, explicit "demo mode — logged, not delivered" notice.
27. 🆕🔒 **Banking** → `/dashboard/banking`
    - **Bank Accounts** tab — multi-branch accounts, Primary flag, Add/Edit/Delete.
    - **UPI** tab — UPI ID/display-name config, generated QR code image, static-QR
      disclosure caption.
    - **Transactions** tab — manual entry, date filter, CREDIT/DEBIT coloring, reconciliation
      status chip, Reconcile button (best-effort-heuristic disclosure).
    - **Payment Analytics** tab — link-through to the Dashboard's existing payment-split data.

Account menu (top-right, unchanged): Account Settings, Sign Out.

---

## DineInk POS (`dineink-pos`)

Nav is role/department-driven (`src/layouts/MainLayout.tsx`), unchanged in structure by this
effort — no new top-level tabs were added, only existing screens extended.

- **KITCHEN department** → single tab: **Kitchen** (`/app/kitchen`).
- **MANAGER role** → Billing, Orders, Online, Kitchen, Shop (unrestricted).
- **CASHIER role** → Billing, Orders, Online.
- Default → Billing only.

### Billing (`/app/billing`)
- Dine In / Takeaway·Quick Bill tabs (`BillingTypeTabs`).
- MENU → CART → CUSTOMER step flow.
  - **CUSTOMER step** (`CustomerSection.tsx`):
    - 🆕 ETA chip near the checkout header — "Est. ready in ~N min" (or a muted
      "not enough data yet" note), fetched once for the current order type.
    - 🆕 UPI QR panel — appears inside the Payment Method section only when UPI is the
      selected method; shows the branch's actual QR code image + UPI ID/display name, or a
      muted "not configured" note.
  - GST/CGST/SGST breakdown, discount (with manager-approval gate above threshold), tip,
    round-off, split-bill printing — all unchanged.

### Orders (`/app/orders`, CASHIER + MANAGER)
- Order/bill history, reprint, Complete (bills an open running order), Refund (MANAGER-only),
  Void (MANAGER-only) — unchanged.

### Online Orders (`/app/online-orders`, CASHIER + MANAGER)
- Mock Swiggy/Zomato-style board — unchanged (still mock data, no live integration; not in
  scope for this effort).

### Kitchen (`/app/kitchen`, KITCHEN department + MANAGER)
- **Orders** view:
  - 🆕 Bottleneck banner (orange, advisory) at the top when kitchen capacity is exceeded:
    "Kitchen at capacity (queue depth: N) — consider holding new orders."
  - Per-order card: existing elapsed-time badge, item checklist, cancel-request approve/
    reject, auto-ready-on-all-checked.
  - 🆕 **Hold** button (pauses an order — dims the card, shows a "HELD" `StatusBadge`,
    excludes it from the auto-complete check) / 🆕 **Resume** button (on held cards).
- **Club** view — batch-cooking aggregation across active orders (unchanged).
- **Availability** view — sold-out/available toggle per menu item (unchanged).

### Manage Shop (`/app/manage-shop`, MANAGER only)
- Attendance / Expense Details / Update Inventory / Cash Session tabs — all unchanged (no
  POS-side payroll/leave UI was added; that lives in owner-web's Attendance page).

Profile menu (top-right, unchanged): Sign Out. Connectivity indicator + notification bell +
printer-status button — all unchanged.

---

## Cross-App Notes

- Owner Web's new 🔒 items (Cash Flow, Dues, Equipment, Compliance, WhatsApp, Banking) are
  the first features in either app gated by role — a non-OWNER/MANAGER user won't see them in
  the sidebar and is redirected to `/dashboard` if they navigate to the URL directly.
- DineInk POS's Attendance/Leave/Payroll data is entered from **owner-web only** — POS staff
  clock in/out (existing `Attendance.tsx` in POS's Manage Shop), but leave requests, salary
  deductions, and payroll runs are an owner/manager-facing workflow, consistent with the
  existing split where POS handles day-to-day shop-floor operations and owner-web handles
  management/finance.
- The UPI QR shown at POS checkout and the UPI QR shown in owner-web's Banking → UPI tab are
  the **same** generated image (same backend endpoint) — configuring it once in owner-web
  makes it appear at checkout in POS immediately, no POS-side configuration needed.
