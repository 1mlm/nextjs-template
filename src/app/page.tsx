"use client";
import { Target03Icon } from "@hugeicons/core-free-icons";
import { useState } from "react";
import useSound from "use-sound";
import { Icon } from "@/components/Icon";
import { Button } from "@/shadcn/ui/button";

export default function Page() {
  const [play] = useSound("/sfx/main.mp3");
  const [count, setCount] = useState(0);

  return (
    <div className="flex h-screen flex-col items-center justify-center gap-4">
      <Button
        variant="outline"
        onClick={() => {
          setCount(count + 1);
          play();
        }}
      >
        <Icon icon={Target03Icon} /> +1
      </Button>
      <p>Count: {count}</p>
    </div>
  );
}
