import { api } from "./apiSlice";

/**
 * Inventory — the menu-management payload the page is built on, the
 * item-to-ingredient mappings, the restock sheets and the daily stock audit.
 *
 * The menu-management endpoint is the interesting one. It returns menu items,
 * ingredients, categories and restock sheets in a single response, and the
 * effect that used to fetch it listed `selectedWeek` in its dependencies —
 * because the restock rows are reformatted per week. So changing the week
 * refetched this payload, the mappings and the month's bills: three requests to
 * reshape rows the client already had.
 *
 * The cache key here carries only restaurant and branch. The per-week
 * formatting became a derivation over the cached payload, which is where it
 * always belonged.
 */

type Envelope<T> = { success?: boolean; data?: T; message?: string };

const unwrap = <T,>(response: Envelope<T>): T | null => response?.data ?? null;

export type MenuManagementPayload = {
  menuItems?: any[];
  ingredients?: any[];
  categories?: any[];
  restocks?: any[];
};

export type BranchScope = { restaurantId: number; branchId?: number | null };

export const inventoryApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getMenuManagement: builder.query<MenuManagementPayload | null, BranchScope>({
      query: ({ restaurantId, branchId }) =>
        `/api/inventory/${restaurantId}/menu-management?branchId=${branchId}`,
      transformResponse: (response: Envelope<MenuManagementPayload>) => unwrap(response),
      providesTags: ["Inventory", "MenuItem"],
    }),

    getMappedMenu: builder.query<any[], number>({
      query: (restaurantId) => `/api/inventory/${restaurantId}/get-mapped-menu`,
      transformResponse: (response: Envelope<any[]>) => unwrap(response) ?? [],
      providesTags: ["IngredientMapping"],
    }),

    getRestockHistory: builder.query<any[], BranchScope>({
      // The empty string for "no branch" is this endpoint's own convention.
      query: ({ restaurantId, branchId }) =>
        `/api/inventory/${restaurantId}/get-restock-history?branchId=${branchId || ""}`,
      transformResponse: (response: Envelope<any[]>) => unwrap(response) ?? [],
      providesTags: ["Inventory"],
    }),

    /**
     * Whether a closing-stock audit has been submitted today. Returns null on
     * failure rather than 0, because "we could not check" and "none submitted"
     * drive different messages — the page nags only for the second.
     */
    getDailyAuditCount: builder.query<
      number | null,
      { branchId: number; date: string }
    >({
      query: ({ branchId, date }) =>
        `/api/inventory/daily-audit/history?branchId=${branchId}&from=${date}&to=${date}`,
      transformResponse: (response: Envelope<any[]>) =>
        response?.success ? (response.data || []).length : null,
      providesTags: ["Inventory"],
    }),

    saveRestockHistory: builder.mutation<any, Record<string, any>>({
      query: (body) => ({
        url: "/api/inventory/save-restock-history",
        method: "POST",
        body,
      }),
      transformResponse: (response: Envelope<any>) => unwrap(response),
      invalidatesTags: ["Inventory"],
    }),

    saveMenuItemMapping: builder.mutation<any, Record<string, any>>({
      query: (body) => ({
        url: "/api/inventory/save-menu-item-mapping",
        method: "POST",
        body,
      }),
      transformResponse: (response: Envelope<any>) => unwrap(response),
      // The mapping changes what a recipe costs, so the menu-management payload
      // (which carries the mappings) has to go too.
      invalidatesTags: ["IngredientMapping", "MenuItem"],
    }),
  }),
});

export const {
  useGetMenuManagementQuery,
  useGetMappedMenuQuery,
  useGetRestockHistoryQuery,
  useGetDailyAuditCountQuery,
  useSaveRestockHistoryMutation,
  useSaveMenuItemMappingMutation,
} = inventoryApi;
