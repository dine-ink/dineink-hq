import { describe, expect, it } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { usePagination } from "./usePagination";

const rows = Array.from({ length: 23 }, (_, i) => i + 1);

describe("usePagination", () => {
  it("shows the first page at the initial size and reports the range", () => {
    const { result } = renderHook(() => usePagination(rows, 10));
    expect(result.current.pageRows).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(result.current.totalPages).toBe(3);
    expect([result.current.from, result.current.to, result.current.total]).toEqual([1, 10, 23]);
  });

  it("moves between pages and shows the short last page", () => {
    const { result } = renderHook(() => usePagination(rows, 10));
    act(() => result.current.setPage(3));
    expect(result.current.pageRows).toEqual([21, 22, 23]);
    expect([result.current.from, result.current.to]).toEqual([21, 23]);
  });

  it("goes back to the first page when the page size changes", () => {
    const { result } = renderHook(() => usePagination(rows, 5));
    act(() => result.current.setPage(4));
    act(() => result.current.setPageSize(25));
    expect(result.current.page).toBe(1);
    expect(result.current.pageRows).toHaveLength(23);
    expect(result.current.totalPages).toBe(1);
  });

  it("clamps to the last real page when the list shrinks under it", () => {
    let data = rows;
    const { result, rerender } = renderHook(() => usePagination(data, 10));
    act(() => result.current.setPage(3));
    data = rows.slice(0, 12);
    rerender();
    expect(result.current.page).toBe(2);
    expect(result.current.pageRows).toEqual([11, 12]);
  });

  it("is a single empty page for an empty list, never 1 of 0", () => {
    const { result } = renderHook(() => usePagination([] as number[], 10));
    expect(result.current.totalPages).toBe(1);
    expect(result.current.page).toBe(1);
    expect([result.current.from, result.current.to, result.current.total]).toEqual([0, 0, 0]);
  });
});
