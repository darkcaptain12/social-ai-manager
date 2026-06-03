"use client";

import { Bell, Zap } from "lucide-react";
import { usePathname } from "next/navigation";

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/dashboard/brand": "Marka Zekası",
  "/dashboard/competitors": "Rakip Analizi",
  "/dashboard/viral": "Viral & Trend",
  "/dashboard/strategy": "İçerik Stratejisi",
  "/dashboard/create": "İçerik Üret",
  "/dashboard/editor": "Tasarım Editörü",
  "/dashboard/calendar": "Yayın Takvimi",
  "/dashboard/crm": "CRM & Leads",
  "/dashboard/analytics": "Analitik",
  "/dashboard/settings": "Ayarlar",
};

export function TopBar() {
  const pathname = usePathname();
  const title = PAGE_TITLES[pathname] ?? "Social AI Manager";

  return (
    <header className="h-16 border-b border-surface-border bg-surface-card/80 backdrop-blur-sm sticky top-0 z-10 flex items-center justify-between px-6">
      <div>
        <h1 className="text-base font-semibold text-white">{title}</h1>
        <p className="text-xs text-gray-500">Social AI Manager</p>
      </div>

      <div className="flex items-center gap-3">
        {/* Agent status indicator */}
        <div className="flex items-center gap-1.5 bg-surface-muted border border-surface-border rounded-full px-3 py-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs text-gray-400">Sistemler Aktif</span>
        </div>

        <button className="relative p-2 rounded-lg text-gray-400 hover:text-white hover:bg-surface-muted transition-colors">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-brand-500 rounded-full" />
        </button>

        <div className="w-8 h-8 rounded-full bg-gradient-brand flex items-center justify-center">
          <Zap className="w-4 h-4 text-white" />
        </div>
      </div>
    </header>
  );
}
