import { api } from "./apiSlice";

/**
 * Forecasting — demand, inventory, peak hour, branch ranking and accuracy.
 *
 * Worth migrating for a reason the earlier features did not have: two of these
 * endpoints are called from two tabs each. `generate` runs for both Overview
 * and Reports, `branch-ranking` for both Branch Comparison and Reports, and the
 * old code refetched on every tab switch. Generating a forecast is not a cheap
 * read — it is the model running on the server — so the same work was being
 * done twice for the same parameters.
 *
 * All eight are branch- and parameter-scoped, so the cache key has to carry the
 * parameters. RTK Query does that from the query argument automatically, which
 * is the whole reason the arguments are objects rather than pre-built strings.
 *
 * One deliberate behaviour change: the old code swallowed every failure in an
 * empty `catch` and left the tab showing its empty state, indistinguishable
 * from "no data". These expose `isError`, and the tabs now say so.
 */

type Envelope<T> = { success?: boolean; data?: T };

const unwrap = <T,>(response: Envelope<T>): T | null => response?.data ?? null;

/**
 * Scope is a UI toggle: "branch" narrows to the selected branch, "restaurant"
 * spans all of them. The backend distinguishes the two by the presence of the
 * parameter, except on the snapshot and accuracy endpoints, which want the
 * literal string "null" — preserved rather than tidied, since changing it would
 * change which rows come back.
 */
export type ForecastScope = {
  restaurantId: number;
  branchId?: number | null;
  period?: string;
  model?: string;
};

const branchQuery = (branchId?: number | null) =>
  branchId ? `&branchId=${branchId}` : "";

const branchParam = (branchId?: number | null) =>
  branchId ? `branchId=${branchId}` : "branchId=null";

export const forecastApi = api.injectEndpoints({
  endpoints: (builder) => ({
    /** Runs the model. A query rather than a mutation: it computes, it does not write. */
    generateForecast: builder.query<any, ForecastScope>({
      query: ({ restaurantId, branchId, period, model }) =>
        `/api/forecasts/${restaurantId}/generate?period=${period}&model=${model}${branchQuery(branchId)}`,
      transformResponse: (response: Envelope<any>) => unwrap(response),
      providesTags: ["Forecast"],
    }),

    /**
     * Returns null, not [], when the server answers 200 with `success: false`.
     * The Demand tab is the one place that distinguished "the server declined"
     * from "there are no items", and RTK Query's isError only covers transport
     * failures, so the distinction has to survive in the payload.
     */
    getDemandForecast: builder.query<any[] | null, ForecastScope>({
      query: ({ restaurantId, branchId, period, model }) =>
        `/api/forecasts/${restaurantId}/demand?period=${period}&model=${model}&topN=10${branchQuery(branchId)}`,
      // This one nests its rows under `items`, unlike the others.
      transformResponse: (response: Envelope<{ items?: any[] }>) => {
        if (response?.success === false) return null;
        return Array.isArray(response?.data?.items) ? response.data.items : [];
      },
      providesTags: ["Forecast"],
    }),

    /** Null on `success: false`, for the same reason getDemandForecast is. */
    getInventoryForecast: builder.query<any[] | null, ForecastScope>({
      query: ({ restaurantId, branchId, model }) =>
        `/api/forecasts/${restaurantId}/inventory?model=${model}&topN=10${branchQuery(branchId)}`,
      transformResponse: (response: Envelope<any[]>) => {
        if (response?.success === false) return null;
        return Array.isArray(response?.data) ? response.data : [];
      },
      providesTags: ["Forecast"],
    }),

    getPeakHourForecast: builder.query<any, ForecastScope>({
      query: ({ restaurantId, branchId, period, model }) =>
        `/api/forecasts/${restaurantId}/peak-hour?period=${period}&model=${model}${branchQuery(branchId)}`,
      transformResponse: (response: Envelope<any>) => unwrap(response),
      providesTags: ["Forecast"],
    }),

    getBranchRanking: builder.query<any[], ForecastScope>({
      query: ({ restaurantId, period, model }) =>
        `/api/forecasts/${restaurantId}/branch-ranking?period=${period}&model=${model}`,
      transformResponse: (response: Envelope<any[]>) => unwrap(response) ?? [],
      providesTags: ["Forecast"],
    }),

    getForecastSnapshots: builder.query<any[], ForecastScope>({
      query: ({ restaurantId, branchId }) =>
        `/api/forecasts/${restaurantId}?${branchParam(branchId)}`,
      transformResponse: (response: Envelope<any[]>) => unwrap(response) ?? [],
      providesTags: ["ForecastAccuracy"],
    }),

    getForecastAccuracy: builder.query<any, ForecastScope>({
      query: ({ restaurantId, branchId }) =>
        `/api/forecasts/${restaurantId}/accuracy?${branchParam(branchId)}`,
      transformResponse: (response: Envelope<any>) => unwrap(response),
      providesTags: ["ForecastAccuracy"],
    }),

    getForecastVsActual: builder.query<any, { restaurantId: number; forecastId: number }>({
      query: ({ restaurantId, forecastId }) =>
        `/api/forecasts/${restaurantId}/${forecastId}/vs-actual`,
      transformResponse: (response: Envelope<any>) => unwrap(response),
      providesTags: ["ForecastAccuracy"],
    }),
  }),
});

export const {
  useGenerateForecastQuery,
  useGetDemandForecastQuery,
  useGetInventoryForecastQuery,
  useGetPeakHourForecastQuery,
  useGetBranchRankingQuery,
  useGetForecastSnapshotsQuery,
  useGetForecastAccuracyQuery,
  useGetForecastVsActualQuery,
} = forecastApi;
