import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { LayerControls } from "./LayerControls.jsx";

const value = (v) => ({ value: v, asOf: "2026-10-27" });
const entities = [
  { code: "NOR", name: "Norway", kind: "sovereign", layers: { democracyScore: value(0.91) } },
  { code: "ARG", name: "Argentina", kind: "sovereign", layers: { democracyScore: value(0.68) } },
  { code: "ERI", name: "Eritrea", kind: "sovereign", layers: { democracyScore: null } },
  { code: "GRL", name: "Greenland", kind: "territory", layers: null },
];

function Harness() {
  const [layer, setLayer] = useState(null);
  return <LayerControls entities={entities} layer={layer} onChange={setLayer} />;
}

describe("LayerControls", () => {
  it("offers the plain globe and the four layers, starting with the plain globe", () => {
    render(<Harness />);

    const group = screen.getByRole("radiogroup", { name: "Color the globe by" });
    expect(within(group).getAllByRole("radio").map((r) => r.closest("label").textContent))
      .toEqual(["None", "Government type", "Democracy score", "Population", "Armed conflict"]);
    expect(within(group).getByRole("radio", { name: "None" })).toBeChecked();
  });

  it("shows a legend for the chosen layer that names every class and no data", async () => {
    render(<Harness />);

    await userEvent.click(screen.getByRole("radio", { name: "Democracy score" }));

    const legend = screen.getByRole("list", { name: "Democracy score legend" });
    expect(within(legend).getAllByRole("listitem").map((item) => item.textContent))
      .toEqual(["0–0.2", "0.2–0.4", "0.4–0.6", "0.6–0.8", "0.8–1", "No data"]);
  });

  it("lists every profiled country's class and value as a table", async () => {
    render(<Harness />);
    await userEvent.click(screen.getByRole("radio", { name: "Democracy score" }));

    await userEvent.click(screen.getByRole("button", { name: "View as list" }));

    const rows = within(screen.getByRole("table", { name: "Democracy score by country" })).getAllByRole("row").slice(1);
    expect(rows.map((row) => within(row).getAllByRole("cell").map((cell) => cell.textContent)))
      .toEqual([["Argentina", "0.6–0.8", "0.68"], ["Eritrea", "No data", "—"], ["Norway", "0.8–1", "0.91"]]);
  });
});
