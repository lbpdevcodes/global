import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { SearchBox } from "./SearchBox.jsx";

const entities = [
  { code: "NLD", name: "Netherlands", aliases: ["Holland"], kind: "sovereign", parent: null },
  { code: "FRA", name: "France", aliases: [], kind: "sovereign", parent: null },
  { code: "FIN", name: "Finland", aliases: [], kind: "sovereign", parent: null },
];

function renderSearch() {
  const onSelect = vi.fn();
  render(<SearchBox entities={entities} onSelect={onSelect} />);
  return { onSelect, input: screen.getByRole("combobox", { name: "Search countries" }) };
}

describe("SearchBox", () => {
  it("suggests countries matching an alternate name, showing the name that matched", async () => {
    const { input } = renderSearch();

    await userEvent.type(input, "holl");

    expect(screen.getByRole("option", { name: "Netherlands (Holland)" })).toBeInTheDocument();
  });

  it("opens the chosen country", async () => {
    const { input, onSelect } = renderSearch();

    await userEvent.type(input, "fr");
    await userEvent.click(screen.getByRole("option", { name: "France" }));

    expect(onSelect).toHaveBeenCalledWith("FRA");
  });

  it("can be driven entirely from the keyboard", async () => {
    const { input, onSelect } = renderSearch();

    await userEvent.type(input, "f");
    await userEvent.keyboard("{ArrowDown}{ArrowDown}{Enter}");

    expect(onSelect).toHaveBeenCalledWith("FIN");
  });

  it("says so when nothing matches", async () => {
    const { input } = renderSearch();

    await userEvent.type(input, "atlantis");

    expect(screen.getByText("No country matches “atlantis”")).toBeInTheDocument();
  });
});
