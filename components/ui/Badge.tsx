import { cn } from "@/lib/utils/cn";

type BadgeVariant = "safe" | "unsafe" | "blue" | "chaos" | "yellow" | "purple" | "default";

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  safe: "bg-[#35E36D] text-[#121212] border-[#121212]",
  unsafe: "bg-[#FF3B30] text-white border-[#121212]",
  blue: "bg-[#0057FF] text-white border-[#121212]",
  chaos: "bg-[#FF8BD1] text-[#121212] border-[#121212]",
  yellow: "bg-[#FFE600] text-[#121212] border-[#121212]",
  purple: "bg-[#7A35FF] text-white border-[#121212]",
  default: "bg-[#D8D0BF] text-[#121212] border-[#121212]",
};

export default function Badge({ children, variant = "default", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-block border-2 px-2 py-0.5 text-xs font-black uppercase tracking-widest",
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
