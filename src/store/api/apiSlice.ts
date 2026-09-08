import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { RootState } from "..";

/**
 * Shared RTK Query API.
 *
 * The app previously issued every request through a bare `fetch` inside
 * `useEffect`, with no cache at all — so every tab switch and every navigation
 * refetched the same data from scratch. RTK Query dedupes in-flight requests,
 * serves cached data instantly on revisit, and refetches in the background.
 *
 * `@reduxjs/toolkit` was already a dependency, so this adds none.
 *
 * The auth screens are a deliberate exception and stay on raw fetch.
 *
 * There is nothing here for them to gain: login, signup OTP, forgot- and
 * reset-password are one-shot mutations, no other screen shares an endpoint
 * with them, and caching a sign-in would be actively wrong. What they would
 * risk is real. Login distinguishes four outcomes on purpose — success, a
 * rejected password (200 with `success: false`), a locked account (429 with
 * `code: ACCOUNT_LOCKED`, which no password will open until an
 * email-verified reset), and an unreachable API, which gets its own message
 * naming the URL because "Login failed" alone sends you hunting for the
 * wrong bug. All four are expressible through fetchBaseQuery's error shape,
 * but re-deriving them buys consistency and nothing else, in the one place
 * where a subtle mistake locks people out of the product.
 *
 * Endpoints are injected per feature via `api.injectEndpoints` (see
 * store/api/dashboardApi.ts) so pages can be migrated one at a time instead of
 * in a single sweep across all 260-odd call sites.
 */
export const api = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_URL,
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.token;
      if (token) headers.set("Authorization", `Bearer ${token}`);
      return headers;
    },
  }),
  // Data here is reporting/analytics rather than live operational state, so a
  // minute of reuse is a good trade: instant navigation, still current enough.
  keepUnusedDataFor: 60,
  refetchOnReconnect: true,
  tagTypes: [
    "Restaurant",
    "MenuCategory",
    "Analytics",
    "Insights",
    "Staff",
    "Inventory",
    "Finance",
    "Discount",
    "Due",
    "Compliance",
    "ComplianceSummary",
    "Scenario",
    "ScenarioProjection",
    "Budget",
    "BudgetVariance",
    "Executive",
    "ExecutivePreferences",
    "Forecast",
    "ForecastAccuracy",
    "Investment",
    "InvestmentMetrics",
    "AddOn",
    "Sop",
    "MenuItem",
    "IngredientMapping",
    "IngredientPrice",
    "Vendor",
    "Bills",
    "MenuEngineering",
    "Report",
    "Assumptions",
    "Attendance",
    "Leave",
    "Payroll",
    "VendorLedger",
    "BankAccount",
    "BankTransaction",
    "Upi",
    "Ai",
    "WhatsAppTemplate",
    "WhatsAppLog",
    "Customer",
    "Settings",
    "Equipment",
    "Labor",
    "StockAudit",
    "Cash",
    "Procurement",
    "Branch",
  ],
  endpoints: () => ({}),
});
