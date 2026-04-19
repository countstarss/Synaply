import * as React from "react";
import { Slot } from "@radix-ui/react-slot";

import { cn } from "@/lib/utils";

function ConicButton({
  className,
  innerClassName,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> & {
  asChild?: boolean;
  innerClassName?: string;
}) {
  const Comp = asChild ? Slot : "button";

  return (
    <div
      className={cn(
        "group relative inline-flex overflow-hidden rounded-[16px] p-px focus-within:ring-2 focus-within:ring-slate-400/50 focus-within:ring-offset-2 focus-within:ring-offset-[#05070b]",
        className,
      )}
    >
      <span className="absolute inset-[-220%] animate-[spin_2.4s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#E2CBFF_0%,#393BB2_50%,#E2CBFF_100%)] opacity-90" />
      <Comp
        data-slot="conic-button"
        className={cn(
          "relative inline-flex h-10 w-full items-center justify-center rounded-[15px] bg-slate-950 px-4 text-sm font-medium text-white backdrop-blur-3xl transition hover:bg-[#121725] focus-visible:outline-none",
          innerClassName,
        )}
        {...props}
      />
    </div>
  );
}

export { ConicButton };
