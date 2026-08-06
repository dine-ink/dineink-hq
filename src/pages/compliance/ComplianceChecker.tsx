import { useEffect, useRef, useState } from "react";
import { useAppSelector } from "../../store";
import {
  ShieldCheckIcon,
  FireIcon,
  BugAntIcon,
  DocumentTextIcon,
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  ArrowPathIcon,
  ArrowUpTrayIcon,
  PaperClipIcon,
} from "@heroicons/react/24/outline";
import {
  PageContainer,
  PageHeader,
  MetricCard,
  LoadingOverlay,
  EmptyState,
  Card,
  SectionHeader,
  StatusChip,
  Button,
  IconButton,
  Dialog,
  DeleteDialog,
  FormSection,
  FormField,
  Input,
  Select,
  Textarea,
  type ChipStatus,
  type MetricStatus,
} from "../../design";

const API_URL = import.meta.env.VITE_API_URL;

type ComplianceType = "FSSAI" | "FIRE_SAFETY" | "PEST_CONTROL" | "GST_FILING";
type ComplianceStatus = "VALID" | "EXPIRING_SOON" | "EXPIRED" | "DUE";

interface ComplianceRecord {
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

interface ComplianceSummary {
  valid: number;
  expiringSoon: number;
  expired: number;
  due: number;
  total: number;
}

const TYPE_META: Record<
  ComplianceType,
  { label: string; description: string; icon: typeof ShieldCheckIcon; dateLabel: "expiryDate" | "nextDueDate" }
> = {
  FSSAI: {
    label: "FSSAI License",
    description: "Food safety license — required to legally operate the branch",
    icon: ShieldCheckIcon,
    dateLabel: "expiryDate",
  },
  FIRE_SAFETY: {
    label: "Fire Safety Certificate",
    description: "No-objection certificate from the local fire department",
    icon: FireIcon,
    dateLabel: "expiryDate",
  },
  PEST_CONTROL: {
    label: "Pest Control Schedule",
    description: "Scheduled pest control treatment and certification",
    icon: BugAntIcon,
    dateLabel: "expiryDate",
  },
  GST_FILING: {
    label: "GST Filing",
    description: "GST return filing due dates and status",
    icon: DocumentTextIcon,
    dateLabel: "nextDueDate",
  },
};

const TYPE_ORDER: ComplianceType[] = ["FSSAI", "FIRE_SAFETY", "PEST_CONTROL", "GST_FILING"];

const STATUS_CHIP: Record<ComplianceStatus, ChipStatus> = {
  VALID: "success",
  EXPIRING_SOON: "warning",
  EXPIRED: "danger",
  DUE: "info",
};

const STATUS_LABEL: Record<ComplianceStatus, string> = {
  VALID: "Valid",
  EXPIRING_SOON: "Expiring Soon",
  EXPIRED: "Expired",
  DUE: "Due",
};

function formatDate(value: string | null) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

function toDateInputValue(value: string | null) {
  if (!value) return "";
  return value.slice(0, 10);
}

// The upload button constructs an absolute URL the same way Settings.tsx
// builds the restaurant logo's <img src> — API_URL with any trailing slash
// stripped, joined directly with the server-relative documentUrl path.
function resolveDocumentUrl(documentUrl: string | null) {
  if (!documentUrl) return null;
  if (/^https?:\/\//i.test(documentUrl)) return documentUrl;
  return `${API_URL.replace(/\/$/, "")}${documentUrl}`;
}

interface RecordFormState {
  type: ComplianceType;
  licenseNumber: string;
  issueDate: string;
  expiryDate: string;
  nextDueDate: string;
  notes: string;
}

function blankForm(type: ComplianceType): RecordFormState {
  return { type, licenseNumber: "", issueDate: "", expiryDate: "", nextDueDate: "", notes: "" };
}

export default function ComplianceChecker() {
  const { user, token } = useAppSelector((s) => s.auth);
  const { selectedBranch } = useAppSelector((s) => s.branch);

  const [records, setRecords] = useState<ComplianceRecord[]>([]);
  const [summary, setSummary] = useState<ComplianceSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formModal, setFormModal] = useState<{ open: boolean; editing: ComplianceRecord | null; type: ComplianceType }>({
    open: false,
    editing: null,
    type: "FSSAI",
  });
  const [form, setForm] = useState<RecordFormState>(blankForm("FSSAI"));
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const [deleteTarget, setDeleteTarget] = useState<ComplianceRecord | null>(null);

  const [renewingId, setRenewingId] = useState<number | null>(null);
  const [uploadingId, setUploadingId] = useState<number | null>(null);
  const fileInputs = useRef<Record<number, HTMLInputElement | null>>({});

  const headers = { Authorization: `Bearer ${token}` };
  const jsonHeaders = { ...headers, "Content-Type": "application/json" };

  const fetchAll = async () => {
    if (!user?.restaurantId || !selectedBranch?.id) return;
    try {
      setLoading(true);
      setError("");
      const [recRes, sumRes] = await Promise.all([
        fetch(`${API_URL}/api/compliance/${user.restaurantId}/${selectedBranch.id}`, { headers }),
        fetch(`${API_URL}/api/compliance/${user.restaurantId}/${selectedBranch.id}/summary`, { headers }),
      ]);
      const [recJson, sumJson] = await Promise.all([recRes.json(), sumRes.json()]);
      if (recJson.success) setRecords(recJson.data || []);
      if (sumJson.success) setSummary(sumJson.data || null);
      if (!recJson.success || !sumJson.success) {
        setError("Failed to load compliance data");
      }
    } catch {
      setError("Failed to load compliance data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.restaurantId, selectedBranch?.id]);

  const recordsByType = (type: ComplianceType) => records.filter((r) => r.type === type);

  const openAddModal = (type: ComplianceType) => {
    setForm(blankForm(type));
    setFormError("");
    setFormModal({ open: true, editing: null, type });
  };

  const openEditModal = (record: ComplianceRecord) => {
    setForm({
      type: record.type,
      licenseNumber: record.licenseNumber || "",
      issueDate: toDateInputValue(record.issueDate),
      expiryDate: toDateInputValue(record.expiryDate),
      nextDueDate: toDateInputValue(record.nextDueDate),
      notes: record.notes || "",
    });
    setFormError("");
    setFormModal({ open: true, editing: record, type: record.type });
  };

  const closeFormModal = () => {
    if (saving) return;
    setFormModal({ open: false, editing: null, type: "FSSAI" });
  };

  const submitForm = async () => {
    if (!selectedBranch?.id) return;
    setFormError("");
    setSaving(true);
    try {
      const body = {
        branchId: selectedBranch.id,
        type: form.type,
        licenseNumber: form.licenseNumber.trim() || null,
        issueDate: form.issueDate || null,
        expiryDate: form.expiryDate || null,
        nextDueDate: form.nextDueDate || null,
        notes: form.notes.trim() || null,
      };
      const url = formModal.editing ? `${API_URL}/api/compliance/${formModal.editing.id}` : `${API_URL}/api/compliance`;
      const method = formModal.editing ? "PUT" : "POST";
      const res = await fetch(url, { method, headers: jsonHeaders, body: JSON.stringify(body) });
      const json = await res.json();
      if (!json.success) {
        setFormError(json.message || "Failed to save record");
        return;
      }
      setFormModal({ open: false, editing: null, type: "FSSAI" });
      await fetchAll();
    } catch {
      setFormError("Failed to save record");
    } finally {
      setSaving(false);
    }
  };

  const markRenewed = async (record: ComplianceRecord) => {
    setRenewingId(record.id);
    try {
      const res = await fetch(`${API_URL}/api/compliance/${record.id}`, {
        method: "PUT",
        headers: jsonHeaders,
        body: JSON.stringify({ lastRenewedDate: new Date().toISOString() }),
      });
      const json = await res.json();
      if (json.success) await fetchAll();
    } catch {
      /* silent */
    } finally {
      setRenewingId(null);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`${API_URL}/api/compliance/${deleteTarget.id}`, { method: "DELETE", headers });
      const json = await res.json();
      if (json.success) {
        setDeleteTarget(null);
        await fetchAll();
      }
    } catch {
      /* silent */
    }
  };

  const handleUpload = async (record: ComplianceRecord, file: File) => {
    setUploadingId(record.id);
    try {
      const fd = new FormData();
      fd.append("document", file);
      const uploadRes = await fetch(`${API_URL}/api/compliance/upload`, {
        method: "POST",
        headers,
        body: fd,
      });
      const uploadJson = await uploadRes.json();
      if (!uploadJson.success) return;
      const patchRes = await fetch(`${API_URL}/api/compliance/${record.id}`, {
        method: "PUT",
        headers: jsonHeaders,
        body: JSON.stringify({ documentUrl: uploadJson.data.documentUrl }),
      });
      const patchJson = await patchRes.json();
      if (patchJson.success) await fetchAll();
    } catch {
      /* silent */
    } finally {
      setUploadingId(null);
    }
  };

  const kpis: { label: string; key: keyof ComplianceSummary; status: MetricStatus }[] = [
    { label: "Valid", key: "valid", status: "success" },
    { label: "Expiring Soon", key: "expiringSoon", status: "warning" },
    { label: "Expired", key: "expired", status: "danger" },
    { label: "Due", key: "due", status: "info" },
  ];

  if (loading && records.length === 0 && !summary) {
    return <LoadingOverlay label="Loading compliance data..." />;
  }

  return (
    <PageContainer>
      <PageHeader
        icon={<ShieldCheckIcon className="h-5 w-5 text-white" />}
        title="Compliance Checker"
        subtitle="Track FSSAI license, fire safety certificate, pest control schedule, and GST filing due-dates for this branch"
      />

      {error && (
        <div className="rounded-card border border-danger-200 bg-danger-50 px-4 py-2.5 text-[12px] text-danger-700">{error}</div>
      )}

      {!selectedBranch?.id ? (
        <EmptyState title="No branch selected" description="Select a branch to view its compliance status." />
      ) : (
        <>
          {/* KPI row */}
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            {kpis.map((k) => (
              <MetricCard key={k.key} label={k.label} value={summary?.[k.key] ?? 0} status={k.status} />
            ))}
          </div>

          {/* One section per compliance type */}
          <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
            {TYPE_ORDER.map((type) => {
              const meta = TYPE_META[type];
              const typeRecords = recordsByType(type);
              return (
                <Card key={type} noPadding>
                  <SectionHeader
                    title={
                      <span className="flex items-center gap-2">
                        <meta.icon className="h-4 w-4 text-gray-400" />
                        {meta.label}
                      </span>
                    }
                    subtitle={meta.description}
                    actions={
                      <Button size="sm" variant="outline" leftIcon={<PlusIcon className="h-3.5 w-3.5" />} onClick={() => openAddModal(type)}>
                        Add
                      </Button>
                    }
                  />
                  <div className="divide-y divide-surface-border">
                    {typeRecords.length === 0 ? (
                      <div className="px-4 py-6">
                        <EmptyState
                          icon={meta.icon}
                          title="No record yet"
                          description={`Add a ${meta.label.toLowerCase()} record to start tracking compliance.`}
                          action={{ label: "Add", onClick: () => openAddModal(type) }}
                        />
                      </div>
                    ) : (
                      typeRecords.map((record) => {
                        const dateValue = meta.dateLabel === "nextDueDate" ? record.nextDueDate : record.expiryDate;
                        const docUrl = resolveDocumentUrl(record.documentUrl);
                        return (
                          <div key={record.id} className="px-4 py-3">
                            <div className="flex flex-wrap items-start justify-between gap-2">
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="text-[13px] font-bold text-gray-900">{record.licenseNumber || "No number on file"}</p>
                                  <StatusChip status={STATUS_CHIP[record.status]}>{STATUS_LABEL[record.status]}</StatusChip>
                                </div>
                                <div className="mt-1 flex flex-wrap gap-3 text-[11px] text-gray-500">
                                  <span>Issued: {formatDate(record.issueDate)}</span>
                                  <span>{meta.dateLabel === "nextDueDate" ? "Next Due" : "Expiry"}: {formatDate(dateValue)}</span>
                                  {record.lastRenewedDate && <span>Last renewed: {formatDate(record.lastRenewedDate)}</span>}
                                </div>
                                {record.notes && <p className="mt-1 text-[11px] text-gray-500">{record.notes}</p>}
                                {docUrl ? (
                                  <a
                                    href={docUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-semibold text-primary-600 hover:underline"
                                  >
                                    <PaperClipIcon className="h-3.5 w-3.5" /> View document
                                  </a>
                                ) : (
                                  <p className="mt-1.5 text-[11px] text-gray-400">No document uploaded</p>
                                )}
                              </div>
                              <div className="flex flex-wrap items-center gap-1.5">
                                <IconButton
                                  aria-label="Edit record"
                                  icon={<PencilSquareIcon className="h-3.5 w-3.5" />}
                                  onClick={() => openEditModal(record)}
                                />
                                <IconButton
                                  aria-label="Mark renewed"
                                  icon={<ArrowPathIcon className="h-3.5 w-3.5" />}
                                  onClick={() => markRenewed(record)}
                                  disabled={renewingId === record.id}
                                />
                                <IconButton
                                  aria-label="Upload document"
                                  icon={<ArrowUpTrayIcon className="h-3.5 w-3.5" />}
                                  onClick={() => fileInputs.current[record.id]?.click()}
                                  disabled={uploadingId === record.id}
                                />
                                <input
                                  ref={(el) => {
                                    fileInputs.current[record.id] = el;
                                  }}
                                  type="file"
                                  accept="image/*,application/pdf"
                                  className="hidden"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handleUpload(record, file);
                                    e.target.value = "";
                                  }}
                                />
                                <IconButton
                                  aria-label="Delete record"
                                  variant="danger"
                                  icon={<TrashIcon className="h-3.5 w-3.5" />}
                                  onClick={() => setDeleteTarget(record)}
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </>
      )}

      {/* Add / Edit dialog */}
      <Dialog
        open={formModal.open}
        onClose={closeFormModal}
        title={formModal.editing ? `Edit ${TYPE_META[formModal.type].label}` : `Add ${TYPE_META[formModal.type].label}`}
        footer={
          <>
            <Button variant="outline" size="sm" onClick={closeFormModal} disabled={saving}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={submitForm} loading={saving}>
              Save
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          {formError && <div className="rounded-lg border border-danger-200 bg-danger-50 px-3 py-2 text-[11px] text-danger-700">{formError}</div>}
          <FormSection>
            <FormField label="Compliance Type" required>
              <Select
                value={form.type}
                disabled
                onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as ComplianceType }))}
              >
                {TYPE_ORDER.map((t) => (
                  <option key={t} value={t}>
                    {TYPE_META[t].label}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label="License / Certificate Number">
              <Input
                value={form.licenseNumber}
                onChange={(e) => setForm((f) => ({ ...f, licenseNumber: e.target.value }))}
                placeholder="e.g. 12345678901234"
              />
            </FormField>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField label="Issue Date">
                <Input type="date" value={form.issueDate} onChange={(e) => setForm((f) => ({ ...f, issueDate: e.target.value }))} />
              </FormField>
              {TYPE_META[form.type].dateLabel === "nextDueDate" ? (
                <FormField label="Next Due Date">
                  <Input
                    type="date"
                    value={form.nextDueDate}
                    onChange={(e) => setForm((f) => ({ ...f, nextDueDate: e.target.value }))}
                  />
                </FormField>
              ) : (
                <FormField label="Expiry Date">
                  <Input
                    type="date"
                    value={form.expiryDate}
                    onChange={(e) => setForm((f) => ({ ...f, expiryDate: e.target.value }))}
                  />
                </FormField>
              )}
            </div>
            <FormField label="Notes">
              <Textarea
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="Any additional notes..."
              />
            </FormField>
          </FormSection>
        </div>
      </Dialog>

      {/* Delete confirmation */}
      <DeleteDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        itemLabel={deleteTarget ? `this ${TYPE_META[deleteTarget.type].label.toLowerCase()} record` : "this record"}
      />
    </PageContainer>
  );
}
