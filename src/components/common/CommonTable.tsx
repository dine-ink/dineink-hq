import React from "react";

type Column = {
  header: string;
  key: string;
  render?: (
    row: any,
    index: number,
  ) => React.ReactNode;
};

type Props = {
  title: string;
  subtitle?: string;
  columns: Column[];
  data: any[];
  page?: number;
  totalPages?: number;
  headerAction?: React.ReactNode;
  onPageChange?: (
    page: number,
  ) => void;
};

export default function CommonTable({
  title,
  subtitle,
  columns,
  data,
  page = 1,
  totalPages = 1,
  onPageChange,
  headerAction,
}: Props) {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      {/* HEADER */}
      <div className="shrink-0 border-b border-gray-200 bg-white p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {title}
            </h3>
            {subtitle && (
              <p className="text-sm text-gray-500">
                {subtitle}
              </p>
            )}
          </div>
          {headerAction}
        </div>
      </div>
      {/* TABLE HEADER */}
      <div className="shrink-0 border-b border-gray-200 bg-white px-6 py-4">
        <h2 className="text-base font-semibold text-gray-900">
          {title} List
        </h2>
      </div>
      {/* SCROLLABLE TABLE */}
      <div className="min-h-0 flex-1 overflow-auto">
        <table className="min-w-full text-left whitespace-nowrap">
          {/* STICKY HEADER */}
          <thead className="sticky top-0 z-10 border-b border-gray-200 bg-white text-sm text-gray-900">
            <tr>
              {columns.map(
                (col, i) => (
                  <th
                    key={i}
                    className={`py-3 ${
                      i === 0
                        ? "pl-6 pr-8"
                        : "pr-8"
                    } font-semibold`}
                  >
                    {col.header}
                  </th>
                ),
              )}
            </tr>
          </thead>
          {/* BODY */}
          <tbody className="divide-y divide-gray-100 bg-white">
            {data?.length ? (
              data.map(
                (row, idx) => (
                  <tr
                    key={idx}
                    className="transition hover:bg-gray-50"
                  >
                    {columns.map(
                      (
                        col,
                        i,
                      ) => (
                        <td
                          key={i}
                          className={`py-4 ${
                            i === 0
                              ? "pl-6 pr-8 font-medium text-gray-900"
                              : "pr-8 text-gray-500"
                          }`}
                        >
                          {col.render
                            ? col.render(
                                row,
                                idx,
                              )
                            : row[
                                col.key
                              ] ?? "-"}
                        </td>
                      ),
                    )}
                  </tr>
                ),
              )
            ) : (
              <tr>
                <td
                  colSpan={
                    columns.length
                  }
                  className="py-10 text-center text-gray-500"
                >
                  No data available
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {/* PAGINATION */}
      <div className="flex items-center justify-between border-t border-gray-200 bg-white px-6 py-4">
        <p className="text-sm text-gray-500">
          Page {page} of {Math.max(totalPages, 1)}
        </p>
        <div className="flex gap-2">
          <button
            disabled={page === 1}
            onClick={() =>
              onPageChange?.(
                page - 1,
              )
            }
            className="rounded-lg border border-gray-200 bg-white px-3 py-1 text-sm font-medium transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Prev
          </button>
          <button
            disabled={
              page === totalPages ||
              totalPages === 0
            }
            onClick={() =>
              onPageChange?.(
                page + 1,
              )
            }
            className="rounded-lg border border-gray-200 bg-white px-3 py-1 text-sm font-medium transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}