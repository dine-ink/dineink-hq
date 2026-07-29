import { useEffect, useState } from "react";
import { breakpoints } from "../tokens/breakpoints";

// Matches jsdom's lack of window.matchMedia in the test environment (see
// src/test/setupTests.ts's stub) gracefully by defaulting to `false` until
// a real matchMedia is available.
function getMatch(query: string): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
  return window.matchMedia(query).matches;
}

// A generic media-query hook — reach for the named breakpoint hooks below
// in components; this is the shared implementation they're built on.
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => getMatch(query));

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    const mql = window.matchMedia(query);
    const listener = () => setMatches(mql.matches);
    listener();
    mql.addEventListener("change", listener);
    return () => mql.removeEventListener("change", listener);
  }, [query]);

  return matches;
}

// Named breakpoint hooks driven by the same tokens Tailwind's responsive
// prefixes use (src/design/tokens/breakpoints.ts) — for the handful of
// cases where a layout decision can't be expressed as a Tailwind
// `lg:`/`xl:` class alone (e.g. choosing between two entirely different
// components, not just different classes on one).
export const useIsTablet = () => useMediaQuery(`(min-width: ${breakpoints.tablet})`);
export const useIsLaptop = () => useMediaQuery(`(min-width: ${breakpoints.laptop})`);
export const useIsDesktop = () => useMediaQuery(`(min-width: ${breakpoints.desktop})`);
export const useIsMobile = () => !useIsTablet();

export default useMediaQuery;
