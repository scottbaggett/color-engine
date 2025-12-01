import { describe, expect, it } from "vitest";
import { ColorEngine } from "./src/index";

describe("ColorEngine", () => {
  it("generates OKLCH ramp with correct steps", () => {
    const engine = new ColorEngine(123); // Seeded
    const { ramp } = engine.ramp({ steps: 5 });
    expect(ramp).toHaveLength(5);
    expect(ramp[0].l).toBeCloseTo(0.98); // From defaults
  });
});
