import { SourceCodeIcon } from "@hugeicons/core-free-icons";
import type { ReactNode } from "react";
import { LabelTag } from "@/components/LabelTag";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shadcn/ui/card";
import { cn } from "@/shadcn/utils";
import { getShowcaseSlug } from "./sections";

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
    <Card
      id={getShowcaseSlug(name)}
      className={cn("scroll-mt-24", wide && "sm:col-span-2")}
    >
      <CardHeader>
        <CardTitle className="font-mono text-sm">{name}</CardTitle>
        <CardDescription>{description}</CardDescription>
        <span className="font-mono text-xs text-muted-foreground">
          <LabelTag
            icon={SourceCodeIcon}
            label={path}
            href={`https://github.com/1mlm/nextjs-template/blob/main/${path}`}
          />
        </span>
      </CardHeader>
      <CardContent className="flex flex-1 flex-wrap items-center justify-center gap-2">
        <Demo />
      </CardContent>
    </Card>
  );
}
