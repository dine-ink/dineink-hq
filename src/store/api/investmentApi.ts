import { api } from "./apiSlice";

/**
 * Capital projects — the list, the per-project metrics (IRR, NPV, payback), the
 * portfolio roll-up and the branch ranking.
 *
 * The first feature migrated here that both reads and writes, so the tags earn
 * their keep: creating, editing, changing status or deleting a project all
 * invalidate "Investment", and the list, portfolio, ranking and with-metrics
 * views refresh themselves. The old code called `fetchProjects()` by hand after
 * each write and left the other three tabs stale until they were revisited.
 *
 * Per-project metrics are keyed by scenario as well as id, because the same
 * project has different IRR and payback under different scenarios and the
 * scenario picker switches between them.
 */

type Envelope<T> = { success?: boolean; data?: T; message?: string };

const unwrap = <T,>(response: Envelope<T>): T | null => response?.data ?? null;

export type InvestmentInput = {
  restaurantId: number;
  body: Record<string, any>;
};

export type InvestmentEdit = InvestmentInput & { investmentId: number };

export const investmentApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getInvestments: builder.query<any[], number>({
      query: (restaurantId) => `/api/investments/${restaurantId}`,
      transformResponse: (response: Envelope<any[]>) => unwrap(response) ?? [],
      providesTags: ["Investment"],
    }),

    getInvestmentsWithMetrics: builder.query<any[], number>({
      query: (restaurantId) => `/api/investments/${restaurantId}/with-metrics`,
      transformResponse: (response: Envelope<any[]>) => unwrap(response) ?? [],
      providesTags: ["Investment"],
    }),

    getInvestmentPortfolio: builder.query<any, number>({
      query: (restaurantId) => `/api/investments/${restaurantId}/portfolio`,
      transformResponse: (response: Envelope<any>) => unwrap(response),
      providesTags: ["Investment"],
    }),

    getInvestmentBranchRanking: builder.query<any[], number>({
      query: (restaurantId) => `/api/investments/${restaurantId}/branch-ranking`,
      transformResponse: (response: Envelope<any[]>) => unwrap(response) ?? [],
      providesTags: ["Investment"],
    }),

    /** Keyed by scenario too — the same project reads differently under each. */
    getInvestmentMetrics: builder.query<
      any,
      { restaurantId: number; investmentId: number; scenarioId?: string }
    >({
      query: ({ restaurantId, investmentId, scenarioId }) =>
        `/api/investments/${restaurantId}/${investmentId}/metrics${
          scenarioId ? `?scenarioId=${scenarioId}` : ""
        }`,
      transformResponse: (response: Envelope<any>) => unwrap(response),
      providesTags: ["InvestmentMetrics"],
    }),

    getInvestmentForecastComparison: builder.query<
      any,
      { restaurantId: number; investmentId: number }
    >({
      query: ({ restaurantId, investmentId }) =>
        `/api/investments/${restaurantId}/${investmentId}/forecast-comparison`,
      transformResponse: (response: Envelope<any>) => unwrap(response),
      providesTags: ["InvestmentMetrics"],
    }),

    createInvestment: builder.mutation<any, InvestmentInput>({
      query: ({ restaurantId, body }) => ({
        url: `/api/investments/${restaurantId}`,
        method: "POST",
        body,
      }),
      transformResponse: (response: Envelope<any>) => unwrap(response),
      invalidatesTags: ["Investment"],
    }),

    /** Also the status change — same endpoint, a body of just `{ status }`. */
    updateInvestment: builder.mutation<any, InvestmentEdit>({
      query: ({ restaurantId, investmentId, body }) => ({
        url: `/api/investments/${restaurantId}/${investmentId}`,
        method: "PUT",
        body,
      }),
      transformResponse: (response: Envelope<any>) => unwrap(response),
      // Editing the assumptions changes IRR and payback, so the metrics go too.
      invalidatesTags: ["Investment", "InvestmentMetrics"],
    }),

    deleteInvestment: builder.mutation<
      unknown,
      { restaurantId: number; investmentId: number }
    >({
      query: ({ restaurantId, investmentId }) => ({
        url: `/api/investments/${restaurantId}/${investmentId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Investment", "InvestmentMetrics"],
    }),
  }),
});

export const {
  useGetInvestmentsQuery,
  useGetInvestmentsWithMetricsQuery,
  useGetInvestmentPortfolioQuery,
  useGetInvestmentBranchRankingQuery,
  useGetInvestmentMetricsQuery,
  useGetInvestmentForecastComparisonQuery,
  useCreateInvestmentMutation,
  useUpdateInvestmentMutation,
  useDeleteInvestmentMutation,
} = investmentApi;
