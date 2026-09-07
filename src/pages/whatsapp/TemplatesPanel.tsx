import { useState } from "react";
import { PlusIcon, TrashIcon, PencilSquareIcon } from "@heroicons/react/24/outline";
import { useAppSelector } from "@/store";
import {
  useSaveWhatsAppTemplateMutation,
  useDeleteWhatsAppTemplateMutation,
} from "@/store/api/whatsappApi";
import { Button, Dialog, DeleteDialog, FormField, FormSection, Input, Textarea, Alert, EmptyState } from "@/design";

export interface WhatsAppTemplate {
  id: number;
  name: string;
  message: string;
  createdAt: string;
}

const MAX_TEMPLATES = 5;

interface TemplatesPanelProps {
  templates: WhatsAppTemplate[];
  loading: boolean;
}

// Template CRUD — capped at MAX_TEMPLATES per restaurant (enforced
// server-side too; this just mirrors it so the "New Template" button
// disables itself instead of round-tripping to find out).
export default function TemplatesPanel({ templates, loading }: TemplatesPanelProps) {
  const { user } = useAppSelector((s) => s.auth);
  const [saveTemplate] = useSaveWhatsAppTemplateMutation();
  const [deleteTemplate] = useDeleteWhatsAppTemplateMutation();

  // null = closed, "new" = create mode, a WhatsAppTemplate = edit mode.
  const [editorTarget, setEditorTarget] = useState<WhatsAppTemplate | "new" | null>(null);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<WhatsAppTemplate | null>(null);

  const atCap = templates.length >= MAX_TEMPLATES;
  const isEditing = editorTarget !== null && editorTarget !== "new";

  const openCreate = () => {
    setName("");
    setMessage("");
    setError(null);
    setEditorTarget("new");
  };

  const openEdit = (t: WhatsAppTemplate) => {
    setName(t.name);
    setMessage(t.message);
    setError(null);
    setEditorTarget(t);
  };

  const resetAndClose = () => {
    setName("");
    setMessage("");
    setError(null);
    setEditorTarget(null);
  };

  const handleSave = async () => {
    if (!user?.restaurantId) return;
    if (!name.trim() || !message.trim()) {
      setError("Both name and message are required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      // No onRefetch: the mutation invalidates the template tag and whoever
      // is displaying the list updates itself.
      await saveTemplate({
        restaurantId: user.restaurantId,
        id: isEditing ? (editorTarget as WhatsAppTemplate).id : undefined,
        name: name.trim(),
        message: message.trim(),
      }).unwrap();
      resetAndClose();
    } catch (err: any) {
      setError(err?.message || "Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!user?.restaurantId || !deleteTarget) return;
    try {
      await deleteTemplate({
        restaurantId: user.restaurantId,
        id: deleteTarget.id,
      }).unwrap();
    } catch {
      // Was swallowed entirely: a refused delete closed the dialog and left
      // the template in the list with nothing said.
      alert("Failed to delete this template");
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-[15px] font-bold text-gray-900">Message Templates</h3>
          <p className="text-[11px] text-gray-500">
            {templates.length} / {MAX_TEMPLATES} used — use <code className="rounded bg-gray-100 px-1">{"{{name}}"}</code> in a message to auto-fill each customer's name.
          </p>
        </div>
        <Button
          size="sm"
          leftIcon={<PlusIcon className="h-4 w-4" />}
          onClick={openCreate}
          disabled={atCap}
        >
          New Template
        </Button>
      </div>

      {atCap && (
        <Alert variant="warning">
          You've reached the limit of {MAX_TEMPLATES} templates. Delete one below before creating another.
        </Alert>
      )}

      {!loading && templates.length === 0 ? (
        <EmptyState
          title="No templates yet"
          description="Create a template to reuse the same message across bulk WhatsApp sends."
          action={{ label: "New Template", onClick: openCreate }}
        />
      ) : (
        <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
          {templates.map((t) => (
            <div key={t.id} className="rounded-card border border-surface-border bg-surface-card p-3.5 shadow-card">
              <div className="flex items-start justify-between gap-2">
                <p className="text-[13px] font-bold text-gray-900">{t.name}</p>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    onClick={() => openEdit(t)}
                    aria-label={`Edit ${t.name}`}
                    className="rounded p-1 text-gray-400 transition hover:bg-primary-50 hover:text-primary-600"
                  >
                    <PencilSquareIcon className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(t)}
                    aria-label={`Delete ${t.name}`}
                    className="rounded p-1 text-gray-400 transition hover:bg-danger-50 hover:text-danger-600"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <p className="mt-1.5 whitespace-pre-wrap text-[12px] text-gray-600">{t.message}</p>
            </div>
          ))}
        </div>
      )}

      <Dialog
        open={editorTarget !== null}
        onClose={saving ? () => {} : resetAndClose}
        title={isEditing ? "Edit Template" : "New Template"}
        footer={
          <>
            <Button variant="outline" onClick={resetAndClose} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSave} loading={saving}>
              {isEditing ? "Save Changes" : "Create Template"}
            </Button>
          </>
        }
      >
        <FormSection>
          <FormField label="Template Name" required helperText="Internal label only — customers never see this.">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Weekend Offer" maxLength={60} disabled={saving} />
          </FormField>
          <FormField label="Message" required helperText={`${message.length}/1000 — use {{name}} to personalize.`}>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Hi {{name}}, we miss you! Enjoy 20% off your next visit this weekend."
              rows={5}
              maxLength={1000}
              disabled={saving}
            />
          </FormField>
          {error && <Alert variant="danger">{error}</Alert>}
        </FormSection>
      </Dialog>

      <DeleteDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        itemLabel={deleteTarget ? `the template "${deleteTarget.name}"` : "this template"}
      />
    </div>
  );
}
