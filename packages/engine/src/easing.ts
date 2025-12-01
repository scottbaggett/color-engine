import type { AdvancedEasing, EasingFn, EasingPreset } from "./types";

const presets: Record<EasingPreset, EasingFn> = {
	linear: (t) => t,
	easeIn: (t, k = 2.5) => t ** k,
	easeOut: (t, k = 2.5) => 1 - (1 - t) ** k,
	easeInOut: (t) => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2),
	softStart: (t, k = 0.58) => Math.sqrt(1 - (1 - t) ** 2) * k + t * (1 - k),
	softEnd: (t, k = 0.58) => 1 - Math.sqrt(1 - t ** 2) * k - t * (1 - k),
	peakEarly: (t, k = 2.5) => {
		const t2 = (t - 0.5) * 2;
		return 0.5 + 0.5 * Math.sign(t2) * Math.abs(t2) ** k;
	},
	valleyEarly: (t, k = 2.5) => 1 - presets.peakEarly(1 - t, k),
	midSurge: (t, k = 12) => 1 / (1 + Math.exp(-k * (t - 0.5))),
	bounce: (t, k = 1.2) =>
		t + 0.1 * k * Math.sin(t * Math.PI * 4) * Math.exp(-t * 6),
	wave: (t) => 0.5 + 0.5 * Math.sin(2 * Math.PI * (t - 0.25)),
	material: (t) => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2),
};

export const resolveEasing = (
	easing: EasingPreset | AdvancedEasing | EasingFn = "linear",
	accent = 1,
): EasingFn => {
	if (typeof easing === "function") return easing;
	if (easing in presets)
		return (t) => presets[easing as EasingPreset](t, accent);

	// Advanced fallbacks
	switch (easing) {
		case "pow":
			return (t, k = accent) => t ** k;
		case "powInv":
			return (t, k = accent) => 1 - (1 - t) ** k;
		case "sigmoid":
			return (t, k = accent * 10) => 1 / (1 + Math.exp(-k * (t - 0.5)));
		case "lamé":
			return (t, k = accent) => {
				const exp = 2 / (2 + 20 * k);
				const limit = Math.PI / 2;
				const st = Math.sin(t * limit);
				return 0.5 + 0.5 * Math.sign(st) * Math.abs(st) ** exp;
			};
		case "arc":
			return (t, k = accent) => Math.sqrt(1 - (1 - t) ** 2) * k + t * (1 - k);
		default:
			return presets.linear;
	}
};
