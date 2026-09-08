import { api } from "./apiSlice";

/**
 * Restaurant settings: the general profile, the logo, the branch list, and the
 * password change.
 *
 * `getMyRestaurant` is not here — dashboardApi already defines it, and this
 * page reads it after a branch edit to pick up the new list. Sharing that
 * definition is what lets a branch write refresh the shell's branch picker as
 * well, which the old code could not do from this page.
 *
 * The logo upload and the profile save stay separate mutations because they are
 * separate requests: one multipart, one JSON. The page still calls them in
 * order, logo first, exactly as before.
 */

type Envelope<T> = { success?: boolean; data?: T; message?: string };

const unwrap = <T,>(response: Envelope<T>): T | null => response?.data ?? null;

export type RestaurantId = number | string;

export const settingsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getRestaurantSettings: builder.query<any, number>({
      query: (restaurantId) => `/api/restaurant/settings/${restaurantId}`,
      transformResponse: (response: Envelope<any>) => unwrap(response),
      providesTags: ["Settings"],
    }),

    updateRestaurantGeneral: builder.mutation<
      any,
      { restaurantId: RestaurantId; body: Record<string, any> }
    >({
      query: ({ restaurantId, body }) => ({
        url: `/api/restaurant/general/${restaurantId}`,
        method: "PUT",
        body,
      }),
      transformResponse: (response: Envelope<any>) => unwrap(response),
      // The name and logo appear in the shell, not only on this page.
      invalidatesTags: ["Settings", "Restaurant"],
    }),

    /** Multipart: the file plus the restaurant it belongs to. */
    updateRestaurantLogo: builder.mutation<any, FormData>({
      query: (body) => ({
        url: "/api/restaurant/update-logo",
        method: "POST",
        body,
      }),
      transformResponse: (response: Envelope<any>) => unwrap(response),
      invalidatesTags: ["Settings", "Restaurant"],
    }),

    createBranch: builder.mutation<any, Record<string, any>>({
      query: (body) => ({
        url: "/api/restaurant/branches/create",
        method: "POST",
        body,
      }),
      transformResponse: (response: Envelope<any>) => unwrap(response),
      invalidatesTags: ["Settings", "Restaurant"],
    }),

    updateBranch: builder.mutation<any, Record<string, any>>({
      query: (body) => ({
        url: "/api/restaurant/branches/update",
        method: "PUT",
        body,
      }),
      transformResponse: (response: Envelope<any>) => unwrap(response),
      invalidatesTags: ["Settings", "Restaurant"],
    }),

    // ── One branch, in detail, plus its staff ───────────────────────────────
    getBranchDetails: builder.query<any, number>({
      query: (branchId) => `/api/restaurant/branch/${branchId}`,
      transformResponse: (response: Envelope<any>) => unwrap(response),
      providesTags: ["Branch"],
    }),

    updateBranchDetails: builder.mutation<
      any,
      { branchId: number; body: Record<string, any> }
    >({
      query: ({ branchId, body }) => ({
        url: `/api/restaurant/branch/${branchId}`,
        method: "PUT",
        body,
      }),
      transformResponse: (response: Envelope<any>) => unwrap(response),
      invalidatesTags: ["Branch", "Settings", "Restaurant"],
    }),

    createStaff: builder.mutation<any, Record<string, any>>({
      query: (body) => ({ url: "/api/restaurant/staff/create", method: "POST", body }),
      transformResponse: (response: Envelope<any>) => unwrap(response),
      // Staff are returned as part of the branch detail payload.
      invalidatesTags: ["Branch", "Staff"],
    }),

    updateStaff: builder.mutation<
      any,
      { staffId: number | string; body: Record<string, any> }
    >({
      query: ({ staffId, body }) => ({
        url: `/api/restaurant/staff/${staffId}`,
        method: "PUT",
        body,
      }),
      transformResponse: (response: Envelope<any>) => unwrap(response),
      invalidatesTags: ["Branch", "Staff"],
    }),

    /**
     * Changes the signed-in user's password. Invalidates nothing: it alters no
     * data any screen displays.
     */
    changePassword: builder.mutation<any, Record<string, any>>({
      query: (body) => ({
        url: "/api/auth/change-password",
        method: "PUT",
        body,
      }),
      transformResponse: (response: Envelope<any>) => unwrap(response),
    }),
  }),
});

export const {
  useGetRestaurantSettingsQuery,
  useGetBranchDetailsQuery,
  useUpdateBranchDetailsMutation,
  useCreateStaffMutation,
  useUpdateStaffMutation,
  useUpdateRestaurantGeneralMutation,
  useUpdateRestaurantLogoMutation,
  useCreateBranchMutation,
  useUpdateBranchMutation,
  useChangePasswordMutation,
} = settingsApi;
