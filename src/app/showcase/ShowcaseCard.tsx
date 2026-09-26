import type { ReactNode } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shadcn/ui/card";

export type ShowcaseItem = {
  name: string;
  path: string;
  description: string;
  // spans two grid columns, for demos that need room (charts)
  wide?: boolean;
  Demo: () => ReactNode;
};

export function ShowcaseCard({
  name,
  path,
  description,
  wide,
  Demo,
}: ShowcaseItem) {
  return (
    <Card className={wide ? "sm:col-span-2" : undefined}>
      <CardHeader>
        <CardTitle className="font-mono text-sm">{name}</CardTitle>
        <CardDescription>{description}</CardDescription>
        <code className="truncate text-xs text-muted-foreground/70">
          {path}
        </code>
      </CardHeader>
      <CardContent className="flex flex-1 flex-wrap items-center justify-center gap-2">
        <Demo />
      </CardContent>
    </Card>
  );
}
