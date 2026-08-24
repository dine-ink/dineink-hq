import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import MobileTableCards from "./MobileTableCards";

const ROWS = [
  { id: 1, name: "Anjushree Dubashi", visits: 2, spend: "₹1503.45" },
  { id: 2, name: "Niro Gupta", visits: 4, spend: "₹2850.5" },
];

function StandardTable() {
  return (
    <MobileTableCards>
      <table>
        <thead>
          <tr>
            {["Customer", "Visits", "Spend"].map((h) => (
              <th key={h}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {ROWS.map((r) => (
            <tr key={r.id}>
              <td>{r.name}</td>
              <td>{r.visits} Visits</td>
              <td>{r.spend}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </MobileTableCards>
  );
}

describe("MobileTableCards", () => {
  it("renders the original table plus one card per row", () => {
    render(<StandardTable />);

    // The real table is still there for md and up.
    expect(screen.getAllByRole("table")).toHaveLength(1);

    // Every value appears twice — once in the table, once in the card.
    expect(screen.getAllByText("Anjushree Dubashi")).toHaveLength(2);
    expect(screen.getAllByText("Niro Gupta")).toHaveLength(2);
    expect(screen.getAllByText("₹2850.5")).toHaveLength(2);
  });

  it("labels each card field with its column header", () => {
    const { container } = render(<StandardTable />);

    const cardArea = container.querySelector(".md\\:hidden");
    expect(cardArea).not.toBeNull();

    // First column is the heading, so it is not repeated as a <dt>.
    const labels = Array.from(cardArea!.querySelectorAll("dt")).map(
      (dt) => dt.textContent,
    );
    expect(labels).toEqual(["Visits", "Spend", "Visits", "Spend"]);
  });

  it("hides the table below md and the cards from md up", () => {
    const { container } = render(<StandardTable />);
    expect(container.querySelector(".hidden.md\\:block")).not.toBeNull();
    expect(container.querySelector(".md\\:hidden")).not.toBeNull();
  });

  it("uses primaryIndex, badgeIndex and footerIndex when given", () => {
    const { container } = render(
      <MobileTableCards primaryIndex={0} badgeIndex={2} footerIndex={1}>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Action</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Vendor A</td>
              <td>
                <button>Pay</button>
              </td>
              <td>Overdue</td>
            </tr>
          </tbody>
        </table>
      </MobileTableCards>,
    );

    const cardArea = container.querySelector(".md\\:hidden")!;
    // Every column is spoken for, so no label/value pairs remain.
    expect(cardArea.querySelectorAll("dt")).toHaveLength(0);
    expect(cardArea.querySelector("button")?.textContent).toBe("Pay");
    expect(cardArea.textContent).toContain("Overdue");
  });

  it("drops hideOnMobile columns from the card but keeps them in the table", () => {
    const { container } = render(
      <MobileTableCards hideOnMobile={[1]}>
        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th>Internal ID</th>
              <th>Qty</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Paneer</td>
              <td>SKU-99</td>
              <td>12 kg</td>
            </tr>
          </tbody>
        </table>
      </MobileTableCards>,
    );

    const cardArea = container.querySelector(".md\\:hidden")!;
    expect(cardArea.textContent).not.toContain("SKU-99");
    expect(cardArea.textContent).toContain("12 kg");
    // Still present in the desktop table.
    expect(screen.getByText("SKU-99")).toBeTruthy();
  });

  it("renders a colSpan empty-state row as plain full-width content", () => {
    const { container } = render(
      <MobileTableCards>
        <table>
          <thead>
            <tr>
              <th>A</th>
              <th>B</th>
              <th>C</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={3}>No churned customers</td>
            </tr>
          </tbody>
        </table>
      </MobileTableCards>,
    );

    const cardArea = container.querySelector(".md\\:hidden")!;
    expect(cardArea.textContent).toContain("No churned customers");
    // Not turned into label/value pairs.
    expect(cardArea.querySelectorAll("dt")).toHaveLength(0);
  });

  it("handles rows arriving inside a fragment", () => {
    const { container } = render(
      <MobileTableCards>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Qty</th>
            </tr>
          </thead>
          <tbody>
            <>
              <tr>
                <td>Row one</td>
                <td>1</td>
              </tr>
              <tr>
                <td>Row two</td>
                <td>2</td>
              </tr>
            </>
          </tbody>
        </table>
      </MobileTableCards>,
    );

    const cardArea = container.querySelector(".md\\:hidden")!;
    expect(cardArea.textContent).toContain("Row one");
    expect(cardArea.textContent).toContain("Row two");
  });

  it("falls back to the bare table when there is no thead", () => {
    const { container } = render(
      <MobileTableCards>
        <table>
          <tbody>
            <tr>
              <td>Only a body</td>
            </tr>
          </tbody>
        </table>
      </MobileTableCards>,
    );

    // No card layer at all — the page keeps its existing scroll behaviour.
    expect(container.querySelector(".md\\:hidden")).toBeNull();
    expect(container.querySelector(".hidden.md\\:block")).toBeNull();
    expect(screen.getByText("Only a body")).toBeTruthy();
  });

  it("falls back when the only header row holds filter controls", () => {
    // MenuManagement puts its search box and category/type dropdowns in the
    // header row. Using those as card labels would clone a live <select> into
    // every card, all bound to the same state.
    const { container } = render(
      <MobileTableCards>
        <table>
          <thead>
            <tr>
              <th>
                <input placeholder="Search item..." />
              </th>
              <th>
                <select>
                  <option>All Categories</option>
                </select>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Gobi 65</td>
              <td>Starters</td>
            </tr>
          </tbody>
        </table>
      </MobileTableCards>,
    );

    expect(container.querySelector(".md\\:hidden")).toBeNull();
    // Exactly one search box — not one per row.
    expect(container.querySelectorAll("input")).toHaveLength(1);
    expect(container.querySelectorAll("select")).toHaveLength(1);
  });

  it("prefers a later header row of real labels over a filter row", () => {
    const { container } = render(
      <MobileTableCards>
        <table>
          <thead>
            <tr>
              <th>
                <input placeholder="Search" />
              </th>
              <th />
            </tr>
            <tr>
              <th>Item</th>
              <th>Category</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Gobi 65</td>
              <td>Starters</td>
            </tr>
          </tbody>
        </table>
      </MobileTableCards>,
    );

    const cardArea = container.querySelector(".md\\:hidden")!;
    expect(
      Array.from(cardArea.querySelectorAll("dt")).map((d) => d.textContent),
    ).toEqual(["Category"]);
    expect(cardArea.querySelectorAll("input")).toHaveLength(0);
  });

  it("falls back when the row cell count does not match the headers", () => {
    const { container } = render(
      <MobileTableCards>
        <table>
          <thead>
            <tr>
              <th>A</th>
              <th>B</th>
              <th>C</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>only</td>
              <td>two</td>
            </tr>
          </tbody>
        </table>
      </MobileTableCards>,
    );

    const cardArea = container.querySelector(".md\\:hidden")!;
    // Rendered as plain content rather than mislabelled pairs.
    expect(cardArea.querySelectorAll("dt")).toHaveLength(0);
    expect(cardArea.textContent).toContain("only");
  });
});
