import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { electionsLayer } from "../lib/layers.js";
import { LayerControls } from "./LayerControls.jsx";

const value = (v) => ({ value: v, asOf: "2026-10-27" });
const entities = [
  { code: "NOR", name: "Norway", kind: "sovereign", layers: { democracyScore: value(0.91), alliances: value(["UN", "NATO"]) } },
  { code: "ARG", name: "Argentina", kind: "sovereign", layers: { democracyScore: value(0.68), alliances: value(["UN", "Mercosur"]) } },
  { code: "ERI", name: "Eritrea", kind: "sovereign", layers: { democracyScore: null } },
  { code: "GRL", name: "Greenland", kind: "territory", layers: null },
];

function Harness() {
  const [layer, setLayer] = useState(null);
  return <LayerControls entities={entities} layer={layer} onChange={setLayer} />;
}

describe("LayerControls", () => {
  it("offers the plain globe and every layer, starting with the plain globe", () => {
    render(<Harness />);

    const group = screen.getByRole("radiogroup", { name: "Color the globe by" });
    expect(within(group).getAllByRole("radio").map((r) => r.closest("label").textContent))
      .toEqual(["None", "Government type", "Democracy score", "Population", "Armed conflict", "GDP per person",
        "Alliance or bloc", "Upcoming elections"]);
    expect(within(group).getByRole("radio", { name: "None" })).toBeChecked();
  });

  it("shows a legend for the chosen layer that names every class and no data", async () => {
    render(<Harness />);

    await userEvent.click(screen.getByRole("radio", { name: "Democracy score" }));

    const legend = screen.getByRole("list", { name: "Democracy score legend" });
    expect(within(legend).getAllByRole("listitem").map((item) => item.textContent))
      .toEqual(["0–0.2", "0.2–0.4", "0.4–0.6", "0.6–0.8", "0.8–1", "No data"]);
  });

  it("lets the viewer choose which bloc's members to show, from the blocs in the data", async () => {
    render(<Harness />);
    await userEvent.click(screen.getByRole("radio", { name: "Alliance or bloc" }));
    const bloc = screen.getByRole("combobox", { name: "Bloc" });
    expect(within(bloc).getAllByRole("option").map((option) => option.textContent)).toEqual(["Mercosur", "NATO"]);

    await userEvent.selectOptions(bloc, "Mercosur");

    expect(within(screen.getByRole("list", { name: "Alliance or bloc legend" })).getAllByRole("listitem")[0])
      .toHaveTextContent("Member of Mercosur");
    expect(screen.getByRole("radio", { name: "Alliance or bloc" })).toBeChecked();
  });

  it("names the elections layer's missing values as no known date", async () => {
    render(<Harness />);

    await userEvent.click(screen.getByRole("radio", { name: "Upcoming elections" }));

    const legend = screen.getByRole("list", { name: "Upcoming elections legend" });
    expect(within(legend).getAllByRole("listitem").map((item) => item.textContent))
      .toEqual(["Within 30 days", "Within 90 days", "Later, or date not yet fixed", "No date known"]);
  });

  it("lists every profiled country's class and value as a table", async () => {
    render(<Harness />);
    await userEvent.click(screen.getByRole("radio", { name: "Democracy score" }));

    await userEvent.click(screen.getByRole("button", { name: "View as list" }));

    const rows = within(screen.getByRole("table", { name: "Democracy score by country" })).getAllByRole("row").slice(1);
    expect(rows.map((row) => within(row).getAllByRole("cell").map((cell) => cell.textContent)))
      .toEqual([["Argentina", "0.6–0.8", "0.68"], ["Eritrea", "No data", "—"], ["Norway", "0.8–1", "0.91"]]);
  });

  it("lists a country with no dated election under the layer's own missing-value label", async () => {
    const eritrea = { code: "ERI", name: "Eritrea", kind: "sovereign", layers: { nextElection: null } };
    render(<LayerControls entities={[eritrea]} layer={electionsLayer(new Date(2026, 9, 29))} onChange={() => {}} />);

    await userEvent.click(screen.getByRole("button", { name: "View as list" }));

    const row = within(screen.getByRole("table", { name: "Upcoming elections by country" })).getAllByRole("row")[1];
    expect(within(row).getAllByRole("cell").map((cell) => cell.textContent)).toEqual(["Eritrea", "No date known", "—"]);
  });
});
