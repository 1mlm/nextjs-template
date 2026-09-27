import {
  ArrowUpRight01Icon,
  SquaresUniteIcon,
} from "@hugeicons/core-free-icons";
import type { IconSvgElement } from "@hugeicons/react";
import { Icon } from "@/components/Icon";
import { cn } from "@/shadcn/utils";

const TAG_CLASS =
  "group/tag inline-flex items-center gap-1 rounded-lg bg-foreground/8 px-1.5 py-0.5 align-middle font-medium select-all";

// icon + label on a soft squircle background, for naming a *thing* inside a
// sentence (a document, an event title). give it an `href` and it links out
// (an arrow slides in on hover), or an `onOpen` and it opens a popup (a
// popup icon slides in instead)
export function LabelTag({
  icon,
  label,
  href,
  onOpen,
}: {
  icon: IconSvgElement;
  label: string;
  href?: string;
  onOpen?: () => void;
}) {
  const content = (
    <>
      <Icon {...{ icon }} className="size-3.5 text-muted-foreground" />
      {label}
    </>
  );
  if (!href && !onOpen) return <span className={TAG_CLASS}>{content}</span>;

  const interactiveClass = cn(
    TAG_CLASS,
    "cursor-pointer transition-[background-color,translate] outline-none hover:-translate-y-px hover:bg-foreground/14 focus-visible:ring-2 focus-visible:ring-ring active:translate-y-0",
  );
  const trailing = (
    <HoverRevealIcon icon={href ? ArrowUpRight01Icon : SquaresUniteIcon} />
  );
  return href ? (
    <a
      {...{ href }}
      target="_blank"
      rel="noreferrer"
      className={interactiveClass}
    >
      {content}
      {trailing}
    </a>
  ) : (
    <button type="button" onClick={onOpen} className={interactiveClass}>
      {content}
      {trailing}
    </button>
  );
}

// grows from zero width so the tag widens smoothly instead of jumping, and
// the icon drifts in from the bottom left. always shown on touch, no hover there
function HoverRevealIcon({ icon }: { icon: IconSvgElement }) {
  return (
    <span className="-ml-1 grid grid-cols-[0fr] transition-[grid-template-columns,margin] duration-200 ease-out group-hover/tag:ml-0 group-hover/tag:grid-cols-[1fr] group-focus-visible/tag:ml-0 group-focus-visible/tag:grid-cols-[1fr] pointer-coarse:ml-0 pointer-coarse:grid-cols-[1fr]">
      <span className="overflow-hidden">
        <Icon
          {...{ icon }}
          className="size-3.5 -translate-x-1 translate-y-1 text-muted-foreground opacity-0 transition duration-200 ease-out group-hover/tag:translate-0 group-hover/tag:opacity-100 group-focus-visible/tag:translate-0 group-focus-visible/tag:opacity-100 pointer-coarse:translate-0 pointer-coarse:opacity-100"
        />
      </span>
    </span>
  );
}
