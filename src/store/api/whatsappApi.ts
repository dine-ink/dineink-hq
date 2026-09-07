import { api } from "./apiSlice";

/**
 * WhatsApp: the message templates, the send log, and the bulk send.
 *
 * The template list was fetched by WhatsAppCenter and passed down to
 * TemplatesPanel with an `onRefetch` callback threaded back up, because the
 * panel does the writing and the parent owns the list. That callback is what
 * the tag replaces — the panel invalidates and the parent updates, with nothing
 * passed between them.
 *
 * The customer list the bulk send picks recipients from is not defined here.
 * It belongs to the customers module, and this is a reader of it.
 */

type Envelope<T> = { success?: boolean; data?: T; message?: string };

const unwrap = <T,>(response: Envelope<T>): T | null => response?.data ?? null;

export const whatsappApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getWhatsAppTemplates: builder.query<any[], number>({
      query: (restaurantId) => `/api/whatsapp/templates/${restaurantId}`,
      transformResponse: (response: Envelope<any[]>) => unwrap(response) ?? [],
      providesTags: ["WhatsAppTemplate"],
    }),

    saveWhatsAppTemplate: builder.mutation<
      any,
      {
        restaurantId: number;
        /** Present for an edit, absent for a create. */
        id?: number | string | null;
        name: string;
        message: string;
      }
    >({
      query: ({ restaurantId, id, ...body }) => ({
        url: id
          ? `/api/whatsapp/templates/${restaurantId}/${id}`
          : `/api/whatsapp/templates/${restaurantId}`,
        method: id ? "PUT" : "POST",
        body,
      }),
      transformResponse: (response: Envelope<any>) => unwrap(response),
      invalidatesTags: ["WhatsAppTemplate"],
    }),

    deleteWhatsAppTemplate: builder.mutation<
      unknown,
      { restaurantId: number; id: number | string }
    >({
      query: ({ restaurantId, id }) => ({
        url: `/api/whatsapp/templates/${restaurantId}/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["WhatsAppTemplate"],
    }),

    getWhatsAppLogs: builder.query<
      any[],
      { restaurantId: number; branchId?: number | null; limit?: number }
    >({
      query: ({ restaurantId, branchId, limit = 200 }) =>
        `/api/whatsapp/${restaurantId}?limit=${limit}${branchId ? `&branchId=${branchId}` : ""}`,
      transformResponse: (response: Envelope<any[]>) => unwrap(response) ?? [],
      providesTags: ["WhatsAppLog"],
    }),

    /** Queues a template to many recipients; each send lands in the log. */
    sendBulkWhatsApp: builder.mutation<
      any,
      { restaurantId: number; body: Record<string, any> }
    >({
      query: ({ restaurantId, body }) => ({
        url: `/api/whatsapp/send-bulk/${restaurantId}`,
        method: "POST",
        body,
      }),
      transformResponse: (response: Envelope<any>) => unwrap(response),
      invalidatesTags: ["WhatsAppLog"],
    }),
  }),
});

export const {
  useGetWhatsAppTemplatesQuery,
  useSaveWhatsAppTemplateMutation,
  useDeleteWhatsAppTemplateMutation,
  useGetWhatsAppLogsQuery,
  useSendBulkWhatsAppMutation,
} = whatsappApi;
