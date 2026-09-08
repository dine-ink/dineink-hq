import { api } from "./apiSlice";

/**
 * Bank accounts, the cash-book transactions posted against them, and the UPI
 * collection details.
 *
 * Payment analytics is not here — that tab reads the dashboard overview, which
 * dashboardApi already defines, so it shares Dashboard's cache instead of
 * asking again.
 *
 * Reconciliation is a mutation rather than a query even though the caller only
 * reads its result. It marks transactions as reconciled on the server, so the
 * transaction list has to refresh afterwards, and expressing that as a tag is
 * the whole point.
 */

type Envelope<T> = { success?: boolean; data?: T; message?: string };

const unwrap = <T,>(response: Envelope<T>): T | null => response?.data ?? null;

/**
 * Ids are `number | string` because that is how this module's own types
 * declare them (see pages/banking/types.ts) and the URL takes either. Widened
 * here rather than cast at each call site.
 */
export type BankingId = number | string;

export type BranchRange = {
  restaurantId: number;
  branchId: number;
  from: string;
  to: string;
};

export const bankingApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getBankAccounts: builder.query<any[], number>({
      query: (restaurantId) => `/api/banking/accounts/${restaurantId}`,
      transformResponse: (response: Envelope<any[]>) => unwrap(response) ?? [],
      providesTags: ["BankAccount"],
    }),

    saveBankAccount: builder.mutation<
      any,
      { id?: BankingId | null; body: Record<string, any> }
    >({
      query: ({ id, body }) => ({
        url: id ? `/api/banking/accounts/${id}` : "/api/banking/accounts",
        method: id ? "PUT" : "POST",
        body,
      }),
      transformResponse: (response: Envelope<any>) => unwrap(response),
      invalidatesTags: ["BankAccount"],
    }),

    deleteBankAccount: builder.mutation<unknown, BankingId>({
      query: (id) => ({ url: `/api/banking/accounts/${id}`, method: "DELETE" }),
      // The transactions were posted against this account.
      invalidatesTags: ["BankAccount", "BankTransaction"],
    }),

    getBankTransactions: builder.query<any[], BranchRange>({
      query: ({ restaurantId, branchId, from, to }) =>
        `/api/banking/transactions/${restaurantId}/${branchId}?from=${from}&to=${to}`,
      transformResponse: (response: Envelope<any[]>) => unwrap(response) ?? [],
      providesTags: ["BankTransaction"],
    }),

    createBankTransaction: builder.mutation<any, Record<string, any>>({
      query: (body) => ({ url: "/api/banking/transactions", method: "POST", body }),
      transformResponse: (response: Envelope<any>) => unwrap(response),
      invalidatesTags: ["BankTransaction"],
    }),

    /** Marks transactions reconciled and reports what it matched. */
    reconcileTransactions: builder.mutation<
      any,
      { restaurantId: number; branchId: number }
    >({
      query: ({ restaurantId, branchId }) => ({
        url: `/api/banking/transactions/${restaurantId}/${branchId}/reconcile`,
        method: "POST",
      }),
      transformResponse: (response: Envelope<any>) => unwrap(response),
      invalidatesTags: ["BankTransaction"],
    }),

    getUpiConfig: builder.query<any, { restaurantId: number; branchId: number }>({
      query: ({ restaurantId, branchId }) =>
        `/api/banking/upi/${restaurantId}/${branchId}`,
      transformResponse: (response: Envelope<any>) => unwrap(response),
      providesTags: ["Upi"],
    }),

    /**
     * The QR image for the configured UPI id. Tagged with Upi so saving new
     * details invalidates the code rendered from the old ones — previously the
     * page kept showing a QR that pointed at the previous UPI id until it was
     * reloaded, which is a bad way to be paid.
     */
    getUpiQr: builder.query<any, { restaurantId: number; branchId: number }>({
      query: ({ restaurantId, branchId }) =>
        `/api/banking/upi/${restaurantId}/${branchId}/qr`,
      transformResponse: (response: Envelope<any>) => unwrap(response),
      providesTags: ["Upi"],
    }),

    saveUpiConfig: builder.mutation<any, Record<string, any>>({
      query: (body) => ({ url: "/api/banking/upi", method: "PUT", body }),
      transformResponse: (response: Envelope<any>) => unwrap(response),
      invalidatesTags: ["Upi"],
    }),
  }),
});

export const {
  useGetBankAccountsQuery,
  useSaveBankAccountMutation,
  useDeleteBankAccountMutation,
  useGetBankTransactionsQuery,
  useCreateBankTransactionMutation,
  useReconcileTransactionsMutation,
  useGetUpiConfigQuery,
  useGetUpiQrQuery,
  useSaveUpiConfigMutation,
} = bankingApi;
