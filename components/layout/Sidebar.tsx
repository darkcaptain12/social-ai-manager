"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Sparkles,
  Users,
  TrendingUp,
  Layers,
  PenTool,
  Image,
  Calendar,
  UserCheck,
  BarChart2,
  Settings,
  Zap,
  Instagram,
  ChevronLeft,
  ChevronRight,
  ScanSearch,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/brand", label: "Marka", icon: Sparkles },
  { href: "/dashboard/audience", label: "Profil Analizi", icon: ScanSearch },
  { href: "/dashboard/competitors", label: "Rakipler", icon: Users },
  { href: "/dashboard/viral", label: "Viral / Trend", icon: TrendingUp },
  { href: "/dashboard/strategy", label: "Strateji", icon: Layers },
  { href: "/dashboard/create", label: "İçerik Üret", icon: PenTool },
  { href: "/dashboard/editor", label: "Tasarım Editörü", icon: Image },
  { href: "/dashboard/calendar", label: "Takvim", icon: Calendar },
  { href: "/dashboard/crm", label: "CRM / Leads", icon: UserCheck },
  { href: "/dashboard/analytics", label: "Analitik", icon: BarChart2 },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "flex flex-col h-screen bg-surface-card border-r border-surface-border transition-all duration-300 sticky top-0",
        collapsed ? "w-16" : "w-60"
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-surface-border min-h-[65px]">
        <div className="w-8 h-8 rounded-lg bg-gradient-brand flex items-center justify-center flex-shrink-0">
          <Instagram className="w-4 h-4 text-white" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <p className="font-bold text-sm text-white leading-tight">Social AI</p>
            <p className="text-xs text-gray-500">Manager</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto no-scrollbar">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
                active
                  ? "bg-brand-950 text-brand-300 border border-brand-800"
                  : "text-gray-400 hover:text-white hover:bg-surface-muted"
              )}
            >
              <Icon className={cn("w-4 h-4 flex-shrink-0", active && "text-brand-400")} />
              {!collapsed && <span className="truncate">{label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="px-2 pb-4 space-y-1 border-t border-surface-border pt-3">
        <Link
          href="/dashboard/settings"
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
            pathname === "/dashboard/settings"
              ? "bg-brand-950 text-brand-300 border border-brand-800"
              : "text-gray-400 hover:text-white hover:bg-surface-muted"
          )}
        >
          <Settings className="w-4 h-4 flex-shrink-0" />
          {!collapsed && <span>Ayarlar</span>}
        </Link>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-500 hover:text-white hover:bg-surface-muted transition-all duration-150"
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <>
              <ChevronLeft className="w-4 h-4" />
              <span>Daralt</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
