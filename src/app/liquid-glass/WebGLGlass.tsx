"use client";

import liquidGL from "liquid-gl";
import { useEffect } from "react";
import {
  Backdrop,
  GLASS_SIZE,
  GLASS_START,
  Stage,
  ToolbarIcons,
} from "./Stage";

const STAGE_ID = "liquidgl-stage";
const TARGET_CLASS = "liquidgl-target";

// naughtyduk/liquidGL: snapshots the stage into a texture and runs a real
// refraction shader over it (webgpu, falling back to webgl). the page behind
// is a picture taken on mount, not the live dom
export default function WebGLGlass() {
  useEffect(() => {
    const lens = liquidGL({
      snapshot: `#${STAGE_ID}`,
      target: `.${TARGET_CLASS}`,
      refraction: 0.006,
      bevelDepth: 0.012,
      bevelWidth: 0.25,
      aberration: 0,
      frost: 0,
      specular: true,
      draggable: true,
    });
    return () => lens?.destroy();
  }, []);

  return (
    <Stage id={STAGE_ID}>
      <Backdrop />
      <div
        className={`${TARGET_CLASS} absolute z-10 rounded-full`}
        style={{ ...GLASS_SIZE, ...GLASS_START }}
      >
        <ToolbarIcons />
      </div>
    </Stage>
  );
}
