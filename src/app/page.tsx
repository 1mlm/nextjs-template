import { ArrowRight01Icon } from "@hugeicons/core-free-icons";
import Link from "next/link";
import { Icon } from "@/components/Icon";
import { Button } from "@/shadcn/ui/button";

// a fork replaces this page on day one, the showcase lives on /showcase
export default function Page() {
  return (
    <div className="flex flex-1 items-center justify-center p-4">
      <Button asChild size="lg">
        <Link href="/showcase">
          Open the showcase
          <Icon icon={ArrowRight01Icon} data-icon="inline-end" />
        </Link>
      </Button>
    </div>
  );
}
