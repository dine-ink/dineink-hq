import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { confirmAction } from "@/utils/confirmAction";
import { ConfirmProvider } from "./ConfirmProvider";

/**
 * The styled replacement for window.confirm(), and the promise bridge that
 * lets a hook which renders nothing still ask a question.
 *
 * Thirteen call sites now sit behind `if (!(await confirmAction(...))) return;`
 * and nearly all of them delete something. So the behaviours worth pinning are
 * the ones where getting it wrong either destroys data (resolving true when
 * the person said no) or wedges the app (a promise that never settles, leaving
 * a handler awaiting forever).
 */

const click = (name: RegExp | string) =>
  userEvent.click(screen.getByRole("button", { name }));

describe("ConfirmProvider", () => {
  it("resolves true when confirmed", async () => {
    render(<ConfirmProvider>{null}</ConfirmProvider>);

    const answer = confirmAction({ title: "Delete this menu item?" });
    await screen.findByText("Delete this menu item?");
    await click("Confirm");

    await expect(answer).resolves.toBe(true);
  });

  it("resolves false when cancelled", async () => {
    render(<ConfirmProvider>{null}</ConfirmProvider>);

    const answer = confirmAction({ title: "Delete this vendor?" });
    await screen.findByText("Delete this vendor?");
    await click("Cancel");

    await expect(answer).resolves.toBe(false);
  });

  it("resolves false when dismissed with the close button", async () => {
    // Closing the dialog is a refusal, not a silent nothing — the caller is
    // awaiting an answer either way.
    render(<ConfirmProvider>{null}</ConfirmProvider>);

    const answer = confirmAction({ title: "Delete this budget?" });
    await screen.findByText("Delete this budget?");
    await click(/close dialog/i);

    await expect(answer).resolves.toBe(false);
  });

  it("shows the explanatory message alongside the question", async () => {
    render(<ConfirmProvider>{null}</ConfirmProvider>);

    void confirmAction({
      title: "Delete this vendor?",
      message: "Every ingredient link to this vendor will be removed as well.",
    });

    expect(
      await screen.findByText("Every ingredient link to this vendor will be removed as well."),
    ).toBeInTheDocument();
  });

  it("uses the labels it was given", async () => {
    render(<ConfirmProvider>{null}</ConfirmProvider>);

    void confirmAction({
      title: "Close setup and lose your progress?",
      confirmLabel: "Close anyway",
      cancelLabel: "Keep setting up",
    });

    expect(await screen.findByRole("button", { name: "Close anyway" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Keep setting up" })).toBeInTheDocument();
  });

  it("closes once answered, so the next question gets a fresh dialog", async () => {
    render(<ConfirmProvider>{null}</ConfirmProvider>);

    const first = confirmAction({ title: "First question?" });
    await screen.findByText("First question?");
    await click("Confirm");
    await expect(first).resolves.toBe(true);
    await waitFor(() => expect(screen.queryByText("First question?")).not.toBeInTheDocument());

    const second = confirmAction({ title: "Second question?" });
    await screen.findByText("Second question?");
    await click("Cancel");
    await expect(second).resolves.toBe(false);
  });

  it("declines a second question asked while one is still open", async () => {
    // A modal dialog has nowhere to show a second question. Declining it beats
    // returning a promise that can never settle and hangs its caller.
    render(<ConfirmProvider>{null}</ConfirmProvider>);

    const first = confirmAction({ title: "First question?" });
    await screen.findByText("First question?");

    await expect(confirmAction({ title: "Second question?" })).resolves.toBe(false);
    expect(screen.queryByText("Second question?")).not.toBeInTheDocument();

    await click("Confirm");
    await expect(first).resolves.toBe(true);
  });

  it("answers an outstanding question when it unmounts", async () => {
    // Otherwise navigating away mid-question leaves the caller awaiting a
    // promise that will never settle.
    const { unmount } = render(<ConfirmProvider>{null}</ConfirmProvider>);

    const answer = confirmAction({ title: "Delete this station?" });
    await screen.findByText("Delete this station?");
    unmount();

    await expect(answer).resolves.toBe(false);
  });

  it("renders whatever markup the message is given", async () => {
    // StationsTab lists the consequences of deleting a station. It used to
    // join them with "\n", which collapses to a space in rendered markup.
    render(<ConfirmProvider>{null}</ConfirmProvider>);

    void confirmAction({
      title: 'Delete "Grill"?',
      message: (
        <ul>
          <li>3 labor standard(s) will be deleted.</li>
          <li>2 staff skill entr(ies) will be deleted.</li>
        </ul>
      ),
    });

    expect(await screen.findByText("3 labor standard(s) will be deleted.")).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
  });
});

describe("confirmAction with no provider mounted", () => {
  it("declines rather than proceeding, and says why", async () => {
    // Almost every call site is a delete. A mis-wired root must mean "nothing
    // happened", never "deleted without asking".
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    await expect(confirmAction({ title: "Delete everything?" })).resolves.toBe(false);
    expect(warn).toHaveBeenCalled();

    warn.mockRestore();
  });
});
