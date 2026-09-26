"use client";

import type { IconSvgElement } from "@hugeicons/react";
import { useLinkStatus } from "next/link";
import { Icon } from "@/components/Icon";

// has to render inside the <Link>, that's where useLinkStatus reads the
// pending navigation from. the dev server compiling a page can take seconds
export function NavLinkIcon({
  icon,
  className,
}: {
  icon: IconSvgElement;
  className: string;
}) {
  const { pending } = useLinkStatus();
  // data-nav-pending drives the page-wide progress cursor in globals.css
  return (
    <Icon
      {...{ icon, className }}
      isLoading={pending}
      data-nav-pending={pending || undefined}
    />
  );
}
