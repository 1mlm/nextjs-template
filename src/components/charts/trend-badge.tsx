"use client";

import { ArrowDown01Icon, ArrowUp01Icon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/Icon";
import { Badge } from "@/shadcn/ui/badge";
import { getColorStyle } from "@/utils/color";

export function TrendBadge({
  value,
  className,
}: {
  value: number;
  className?: string;
}) {
  const positive = value >= 0;

  return (
    <Badge
      style={positive ? getColorStyle("emerald") : undefined}
      variant={positive ? "outline" : "destructive"}
      className={className}
    >
      <Icon
        icon={positive ? ArrowUp01Icon : ArrowDown01Icon}
        className="size-3"
      />
      {positive ? "+" : ""}
      {value.toFixed(1)}%
    </Badge>
  );
}
