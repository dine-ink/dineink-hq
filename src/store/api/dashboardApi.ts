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

export const dashboardApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getMyRestaurant: builder.query<any, void>({
      query: () => "/api/restaurant/my-restaurant",
      providesTags: ["Restaurant"],
    }),

    getDashboardOverview: builder.query<any, RangeScope>({
      query: ({ restaurantId, branchId, preset, from, to }) =>
        `/api/analytics/${restaurantId}/restaurantDashboardOverview?branchId=${branchId}&range=${preset}&from=${from}&to=${to}`,
      providesTags: ["Analytics"],
    }),

    getBranchInsights: builder.query<any, Scope>({
      query: ({ restaurantId, branchId }) =>
        `/api/analytics/insights/${restaurantId}/${branchId}`,
      providesTags: ["Insights"],
    }),

    getStaff: builder.query<any, Scope>({
      query: ({ restaurantId, branchId }) =>
        `/api/restaurant/staff/${restaurantId}/${branchId}`,
      providesTags: ["Staff"],
    }),

    getRestockHistory: builder.query<any, { restaurantId: number }>({
      query: ({ restaurantId }) =>
        `/api/inventory/${restaurantId}/get-restock-history`,
      providesTags: ["Inventory"],
    }),

    getInventoryStock: builder.query<any, Scope>({
      query: ({ restaurantId, branchId }) =>
        `/api/inventory/${restaurantId}/menu-management?branchId=${branchId}`,
      providesTags: ["Inventory"],
    }),

    getReorderAlerts: builder.query<any, { restaurantId: number }>({
      query: ({ restaurantId }) =>
        `/api/ingredients/${restaurantId}/reorder-alerts`,
      providesTags: ["Inventory"],
    }),

    getFinanceSummary: builder.query<any, RangeScope>({
      query: ({ restaurantId, branchId, from, to }) =>
        `/api/finance/${restaurantId}/${branchId}/summary?period=custom&from=${from}&to=${to}`,
      providesTags: ["Finance"],
    }),

    getRatioReport: builder.query<any, Scope>({
      query: ({ restaurantId, branchId }) =>
        `/api/finance/${restaurantId}/${branchId}/ratios`,
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
