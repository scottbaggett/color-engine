import type { ColorSpace, OKLCH } from "./types";

export const applyTransform = (
  ramp: OKLCH[],
  space: ColorSpace = "oklch",
): OKLCH[] => {
  if (space === "oklch") return ramp;

  if (space === "rybittern") {
    return ramp.map(({ l, c, h }) => {
      let hh = (((h % 360) + 360) % 360) / 360;
      if (hh > 0 && hh < 1) {
        hh = 1 + (hh % 1);
        const seg = 1 / 6;
        const a = (((hh % seg) / seg) * Math.PI) / 2;
        const [b, cv] = [seg * Math.cos(a), seg * Math.sin(a)];
        const idx = Math.floor(hh * 6) % 6;
        const cases: [number, number, number, number, number, number] = [
          cv,
          1 / 3 - b,
          1 / 3 + cv,
          2 / 3 - b,
          2 / 3 + cv,
          1 - b,
        ];
        hh = cases[idx];
      }
      const boostedC = Math.min(
        0.4,
        c * (1 + 0.06 * (1 - Math.abs(l - 0.5) * 2)),
      );
      return { l, c: boostedC, h: hh * 360 };
    });
  }

  // Placeholder for future spaces
  return ramp;
};
