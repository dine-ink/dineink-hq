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
    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});
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

    await waitFor(() => expect(alertSpy).toHaveBeenCalledWith("Invalid credentials"));

    expect(screen.getByText("Sign In")).toBeInTheDocument();
    expect(store.getState().auth.token).toBeNull();
  });
});
