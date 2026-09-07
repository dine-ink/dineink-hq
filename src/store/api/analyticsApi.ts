import { api } from "./apiSlice";

/**
 * The analytics endpoints that no other slice had a home for: kitchen
 * throughput, ETA prediction, peak-hour analysis, and the branch and city
 * comparisons.
 *
 * The dashboard overview and the menu-engineering matrix are deliberately not
 * here — they live in dashboardApi and inventoryApi respectively, next to the
 * screens that own them, and several pages already share those entries.
 */

type Envelope<T> = { success?: boolean; data?: T; message?: string };

const unwrap = <T,>(response: Envelope<T>): T | null => response?.data ?? null;

export type BranchRange = {
  restaurantId: number;
  branchId: number;
  from: string;
  to: string;
};

export const analyticsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    /** Kitchen throughput. branchId is optional here, unlike its neighbours. */
    getKitchenAnalytics: builder.query<
      any,
      { restaurantId: number; branchId?: number | null; from: string; to: string }
    >({
      query: ({ restaurantId, branchId, from, to }) =>
        `/api/analytics/${restaurantId}/kitchen?from=${from}&to=${to}${
          branchId ? `&branchId=${branchId}` : ""
        }`,
      transformResponse: (response: Envelope<any>) => unwrap(response),
      providesTags: ["Analytics"],
    }),

    getEtaPrediction: builder.query<
      any,
      { restaurantId: number; branchId: number }
    >({
      query: ({ restaurantId, branchId }) =>
        `/api/analytics/${restaurantId}/${branchId}/eta-prediction`,
      transformResponse: (response: Envelope<any>) => unwrap(response),
      providesTags: ["Analytics"],
    }),

    getPeakHourAnalysis: builder.query<any, BranchRange>({
      query: ({ restaurantId, branchId, from, to }) =>
        `/api/analytics/${restaurantId}/${branchId}/peak-hour-analysis?from=${from}&to=${to}`,
      transformResponse: (response: Envelope<any>) => unwrap(response),
      providesTags: ["Analytics"],
    }),

    /** A row per branch. Typed as a list so callers keep their map inference. */
    getBranchComparison: builder.query<
      any[],
      { restaurantId: number; from: string; to: string }
    >({
      query: ({ restaurantId, from, to }) =>
        `/api/analytics/${restaurantId}/branch-comparison?from=${from}&to=${to}`,
      transformResponse: (response: Envelope<any[]>) => unwrap(response) ?? [],
      providesTags: ["Analytics"],
    }),

    getCityComparison: builder.query<
      any[],
      { restaurantId: number; from: string; to: string }
    >({
      query: ({ restaurantId, from, to }) =>
        `/api/analytics/${restaurantId}/city-comparison?from=${from}&to=${to}`,
      transformResponse: (response: Envelope<any[]>) => unwrap(response) ?? [],
      providesTags: ["Analytics"],
    }),
  }),
});

export const {
  useGetKitchenAnalyticsQuery,
  useGetEtaPredictionQuery,
  useGetPeakHourAnalysisQuery,
  useGetBranchComparisonQuery,
  useGetCityComparisonQuery,
} = analyticsApi;
