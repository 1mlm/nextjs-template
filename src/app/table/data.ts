import {
  Alert02Icon,
  CheckmarkBadge02Icon,
  Delete02Icon,
} from "@hugeicons/core-free-icons";
import type { CustomTableEnumValue } from "@/components/table/columns";

export const statusOptions = {
  ACTIVE: { label: "Active", icon: CheckmarkBadge02Icon, color: "green" },
  PENDING: { label: "Pending", icon: Alert02Icon, color: "amber" },
  BANNED: { label: "Banned", icon: Delete02Icon, color: "rose" },
} satisfies Record<string, CustomTableEnumValue>;

export const LABEL_COLORS: Record<string, string> = {
  founder: "violet",
  beta: "cyan",
  vip: "yellow",
  partner: "teal",
  intern: "pink",
};

export type Row = {
  id: string;
  avatarUrl: string | undefined;
  name: string;
  email: string;
  team: string;
  url: string;
  credits: number;
  status: keyof typeof statusOptions | undefined;
  verified: boolean;
  joinedAt: Date | undefined;
  labels: string[];
  bio: string;
};
