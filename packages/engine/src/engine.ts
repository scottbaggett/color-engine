import { resolveEasing } from "./easing";
import { SeededRNG } from "./rng";
import { applyTransform } from "./transforms";
import type {
  AdvancedEasing,
  ColorSpace,
  EasingFn,
  EasingPreset,
  OKLCH,
} from "./types";

interface RampOptions {
  steps?: number;
  seed?: string | number;
  hue?: {
    start?: number;
    end?: number;
    rotations?: number;
    easing?: EasingPreset | AdvancedEasing | EasingFn;
    accent?: number;
  };
  chroma?: {
    start?: number;
    end?: number;
    easing?: EasingPreset | AdvancedEasing | EasingFn;
    accent?: number;
  };
  lightness?: {
    start?: number;
    end?: number;
    easing?: EasingPreset | AdvancedEasing | EasingFn;
    accent?: number;
  };
  space?: ColorSpace;
  roles?: Record<string, number>;
}

export class ColorEngine {
  private rng: SeededRNG;

  constructor(seed?: string | number) {
    this.rng = new SeededRNG(seed);
  }

  ramp(options: RampOptions = {}) {
    const {
      steps = 12,
      hue = {},
      chroma = { start: 0.04, end: 0.18 },
      lightness = { start: 0.98, end: 0.12 },
      space = "oklch",
      roles = { surface: 0, primary: 0.5, accent: 0.85 },
    } = options;

    const hStart = hue.start ?? this.rng.next() * 360;
    const hEnd = hue.end ?? (hStart + this.rng.next() * 240 - 120 + 360) % 360;
    const hRot = hue.rotations ?? 0;
    const hEasing = resolveEasing(hue.easing ?? "softStart", hue.accent ?? 1);
    const cEasing = resolveEasing(chroma.easing ?? "arc", chroma.accent ?? 1);
    const lEasing = resolveEasing(
      lightness.easing ?? "easeOut",
      lightness.accent ?? 1,
    );

    // Extract values with defaults to avoid non-null assertions
    const lStart = lightness.start ?? 0.98;
    const lEnd = lightness.end ?? 0.12;
    const cStart = chroma.start ?? 0.04;
    const cEnd = chroma.end ?? 0.18;

    let deltaH = hEnd - hStart;
    if (deltaH > 180) deltaH -= 360;
    if (deltaH < -180) deltaH += 360;
    deltaH += hRot * 360;

    const actualHStart = hStart + this.rng.gaussian(0, 8);

    const ramp: OKLCH[] = [];
    for (let i = 0; i < steps; i++) {
      const t = i / (steps - 1);
      const l = lStart + (lEnd - lStart) * lEasing(t, 1);
      const c = cStart + (cEnd - cStart) * cEasing(t, 1);
      const h = (actualHStart + deltaH * hEasing(t, 1) + 720) % 360;
      ramp.push({
        l: Math.max(0, Math.min(1, l)),
        c: Math.max(0, Math.min(0.4, c)),
        h,
      });
    }

    const finalRamp = applyTransform(ramp, space);

    const resolvedRoles = Object.fromEntries(
      Object.entries(roles).map(([name, t]) => [
        name,
        finalRamp[Math.round(t * (steps - 1))],
      ]),
    );

    return {
      ramp: finalRamp,
      roles: resolvedRoles,
      seed: this.rng.seed,
      css: () =>
        finalRamp.map(
          (c) =>
            `oklch(${Math.round(c.l * 100)}% ${c.c.toFixed(3)} ${Math.round(c.h)})`,
        ),
    };
  }

  static random = (opts?: Partial<RampOptions>) => new ColorEngine().ramp(opts);
}
