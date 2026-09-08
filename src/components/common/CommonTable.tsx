import React from "react";
import MobileTableCards from "@/components/common/MobileTableCards";
import { Pagination } from "@/design/components/tables";

type Column = {
  header: string;
  key: string;
  render?: (row: any, index: number) => React.ReactNode;
};

type Props = {
  title: string;
  subtitle?: string;
  columns: Column[];
  data: any[];
  page?: number;
  totalPages?: number;
  headerAction?: React.ReactNode;
  onPageChange?: (page: number) => void;
  /** With onPageSizeChange, shows the rows-per-page selector. */
  pageSize?: number;
  onPageSizeChange?: (size: number) => void;
  /** Total rows across all pages, for "Showing 1-6 of 40 tables". */
  totalRows?: number;
  rowNoun?: string;
  compact?: boolean;
};

export default function CommonTable({
  title,
  subtitle,
  columns,
  data,
  page = 1,
  totalPages = 1,
  onPageChange,
  pageSize,
  onPageSizeChange,
  totalRows,
  rowNoun = "rows",
  headerAction,
}: Props) {
  const from = totalRows === undefined || data.length === 0 ? 0 : (page - 1) * (pageSize ?? data.length) + 1;
  const range = totalRows === undefined ? undefined : { from, to: from + data.length - 1, total: totalRows, noun: rowNoun };
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm transition-all duration-200 hover:shadow-md">
      {/* HEADER */}
      <div className="shrink-0 border-b border-gray-100 bg-white px-4 py-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-[14px] font-semibold text-gray-900">{title}</h3>
            {subtitle && (
              <p className="mt-0.5 text-[11px] text-gray-500">{subtitle}</p>
            )}
          </div>
          {headerAction}
        </div>
      </div>

      {/* TABLE */}
      <div className="min-h-0 flex-1 overflow-auto">
        <MobileTableCards>
        <table className="min-w-full text-left whitespace-nowrap">
          {/* HEADER */}
          <thead className="sticky top-0 z-10 border-b border-gray-100 bg-gray-50/90 backdrop-blur">
            <tr>
              {columns.map((col, i) => (
                <th
                  key={i}
                  className={`py-2.5 text-[10px] font-semibold uppercase tracking-wide text-gray-400 ${
                    i === 0 ? "pl-4 pr-5" : "pr-5"
                  }`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>

          {/* BODY */}
          <tbody className="divide-y divide-gray-50 bg-white">
            {data?.length ? (
              data.map((row, idx) => (
                <tr
                  key={idx}
                  className="transition-colors hover:bg-gray-50/80"
                >
                  {columns.map((col, i) => (
                    <td
                      key={i}
                      className={`py-2.5 ${
                        i === 0
                          ? "pl-4 pr-5 font-medium text-gray-900"
                          : "pr-5 text-gray-600"
                      }`}
                    >
                      <div className="text-[11px]">
                        {col.render
                          ? col.render(row, idx)
                          : (row[col.key] ?? "-")}
                      </div>
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="py-12 text-center">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-50">
                      <svg
                        className="h-5 w-5 text-gray-300"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                    </div>
                    <p className="text-[12px] font-semibold text-gray-500">
                      No data available
                    </p>
                    <p className="text-[11px] text-gray-400">
                      Records will appear here once available
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
        </MobileTableCards>
      </div>

      {/* PAGINATION */}
      <Pagination
        page={page}
        totalPages={Math.max(totalPages, 1)}
        onPageChange={(p) => onPageChange?.(p)}
        pageSize={pageSize}
        onPageSizeChange={onPageSizeChange}
        range={range}
      />
    </div>
  );
}
