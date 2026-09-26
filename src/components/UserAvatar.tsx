import type { ReactNode } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/shadcn/ui/avatar";
import { cn } from "@/shadcn/utils";

const getInitials = (name: string) =>
  name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

// profile picture with the person's initials as the fallback, the one avatar
// every user facing spot uses so they all look the same
export function UserAvatar({
  name,
  src,
  className,
  children,
}: {
  name: string;
  src?: string;
  className?: string;
  // e.g. an AvatarBadge
  children?: ReactNode;
}) {
  return (
    <Avatar className={cn("size-8", className)}>
      {src && <AvatarImage {...{ src }} alt={name} className="object-cover" />}
      <AvatarFallback className="bg-muted text-xs font-semibold">
        {getInitials(name)}
      </AvatarFallback>
      {children}
    </Avatar>
  );
}
