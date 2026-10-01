"use client";

import type { IconSvgElement } from "@hugeicons/react";
import { useLinkStatus } from "next/link";
import { useEffect, useRef } from "react";
import { Icon } from "@/components/Icon";
import type { NAV_ITEMS } from "./nav";

// has to render inside the <Link>, that's where useLinkStatus reads the
// pending navigation from. the dev server compiling a page can take seconds.
// the animated icon only plays on its own hover, so the whole link row
// (sidebar label, tab bar cell) is wired to it here
export function NavLinkIcon({
  icon,
  animatedIcon: AnimatedIcon,
  size,
}: {
  icon: IconSvgElement;
  animatedIcon: (typeof NAV_ITEMS)[number]["animatedIcon"];
  size: number;
}) {
  const { pending } = useLinkStatus();
  const animatedIconRef = useRef<React.ComponentRef<typeof AnimatedIcon>>(null);
  const wrapperRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const link = wrapperRef.current?.closest("a");
    if (!link) return;
    const startAnimation = () => animatedIconRef.current?.startAnimation();
    const stopAnimation = () => animatedIconRef.current?.stopAnimation();
    link.addEventListener("pointerenter", startAnimation);
    link.addEventListener("focus", startAnimation);
    link.addEventListener("pointerleave", stopAnimation);
    link.addEventListener("blur", stopAnimation);
    return () => {
      link.removeEventListener("pointerenter", startAnimation);
      link.removeEventListener("focus", startAnimation);
      link.removeEventListener("pointerleave", stopAnimation);
      link.removeEventListener("blur", stopAnimation);
    };
  }, []);

  // data-nav-pending drives the page-wide progress cursor in globals.css
  return (
    <span
      ref={wrapperRef}
      className="inline-flex shrink-0 [&_svg]:overflow-visible"
    >
      {pending ? (
        <Icon
          icon={icon}
          isLoading
          style={{ width: size, height: size }}
          data-nav-pending
        />
      ) : (
        <AnimatedIcon ref={animatedIconRef} {...{ size }} />
      )}
    </span>
  );
}
