import { api } from "./apiSlice";
import type { DueCategory, MonthlyDue } from "@/pages/dues/duesShared";

/**
 * Monthly dues — rent, EB, salaries and the rest of the fixed cost base.
 *
 * Second feature on RTK Query, following the shape discountsApi established.
 * The difference worth noting here is the tag: the list is scoped by branch and
 * month, so a write has to invalidate *that* list rather than every dues query
 * ever cached. `{ type: "Due", id: "<branch>-<month>-<year>" }` keeps a save in
 * September from refetching August, which the old code did implicitly by
 * calling `fetchDues()` for whatever period happened to be on screen.
 */

export type DuesScope = {
  restaurantId: number;
  branchId: number;
  month: number;
  year: number;
};

export type CreateDueInput = {
  branchId: number;
  category: DueCategory;
  month: number;
  year: number;
  amountDue: number;
  dueDate?: string;
  notes?: string;
  /** Which list to refresh once this lands. */
  scope: DuesScope;
};

export type UpdateDueInput = {
  id: number;
  amountDue?: number;
  amountPaid?: number;
  dueDate?: string;
  paidDate?: string;
  notes?: string;
  scope: DuesScope;
};

type Envelope<T> = { success?: boolean; data?: T };

const unwrap = <T,>(response: Envelope<T>): T | null => response?.data ?? null;

/** One cache entry per branch+period, so writes invalidate only their own. */
const scopeTag = ({ branchId, month, year }: DuesScope) =>
  [{ type: "Due" as const, id: `${branchId}-${month}-${year}` }];

export const duesApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getMonthlyDues: builder.query<MonthlyDue[], DuesScope>({
      query: ({ restaurantId, branchId, month, year }) =>
        `/api/dues/${restaurantId}/${branchId}?month=${month}&year=${year}`,
      transformResponse: (response: Envelope<MonthlyDue[]>) => unwrap(response) ?? [],
      providesTags: (_result, _error, scope) => scopeTag(scope),
    }),

    createMonthlyDue: builder.mutation<MonthlyDue | null, CreateDueInput>({
      query: ({ scope: _scope, ...body }) => ({ url: "/api/dues", method: "POST", body }),
      transformResponse: unwrap,
      invalidatesTags: (_result, _error, { scope }) => scopeTag(scope),
    }),

    updateMonthlyDue: builder.mutation<MonthlyDue | null, UpdateDueInput>({
      query: ({ id, scope: _scope, ...body }) => ({
        url: `/api/dues/${id}`,
        method: "PUT",
        body,
      }),
      transformResponse: unwrap,
      invalidatesTags: (_result, _error, { scope }) => scopeTag(scope),
    }),

    deleteMonthlyDue: builder.mutation<void, { id: number; scope: DuesScope }>({
      query: ({ id }) => ({ url: `/api/dues/${id}`, method: "DELETE" }),
      invalidatesTags: (_result, _error, { scope }) => scopeTag(scope),
    }),
  }),
});

export const {
  useGetMonthlyDuesQuery,
  useCreateMonthlyDueMutation,
  useUpdateMonthlyDueMutation,
  useDeleteMonthlyDueMutation,
} = duesApi;
