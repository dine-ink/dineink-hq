import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface AuthState {
  user: any | null;
  token: string | null;
  restaurant: any | null;
}

const loadFromStorage = (): AuthState => {
  const user = (() => { try { return JSON.parse(localStorage.getItem("user") || "null"); } catch { return null; } })();
  const token = localStorage.getItem("token");
  const restaurant = (() => { try { return JSON.parse(localStorage.getItem("restaurant") || "null"); } catch { return null; } })();

  // Check if JWT is expired before restoring
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        // Token expired — don't restore auth state
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        return { user: null, token: null, restaurant: null };
      }
    } catch {
      // Invalid token format — clear it
      localStorage.removeItem("token");
      return { user: null, token: null, restaurant: null };
    }
  }

  return { user, token, restaurant };
};

const authSlice = createSlice({
  name: "auth",
  initialState: loadFromStorage(),
  reducers: {
    setAuth(state, action: PayloadAction<{ user: any; token: string; restaurant: any; branches?: any[] }>) {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.restaurant = action.payload.restaurant;
      localStorage.setItem("user", JSON.stringify(action.payload.user));
      localStorage.setItem("token", action.payload.token);
      localStorage.setItem("restaurant", JSON.stringify(action.payload.restaurant));
      if (action.payload.branches) {
        localStorage.setItem("branches", JSON.stringify(action.payload.branches));
      }
    },
    clearAuth(state) {
      state.user = null;
      state.token = null;
      state.restaurant = null;
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      localStorage.removeItem("restaurant");
      localStorage.removeItem("branches");
      localStorage.removeItem("selectedBranch");
    },
    updateUser(state, action: PayloadAction<any>) {
      state.user = { ...state.user, ...action.payload };
      localStorage.setItem("user", JSON.stringify(state.user));
    },
  },
});

export const { setAuth, clearAuth, updateUser } = authSlice.actions;
export default authSlice.reducer;
