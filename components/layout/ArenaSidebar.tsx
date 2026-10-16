"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import { ARENA_NAV_ITEMS, isArenaNavItemActive } from "./arenaNavigation";

export default function ArenaSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex h-[calc(100dvh-4rem)] max-h-[calc(100dvh-4rem)] min-h-0 w-52 shrink-0 flex-col overflow-y-auto border-r-4 border-[#121212] bg-[#FFF8E7] pt-6 pb-4">
      <nav aria-label="Arena navigation" className="flex flex-col gap-1 px-3">
        {ARENA_NAV_ITEMS.map(({ href, label, icon: Icon, color }) => {
          const active = isArenaNavItemActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
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
