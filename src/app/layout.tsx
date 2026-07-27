import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "@/shadcn/styles/globals.css";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import type { PropsWithChildren } from "react";
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
      </body>
    </html>
  );
}
