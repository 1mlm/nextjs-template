"use client";

import { LiquidGlass } from "@ybouane/liquidglass";
import { useEffect, useRef } from "react";
import {
  Backdrop,
  GLASS_SIZE,
  GLASS_START,
  Stage,
  ToolbarIcons,
} from "./Stage";

// ybouane/liquidglass: rasterises the stage with html-to-image, then a webgl
// shader does refraction, fresnel, specular and a rim. glass has to be a
// direct child of the root it captures
export default function ShaderGlass() {
  const stageRef = useRef<HTMLDivElement>(null);
  const glassRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!stageRef.current || !glassRef.current) return;
    const instance = LiquidGlass.init({
      root: stageRef.current,
      glassElements: [glassRef.current],
      defaults: {
        cornerRadius: GLASS_SIZE.height / 2,
        zRadius: 24,
        refraction: 0.8,
        chromAberration: 0.08,
        edgeHighlight: 0.15,
        specular: 0.4,
        floating: true,
      },
    });
    return () => {
      instance.then((glass) => glass.destroy());
    };
  }, []);

  return (
    <Stage ref={stageRef}>
      <Backdrop />
      <div
        ref={glassRef}
        // the injected canvas sits at z-index -1, so the glass needs its own
        // stacking context or the canvas falls behind the whole stage
        className="absolute z-10"
        style={{ ...GLASS_SIZE, ...GLASS_START }}
      >
        <ToolbarIcons />
      </div>
    </Stage>
  );
}
