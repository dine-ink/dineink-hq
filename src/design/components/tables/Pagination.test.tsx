import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Pagination } from "./Pagination";

describe("Pagination", () => {
  it("hides the rows-per-page selector unless a page size is managed", () => {
    render(<Pagination page={1} totalPages={3} onPageChange={() => {}} />);
    expect(screen.queryByLabelText(/rows per page/i)).toBeNull();
  });

  it("offers 5, 10, 25, 50 and 100 rows per page and reports a change", async () => {
    const user = userEvent.setup();
    const onPageSizeChange = vi.fn();
    render(
      <Pagination
        page={1}
        totalPages={3}
        onPageChange={() => {}}
        pageSize={10}
        onPageSizeChange={onPageSizeChange}
      />,
    );

    const select = screen.getByLabelText(/rows per page/i) as HTMLSelectElement;
    expect(Array.from(select.options).map((o) => o.value)).toEqual(["5", "10", "25", "50", "100"]);
    expect(select.value).toBe("10");

    await user.selectOptions(select, "50");
    expect(onPageSizeChange).toHaveBeenCalledWith(50);
  });

  it("disables Previous on the first page and Next on the last", () => {
    const { rerender } = render(<Pagination page={1} totalPages={2} onPageChange={() => {}} />);
    expect(screen.getByRole("button", { name: /previous page/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /next page/i })).toBeEnabled();

    rerender(<Pagination page={2} totalPages={2} onPageChange={() => {}} />);
    expect(screen.getByRole("button", { name: /next page/i })).toBeDisabled();
  });
});
