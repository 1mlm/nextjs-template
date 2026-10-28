"use client";

import { CloudIcon, WifiOff01Icon } from "@hugeicons/core-free-icons";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/Icon";
import { triggerHaptic } from "@/utils/haptics";
import { useOnlineStatus } from "@/utils/useOnlineStatus";

const RECONNECTED_VISIBLE_MS = 2500;

// a pill that appears when the connection drops and says it's back for a
// moment after. not a toast, it has to stay as long as you're offline
export function OfflineBanner() {
  const isOnline = useOnlineStatus();
  const [isShowingReconnected, setIsShowingReconnected] = useState(false);
  const wasOffline = useRef(false);

  useEffect(() => {
    if (!isOnline) {
      wasOffline.current = true;
      triggerHaptic("warning");
      return;
    }
    if (!wasOffline.current) return;
    wasOffline.current = false;
    triggerHaptic("success");
    setIsShowingReconnected(true);
    const hideTimeout = setTimeout(
      () => setIsShowingReconnected(false),
      RECONNECTED_VISIBLE_MS,
    );
    return () => clearTimeout(hideTimeout);
  }, [isOnline]);

  const isVisible = !isOnline || isShowingReconnected;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          role="status"
          initial={{ opacity: 0, y: -12, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -12, scale: 0.96 }}
          // phones have the tab bar along the top, so it sits under that
          className="pointer-events-none fixed top-20 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background shadow-lg md:top-4"
        >
          <Icon icon={isOnline ? CloudIcon : WifiOff01Icon} />
          {isOnline ? "Back online" : "You're offline, changes won't save"}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
