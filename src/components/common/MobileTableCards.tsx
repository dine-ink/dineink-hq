import {
  Children,
  Fragment,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from "react";

/**
 * Wraps an existing `<table>` and, below `md`, renders the same rows as one
 * card each — heading plus label/value pairs — so a phone never has to scroll
 * sideways through a wide table.
 *
 * It reads the table's own markup rather than needing a column config, so
 * adopting it on an existing table is two inserted lines:
 *
 *   <MobileTableCards>
 *     <table>…unchanged…</table>
 *   </MobileTableCards>
 *
 * If the markup is not a shape it can read confidently — no `thead`, no header
 * cells — it renders the table alone and the page keeps today's horizontal
 * scroll. The fallback is always "no worse than before", never a crash.
 */

/** Children as a flat element list, unwrapping fragments and `.map()` arrays. */
function flattenElements(node: ReactNode): ReactElement[] {
  const out: ReactElement[] = [];
  for (const child of Children.toArray(node)) {
    if (!isValidElement(child)) continue;
    if (child.type === Fragment) {
      out.push(
        ...flattenElements((child.props as { children?: ReactNode }).children),
      );
      continue;
    }
    out.push(child);
  }
  return out;
}

function childrenOf(element: ReactElement): ReactNode {
  return (element.props as { children?: ReactNode }).children;
}

function ofType(elements: ReactElement[], type: string): ReactElement[] {
  return elements.filter((el) => el.type === type);
}

/** Descend through tbody/thead wrappers to the `<tr>` elements. */
function rowsIn(section: ReactElement): ReactElement[] {
  return ofType(flattenElements(childrenOf(section)), "tr");
}

const INTERACTIVE_TAGS = new Set([
  "input",
  "select",
  "textarea",
  "button",
  "label",
]);

/**
 * True if this subtree holds a form control. Some tables put their filter
 * widgets in the header row instead of column labels — using that row as card
 * labels would clone a live `<select>` into every card, all bound to the same
 * state. Such a table is not readable here and must fall back to scrolling.
 */
function containsInteractive(node: ReactNode): boolean {
  for (const child of Children.toArray(node)) {
    if (!isValidElement(child)) continue;
    if (typeof child.type === "string" && INTERACTIVE_TAGS.has(child.type))
      return true;
    if (containsInteractive((child.props as { children?: ReactNode }).children))
      return true;
  }
  return false;
}

type Cell = { node: ReactNode; spans: boolean };

function cellsIn(row: ReactElement): Cell[] {
  return flattenElements(childrenOf(row))
    .filter((el) => el.type === "td" || el.type === "th")
    .map((el) => {
      const props = el.props as { colSpan?: number; children?: ReactNode };
      return {
        node: props.children,
        spans: Number(props.colSpan ?? 1) > 1,
      };
    });
}

export default function MobileTableCards({
  children,
  /** Column index used as the card heading. */
  primaryIndex = 0,
  /** Column index shown top-right of the card — a status or segment pill. */
  badgeIndex,
  /** Column index pinned to the card footer, full width — action buttons. */
  footerIndex,
  /** Column indexes dropped from the card but kept in the table. */
  hideOnMobile = [],
  /** Classes for the wrapper holding the real table. */
  tableWrapperClassName = "hidden md:block",
}: {
  children: ReactNode;
  primaryIndex?: number;
  badgeIndex?: number;
  footerIndex?: number;
  hideOnMobile?: number[];
  tableWrapperClassName?: string;
}) {
  const table = flattenElements(children).find((el) => el.type === "table");
  const sections = table ? flattenElements(childrenOf(table)) : [];
  const head = ofType(sections, "thead")[0];
  const bodies = ofType(sections, "tbody");

  // Use the first header row that is actually column labels. A table whose
  // only header row holds filter widgets has no labels to offer.
  const headerRow = head
    ? rowsIn(head).find((row) => !containsInteractive(childrenOf(row)))
    : undefined;
  const headers = headerRow ? cellsIn(headerRow).map((c) => c.node) : [];
  const bodyRows = bodies.flatMap(rowsIn);

  // Not a shape we can read — leave the table exactly as it was.
  if (!table || !headers.length || !bodyRows.length) {
    return <>{children}</>;
  }

  const skip = new Set(hideOnMobile);

  return (
    <>
      <div className={tableWrapperClassName}>{children}</div>

      <div className="space-y-2 md:hidden">
        {bodyRows.map((row, rowIndex) => {
          const cells = cellsIn(row);

          // A spanning cell is an empty state or a section heading, not a
          // record — render it as plain full-width content.
          if (cells.length !== headers.length || cells.some((c) => c.spans)) {
            return (
              <div
                key={row.key ?? rowIndex}
                className="rounded-xl border border-gray-100 bg-white p-3 text-[12px] text-gray-600 shadow-sm"
              >
                {cells.map((cell, i) => (
                  <div key={i}>{cell.node}</div>
                ))}
              </div>
            );
          }

          const fields = cells
            .map((cell, index) => ({ ...cell, index }))
            .filter(
              ({ index }) =>
                index !== primaryIndex &&
                index !== badgeIndex &&
                index !== footerIndex &&
                !skip.has(index),
            );

          return (
            <div
              key={row.key ?? rowIndex}
              className="rounded-xl border border-gray-100 bg-white p-3 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1 text-[12px]">
                  {cells[primaryIndex]?.node}
                </div>
                {badgeIndex !== undefined && (
                  <div className="shrink-0 text-[11px]">
                    {cells[badgeIndex]?.node}
                  </div>
                )}
              </div>

              {fields.length > 0 && (
                <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 border-t border-gray-50 pt-3">
                  {fields.map((field) => (
                    <div key={field.index} className="min-w-0">
                      <dt className="text-[9px] font-bold tracking-[0.14em] text-gray-400 uppercase">
                        {headers[field.index]}
                      </dt>
                      <dd className="mt-0.5 truncate text-[12px] text-gray-700">
                        {field.node}
                      </dd>
                    </div>
                  ))}
                </dl>
              )}

              {footerIndex !== undefined && cells[footerIndex] && (
                <div className="mt-3 border-t border-gray-50 pt-3">
                  {cells[footerIndex].node}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
