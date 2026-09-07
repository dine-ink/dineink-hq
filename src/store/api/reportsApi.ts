import { api } from "./apiSlice";

/**
 * The report-specific reads: expenses, running orders, the hourly heatmap, the
 * revenue forecast, GST filing and the formal financial statements.
 *
 * Reports issued nine requests in one `Promise.all` and set nine pieces of
 * state from them. Two of those endpoints already had slices — the dashboard
 * overview and the finance summary live in dashboardApi — so Reports now shares
 * Dashboard's cache for both rather than fetching them again, and the bills and
 * menu-management calls share Menu Management's.
 *
 * The heatmap deserves a note. Its cache key includes the filters, which fixes
 * a quirk the characterisation tests recorded rather than corrected: the Hourly
 * Heatmap tab and the Day Analysis tab read the same `heatmapData` state, so
 * filtering on Hourly Heatmap corrupted Day Analysis until a reload. Two
 * different filter sets are now two cache entries, and neither overwrites the
 * other.
 */

type Envelope<T> = { success?: boolean; data?: T; message?: string };

const unwrap = <T,>(response: Envelope<T>): T | null => response?.data ?? null;

export type ReportRange = {
  restaurantId: number;
  branchId: number;
  from: string;
  to: string;
};

export const reportsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getReportExpenses: builder.query<any[], ReportRange>({
      query: ({ branchId, from, to }) =>
        `/api/reports/expenses?branchId=${branchId}&from=${from}&to=${to}`,
      transformResponse: (response: Envelope<any[]>) => unwrap(response) ?? [],
      providesTags: ["Report"],
    }),

    getRunningOrders: builder.query<any[], ReportRange>({
      query: ({ branchId, from, to }) =>
        `/api/orders/running?branchId=${branchId}&from=${from}&to=${to}`,
      transformResponse: (response: Envelope<any[]>) => unwrap(response) ?? [],
      providesTags: ["Report"],
    }),

    getInventoryAdjustments: builder.query<any[], ReportRange>({
      query: ({ branchId, from, to }) =>
        `/api/inventory/adjustments?branchId=${branchId}&from=${from}&to=${to}`,
      transformResponse: (response: Envelope<any[]>) => unwrap(response) ?? [],
      providesTags: ["Report", "Inventory"],
    }),

    /**
     * `filters` is appended verbatim (it arrives pre-built as
     * "&dayOfWeek=..." and so on) and is part of the cache key, so a filtered
     * view and an unfiltered one are separate entries.
     */
    getHourlyHeatmap: builder.query<any, ReportRange & { filters?: string }>({
      query: ({ restaurantId, branchId, from, to, filters = "" }) =>
        `/api/analytics/${restaurantId}/hourly-heatmap?branchId=${branchId}&from=${from}&to=${to}${filters}`,
      transformResponse: (response: Envelope<any>) => unwrap(response),
      providesTags: ["Report"],
    }),

    getRevenueForecast: builder.query<any, { restaurantId: number; branchId: number }>({
      query: ({ restaurantId, branchId }) =>
        `/api/analytics/${restaurantId}/revenue-forecast?branchId=${branchId}`,
      transformResponse: (response: Envelope<any>) => unwrap(response),
      providesTags: ["Report"],
    }),

    getStockLifecycle: builder.query<
      any,
      { branchId: number; month: number; year: number }
    >({
      query: ({ branchId, month, year }) =>
        `/api/inventory/lifecycle?branchId=${branchId}&month=${month}&year=${year}`,
      transformResponse: (response: Envelope<any>) => unwrap(response),
      providesTags: ["Report", "Inventory"],
    }),

    /** One of P&L, balance sheet or cash flow, for the statements screen. */
    getFinancialStatement: builder.query<
      any,
      { restaurantId: number; branchId: number; statementType: string; period: string }
    >({
      query: ({ restaurantId, branchId, statementType, period }) =>
        `/api/finance/${restaurantId}/${branchId}/statements/${statementType}?period=${period}`,
      transformResponse: (response: Envelope<any>) => unwrap(response),
      providesTags: ["Finance"],
    }),

    /**
     * The GST filing payload. A query rather than a mutation — it computes and
     * writes nothing — but it is triggered by a button and the result is turned
     * straight into a spreadsheet, so callers reach it with `initiate` rather
     * than a hook.
     */
    getGstFiling: builder.query<any, ReportRange>({
      query: ({ restaurantId, branchId, from, to }) =>
        `/api/reports/gst-filing/${restaurantId}/${branchId}?from=${from}&to=${to}`,
      transformResponse: (response: Envelope<any>) => unwrap(response),
      providesTags: ["Report"],
    }),
  }),
});

export const {
  useGetReportExpensesQuery,
  useGetRunningOrdersQuery,
  useGetInventoryAdjustmentsQuery,
  useGetHourlyHeatmapQuery,
  useGetRevenueForecastQuery,
  useGetStockLifecycleQuery,
  useGetFinancialStatementQuery,
} = reportsApi;
