import { api } from "./apiSlice";

/**
 * Vendors: who they are, what is owed to them, how they perform, and the
 * invoices and payments behind those figures.
 *
 * The vendor *list* is not here. It lives in ingredientsApi, because the
 * endpoint is `/api/ingredients/{restaurantId}/{branchId}/fetchVendors` and the
 * ingredient editor in Menu Management reads it too. One definition, one cache
 * entry, both screens.
 *
 * Outstanding balances moved here from insightsApi and now return the list
 * rather than a total. Insights only wants the sum, but defining a second
 * endpoint on the same URL to do the summing would have meant two cache entries
 * and two requests for one answer — so the endpoint returns what the API
 * returns and Insights adds it up.
 *
 * Every write invalidates "VendorLedger". Recording a payment, creating an
 * invoice and paying one all change what is owed, and the old code called
 * `fetchOutstanding()` by hand from five places to keep up.
 */

type Envelope<T> = { success?: boolean; data?: T; message?: string };

const unwrap = <T,>(response: Envelope<T>): T | null => response?.data ?? null;

export type VendorScope = { restaurantId: number; branchId: number };

export const vendorsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    /**
     * What is owed to each vendor.
     *
     * The unwrap tolerates both an enveloped list and a bare array; that was in
     * the original and is kept, because this endpoint has answered both ways.
     */
    getVendorOutstanding: builder.query<any[], VendorScope>({
      query: ({ restaurantId, branchId }) =>
        `/api/vendors/outstanding/${restaurantId}/${branchId}`,
      transformResponse: (response: any) => {
        const rows = response?.data || response || [];
        return Array.isArray(rows) ? rows : [];
      },
      providesTags: ["VendorLedger"],
    }),

    getVendorPerformance: builder.query<any[], VendorScope>({
      query: ({ restaurantId, branchId }) =>
        `/api/vendors/performance/${restaurantId}/${branchId}`,
      transformResponse: (response: Envelope<any[]>) => unwrap(response) ?? [],
      providesTags: ["VendorLedger"],
    }),

    getVendorPayments: builder.query<any[], number>({
      query: (vendorId) => `/api/vendors/${vendorId}/payments`,
      transformResponse: (response: Envelope<any[]>) => unwrap(response) ?? [],
      providesTags: ["VendorLedger"],
    }),

    getVendorInvoices: builder.query<any[], number>({
      query: (vendorId) => `/api/vendors/${vendorId}/invoices`,
      transformResponse: (response: Envelope<any[]>) => unwrap(response) ?? [],
      providesTags: ["VendorLedger"],
    }),

    /** Which ingredients this vendor supplies — also the reorder dialog's list. */
    getVendorIngredients: builder.query<any[], number>({
      query: (vendorId) => `/api/ingredients/vendors/${vendorId}/ingredients`,
      transformResponse: (response: Envelope<any[]>) => unwrap(response) ?? [],
      providesTags: ["Vendor"],
    }),

    getVendorPricingHistory: builder.query<any[], number>({
      query: (vendorId) => `/api/vendors/${vendorId}/pricing-history`,
      transformResponse: (response: Envelope<any[]>) => unwrap(response) ?? [],
      providesTags: ["Vendor"],
    }),

    saveVendor: builder.mutation<any, { id?: number | null; body: Record<string, any> }>({
      query: ({ id, body }) => ({
        url: id ? `/api/ingredients/vendors/${id}` : "/api/ingredients/vendors",
        method: id ? "PUT" : "POST",
        body,
      }),
      transformResponse: (response: Envelope<any>) => unwrap(response),
      invalidatesTags: ["Vendor", "VendorLedger"],
    }),

    deleteVendor: builder.mutation<unknown, number>({
      query: (id) => ({ url: `/api/ingredients/vendors/${id}`, method: "DELETE" }),
      invalidatesTags: ["Vendor", "VendorLedger"],
    }),

    /**
     * This is money. A payment that silently fails to record is
     * indistinguishable from one that succeeded until someone reconciles
     * against the vendor's own statement, so the caller must surface a
     * rejection — `.unwrap()` is what makes that unavoidable.
     */
    recordVendorPayment: builder.mutation<any, Record<string, any>>({
      query: (body) => ({ url: "/api/vendors/payments", method: "POST", body }),
      transformResponse: (response: Envelope<any>) => unwrap(response),
      invalidatesTags: ["VendorLedger"],
    }),

    /**
     * Takes either a JSON object or FormData. With an e-bill attached the
     * endpoint wants multipart so it can set documentUrl; with no file it wants
     * the JSON body this screen has always sent. fetchBaseQuery passes FormData
     * through untouched and omits the JSON content-type for it, so one mutation
     * covers both without the caller branching on transport.
     */
    createVendorInvoice: builder.mutation<any, Record<string, any> | FormData>({
      query: (body) => ({ url: "/api/vendors/invoices", method: "POST", body }),
      transformResponse: (response: Envelope<any>) => unwrap(response),
      invalidatesTags: ["VendorLedger"],
    }),

    payVendorInvoice: builder.mutation<any, { invoiceId: number; amount: number }>({
      query: ({ invoiceId, amount }) => ({
        url: `/api/vendors/invoices/${invoiceId}/pay`,
        method: "PUT",
        body: { amount },
      }),
      transformResponse: (response: Envelope<any>) => unwrap(response),
      invalidatesTags: ["VendorLedger"],
    }),

    /** Sends a reorder request to the vendor over the chosen channel. */
    reorderFromVendor: builder.mutation<
      any,
      { vendorId: number; branchId: number; channel: string; ingredientIds: number[] }
    >({
      query: ({ vendorId, ...body }) => ({
        url: `/api/vendors/${vendorId}/reorder`,
        method: "POST",
        body,
      }),
      transformResponse: (response: Envelope<any>) => unwrap(response),
      invalidatesTags: ["VendorLedger"],
    }),
  }),
});

export const {
  useGetVendorOutstandingQuery,
  useGetVendorPerformanceQuery,
  useGetVendorPaymentsQuery,
  useGetVendorInvoicesQuery,
  useGetVendorIngredientsQuery,
  useGetVendorPricingHistoryQuery,
  useSaveVendorMutation,
  useDeleteVendorMutation,
  useRecordVendorPaymentMutation,
  useCreateVendorInvoiceMutation,
  usePayVendorInvoiceMutation,
  useReorderFromVendorMutation,
} = vendorsApi;
