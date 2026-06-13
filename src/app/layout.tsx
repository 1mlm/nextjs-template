import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "@/shadcn/styles/globals.css";
import type { PropsWithChildren } from "react";

const outfit = Outfit();

export const metadata: Metadata = {
  title: "Template Next.js App",
};

export default function RootLayout({ children }: PropsWithChildren) {
  return (
    <html lang="en" className={outfit.className}>
      <body className={`antialiased`}>{children}</body>
    </html>
  );
}
