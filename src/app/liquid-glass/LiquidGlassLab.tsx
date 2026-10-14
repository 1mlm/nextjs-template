"use client";

import {
  Atom01Icon,
  BlurIcon,
  CpuIcon,
  DropletIcon,
  ReactIcon,
} from "@hugeicons/core-free-icons";
import dynamic from "next/dynamic";
import { useState } from "react";
import { LabelTag } from "@/components/LabelTag";
import { ScrollRow } from "@/components/ScrollRow";
import { SlidingTabs } from "@/components/SlidingTabs";
import { Stage } from "./Stage";

// each one is its own chunk and never server rendered, they all need canvas
// or webgl, and only the open tab is mounted so two render loops never fight
const loadGlass = (load: Parameters<typeof dynamic>[0]) =>
  dynamic(load, {
    ssr: false,
    loading: () => <Stage className="animate-pulse bg-muted" />,
  });

const VARIANTS = [
  {
    value: "physics",
    label: "Physics",
    icon: Atom01Icon,
    source: "https://kube.io/blog/liquid-glass-css-svg/",
    credit: "kube.io",
    note: "snell's law squircle rim, svg backdrop-filter, refracts the live page. chromium only",
    Glass: loadGlass(() => import("./PhysicsGlass")),
  },
  {
    value: "react",
    label: "liquid-glass-react",
    icon: ReactIcon,
    source: "https://github.com/rdev/liquid-glass-react",
    credit: "rdev",
    note: "svg displacement with chromatic aberration, follows the cursor instead of dragging. chromium only",
    Glass: loadGlass(() => import("./ReactGlass")),
  },
  {
    value: "liquidgl",
    label: "liquidGL",
    icon: CpuIcon,
    source: "https://github.com/naughtyduk/liquidGL",
    credit: "naughtyduk",
    note: "webgpu/webgl shader over a snapshot of the stage, every browser",
    Glass: loadGlass(() => import("./WebGLGlass")),
  },
  {
    value: "shader",
    label: "ybouane",
    icon: DropletIcon,
    source: "https://liquid-glass.ybouane.com",
    credit: "ybouane",
    note: "webgl shader with fresnel and specular over an html-to-image capture, every browser",
    Glass: loadGlass(() => import("./ShaderGlass")),
  },
  {
    value: "frosted",
    label: "Frosted (fake)",
    icon: BlurIcon,
    source: "https://css.glass",
    credit: "css.glass",
    note: "plain glassmorphism, blur and a border, the baseline everything above should beat",
    Glass: loadGlass(() => import("./FrostedGlass")),
  },
] as const;

type VariantId = (typeof VARIANTS)[number]["value"];

export function LiquidGlassLab() {
  const [variantId, setVariantId] = useState<VariantId>("physics");
  const variant =
    VARIANTS.find(({ value }) => value === variantId) ?? VARIANTS[0];

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-5 px-4 py-10">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">Liquid Glass</h1>
        <p className="text-sm text-muted-foreground">
          every real attempt at apple's glass on the web, same pill over the
          same page. drag it around
        </p>
      </header>
      <ScrollRow>
        <SlidingTabs
          tabs={[...VARIANTS]}
          value={variantId}
          onValueChange={setVariantId}
          className="whitespace-nowrap"
        />
      </ScrollRow>
      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <span>{variant.note}</span>
        <LabelTag
          icon={variant.icon}
          label={variant.credit}
          href={variant.source}
        />
      </div>
      <variant.Glass key={variant.value} />
    </div>
  );
}
