import { api } from "./apiSlice";

/**
 * Ingredient stock — saving the draft rows, generating a starting set from the
 * menu, per-ingredient price history and updates, and the vendor sheet import.
 *
 * All of these change what the menu-management payload returns (ingredients and
 * their prices live in it), so they invalidate "Inventory" and "MenuItem"
 * rather than asking the page to refetch. The old code called
 * `fetchMenuManagement()` by hand from some of these paths and not from others,
 * which is why a price update showed everywhere and a vendor import only showed
 * after a reload.
 *
 * Price history is a query keyed by ingredient, so reopening the same
 * ingredient's history within the cache window is free — it was a fresh request
 * every time the modal opened.
 */

type Envelope<T> = { success?: boolean; data?: T; message?: string };

const unwrap = <T,>(response: Envelope<T>): T | null => response?.data ?? null;

/** Everything a write here can affect: the stock list and the recipe costs. */
const STOCK_TAGS = ["Inventory", "MenuItem"] as const;

export const ingredientsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getIngredientPriceHistory: builder.query<any[], number>({
      query: (ingredientId) => `/api/ingredients/price-history/${ingredientId}`,
      transformResponse: (response: Envelope<any[]>) => unwrap(response) ?? [],
      providesTags: ["IngredientPrice"],
    }),

    getVendors: builder.query<any[], { restaurantId: number; branchId: number }>({
      query: ({ restaurantId, branchId }) =>
        `/api/ingredients/${restaurantId}/${branchId}/fetchVendors`,
      transformResponse: (response: Envelope<any[]>) => unwrap(response) ?? [],
      providesTags: ["Vendor"],
    }),

    saveIngredients: builder.mutation<
      any,
      { restaurantId: number; branchId: number; ingredients: any }
    >({
      query: (body) => ({
        url: "/api/ingredients/saveIngredients",
        method: "POST",
        body,
      }),
      transformResponse: (response: Envelope<any>) => unwrap(response),
      invalidatesTags: [...STOCK_TAGS],
    }),

    /**
     * Builds a starting ingredient list from the menu, for a new restaurant.
     *
     * Invalidates nothing on purpose. It writes no stock — it returns a
     * suggested list for the form to hold as a draft, and refetching the
     * menu-management payload would overwrite that draft with the empty list
     * still on the server.
     */
    generateIngredients: builder.mutation<any, { restaurantId: number }>({
      query: (body) => ({
        url: "/api/ingredients/generateIngredients",
        method: "POST",
        body,
      }),
      transformResponse: (response: Envelope<any>) => unwrap(response),
    }),

    updateIngredientPrice: builder.mutation<
      any,
      { ingredientId: number; restaurantId: number; newPrice: number }
    >({
      query: (body) => ({
        url: "/api/ingredients/price-update",
        method: "POST",
        body,
      }),
      transformResponse: (response: Envelope<any>) => unwrap(response),
      /**
       * Only its own history. Not the stock tags: the menu-management payload
       * seeds the editable ingredient draft, and a price change made from the
       * history modal should not discard rows someone is part-way through
       * typing elsewhere on the form. The caller patches the one price it
       * changed, which is what the old code did too.
       */
      invalidatesTags: ["IngredientPrice"],
    }),

    /**
     * Asks the model for a recipe. Invalidates nothing: it suggests rows for the
     * mapping form to hold as a draft, and nothing is written until Save.
     */
    aiSuggestIngredients: builder.mutation<any[], { menuItemId: number }>({
      query: (body) => ({
        url: "/api/ingredients/ai-suggestIngredients",
        method: "POST",
        body,
      }),
      transformResponse: (response: Envelope<any[]>) => unwrap(response) ?? [],
    }),

    uploadVendorData: builder.mutation<any, Record<string, any>>({
      query: (body) => ({
        url: "/api/ingredients/uploadVendorData",
        method: "POST",
        body,
      }),
      transformResponse: (response: Envelope<any>) => unwrap(response),
      invalidatesTags: [...STOCK_TAGS, "Vendor"],
    }),
  }),
});

export const {
  useAiSuggestIngredientsMutation,
  useGetIngredientPriceHistoryQuery,
  useGetVendorsQuery,
  useSaveIngredientsMutation,
  useGenerateIngredientsMutation,
  useUpdateIngredientPriceMutation,
  useUploadVendorDataMutation,
} = ingredientsApi;
