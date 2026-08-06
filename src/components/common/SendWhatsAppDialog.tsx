import { useState } from "react";
import { useAppSelector } from "../../store";
import { Dialog, FormField, FormSection, Input, Textarea, Button, Alert } from "../../design";

export type WhatsAppTemplateType =
  | "CUSTOMER_MARKETING"
  | "VENDOR_EBILL"
  | "VENDOR_PAYMENT"
  | "GST_UPDATE";

export interface SendWhatsAppDialogProps {
  open: boolean;
  onClose: () => void;
  /** Prefilled recipient phone number — still editable by the user. */
  defaultPhone?: string;
  templateType: WhatsAppTemplateType;
  relatedEntityType?: string;
  relatedEntityId?: number;
  /** Called after a successful send, before the dialog closes. */
  onSent?: () => void;
}

// A small reusable "compose + send" dialog over POST /api/whatsapp/send.
// Used both from the Customers page (per-row "Message" action) and from the
// WhatsApp Center's generic "Send Message" button — one implementation so
// the demo-mode disclosure and error handling only need to live in one
// place.
export default function SendWhatsAppDialog({
  open,
  onClose,
  defaultPhone = "",
  templateType,
  relatedEntityType,
  relatedEntityId,
  onSent,
}: SendWhatsAppDialogProps) {
  const API_URL = import.meta.env.VITE_API_URL;
  const { token } = useAppSelector((s) => s.auth);
  const { selectedBranch } = useAppSelector((s) => s.branch);

  const [phone, setPhone] = useState(defaultPhone);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Re-sync the phone field whenever the dialog is opened for a different
  // recipient/defaultPhone, without resetting it on every parent re-render.
  const [lastDefaultPhone, setLastDefaultPhone] = useState(defaultPhone);
  if (open && defaultPhone !== lastDefaultPhone) {
    setLastDefaultPhone(defaultPhone);
    setPhone(defaultPhone);
  }

  const resetAndClose = () => {
    setMessage("");
    setError(null);
    setSuccess(false);
    onClose();
  };

  const handleSend = async () => {
    if (!phone.trim() || !message.trim()) {
      setError("Phone number and message are both required.");
      return;
    }
    setSending(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/whatsapp/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          branchId: selectedBranch?.id,
          recipientPhone: phone.trim(),
          templateType,
          message: message.trim(),
          relatedEntityType,
          relatedEntityId,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json?.message || "Failed to send message");
      }
      setSuccess(true);
      onSent?.();
      setTimeout(() => {
        resetAndClose();
      }, 900);
    } catch (err: any) {
      setError(err?.message || "Something went wrong while sending.");
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={sending ? () => {} : resetAndClose}
      title="Send WhatsApp Message"
      footer={
        <>
          <Button variant="outline" onClick={resetAndClose} disabled={sending}>
            Cancel
          </Button>
          <Button onClick={handleSend} loading={sending}>
            Send Message
          </Button>
        </>
      }
    >
      <FormSection>
        <Alert variant="warning" title="Demo mode">
          This hits a mock WhatsApp sender — the message is logged for
          records, not actually delivered to the customer's phone yet.
        </Alert>

        <FormField label="Recipient Phone" required>
          <Input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="e.g. 9876543210"
            disabled={sending}
          />
        </FormField>

        <FormField label="Message" required>
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type the message to send..."
            rows={4}
            disabled={sending}
          />
        </FormField>

        {error && <Alert variant="danger">{error}</Alert>}
        {success && <Alert variant="success">Message logged successfully.</Alert>}
      </FormSection>
    </Dialog>
  );
}
