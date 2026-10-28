import { describe, expect, it } from "vitest";
import { featureCode } from "./feature-code.js";

const feature = (properties) => ({ ISO_A3: "-99", ISO_A3_EH: "-99", ADM0_A3: "-99", ...properties });

describe("featureCode", () => {
  it("uses the ISO code when Natural Earth has one", () => {
    expect(featureCode(feature({ ISO_A3: "DEU", ISO_A3_EH: "DEU", ADM0_A3: "DEU" }))).toBe("DEU");
  });

  it("ignores the -99 sentinel Natural Earth puts on France's ISO_A3", () => {
    expect(featureCode(feature({ ISO_A3_EH: "FRA", ADM0_A3: "FRA" }))).toBe("FRA");
  });

  it("falls back to ADM0_A3 for areas without an ISO code", () => {
    expect(featureCode(feature({ ADM0_A3: "SOL" }))).toBe("SOL");
  });

  it("maps Natural Earth's Kosovo code to the XKX code the data uses", () => {
    expect(featureCode(feature({ ADM0_A3: "KOS" }))).toBe("XKX");
  });

  it("keeps a territory's own code so the index can resolve its parent", () => {
    expect(featureCode(feature({ ISO_A3: "GRL", ISO_A3_EH: "GRL", ADM0_A3: "GRL" }))).toBe("GRL");
  });
});
