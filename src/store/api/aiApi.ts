import { api } from "./apiSlice";

/**
 * The AI advisor: insights, risks, opportunities, the executive brief, the
 * per-branch narratives, the insight timeline, and the free-text ask.
 *
 * These are the most expensive reads in the app — each one is a model call on
 * the server, not a database query — and the Reports tab asks for five of them
 * at once, the same five the individual tabs each load on their own. Before
 * this, opening Insights and then Reports ran the insights model twice for
 * identical parameters.
 *
 * Every endpoint is keyed by period, and most by branch as well. Note that the
 * Reports tab deliberately asks without a branch (restaurant-wide) while the
 * single tabs ask with one, so those are different cache entries — as they
 * should be, since they are different questions.
 */

type Envelope<T> = { success?: boolean; data?: T; message?: string };

const unwrap = <T,>(response: Envelope<T>): T | null => response?.data ?? null;

/**
 * `branchId` absent means restaurant-wide. The scope toggle on each tab decides
 * which, and the difference is part of the cache key.
 */
export type AiScope = {
  restaurantId: number;
  period: string;
  branchId?: number | null;
};

const branchQuery = (branchId?: number | null) =>
  branchId ? `&branchId=${branchId}` : "";

export const aiApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getAiInsights: builder.query<any[], AiScope>({
      query: ({ restaurantId, period, branchId }) =>
        `/api/ai/${restaurantId}/insights?period=${period}${branchQuery(branchId)}`,
      transformResponse: (response: Envelope<any[]>) => unwrap(response) ?? [],
      providesTags: ["Ai"],
    }),

    getAiRisks: builder.query<any[], AiScope>({
      query: ({ restaurantId, period, branchId }) =>
        `/api/ai/${restaurantId}/risks?period=${period}${branchQuery(branchId)}`,
      transformResponse: (response: Envelope<any[]>) => unwrap(response) ?? [],
      providesTags: ["Ai"],
    }),

    getAiOpportunities: builder.query<any[], AiScope>({
      query: ({ restaurantId, period, branchId }) =>
        `/api/ai/${restaurantId}/opportunities?period=${period}${branchQuery(branchId)}`,
      transformResponse: (response: Envelope<any[]>) => unwrap(response) ?? [],
      providesTags: ["Ai"],
    }),

    getAiExecutiveBrief: builder.query<any, AiScope>({
      query: ({ restaurantId, period, branchId }) =>
        `/api/ai/${restaurantId}/executive-brief?period=${period}${branchQuery(branchId)}`,
      transformResponse: (response: Envelope<any>) => unwrap(response),
      providesTags: ["Ai"],
    }),

    getAiBranchNarratives: builder.query<any[], AiScope>({
      query: ({ restaurantId, period }) =>
        `/api/ai/${restaurantId}/branch-narratives?period=${period}`,
      transformResponse: (response: Envelope<any[]>) => unwrap(response) ?? [],
      providesTags: ["Ai"],
    }),

    getAiInsightTimeline: builder.query<
      any[],
      { restaurantId: number; limit?: number; branchId?: number | null }
    >({
      query: ({ restaurantId, limit = 50, branchId }) =>
        `/api/ai/${restaurantId}/insight-timeline?limit=${limit}${branchQuery(branchId)}`,
      transformResponse: (response: Envelope<any[]>) => unwrap(response) ?? [],
      providesTags: ["Ai"],
    }),

    /**
     * A free-text question, asked by picking one of a fixed set of keys. A
     * query rather than a mutation: it computes an answer and writes nothing,
     * and asking the same question twice should not cost two model calls.
     */
    askAi: builder.query<any, { restaurantId: number; key: string; query?: string }>({
      query: ({ restaurantId, key, query = "" }) =>
        `/api/ai/${restaurantId}/ask/${key}?${query}`,
      transformResponse: (response: Envelope<any>) => unwrap(response),
      providesTags: ["Ai"],
    }),
  }),
});

export const {
  useGetAiInsightsQuery,
  useGetAiRisksQuery,
  useGetAiOpportunitiesQuery,
  useGetAiExecutiveBriefQuery,
  useGetAiBranchNarrativesQuery,
  useGetAiInsightTimelineQuery,
  useAskAiQuery,
} = aiApi;
