"use client";

import { Share08Icon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/Icon";
import { Button } from "@/shadcn/ui/button";
import { useCopyToClipboard } from "@/utils/clipboard";
import { APP_ICONS } from "@/utils/icons";

// the phone's own share sheet where the browser has one (mobile, safari,
// chrome on windows), and a plain "copy the link" everywhere else
export function ShareButton({
  title,
  text,
  url,
}: {
  title: string;
  text?: string;
  url: string;
}) {
  const { copied, copy } = useCopyToClipboard(1500);

  const share = async () => {
    if (!navigator.share) {
      copy(url);
      return;
    }
    try {
      await navigator.share({ title, text, url });
    } catch {
      // closing the share sheet rejects, that's not an error
    }
  };

  return (
    <Button variant="outline" onClick={share}>
      <Icon icon={copied ? APP_ICONS.confirm : Share08Icon} />
      {copied ? "Link copied" : "Share"}
    </Button>
  );
}
