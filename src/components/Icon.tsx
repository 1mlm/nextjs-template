import {
  HugeiconsIcon as HugeiconsIconBase,
  type HugeiconsIconProps,
} from "@hugeicons/react";
import type { ComponentProps } from "react";
import { cn } from "@/shadcn/utils";

export type HugeIcon = HugeiconsIconProps["icon"];

export function Icon({
  strokeWidth = 2,
  className,
  ...props
}: ComponentProps<typeof HugeiconsIconBase>) {
  return <HugeiconsIconBase
    className={cn("size-[1em]", className)}
    {...{ strokeWidth }}
    {...props} />;
}
