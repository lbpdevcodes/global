import { readFileSync } from "node:fs";
import { join } from "node:path";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Explorer } from "./Explorer.jsx";

const examples = join(import.meta.dirname, "../../../contracts/examples");
const read = (path) => JSON.parse(readFileSync(join(examples, path), "utf8"));

const data = {
  index: async () => read("index.json").entities,
  country: async (code) => read(`countries/${code}.json`),
  borders: async () => ({ countries: [], disputed: [] }),
};
const createRenderer = async () => ({ setData: vi.fn(), select: vi.fn(), destroy: vi.fn() });

function renderExplorer(code) {
  const navigate = vi.fn();
  render(<Explorer code={code} navigate={navigate} data={data} createRenderer={createRenderer} today={new Date("2026-10-28")} />);
  return { navigate };
}

describe("Explorer", () => {
  it("invites the user to pick a country when none is selected", async () => {
    renderExplorer(undefined);

    expect(await screen.findByText("Click a country or search")).toBeInTheDocument();
  });

  it("opens the profile named in the URL", async () => {
    renderExplorer("FRA");

    expect(await screen.findByRole("heading", { level: 2, name: "France" })).toBeInTheDocument();
    expect(await screen.findByText("Head of state")).toBeInTheDocument();
  });

  it("opens a territory's parent profile and says why", async () => {
    renderExplorer("GRL");

    expect(await screen.findByRole("heading", { level: 2, name: "Denmark" })).toBeInTheDocument();
    expect(screen.getByRole("status", { name: "Territory" })).toHaveTextContent("Greenland");
  });

  it("tells the user when the URL names no known country", async () => {
    renderExplorer("ZZZ");

    expect(await screen.findByText("No country or territory has the code ZZZ.")).toBeInTheDocument();
  });

  it("goes to the country chosen in search", async () => {
    const { navigate } = renderExplorer(undefined);
    await screen.findByText("Click a country or search");

    await userEvent.type(screen.getByRole("combobox", { name: "Search countries" }), "holland");
    await userEvent.click(screen.getByRole("option", { name: "Netherlands (Holland)" }));

    expect(navigate).toHaveBeenCalledWith("/country/NLD");
  });

  it("goes back to the bare globe when the panel closes", async () => {
    const { navigate } = renderExplorer("FRA");

    await userEvent.click(await screen.findByRole("button", { name: "Close" }));

    expect(navigate).toHaveBeenCalledWith("/");
  });

  it("announces the opened country to screen readers", async () => {
    renderExplorer("FRA");

    expect(await screen.findByText("France profile opened")).toHaveAttribute("aria-live", "polite");
  });
});
