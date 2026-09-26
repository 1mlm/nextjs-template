"use client";

import { RefreshIcon } from "@hugeicons/core-free-icons";
import type { IconSvgElement } from "@hugeicons/react";
import { type ReactNode, useRef, useState } from "react";
import { ErrorState } from "@/components/ErrorState";
import { Icon } from "@/components/Icon";
import { IconChip } from "@/components/IconChip";
import { ListRowSkeleton } from "@/components/PageSkeleton";
import { Button } from "@/shadcn/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shadcn/ui/dialog";

enum LoadStatus {
  Idle = "idle",
  Loading = "loading",
  Loaded = "loaded",
  Failed = "failed",
}

type LoadState<T> =
  | { status: LoadStatus.Idle | LoadStatus.Loading | LoadStatus.Failed }
  | { status: LoadStatus.Loaded; data: T };

// a dialog whose content is fetched the first time it's needed and kept for
// the rest of the page's life, so a row action costs nothing until someone
// clicks it. hovering the trigger already starts the fetch, which usually
// means it's there by the time the dialog opens
export function LazyDialog<T>({
  trigger,
  title,
  icon,
  load,
  children,
}: {
  trigger: ReactNode;
  title: string;
  icon: IconSvgElement;
  load: () => Promise<T>;
  // refresh reruns load, for an action inside the dialog that changes what it shows
  children: (data: T, refresh: () => Promise<void>) => ReactNode;
}) {
  const [state, setState] = useState<LoadState<T>>({
    status: LoadStatus.Idle,
  });
  const inFlight = useRef<Promise<void>>(undefined);

  const refresh = async () => {
    try {
      setState({ status: LoadStatus.Loaded, data: await load() });
    } catch (error) {
      console.error(error);
      setState({ status: LoadStatus.Failed });
    }
  };

  // hover and open both call this, the ref keeps it to one request
  const loadOnce = () => {
    if (state.status === LoadStatus.Loaded || inFlight.current) return;
    setState({ status: LoadStatus.Loading });
    inFlight.current = refresh().finally(() => {
      inFlight.current = undefined;
    });
  };

  return (
    <Dialog onOpenChange={(isOpen) => isOpen && loadOnce()}>
      <DialogTrigger asChild onPointerEnter={loadOnce}>
        {trigger}
      </DialogTrigger>
      <DialogContent className="flex max-h-[calc(100dvh-2rem)] flex-col sm:max-w-md">
        <DialogHeader className="flex-row items-center gap-2.5">
          <IconChip {...{ icon }} />
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription className="sr-only">{title}</DialogDescription>
        </DialogHeader>
        <div className="-m-1 flex min-h-0 flex-col gap-4 overflow-y-auto p-1">
          {(state.status === LoadStatus.Loading ||
            state.status === LoadStatus.Idle) && <ListRowSkeleton count={3} />}
          {state.status === LoadStatus.Failed && (
            <ErrorState>
              <Button variant="outline" onClick={loadOnce}>
                <Icon icon={RefreshIcon} />
                Try again
              </Button>
            </ErrorState>
          )}
          {state.status === LoadStatus.Loaded && children(state.data, refresh)}
        </div>
      </DialogContent>
    </Dialog>
  );
}
