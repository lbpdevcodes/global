import { render, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { GlobeView } from "./GlobeView.jsx";

function fakeRenderer() {
  const renderer = { setData: vi.fn(), select: vi.fn(), setLayer: vi.fn(), destroy: vi.fn() };
  const create = vi.fn(async (_container, handlers) => {
    renderer.handlers = handlers;
    return renderer;
  });
  return { renderer, create };
}

const borders = { countries: [{ properties: { code: "FRA" } }], disputed: [] };
const france = { code: "FRA", name: "France", kind: "sovereign", centroid: { lat: 46, lng: 2 } };

describe("GlobeView", () => {
  it("draws the borders once the renderer is ready", async () => {
    const { renderer, create } = fakeRenderer();

    render(<GlobeView borders={borders} entities={[france]} focus={null} onSelect={vi.fn()} createRenderer={create} />);

    await waitFor(() => expect(renderer.setData).toHaveBeenCalledWith(expect.objectContaining({ countries: borders.countries })));
  });

  it("highlights and centers the focused entity", async () => {
    const { renderer, create } = fakeRenderer();

    render(<GlobeView borders={borders} entities={[france]} focus={france} onSelect={vi.fn()} createRenderer={create} />);

    await waitFor(() => expect(renderer.select).toHaveBeenCalledWith("FRA", { lat: 46, lng: 2 }));
  });

  it("opens the country the user clicks on the globe", async () => {
    const { renderer, create } = fakeRenderer();
    const onSelect = vi.fn();
    render(<GlobeView borders={borders} entities={[france]} focus={null} onSelect={onSelect} createRenderer={create} />);
    await waitFor(() => expect(renderer.handlers).toBeDefined());

    renderer.handlers.onSelect("FRA");

    expect(onSelect).toHaveBeenCalledWith("FRA");
  });

  it("releases the renderer when it unmounts", async () => {
    const { renderer, create } = fakeRenderer();
    const { unmount } = render(<GlobeView borders={borders} entities={[france]} focus={null} onSelect={vi.fn()} createRenderer={create} />);
    await waitFor(() => expect(renderer.setData).toHaveBeenCalled());

    unmount();

    expect(renderer.destroy).toHaveBeenCalled();
  });

  it("colors the globe by the chosen layer, with a text label for each country", async () => {
    const { renderer, create } = fakeRenderer();
    const layer = { id: "conflictStatus", classes: [{ label: "None recorded", color: "#7b8394", test: () => true }],
      describe: () => "None recorded" };
    const quiet = { ...france, layers: { conflictStatus: { value: "none", asOf: "2026-10-27" } } };

    render(<GlobeView borders={borders} entities={[quiet]} focus={null} layer={layer} onSelect={vi.fn()} createRenderer={create} />);

    await waitFor(() => expect(renderer.setLayer).toHaveBeenLastCalledWith({
      colors: new Map([["FRA", "#7b8394"]]), labels: new Map([["FRA", "None recorded"]]),
    }));
  });

  it("labels a country with no value by the layer's own missing-value label", async () => {
    const { renderer, create } = fakeRenderer();
    const layer = { id: "nextElection", noData: "No date known", classes: [], describe: () => "" };
    const undated = { ...france, layers: { nextElection: null } };

    render(<GlobeView borders={borders} entities={[undated]} focus={null} layer={layer} onSelect={vi.fn()} createRenderer={create} />);

    await waitFor(() => expect(renderer.setLayer).toHaveBeenLastCalledWith(
      expect.objectContaining({ labels: new Map([["FRA", "No date known"]]) }),
    ));
  });
});
