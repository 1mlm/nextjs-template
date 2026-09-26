import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import { cookies } from "next/headers";
import "@/shadcn/styles/globals.css";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import type { CSSProperties, PropsWithChildren } from "react";
import { TooltipProvider } from "@/components/Tooltip";
import { SidebarInset, SidebarProvider } from "@/shadcn/ui/sidebar";
import { Toaster } from "@/shadcn/ui/sonner";
import { AppSidebar } from "./_sidebar/AppSidebar";
import { MobileTopBar } from "./_sidebar/MobileTopBar";
import { NewVersionToast } from "./NewVersionToast";

const outfit = Outfit();

// the cookie shadcn's sidebar.tsx writes on every toggle
const SIDEBAR_COOKIE_NAME = "sidebar_state";

// collapsed width is picked so the inner panel is exactly 32px icons + 12px
// padding each side (the floating variant adds 1rem + 2px on top of this)
const SIDEBAR_SIZES: CSSProperties & Record<`--${string}`, string> = {
  "--sidebar-width": "15rem",
  "--sidebar-width-icon": "calc(3.5rem - 2px)",
};

export const metadata: Metadata = {
  title: "Template Next.js App",
};

export default async function RootLayout({ children }: PropsWithChildren) {
  // read on the server so a collapsed sidebar doesn't flash open on load. the
  // catch: cookies() makes every route render dynamically instead of static
  const cookieStore = await cookies();
  const isSidebarOpen = cookieStore.get(SIDEBAR_COOKIE_NAME)?.value !== "false";

  return (
    <html lang="en" className={outfit.className}>
      <body className="antialiased">
        <NuqsAdapter>
          <TooltipProvider>
            <SidebarProvider defaultOpen={isSidebarOpen} style={SIDEBAR_SIZES}>
              <AppSidebar />
              <SidebarInset className="min-w-0 bg-muted md:m-2 md:ml-0 md:rounded-xl md:ring-1 md:ring-border">
                <MobileTopBar />
                {children}
              </SidebarInset>
            </SidebarProvider>
          </TooltipProvider>
        </NuqsAdapter>
        {/* barely ever use this. toasts are only for when there's nothing on
        screen to show feedback next to: a row that vanished and needs an undo
        window (runUndoableAction) or a new deploy (NewVersionToast). everything
        else gets inline feedback right next to whatever you clicked */}
        <Toaster />
        <NewVersionToast />
      </body>
    </html>
  );
}
