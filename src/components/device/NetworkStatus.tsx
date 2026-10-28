"use client";

import { useEffect, useState } from "react";
import { cn } from "@/shadcn/utils";
import { useOnlineStatus } from "@/utils/useOnlineStatus";

const readConnection = () => {
  const { effectiveType, downlink, rtt, saveData } = navigator.connection ?? {};
  return { effectiveType, downlink, rtt, saveData };
};

// the network information api only exists in chromium (android included),
// elsewhere only the online dot shows
export function NetworkStatus() {
  const isOnline = useOnlineStatus();
  const [connection, setConnection] =
    useState<ReturnType<typeof readConnection>>();

  useEffect(() => {
    const updateConnection = () => setConnection(readConnection());
    updateConnection();
    navigator.connection?.addEventListener("change", updateConnection);
    return () =>
      navigator.connection?.removeEventListener("change", updateConnection);
  }, []);

  const rows = [
    ["type", connection?.effectiveType],
    ["downlink", connection?.downlink && `${connection.downlink} Mbps`],
    ["latency", connection?.rtt && `${connection.rtt} ms`],
    [
      "data saver",
      connection?.saveData === undefined
        ? undefined
        : connection.saveData
          ? "on"
          : "off",
    ],
  ];

  return (
    <div className="flex flex-col gap-2 text-sm">
      <span className="flex items-center gap-2 font-medium">
        <span
          className={cn(
            "size-2 rounded-full",
            isOnline ? "bg-green-500" : "bg-destructive",
          )}
        />
        {isOnline ? "online" : "offline"}
      </span>
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-muted-foreground">
        {rows.map(([label, value]) => (
          <div key={label} className="contents">
            <dt>{label}</dt>
            <dd className="text-foreground">{value ?? "not available here"}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
