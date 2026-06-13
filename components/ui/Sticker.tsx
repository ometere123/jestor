import { cn } from "@/lib/utils/cn";

interface StickerProps {
  children: React.ReactNode;
  color?: string;
  rotate?: number;
  className?: string;
}

export default function Sticker({ children, color = "#FFE600", rotate = -2, className }: StickerProps) {
  return (
    <span
      className={cn(
        "inline-block px-2 py-1 border-2 border-[#121212] font-black text-[#121212] text-xs uppercase tracking-wider shadow-[2px_2px_0px_#121212]",
        className
      )}
      style={{ backgroundColor: color, transform: `rotate(${rotate}deg)` }}
    >
      {children}
    </span>
  );
}
