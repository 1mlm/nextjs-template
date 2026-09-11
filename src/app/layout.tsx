import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "@/shadcn/styles/globals.css";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import type { PropsWithChildren } from "react";
import { Toaster } from "@/shadcn/ui/sonner";
import { TooltipProvider } from "@/shadcn/ui/tooltip";

const outfit = Outfit();

export const metadata: Metadata = {
  title: "Template Next.js App",
};

export default function RootLayout({ children }: PropsWithChildren) {
  return (
    <html lang="en" className={outfit.className}>
      <body className={`antialiased`}>
        <NuqsAdapter>
          <TooltipProvider>{children}</TooltipProvider>
        </NuqsAdapter>
        {/* rarely use this. toast only when the row itself disappeared and
        needs an undo window (see runUndoableAction) - everything else gets
        inline feedback next to whatever was clicked instead */}
        <Toaster />
      </body>
    </html>
  );
}
