import { useState } from "react";
import { useAppSelector } from "@/store";
import {
  useGetWhatsAppTemplatesQuery,
  useGetWhatsAppLogsQuery,
} from "@/store/api/whatsappApi";
import { ChatBubbleLeftRightIcon } from "@heroicons/react/24/outline";
import {
  PageContainer,
  PageHeader,
  MetricCard,
  LoadingOverlay,
  Button,
  StatusChip,
  DataTable,
  type DataTableColumn,
  type ChipStatus,
} from "@/design";
import SendWhatsAppDialog from "@/components/common/SendWhatsAppDialog";
import TemplatesPanel, { type WhatsAppTemplate } from "./TemplatesPanel";
import BulkSendPanel from "./BulkSendPanel";
import TabStrip from "@/components/common/TabStrip";

const TABS = ["Bulk Send", "Templates", "Message Log"] as const;
type Tab = (typeof TABS)[number];

type TemplateType =
  | "CUSTOMER_MARKETING"
  | "VENDOR_EBILL"
  | "VENDOR_PAYMENT"
  | "GST_UPDATE";

interface WhatsAppMessageLog {
  id: number;
  restaurantId: number;
  branchId: number | null;
  direction: string;
  recipientPhone: string;
  templateType: TemplateType;
  message: string;
  payload?: unknown;
  status: "SENT" | "FAILED";
  relatedEntityType?: string | null;
  relatedEntityId?: number | null;
  createdAt: string;
}

const TEMPLATE_LABEL: Record<TemplateType, string> = {
  CUSTOMER_MARKETING: "Customer Marketing",
  VENDOR_EBILL: "Vendor e-Bill",
  VENDOR_PAYMENT: "Vendor Payment",
  GST_UPDATE: "GST Update",
};

const STATUS_CHIP: Record<WhatsAppMessageLog["status"], ChipStatus> = {
  SENT: "success",
  FAILED: "danger",
};

function truncate(text: string, max = 60) {
  if (!text) return "—";
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

// A read-only log viewer over GET /api/whatsapp/:restaurantId, plus a
// generic "Send Message" entry point that reuses the same
// SendWhatsAppDialog the Customers page uses for per-customer messages.
// Everything here is scoped to the currently selected branch, matching how
// every other analytics/log page in the app (Kitchen, Compliance, ...)
// re-fetches on branch change.
export default function WhatsAppCenter() {
  const { user } = useAppSelector((s) => s.auth);
  const { selectedBranch } = useAppSelector((s) => s.branch);

  const [activeTab, setActiveTab] = useState<Tab>("Bulk Send");
  const [sendOpen, setSendOpen] = useState(false);

  /**
   * Templates and the send log.
   *
   * Three effects became two queries.
   *
   * The template list was fetched here and handed to TemplatesPanel with an
   * `onRefetch` callback threaded back up, because the panel does the writing
   * and this component owned the list. The tag replaces that callback: the
   * panel invalidates, this updates, nothing passes between them.
   *
   * The third effect refetched the log whenever the Message Log tab opened, so
   * that "a bulk send made moments ago on the other tab shows up". The send
   * invalidates the log tag now, so it shows up without anyone watching the
   * tab.
   *
   * The AbortController is gone as well — cancelling a superseded request is
   * what the query subscription already does.
   */
  const { data: templates = [], isFetching: templatesLoading } =
    useGetWhatsAppTemplatesQuery(user?.restaurantId as number, {
      skip: !user?.restaurantId,
    });

  const {
    data: logs = [],
    isFetching: loading,
    isError: error,
    refetch: refetchLogs,
  } = useGetWhatsAppLogsQuery(
    {
      restaurantId: user?.restaurantId as number,
      branchId: selectedBranch?.id,
      limit: 200,
    },
    { skip: !user?.restaurantId },
  );

  const total = logs.length;
  const sent = logs.filter((l) => l.status === "SENT").length;
  const failed = logs.filter((l) => l.status === "FAILED").length;

  const columns: DataTableColumn<WhatsAppMessageLog>[] = [
    {
      key: "recipientPhone",
      header: "Recipient Phone",
      render: (row) => <span className="font-semibold text-gray-900">{row.recipientPhone}</span>,
    },
    {
      key: "templateType",
      header: "Template Type",
      render: (row) => <StatusChip status="info">{TEMPLATE_LABEL[row.templateType] || row.templateType}</StatusChip>,
    },
    {
      key: "message",
      header: "Message",
      render: (row) => <span className="text-gray-600">{truncate(row.message)}</span>,
    },
    {
      key: "status",
      header: "Status",
      render: (row) => <StatusChip status={STATUS_CHIP[row.status]}>{row.status}</StatusChip>,
    },
    {
      key: "createdAt",
      header: "Sent At",
      render: (row) => (
        <span className="text-gray-500">
          {new Date(row.createdAt).toLocaleString("en-IN", {
            day: "numeric",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      ),
    },
  ];

  return (
    <PageContainer>
      <PageHeader
        icon={<ChatBubbleLeftRightIcon className="h-5 w-5 text-white" />}
        title="WhatsApp Center"
        subtitle="Demo mode — messages sent here are logged for records only, not actually delivered over WhatsApp yet"
        actions={
          <TabStrip tabs={TABS} value={activeTab} onChange={setActiveTab} />
        }
      />

      {activeTab === "Bulk Send" && <BulkSendPanel templates={templates} />}

      {activeTab === "Templates" && (
        <TemplatesPanel templates={templates} loading={templatesLoading} />
      )}

      {activeTab === "Message Log" && (
        loading ? (
          <LoadingOverlay label="Loading WhatsApp message log..." />
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 xl:grid-cols-3">
              <MetricCard label="Total Messages" value={total} sub="all logged messages" status="info" />
              <MetricCard label="Sent" value={sent} sub="mock-delivered successfully" status="success" />
              <MetricCard label="Failed" value={failed} sub="mock-send failures" status="danger" />
            </div>

            <div className="overflow-hidden rounded-card border border-surface-border bg-surface-card shadow-card">
              <div className="border-b border-surface-border px-4 py-3">
                <h3 className="text-[15px] font-bold text-gray-900">Message Log</h3>
                <p className="mt-0.5 text-[11px] text-gray-500">
                  Most recent 200 messages for {selectedBranch?.id ? "this branch" : "all branches"}
                </p>
              </div>
              <DataTable
                columns={columns}
                rows={logs} pageSize={10} rowNoun="messages"
                rowKey={(row) => row.id}
                error={error}
                onRetry={() => refetchLogs()}
                emptyTitle="No WhatsApp messages yet"
                emptyDescription="Messages sent from Customers, bulk sends, or the Send Single Message button will show up here."
              />
            </div>
          </>
        )
      )}

      <SendWhatsAppDialog
        open={sendOpen}
        onClose={() => setSendOpen(false)}
        templateType="CUSTOMER_MARKETING"
        onSent={() => refetchLogs()}
      />
    </PageContainer>
  );
}
