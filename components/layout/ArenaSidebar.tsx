"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import {
  LayoutDashboard,
  MessageSquare,
  Flame,
  Swords,
  Zap,
  Trophy,
  BookOpen,
} from "lucide-react";

const navItems = [
  { href: "/arena", label: "Dashboard", icon: LayoutDashboard, color: "#0057FF" },
  { href: "/caption-rift", label: "Caption Rift", icon: MessageSquare, color: "#35E36D" },
  { href: "/roast", label: "Roast Balance", icon: Flame, color: "#FF3B30" },
  { href: "/duels", label: "Meme Duels", icon: Swords, color: "#7A35FF" },
  { href: "/chaos-lab", label: "Chaos Lab", icon: Zap, color: "#FF8BD1" },
  { href: "/leaderboard", label: "Leaderboard", icon: Trophy, color: "#FFE600" },
  { href: "/rules", label: "Rules", icon: BookOpen, color: "#C99A6B" },
];

export default function ArenaSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex flex-col w-52 shrink-0 border-r-4 border-[#121212] bg-[#FFF8E7] min-h-screen pt-6 pb-4">
      <nav className="flex flex-col gap-1 px-3">
        {navItems.map(({ href, label, icon: Icon, color }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 text-xs font-black uppercase tracking-wider border-2 transition-all",
                active
                  ? "border-[#121212] bg-[#121212] text-[#FFE600] shadow-[2px_2px_0px_#FFE600]"
                  : "border-transparent text-[#121212] hover:border-[#121212] hover:bg-white hover:shadow-[2px_2px_0px_#121212]"
              )}
            >
              <Icon className="w-4 h-4 shrink-0" style={{ color: active ? "#FFE600" : color }} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto px-3">
        <div className="border-2 border-dashed border-[#C99A6B] p-2 text-center">
          <p className="text-[10px] font-bold text-[#6B6257] leading-tight uppercase">
            Jest Points are toy balances. No financial value.
          </p>
        </div>
      </div>
    </aside>
  );
}
