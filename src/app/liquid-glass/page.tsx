import type { Metadata } from "next";
import { LiquidGlassLab } from "./LiquidGlassLab";

export const metadata: Metadata = { title: "Liquid Glass" };

export default function Page() {
  return <LiquidGlassLab />;
}
