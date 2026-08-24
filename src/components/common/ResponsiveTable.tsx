import type { ReactNode } from "react";

/**
 * One column definition, shared by both renderings.
 *
 * A wide table is unreadable on a phone even when it scrolls — you lose the
 * row you were reading the moment you swipe sideways. So this renders a normal
 * table from `md` up, and below that turns every row into its own card with
 * the columns as label/value pairs. No horizontal scrolling on a phone.
 */
export type ResponsiveColumn<T> = {
  /** Table heading, and the field label on the mobile card. */
  header: string;
  render: (row: T, index: number) => ReactNode;
  /**
   * Marks the column that identifies the row (a name, an invoice number).
   * On mobile it becomes the card's heading rather than a label/value pair.
   * Falls back to the first column when no column sets it.
   */
  primary?: boolean;
  /** Shown top-right of the mobile card — good for a status or segment badge. */
  badge?: boolean;
  /** Pinned to the bottom of the mobile card, full width — e.g. an action button. */
  footer?: boolean;
  /** Kept in the table, dropped from the mobile card. */
  hideOnMobile?: boolean;
  align?: "left" | "right";
};

type Props<T> = {
  columns: ResponsiveColumn<T>[];
  data: T[];
  rowKey: (row: T, index: number) => string | number;
  /** Floor width for the table so columns scroll rather than squash at md. */
  minWidth?: string;
  emptyMessage?: string;
  /** Extra classes for the table's <thead>. */
  headClassName?: string;
  onRowClick?: (row: T) => void;
};

export default function ResponsiveTable<T>({
  columns,
  data,
  rowKey,
  minWidth = "36rem",
  emptyMessage = "No data available",
  headClassName = "bg-gray-50",
  onRowClick,
}: Props<T>) {
  const primaryIndex = Math.max(
    0,
    columns.findIndex((c) => c.primary),
  );
  const cardFields = columns.filter(
    (c, i) => i !== primaryIndex && !c.hideOnMobile && !c.badge && !c.footer,
  );
  const badgeColumn = columns.find((c) => c.badge);
  const footerColumns = columns.filter((c) => c.footer);

  if (!data.length) {
    return (
      <div className="py-12 text-center">
        <p className="text-[12px] font-semibold text-gray-500">
          {emptyMessage}
        </p>
      </div>
    );
  }

  return (
    <>
      {/* ── Table, md and up ─────────────────────────────── */}
      <div className="hidden overflow-x-auto md:block">
        {/* `w-full` fills the container; the inline min-width is the floor that
            forces a scroll rather than squashed columns. It must not be
            `min-w-full` — an inline minWidth would override that class and the
            table would shrink to its content instead of filling the page. */}
        <table className="w-full text-[12px]" style={{ minWidth }}>
          <thead className={headClassName}>
            <tr className="border-b border-gray-100">
              {columns.map((col) => (
                <th
                  key={col.header}
                  className={`px-4 py-2 text-[9px] font-bold tracking-[0.16em] text-gray-400 uppercase ${
                    col.align === "right" ? "text-right" : "text-left"
                  }`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => (
              <tr
                key={rowKey(row, index)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={`border-b border-gray-100 transition-all hover:bg-gray-50/60 ${
                  onRowClick ? "cursor-pointer" : ""
                }`}
              >
                {columns.map((col) => (
                  <td
                    key={col.header}
                    className={`px-4 py-2.5 ${
                      col.align === "right" ? "text-right" : "text-left"
                    }`}
                  >
                    {col.render(row, index)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Cards, below md ──────────────────────────────── */}
      <div className="space-y-2 md:hidden">
        {data.map((row, index) => (
          <div
            key={rowKey(row, index)}
            onClick={onRowClick ? () => onRowClick(row) : undefined}
            className={`rounded-xl border border-gray-100 bg-white p-3 shadow-sm ${
              onRowClick ? "cursor-pointer active:bg-gray-50" : ""
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1 text-[12px]">
                {columns[primaryIndex]?.render(row, index)}
              </div>
              {badgeColumn && (
                <div className="shrink-0 text-[11px]">
                  {badgeColumn.render(row, index)}
                </div>
              )}
            </div>

            {cardFields.length > 0 && (
              <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 border-t border-gray-50 pt-3">
                {cardFields.map((col) => (
                  <div key={col.header} className="min-w-0">
                    <dt className="text-[9px] font-bold tracking-[0.14em] text-gray-400 uppercase">
                      {col.header}
                    </dt>
                    <dd className="mt-0.5 truncate text-[12px] text-gray-700">
                      {col.render(row, index)}
                    </dd>
                  </div>
                ))}
              </dl>
            )}

            {footerColumns.length > 0 && (
              <div className="mt-3 flex items-center gap-2 border-t border-gray-50 pt-3">
                {footerColumns.map((col) => (
                  <div key={col.header} className="flex-1">
                    {col.render(row, index)}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
