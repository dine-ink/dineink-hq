import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { notify, notifySuccess } from "@/utils/notify";
import { ToastProvider, useToast } from "./NotificationToast";

/**
 * The app's notification surface. Everything that used to be a window.alert()
 * now arrives here, so the things worth pinning are the ones a person would
 * actually notice going wrong: a message that never appears, an error that
 * vanishes before it can be read, or the same sentence stacking four deep
 * because a button was double-clicked.
 */

/** Renders the provider with a child that fires toasts on demand. */
function setup() {
  let show: ReturnType<typeof useToast>["show"];
  const Probe = () => {
    show = useToast().show;
    return null;
  };
  render(
    <ToastProvider>
      <Probe />
    </ToastProvider>,
  );
  return { show: (...args: Parameters<typeof show>) => act(() => show(...args)) };
}

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
});

afterEach(() => {
  vi.useRealTimers();
});

describe("ToastProvider", () => {
  it("shows the message it was given", () => {
    const { show } = setup();
    show("Vendor payment recorded");

    expect(screen.getByText("Vendor payment recorded")).toBeInTheDocument();
  });

  it("keeps an error up far longer than a confirmation", () => {
    // The point of the difference: at the moment a "Saved" toast would have
    // gone, the failure is still on screen to be read.
    const { show } = setup();
    show("Saved", "success");
    show("Payment failed", "danger");

    act(() => void vi.advanceTimersByTime(4100));
    expect(screen.queryByText("Saved")).not.toBeInTheDocument();
    expect(screen.getByText("Payment failed")).toBeInTheDocument();

    act(() => void vi.advanceTimersByTime(5000));
    expect(screen.queryByText("Payment failed")).not.toBeInTheDocument();
  });

  it("announces a failure assertively and a confirmation politely", () => {
    const { show } = setup();
    show("Could not save", "danger");
    show("Saved", "success");

    expect(screen.getByRole("alert")).toHaveTextContent("Could not save");
    expect(screen.getByRole("status")).toHaveTextContent("Saved");
  });

  it("does not stack the same message twice", () => {
    // A double-clicked save button should say it once.
    const { show } = setup();
    show("Please select a branch", "warning");
    show("Please select a branch", "warning");

    expect(screen.getAllByText("Please select a branch")).toHaveLength(1);
  });

  it("treats the same text as a different message when the variant differs", () => {
    const { show } = setup();
    show("Done", "success");
    show("Done", "info");

    expect(screen.getAllByText("Done")).toHaveLength(2);
  });

  it("keeps only the most recent few, so the stack cannot bury the page", () => {
    const { show } = setup();
    for (let i = 1; i <= 6; i += 1) show(`Message ${i}`, "info");

    expect(screen.queryByText("Message 1")).not.toBeInTheDocument();
    expect(screen.queryByText("Message 2")).not.toBeInTheDocument();
    expect(screen.getByText("Message 3")).toBeInTheDocument();
    expect(screen.getByText("Message 6")).toBeInTheDocument();
  });

  it("closes one when it is dismissed, leaving the rest", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const { show } = setup();
    show("First", "info");
    show("Second", "info");

    await user.click(screen.getAllByRole("button", { name: "Dismiss notification" })[0]);

    expect(screen.queryByText("First")).not.toBeInTheDocument();
    expect(screen.getByText("Second")).toBeInTheDocument();
  });
});

describe("notify() reaching the provider from outside React", () => {
  it("delivers a message sent from a plain function", () => {
    // This is the path all ~83 converted call sites take — they are in event
    // handlers and catch blocks, not in render, so they cannot use the hook.
    setup();
    act(() => notify("Failed to save the menu item"));

    expect(screen.getByRole("alert")).toHaveTextContent("Failed to save the menu item");
  });

  it("defaults to an error, so a bare notify() is never mistaken for success", () => {
    setup();
    act(() => notify("Something went wrong"));

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("sends notifySuccess() as a confirmation", () => {
    setup();
    act(() => notifySuccess("Ingredients saved successfully"));

    expect(screen.getByRole("status")).toHaveTextContent("Ingredients saved successfully");
  });

  it.each([
    ["an undefined message", undefined],
    ["a null message", null],
    ["an empty string", ""],
  ])("still says something useful given %s", (_label, message) => {
    // Failing endpoints do not all send a `message`, and several call sites
    // pass one straight through. An empty red box is worse than the alert()
    // it replaced.
    setup();
    act(() => notify(message));

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Something went wrong. Please try again.",
    );
  });

  it("warns to the console rather than throwing when no provider is mounted", () => {
    // A notification that silently vanishes because the root is mis-wired
    // would turn a visible failure back into a silent one — the exact bug the
    // migration existed to remove.
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(() => notify("Nobody is listening")).not.toThrow();
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
});

describe("useToast", () => {
  it("refuses to be used outside a provider", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const Orphan = () => {
      useToast();
      return null;
    };
    expect(() => render(<Orphan />)).toThrow(/within a <ToastProvider>/);
    error.mockRestore();
  });
});
