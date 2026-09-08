import { afterEach, describe, expect, it, vi } from "vitest";
import { Provider } from "react-redux";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import PasswordTab from "./PasswordTab";
import { ToastProvider } from "@/design/components/feedback";
import { authenticatedState, makeTestStore } from "@/test/test-utils";

const respond = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const renderTab = (onSignOutAll = vi.fn()) => {
  const store = makeTestStore(authenticatedState());
  render(
    <Provider store={store}>
      <ToastProvider>
        <PasswordTab onSignOutAll={onSignOutAll} />
      </ToastProvider>
    </Provider>,
  );
  return { onSignOutAll };
};

const fillForm = async (
  user: ReturnType<typeof userEvent.setup>,
  values: { current?: string; next?: string; confirm?: string },
) => {
  if (values.current) await user.type(screen.getByLabelText(/^current password/i), values.current);
  if (values.next) await user.type(screen.getByLabelText(/^new password/i), values.next);
  if (values.confirm) await user.type(screen.getByLabelText(/^confirm new password/i), values.confirm);
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("PasswordTab", () => {
  it("is a plain form with no view/edit toggle", () => {
    renderTab();
    expect(screen.queryByRole("button", { name: /change password/i })).toBeNull();
    expect(screen.getByRole("button", { name: /update password/i })).toBeEnabled();
    expect(screen.getByLabelText(/^current password/i)).not.toHaveAttribute("readonly");
  });

  it("names each empty field inline instead of sending the request", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    renderTab();

    await user.click(screen.getByRole("button", { name: /update password/i }));

    expect(screen.getByText("Enter your current password.")).toBeInTheDocument();
    expect(screen.getByText("Enter a new password.")).toBeInTheDocument();
    expect(screen.getByText("Type the new password again.")).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("reveals a password when its eye button is pressed", async () => {
    const user = userEvent.setup();
    renderTab();
    const field = screen.getByLabelText(/^new password/i);
    expect(field).toHaveAttribute("type", "password");

    await user.click(screen.getByRole("button", { name: /show new password/i }));

    expect(field).toHaveAttribute("type", "text");
    expect(screen.getByRole("button", { name: /hide new password/i })).toBeInTheDocument();
  });

  it("shows the strength meter and checklist as the new password is typed", async () => {
    const user = userEvent.setup();
    renderTab();
    expect(screen.queryByText(/strength/i)).toBeNull();

    await fillForm(user, { next: "abcdef" });
    expect(screen.getByText("Weak")).toBeInTheDocument();

    await user.type(screen.getByLabelText(/^new password/i), "G1");
    expect(screen.getByText("Strong")).toBeInTheDocument();
  });

  it("sends only the current and new password, then clears the form and confirms", async () => {
    const fetchMock = vi.fn(async () => respond({ success: true, message: "Password changed successfully" }));
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    renderTab();

    await fillForm(user, { current: "old-pass", next: "new-pass1", confirm: "new-pass1" });
    await user.click(screen.getByRole("button", { name: /update password/i }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const [url, init] = fetchMock.mock.calls[0] as unknown as [RequestInfo | URL, RequestInit];
    const request = url instanceof Request ? url : new Request(String(url), init);
    expect(request.method).toBe("PUT");
    expect(request.url).toMatch(/\/api\/auth\/change-password$/);
    expect(await request.json()).toEqual({ currentPassword: "old-pass", newPassword: "new-pass1" });

    await waitFor(() => expect(screen.getByLabelText(/^current password/i)).toHaveValue(""));
    expect(screen.getByText(/password updated/i)).toBeInTheDocument();
  });

  it("puts a wrong current password under that field rather than in a toast", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => respond({ success: false, message: "Current password is incorrect" }, 400)),
    );
    const user = userEvent.setup();
    renderTab();

    await fillForm(user, { current: "wrong", next: "new-pass1", confirm: "new-pass1" });
    await user.click(screen.getByRole("button", { name: /update password/i }));

    expect(await screen.findByText("That is not your current password.")).toBeInTheDocument();
    expect(screen.getByLabelText(/^current password/i)).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByLabelText(/^new password/i)).toHaveValue("new-pass1");
  });

  it("hands Sign Out All to the page", async () => {
    const user = userEvent.setup();
    const { onSignOutAll } = renderTab();
    await user.click(screen.getByRole("button", { name: /sign out all/i }));
    expect(onSignOutAll).toHaveBeenCalledTimes(1);
  });
});
