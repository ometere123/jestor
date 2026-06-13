import { cn } from "@/lib/utils/cn";

interface ScorePillProps {
  label: string;
  value: number;
  max?: number;
  color?: string;
}

export default function ScorePill({ label, value, max = 100, color }: ScorePillProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const fillColor = color ?? (pct >= 70 ? "#35E36D" : pct >= 40 ? "#FFE600" : "#FF3B30");

  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between items-center">
        <span className="text-xs font-black uppercase tracking-widest text-[#6B6257]">{label}</span>
        <span className="text-sm font-black text-[#121212]">{value}</span>
      </div>
      <div className="w-full h-3 bg-[#D8D0BF] border border-[#121212]">
        <div
          className="h-full border-r border-[#121212] transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: fillColor }}
        />
      </div>
    </div>
  );
}
