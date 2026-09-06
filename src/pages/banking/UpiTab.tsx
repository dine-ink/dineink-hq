import { useEffect, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { useAppSelector } from "@/store";
import { Button, Dialog, FormField, Input, Alert, EmptyState, LoadingOverlay, useDisclosure } from "@/design";
import { QrCodeIcon, PencilIcon } from "@heroicons/react/24/outline";
import type { UpiConfig, UpiQrData } from "./types";

const API_URL = import.meta.env.VITE_API_URL;

interface UpiForm {
  upiId: string;
  displayName: string;
}

export default function UpiTab() {
  const { user, token } = useAppSelector((s) => s.auth);
  const { selectedBranch } = useAppSelector((s) => s.branch);
  const [config, setConfig] = useState<UpiConfig | null>(null);
  const [qr, setQr] = useState<UpiQrData | null>(null);
  const [loading, setLoading] = useState(false);
  const [qrLoading, setQrLoading] = useState(false);
  const [qrPrompt, setQrPrompt] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [form, setForm] = useState<UpiForm>({ upiId: "", displayName: "" });

  const editDialog = useDisclosure();

  const branchId = selectedBranch?.id;

  const loadConfig = async () => {
    if (!user?.restaurantId || !branchId) return;
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/banking/upi/${user.restaurantId}/${branchId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) setConfig(json.data || null);
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  };

  const loadQr = async () => {
    if (!user?.restaurantId || !branchId) return;
    try {
      setQrLoading(true);
      setQrPrompt(null);
      const res = await fetch(`${API_URL}/api/banking/upi/${user.restaurantId}/${branchId}/qr`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setQr(json.data);
      } else {
        setQr(null);
        setQrPrompt(json.message || "No UPI ID configured yet.");
      }
    } catch {
      setQr(null);
      setQrPrompt("Could not load the QR code. Please try again.");
    } finally {
      setQrLoading(false);
    }
  };

  useEffect(() => {
    loadConfig();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.restaurantId, branchId]);

  useEffect(() => {
    if (config?.upiId) loadQr();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config?.upiId]);

  const openEdit = () => {
    setForm({ upiId: config?.upiId || "", displayName: config?.displayName || "" });
    setFormError(null);
    editDialog.open();
  };

  const handleSave = async () => {
    if (!form.upiId.trim() || !form.displayName.trim()) {
      setFormError("Both UPI ID and display name are required.");
      return;
    }
    if (!branchId) {
      setFormError("Select a branch first.");
      return;
    }
    try {
      setSaving(true);
      setFormError(null);
      const res = await fetch(`${API_URL}/api/banking/upi`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ branchId, upiId: form.upiId.trim(), displayName: form.displayName.trim() }),
      });
      const json = await res.json();
      if (!res.ok || json.success === false) {
        setFormError(json.message || "Failed to save UPI details.");
        return;
      }
      editDialog.close();
      await loadConfig();
    } catch {
      setFormError("Failed to save UPI details. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (!branchId) {
    return <EmptyState title="Select a branch" description="Choose a branch from the top bar to view or configure its UPI details." />;
  }

  if (loading) return <LoadingOverlay label="Loading UPI configuration..." />;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3 rounded-xl border border-gray-200 bg-white p-4">
        <div>
          <h3 className="text-[14px] font-bold text-gray-900">UPI Configuration — {selectedBranch?.name}</h3>
          <p className="mt-0.5 text-[11px] text-gray-400">
            The UPI ID and display name customers will pay to at this branch.
          </p>
        </div>
        <Button size="sm" variant="outline" leftIcon={<PencilIcon className="h-3.5 w-3.5" />} onClick={openEdit}>
          {config?.upiId ? "Edit" : "Configure UPI"}
        </Button>
      </div>

      {!config?.upiId ? (
        <EmptyState
          icon={QrCodeIcon}
          title="No UPI ID configured for this branch"
          description="Configure a UPI ID to generate a scannable QR code customers can use to pay directly via their own UPI app."
          action={{ label: "Configure UPI", onClick: openEdit }}
        />
      ) : (
        <div className="flex flex-col items-center gap-4 rounded-xl border border-gray-200 bg-white p-6">
          {qrLoading ? (
            <LoadingOverlay label="Generating QR code..." className="min-h-[220px]" />
          ) : qrPrompt ? (
            <Alert variant="warning" title="QR code unavailable">
              {qrPrompt} Use the "Configure UPI" button above to set a UPI ID first.
            </Alert>
          ) : qr ? (
            <>
              <img
                src={qr.qrCodeDataUrl}
                alt={`UPI QR code for ${qr.displayName}`}
                className="h-56 w-56 rounded-lg border border-gray-100 object-contain shadow-sm"
              />
              <div className="text-center">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">UPI ID</p>
                <p className="text-[22px] font-black tracking-tight text-gray-900">{qr.upiId}</p>
                <p className="mt-1 text-[13px] text-gray-500">{qr.displayName}</p>
              </div>
              <p className="max-w-md text-center text-[11px] text-gray-400">
                This is a static UPI-intent QR code — scanning it opens the customer's own UPI app to complete payment
                directly with your bank. There is no payment gateway involved and no live collection tracking beyond
                what the customer's bank/UPI app shows them.
              </p>
            </>
          ) : null}
        </div>
      )}

      <EditUpiDialog open={editDialog.isOpen} onClose={editDialog.close} form={form} setForm={setForm} saving={saving} formError={formError} onSave={handleSave} />
    </div>
  );
}

interface EditUpiDialogProps {
  open: boolean;
  onClose: () => void;
  form: UpiForm;
  setForm: Dispatch<SetStateAction<UpiForm>>;
  saving: boolean;
  formError: string | null;
  onSave: () => void;
}

function EditUpiDialog({ open, onClose, form, setForm, saving, formError, onSave }: EditUpiDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Configure UPI"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button size="sm" onClick={onSave} loading={saving}>
            Save
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        {formError && <Alert variant="danger">{formError}</Alert>}
        <FormField label="UPI ID" required helperText="e.g. restaurantname@upi">
          <Input value={form.upiId} onChange={(e) => setForm((f) => ({ ...f, upiId: e.target.value }))} placeholder="restaurant@bankupi" />
        </FormField>
        <FormField label="Display Name" required helperText="Shown to customers in their UPI app">
          <Input
            value={form.displayName}
            onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))}
            placeholder="e.g. Dine Ink Restaurant"
          />
        </FormField>
      </div>
    </Dialog>
  );
}
