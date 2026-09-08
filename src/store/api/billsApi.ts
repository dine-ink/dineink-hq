import { api } from "./apiSlice";

/**
 * Bills for a branch over a date range.
 *
 * One endpoint, but a widely shared one: Menu Management derives its ingredient
 * consumption from the month's bills, and Reports is built on the same call.
 * Putting it here means the two stop fetching it independently.
 *
 * The response puts the rows under `bills` rather than `data`, unlike every
 * other endpoint in this app — unwrapped here so no caller has to know that.
 */

type BillsEnvelope = { success?: boolean; bills?: any[]; data?: any[] };

export type BillsRange = {
  restaurantId: number;
  branchId?: number | null;
  from: string;
  to: string;
};

export const billsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getBills: builder.query<any[], BillsRange>({
      query: ({ restaurantId, branchId, from, to }) =>
        `/api/bills/${restaurantId}/restaurantwise?branchId=${branchId || ""}&from=${from}&to=${to}`,
      transformResponse: (response: BillsEnvelope) =>
        response?.bills ?? response?.data ?? [],
      providesTags: ["Bills"],
    }),
  }),
});

export const { useGetBillsQuery } = billsApi;
