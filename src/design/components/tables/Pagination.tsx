import type { ReactNode } from "react";

export interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  /** e.g. "Showing 1-10 of 42 bills" — rendered to the left of the Previous/Next controls. Accepts JSX so counts can stay bold, as most existing usages already do. */
  summary?: ReactNode;
}

// The Previous/Next pager duplicated across Bills, Customers, and every
// other paginated list (identical markup, only the "of N items" copy
// differed). One component now.
export function Pagination({ page, totalPages, onPageChange, summary }: PaginationProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-surface-border px-4 py-3">
      {summary && <p className="text-[11px] text-gray-500">{summary}</p>}
      <nav className="flex items-center gap-1.5" aria-label="Pagination">
        <button
          type="button"
          disabled={page === 1}
          onClick={() => onPageChange(page - 1)}
          aria-label="Previous page"
          className="rounded-button border border-gray-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Previous
        </button>
        <div className="rounded-button border border-gray-200 bg-gray-100 px-3 py-1.5 text-[11px] font-bold text-gray-700" aria-current="page">
          {page} / {totalPages}
        </div>
        <button
          type="button"
          disabled={page === totalPages}
          onClick={() => onPageChange(page + 1)}
          aria-label="Next page"
          className="rounded-button border border-gray-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Next
        </button>
      </nav>
    </div>
  );
}

export default Pagination;
