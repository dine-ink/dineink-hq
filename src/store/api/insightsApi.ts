import { api } from "./apiSlice";

/**
 * The Insights page's own data: the saved setup figures, the finance
 * assumptions behind every target, table operations, and the two vendor reads
 * that feed accounts payable.
 *
 * Insights issued eleven requests across seven effects. Four of those endpoints
 * already had slices — the dashboard overview, the finance summary, staff, and
 * the menu-management payload — so those are reused here rather than redefined,
 * which means Insights shares Dashboard's and Menu Management's caches.
 *
 * The assumptions endpoints are the reason this page needed care. Defaults are
 * restaurant-wide and overrides are per-branch, and saving either has to
 * refresh the resolved view that layers one on the other. That was three
 * hand-written refetches before; it is one tag now.
 */

type Envelope<T> = { success?: boolean; data?: T; message?: string };

const unwrap = <T,>(response: Envelope<T>): T | null => response?.data ?? null;

export type BranchScope = { restaurantId: number; branchId: number };

export const insightsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getInsightsSetup: builder.query<any, BranchScope>({
      query: ({ restaurantId, branchId }) =>
        `/api/analytics/insights/${restaurantId}/${branchId}`,
      transformResponse: (response: Envelope<any>) => unwrap(response),
      providesTags: ["Insights"],
    }),

    saveInsightsSetup: builder.mutation<any, Record<string, any>>({
      query: (body) => ({ url: "/api/analytics/insights", method: "POST", body }),
      transformResponse: (response: Envelope<any>) => unwrap(response),
      invalidatesTags: ["Insights"],
    }),

    getTableOperations: builder.query<
      any,
      BranchScope & { from: string; to: string }
    >({
      query: ({ restaurantId, branchId, from, to }) =>
        `/api/analytics/${restaurantId}/${branchId}/table-operations?from=${from}&to=${to}`,
      transformResponse: (response: Envelope<any>) => unwrap(response),
      providesTags: ["Analytics"],
    }),

    /**
     * Total owed to vendors — the accounts-payable figure behind Days Payable
     * Outstanding.
     *
     * Summed here rather than at the call site, and the unwrap tolerates both
     * an enveloped list and a bare array. That tolerance was in the original
     * (`json?.data || json || []`) and is kept: this endpoint is the one place
     * in the app that has answered both ways.
     */
    getVendorOutstanding: builder.query<number, BranchScope>({
      query: ({ restaurantId, branchId }) =>
        `/api/vendors/outstanding/${restaurantId}/${branchId}`,
      transformResponse: (response: any) => {
        const rows = response?.data || response || [];
        if (!Array.isArray(rows)) return 0;
        return rows.reduce((s: number, v: any) => s + Number(v.outstanding || 0), 0);
      },
      providesTags: ["Vendor"],
    }),

    /**
     * The finance engine's summary for a named period.
     *
     * dashboardApi has a summary query too, but it takes an explicit from/to
     * range; this page asks for `period=currentMonth` and lets the backend
     * decide the dates. Different cache key, different answer — so a separate
     * endpoint rather than a shared one bent to fit.
     */
    getFinanceSummaryForPeriod: builder.query<any, BranchScope & { period: string }>({
      query: ({ restaurantId, branchId, period }) =>
        `/api/finance/${restaurantId}/${branchId}/summary?period=${period}`,
      transformResponse: (response: Envelope<any>) => unwrap(response),
      providesTags: ["Finance"],
    }),

    /**
     * Whether any vendor invoices exist at all. Separate from the total because
     * zero owed and never having recorded an invoice mean different things, and
     * the page says something different for each.
     */
    getVendorInvoiceActivity: builder.query<any, BranchScope>({
      query: ({ restaurantId, branchId }) =>
        `/api/vendors/invoice-activity/${restaurantId}/${branchId}`,
      transformResponse: (response: Envelope<any>) => unwrap(response),
      providesTags: ["Vendor"],
    }),

    getRestaurantIngredients: builder.query<any, number>({
      query: (restaurantId) =>
        `/api/ingredients/${restaurantId}/getRestaurantIngredients`,
      transformResponse: (response: Envelope<any>) => unwrap(response),
      providesTags: ["Inventory"],
    }),

    getAssumptionDefaults: builder.query<any, number>({
      query: (restaurantId) => `/api/finance-assumptions/${restaurantId}`,
      transformResponse: (response: Envelope<any>) => unwrap(response),
      providesTags: ["Assumptions"],
    }),

    /** Defaults with this branch's overrides applied, plus which fields differ. */
    getAssumptionsForBranch: builder.query<any, BranchScope>({
      query: ({ restaurantId, branchId }) =>
        `/api/finance-assumptions/${restaurantId}/${branchId}`,
      transformResponse: (response: Envelope<any>) => unwrap(response),
      providesTags: ["Assumptions"],
    }),

    /** Restaurant-wide defaults. */
    saveAssumptionDefaults: builder.mutation<
      any,
      { restaurantId: number; body: Record<string, any> }
    >({
      query: ({ restaurantId, body }) => ({
        url: `/api/finance-assumptions/${restaurantId}`,
        method: "PUT",
        body,
      }),
      transformResponse: (response: Envelope<any>) => unwrap(response),
      // Finance too: these are the targets the summary is measured against.
      invalidatesTags: ["Assumptions", "Finance"],
    }),

    /** This branch's overrides. */
    saveAssumptionOverrides: builder.mutation<
      any,
      BranchScope & { body: Record<string, any> }
    >({
      query: ({ restaurantId, branchId, body }) => ({
        url: `/api/finance-assumptions/${restaurantId}/${branchId}`,
        method: "PUT",
        body,
      }),
      transformResponse: (response: Envelope<any>) => unwrap(response),
      invalidatesTags: ["Assumptions", "Finance"],
    }),
  }),
});

export const {
  useGetInsightsSetupQuery,
  useSaveInsightsSetupMutation,
  useGetTableOperationsQuery,
  useGetVendorOutstandingQuery,
  useGetFinanceSummaryForPeriodQuery,
  useGetVendorInvoiceActivityQuery,
  useGetRestaurantIngredientsQuery,
  useGetAssumptionDefaultsQuery,
  useGetAssumptionsForBranchQuery,
  useSaveAssumptionDefaultsMutation,
  useSaveAssumptionOverridesMutation,
} = insightsApi;
