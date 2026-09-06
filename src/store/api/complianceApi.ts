import { api } from "./apiSlice";

/**
 * Statutory compliance records — FSSAI, fire safety, pest control, GST.
 *
 * Third slice, and the first to migrate a whole module: all eight of the
 * `/api/compliance` call sites live in one screen, so nothing is left half on
 * the old pattern. That was the reason for choosing it over `analytics`, which
 * has four times the calls but spreads them across eleven files including the
 * 4,000-line ones — migrating that piecemeal would leave eleven screens each
 * using two different data layers.
 *
 * Two things here that the earlier slices did not cover:
 *
 *   - A **multipart upload**. `FormData` is passed straight through as the
 *     body; fetchBaseQuery leaves the Content-Type unset so the browser can add
 *     the multipart boundary, which is why the header is not set here either.
 *   - **Two tags from one list**. Records and summary are separate endpoints
 *     over the same underlying rows, so every write invalidates both — the
 *     summary counts are derived from exactly the data a write just changed.
 */

export type ComplianceType = "FSSAI" | "FIRE_SAFETY" | "PEST_CONTROL" | "GST_FILING";
export type ComplianceStatus = "VALID" | "EXPIRING_SOON" | "EXPIRED" | "DUE";

export interface ComplianceRecord {
  id: number;
  restaurantId: number;
  branchId: number;
  type: ComplianceType;
  licenseNumber: string | null;
  issueDate: string | null;
  expiryDate: string | null;
  nextDueDate: string | null;
  status: ComplianceStatus;
  documentUrl: string | null;
  lastRenewedDate: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ComplianceSummary {
  valid: number;
  expiringSoon: number;
  expired: number;
  due: number;
  total: number;
}

export type ComplianceScope = { restaurantId: number; branchId: number };

export type ComplianceInput = {
  branchId: number;
  type: ComplianceType;
  licenseNumber: string | null;
  issueDate: string | null;
  expiryDate: string | null;
  nextDueDate: string | null;
  notes: string | null;
};

type Envelope<T> = { success?: boolean; data?: T };

const unwrap = <T,>(response: Envelope<T>): T | null => response?.data ?? null;

/** Records and summary are two views of the same rows; a write changes both. */
const COMPLIANCE_TAGS = ["Compliance", "ComplianceSummary"] as const;

export const complianceApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getComplianceRecords: builder.query<ComplianceRecord[], ComplianceScope>({
      query: ({ restaurantId, branchId }) => `/api/compliance/${restaurantId}/${branchId}`,
      transformResponse: (r: Envelope<ComplianceRecord[]>) => unwrap(r) ?? [],
      providesTags: ["Compliance"],
    }),

    getComplianceSummary: builder.query<ComplianceSummary | null, ComplianceScope>({
      query: ({ restaurantId, branchId }) =>
        `/api/compliance/${restaurantId}/${branchId}/summary`,
      transformResponse: unwrap,
      providesTags: ["ComplianceSummary"],
    }),

    createComplianceRecord: builder.mutation<ComplianceRecord | null, ComplianceInput>({
      query: (body) => ({ url: "/api/compliance", method: "POST", body }),
      transformResponse: unwrap,
      invalidatesTags: [...COMPLIANCE_TAGS],
    }),

    updateComplianceRecord: builder.mutation<
      ComplianceRecord | null,
      Partial<ComplianceInput> & { id: number; lastRenewedDate?: string; documentUrl?: string }
    >({
      query: ({ id, ...body }) => ({ url: `/api/compliance/${id}`, method: "PUT", body }),
      transformResponse: unwrap,
      invalidatesTags: [...COMPLIANCE_TAGS],
    }),

    deleteComplianceRecord: builder.mutation<void, { id: number }>({
      query: ({ id }) => ({ url: `/api/compliance/${id}`, method: "DELETE" }),
      invalidatesTags: [...COMPLIANCE_TAGS],
    }),

    /**
     * Uploads the document and returns its stored URL. Deliberately does not
     * invalidate: the URL still has to be attached to a record, and that PUT is
     * what makes the change visible. Invalidating here would refetch a list
     * that has not changed yet.
     */
    uploadComplianceDocument: builder.mutation<{ documentUrl: string } | null, FormData>({
      query: (body) => ({ url: "/api/compliance/upload", method: "POST", body }),
      transformResponse: unwrap,
    }),
  }),
});

export const {
  useGetComplianceRecordsQuery,
  useGetComplianceSummaryQuery,
  useCreateComplianceRecordMutation,
  useUpdateComplianceRecordMutation,
  useDeleteComplianceRecordMutation,
  useUploadComplianceDocumentMutation,
} = complianceApi;
