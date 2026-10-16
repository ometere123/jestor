"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import { ARENA_NAV_ITEMS, isArenaNavItemActive } from "./arenaNavigation";

export default function ArenaSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex h-[calc(100dvh-4rem)] max-h-[calc(100dvh-4rem)] min-h-0 w-48 shrink-0 flex-col overflow-y-auto border-r-4 border-[#121212] bg-[#FFF8E7] pt-4 pb-3">
      <nav aria-label="Arena navigation" className="flex flex-col gap-0.5 px-2">
        {ARENA_NAV_ITEMS.map(({ href, label, icon: Icon, color }) => {
          const active = isArenaNavItemActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-2 px-2 py-2 text-[10px] font-black uppercase tracking-wide border-2 transition-all",
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

      <div className="mt-auto px-2">
        <div className="border-2 border-dashed border-[#C99A6B] p-2 text-center">
          <p className="text-[10px] font-bold text-[#6B6257] leading-tight uppercase">
            Jest Points are toy balances. No financial value.
          </p>
        </div>
      </div>
    </aside>
  );
}
