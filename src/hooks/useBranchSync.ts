import { useEffect } from "react";

/**
 * Subscribes to the global "branchChanged" window event.
 * Call this in any page that needs to react when the user switches branches.
 * The callback should be stable (defined with useCallback, or the React
 * Compiler will handle it automatically).
 */
export function useBranchSync(onChange: () => void) {
  useEffect(() => {
    window.addEventListener("branchChanged", onChange);
    return () => window.removeEventListener("branchChanged", onChange);
  }, [onChange]);
}

/** Returns the currently selected branch from localStorage. */
export function getSelectedBranch() {
  const saved = localStorage.getItem("selectedBranch");
  if (saved) return JSON.parse(saved);
  const branches = JSON.parse(localStorage.getItem("branches") || "[]");
  return branches[0] ?? null;
}
