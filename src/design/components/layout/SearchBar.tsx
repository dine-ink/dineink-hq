import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import type { InputHTMLAttributes } from "react";

export interface SearchBarProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  containerClassName?: string;
}

// The search-input-with-icon pattern duplicated across Bills, Customers,
// and most other list pages (each with its own slightly different
// focus-ring color) — one component, focus ring now sourced from the
// primary brand token.
export function SearchBar({ containerClassName = "", className = "", ...rest }: SearchBarProps) {
  return (
    <div className={`relative ${containerClassName}`}>
      <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" aria-hidden="true" />
      <input
        type="search"
        className={`h-9 w-full rounded-button border border-gray-200 bg-white pl-8 pr-3 text-[12px] outline-none transition focus:border-primary-400 focus:ring-2 focus:ring-primary-100 lg:w-64 ${className}`}
        {...rest}
      />
    </div>
  );
}

export default SearchBar;
