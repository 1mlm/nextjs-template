import { type HugeIcon, Icon } from "@/components/Icon";

// icon + label on a soft squircle background — the non-interactive cousin
// of a badge/chip, for naming a *thing* inside a sentence rather than
// a user or a status (a document type, an event title)
export function LabelTag({ icon, label }: { icon: HugeIcon; label: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-lg corner-squircle bg-muted px-1.5 py-0.5 align-middle font-medium">
      <Icon icon={icon} className="size-3.5 text-muted-foreground" />
      {label}
    </span>
  );
}
