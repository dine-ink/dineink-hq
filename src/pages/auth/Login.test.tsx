import { describe, expect, it, vi } from "vitest";
import { Provider } from "react-redux";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import userEvent from "@testing-library/user-event";
import { render, screen, waitFor } from "@testing-library/react";
import Login from "./Login";
import { makeTestStore } from "../../test/test-utils";

function renderLogin() {
  const store = makeTestStore();
  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={["/login"]}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<div>Dashboard Loaded</div>} />
        </Routes>
      </MemoryRouter>
    </Provider>,
  );
  return { store };
}

describe("Login page", () => {
  it("renders the sign-in form", () => {
    renderLogin();
    expect(screen.getByText("Sign In")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Enter email or phone")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Enter password")).toBeInTheDocument();
  });

  it("on successful login, stores auth in Redux and navigates to /dashboard", async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        json: () =>
          Promise.resolve({
            success: true,
            user: { id: 1, name: "Owner", restaurantId: 10 },
            token: "test-jwt-token",
            restaurant: { id: 10, name: "Test Restaurant" },
            branches: [{ id: 20, name: "Main Branch" }],
          }),
      }),
    );

    const { store } = renderLogin();

    await user.type(screen.getByPlaceholderText("Enter email or phone"), "owner@test.com");
    await user.type(screen.getByPlaceholderText("Enter password"), "password123");
    await user.click(screen.getByRole("button", { name: /Access Dashboard/i }));

    await waitFor(() => expect(screen.getByText("Dashboard Loaded")).toBeInTheDocument());

    expect(store.getState().auth.token).toBe("test-jwt-token");
    expect(store.getState().auth.user).toEqual({ id: 1, name: "Owner", restaurantId: 10 });
    expect(store.getState().branch.branches).toEqual([{ id: 20, name: "Main Branch" }]);
  });

  it("on failed login, shows an error and does not navigate away or store auth", async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        json: () => Promise.resolve({ success: false, message: "Invalid credentials" }),
      }),
    );

    const { store } = renderLogin();

    await user.type(screen.getByPlaceholderText("Enter email or phone"), "owner@test.com");
    await user.type(screen.getByPlaceholderText("Enter password"), "wrong-password");
    await user.click(screen.getByRole("button", { name: /Access Dashboard/i }));

    // The message is rendered next to the form rather than thrown at an
    // alert(), so it survives a screenshot and a screen reader announces it.
    const alertBox = await screen.findByRole("alert");
    expect(alertBox).toHaveTextContent("Invalid credentials");

    // An ordinary rejection offers no reset link — that prompt is reserved for
    // a locked account, where retrying genuinely cannot work.
    expect(screen.queryByRole("link", { name: /Reset your password/i })).toBeNull();

    expect(screen.getByText("Sign In")).toBeInTheDocument();
    expect(store.getState().auth.token).toBeNull();
  });

  it("on a locked account, surfaces the lockout message with a way to reset", async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        // What the API returns after 20 failed attempts inside an hour: a 429
        // carrying ACCOUNT_LOCKED. The password will not work again until the
        // account has been reset via email, so the banner has to say so.
        json: () =>
          Promise.resolve({
            success: false,
            code: "ACCOUNT_LOCKED",
            message:
              "Too many failed sign-in attempts. For your security this account is locked — " +
              "reset your password using the code we email you, then sign in again.",
          }),
      }),
    );

    const { store } = renderLogin();

    await user.type(screen.getByPlaceholderText("Enter email or phone"), "owner@test.com");
    await user.type(screen.getByPlaceholderText("Enter password"), "wrong-password");
    await user.click(screen.getByRole("button", { name: /Access Dashboard/i }));

    const alertBox = await screen.findByRole("alert");
    expect(alertBox).toHaveTextContent(/this account is locked/i);

    const resetLink = screen.getByRole("link", { name: /Reset your password/i });
    expect(resetLink).toHaveAttribute("href", "/forgot-password");

    expect(store.getState().auth.token).toBeNull();
  });
});
