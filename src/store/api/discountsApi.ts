import { api } from "./apiSlice";

/**
 * Discount codes — the first feature migrated to RTK Query *mutations*.
 *
 * `dashboardApi` established the query half of the pattern. This adds the
 * other half, which is where the interesting differences are:
 *
 *   - **Cache invalidation replaces manual list surgery.** The page used to
 *     splice its own state after every write — `setCodes(prev => [new, ...prev])`
 *     on create, `.map()` on toggle, `.filter()` on delete. Three separate
 *     re-implementations of "what the list looks like now", each able to drift
 *     from what the server actually stored. `invalidatesTags` refetches the one
 *     query that owns that answer.
 *
 *   - **Failures stop being silent.** Every mutation hook exposes `error`, so
 *     there is no way to write the `catch { /* silent *\/ }` that made a failed
 *     toggle or delete look like a no-op.
 *
 * The endpoint list mirrors modules/discounts on the backend, one slice per
 * backend module — the convention internal-web already follows for all 14 of
 * its API groups.
 */

export type DiscountCode = {
  id: number;
  code: string;
  type: "PERCENTAGE" | "FIXED";
  value: number;
  isActive: boolean;
  maxUses: number | null;
  usedCount: number;
  expiresAt: string | null;
};

export type CreateDiscountInput = {
  code: string;
  type: "PERCENTAGE" | "FIXED";
  value: number;
  maxUses?: number | null;
  expiresAt?: string | null;
};

/** The fields the backend's updateDiscountSchema accepts. */
export type UpdateDiscountInput = {
  id: number;
  isActive?: boolean;
  value?: number;
  maxUses?: number | null;
  expiresAt?: string | null;
};

type Envelope<T> = { success?: boolean; data?: T };

const unwrap = <T,>(response: Envelope<T>): T | null => response?.data ?? null;

export const discountsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getDiscountCodes: builder.query<DiscountCode[], { restaurantId: number }>({
      query: ({ restaurantId }) => `/api/discounts/${restaurantId}`,
      transformResponse: (response: Envelope<DiscountCode[]>) => unwrap(response) ?? [],
      providesTags: ["Discount"],
    }),

    createDiscountCode: builder.mutation<DiscountCode | null, CreateDiscountInput>({
      query: (body) => ({ url: "/api/discounts", method: "POST", body }),
      transformResponse: unwrap,
      invalidatesTags: ["Discount"],
    }),

    updateDiscountCode: builder.mutation<DiscountCode | null, UpdateDiscountInput>({
      query: ({ id, ...body }) => ({ url: `/api/discounts/${id}`, method: "PUT", body }),
      transformResponse: unwrap,
      invalidatesTags: ["Discount"],
    }),

    deleteDiscountCode: builder.mutation<void, { id: number }>({
      query: ({ id }) => ({ url: `/api/discounts/${id}`, method: "DELETE" }),
      invalidatesTags: ["Discount"],
    }),
  }),
});

export const {
  useGetDiscountCodesQuery,
  useCreateDiscountCodeMutation,
  useUpdateDiscountCodeMutation,
  useDeleteDiscountCodeMutation,
} = discountsApi;
