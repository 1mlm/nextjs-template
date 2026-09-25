"use client";

import { addDays } from "date-fns";
import { useState } from "react";
import { Line, LineChart } from "@/components/charts";
import { Grid } from "@/components/charts/grid";
import { ProjectionLine } from "@/components/charts/projection-line";
import { StatCardLine } from "@/components/charts/stat-card-line";
import { ChartTooltip } from "@/components/charts/tooltip";
import { XAxis } from "@/components/charts/x-axis";
import { Button } from "@/shadcn/ui/button";
import type { ShowcaseItem } from "./ShowcaseCard";

const SERIES_START = new Date("2026-06-01");
const SERIES_DAYS = 30;

// deterministic wobble, a Math.random() here would differ between server and client
const TRAFFIC_SERIES = Array.from({ length: SERIES_DAYS }, (_, day) => ({
  date: addDays(SERIES_START, day),
  visitors: Math.round(1200 + day * 25 + Math.sin(day / 2) * 180),
  signups: Math.round(300 + day * 9 + Math.cos(day / 3) * 70),
}));

const LAST_POINT = TRAFFIC_SERIES[SERIES_DAYS - 1];

const VISITOR_PROJECTION = [
  { date: LAST_POINT.date, value: LAST_POINT.visitors },
  { date: addDays(LAST_POINT.date, 7), value: LAST_POINT.visitors + 260 },
];

const LOADING_STYLES = ["pulse", "sweep"] as const;

function TrafficChartDemo() {
  const [loadingStyle, setLoadingStyle] = useState<
    (typeof LOADING_STYLES)[number] | null
  >(null);

  return (
    <div className="flex w-full flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {LOADING_STYLES.map((style) => (
          <Button
            key={style}
            size="sm"
            variant={loadingStyle === style ? "default" : "outline"}
            onClick={() =>
              setLoadingStyle(loadingStyle === style ? null : style)
            }
          >
            loading: {style}
          </Button>
        ))}
      </div>
      <LineChart
        aspectRatio="2.2 / 1"
        className="w-full"
        data={TRAFFIC_SERIES}
        status={loadingStyle ? "loading" : "ready"}
      >
        <Grid />
        <Line
          dataKey="visitors"
          stroke="var(--chart-1)"
          loadingStyle={loadingStyle ?? undefined}
        />
        <Line
          dataKey="signups"
          stroke="var(--chart-3)"
          loadingStyle={loadingStyle ?? undefined}
        />
        <ProjectionLine data={VISITOR_PROJECTION} stroke="var(--chart-1)" />
        <XAxis />
        <ChartTooltip />
      </LineChart>
    </div>
  );
}

export const CHART_ITEMS: ShowcaseItem[] = [
  {
    name: "LineChart",
    path: "src/components/charts/line-chart.tsx",
    description:
      "two series + grid + x axis + tooltip + a dashed projection. hover it, toggle the loading styles",
    wide: true,
    Demo: TrafficChartDemo,
  },
  {
    name: "StatCardLine",
    path: "src/components/charts/stat-card-line.tsx",
    description: "bklit sparkline card, hover the line to scrub the number",
    Demo: () => (
      <div className="w-full">
        <StatCardLine />
      </div>
    ),
  },
];
