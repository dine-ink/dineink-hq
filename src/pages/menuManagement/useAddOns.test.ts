import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { Provider } from "react-redux";
import { useAddOns } from "./useAddOns";
import { authenticatedState, makeTestStore } from "@/test/test-utils";
import { notify } from "@/utils/notify";

vi.mock("@/utils/notify", () => ({ notify: vi.fn(), notifySuccess: vi.fn() }));

/**
 * Pressing Add with nothing typed used to return silently, which read as a
 * button that did not work. These pin the message that replaced the silence,
 * and that nothing is sent to the server in that case.
 */

const GROUPS = [{ id: 7, name: "Extra Toppings", options: [], menuItems: [] }];

const fetchMock = vi.fn(
  async (_input: RequestInfo | URL, _init?: RequestInit) =>
    new Response(JSON.stringify({ success: true, data: GROUPS }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }),
);

const render = () => {
  const store = makeTestStore(authenticatedState());
  const Wrapper = ({ children }: { children: ReactNode }) => createElement(Provider, { store, children });
  return renderHook(() => useAddOns(), { wrapper: Wrapper });
};

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockClear();
  vi.mocked(notify).mockClear();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("useAddOns validation", () => {
  it("asks for a group name when Add Group is triggered with the field empty", async () => {
    const hook = render();
    await act(() => hook.result.current.createGroup());
    expect(notify).toHaveBeenCalledWith("Enter a name for the add-on group first.", "warning");
    expect(fetchMock.mock.calls.filter(([, init]) => init?.method === "POST")).toHaveLength(0);
  });

  it("names both missing option fields and the group they are for", async () => {
    const hook = render();
    await vi.waitFor(() => expect(hook.result.current.addOnGroups).toHaveLength(1));
    await act(() => hook.result.current.addOption(7));
    expect(notify).toHaveBeenCalledWith(
      'Enter an option name and a price to add an option for "Extra Toppings".',
      "warning",
    );
  });

  it("names only the field that is missing", async () => {
    const hook = render();
    await vi.waitFor(() => expect(hook.result.current.addOnGroups).toHaveLength(1));
    act(() => hook.result.current.setNewOptionForm({ 7: { name: "Extra Cheese", price: "" } }));
    await act(() => hook.result.current.addOption(7));
    expect(notify).toHaveBeenCalledWith('Enter a price to add an option for "Extra Toppings".', "warning");
  });

  it("rejects a negative price", async () => {
    const hook = render();
    await vi.waitFor(() => expect(hook.result.current.addOnGroups).toHaveLength(1));
    act(() => hook.result.current.setNewOptionForm({ 7: { name: "Extra Cheese", price: "-5" } }));
    await act(() => hook.result.current.addOption(7));
    expect(notify).toHaveBeenCalledWith('The price for "Extra Toppings" must be a number of 0 or more.', "warning");
  });
});
