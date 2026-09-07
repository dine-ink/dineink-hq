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
    /**
     * Three read-only roll-ups over the same dues the list above manages, so
     * they carry the same scope tag: recording a payment refreshes the EBITDA
     * summary, the month-on-month comparison and the payment calendar together.
     * Each was a separate hand-written fetch before, and none of them refreshed
     * after a write.
     */
    getDuesEbitdaSummary: builder.query<any, DuesScope>({
      query: ({ restaurantId, branchId, month, year }) =>
        `/api/dues/${restaurantId}/${branchId}/ebitda-summary?month=${month}&year=${year}`,
      transformResponse: (response: Envelope<any>) => unwrap(response),
      providesTags: (_result, _error, scope) => scopeTag(scope),
    }),

    getDuesMonthComparison: builder.query<any, DuesScope>({
      query: ({ restaurantId, branchId, month, year }) =>
        `/api/dues/${restaurantId}/${branchId}/month-comparison?month=${month}&year=${year}`,
      transformResponse: (response: Envelope<any>) => unwrap(response),
      providesTags: (_result, _error, scope) => scopeTag(scope),
    }),

    getDuesPaymentCalendar: builder.query<
      any,
      Omit<DuesScope, "month" | "year"> & { month: number; year: number; from: string; to: string }
    >({
      query: ({ restaurantId, branchId, from, to }) =>
        `/api/dues/${restaurantId}/${branchId}/payment-calendar?from=${from}&to=${to}`,
      transformResponse: (response: Envelope<any>) => unwrap(response),
      providesTags: (_result, _error, scope) => scopeTag(scope),
    }),
  }),
});

export const {
  useGetMonthlyDuesQuery,
  useGetDuesEbitdaSummaryQuery,
  useGetDuesMonthComparisonQuery,
  useGetDuesPaymentCalendarQuery,
  useCreateMonthlyDueMutation,
  useUpdateMonthlyDueMutation,
  useDeleteMonthlyDueMutation,
} = duesApi;
