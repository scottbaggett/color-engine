import {
  Activity,
  ArrowRight,
  Box,
  Check,
  Circle,
  Dices,
  Maximize2,
  Minimize2,
  RotateCw,
  Settings2,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

/**
 * --- COLOR MATH ENGINE ---
 */

// Types
type ColorOKLCH = { l: number; c: number; h: number };

// 1. Math Helpers
const clamp = (x: number, min: number, max: number) =>
  Math.max(min, Math.min(x, max));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// 2. CURVE SHAPING FUNCTIONS
const Curves = {
  linear: (t: number, k: number) => t,
  pow: (t: number, k: number) => t ** k,
  powInv: (t: number, k: number) => 1 - (1 - t) ** k,
  lame: (t: number, k: number) => {
    const t2 = (t - 0.5) * 2;
    return 0.5 + 0.5 * Math.sign(t2) * Math.abs(t2) ** k;
  },
  arc: (t: number, k: number) => {
    return Math.sqrt(1 - (1 - t) ** 2) * k + t * (1 - k);
  },
  sigmoid: (t: number, k: number) => {
    return 1 / (1 + Math.exp(-k * (t - 0.5)));
  },
};

// 3. Gaussian Random
function randomGaussian(mean: number, stdDev = 1): number {
  const u1 = Math.random();
  const u2 = Math.random();
  const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
  return z0 * stdDev + mean;
}

// 4. Color Space Conversion (Approximate OKLCH -> sRGB)
function getCssString(c: ColorOKLCH): string {
  return `oklch(${Math.round(c.l * 100)}% ${c.c} ${c.h})`;
}

function getCssStringWithAlpha(c: ColorOKLCH, alpha: number): string {
  return `oklch(${Math.round(c.l * 100)}% ${c.c} ${c.h} / ${alpha})`;
}

// Contrast Helper
function getContrast(l1: number, l2: number): number {
  const lum1 = l1 + 0.05;
  const lum2 = l2 + 0.05;
  return Math.max(lum1, lum2) / Math.min(lum1, lum2);
}

/**
 * --- UI COMPONENTS ---
 */

const Slider = ({ label, value, min, max, step, onChange, unit = "" }: any) => (
  <div className="flex flex-col gap-1 mb-4">
    <div className="flex justify-between text-[10px] uppercase tracking-wider text-gray-500 font-bold font-mono">
      <span>{label}</span>
      <span>
        {typeof value === "number" ? value.toFixed(step < 0.1 ? 2 : 1) : value}
        {unit}
      </span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-black hover:accent-indigo-600 transition-colors"
    />
  </div>
);

const PaletteBlock = ({ color, role }: { color: ColorOKLCH; role: string }) => {
  const [copied, setCopied] = useState(false);
  const bg = getCssString(color);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(bg);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <button
      type="button"
      className="group relative flex-1 min-w-[40px] h-full transition-all hover:flex-[1.5] cursor-pointer"
      style={{ background: bg }}
      onClick={copyToClipboard}
    >
      <div className="absolute inset-0 flex flex-col justify-end p-1 opacity-0 group-hover:opacity-100 transition-opacity ">
        <span className="text-white text-[10px] font-bold uppercase truncate font-mono">
          {role}
        </span>
        {copied && (
          <Check size={10} className="text-white absolute top-2 right-2" />
        )}
      </div>
    </button>
  );
};

// --- 2D FLAT PATH VISUALIZER ---
const PathVisualizer2D = ({
  ramp,
  mode,
}: {
  ramp: ColorOKLCH[];
  mode: "lightness" | "chroma" | "hue";
}) => {
  const config = {
    lightness: {
      getValue: (c: ColorOKLCH) => c.l,
      max: 1,
      label: "Lightness (L)",
      color: "white",
    },
    chroma: {
      getValue: (c: ColorOKLCH) => c.c,
      max: 0.4,
      label: "Chroma (C)",
      color: "#ec4899",
    },
    hue: {
      getValue: (c: ColorOKLCH) => c.h / 360,
      max: 1,
      label: "Hue (H)",
      color: "#6366f1",
    },
  };

  const { getValue, max, label, color } = config[mode];

  return (
    <div className="relative w-full h-full">
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            "linear-gradient(#000 0.5px, transparent 0.5px), linear-gradient(90deg, #000 0.5px, transparent 0.5px)",
          backgroundSize: "30px 30px",
        }}
      />
      <svg className="absolute inset-0 w-full h-full p-6 overflow-visible">
        <polyline
          points={ramp
            .map((c, i) => {
              const x = (i / (ramp.length - 1)) * 100;
              const val = getValue(c);
              const y = 100 - (val / max) * 100;
              return `${x}%,${y}%`;
            })
            .join(" ")}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeOpacity="0.5"
          vectorEffect="non-scaling-stroke"
        />
        {ramp.map((c, i) => {
          const x = (i / (ramp.length - 1)) * 100;
          const val = getValue(c);
          const y = 100 - (val / max) * 100;
          return (
            <circle
              key={`${i}-${c.h}`}
              cx={`${x}%`}
              cy={`${y}%`}
              r={mode === "lightness" ? 4 + c.c * 45 : 5}
              fill={getCssString(c)}
              stroke="white"
              strokeWidth="2"
              className="drop-shadow-sm transition-all duration-300"
            />
          );
        })}
      </svg>
      <div className="absolute bottom-2 left-4 text-xs font-mono uppercase font-bold tracking-wider opacity-60">
        {label} vs Index
      </div>
    </div>
  );
};

// --- 3D HELIX VISUALIZER (SVG Projection) ---
const HelixVisualizer3D = ({ ramp }: { ramp: ColorOKLCH[] }) => {
  const [angle, setAngle] = useState(0);
  const requestRef = useRef<number | undefined>(undefined);

  // Auto-rotate loop
  const animate = () => {
    setAngle((prev) => (prev + 0.0004) % (Math.PI * 2));
    requestRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(requestRef.current!);
  }, []);

  // Projection Logic
  const project = (x: number, y: number, z: number) => {
    // Rotate around Y axis
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const rx = x * cos - z * sin;
    const rz = x * sin + z * cos;

    // Simple Perspective
    const fov = 400;
    const scale = fov / (fov + rz + 200); // +200 pushes it back
    const px = rx * scale;
    const py = y * scale;

    return { x: px, y: py, scale, zIndex: rz };
  };

  // Convert Ramp to 3D Points
  const points = useMemo(() => {
    return ramp.map((c, i) => {
      // Map Data to 3D Cylindrical Coords
      const hRad = (c.h * Math.PI) / 180;
      const radius = 100 + c.c * 250; // Chroma = Radius
      const height = (c.l - 0.5) * -250; // Lightness = Height (inverted for screen coords)

      const x = Math.cos(hRad) * radius;
      const z = Math.sin(hRad) * radius;

      return { ...project(x, height, z), color: c };
    });
  }, [ramp, angle]);

  // Generate Wireframe Rings (Reference lines)
  const rings = useMemo(() => {
    const ringConfig = [0.2, 0.5, 0.8]; // Lightness levels for rings
    return ringConfig.map((l) => {
      const ringPoints: {
        x: number;
        y: number;
        scale: number;
        zIndex: number;
      }[] = [];
      const height = (l - 0.5) * -250;
      const radius = 150; // Reference chroma radius

      for (let a = 0; a <= Math.PI * 2; a += 0.2) {
        const x = Math.cos(a) * radius;
        const z = Math.sin(a) * radius;
        ringPoints.push(project(x, height, z));
      }
      return ringPoints;
    });
  }, [angle]);

  // Sort by depth for correct occlusion (Painter's Algorithm)
  const sortedDrawables = [
    // Points
    ...points.map((p) => ({ type: "point", ...p })),
    // Segments (lines between points)
    ...points.slice(0, -1).map((p, i) => ({
      type: "line",
      p1: p,
      p2: points[i + 1],
      zIndex: (p.zIndex + points[i + 1].zIndex) / 2,
    })),
  ].sort((a, b) => b.zIndex - a.zIndex); // Draw back to front

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden bg-black/5">
      <div
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          background:
            "radial-gradient(circle at center, rgba(0,0,0,0.1) 0%, transparent 70%)",
        }}
      />

      <svg
        className="w-full h-full overflow-visible"
        viewBox="-200 -150 400 300"
      >
        {/* Draw Reference Rings (Background) */}
        {rings.map((ring, i) => (
          <polyline
            key={i}
            points={ring.map((p) => `${p.x},${p.y}`).join(" ")}
            fill="none"
            stroke="black"
            strokeOpacity="0.05"
            strokeWidth="1"
          />
        ))}

        {/* Draw Helix */}
        {sortedDrawables.map((d: any, i) => {
          if (d.type === "line") {
            return (
              <line
                key={`l-${i}`}
                x1={d.p1.x}
                y1={d.p1.y}
                x2={d.p2.x}
                y2={d.p2.y}
                stroke={getCssString(d.p1.color)}
                strokeWidth={4 * d.p1.scale}
                strokeLinecap="round"
                opacity={0.6}
              />
            );
          }
          return (
            <circle
              key={`p-${i}`}
              cx={d.x}
              cy={d.y}
              r={6 * d.scale + d.color.c * 15 * d.scale} // Scale radius by chroma + perspective
              fill={getCssString(d.color)}
              stroke="white"
              strokeWidth={1.5 * d.scale}
              strokeOpacity={0.8}
            />
          );
        })}

        {/* Central Axis */}
        <line
          x1="0"
          y1="-120"
          x2="0"
          y2="120"
          stroke="black"
          strokeWidth="1"
          strokeOpacity="0.1"
          strokeDasharray="4 4"
        />
      </svg>

      <div className="absolute bottom-4 right-4 text-[10px] font-mono text-muted-foreground text-right">
        <div>Y = Lightness</div>
        <div>θ = Hue</div>
        <div>R = Chroma</div>
      </div>
    </div>
  );
};

// Generative Mosaic
const GenerativeMosaic = ({ palette }: { palette: any }) => {
  const cells = Array.from({ length: 24 }).map((_, i) => {
    const rampIndex = Math.floor(Math.random() * palette.ramps[0].length);
    const color = palette.ramps[0][rampIndex];
    return { color, id: i };
  });

  return (
    <div className="grid grid-cols-8 h-full w-full">
      {cells.map((cell) => (
        <div key={cell.id} style={{ background: getCssString(cell.color) }} />
      ))}
    </div>
  );
};

export default function GenerativeColorPlayground() {
  // --- STATE ---
  const [seed, setSeed] = useState(Math.random());
  const [fullscreen, setFullscreen] = useState(false);
  const [visualizerMode, setVisualizerMode] = useState<
    "lightness" | "chroma" | "hue" | "3d"
  >("3d");

  // Basic Config
  const [steps, setSteps] = useState(12);

  // --- TRACK A: HUE ---
  const [hStart, setHStart] = useState(240);
  const [hEnd, setHEnd] = useState(300);
  const [hCurve, setHCurve] = useState<keyof typeof Curves>("linear");
  const [hAccent, setHAccent] = useState(1);
  const [hRotations, setHRotations] = useState(0); // -3 to 3

  // --- TRACK B: CHROMA ---
  const [cStart, setCStart] = useState(0.04);
  const [cEnd, setCEnd] = useState(0.18);
  const [cCurve, setCCurve] = useState<keyof typeof Curves>("arc");
  const [cAccent, setCAccent] = useState(1);

  // --- TRACK C: LIGHTNESS ---
  const [lStart, setLStart] = useState(0.98);
  const [lEnd, setLEnd] = useState(0.12);
  const [lCurve, setLCurve] = useState<keyof typeof Curves>("linear");
  const [lAccent, setLAccent] = useState(1);

  // --- RANDOMIZER ---
  const randomizeSettings = () => {
    const r = (min: number, max: number) => Math.random() * (max - min) + min;
    const rInt = (min: number, max: number) =>
      Math.floor(Math.random() * (max - min + 1) + min);
    const pick = <T,>(arr: T[]): T =>
      arr[Math.floor(Math.random() * arr.length)];
    const curveKeys = Object.keys(Curves) as (keyof typeof Curves)[];

    const startH = rInt(0, 360);
    setHStart(startH);
    setHEnd((startH + rInt(-120, 120) + 360) % 360);
    setHCurve(pick(curveKeys));
    setHAccent(r(0.6, 2.0));
    setHRotations(rInt(-1, 2));

    setCStart(r(0.02, 0.15));
    setCEnd(r(0.1, 0.35));
    setCCurve(pick(curveKeys));
    setCAccent(r(0.6, 2.0));

    if (Math.random() > 0.5) {
      setLStart(r(0.92, 0.99));
      setLEnd(r(0.05, 0.25));
    } else {
      setLStart(r(0.05, 0.2));
      setLEnd(r(0.9, 0.99));
    }
    setLCurve(pick(curveKeys));
    setLAccent(r(0.6, 2.0));

    setSeed(Math.random());
  };

  // --- ENGINE ---

  const palette = useMemo(() => {
    const actualHStart = (randomGaussian(hStart) + 360) % 360;
    const actualHEnd = (randomGaussian(hEnd) + 360) % 360;

    let hueDelta = actualHEnd - actualHStart;
    if (hueDelta > 180) hueDelta -= 360;
    if (hueDelta < -180) hueDelta += 360;
    hueDelta += hRotations * 360;

    const ramp = Array.from({ length: steps }, (_, i) => {
      const tRaw = i / (steps - 1);

      const tH = Curves[hCurve](tRaw, hAccent);
      const tC = Curves[cCurve](tRaw, cAccent);
      const tL = Curves[lCurve](tRaw, lAccent);

      const l = lerp(lStart, lEnd, tL);
      const c = lerp(cStart, cEnd, tC);
      const h = (actualHStart + hueDelta * tH + 720) % 360;

      return { l, c, h };
    });

    const solveForContrast = (
      color: ColorOKLCH,
      targetContrast: number,
      bg: ColorOKLCH,
    ): string => {
      const contrast = getContrast(color.l, bg.l);
      if (contrast < targetContrast) return "#000000";
      return "#ffffff";
    };

    const surfaceColor = ramp[0];
    const primaryColor = ramp[Math.floor(steps / 2)];
    const accentColor = ramp[Math.min(steps - 1, Math.floor(steps / 2) + 2)];
    const accentColorForeground = solveForContrast(
      accentColor,
      4.5,
      surfaceColor,
    );

    return {
      ramps: [ramp],
      surfaceColor,
      primaryColor,
      accentColor,
      accentColorForeground,
    };
  }, [
    hStart,
    hEnd,
    hCurve,
    hAccent,
    hRotations,
    cStart,
    cEnd,
    cCurve,
    cAccent,
    lStart,
    lEnd,
    lCurve,
    lAccent,
    steps,
    seed,
  ]);

  const gradientString = `linear-gradient(to bottom right, ${palette.ramps[0].map((c) => getCssString(c)).join(", ")})`;

  return (
    <div className="h-screen w-full flex bg-surface-1 font-sans overflow-hidden text-[#111]">
      {/* --- SIDEBAR --- */}
      <aside
        className={`shrink-0 bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ${fullscreen ? "w-0 opacity-0 overflow-hidden" : "w-[340px] opacity-100"}`}
      >
        <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-white z-10">
          <div className="flex items-center gap-2">
            <Activity className="text-black" size={20} />
            <h1 className="font-bold text-sm tracking-wide">Color Engine</h1>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-8 custom-scrollbar">
          {/* Global */}
          <section>
            <div className="flex items-center gap-2 mb-4 text-muted-foreground">
              <Settings2 size={14} />
              <span className="text-xs font-bold uppercase tracking-wider">
                Global
              </span>
            </div>
            <Slider
              label="Steps"
              value={steps}
              min={3}
              max={24}
              step={1}
              onChange={setSteps}
            />
          </section>

          {/* TRACK A: HUE */}
          <section className="bg-gray-50 p-3 rounded-xl border border-gray-100">
            <div className="flex justify-between items-center mb-3">
              <button
                type="button"
                onClick={() => setVisualizerMode("hue")}
                className={`text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 ${visualizerMode === "hue" ? "text-indigo-600" : "text-gray-500 hover:text-gray-800"}`}
              >
                <div
                  className={`w-2 h-2 rounded-full ${visualizerMode === "hue" ? "bg-indigo-600" : "bg-gray-300"}`}
                />
                Hue Path
              </button>
              <select
                value={hCurve}
                onChange={(e) => setHCurve(e.target.value as any)}
                className="text-[10px] bg-white border border-gray-200 rounded px-1 py-0.5 uppercase font-mono"
              >
                {Object.keys(Curves).map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 mb-2">
              <div className="flex-1">
                <Slider
                  label="Start"
                  value={hStart}
                  min={0}
                  max={360}
                  step={1}
                  onChange={setHStart}
                  unit="°"
                />
              </div>
              <ArrowRight size={10} className="text-gray-300 mt-2" />
              <div className="flex-1">
                <Slider
                  label="End"
                  value={hEnd}
                  min={0}
                  max={360}
                  step={1}
                  onChange={setHEnd}
                  unit="°"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-200/50">
              <RotateCw size={12} className="text-muted-foreground" />
              <div className="flex-1">
                <Slider
                  label="Rotations"
                  value={hRotations}
                  min={-3}
                  max={3}
                  step={0.1}
                  onChange={setHRotations}
                />
              </div>
            </div>

            <div className="mt-2">
              <Slider
                label="Curve Accent"
                value={hAccent}
                min={0.1}
                max={5}
                step={0.1}
                onChange={setHAccent}
              />
            </div>
          </section>

          {/* TRACK B: CHROMA */}
          <section className="bg-gray-50 p-3 rounded-xl border border-gray-100">
            <div className="flex justify-between items-center mb-3">
              <button
                type="button"
                onClick={() => setVisualizerMode("chroma")}
                className={`text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 ${visualizerMode === "chroma" ? "text-pink-600" : "text-gray-500 hover:text-gray-800"}`}
              >
                <div
                  className={`w-2 h-2 rounded-full ${visualizerMode === "chroma" ? "bg-pink-600" : "bg-gray-300"}`}
                />
                Chroma Path
              </button>
              <select
                value={cCurve}
                onChange={(e) => setCCurve(e.target.value as any)}
                className="text-[10px] bg-white border border-gray-200 rounded px-1 py-0.5 uppercase font-mono"
              >
                {Object.keys(Curves).map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 mb-2">
              <div className="flex-1">
                <Slider
                  label="Start"
                  value={cStart}
                  min={0}
                  max={0.3}
                  step={0.01}
                  onChange={setCStart}
                />
              </div>
              <ArrowRight size={10} className="text-gray-300 mt-2" />
              <div className="flex-1">
                <Slider
                  label="End"
                  value={cEnd}
                  min={0}
                  max={0.3}
                  step={0.01}
                  onChange={setCEnd}
                />
              </div>
            </div>
            <Slider
              label="Curve Accent"
              value={cAccent}
              min={0.1}
              max={5}
              step={0.1}
              onChange={setCAccent}
            />
          </section>

          {/* TRACK C: LIGHTNESS */}
          <section className="bg-gray-50 p-3 rounded-xl border border-gray-100">
            <div className="flex justify-between items-center mb-3">
              <button
                type="button"
                onClick={() => setVisualizerMode("lightness")}
                className={`text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 ${visualizerMode === "lightness" ? "text-gray-800" : "text-gray-500 hover:text-gray-800"}`}
              >
                <div
                  className={`w-2 h-2 rounded-full ${visualizerMode === "lightness" ? "bg-gray-800" : "bg-gray-300"}`}
                />
                Lightness Path
              </button>
              <select
                value={lCurve}
                onChange={(e) => setLCurve(e.target.value as any)}
                className="text-[10px] bg-white border border-gray-200 rounded px-1 py-0.5 uppercase font-mono"
              >
                {Object.keys(Curves).map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 mb-2">
              <div className="flex-1">
                <Slider
                  label="Start"
                  value={lStart}
                  min={0}
                  max={1}
                  step={0.01}
                  onChange={setLStart}
                />
              </div>
              <ArrowRight size={10} className="text-gray-300 mt-2" />
              <div className="flex-1">
                <Slider
                  label="End"
                  value={lEnd}
                  min={0}
                  max={1}
                  step={0.01}
                  onChange={setLEnd}
                />
              </div>
            </div>
            <Slider
              label="Curve Accent"
              value={lAccent}
              min={0.1}
              max={5}
              step={0.1}
              onChange={setLAccent}
            />
          </section>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50">
          <div className="text-[10px] font-mono text-muted-foreground mb-2">
            JSON OUTPUT
          </div>
          <div className="bg-white p-2 rounded border border-gray-200 text-[10px] font-mono truncate text-gray-500 select-all cursor-pointer hover:border-black transition-colors">
            {JSON.stringify({ hStart, hEnd, hRotations, hCurve })}
          </div>
        </div>
      </aside>

      {/* --- PREVIEW --- */}
      <main className="flex-1 relative flex flex-col">
        <div
          className="absolute inset-0 z-0"
          style={{ background: gradientString }}
        />

        <div className="relative z-10 flex-col flex gap-4 items-start p-4">
          <button
            type="button"
            onClick={randomizeSettings}
            className="backdrop-blur p-2 rounded-full hover:scale-115 transition-transform cursor-pointer"
          >
            <Dices size={18} />
          </button>
          <button
            type="button"
            onClick={() => setFullscreen(!fullscreen)}
            className="backdrop-blur p-2 rounded-full hover:scale-115 transition-transform cursor-pointer"
          >
            {fullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </button>
        </div>

        <div className="relative z-10 flex-1 flex flex-col justify-center items-center p-12 gap-8">
          <div className="w-full max-w-4xl h-24 bg-white/20 backdrop-blur-md rounded-2xl shadow-2xl p-2 ring-1 ring-white/20">
            <div className="w-full h-full flex rounded-xl overflow-hidden">
              {palette.ramps[0].map((c, i) => (
                <PaletteBlock
                  key={`${i}-${c.h}-${c.c}-${c.l}`}
                  color={c}
                  role={i === 0 ? "Start" : i === steps - 1 ? "End" : `${i}`}
                />
              ))}
            </div>
          </div>

          <div
            className="w-full max-w-4xl h-64 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 overflow-hidden relative"
            style={{
              background: getCssStringWithAlpha(palette.surfaceColor, 0.4),
            }}
          >
            {/* Visualizer Controls Overlay */}
            <div className="absolute top-4 right-4 flex gap-2 z-10">
              <button
                type="button"
                onClick={() => setVisualizerMode("3d")}
                className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1 ${
                  visualizerMode === "3d"
                    ? "bg-white text-black shadow-sm"
                    : "bg-black/5 text-black/40 hover:bg-black/10"
                }`}
              >
                <Box size={10} /> 3D Helix
              </button>
              {(["lightness", "chroma", "hue"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setVisualizerMode(m)}
                  className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${
                    visualizerMode === m
                      ? "bg-white text-black shadow-sm"
                      : "bg-black/5 text-black/40 hover:bg-black/10"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>

            {visualizerMode === "3d" ? (
              <HelixVisualizer3D ramp={palette.ramps[0]} />
            ) : (
              <PathVisualizer2D ramp={palette.ramps[0]} mode={visualizerMode} />
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
            <div
              className="rounded-3xl p-8 shadow-xl flex flex-col justify-between h-64 relative overflow-hidden group"
              style={{ background: getCssString(palette.surfaceColor) }}
            >
              <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                <Zap size={120} />
              </div>
              <div>
                <h2
                  className="text-5xl font-bold tracking-tighter mb-2"
                  style={{ color: getCssString(palette.primaryColor) }}
                >
                  Display.
                </h2>
                <p
                  className="font-medium opacity-60 max-w-[200px]"
                  style={{ color: getCssString(palette.ramps[0][steps - 1]) }}
                >
                  Generative ramps using {hCurve} interpolation logic.
                </p>
              </div>
              <div className="flex gap-2">
                <div
                  className="px-4 py-2 rounded-lg font-bold text-xs uppercase text-white shadow-lg"
                  style={{ background: getCssString(palette.primaryColor) }}
                >
                  Primary
                </div>
                <div
                  className="px-4 py-2 rounded-lg font-bold text-xs uppercase"
                  style={{
                    background: getCssString(palette.accentColor),
                    color: palette.accentColorForeground,
                  }}
                >
                  Secondary
                </div>
              </div>
            </div>

            <div className="bg-black/5 backdrop-blur-sm rounded-3xl p-1 overflow-hidden shadow-xl ring-1 ring-black/5 relative h-64">
              <div className="absolute inset-0 z-0">
                <GenerativeMosaic palette={palette} />
              </div>
              <div className="absolute inset-0 z-10 flex flex-col justify-end p-6 bg-gradient-to-t from-black/80 via-transparent to-transparent">
                <div className="text-white">
                  <div className="text-xs font-mono opacity-70 mb-1">
                    Contrast Check
                  </div>
                  <div className="text-2xl font-bold flex items-center gap-2">
                    {getContrast(
                      palette.surfaceColor.l,
                      palette.primaryColor.l,
                    ).toFixed(2)}
                    :1
                    <Check size={18} className="text-green-400" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
