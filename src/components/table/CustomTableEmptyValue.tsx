import { Cancel01Icon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/Icon";

export function CustomTableEmptyValue({ onClick }: { onClick?: () => void }) {
  const iconEl = <Icon icon={Cancel01Icon} className="opacity-25" />;

  if (!onClick) return <div className="flex justify-center">{iconEl}</div>;

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full justify-center"
    >
      {iconEl}
    </button>
  );
}
