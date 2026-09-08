import { api } from "./apiSlice";

/**
 * Menu items and their categories.
 *
 * These writes used to patch the page's local `menuItems` array by hand —
 * mapping over it after an edit, filtering after a delete, appending after a
 * create. That works until a second view of the same data exists, and by the
 * time this was migrated there were three: the Menu tab's list, the mobile
 * accordion, and the menu-engineering matrix.
 *
 * Invalidating "MenuItem" refreshes the menu-management payload those all read
 * from, so the local patching is gone.
 *
 * Save covers create and edit in one mutation: the caller passes an `id` for an
 * edit and omits it for a create, and the PUT/POST choice lives next to the
 * request rather than in the component.
 */

type Envelope<T> = { success?: boolean; data?: T; message?: string };

const unwrap = <T,>(response: Envelope<T>): T | null => response?.data ?? null;

export type SaveMenuItemInput = {
  /** Present for an edit, absent for a create. */
  id?: number | null;
  payload: Record<string, any>;
};

export const menuApi = api.injectEndpoints({
  endpoints: (builder) => ({
    createMenuCategory: builder.mutation<any, { restaurantId: number; name: string }>({
      query: (body) => ({ url: "/api/restaurant/categories", method: "POST", body }),
      transformResponse: (response: Envelope<any>) => unwrap(response),
      invalidatesTags: ["MenuItem"],
    }),

    saveMenuItem: builder.mutation<any, SaveMenuItemInput>({
      query: ({ id, payload }) => ({
        url: id ? `/api/restaurant/menu-items/${id}` : "/api/restaurant/menu-items",
        method: id ? "PUT" : "POST",
        body: payload,
      }),
      transformResponse: (response: Envelope<any>) => unwrap(response),
      invalidatesTags: ["MenuItem"],
    }),

    deleteMenuItem: builder.mutation<unknown, number>({
      query: (id) => ({ url: `/api/restaurant/menu-items/${id}`, method: "DELETE" }),
      invalidatesTags: ["MenuItem"],
    }),

    /** The availability switch — a PUT of one field, kept separate for clarity. */
    setMenuItemAvailability: builder.mutation<
      any,
      { id: number; isAvailable: boolean }
    >({
      query: ({ id, isAvailable }) => ({
        url: `/api/restaurant/menu-items/${id}`,
        method: "PUT",
        body: { isAvailable },
      }),
      transformResponse: (response: Envelope<any>) => unwrap(response),
      invalidatesTags: ["MenuItem"],
    }),
  }),
});

export const {
  useCreateMenuCategoryMutation,
  useSaveMenuItemMutation,
  useDeleteMenuItemMutation,
  useSetMenuItemAvailabilityMutation,
} = menuApi;
