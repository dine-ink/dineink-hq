import type { ReactElement, ReactNode } from "react";
import { combineReducers, configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import { render, RenderOptions } from "@testing-library/react";
import authReducer from "@/store/slices/authSlice";
import branchReducer from "@/store/slices/branchSlice";
import dateRangeReducer from "@/store/slices/dateRangeSlice";
import { api } from "@/store/api/apiSlice";
import { ToastProvider } from "@/design/components/feedback";
import { ConfirmProvider } from "@/design/components/dialogs";

// Mirrors src/store/index.ts's shape so components using useAppSelector
// work unmodified under test, without pulling in the real store singleton
// (which reads from localStorage at import time). The RTK Query reducer and
// middleware are included for the same reason — pages using generated query
// hooks throw without them.
const rootReducer = combineReducers({
  auth: authReducer,
  branch: branchReducer,
  dateRange: dateRangeReducer,
  [api.reducerPath]: api.reducer,
});
type TestRootState = ReturnType<typeof rootReducer>;

export function makeTestStore(preloadedState?: Partial<TestRootState>) {
  return configureStore({
    reducer: rootReducer,
    preloadedState,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(api.middleware),
  });
}

export const mockUser = { id: 1, restaurantId: 10, name: "Test Owner", role: "OWNER" };
export const mockBranch = { id: 20, name: "Test Branch" };

// The state most page components expect once "logged in" with a branch
// selected — pass overrides for the handful of tests that need a
// logged-out or no-branch state instead.
export function authenticatedState(overrides?: Partial<TestRootState>): Partial<TestRootState> {
  return {
    auth: { user: mockUser, token: "test-token", restaurant: { id: 10, name: "Test Restaurant" } },
    branch: { branches: [mockBranch], selectedBranch: mockBranch },
    dateRange: { preset: "week", from: "2026-01-01", to: "2026-01-07" },
    ...overrides,
  } as Partial<TestRootState>;
}

interface CustomRenderOptions extends Omit<RenderOptions, "wrapper"> {
  preloadedState?: Partial<TestRootState>;
  route?: string;
}

// Renders with the same Redux + Router context every real page expects.
// Tests that need bespoke state should pass `preloadedState` (see
// authenticatedState() above for the common "logged in" shape).
export function renderWithProviders(
  ui: ReactElement,
  { preloadedState, route = "/", ...renderOptions }: CustomRenderOptions = {},
) {
  const store = makeTestStore(preloadedState);
  // Both providers are mounted here for the same reason main.tsx mounts them:
  // the app's notify() and confirmAction() calls need a sink. Without them a
  // converted alert() falls through to a console warning and asserts on
  // nothing, and a converted confirm() resolves false — so a delete under test
  // would silently decline itself.
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <Provider store={store}>
        <ToastProvider>
          <ConfirmProvider>
            <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>
          </ConfirmProvider>
        </ToastProvider>
      </Provider>
    );
  }
  return { store, ...render(ui, { wrapper: Wrapper, ...renderOptions }) };
}

/**
 * Two helpers for mocking fetch, worth having in one place because getting
 * either wrong fails silently.
 *
 * `requestUrl` exists because RTK Query hands fetch a `Request` object rather
 * than a URL string. A mock that does `String(input)` on one gets
 * "[object Request]", matches none of its own URL branches, and falls through
 * to whatever the default is — so the page renders its empty state and the test
 * passes while proving nothing. That happened here.
 *
 * `jsonResponse` returns a real Response rather than a `{ json }` stand-in,
 * because fetchBaseQuery calls response.clone() and reads its headers. A plain
 * object makes every query reject, which again looks exactly like "no data".
 */
export const requestUrl = (input: RequestInfo | URL): string =>
  String(input instanceof Request ? input.url : input);

export const jsonResponse = (body: unknown, status = 200): Promise<Response> =>
  Promise.resolve(
    new Response(JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json" },
    }),
  );

/**
 * A wrapper for renderHook, for hooks that read the store or use a query hook.
 *
 * renderWithProviders covers components; this is the same providers without a
 * component to hang them on.
 */
export function hookWrapper(preloadedState?: Partial<TestRootState>) {
  const store = makeTestStore(preloadedState);
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <Provider store={store}>
      <ToastProvider>
        <ConfirmProvider>
          <MemoryRouter>{children}</MemoryRouter>
        </ConfirmProvider>
      </ToastProvider>
    </Provider>
  );
  return { store, Wrapper };
}

export * from "@testing-library/react";
