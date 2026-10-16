import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  Flame,
  GitBranch,
  LayoutDashboard,
  MessageSquare,
  Sparkles,
  Swords,
  Trophy,
  UserRound,
  Zap,
} from "lucide-react";

export type ArenaNavItem = {
  readonly href: `/${string}`;
  readonly label: string;
  readonly icon: LucideIcon;
  readonly color: string;
};

/** The single source of truth for every primary Arena destination. */
export const ARENA_NAV_ITEMS = [
  { href: "/arena", label: "Dashboard", icon: LayoutDashboard, color: "#0057FF" },
  { href: "/caption-rift", label: "Caption Rift", icon: MessageSquare, color: "#35E36D" },
  { href: "/roast", label: "Roast Balance", icon: Flame, color: "#FF3B30" },
  { href: "/duels", label: "Meme Duels", icon: Swords, color: "#7A35FF" },
  { href: "/chaos-lab", label: "Chaos Lab", icon: Zap, color: "#FF8BD1" },
  { href: "/remix", label: "Remix Battles", icon: Sparkles, color: "#35E36D" },
  { href: "/circuit", label: "Arena Circuit", icon: GitBranch, color: "#0057FF" },
  { href: "/career", label: "Player Career", icon: UserRound, color: "#C99A6B" },
  { href: "/leaderboard", label: "Leaderboard", icon: Trophy, color: "#FFE600" },
  { href: "/rules", label: "Rules", icon: BookOpen, color: "#C99A6B" },
] as const satisfies readonly ArenaNavItem[];

export function isArenaNavItemActive(pathname: string | null, href: string): boolean {
  return pathname === href || pathname?.startsWith(`${href}/`) === true;
}
