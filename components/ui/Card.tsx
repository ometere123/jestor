import { cn } from "@/lib/utils/cn";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "torn" | "console" | "sticker";
  rotate?: number;
}

export default function Card({ children, className, variant = "default", rotate }: CardProps) {
  return (
    <div
      className={cn(
        "relative bg-white border-2 border-[#121212] p-4",
        variant === "default" && "shadow-[4px_4px_0px_rgba(18,18,18,0.18)]",
        variant === "torn" && [
          "shadow-[4px_4px_0px_rgba(0,87,255,0.28)]",
          "before:absolute before:top-0 before:left-0 before:w-full before:h-1 before:bg-[repeating-linear-gradient(90deg,transparent,transparent_4px,#121212_4px,#121212_5px)]",
        ],
        variant === "console" && "bg-[#121212] text-[#00D8C8] font-mono shadow-[4px_4px_0px_rgba(0,216,200,0.3)] border-[#00D8C8]",
        variant === "sticker" && "border-4 shadow-[5px_5px_0px_#121212]",
        className
      )}
      style={rotate ? { transform: `rotate(${rotate}deg)` } : undefined}
    >
      {children}
    </div>
  );
}
