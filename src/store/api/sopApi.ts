import { api } from "./apiSlice";

/**
 * SOP checklists — the written prep and hygiene procedures, optionally tied to
 * a menu item.
 *
 * Read by the Operations tab alone, so the tag is simple. The list is scoped by
 * branch, and the cache key carries the branch id, which means switching
 * branches and back serves what it already has instead of refetching.
 *
 * Save is one mutation covering both create and edit: the old code branched on
 * `sopForm.id` to pick POST vs PUT and the URL, and that branch belongs next to
 * the request rather than in the component.
 */

type Envelope<T> = { success?: boolean; data?: T; message?: string };

const unwrap = <T,>(response: Envelope<T>): T | null => response?.data ?? null;

export type SopScope = { restaurantId: number; branchId?: number | null };

export type SaveSopInput = {
  /** Present for an edit, absent for a create — this is what picks PUT vs POST. */
  id?: number | null;
  restaurantId: number;
  branchId?: number | null;
  menuItemId: number | null;
  title: string;
  category: string | null;
  steps: string[];
};

export const sopApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getSopChecklists: builder.query<any[], SopScope>({
      // The empty string for "no branch" is the backend's own convention here;
      // preserved rather than tidied.
      query: ({ restaurantId, branchId }) =>
        `/api/sop/${restaurantId}?branchId=${branchId || ""}`,
      transformResponse: (response: Envelope<any[]>) => unwrap(response) ?? [],
      providesTags: ["Sop"],
    }),

    saveSop: builder.mutation<any, SaveSopInput>({
      query: ({ id, ...payload }) => ({
        url: id ? `/api/sop/${id}` : "/api/sop",
        method: id ? "PUT" : "POST",
        body: payload,
      }),
      transformResponse: (response: Envelope<any>) => unwrap(response),
      invalidatesTags: ["Sop"],
    }),

    deleteSop: builder.mutation<unknown, number>({
      query: (id) => ({ url: `/api/sop/${id}`, method: "DELETE" }),
      invalidatesTags: ["Sop"],
    }),
  }),
});

export const {
  useGetSopChecklistsQuery,
  useSaveSopMutation,
  useDeleteSopMutation,
} = sopApi;
