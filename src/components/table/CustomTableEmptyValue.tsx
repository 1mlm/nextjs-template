import { Icon } from "@/components/Icon";
import { APP_ICONS } from "@/utils/icons";

export function CustomTableEmptyValue({ onClick }: { onClick?: () => void }) {
  const iconEl = <Icon icon={APP_ICONS.close} className="opacity-25" />;

  if (!onClick) return <div className="flex justify-center">{iconEl}</div>;

  return (
    <button
      type="button"
      {...{ onClick }}
      className="flex w-full justify-center"
    >
      {iconEl}
    </button>
  );
}
