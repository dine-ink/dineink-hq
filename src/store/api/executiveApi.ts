import { api } from "./apiSlice";

/**
 * The executive dashboard — overview KPIs, health score, alerts, scorecards,
 * multi-branch comparison, timeline, and the owner's saved preferences.
 *
 * The most uniform module so far: every endpoint takes a restaurant, an
 * optional branch, and a period or granularity. That regularity is the point —
 * `scopeQuery` builds the query string once instead of each of the six screens
 * assembling `period=…&branchId=…` by hand, which is how ReportsTab ended up
 * requesting health-score twice with subtly different strings.
 *
 * ReportsTab requests seven of these at once to build a printable report, and
 * five of the seven are the same figures the other tabs are already showing.
 * Cached per (restaurant, branch, period), opening Reports after browsing the
 * tabs now largely serves from cache.
 */

export type ExecScope = {
  restaurantId: number;
  /** null or undefined means restaurant-wide. */
  branchId?: number | null;
  period: string;
};

export type TimelineScope = Omit<ExecScope, "period"> & { granularity: string };

export interface ExecutivePreferences {
  pinnedKpis?: string[];
  defaultPeriod?: string;
  [key: string]: unknown;
}

type Envelope<T> = { success?: boolean; data?: T };

const unwrap = <T,>(response: Envelope<T>): T | null => response?.data ?? null;

/** `?period=…&branchId=…`, with branchId omitted when the scope is the whole restaurant. */
const scopeQuery = ({ branchId, period }: Omit<ExecScope, "restaurantId">) => {
  const params = new URLSearchParams({ period });
  if (branchId) params.set("branchId", String(branchId));
  return params.toString();
};

export const executiveApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getExecutiveOverview: builder.query<any, ExecScope>({
      query: ({ restaurantId, ...scope }) =>
        `/api/executive/${restaurantId}/overview?${scopeQuery(scope)}`,
      transformResponse: unwrap,
      providesTags: ["Executive"],
    }),

    getHealthScore: builder.query<any, ExecScope>({
      query: ({ restaurantId, ...scope }) =>
        `/api/executive/${restaurantId}/health-score?${scopeQuery(scope)}`,
      transformResponse: unwrap,
      providesTags: ["Executive"],
    }),

    getExecutiveAlerts: builder.query<any, ExecScope>({
      query: ({ restaurantId, ...scope }) =>
        `/api/executive/${restaurantId}/alerts?${scopeQuery(scope)}`,
      transformResponse: unwrap,
      providesTags: ["Executive"],
    }),

    // Returns rows, not an object — typed as an array so `data = []` at the
    // call site does not collapse to never[].
    getScorecards: builder.query<any[], ExecScope>({
      query: ({ restaurantId, ...scope }) =>
        `/api/executive/${restaurantId}/scorecards?${scopeQuery(scope)}`,
      transformResponse: (r: Envelope<any[]>) => unwrap(r) ?? [],
      providesTags: ["Executive"],
    }),

    /** Restaurant-wide by construction — comparing branches to each other. */
    getMultiBranch: builder.query<any, { restaurantId: number; period: string }>({
      query: ({ restaurantId, period }) =>
        `/api/executive/${restaurantId}/multi-branch?period=${period}`,
      transformResponse: unwrap,
      providesTags: ["Executive"],
    }),

    getInsightPanels: builder.query<any, { restaurantId: number; period: string }>({
      query: ({ restaurantId, period }) =>
        `/api/executive/${restaurantId}/insight-panels?period=${period}`,
      transformResponse: unwrap,
      providesTags: ["Executive"],
    }),

    /** Granularity rather than period — daily/weekly/monthly buckets. */
    getExecutiveTimeline: builder.query<any, TimelineScope>({
      query: ({ restaurantId, branchId, granularity }) => {
        const params = new URLSearchParams({ granularity });
        if (branchId) params.set("branchId", String(branchId));
        return `/api/executive/${restaurantId}/timeline?${params.toString()}`;
      },
      transformResponse: unwrap,
      providesTags: ["Executive"],
    }),

    getExecutivePreferences: builder.query<ExecutivePreferences | null, { restaurantId: number }>({
      query: ({ restaurantId }) => `/api/executive/${restaurantId}/preferences`,
      transformResponse: unwrap,
      providesTags: ["ExecutivePreferences"],
    }),

    /**
     * Saved layout — pinned KPIs and the default period.
     *
     * Only the preferences tag is invalidated: which cards are pinned changes
     * nothing about the figures on them, so invalidating "Executive" here would
     * refetch seven expensive endpoints because someone reordered a tile.
     */
    saveExecutivePreferences: builder.mutation<
      ExecutivePreferences | null,
      { restaurantId: number; pinnedKpis?: string[]; defaultPeriod?: string }
    >({
      query: ({ restaurantId, ...body }) => ({
        url: `/api/executive/${restaurantId}/preferences`,
        method: "PUT",
        body: { restaurantId, ...body },
      }),
      transformResponse: unwrap,
      invalidatesTags: ["ExecutivePreferences"],
    }),
  }),
});

export const {
  useGetExecutiveOverviewQuery,
  useGetHealthScoreQuery,
  useGetExecutiveAlertsQuery,
  useGetScorecardsQuery,
  useGetMultiBranchQuery,
  useGetInsightPanelsQuery,
  useGetExecutiveTimelineQuery,
  useGetExecutivePreferencesQuery,
  useSaveExecutivePreferencesMutation,
} = executiveApi;
