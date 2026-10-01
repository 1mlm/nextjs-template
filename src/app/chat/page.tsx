import type { Metadata } from "next";
import { Chat } from "./Chat";

export const metadata: Metadata = { title: "Chat" };

export default function Page() {
  return <Chat />;
}
