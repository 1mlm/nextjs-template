import { HugeiconsIcon as HugeiconsIconBase } from "@hugeicons/react";
import type { ComponentProps } from "react";

export function Icon({
  strokeWidth = 2,
  ...props
}: ComponentProps<typeof HugeiconsIconBase>) {
  return <HugeiconsIconBase {...{ strokeWidth }} {...props} />;
}
