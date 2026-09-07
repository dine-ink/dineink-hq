import { api } from "./apiSlice";

/**
 * Attendance, leave and payroll.
 *
 * Three tabs, twelve requests, and a lot of hand-written refetching: saving
 * hours reloaded the day, approving leave reloaded the list, running payroll
 * reloaded the run. Each of those is a tag now.
 *
 * The day view and the month view hit the same endpoint with different query
 * strings — `?date=` for one, `?from=&to=` for the other — so they are two
 * endpoints here rather than one with an optional shape. The alternative was a
 * single query whose argument meant different things depending on which fields
 * were set, which is the sort of thing that reads fine until someone passes
 * both.
 *
 * Approving or rejecting leave invalidates payroll as well. Approved unpaid
 * leave changes what someone is owed, and the payroll tab used to show the
 * pre-approval figure until it was reopened.
 */

type Envelope<T> = { success?: boolean; data?: T; message?: string };

const unwrap = <T,>(response: Envelope<T>): T | null => response?.data ?? null;

export type DateRange = { from: string; to: string };

export const attendanceApi = api.injectEndpoints({
  endpoints: (builder) => ({
    /** One day's attendance for a branch. */
    getAttendanceForDate: builder.query<any[], { branchId: number; date: string }>({
      query: ({ branchId, date }) => `/api/attendance/branch/${branchId}?date=${date}`,
      transformResponse: (response: Envelope<any[]>) => unwrap(response) ?? [],
      providesTags: ["Attendance"],
    }),

    /** A range of days, for the month grid. */
    getAttendanceForRange: builder.query<any[], { branchId: number } & DateRange>({
      query: ({ branchId, from, to }) =>
        `/api/attendance/branch/${branchId}?from=${from}&to=${to}`,
      transformResponse: (response: Envelope<any[]>) => unwrap(response) ?? [],
      providesTags: ["Attendance"],
    }),

    getStaffProductivity: builder.query<
      any,
      { restaurantId: number; branchId: number } & DateRange
    >({
      query: ({ restaurantId, branchId, from, to }) =>
        `/api/analytics/${restaurantId}/staff-productivity?branchId=${branchId}&from=${from}&to=${to}`,
      transformResponse: (response: Envelope<any>) => unwrap(response),
      providesTags: ["Attendance", "Analytics"],
    }),

    /** Manual hours for one person on one day. */
    saveManualAttendance: builder.mutation<any, Record<string, any>>({
      query: (body) => ({ url: "/api/attendance/manual", method: "POST", body }),
      transformResponse: (response: Envelope<any>) => unwrap(response),
      // Hours worked feed the payroll run, so both go.
      invalidatesTags: ["Attendance", "Payroll"],
    }),

    getLeaveRequests: builder.query<
      any[],
      { restaurantId: number; branchId: number; query?: string }
    >({
      // `query` arrives pre-built (a status filter) and is part of the cache
      // key, so a filtered list and an unfiltered one are separate entries.
      query: ({ restaurantId, branchId, query = "" }) =>
        `/api/attendance/leave/${restaurantId}/${branchId}${query}`,
      transformResponse: (response: Envelope<any[]>) => unwrap(response) ?? [],
      providesTags: ["Leave"],
    }),

    createLeaveRequest: builder.mutation<any, Record<string, any>>({
      query: (body) => ({ url: "/api/attendance/leave", method: "POST", body }),
      transformResponse: (response: Envelope<any>) => unwrap(response),
      invalidatesTags: ["Leave"],
    }),

    setLeaveStatus: builder.mutation<
      any,
      { id: number; status: string; approvedById?: number }
    >({
      query: ({ id, ...body }) => ({
        url: `/api/attendance/leave/${id}/status`,
        method: "PATCH",
        body,
      }),
      transformResponse: (response: Envelope<any>) => unwrap(response),
      // Approved unpaid leave changes what someone is owed.
      invalidatesTags: ["Leave", "Payroll"],
    }),

    getPayroll: builder.query<any, { restaurantId: number; branchId: number }>({
      query: ({ restaurantId, branchId }) =>
        `/api/attendance/payroll/${restaurantId}/${branchId}`,
      transformResponse: (response: Envelope<any>) => unwrap(response),
      providesTags: ["Payroll"],
    }),

    runPayroll: builder.mutation<any, Record<string, any>>({
      query: (body) => ({ url: "/api/attendance/payroll/run", method: "POST", body }),
      transformResponse: (response: Envelope<any>) => unwrap(response),
      invalidatesTags: ["Payroll"],
    }),

    saveDeductions: builder.mutation<any, Record<string, any>>({
      query: (body) => ({ url: "/api/attendance/deductions", method: "POST", body }),
      transformResponse: (response: Envelope<any>) => unwrap(response),
      invalidatesTags: ["Payroll"],
    }),
  }),
});

export const {
  useGetAttendanceForDateQuery,
  useGetAttendanceForRangeQuery,
  useGetStaffProductivityQuery,
  useSaveManualAttendanceMutation,
  useGetLeaveRequestsQuery,
  useCreateLeaveRequestMutation,
  useSetLeaveStatusMutation,
  useGetPayrollQuery,
  useRunPayrollMutation,
  useSaveDeductionsMutation,
} = attendanceApi;
