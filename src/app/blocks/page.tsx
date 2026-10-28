import type { Metadata } from "next";
import { BlockEditor } from "./BlockEditor";

export const metadata: Metadata = { title: "Blocks" };

export default function Page() {
  return (
    <div className="p-4 md:p-5">
      <h1 className="sr-only">Blocks</h1>
      <BlockEditor />
    </div>
  );
}
