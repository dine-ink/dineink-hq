import { useMemo, useState } from "react";
import { useAppSelector } from "@/store";
import {
  useGetEquipmentQuery,
  useGetMaintenanceDueQuery,
  useSaveEquipmentMutation,
  useDeleteEquipmentMutation,
} from "@/store/api/operationsApi";
import {
  WrenchScrewdriverIcon,
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import {
  PageContainer,
  PageHeader,
  MetricCard,
  LoadingOverlay,
  Dialog,
  ConfirmationDialog,
  DataTable,
  FormField,
  FormSection,
  Input,
  Select,
  Textarea,
  Button,
  IconButton,
  StatusChip,
  EmptyState,
  Alert,
  type DataTableColumn,
  type ChipStatus,
} from "@/design";


interface EmiScheduleRef {
  id: number;
  name: string;
  emiAmount: number;
  dueDayOfMonth: number;
}

interface Equipment {
  id: number;
  restaurantId: number;
  branchId: number;
  name: string;
  category: string | null;
  capacity: string | null;
  volume: string | null;
  itemCapacityCount: number | null;
  powerConsumptionKw: number | null;
  purchasePrice: number | null;
  purchaseDate: string | null;
  emiScheduleId: number | null;
  installationDate: string | null;
  warrantyExpiryDate: string | null;
  expectedLifespanMonths: number | null;
  serviceProviderName: string | null;
  serviceProviderContact: string | null;
  nextMaintenanceDate: string | null;
  maintenanceNotes: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  emiSchedule: EmiScheduleRef | null;
}

interface MaintenanceDueEquipment extends Equipment {
  isOverdue: boolean;
  isWarrantyExpiringSoon: boolean;
}

interface EquipmentFormState {
  name: string;
  category: string;
  capacity: string;
  volume: string;
  itemCapacityCount: string;
  powerConsumptionKw: string;
  purchasePrice: string;
  purchaseDate: string;
  emiScheduleId: string;
  installationDate: string;
  warrantyExpiryDate: string;
  expectedLifespanMonths: string;
  serviceProviderName: string;
  serviceProviderContact: string;
  nextMaintenanceDate: string;
  maintenanceNotes: string;
  isActive: string; // "true" | "false" — controlled <Select> needs a string value
}

const blankForm: EquipmentFormState = {
  name: "",
  category: "",
  capacity: "",
  volume: "",
  itemCapacityCount: "",
  powerConsumptionKw: "",
  purchasePrice: "",
  purchaseDate: "",
  emiScheduleId: "",
  installationDate: "",
  warrantyExpiryDate: "",
  expectedLifespanMonths: "",
  serviceProviderName: "",
  serviceProviderContact: "",
  nextMaintenanceDate: "",
  maintenanceNotes: "",
  isActive: "true",
};

// Same date-formatting convention already used across the app (see
// Vendors.tsx / DiscountCodesTab.tsx-style pages): en-IN locale, short month.
const formatDate = (value: string | null) =>
  value
    ? new Date(value).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "—";

const formatCurrency = (value: number | null) =>
  value != null ? `₹${Number(value).toLocaleString("en-IN")}` : "—";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

// Shared "how urgent is this date" rule — drives both the StatusChip color in
// the Warranty Expiry / Next Maintenance columns and the KPI counts above the
// table, so the two never disagree: past -> danger, within 30 days ->
// warning, further out -> success, no date set -> null (render a plain dash).
function dateUrgency(value: string | null): ChipStatus | null {
  if (!value) return null;
  const target = new Date(value).getTime();
  if (Number.isNaN(target)) return null;
  const daysLeft = Math.ceil((target - Date.now()) / MS_PER_DAY);
  if (daysLeft < 0) return "danger";
  if (daysLeft <= 30) return "warning";
  return "success";
}

export default function EquipmentList() {
  const { user } = useAppSelector((s) => s.auth);
  const { selectedBranch } = useAppSelector((s) => s.branch);


  const [formModal, setFormModal] = useState<{ open: boolean; editing: Equipment | null }>({
    open: false,
    editing: null,
  });
  const [form, setForm] = useState<EquipmentFormState>(blankForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const [deleteTarget, setDeleteTarget] = useState<Equipment | null>(null);

  /**
   * The list and the maintenance-due subset share the Equipment tag, so a save
   * or a delete refreshes both. They were two hand-written refetches called in
   * sequence after every write, which the Stations tab in the Labor module also
   * had to do — that one now benefits too, since writing an equipment-station
   * link invalidates the same tag.
   */
  const scope = {
    restaurantId: user?.restaurantId as number,
    branchId: selectedBranch?.id as number,
  };
  const skip = { skip: !user?.restaurantId || !selectedBranch?.id };

  const { data: equipment = [], isFetching: loading } = useGetEquipmentQuery(scope, skip);
  // Typed at the point of use; the slice types its payloads `any[]`.
  const { data: maintenanceDueData = [] } = useGetMaintenanceDueQuery(
    { ...scope, withinDays: 30 },
    skip,
  );
  const maintenanceDue = maintenanceDueData as MaintenanceDueEquipment[];

  const [saveEquipment] = useSaveEquipmentMutation();
  const [deleteEquipment] = useDeleteEquipmentMutation();

  const overdueItems = maintenanceDue.filter((e) => e.isOverdue);
  const warrantyExpiringCount = useMemo(
    () => equipment.filter((e) => dateUrgency(e.warrantyExpiryDate) === "warning").length,
    [equipment],
  );

  const openCreateModal = () => {
    setForm(blankForm);
    setFormError("");
    setFormModal({ open: true, editing: null });
  };

  const openEditModal = (eq: Equipment) => {
    setForm({
      name: eq.name,
      category: eq.category || "",
      capacity: eq.capacity || "",
      volume: eq.volume || "",
      itemCapacityCount: eq.itemCapacityCount != null ? String(eq.itemCapacityCount) : "",
      powerConsumptionKw: eq.powerConsumptionKw != null ? String(eq.powerConsumptionKw) : "",
      purchasePrice: eq.purchasePrice != null ? String(eq.purchasePrice) : "",
      purchaseDate: eq.purchaseDate ? eq.purchaseDate.split("T")[0] : "",
      emiScheduleId: eq.emiScheduleId != null ? String(eq.emiScheduleId) : "",
      installationDate: eq.installationDate ? eq.installationDate.split("T")[0] : "",
      warrantyExpiryDate: eq.warrantyExpiryDate ? eq.warrantyExpiryDate.split("T")[0] : "",
      expectedLifespanMonths: eq.expectedLifespanMonths != null ? String(eq.expectedLifespanMonths) : "",
      serviceProviderName: eq.serviceProviderName || "",
      serviceProviderContact: eq.serviceProviderContact || "",
      nextMaintenanceDate: eq.nextMaintenanceDate ? eq.nextMaintenanceDate.split("T")[0] : "",
      maintenanceNotes: eq.maintenanceNotes || "",
      isActive: eq.isActive ? "true" : "false",
    });
    setFormError("");
    setFormModal({ open: true, editing: eq });
  };

  const closeFormModal = () => setFormModal({ open: false, editing: null });

  const handleSave = async () => {
    if (!form.name.trim()) {
      setFormError("Name is required");
      return;
    }
    if (!user?.restaurantId || !selectedBranch?.id) return;

    const body: Record<string, unknown> = {
      name: form.name.trim(),
      category: form.category.trim() || null,
      capacity: form.capacity.trim() || null,
      volume: form.volume.trim() || null,
      itemCapacityCount: form.itemCapacityCount ? Number(form.itemCapacityCount) : null,
      powerConsumptionKw: form.powerConsumptionKw ? Number(form.powerConsumptionKw) : null,
      purchasePrice: form.purchasePrice ? Number(form.purchasePrice) : null,
      purchaseDate: form.purchaseDate || null,
      emiScheduleId: form.emiScheduleId ? Number(form.emiScheduleId) : null,
      installationDate: form.installationDate || null,
      warrantyExpiryDate: form.warrantyExpiryDate || null,
      expectedLifespanMonths: form.expectedLifespanMonths ? Number(form.expectedLifespanMonths) : null,
      serviceProviderName: form.serviceProviderName.trim() || null,
      serviceProviderContact: form.serviceProviderContact.trim() || null,
      nextMaintenanceDate: form.nextMaintenanceDate || null,
      maintenanceNotes: form.maintenanceNotes.trim() || null,
    };

    if (formModal.editing) {
      body.isActive = form.isActive === "true";
    } else {
      body.branchId = selectedBranch.id;
    }

    setFormError("");
    setSaving(true);
    try {
      await saveEquipment({ id: formModal.editing?.id, body }).unwrap();
      closeFormModal();
    } catch {
      setFormError("Failed to save equipment");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const id = deleteTarget.id;
    try {
      // Rows disappear only once the server has confirmed. The original never
      // read the response and filtered unconditionally, so a failed delete
      // removed the item from the screen while it still existed in the
      // database — and it reappeared on the next load. `.unwrap()` keeps that
      // fixed, and the tag replaces the two manual filters.
      await deleteEquipment(id).unwrap();
    } catch {
      alert("Failed to delete this equipment item");
    } finally {
      setDeleteTarget(null);
    }
  };

  const columns: DataTableColumn<Equipment>[] = [
    {
      key: "name",
      header: "Name",
      render: (eq) => (
        <div>
          <p className="font-semibold text-gray-900">{eq.name}</p>
          {eq.category && <p className="text-[10px] text-gray-400">{eq.category}</p>}
        </div>
      ),
    },
    {
      key: "capacity",
      header: "Capacity / Volume",
      render: (eq) => {
        if (!eq.capacity && !eq.volume && eq.itemCapacityCount == null) {
          return <span className="text-gray-400">—</span>;
        }
        return (
          <div className="text-gray-600">
            {eq.capacity && <p>{eq.capacity}</p>}
            {eq.volume && <p className="text-[10px] text-gray-400">Vol: {eq.volume}</p>}
            {eq.itemCapacityCount != null && (
              <p className="text-[10px] text-gray-400">{eq.itemCapacityCount} items</p>
            )}
          </div>
        );
      },
    },
    {
      key: "power",
      header: "Power (kW)",
      render: (eq) => (eq.powerConsumptionKw != null ? `${eq.powerConsumptionKw} kW` : "—"),
    },
    {
      key: "purchasePrice",
      header: "Purchase Price",
      render: (eq) => formatCurrency(eq.purchasePrice),
    },
    {
      key: "warranty",
      header: "Warranty Expiry",
      render: (eq) => {
        const urgency = dateUrgency(eq.warrantyExpiryDate);
        return urgency ? (
          <StatusChip status={urgency}>{formatDate(eq.warrantyExpiryDate)}</StatusChip>
        ) : (
          <span className="text-gray-400">—</span>
        );
      },
    },
    {
      key: "maintenance",
      header: "Next Maintenance",
      render: (eq) => {
        const urgency = dateUrgency(eq.nextMaintenanceDate);
        return urgency ? (
          <StatusChip status={urgency}>{formatDate(eq.nextMaintenanceDate)}</StatusChip>
        ) : (
          <span className="text-gray-400">—</span>
        );
      },
    },
    {
      key: "emi",
      header: "EMI",
      render: (eq) =>
        eq.emiSchedule ? (
          <div>
            <p className="font-semibold text-gray-800">{eq.emiSchedule.name}</p>
            <p className="text-[10px] text-gray-400">{formatCurrency(eq.emiSchedule.emiAmount)}/mo</p>
          </div>
        ) : (
          <span className="text-gray-400">—</span>
        ),
    },
    {
      key: "status",
      header: "Status",
      render: (eq) => (
        <StatusChip status={eq.isActive ? "success" : "neutral"}>
          {eq.isActive ? "Active" : "Inactive"}
        </StatusChip>
      ),
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      render: (eq) => (
        <div className="flex items-center justify-end gap-1">
          <IconButton
            aria-label={`Edit ${eq.name}`}
            icon={<PencilSquareIcon className="h-3.5 w-3.5" />}
            onClick={() => openEditModal(eq)}
          />
          <IconButton
            aria-label={`Delete ${eq.name}`}
            icon={<TrashIcon className="h-3.5 w-3.5" />}
            variant="danger"
            onClick={() => setDeleteTarget(eq)}
          />
        </div>
      ),
    },
  ];

  if (loading && equipment.length === 0) {
    return <LoadingOverlay label="Loading equipment..." />;
  }

  return (
    <PageContainer>
      <PageHeader
        icon={<WrenchScrewdriverIcon className="h-5 w-5 text-white" />}
        title="Equipment Data List"
        subtitle="Track kitchen and operational equipment — capacity, power consumption, purchase, warranty and maintenance"
        actions={
          <Button
            variant="primary"
            size="sm"
            leftIcon={<PlusIcon className="h-4 w-4" />}
            onClick={openCreateModal}
          >
            Add Equipment
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <MetricCard
          label="Total Equipment"
          value={equipment.length}
          sub="tracked in this branch"
          status="primary"
        />
        <MetricCard
          label="Active"
          value={equipment.filter((e) => e.isActive).length}
          sub="currently in service"
          status="success"
        />
        <MetricCard
          label="Maintenance Due (30d)"
          value={maintenanceDue.length}
          sub="needs attention soon"
          status={maintenanceDue.length > 0 ? "warning" : "neutral"}
        />
        <MetricCard
          label="Warranty Expiring Soon"
          value={warrantyExpiringCount}
          sub="within 30 days"
          status={warrantyExpiringCount > 0 ? "danger" : "neutral"}
        />
      </div>

      {overdueItems.length > 0 && (
        <Alert variant="warning" title="Overdue maintenance">
          {overdueItems.map((e) => e.name).join(", ")} — schedule service as soon as possible.
        </Alert>
      )}

      <div className="overflow-hidden rounded-card border border-surface-border bg-surface-card shadow-card">
        <div className="border-b border-surface-border px-5 py-3">
          <h2 className="text-[15px] font-bold text-gray-900">All Equipment</h2>
          <p className="text-[11px] text-gray-500">{equipment.length} items tracked</p>
        </div>
        {equipment.length === 0 && !loading ? (
          <EmptyState
            title="No equipment recorded yet"
            description="Click Add Equipment to start tracking your kitchen and operational equipment."
            action={{ label: "Add Equipment", onClick: openCreateModal }}
            className="m-4"
          />
        ) : (
          <DataTable columns={columns} rows={equipment} rowKey={(eq) => eq.id} loading={loading} />
        )}
      </div>

      {/* Add / Edit Dialog */}
      <Dialog
        open={formModal.open}
        onClose={closeFormModal}
        title={formModal.editing ? "Edit Equipment" : "Add Equipment"}
        size="lg"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={closeFormModal} disabled={saving}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleSave} loading={saving}>
              Save
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-5">
          {formError && <Alert variant="danger">{formError}</Alert>}

          <FormSection title="Basic Info">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <FormField label="Name" required>
                <Input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Walk-in Freezer"
                />
              </FormField>
              <FormField label="Category">
                <Input
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                  placeholder="e.g. Refrigeration"
                />
              </FormField>
            </div>
          </FormSection>

          <FormSection title="Capacity & Power">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <FormField label="Capacity">
                <Input
                  value={form.capacity}
                  onChange={(e) => setForm((f) => ({ ...f, capacity: e.target.value }))}
                  placeholder="e.g. 500 kg"
                />
              </FormField>
              <FormField label="Volume">
                <Input
                  value={form.volume}
                  onChange={(e) => setForm((f) => ({ ...f, volume: e.target.value }))}
                  placeholder="e.g. 200 L"
                />
              </FormField>
              <FormField label="Item Capacity Count">
                <Input
                  type="number"
                  value={form.itemCapacityCount}
                  onChange={(e) => setForm((f) => ({ ...f, itemCapacityCount: e.target.value }))}
                  placeholder="e.g. 40"
                />
              </FormField>
              <FormField label="Power Consumption (kW)">
                <Input
                  type="number"
                  step="0.01"
                  value={form.powerConsumptionKw}
                  onChange={(e) => setForm((f) => ({ ...f, powerConsumptionKw: e.target.value }))}
                  placeholder="e.g. 2.5"
                />
              </FormField>
            </div>
          </FormSection>

          <FormSection title="Purchase & Financial">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <FormField label="Purchase Price (₹)">
                <Input
                  type="number"
                  value={form.purchasePrice}
                  onChange={(e) => setForm((f) => ({ ...f, purchasePrice: e.target.value }))}
                  placeholder="0.00"
                />
              </FormField>
              <FormField label="Purchase Date">
                <Input
                  type="date"
                  value={form.purchaseDate}
                  onChange={(e) => setForm((f) => ({ ...f, purchaseDate: e.target.value }))}
                />
              </FormField>
              <FormField label="EMI Schedule ID" helperText="Optional — link an existing EMI schedule">
                <Input
                  type="number"
                  value={form.emiScheduleId}
                  onChange={(e) => setForm((f) => ({ ...f, emiScheduleId: e.target.value }))}
                  placeholder="Optional"
                />
              </FormField>
            </div>
          </FormSection>

          <FormSection title="Installation & Warranty">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <FormField label="Installation Date">
                <Input
                  type="date"
                  value={form.installationDate}
                  onChange={(e) => setForm((f) => ({ ...f, installationDate: e.target.value }))}
                />
              </FormField>
              <FormField label="Warranty Expiry Date">
                <Input
                  type="date"
                  value={form.warrantyExpiryDate}
                  onChange={(e) => setForm((f) => ({ ...f, warrantyExpiryDate: e.target.value }))}
                />
              </FormField>
              <FormField label="Expected Lifespan (months)">
                <Input
                  type="number"
                  value={form.expectedLifespanMonths}
                  onChange={(e) => setForm((f) => ({ ...f, expectedLifespanMonths: e.target.value }))}
                  placeholder="e.g. 96"
                />
              </FormField>
            </div>
          </FormSection>

          <FormSection title="Service & Maintenance">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <FormField label="Service Provider Name">
                <Input
                  value={form.serviceProviderName}
                  onChange={(e) => setForm((f) => ({ ...f, serviceProviderName: e.target.value }))}
                  placeholder="e.g. CoolTech Services"
                />
              </FormField>
              <FormField label="Service Provider Contact">
                <Input
                  value={form.serviceProviderContact}
                  onChange={(e) => setForm((f) => ({ ...f, serviceProviderContact: e.target.value }))}
                  placeholder="Phone or email"
                />
              </FormField>
              <FormField label="Next Maintenance Date">
                <Input
                  type="date"
                  value={form.nextMaintenanceDate}
                  onChange={(e) => setForm((f) => ({ ...f, nextMaintenanceDate: e.target.value }))}
                />
              </FormField>
              {formModal.editing && (
                <FormField label="Status">
                  <Select
                    value={form.isActive}
                    onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.value }))}
                  >
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </Select>
                </FormField>
              )}
              <FormField label="Maintenance Notes" className="sm:col-span-2">
                <Textarea
                  value={form.maintenanceNotes}
                  onChange={(e) => setForm((f) => ({ ...f, maintenanceNotes: e.target.value }))}
                  placeholder="Any notes about servicing this equipment"
                />
              </FormField>
            </div>
          </FormSection>
        </div>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmationDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete confirmation"
        tone="danger"
        confirmLabel="Delete"
      >
        Are you sure you want to delete{" "}
        {deleteTarget?.name ? <strong>{deleteTarget.name}</strong> : "this equipment"}? This action
        cannot be undone.
      </ConfirmationDialog>
    </PageContainer>
  );
}
