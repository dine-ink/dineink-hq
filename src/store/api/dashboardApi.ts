import { api } from "./apiSlice";

/**
 * The nine requests the Dashboard makes on every mount, as cached RTK Query
 * endpoints. Revisiting the page (or bouncing back from another tab with the
 * same branch and date range) now serves from cache instead of refiring all
 * nine.
 *
 * Each endpoint keeps the response shape the page already expected, so the
 * component's downstream logic is untouched.
 */

type Scope = {
  restaurantId: number;
  branchId: number;
};

type RangeScope = Scope & {
  preset?: string;
  from: string;
  to: string;
};

type Envelope<T = any> = { success?: boolean; data?: T };

/**
 * Every endpoint below answers with a `{ success, data }` envelope, and every
 * caller wants the payload inside it — the pre-RTK-Query code unwrapped it by
 * hand at each call site (`if (data.success) setAnalytics(data.data)`).
 *
 * Applied uniformly so no endpoint is the odd one out: a single endpoint left
 * un-unwrapped silently reads as "no data" on the page rather than failing
 * loudly, which is exactly how it goes unnoticed.
 *
 * Collapses to `null`, never `undefined`, so consumers can keep using
 * `data === undefined` to mean "still loading".
 */
const unwrap = <T,>(response: Envelope<T>): T | null => response?.data ?? null;

export const dashboardApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getMyRestaurant: builder.query<any, void>({
      query: () => "/api/restaurant/my-restaurant",
      transformResponse: unwrap,
      providesTags: ["Restaurant"],
    }),

    getDashboardOverview: builder.query<any, RangeScope>({
      query: ({ restaurantId, branchId, preset, from, to }) =>
        `/api/analytics/${restaurantId}/restaurantDashboardOverview?branchId=${branchId}&range=${preset}&from=${from}&to=${to}`,
      transformResponse: unwrap,
      providesTags: ["Analytics"],
    }),

    getBranchInsights: builder.query<any, Scope>({
      query: ({ restaurantId, branchId }) =>
        `/api/analytics/insights/${restaurantId}/${branchId}`,
      transformResponse: unwrap,
      providesTags: ["Insights"],
    }),

    getStaff: builder.query<any, Scope>({
      query: ({ restaurantId, branchId }) =>
        `/api/restaurant/staff/${restaurantId}/${branchId}`,
      transformResponse: unwrap,
      providesTags: ["Staff"],
    }),

    getRestockHistory: builder.query<any, { restaurantId: number }>({
      query: ({ restaurantId }) =>
        `/api/inventory/${restaurantId}/get-restock-history`,
      transformResponse: unwrap,
      providesTags: ["Inventory"],
    }),

    getInventoryStock: builder.query<any, Scope>({
      query: ({ restaurantId, branchId }) =>
        `/api/inventory/${restaurantId}/menu-management?branchId=${branchId}`,
      transformResponse: unwrap,
      providesTags: ["Inventory"],
    }),

    getReorderAlerts: builder.query<any, { restaurantId: number }>({
      query: ({ restaurantId }) =>
        `/api/ingredients/${restaurantId}/reorder-alerts`,
      transformResponse: unwrap,
      providesTags: ["Inventory"],
    }),

    getFinanceSummary: builder.query<any, RangeScope>({
      query: ({ restaurantId, branchId, from, to }) =>
        `/api/finance/${restaurantId}/${branchId}/summary?period=custom&from=${from}&to=${to}`,
      transformResponse: unwrap,
      providesTags: ["Finance"],
    }),

    getRatioReport: builder.query<any, Scope>({
      query: ({ restaurantId, branchId }) =>
        `/api/finance/${restaurantId}/${branchId}/ratios`,
      transformResponse: unwrap,
      providesTags: ["Finance"],
    }),
  }),
});

export const {
  useGetMyRestaurantQuery,
  useGetDashboardOverviewQuery,
  useGetBranchInsightsQuery,
  useGetStaffQuery,
  useGetRestockHistoryQuery,
  useGetInventoryStockQuery,
  useGetReorderAlertsQuery,
  useGetFinanceSummaryQuery,
  useGetRatioReportQuery,
} = dashboardApi;
