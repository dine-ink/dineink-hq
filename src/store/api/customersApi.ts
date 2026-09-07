import { api } from "./apiSlice";

/**
 * Customers and the RFM segmentation built on them.
 *
 * Both list endpoints answer with the rows under `customers` rather than
 * `data`, unlike almost everything else in this API. Unwrapped here so no
 * caller has to know that, and the fallback to `data` is deliberate — if the
 * backend is ever normalised, this keeps working either way.
 *
 * The bulk WhatsApp panel reads the restaurant-wide list with a high limit and
 * bills excluded; the Customers table reads the branch list. Different
 * arguments, so different cache entries.
 */

type CustomerEnvelope = { success?: boolean; customers?: any[]; data?: any[] };

const unwrapCustomers = (response: CustomerEnvelope): any[] =>
  response?.customers ?? response?.data ?? [];

type Envelope<T> = { success?: boolean; data?: T };

export const customersApi = api.injectEndpoints({
  endpoints: (builder) => ({
    /**
     * Every customer for the restaurant.
     *
     * `limit` defaults high because the caller is a bulk-select list that needs
     * all of them to filter against, not the paginated table's first page.
     * `includeBills` defaults false for the same reason: that panel segments on
     * lastVisit/visits/spend only, so per-customer bill history is pure
     * payload.
     */
    getCustomersByRestaurant: builder.query<
      any[],
      { restaurantId: number; limit?: number; includeBills?: boolean }
    >({
      query: ({ restaurantId, limit = 5000, includeBills = false }) =>
        `/api/customers/${restaurantId}/customerByRestaurant?limit=${limit}&includeBills=${includeBills}`,
      transformResponse: unwrapCustomers,
      providesTags: ["Customer"],
    }),

    getCustomersByBranch: builder.query<
      any[],
      { restaurantId: number; branchId: number }
    >({
      query: ({ restaurantId, branchId }) =>
        `/api/customers/${restaurantId}/customerByBranch?branchId=${branchId}`,
      transformResponse: unwrapCustomers,
      providesTags: ["Customer"],
    }),

    getCustomerRfm: builder.query<any, { restaurantId: number; branchId: number }>({
      query: ({ restaurantId, branchId }) =>
        `/api/analytics/${restaurantId}/customer-rfm?branchId=${branchId}`,
      transformResponse: (response: Envelope<any>) => response?.data ?? null,
      providesTags: ["Customer", "Analytics"],
    }),
  }),
});

export const {
  useGetCustomersByRestaurantQuery,
  useGetCustomersByBranchQuery,
  useGetCustomerRfmQuery,
} = customersApi;
