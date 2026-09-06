import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { api } from "./apiSlice";

/**
 * Financial scenarios and their what-if projections.
 *
 * The largest slice so far — 23 call sites across six tabs — and the first
 * where the endpoint shapes are not all obvious:
 *
 *   - **what-if is a POST that is really a query.** It computes a projection
 *     from a scenario and a period; it changes nothing. Modelling it as
 *     `builder.query` with `method: "POST"` is what gives it a cache key, so
 *     the six tabs that ask for the same scenario/period combination stop
 *     recomputing it independently. Every tab switch used to refire it.
 *
 *   - **Three tabs fan out over N scenarios at once** (`selectedIds.map`), and
 *     a React hook cannot be called in a loop. `getWhatIfBatch` takes the id
 *     list as its argument and does the fan-out inside `queryFn`, so N
 *     projections are one cache entry keyed by the set that was asked for.
 */

export interface Scenario {
  id: number;
  restaurantId: number;
  branchId: number | null;
  name: string;
  description: string | null;
  type: string;
  isActive: boolean;
  /**
   * The override columns (revenueGrowthPercentage, rent, …) are read
   * dynamically from OVERRIDE_FIELDS rather than named here, so the index
   * signature stays. Anything rendered directly into JSX needs declaring
   * above, though — `unknown` is not a valid ReactNode.
   */
  [key: string]: unknown;
}

export interface WhatIfResult {
  startDate?: string;
  endDate?: string;
  kpis?: {
    key: string;
    baseline: number | null;
    projected: number | null;
    /** Direction of "good" — a cost KPI improves by going down. */
    higherIsBetter?: boolean;
    [key: string]: unknown;
  }[];
  /** The scenario's effective value per override field, for the slider labels. */
  currentValues?: Record<string, number | null>;
  [key: string]: unknown;
}

export type ScenarioListArgs = {
  restaurantId: number;
  /** null means the restaurant-wide set; a number scopes to one branch. */
  branchId: number | null;
  activeOnly?: boolean;
};

export type WhatIfArgs = {
  restaurantId: number;
  scenarioId: number;
  period: string;
  from?: string;
  to?: string;
  /**
   * Unsaved override values, for the Overview tab's live preview. They are part
   * of the argument — and therefore part of the cache key — so dragging a
   * slider back to a value already tried serves from cache instead of
   * recomputing. Omitted everywhere else, which asks for the scenario's own
   * saved overrides.
   */
  overrides?: Record<string, number | null>;
};

type Envelope<T> = { success?: boolean; data?: T };

const unwrap = <T,>(response: Envelope<T>): T | null => response?.data ?? null;

const whatIfUrl = ({ restaurantId, scenarioId, period, from, to }: WhatIfArgs) => {
  const range = period === "custom" && from && to ? `&from=${from}&to=${to}` : "";
  return `/api/scenarios/${restaurantId}/${scenarioId}/what-if?period=${period}${range}`;
};

export const scenariosApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getScenarios: builder.query<Scenario[], ScenarioListArgs>({
      query: ({ restaurantId, branchId, activeOnly }) => {
        const branchParam = branchId === null ? "null" : String(branchId);
        return `/api/scenarios/${restaurantId}?branchId=${branchParam}${activeOnly ? "&activeOnly=true" : ""}`;
      },
      transformResponse: (r: Envelope<Scenario[]>) => unwrap(r) ?? [],
      providesTags: ["Scenario"],
    }),

    /** One projection. A query despite being a POST — see the note above. */
    getWhatIf: builder.query<WhatIfResult | null, WhatIfArgs>({
      query: (args) => ({ url: whatIfUrl(args), method: "POST", body: args.overrides ?? {} }),
      transformResponse: unwrap,
      providesTags: ["ScenarioProjection"],
    }),

    /**
     * N projections in one cache entry.
     *
     * `queryFn` rather than `query` because this is several requests, not one.
     * A rejection from any of them fails the whole entry: a comparison table
     * showing three of five columns with no explanation is worse than an error,
     * since the missing columns look like scenarios with no data.
     */
    getWhatIfBatch: builder.query<
      Record<number, WhatIfResult | null>,
      Omit<WhatIfArgs, "scenarioId"> & { scenarioIds: number[] }
    >({
      queryFn: async ({ scenarioIds, ...rest }, _api, _extra, baseQuery) => {
        const responses = await Promise.all(
          scenarioIds.map((scenarioId) =>
            baseQuery({
              url: whatIfUrl({ ...rest, scenarioId }),
              method: "POST",
              body: {},
            }),
          ),
        );

        // `baseQuery` is already typed here; casting it to BaseQueryFn widens
        // the error to `{}` and stops it matching FetchBaseQueryError.
        const failed = responses.find((r) => r.error);
        if (failed?.error) return { error: failed.error };

        const data: Record<number, WhatIfResult | null> = {};
        scenarioIds.forEach((id, i) => {
          data[id] = unwrap(responses[i].data as Envelope<WhatIfResult>);
        });
        return { data };
      },
      providesTags: ["ScenarioProjection"],
    }),

    /**
     * "How does every branch compare under this template?"
     *
     * Two requests per branch — list its scenarios, find its EXPECTED one, then
     * project that one with the template's overrides. The UI asks one question,
     * so it is one query and one cache entry rather than 2N hooks that cannot
     * be written anyway.
     *
     * A branch with no EXPECTED scenario yields an empty KPI list rather than
     * failing the batch: that is a real and expected state (a branch nobody has
     * set scenarios up for), not an error.
     */
    getBranchScenarioComparison: builder.query<
      { branchId: number; kpis: NonNullable<WhatIfResult["kpis"]> }[],
      {
        restaurantId: number;
        branchIds: number[];
        period: string;
        overrides: Record<string, number | null>;
      }
    >({
      queryFn: async ({ restaurantId, branchIds, period, overrides }, _api, _extra, baseQuery) => {
        // Throw-and-catch rather than returning `{error}` from inside the map:
        // that produces a union TypeScript will not narrow back to
        // QueryReturnValue, and the shape it wants is exactly this.
        try {
          const data = await Promise.all(
            branchIds.map(async (branchId) => {
              const list = await baseQuery(
                `/api/scenarios/${restaurantId}?branchId=${branchId}&activeOnly=true`,
              );
              if (list.error) throw list.error;

              const scenarios = unwrap(list.data as Envelope<Scenario[]>) ?? [];
              const expected = scenarios.find((s) => s.type === "EXPECTED");
              if (!expected) return { branchId, kpis: [] };

              const projection = await baseQuery({
                url: whatIfUrl({ restaurantId, scenarioId: expected.id, period }),
                method: "POST",
                body: overrides,
              });
              if (projection.error) throw projection.error;

              return {
                branchId,
                kpis: unwrap(projection.data as Envelope<WhatIfResult>)?.kpis ?? [],
              };
            }),
          );
          return { data };
        } catch (error) {
          return { error: error as FetchBaseQueryError };
        }
      },
      providesTags: ["ScenarioProjection"],
    }),

    createScenario: builder.mutation<Scenario | null, { restaurantId: number; body: unknown }>({
      query: ({ restaurantId, body }) => ({
        url: `/api/scenarios/${restaurantId}`,
        method: "POST",
        body,
      }),
      transformResponse: unwrap,
      invalidatesTags: ["Scenario", "ScenarioProjection"],
    }),

    updateScenario: builder.mutation<
      Scenario | null,
      { restaurantId: number; id: number; body: unknown }
    >({
      query: ({ restaurantId, id, body }) => ({
        url: `/api/scenarios/${restaurantId}/${id}`,
        method: "PUT",
        body,
      }),
      transformResponse: unwrap,
      // Overrides feed the projection, so a saved change invalidates both.
      invalidatesTags: ["Scenario", "ScenarioProjection"],
    }),

    resetScenarioFields: builder.mutation<
      Scenario | null,
      { restaurantId: number; id: number; fields: string[] }
    >({
      query: ({ restaurantId, id, fields }) => ({
        url: `/api/scenarios/${restaurantId}/${id}/reset-fields`,
        method: "PUT",
        body: { fields },
      }),
      transformResponse: unwrap,
      invalidatesTags: ["Scenario", "ScenarioProjection"],
    }),

    cloneScenario: builder.mutation<Scenario | null, { restaurantId: number; id: number }>({
      query: ({ restaurantId, id }) => ({
        url: `/api/scenarios/${restaurantId}/${id}/clone`,
        method: "POST",
        body: {},
      }),
      transformResponse: unwrap,
      invalidatesTags: ["Scenario"],
    }),

    deleteScenario: builder.mutation<void, { restaurantId: number; id: number }>({
      query: ({ restaurantId, id }) => ({
        url: `/api/scenarios/${restaurantId}/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Scenario", "ScenarioProjection"],
    }),
  }),
});

export const {
  useGetScenariosQuery,
  useGetBranchScenarioComparisonQuery,
  useGetWhatIfQuery,
  useGetWhatIfBatchQuery,
  useCreateScenarioMutation,
  useUpdateScenarioMutation,
  useResetScenarioFieldsMutation,
  useCloneScenarioMutation,
  useDeleteScenarioMutation,
} = scenariosApi;
