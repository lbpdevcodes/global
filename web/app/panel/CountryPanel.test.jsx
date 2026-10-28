import { readFileSync } from "node:fs";
import { join } from "node:path";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CountryPanel } from "./CountryPanel.jsx";

const examples = join(import.meta.dirname, "../../../contracts/examples");
const read = (path) => JSON.parse(readFileSync(join(examples, path), "utf8"));
const index = read("index.json").entities;
const entity = (code) => index.find((e) => e.code === code);
const today = new Date("2026-10-28T12:00:00Z");

function renderPanel({ code = "FRA", territory = null, country = read(`countries/${code}.json`), onClose = vi.fn() } = {}) {
  const selection = { profile: entity(code), focus: territory ?? entity(code), territory };
  render(<CountryPanel selection={selection} country={country} onClose={onClose} today={today} />);
  return { onClose };
}

describe("CountryPanel", () => {
  it("heads the panel with the country's name and capital", () => {
    renderPanel();

    expect(screen.getByRole("heading", { level: 2, name: "France" })).toBeInTheDocument();
    expect(screen.getByText("Paris")).toBeInTheDocument();
  });

  it("orders sections as the PRD lists them, with sources last", () => {
    renderPanel();

    const headings = screen.getAllByRole("heading", { level: 3 }).map((h) => h.textContent);
    expect(headings).toEqual(["Leadership", "Government", "People", "Economy", "Politics", "Sources"]);
  });

  it("hides rows that have no value instead of showing a placeholder", () => {
    renderPanel();

    expect(screen.queryByText("Head of government")).not.toBeInTheDocument();
    expect(screen.queryByText(/N\/A/)).not.toBeInTheDocument();
    expect(screen.getByText("Head of state")).toBeInTheDocument();
  });

  it("reveals a field's source and as-of date on request", async () => {
    renderPanel();

    await userEvent.click(screen.getByRole("button", { name: "Source for Population" }));

    const details = screen.getByRole("note", { name: "Population source" });
    expect(within(details).getByRole("link", { name: "data.worldbank.org" }))
      .toHaveAttribute("href", "https://data.worldbank.org/indicator/SP.POP.TOTL?locations=FR");
    expect(details).toHaveTextContent("As of 27 Oct 2026 · 2024 data");
  });

  it("marks a field that is past its refresh window as possibly outdated", () => {
    renderPanel({ country: { ...read("countries/FRA.json"),
      leadership: { ...read("countries/FRA.json").leadership,
        headOfState: { ...read("countries/FRA.json").leadership.headOfState, asOf: "2026-10-01" } } } });

    const row = screen.getByText("Head of state").closest("div");
    expect(within(row).getByText("May be outdated")).toBeInTheDocument();
  });

  it("shows a status banner for a partially recognized state", () => {
    renderPanel({ code: "TWN" });

    expect(screen.getByRole("status", { name: "Recognition status" }))
      .toHaveTextContent("Recognized by a small number of UN member states");
  });

  it("explains a territory's place when the user selected one", () => {
    renderPanel({ code: "DNK", territory: entity("GRL") });

    expect(screen.getByRole("status", { name: "Territory" })).toHaveTextContent("Greenland: Autonomous region of Denmark");
  });

  it("lists tensions with the source's status and a link", () => {
    renderPanel({ code: "TWN" });

    const item = screen.getByRole("listitem", { name: "Cross-Strait tensions" });
    expect(within(item).getByText("Tension")).toBeInTheDocument();
    expect(within(item).getByRole("link", { name: "www.crisisgroup.org" })).toHaveAttribute("href", "https://www.crisisgroup.org/crisiswatch");
  });

  it("shows placeholder rows while the profile loads", () => {
    renderPanel({ country: null });

    expect(screen.getByRole("status", { name: "Loading France" })).toBeInTheDocument();
  });

  it("closes from the close button and the Escape key", async () => {
    const { onClose } = renderPanel();

    await userEvent.click(screen.getByRole("button", { name: "Close" }));
    await userEvent.keyboard("{Escape}");

    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
