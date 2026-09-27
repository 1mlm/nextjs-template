"use client";

import { addDays } from "date-fns";
import { useState } from "react";
import { Line, LineChart } from "@/components/charts";
import { Grid } from "@/components/charts/grid";
import { PieChart, type PieSlice } from "@/components/charts/pie-chart";
import { ProjectionLine } from "@/components/charts/projection-line";
import { StatCardLine } from "@/components/charts/stat-card-line";
import { ChartTooltip } from "@/components/charts/tooltip";
import { XAxis } from "@/components/charts/x-axis";
import { YAxis } from "@/components/charts/y-axis";
import { Button } from "@/shadcn/ui/button";
import { getColorSwatch } from "@/utils/color";
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

// two series with very different sizes, each on its own axis in its own
// color, otherwise signups would be a flat line at the bottom
const TRAFFIC_LINES = [
  {
    dataKey: "visitors",
    label: "Visitors",
    color: getColorSwatch("sky"),
    yAxisId: "left",
    side: "left",
  },
  {
    dataKey: "signups",
    label: "Signups",
    color: getColorSwatch("violet"),
    yAxisId: "right",
    side: "right",
  },
] as const;

// the series' display names in the tooltip, not the raw data keys
const getTrafficTooltipRows = (point: Record<string, unknown>) =>
  TRAFFIC_LINES.map(({ dataKey, label, color }) => ({
    label,
    color,
    value: Number(point[dataKey]),
  }));

const TRAFFIC_SOURCES: PieSlice[] = [
  { id: "search", label: "Search", value: 4820, color: getColorSwatch("sky") },
  {
    id: "social",
    label: "Social",
    value: 2710,
    color: getColorSwatch("violet"),
  },
  {
    id: "direct",
    label: "Direct",
    value: 1940,
    color: getColorSwatch("emerald"),
  },
  { id: "email", label: "Email", value: 860, color: getColorSwatch("amber") },
  { id: "other", label: "Other", value: 410, color: getColorSwatch("rose") },
];

function TrafficChartDemo() {
  const [loadingStyle, setLoadingStyle] = useState<
    (typeof LOADING_STYLES)[number] | null
  >(null);

  return (
    <div className="flex w-full flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        {TRAFFIC_LINES.map(({ label, color }) => (
          <span key={label} className="flex items-center gap-1.5 text-sm">
            <span
              style={{ background: color }}
              className="h-1 w-4 rounded-full"
            />
            {label}
          </span>
        ))}
        <span className="flex-1" />
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
        {TRAFFIC_LINES.map(({ dataKey, color, yAxisId }) => (
          <Line
            key={dataKey}
            {...{ dataKey, yAxisId }}
            stroke={color}
            loadingStyle={loadingStyle ?? undefined}
          />
        ))}
        {TRAFFIC_LINES.map(({ label, color, yAxisId, side }) => (
          <YAxis key={label} {...{ label, color, yAxisId, side }} />
        ))}
        <ProjectionLine
          data={VISITOR_PROJECTION}
          stroke={TRAFFIC_LINES[0].color}
        />
        <XAxis />
        <ChartTooltip rows={getTrafficTooltipRows} />
      </LineChart>
    </div>
  );
}

export const CHART_ITEMS: ShowcaseItem[] = [
  {
    name: "LineChart",
    path: "src/components/charts/line-chart.tsx",
    description:
      "visitors on the left axis, signups on the right, each in its line's color, a dashed projection and a tooltip. hover it, toggle the loading styles",
    wide: true,
    Demo: TrafficChartDemo,
  },
  {
    name: "StatCardLine",
    path: "src/components/charts/stat-card-line.tsx",
    description:
      "sparkline card, hover the line: a crosshair lands on the day and the corner shows its value",
    Demo: () => (
      <div className="w-full">
        <StatCardLine />
      </div>
    ),
  },
  {
    name: "PieChart",
    path: "src/components/charts/pie-chart.tsx",
    description:
      "donut with the total in the middle, hover a slice or a legend row: it slides out and the middle shows its share",
    Demo: () => (
      <PieChart data={TRAFFIC_SOURCES} totalLabel="Visits" className="w-full" />
    ),
  },
];
