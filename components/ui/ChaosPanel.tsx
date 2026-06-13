"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils/cn";

interface ChaosPanelProps {
  title: string;
  children: React.ReactNode;
  className?: string;
  animate?: boolean;
}

export default function ChaosPanel({ title, children, className, animate = false }: ChaosPanelProps) {
  const content = (
    <div
      className={cn(
        "relative border-4 border-[#FF8BD1] bg-[#FFF8E7] p-4 shadow-[6px_6px_0px_#121212]",
        className
      )}
    >
      <div className="absolute -top-3.5 left-4 bg-[#FF8BD1] border-2 border-[#121212] px-2 py-0.5">
        <span className="text-xs font-black uppercase tracking-widest text-[#121212]">{title}</span>
      </div>
      <div className="mt-2">{children}</div>
    </div>
  );

  if (animate) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        {content}
      </motion.div>
    );
  }

  return content;
}
