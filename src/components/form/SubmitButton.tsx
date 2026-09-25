"use client";

import { Loading03Icon } from "@hugeicons/core-free-icons";
import type { IconSvgElement } from "@hugeicons/react";
import type { ComponentProps, ReactNode } from "react";
import { Icon } from "@/components/Icon";
import { Button } from "@/shadcn/ui/button";

// swaps its icon for a spinner while pending, a disabled button with the
// normal icon gives zero hint that anything is happening on a slow request
export function SubmitButton({
  icon,
  pending,
  disabled,
  children,
  ...props
}: Omit<ComponentProps<typeof Button>, "type" | "children"> & {
  icon: IconSvgElement;
  pending: boolean;
  children: ReactNode;
}) {
  return (
    <Button type="submit" disabled={pending || disabled} {...props}>
      <Icon
        icon={pending ? Loading03Icon : icon}
        className={pending ? "animate-spin" : undefined}
      />
      {children}
    </Button>
  );
}
