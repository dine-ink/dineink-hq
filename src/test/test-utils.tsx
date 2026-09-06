import type { ReactElement, ReactNode } from "react";
import { combineReducers, configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import { render, RenderOptions } from "@testing-library/react";
import authReducer from "@/store/slices/authSlice";
import branchReducer from "@/store/slices/branchSlice";
import dateRangeReducer from "@/store/slices/dateRangeSlice";
import { api } from "@/store/api/apiSlice";

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
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <Provider store={store}>
        <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>
      </Provider>
    );
  }
  return { store, ...render(ui, { wrapper: Wrapper, ...renderOptions }) };
}

export * from "@testing-library/react";
