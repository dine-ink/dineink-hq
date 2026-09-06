import type { ReactNode } from "react";
import { Table, TableHead, Th, TableBody, TableRow, Td, TableContainer } from "./Table";
import { LoadingSkeleton } from "@/design/components/feedback/LoadingSkeleton";
import { EmptyState, ErrorState } from "@/design/components/feedback/EmptyState";

export interface DataTableColumn<T> {
  key: string;
  header: ReactNode;
  render: (row: T) => ReactNode;
  className?: string;
  headerClassName?: string;
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string | number;
  loading?: boolean;
  error?: boolean;
  onRetry?: () => void;
  emptyTitle?: string;
  emptyDescription?: string;
  onRowClick?: (row: T) => void;
  selectedRowKey?: string | number;
}

// A generic, column-driven table for straightforward tabular data — built
// on the same primitives above, with loading/error/empty states handled
// consistently out of the box. For tables with more bespoke per-row
// rendering (expandable rows, nested detail panels), compose the
// primitives directly instead of forcing them through this generic
// wrapper.
export function DataTable<T>({
  columns,
  rows,
  rowKey,
  loading = false,
  error = false,
  onRetry,
  emptyTitle = "No data found",
  emptyDescription,
  onRowClick,
  selectedRowKey,
}: DataTableProps<T>) {
  if (loading) {
    return (
      <div className="p-4">
        <LoadingSkeleton rows={5} />
      </div>
    );
  }

  if (error) {
    return <ErrorState title="Something went wrong" description="Failed to load this data." onRetry={onRetry} className="m-4" />;
  }

  if (rows.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} className="m-4" />;
  }

  return (
    <TableContainer>
      <Table>
        <TableHead>
          {columns.map((col) => (
            <Th key={col.key} className={col.headerClassName}>
              {col.header}
            </Th>
          ))}
        </TableHead>
        <TableBody>
          {rows.map((row) => {
            const key = rowKey(row);
            return (
              <TableRow
                key={key}
                clickable={!!onRowClick}
                selected={selectedRowKey === key}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
              >
                {columns.map((col) => (
                  <Td key={col.key} className={col.className}>
                    {col.render(row)}
                  </Td>
                ))}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export default DataTable;
