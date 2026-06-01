import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface Branch {
  id: number;
  name: string;
  city?: string;
  state?: string;
  [key: string]: any;
}

interface BranchState {
  branches: Branch[];
  selectedBranch: Branch | null;
}

const loadFromStorage = (): BranchState => {
  try {
    const branches = JSON.parse(localStorage.getItem("branches") || "[]");
    const selected = JSON.parse(localStorage.getItem("selectedBranch") || "null");
    return {
      branches,
      selectedBranch: selected || branches[0] || null,
    };
  } catch {
    return { branches: [], selectedBranch: null };
  }
};

const branchSlice = createSlice({
  name: "branch",
  initialState: loadFromStorage(),
  reducers: {
    setBranches(state, action: PayloadAction<Branch[]>) {
      state.branches = action.payload;
      localStorage.setItem("branches", JSON.stringify(action.payload));
      if (!state.selectedBranch && action.payload.length > 0) {
        state.selectedBranch = action.payload[0];
        localStorage.setItem("selectedBranch", JSON.stringify(action.payload[0]));
      }
    },
    setSelectedBranch(state, action: PayloadAction<Branch>) {
      state.selectedBranch = action.payload;
      localStorage.setItem("selectedBranch", JSON.stringify(action.payload));
      // Dispatch the legacy event so any non-migrated pages still react
      window.dispatchEvent(new Event("branchChanged"));
    },
  },
});

export const { setBranches, setSelectedBranch } = branchSlice.actions;
export default branchSlice.reducer;
