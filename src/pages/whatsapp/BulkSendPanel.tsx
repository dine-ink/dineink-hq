import { useEffect, useMemo, useState } from "react";
import { MagnifyingGlassIcon, PaperAirplaneIcon } from "@heroicons/react/24/outline";
import { useAppSelector } from "@/store";
import { Button, Select, Alert, EmptyState } from "@/design";
import { getCustomerSegment, SEGMENT_LABELS, SEGMENT_STYLES, type CustomerSegment } from "@/utils/customerSegments";
import type { WhatsAppTemplate } from "./TemplatesPanel";

interface Customer {
  id: number;
  name: string;
  phone: string;
  lastVisit: string | null;
  preferredOrderType: "DINE_IN" | "TAKEAWAY" | "DELIVERY" | null;
}

const CATEGORY_OPTIONS: { key: Customer["preferredOrderType"] | "all"; label: string }[] = [
  { key: "all", label: "All Categories" },
  { key: "DINE_IN", label: "Dine-in" },
  { key: "TAKEAWAY", label: "Takeaway" },
  { key: "DELIVERY", label: "Delivery" },
];

const SEGMENT_OPTIONS: { key: CustomerSegment | "all"; label: string }[] = [
  { key: "all", label: "All Segments" },
  { key: "active", label: "Active" },
  { key: "at_risk", label: "At Risk" },
  { key: "churned", label: "Churned" },
];

// Bulk multi-select + template send. Customers are fetched restaurant-wide
// (not scoped to the top-nav branch) since a customer isn't tied to one
// branch — the selected branch only tags which branch the resulting
// WhatsAppMessageLog rows are attributed to.
export default function BulkSendPanel({ templates }: { templates: WhatsAppTemplate[] }) {
  const API_URL = import.meta.env.VITE_API_URL;
  const { user, token } = useAppSelector((s) => s.auth);
  const { selectedBranch } = useAppSelector((s) => s.branch);

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<Customer["preferredOrderType"] | "all">("all");
  const [segmentFilter, setSegmentFilter] = useState<CustomerSegment | "all">("all");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [templateId, setTemplateId] = useState<number | "">("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ total: number; sent: number; failed: number } | null>(null);

  useEffect(() => {
    const fetchCustomers = async () => {
      if (!user?.restaurantId) return;
      setLoading(true);
      try {
        // limit=5000 — the default (100) exists for the paginated Customers
        // table; a bulk-select list needs every customer to filter/select
        // from, not just the first page.
        // includeBills=false — this panel only segments on lastVisit/visits/
        // spend, so the per-customer bill history is pure payload here.
        const res = await fetch(`${API_URL}/api/customers/${user.restaurantId}/customerByRestaurant?limit=5000&includeBills=false`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        if (json.success) setCustomers(json.customers || []);
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    };
    fetchCustomers();
  }, [user?.restaurantId]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return customers.filter((c) => {
      if (term && !c.name.toLowerCase().includes(term) && !c.phone.includes(term)) return false;
      if (categoryFilter !== "all" && c.preferredOrderType !== categoryFilter) return false;
      if (segmentFilter !== "all" && getCustomerSegment(c.lastVisit) !== segmentFilter) return false;
      return true;
    });
  }, [customers, search, categoryFilter, segmentFilter]);

  const allFilteredSelected = filtered.length > 0 && filtered.every((c) => selectedIds.has(c.id));
  const someFilteredSelected = filtered.some((c) => selectedIds.has(c.id));

  const toggleOne = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allFilteredSelected) filtered.forEach((c) => next.delete(c.id));
      else filtered.forEach((c) => next.add(c.id));
      return next;
    });
  };

  const selectedTemplate = templates.find((t) => t.id === templateId) || null;
  const firstSelectedCustomer = customers.find((c) => selectedIds.has(c.id)) || null;
  const previewMessage = selectedTemplate
    ? selectedTemplate.message.replace(/\{\{\s*name\s*\}\}/gi, firstSelectedCustomer?.name || "Customer")
    : null;

  const handleSend = async () => {
    if (!user?.restaurantId || !templateId || selectedIds.size === 0) return;
    setSending(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch(`${API_URL}/api/whatsapp/send-bulk/${user.restaurantId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          templateId,
          customerIds: Array.from(selectedIds),
          branchId: selectedBranch?.id ?? null,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json?.message || "Failed to send messages");
      setResult(json.data);
      setSelectedIds(new Set());
    } catch (err: any) {
      setError(err?.message || "Something went wrong while sending.");
    } finally {
      setSending(false);
    }
  };

  if (templates.length === 0) {
    return (
      <EmptyState
        title="Create a template first"
        description="Bulk sending needs at least one message template — switch to the Templates tab to create one."
      />
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:w-64">
          <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name or phone..."
            className="h-9 w-full rounded-lg border border-gray-200 bg-white pl-9 pr-3 text-[12px] outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={categoryFilter ?? "all"} onChange={(e) => setCategoryFilter(e.target.value as any)} className="h-9 text-[12px]">
            {CATEGORY_OPTIONS.map((o) => (
              <option key={o.key ?? "all"} value={o.key ?? "all"}>{o.label}</option>
            ))}
          </Select>
          <Select value={segmentFilter} onChange={(e) => setSegmentFilter(e.target.value as any)} className="h-9 text-[12px]">
            {SEGMENT_OPTIONS.map((o) => (
              <option key={o.key} value={o.key}>{o.label}</option>
            ))}
          </Select>
        </div>
      </div>

      <div className="overflow-hidden rounded-card border border-surface-border bg-surface-card shadow-card">
        <div className="flex items-center justify-between border-b border-surface-border bg-gray-50 px-3.5 py-2">
          <label className="flex items-center gap-2 text-[11px] font-semibold text-gray-600">
            <input
              type="checkbox"
              checked={allFilteredSelected}
              ref={(el) => { if (el) el.indeterminate = !allFilteredSelected && someFilteredSelected; }}
              onChange={toggleSelectAll}
              className="h-3.5 w-3.5 rounded border-gray-300 text-primary-600 focus:ring-primary-400"
            />
            Select All ({filtered.length})
          </label>
          <span className="text-[11px] font-semibold text-primary-700">{selectedIds.size} selected</span>
        </div>

        {loading ? (
          <div className="flex h-32 items-center justify-center text-[12px] text-gray-400">Loading customers…</div>
        ) : filtered.length === 0 ? (
          <div className="flex h-32 items-center justify-center text-[12px] text-gray-400">No customers match these filters.</div>
        ) : (
          <div className="max-h-72 divide-y divide-gray-50 overflow-y-auto">
            {filtered.map((c) => {
              const segment = getCustomerSegment(c.lastVisit);
              const segStyle = SEGMENT_STYLES[segment];
              return (
                <label key={c.id} className="flex cursor-pointer items-center gap-3 px-3.5 py-2 transition hover:bg-gray-50/70">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(c.id)}
                    onChange={() => toggleOne(c.id)}
                    className="h-3.5 w-3.5 rounded border-gray-300 text-primary-600 focus:ring-primary-400"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12px] font-semibold text-gray-800">{c.name}</p>
                    <p className="text-[11px] text-gray-400">{c.phone}</p>
                  </div>
                  {c.preferredOrderType && (
                    <span className="rounded-tag bg-gray-100 px-2 py-0.5 text-[9px] font-semibold text-gray-500">
                      {CATEGORY_OPTIONS.find((o) => o.key === c.preferredOrderType)?.label || c.preferredOrderType}
                    </span>
                  )}
                  <span className={`rounded-tag px-2 py-0.5 text-[9px] font-semibold ${segStyle.bg} ${segStyle.text}`}>
                    {SEGMENT_LABELS[segment]}
                  </span>
                </label>
              );
            })}
          </div>
        )}
      </div>

      <div className="rounded-card border border-surface-border bg-surface-card p-3.5 shadow-card">
        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-end sm:justify-between">
          <div className="w-full sm:max-w-xs">
            <label className="mb-1 block text-[11px] font-semibold text-gray-600">Template</label>
            <Select value={templateId} onChange={(e) => setTemplateId(Number(e.target.value))} className="h-9 w-full text-[12px]">
              <option value="">Select a template…</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </Select>
          </div>
          <Button
            leftIcon={<PaperAirplaneIcon className="h-4 w-4" />}
            onClick={handleSend}
            loading={sending}
            disabled={!templateId || selectedIds.size === 0}
          >
            Send to {selectedIds.size} customer{selectedIds.size === 1 ? "" : "s"}
          </Button>
        </div>

        {previewMessage && (
          <div className="mt-3 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-[12px] text-gray-600">
            <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-gray-400">Preview (first selected customer)</p>
            {previewMessage}
          </div>
        )}

        {error && <Alert variant="danger" className="mt-3">{error}</Alert>}
        {result && (
          <Alert variant={result.failed > 0 ? "warning" : "success"} className="mt-3">
            Sent {result.sent} of {result.total} message{result.total === 1 ? "" : "s"}
            {result.failed > 0 ? ` — ${result.failed} failed.` : "."}
          </Alert>
        )}
      </div>
    </div>
  );
}
