import { describe, expect, it } from "vitest";
import { useState } from "react";
import { MemoryRouter } from "react-router-dom";
import { render, screen } from "@testing-library/react";
import { useTabFromQuery } from "./useTabFromQuery";

const TABS = ["Bank Accounts", "UPI", "Transactions"] as const;
type Tab = (typeof TABS)[number];

function Page() {
  const [tab, setTab] = useState<Tab>("Bank Accounts");
  useTabFromQuery(TABS, setTab);
  return <p>Active: {tab}</p>;
}

const renderAt = (route: string) =>
  render(
    <MemoryRouter initialEntries={[route]}>
      <Page />
    </MemoryRouter>,
  );

describe("useTabFromQuery", () => {
  it("opens the tab named in ?tab=", () => {
    renderAt("/dashboard/banking?tab=UPI");
    expect(screen.getByText("Active: UPI")).toBeInTheDocument();
  });

  it("leaves the default alone without the parameter or with an unknown tab", () => {
    renderAt("/dashboard/banking");
    expect(screen.getByText("Active: Bank Accounts")).toBeInTheDocument();
    renderAt("/dashboard/banking?tab=Nonsense");
    expect(screen.getAllByText("Active: Bank Accounts")).toHaveLength(2);
  });
});
