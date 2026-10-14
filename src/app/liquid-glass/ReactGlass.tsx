"use client";

import LiquidGlass from "liquid-glass-react";
import { useRef } from "react";
import {
  Backdrop,
  GLASS_SIZE,
  GLASS_START,
  Stage,
  ToolbarIcons,
} from "./Stage";

// rdev/liquid-glass-react: svg displacement too, but it can't be dragged, it
// leans toward the cursor instead and centers itself with a -50% translate
export default function ReactGlass() {
  const stageRef = useRef<HTMLDivElement>(null);
  return (
    <Stage ref={stageRef}>
      <Backdrop />
      <LiquidGlass
        mouseContainer={stageRef}
        cornerRadius={GLASS_SIZE.height / 2}
        displacementScale={70}
        blurAmount={0.05}
        elasticity={0.2}
        padding="0"
        style={{
          position: "absolute",
          top: GLASS_START.top + GLASS_SIZE.height / 2,
          left: "50%",
        }}
      >
        <div style={GLASS_SIZE}>
          <ToolbarIcons />
        </div>
      </LiquidGlass>
    </Stage>
  );
}
