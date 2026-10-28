import { describe, expect, it, vi } from "vitest";
import { createSnapshotData } from "./data.js";

const ok = (body) => ({ ok: true, json: async () => body });

describe("createSnapshotData", () => {
  it("reads the entity list from the published index", async () => {
    const fetch = vi.fn(async () => ok({ snapshotId: "s", entities: [{ code: "FRA" }] }));

    expect(await createSnapshotData(fetch).index()).toEqual([{ code: "FRA" }]);
    expect(fetch).toHaveBeenCalledWith("/data/v1/index.json");
  });

  it("fetches each file once and reuses it", async () => {
    const fetch = vi.fn(async () => ok({ code: "FRA" }));
    const data = createSnapshotData(fetch);

    await data.country("FRA");
    await data.country("FRA");

    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("asks again after a failed request instead of remembering the failure", async () => {
    const fetch = vi.fn().mockResolvedValueOnce({ ok: false, status: 503 }).mockResolvedValueOnce(ok({ code: "FRA" }));
    const data = createSnapshotData(fetch);

    await expect(data.country("FRA")).rejects.toThrow("/data/v1/countries/FRA.json: HTTP 503");
    await expect(data.country("FRA")).resolves.toEqual({ code: "FRA" });
  });
});
