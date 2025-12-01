import type { EasingPreset } from "@scottbaggett/color-engine";
import { ColorEngine } from "@scottbaggett/color-engine";
import { createFileRoute } from "@tanstack/react-router";
import { Check, Copy, Dices } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/engine")({
  component: EngineTestPage,
});

const EASING_PRESETS: EasingPreset[] = [
  "linear",
  "easeIn",
  "easeOut",
  "easeInOut",
  "softStart",
  "softEnd",
  "peakEarly",
  "valleyEarly",
  "midSurge",
  "bounce",
  "wave",
  "material",
];

interface ControlSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  unit?: string;
}

function ControlSlider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  unit = "",
}: ControlSliderProps) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between">
        <Label className="text-muted-foreground">{label}</Label>
        <span className="text-sm font-mono text-muted-foreground">
          {value.toFixed(step < 0.1 ? 2 : step < 1 ? 1 : 0)}
          {unit}
        </span>
      </div>
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={(values) => onChange(values[0])}
      />
    </div>
  );
}

interface EasingSelectProps {
  value: EasingPreset;
  onValueChange: (value: EasingPreset) => void;
}

function EasingSelect({ value, onValueChange }: EasingSelectProps) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger size="sm" className="w-auto text-xs">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {EASING_PRESETS.map((preset) => (
          <SelectItem key={preset} value={preset}>
            {preset}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function EngineTestPage() {
  // Seed state
  const [seed, setSeed] = useState<string | number>("color-engine");

  // Steps
  const [steps, setSteps] = useState(12);

  // Hue controls
  const [hueStart, setHueStart] = useState<number | undefined>(undefined);
  const [hueEnd, setHueEnd] = useState<number | undefined>(undefined);
  const [hueRotations, setHueRotations] = useState(0);
  const [hueEasing, setHueEasing] = useState<EasingPreset>("softStart");

  // Chroma controls
  const [chromaStart, setChromaStart] = useState(0.04);
  const [chromaEnd, setChromaEnd] = useState(0.18);
  const [chromaEasing, setChromaEasing] = useState<EasingPreset>("easeInOut");

  // Lightness controls
  const [lightnessStart, setLightnessStart] = useState(0.98);
  const [lightnessEnd, setLightnessEnd] = useState(0.12);
  const [lightnessEasing, setLightnessEasing] =
    useState<EasingPreset>("easeOut");

  // Copy state
  const [copied, setCopied] = useState(false);

  // Generate palette using the engine
  const result = useMemo(() => {
    const engine = new ColorEngine(seed);
    return engine.ramp({
      steps,
      hue: {
        start: hueStart,
        end: hueEnd,
        rotations: hueRotations,
        easing: hueEasing,
      },
      chroma: {
        start: chromaStart,
        end: chromaEnd,
        easing: chromaEasing,
      },
      lightness: {
        start: lightnessStart,
        end: lightnessEnd,
        easing: lightnessEasing,
      },
    });
  }, [
    seed,
    steps,
    hueStart,
    hueEnd,
    hueRotations,
    hueEasing,
    chromaStart,
    chromaEnd,
    chromaEasing,
    lightnessStart,
    lightnessEnd,
    lightnessEasing,
  ]);

  const cssOutput = result.css();

  const randomizeSeed = () => {
    setSeed(Math.random().toString(36).substring(2, 10));
  };

  const copyCSS = () => {
    navigator.clipboard.writeText(cssOutput.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-background p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Color Engine Test
          </h1>
          <p className="text-muted-foreground">
            Testing{" "}
            <code className="bg-surface-4 text-foreground px-1.5 py-0.5 rounded text-sm font-mono">
              @scottbaggett/color-engine
            </code>
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Controls Panel */}
          <div className="lg:col-span-4 space-y-4">
            {/* Seed */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle>Seed</CardTitle>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={randomizeSeed}
                    title="Randomize seed"
                  >
                    <Dices className="size-4" />
                  </Button>
                </div>
                <CardDescription>Engine seed: {result.seed}</CardDescription>
              </CardHeader>
              <CardContent>
                <Input
                  value={String(seed)}
                  onChange={(e) => setSeed(e.target.value)}
                  className="font-mono"
                />
              </CardContent>
            </Card>

            {/* Global */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Global</CardTitle>
              </CardHeader>
              <CardContent>
                <ControlSlider
                  label="Steps"
                  value={steps}
                  min={3}
                  max={24}
                  step={1}
                  onChange={setSteps}
                />
              </CardContent>
            </Card>

            {/* Hue */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle>Hue</CardTitle>
                  <EasingSelect
                    value={hueEasing}
                    onValueChange={setHueEasing}
                  />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ControlSlider
                  label="Start (0 = random)"
                  value={hueStart ?? 0}
                  min={0}
                  max={360}
                  step={1}
                  onChange={(v) => setHueStart(v === 0 ? undefined : v)}
                  unit="°"
                />
                <ControlSlider
                  label="End (0 = random)"
                  value={hueEnd ?? 0}
                  min={0}
                  max={360}
                  step={1}
                  onChange={(v) => setHueEnd(v === 0 ? undefined : v)}
                  unit="°"
                />
                <ControlSlider
                  label="Rotations"
                  value={hueRotations}
                  min={-3}
                  max={3}
                  step={0.5}
                  onChange={setHueRotations}
                />
              </CardContent>
            </Card>

            {/* Chroma */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle>Chroma</CardTitle>
                  <EasingSelect
                    value={chromaEasing}
                    onValueChange={setChromaEasing}
                  />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ControlSlider
                  label="Start"
                  value={chromaStart}
                  min={0}
                  max={0.4}
                  step={0.01}
                  onChange={setChromaStart}
                />
                <ControlSlider
                  label="End"
                  value={chromaEnd}
                  min={0}
                  max={0.4}
                  step={0.01}
                  onChange={setChromaEnd}
                />
              </CardContent>
            </Card>

            {/* Lightness */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle>Lightness</CardTitle>
                  <EasingSelect
                    value={lightnessEasing}
                    onValueChange={setLightnessEasing}
                  />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ControlSlider
                  label="Start"
                  value={lightnessStart}
                  min={0}
                  max={1}
                  step={0.01}
                  onChange={setLightnessStart}
                />
                <ControlSlider
                  label="End"
                  value={lightnessEnd}
                  min={0}
                  max={1}
                  step={0.01}
                  onChange={setLightnessEnd}
                />
              </CardContent>
            </Card>
          </div>

          {/* Preview Panel */}
          <div className="lg:col-span-8 space-y-4">
            {/* Color Ramp */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Color Ramp</CardTitle>
                <CardDescription>
                  {steps} colors generated with seed "{String(seed)}"
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-20 flex rounded-lg overflow-hidden border border-border">
                  {result.ramp.map((color, i) => (
                    <div
                      key={`ramp-${i}-${color.h}`}
                      className="flex-1 relative group cursor-pointer transition-all hover:flex-[2]"
                      style={{
                        backgroundColor: `oklch(${color.l * 100}% ${color.c} ${color.h})`,
                      }}
                    >
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-black/60 text-white">
                          {i}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Semantic Roles */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Semantic Roles</CardTitle>
                <CardDescription>
                  Automatically assigned color roles
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  {Object.entries(result.roles).map(([name, color]) => (
                    <div key={name} className="text-center">
                      <div
                        className="h-16 rounded-lg mb-2 border border-border"
                        style={{
                          backgroundColor: `oklch(${color.l * 100}% ${color.c} ${color.h})`,
                        }}
                      />
                      <span className="text-xs font-mono text-muted-foreground capitalize">
                        {name}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* CSS Output */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>CSS Output</CardTitle>
                    <CardDescription>OKLCH color values</CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyCSS}
                    className="gap-1.5"
                  >
                    {copied ? (
                      <>
                        <Check className="size-3.5" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="size-3.5" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="bg-surface-12 rounded-lg p-4 overflow-x-auto">
                  <pre className="text-xs font-mono">
                    {cssOutput.map((css, i) => (
                      <div key={css} className="flex items-center gap-3 py-0.5">
                        <span className="text-surface-8 w-5 text-right">
                          {i}
                        </span>
                        <span
                          className="inline-block w-4 h-4 rounded-sm border border-surface-10"
                          style={{ backgroundColor: css }}
                        />
                        <span className="text-surface-2">{css}</span>
                      </div>
                    ))}
                  </pre>
                </div>
              </CardContent>
            </Card>

            {/* Raw Data Table */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Raw OKLCH Data</CardTitle>
                <CardDescription>
                  Lightness, Chroma, and Hue values
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-surface-3 rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-2.5 px-3 font-medium text-muted-foreground">
                          #
                        </th>
                        <th className="text-left py-2.5 px-3 font-medium text-muted-foreground">
                          L
                        </th>
                        <th className="text-left py-2.5 px-3 font-medium text-muted-foreground">
                          C
                        </th>
                        <th className="text-left py-2.5 px-3 font-medium text-muted-foreground">
                          H
                        </th>
                        <th className="text-left py-2.5 px-3 font-medium text-muted-foreground">
                          Preview
                        </th>
                      </tr>
                    </thead>
                    <tbody className="font-mono text-xs">
                      {result.ramp.map((color, i) => (
                        <tr
                          key={`row-${color.l}-${color.c}-${color.h}`}
                          className={cn(
                            "border-b border-border/50 last:border-0",
                            i % 2 === 0 ? "bg-surface-2" : "bg-surface-3",
                          )}
                        >
                          <td className="py-2 px-3 text-muted-foreground">
                            {i}
                          </td>
                          <td className="py-2 px-3">
                            {(color.l * 100).toFixed(1)}%
                          </td>
                          <td className="py-2 px-3">{color.c.toFixed(3)}</td>
                          <td className="py-2 px-3">{color.h.toFixed(1)}°</td>
                          <td className="py-2 px-3">
                            <div
                              className="w-8 h-5 rounded border border-border"
                              style={{
                                backgroundColor: `oklch(${color.l * 100}% ${color.c} ${color.h})`,
                              }}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
