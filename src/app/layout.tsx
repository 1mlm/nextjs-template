import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "@/shadcn/styles/globals.css";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import type { PropsWithChildren } from "react";
import { TooltipProvider } from "@/components/Tooltip";
import { Toaster } from "@/shadcn/ui/sonner";

const outfit = Outfit();

export const metadata: Metadata = {
  title: "Template Next.js App",
};

export default function RootLayout({ children }: PropsWithChildren) {
  return (
    <html lang="en" className={outfit.className}>
      <body className="antialiased">
        <NuqsAdapter>
          <TooltipProvider>{children}</TooltipProvider>
        </NuqsAdapter>
        {/* barely ever use this. toasts are only for when the row itself
        vanished and needs an undo window (see runUndoableAction), everything
        else gets inline feedback right next to whatever you clicked */}
        <Toaster />
      </body>
    </html>
  );
}
