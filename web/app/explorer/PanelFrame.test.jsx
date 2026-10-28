import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { PanelFrame } from "./PanelFrame.jsx";

describe("PanelFrame", () => {
  it("expands the mobile sheet to full height from its handle and collapses it again", async () => {
    render(<PanelFrame><p>Profile</p></PanelFrame>);

    await userEvent.click(screen.getByRole("button", { name: "Expand panel" }));
    expect(screen.getByRole("button", { name: "Collapse panel" })).toHaveAttribute("aria-expanded", "true");

    await userEvent.click(screen.getByRole("button", { name: "Collapse panel" }));
    expect(screen.getByRole("button", { name: "Expand panel" })).toHaveAttribute("aria-expanded", "false");
  });
});
