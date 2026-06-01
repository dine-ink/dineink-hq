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

/** @deprecated Use useAppSelector(s => s.branch.selectedBranch) from Redux instead. */
export function getSelectedBranch() {
  try {
    const saved = localStorage.getItem("selectedBranch");
    if (saved && saved !== "undefined") return JSON.parse(saved);
  } catch {}
  return null;
}
