import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { RootState } from "..";

/**
 * Shared RTK Query API.
 *
 * The app previously issued every request through a bare `fetch` inside
 * `useEffect`, with no cache at all — so every tab switch and every navigation
 * refetched the same data from scratch. RTK Query dedupes in-flight requests,
 * serves cached data instantly on revisit, and refetches in the background.
 *
 * `@reduxjs/toolkit` was already a dependency, so this adds none.
 *
 * Endpoints are injected per feature via `api.injectEndpoints` (see
 * store/api/dashboardApi.ts) so pages can be migrated one at a time instead of
 * in a single sweep across all 260-odd call sites.
 */
export const api = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_URL,
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.token;
      if (token) headers.set("Authorization", `Bearer ${token}`);
      return headers;
    },
  }),
  // Data here is reporting/analytics rather than live operational state, so a
  // minute of reuse is a good trade: instant navigation, still current enough.
  keepUnusedDataFor: 60,
  refetchOnReconnect: true,
  tagTypes: [
    "Restaurant",
    "Analytics",
    "Insights",
    "Staff",
    "Inventory",
    "Finance",
    "Discount",
    "Due",
  ],
  endpoints: () => ({}),
});
