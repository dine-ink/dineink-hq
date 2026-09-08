import { api } from "./apiSlice";

/**
 * Add-on groups and their options — "Extra Cheese ₹40" and which menu items
 * carry it.
 *
 * The group list is read by two tabs (Add-Ons manages it, the Menu tab's attach
 * modal offers it), which is why it became the useAddOns hook during the
 * breakup. That hook refetched by hand after every write; the tag does it now.
 *
 * The per-item attachment is deliberately *not* a query. The attach modal
 * updates its checkboxes optimistically and rolls them back on failure, which
 * reads better than a round trip per click, and an add-on group that silently
 * fails to attach is one customers cannot order. Local state keeps that; the
 * mutations only replace the fetch.
 */

type Envelope<T> = { success?: boolean; data?: T; message?: string };

const unwrap = <T,>(response: Envelope<T>): T | null => response?.data ?? null;

export const addonsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getAddOnGroups: builder.query<any[], number>({
      query: (restaurantId) => `/api/addons/groups/${restaurantId}`,
      transformResponse: (response: Envelope<any[]>) => unwrap(response) ?? [],
      providesTags: ["AddOn"],
    }),

    /** The groups already attached to one menu item, for the attach modal. */
    getMenuItemAddOnGroups: builder.query<any[], number>({
      query: (menuItemId) => `/api/addons/menu-items/${menuItemId}`,
      transformResponse: (response: Envelope<any[]>) => unwrap(response) ?? [],
      providesTags: ["AddOn"],
    }),

    createAddOnGroup: builder.mutation<any, { restaurantId: number; name: string }>({
      query: (body) => ({ url: "/api/addons/groups", method: "POST", body }),
      transformResponse: (response: Envelope<any>) => unwrap(response),
      invalidatesTags: ["AddOn"],
    }),

    deleteAddOnGroup: builder.mutation<unknown, number>({
      query: (id) => ({ url: `/api/addons/groups/${id}`, method: "DELETE" }),
      invalidatesTags: ["AddOn"],
    }),

    createAddOnOption: builder.mutation<
      any,
      { addOnGroupId: number; name: string; price: number }
    >({
      query: (body) => ({ url: "/api/addons/options", method: "POST", body }),
      transformResponse: (response: Envelope<any>) => unwrap(response),
      invalidatesTags: ["AddOn"],
    }),

    deleteAddOnOption: builder.mutation<unknown, number>({
      query: (id) => ({ url: `/api/addons/options/${id}`, method: "DELETE" }),
      invalidatesTags: ["AddOn"],
    }),

    attachAddOnGroup: builder.mutation<
      unknown,
      { menuItemId: number; addOnGroupId: number }
    >({
      query: ({ menuItemId, addOnGroupId }) => ({
        url: `/api/addons/menu-items/${menuItemId}/groups`,
        method: "POST",
        body: { addOnGroupId },
      }),
      invalidatesTags: ["AddOn"],
    }),

    detachAddOnGroup: builder.mutation<
      unknown,
      { menuItemId: number; addOnGroupId: number }
    >({
      query: ({ menuItemId, addOnGroupId }) => ({
        url: `/api/addons/menu-items/${menuItemId}/groups/${addOnGroupId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["AddOn"],
    }),
  }),
});

export const {
  useGetAddOnGroupsQuery,
  useCreateAddOnGroupMutation,
  useDeleteAddOnGroupMutation,
  useCreateAddOnOptionMutation,
  useDeleteAddOnOptionMutation,
  useAttachAddOnGroupMutation,
  useDetachAddOnGroupMutation,
} = addonsApi;
