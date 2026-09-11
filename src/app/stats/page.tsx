import { StatCardLine } from "@/components/charts/stat-card-line";

// demo page for @bklit's chart components (installed via the shadcn
// registry, see components.json). StatCardLine is the starter: a compact
// card pairing a sparkline with a hover-driven animated number
// (ChartStatFlow) and a trend badge - swap `sessions-series.ts` for real
// data and this is production-ready. Grab more chart types the same way:
// `pnpm dlx shadcn@latest add @bklit/<chart-slug>`
export default function Page() {
  return (
    <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3">
      <StatCardLine />
    </div>
  );
}
