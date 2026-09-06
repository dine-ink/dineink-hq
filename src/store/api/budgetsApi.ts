import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { api } from "./apiSlice";

/**
 * Budgets and budget-vs-actual variance.
 *
 * Five of the six screens that read this module are Budget's own tabs; the
 * sixth is Scenario Analysis's Comparison tab, which shows a Budget column
 * beside its projections. That call stayed on `fetch` when the scenarios module
 * was migrated, because it belongs here — this slice is what lets it move.
 *
 * Variance is the endpoint worth noting. Every tab requests it per budget and
 * period, and Branch Comparison requests it once per branch, so the same
 * figures were being recomputed on each tab switch. Cached per
 * (budget, period, range), a tab switch now reuses what another tab already
 * asked for.
 */

export interface Budget {
  id: number;
  restaurantId: number;
  branchId: number | null;
  name: string;
  financialYear: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  notes: string | null;
  /** Included by the list endpoint so the picker can label a budget's scope. */
  branch?: { id: number; name: string } | null;
  /** Anything rendered into JSX must be declared — `unknown` is not a ReactNode. */
  [key: string]: unknown;
}

export interface VarianceRow {
  category: string;
  label?: string;
  /** Drives formatting, so it must be declared rather than left to the index signature. */
  unit?: "currency" | "percentage" | "count";
  budget: number | null;
  actual: number | null;
  variance: number | null;
  variancePercentage: number | null;
  achievementPercentage?: number | null;
  status?: string;
  [key: string]: unknown;
}

export interface VarianceReport {
  rows?: VarianceRow[];
  startDate?: string;
  endDate?: string;
  [key: string]: unknown;
}

export type BudgetListArgs = {
  restaurantId: number;
  branchId?: number | null;
  status?: "DRAFT" | "PUBLISHED" | "ARCHIVED";
};

export type VarianceArgs = {
  restaurantId: number;
  budgetId: number;
  period: string;
  from?: string;
  to?: string;
};

type Envelope<T> = { success?: boolean; data?: T };

const unwrap = <T,>(response: Envelope<T>): T | null => response?.data ?? null;

const varianceUrl = ({ restaurantId, budgetId, period, from, to }: VarianceArgs) => {
  const range = period === "custom" && from && to ? `&from=${from}&to=${to}` : "";
  return `/api/budgets/${restaurantId}/${budgetId}/variance?period=${period}${range}`;
};

export const budgetsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getBudgets: builder.query<Budget[], BudgetListArgs>({
      query: ({ restaurantId, branchId, status }) => {
        const params = new URLSearchParams();
        if (branchId !== undefined && branchId !== null) params.set("branchId", String(branchId));
        if (status) params.set("status", status);
        const qs = params.toString();
        return `/api/budgets/${restaurantId}${qs ? `?${qs}` : ""}`;
      },
      transformResponse: (r: Envelope<Budget[]>) => unwrap(r) ?? [],
      providesTags: ["Budget"],
    }),

    getBudget: builder.query<Budget | null, { restaurantId: number; budgetId: number }>({
      query: ({ restaurantId, budgetId }) => `/api/budgets/${restaurantId}/${budgetId}`,
      transformResponse: unwrap,
      providesTags: ["Budget"],
    }),

    /** Suggested fixed-cost figures when starting a new budget. */
    getFixedCostDefaults: builder.query<
      Record<string, number> | null,
      { restaurantId: number; branchId?: number | null }
    >({
      query: ({ restaurantId, branchId }) =>
        `/api/budgets/${restaurantId}/fixed-defaults${branchId ? `?branchId=${branchId}` : ""}`,
      transformResponse: unwrap,
      providesTags: ["Budget"],
    }),

    getBudgetVariance: builder.query<VarianceReport | null, VarianceArgs>({
      query: (args) => varianceUrl(args),
      transformResponse: unwrap,
      providesTags: ["BudgetVariance"],
    }),

    /**
     * Variance for several budgets at once — Branch Comparison asks per branch,
     * and a hook cannot be called in a loop. One cache entry keyed by the set.
     */
    getBudgetVarianceBatch: builder.query<
      Record<number, VarianceReport | null>,
      Omit<VarianceArgs, "budgetId"> & { budgetIds: number[] }
    >({
      queryFn: async ({ budgetIds, ...rest }, _api, _extra, baseQuery) => {
        try {
          const results = await Promise.all(
            budgetIds.map(async (budgetId) => {
              const res = await baseQuery(varianceUrl({ ...rest, budgetId }));
              if (res.error) throw res.error;
              return [budgetId, unwrap(res.data as Envelope<VarianceReport>)] as const;
            }),
          );
          return { data: Object.fromEntries(results) };
        } catch (error) {
          return { error: error as FetchBaseQueryError };
        }
      },
      providesTags: ["BudgetVariance"],
    }),

    /**
     * Variance for one budget across several date ranges — the 12-month trend
     * chart. Kept range-based rather than month-based so the financial-year
     * arithmetic stays in the component that owns it; this endpoint just runs
     * the ranges it is given, in order.
     */
    getBudgetVarianceRanges: builder.query<
      (VarianceReport | null)[],
      { restaurantId: number; budgetId: number; ranges: { from: string; to: string }[] }
    >({
      queryFn: async ({ restaurantId, budgetId, ranges }, _api, _extra, baseQuery) => {
        try {
          const data = await Promise.all(
            ranges.map(async ({ from, to }) => {
              const res = await baseQuery(
                varianceUrl({ restaurantId, budgetId, period: "custom", from, to }),
              );
              if (res.error) throw res.error;
              return unwrap(res.data as Envelope<VarianceReport>);
            }),
          );
          return { data };
        } catch (error) {
          return { error: error as FetchBaseQueryError };
        }
      },
      providesTags: ["BudgetVariance"],
    }),

    createBudget: builder.mutation<Budget | null, { restaurantId: number; body: unknown }>({
      query: ({ restaurantId, body }) => ({
        url: `/api/budgets/${restaurantId}`,
        method: "POST",
        body,
      }),
      transformResponse: unwrap,
      invalidatesTags: ["Budget", "BudgetVariance"],
    }),

    updateBudget: builder.mutation<
      Budget | null,
      { restaurantId: number; budgetId: number; body: unknown }
    >({
      query: ({ restaurantId, budgetId, body }) => ({
        url: `/api/budgets/${restaurantId}/${budgetId}`,
        method: "PUT",
        body,
      }),
      transformResponse: unwrap,
      invalidatesTags: ["Budget", "BudgetVariance"],
    }),

    /** Line items are what variance is computed from, so saving them invalidates it. */
    saveBudgetItems: builder.mutation<
      Budget | null,
      { restaurantId: number; budgetId: number; items: unknown }
    >({
      query: ({ restaurantId, budgetId, items }) => ({
        url: `/api/budgets/${restaurantId}/${budgetId}/items`,
        method: "PUT",
        body: items,
      }),
      transformResponse: unwrap,
      invalidatesTags: ["Budget", "BudgetVariance"],
    }),

    duplicateBudget: builder.mutation<
      Budget | null,
      { restaurantId: number; budgetId: number; body?: unknown }
    >({
      query: ({ restaurantId, budgetId, body }) => ({
        url: `/api/budgets/${restaurantId}/${budgetId}/duplicate`,
        method: "POST",
        body: body ?? {},
      }),
      transformResponse: unwrap,
      invalidatesTags: ["Budget"],
    }),

    deleteBudget: builder.mutation<void, { restaurantId: number; budgetId: number }>({
      query: ({ restaurantId, budgetId }) => ({
        url: `/api/budgets/${restaurantId}/${budgetId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Budget", "BudgetVariance"],
    }),
  }),
});

export const {
  useGetBudgetsQuery,
  useGetBudgetQuery,
  useGetFixedCostDefaultsQuery,
  useGetBudgetVarianceQuery,
  useGetBudgetVarianceBatchQuery,
  useGetBudgetVarianceRangesQuery,
  useCreateBudgetMutation,
  useUpdateBudgetMutation,
  useSaveBudgetItemsMutation,
  useDuplicateBudgetMutation,
  useDeleteBudgetMutation,
} = budgetsApi;
