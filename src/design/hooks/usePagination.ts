import { useMemo, useState } from "react";

/**
 * Client-side paging for a list that is already in memory, with a rows-per-page
 * the person chooses.
 *
 * The page is clamped rather than reset: a search that shrinks the list, or a
 * larger page size, lands on the last real page instead of an empty one.
 * Callers reset to page 1 themselves when a filter changes (see `setPage`),
 * since only they know which inputs count as a new search.
 */
export function usePagination<T>(rows: T[], initialPageSize = 10) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSizeState] = useState(initialPageSize);

  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const firstRow = (currentPage - 1) * pageSize;
  const pageRows = useMemo(() => rows.slice(firstRow, firstRow + pageSize), [rows, firstRow, pageSize]);

  /** Changing how many rows show starts again from the first page. */
  const setPageSize = (size: number) => {
    setPageSizeState(size);
    setPage(1);
  };

  return {
    page: currentPage,
    setPage,
    pageSize,
    setPageSize,
    totalPages,
    pageRows,
    /** 1-based bounds of the rows on screen, for "Showing 11-20 of 42". */
    from: rows.length === 0 ? 0 : firstRow + 1,
    to: firstRow + pageRows.length,
    total: rows.length,
  };
}

export default usePagination;
