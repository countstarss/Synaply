"use client";

import { motion } from "framer-motion";

import { cn } from "@/lib/utils";

interface MarketingBackgroundProps {
  className?: string;
}

export function MarketingBackground({
  className,
}: MarketingBackgroundProps) {
  return (
    <div
      aria-hidden="true"
      className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
    >
      <div className="absolute inset-0 bg-[#05070b]" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,#05070b_0%,#07090e_38%,#05070b_100%)]" />
      <div className="absolute inset-0 opacity-45 [background-image:linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] [background-size:84px_84px]" />
      <div className="absolute inset-0 opacity-[0.08] [background-image:radial-gradient(circle_at_center,rgba(255,255,255,0.9)_1px,transparent_1px)] [background-size:18px_18px]" />
      <div className="absolute inset-x-0 bottom-0 h-72 bg-[linear-gradient(180deg,transparent_0%,rgba(255,255,255,0.02)_100%)]" />

      <motion.div
        animate={{ opacity: [0.1, 0.18, 0.1], x: [0, 36, 0] }}
        transition={{ duration: 18, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
        className="absolute left-[12%] top-20 h-px w-72 bg-gradient-to-r from-transparent via-white/35 to-transparent"
      />
      <motion.div
        animate={{ opacity: [0.06, 0.12, 0.06], y: [0, 28, 0] }}
        transition={{ duration: 16, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
        className="absolute right-[16%] top-10 h-80 w-px bg-gradient-to-b from-transparent via-white/18 to-transparent"
      />
      <motion.div
        animate={{ opacity: [0.04, 0.1, 0.04], scale: [0.96, 1.03, 0.96] }}
        transition={{ duration: 14, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
        className="absolute left-1/2 top-24 h-64 w-64 -translate-x-1/2 rounded-full bg-white/6 blur-[120px]"
      />
      <motion.div
        animate={{ opacity: [0.02, 0.06, 0.02], x: [0, -18, 0], y: [0, 12, 0] }}
        transition={{ duration: 20, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
        className="absolute bottom-10 right-[18%] h-40 w-40 rounded-full bg-emerald-300/10 blur-[100px]"
      />

      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/16 to-transparent" />
      <div className="absolute inset-y-0 left-0 w-px bg-gradient-to-b from-transparent via-white/10 to-transparent" />
      <div className="absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-white/10 to-transparent" />
    </div>
  );
}
