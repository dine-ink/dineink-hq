import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import PayInvoiceDialog from "./PayInvoiceDialog";

/**
 * The dialog that replaced the app's last window.prompt() — which was taking
 * a payment amount.
 *
 * Everything here is about what must never reach the mutation: nothing, zero,
 * a negative, a non-number, or more than the invoice owes. The old prompt
 * accepted all but the last two and said nothing when it bailed out.
 */

const setup = (over: Partial<Parameters<typeof PayInvoiceDialog>[0]> = {}) => {
  const onSubmit = vi.fn();
  const onClose = vi.fn();
  const view = render(
    <PayInvoiceDialog
      open
      remaining={5000}
      onSubmit={onSubmit}
      onClose={onClose}
      {...over}
    />,
  );
  return { onSubmit, onClose, view, user: userEvent.setup() };
};

const amountBox = () => screen.getByLabelText("Amount");
const payButton = () => screen.getByRole("button", { name: /record payment/i });

describe("PayInvoiceDialog", () => {
  it("renders nothing when closed", () => {
    const { view } = setup({ open: false });
    expect(view.container).toBeEmptyDOMElement();
  });

  it("pre-fills the full outstanding amount, since paying off is the common case", () => {
    setup({ remaining: 4250 });
    expect(amountBox()).toHaveValue(4250);
  });

  it("says how much is owed", () => {
    setup({ remaining: 125000 });
    expect(screen.getByText(/₹1,25,000 still owed/)).toBeInTheDocument();
  });

  it("submits the amount entered", async () => {
    const { onSubmit, user } = setup({ remaining: 5000 });
    await user.clear(amountBox());
    await user.type(amountBox(), "1500");
    await user.click(payButton());

    expect(onSubmit).toHaveBeenCalledWith(1500);
  });

  it("shows what will still be owed after a part payment", async () => {
    const { user } = setup({ remaining: 5000 });
    await user.clear(amountBox());
    await user.type(amountBox(), "2000");

    expect(screen.getByText(/₹3,000 will remain owed/)).toBeInTheDocument();
  });

  it("submits on Enter", async () => {
    const { onSubmit, user } = setup({ remaining: 800 });
    await user.type(amountBox(), "{Enter}");

    expect(onSubmit).toHaveBeenCalledWith(800);
  });

  it("closes on Escape without paying anything", async () => {
    const { onSubmit, onClose, user } = setup();
    await user.type(amountBox(), "{Escape}");

    expect(onClose).toHaveBeenCalled();
    expect(onSubmit).not.toHaveBeenCalled();
  });
});

describe("PayInvoiceDialog — what must never reach the mutation", () => {
  it.each([
    ["an empty amount", "", /enter an amount/i],
    ["zero", "0", /more than zero/i],
    ["a negative amount", "-500", /more than zero/i],
    ["more than is owed", "9000", /more than the ₹5,000 still owed/i],
  ])("refuses %s", async (_label, typed, message) => {
    const { onSubmit, user } = setup({ remaining: 5000 });
    await user.clear(amountBox());
    if (typed) await user.type(amountBox(), typed);
    await user.click(payButton());

    expect(onSubmit).not.toHaveBeenCalled();
    // And says why, which the prompt never did — it just closed.
    expect(screen.getByText(message)).toBeInTheDocument();
  });

  it("refuses an invalid amount on Enter too, not just via the button", async () => {
    // The disabled button blocks the click path, so the guard inside submit()
    // is what stops the keyboard path — and Enter is the natural way to send
    // this form. Without it, ₹9,000 against a ₹5,000 invoice goes through.
    const { onSubmit, user } = setup({ remaining: 5000 });
    await user.clear(amountBox());
    await user.type(amountBox(), "9000{Enter}");

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("accepts exactly the amount owed", async () => {
    const { onSubmit, user } = setup({ remaining: 5000 });
    await user.click(payButton());

    expect(onSubmit).toHaveBeenCalledWith(5000);
  });

  it("marks the field invalid for a screen reader, not just in colour", async () => {
    const { user } = setup({ remaining: 5000 });
    await user.clear(amountBox());
    await user.click(payButton());

    expect(amountBox()).toHaveAttribute("aria-invalid", "true");
  });

  it("cannot be submitted twice while the first payment is in flight", () => {
    setup({ submitting: true });
    // The label reports the in-flight state, so this is the button either way.
    expect(screen.getByRole("button", { name: /recording/i })).toBeDisabled();
    expect(screen.queryByRole("button", { name: /record payment/i })).not.toBeInTheDocument();
  });

  it("re-primes when reopened against a different invoice", () => {
    const { view } = setup({ remaining: 5000 });
    expect(amountBox()).toHaveValue(5000);

    // Without the effect keyed on `remaining`, this would still offer the
    // previous invoice's figure — and it would be rejected as over the new
    // balance, or worse, accepted against it.
    view.rerender(
      <PayInvoiceDialog
        open
        remaining={1200}
        onSubmit={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    expect(amountBox()).toHaveValue(1200);
  });
});
