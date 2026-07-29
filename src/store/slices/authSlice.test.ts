import { describe, expect, it } from "vitest";
import authReducer, { clearAuth, setAuth, updateUser } from "./authSlice";

describe("authSlice", () => {
  it("setAuth stores user/token/restaurant and persists them to localStorage", () => {
    const state = authReducer(
      { user: null, token: null, restaurant: null },
      setAuth({
        user: { id: 1, name: "Owner" },
        token: "abc123",
        restaurant: { id: 10, name: "Test Restaurant" },
        branches: [{ id: 20, name: "Branch A" }],
      }),
    );

    expect(state.user).toEqual({ id: 1, name: "Owner" });
    expect(state.token).toBe("abc123");
    expect(state.restaurant).toEqual({ id: 10, name: "Test Restaurant" });
    expect(JSON.parse(localStorage.getItem("user")!)).toEqual({ id: 1, name: "Owner" });
    expect(localStorage.getItem("token")).toBe("abc123");
    expect(JSON.parse(localStorage.getItem("branches")!)).toEqual([{ id: 20, name: "Branch A" }]);
  });

  it("setAuth without branches leaves any existing branches entry untouched", () => {
    localStorage.setItem("branches", JSON.stringify([{ id: 99, name: "Old Branch" }]));
    authReducer(
      { user: null, token: null, restaurant: null },
      setAuth({ user: { id: 1 }, token: "abc", restaurant: { id: 10 } }),
    );
    expect(JSON.parse(localStorage.getItem("branches")!)).toEqual([{ id: 99, name: "Old Branch" }]);
  });

  it("clearAuth resets state and clears every auth-related localStorage key", () => {
    localStorage.setItem("user", "{}");
    localStorage.setItem("token", "abc");
    localStorage.setItem("restaurant", "{}");
    localStorage.setItem("branches", "[]");
    localStorage.setItem("selectedBranch", "{}");

    const state = authReducer(
      { user: { id: 1 }, token: "abc", restaurant: { id: 10 } },
      clearAuth(),
    );

    expect(state).toEqual({ user: null, token: null, restaurant: null });
    expect(localStorage.getItem("user")).toBeNull();
    expect(localStorage.getItem("token")).toBeNull();
    expect(localStorage.getItem("restaurant")).toBeNull();
    expect(localStorage.getItem("branches")).toBeNull();
    expect(localStorage.getItem("selectedBranch")).toBeNull();
  });

  it("updateUser merges partial fields into the existing user and persists the merged result", () => {
    const state = authReducer(
      { user: { id: 1, name: "Owner", email: "old@test.com" }, token: "abc", restaurant: null },
      updateUser({ email: "new@test.com" }),
    );
    expect(state.user).toEqual({ id: 1, name: "Owner", email: "new@test.com" });
    expect(JSON.parse(localStorage.getItem("user")!)).toEqual(state.user);
  });
});
