import { StatCardLine } from "@/components/charts/stat-card-line";

// demo for the @bklit charts (pulled in through the shadcn registry, see
// components.json). swap sessions-series.ts for real data and it just works.
// more chart types: `pnpm dlx shadcn@latest add @bklit/<chart-slug>`
export default function Page() {
  return (
    <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3">
      <StatCardLine />
    </div>
  );
}
