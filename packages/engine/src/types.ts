export type OKLCH = { l: number; c: number; h: number; alpha?: number };

export type EasingPreset =
  | "linear"
  | "easeIn"
  | "easeOut"
  | "easeInOut"
  | "softStart"
  | "softEnd"
  | "peakEarly"
  | "valleyEarly"
  | "midSurge"
  | "bounce"
  | "wave"
  | "material";

export type AdvancedEasing =
  | "pow"
  | "powInv"
  | "sigmoid"
  | "lamé"
  | "arc"
  | ((t: number, k: number) => number);

export type EasingFn = (t: number, accent: number) => number;

// Move ColorSpace here — it only contains strings, no runtime logic
export type ColorSpace =
  | "oklch"
  | "rybittern"
  | "okhsl"
  | "okhsv"
  | "lch"
  | "hsl"
  | "hsv"
  | "hwb";

export type Harmony =
  | "monochromatic"
  | "analogous"
  | "complementary"
  | "splitComplementary"
  | "triadic"
  | "tetradic";
