import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";

/**
 * Opens the tab named in the URL's `?tab=` on pages that keep their active tab
 * in local state.
 *
 * The Getting Started guide sends people to a specific tab — Insights Setup,
 * Item Mapping, the UPI tab — and a link that lands on the default tab with
 * the instruction "now switch to Insights Setup" is a worse tutorial than one
 * that just opens it. Pages keep their `useState` for the tab exactly as they
 * are; this only nudges it when the parameter is present and names a real tab,
 * and again if the parameter changes while the page stays mounted.
 */
export function useTabFromQuery<T extends string>(
  tabs: readonly T[],
  onTab: (tab: T) => void,
) {
  const [params] = useSearchParams();
  const wanted = params.get("tab");
  useEffect(() => {
    if (wanted && (tabs as readonly string[]).includes(wanted)) onTab(wanted as T);
  }, [wanted, tabs, onTab]);
}

export default useTabFromQuery;
