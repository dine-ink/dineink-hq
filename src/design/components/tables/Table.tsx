import type { HTMLAttributes, ReactNode, ThHTMLAttributes, TdHTMLAttributes } from "react";

// Composable table primitives matching the exact markup already duplicated
// across Bills, Customers, and most other list pages (thead bg-gray-50,
// header cells uppercase 10px/tracking-[0.14em]/text-gray-400, row hover,
// consistent cell padding). Prefer these over hand-writing `<table
// className="min-w-full text-[12px]">` again — every table in the app then
// shares one header height, row height, and hover style, and a future
// change to any of them is one edit here.

export function TableContainer({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`overflow-x-auto ${className}`}>{children}</div>;
}

export function Table({ children, className = "", ...rest }: HTMLAttributes<HTMLTableElement>) {
  return (
    <table className={`min-w-full text-[12px] ${className}`} {...rest}>
      {children}
    </table>
  );
}

export function TableHead({ children, className = "", ...rest }: HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead className={`bg-gray-50 ${className}`} {...rest}>
      <tr className="border-b border-gray-100">{children}</tr>
    </thead>
  );
}

export function Th({ children, className = "", ...rest }: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      scope="col"
      className={`px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-label-wide text-gray-400 ${className}`}
      {...rest}
    >
      {children}
    </th>
  );
}

export function TableBody({ children, ...rest }: HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody {...rest}>{children}</tbody>;
}

export interface TableRowProps extends HTMLAttributes<HTMLTableRowElement> {
  clickable?: boolean;
  selected?: boolean;
}

export function TableRow({ children, clickable = false, selected = false, className = "", ...rest }: TableRowProps) {
  return (
    <tr
      className={`border-b border-gray-50 transition ${clickable ? "cursor-pointer hover:bg-primary-50/40" : ""} ${selected ? "bg-primary-50" : ""} ${className}`}
      {...rest}
    >
      {children}
    </tr>
  );
}

export function Td({ children, className = "", ...rest }: TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td className={`px-4 py-2.5 ${className}`} {...rest}>
      {children}
    </td>
  );
}

export default Table;
