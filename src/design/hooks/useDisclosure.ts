import { useCallback, useState } from "react";

export interface Disclosure {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
}

// The open/close boolean + three callbacks pattern duplicated as
// `useState(false)` + inline arrow functions everywhere a dialog, dropdown,
// or drawer is toggled. One hook, stable callback identities (safe to pass
// directly as an onClick handler without an inline arrow function).
export function useDisclosure(initialOpen = false): Disclosure {
  const [isOpen, setIsOpen] = useState(initialOpen);
  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((v) => !v), []);
  return { isOpen, open, close, toggle };
}

export default useDisclosure;
