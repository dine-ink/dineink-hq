import { api } from "./apiSlice";

/**
 * The remaining operational corners: equipment and its maintenance schedule,
 * labour roles and shifts, the daily stock audit, cash sessions, cash-flow
 * projections, and the procurement price lookup.
 *
 * These are grouped because each is one or two endpoints on its own, and eight
 * near-empty slice files would be worse than one honest grouping. They share no
 * tags — each has its own — so nothing invalidates anything it should not.
 *
 * The labour endpoints take a path suffix rather than being enumerated. That is
 * how the page calls them (`/api/labor${path}`), and inventing five endpoint
 * names for paths the caller builds at runtime would be a fiction.
 */

type Envelope<T> = { success?: boolean; data?: T; message?: string };

const unwrap = <T,>(response: Envelope<T>): T | null => response?.data ?? null;

export type EquipmentId = number | string;

export const operationsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // ── Equipment ───────────────────────────────────────────────────────────
    getEquipment: builder.query<any[], { restaurantId: number; branchId: number }>({
      query: ({ restaurantId, branchId }) =>
        `/api/equipment/${restaurantId}/${branchId}`,
      transformResponse: (response: Envelope<any[]>) => unwrap(response) ?? [],
      providesTags: ["Equipment"],
    }),

    getMaintenanceDue: builder.query<
      any[],
      { restaurantId: number; branchId: number; withinDays?: number }
    >({
      query: ({ restaurantId, branchId, withinDays = 30 }) =>
        `/api/equipment/${restaurantId}/${branchId}/maintenance-due?withinDays=${withinDays}`,
      transformResponse: (response: Envelope<any[]>) => unwrap(response) ?? [],
      providesTags: ["Equipment"],
    }),

    saveEquipment: builder.mutation<
      any,
      { id?: EquipmentId | null; body: Record<string, any> }
    >({
      query: ({ id, body }) => ({
        url: id ? `/api/equipment/${id}` : "/api/equipment",
        method: id ? "PUT" : "POST",
        body,
      }),
      transformResponse: (response: Envelope<any>) => unwrap(response),
      invalidatesTags: ["Equipment"],
    }),

    deleteEquipment: builder.mutation<unknown, EquipmentId>({
      query: (id) => ({ url: `/api/equipment/${id}`, method: "DELETE" }),
      invalidatesTags: ["Equipment"],
    }),

    // ── Labour ──────────────────────────────────────────────────────────────
    /** `path` is appended verbatim and is part of the cache key. */
    getLabor: builder.query<any, { path: string }>({
      query: ({ path }) => `/api/labor${path}`,
      transformResponse: (response: Envelope<any>) => unwrap(response),
      providesTags: ["Labor"],
    }),

    writeLabor: builder.mutation<
      any,
      { path: string; method: "POST" | "PUT" | "DELETE"; body?: Record<string, any> }
    >({
      query: ({ path, method, body }) => ({ url: `/api/labor${path}`, method, body }),
      transformResponse: (response: Envelope<any>) => unwrap(response),
      invalidatesTags: ["Labor"],
    }),

    // ── Daily stock audit ───────────────────────────────────────────────────
    /**
     * What the audit *would* record for a date, before anyone commits to it.
     * A read, so a query — and keyed by date, so flicking between days does not
     * re-derive one already looked at.
     */
    getDailyAuditPreview: builder.query<any, { branchId: number; date: string }>({
      query: ({ branchId, date }) =>
        `/api/inventory/daily-audit/preview?branchId=${branchId}&date=${date}`,
      transformResponse: (response: Envelope<any>) => unwrap(response),
      providesTags: ["StockAudit"],
    }),

    submitDailyAudit: builder.mutation<any, Record<string, any>>({
      query: (body) => ({ url: "/api/inventory/daily-audit", method: "POST", body }),
      transformResponse: (response: Envelope<any>) => unwrap(response),
      // Filing an audit changes the stock the inventory screens read, and it is
      // what the Menu Management audit reminder counts.
      invalidatesTags: ["StockAudit", "Inventory"],
    }),

    // ── Cash ────────────────────────────────────────────────────────────────
    getCashSessions: builder.query<
      any[],
      { branchId: number; from: string; to: string }
    >({
      query: ({ branchId, from, to }) =>
        `/api/cash/sessions?branchId=${branchId}&from=${from}&to=${to}`,
      transformResponse: (response: Envelope<any[]>) => unwrap(response) ?? [],
      providesTags: ["Cash"],
    }),

    // ── Cash flow ───────────────────────────────────────────────────────────
    getCashInflowDaily: builder.query<
      any[],
      { restaurantId: number; branchId: number; from: string; to: string }
    >({
      query: ({ restaurantId, branchId, from, to }) =>
        `/api/cashflow/${restaurantId}/${branchId}/inflow-daily?from=${from}&to=${to}`,
      transformResponse: (response: Envelope<any[]>) => unwrap(response) ?? [],
      providesTags: ["Cash"],
    }),

    getCashProjection: builder.query<
      any,
      { restaurantId: number; branchId: number; horizon: number | string }
    >({
      query: ({ restaurantId, branchId, horizon }) =>
        `/api/cashflow/${restaurantId}/${branchId}/projection?horizon=${horizon}`,
      transformResponse: (response: Envelope<any>) => unwrap(response),
      providesTags: ["Cash"],
    }),

    // ── Procurement ─────────────────────────────────────────────────────────
    /** Market price lookup for an ingredient name. */
    getProcurementPrices: builder.query<any, { term: string }>({
      query: ({ term }) => `/api/procurement/prices?term=${encodeURIComponent(term)}`,
      transformResponse: (response: Envelope<any>) => unwrap(response),
      providesTags: ["Procurement"],
    }),
  }),
});

export const {
  useGetEquipmentQuery,
  useGetMaintenanceDueQuery,
  useSaveEquipmentMutation,
  useDeleteEquipmentMutation,
  useGetLaborQuery,
  useWriteLaborMutation,
  useGetDailyAuditPreviewQuery,
  useSubmitDailyAuditMutation,
  useGetCashSessionsQuery,
  useGetCashInflowDailyQuery,
  useGetCashProjectionQuery,
  useGetProcurementPricesQuery,
} = operationsApi;
