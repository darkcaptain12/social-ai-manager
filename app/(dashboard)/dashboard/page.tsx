"use client";

import { useEffect, useState } from "react";
import {
  TrendingUp, Users, Image, Calendar, Zap, ArrowUpRight,
  PenTool, BarChart2, Target, Sparkles, RefreshCw, CheckCircle2,
  Clock, AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { cn, formatNumber } from "@/lib/utils";
import type { ContentItem, Lead } from "@/types";

interface DashboardStats {
  totalPosts: number;
  avgEngagement: number;
  scheduled: number;
  drafts: number;
}

interface AgentCard {
  name: string;
  label: string;
  status: "idle" | "running" | "done" | "error";
  lastRun?: string;
  href: string;
  icon: React.ElementType;
  color: string;
}

const AGENTS: AgentCard[] = [
  { name: "brand", label: "Marka Zekası", status: "idle", href: "/dashboard/brand", icon: Sparkles, color: "text-brand-400" },
  { name: "competitor", label: "Rakip Analizi", status: "idle", href: "/dashboard/competitors", icon: Users, color: "text-purple-400" },
  { name: "viral", label: "Viral Engine", status: "idle", href: "/dashboard/viral", icon: TrendingUp, color: "text-pink-400" },
  { name: "strategy", label: "Strateji Agent", status: "idle", href: "/dashboard/strategy", icon: Target, color: "text-amber-400" },
  { name: "copywriting", label: "Copy Agent", status: "idle", href: "/dashboard/create", icon: PenTool, color: "text-emerald-400" },
  { name: "visual", label: "Görsel Agent", status: "idle", href: "/dashboard/editor", icon: Image, color: "text-cyan-400" },
];

const QUICK_ACTIONS = [
  { label: "Yeni İçerik Üret", href: "/dashboard/create", icon: PenTool, gradient: "from-brand-600 to-purple-600" },
  { label: "Takvimi Görüntüle", href: "/dashboard/calendar", icon: Calendar, gradient: "from-purple-600 to-pink-600" },
  { label: "Rakip Analizi", href: "/dashboard/competitors", icon: Users, gradient: "from-pink-600 to-rose-600" },
  { label: "Trend Tara", href: "/dashboard/viral", icon: TrendingUp, gradient: "from-amber-600 to-orange-600" },
];

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentContent, setRecentContent] = useState<ContentItem[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [analyticsRes, contentRes, leadsRes] = await Promise.all([
          fetch("/api/analytics"),
          fetch("/api/agents/copywriting"),
          fetch("/api/agents/crm"),
        ]);
        const analytics = await analyticsRes.json();
        const content = await contentRes.json();
        const crmData = await leadsRes.json();

        setStats({
          totalPosts: analytics.totalPosts ?? 0,
          avgEngagement: analytics.avgEngagement ?? 0,
          scheduled: analytics.scheduled ?? 0,
          drafts: analytics.drafts ?? 0,
        });
        setRecentContent((content.history ?? []).slice(-6).reverse());
        setLeads((crmData.leads ?? []).slice(0, 5));
      } catch {
        // ignore errors silently on dashboard
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const statCards = [
    { label: "Toplam İçerik", value: stats?.totalPosts ?? 0, icon: Image, change: "+12%", positive: true },
    { label: "Ort. Etkileşim", value: `${stats?.avgEngagement ?? 0}%`, icon: BarChart2, change: "+3.2%", positive: true },
    { label: "Planlananlar", value: stats?.scheduled ?? 0, icon: Calendar, change: "bu hafta", positive: true },
    { label: "Taslaklar", value: stats?.drafts ?? 0, icon: PenTool, change: "bekliyor", positive: false },
  ];

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Hero */}
      <div className="card bg-gradient-to-br from-brand-950/50 to-purple-950/30 border-brand-800/40">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">
              Hoş geldin 👋
            </h2>
            <p className="text-gray-400 text-sm mt-1">
              Instagram AI Manager — Otonom içerik makineniz hazır.
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/dashboard/create" className="btn-primary text-sm">
              <Zap className="w-4 h-4" />
              İçerik Üret
            </Link>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <div key={s.label} className="stat-card">
            <div className="flex items-center justify-between">
              <s.icon className="w-4 h-4 text-gray-500" />
              <span className={cn("text-xs font-medium", s.positive ? "text-emerald-400" : "text-amber-400")}>
                {s.change}
              </span>
            </div>
            <p className="text-2xl font-bold text-white mt-2">
              {loading ? "—" : formatNumber(typeof s.value === "number" ? s.value : parseFloat(s.value))}
              {typeof s.value === "string" && s.value.includes("%") ? "%" : ""}
            </p>
            <p className="text-xs text-gray-500">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
            Hızlı İşlemler
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {QUICK_ACTIONS.map((a) => (
              <Link
                key={a.href}
                href={a.href}
                className="card hover:border-brand-700 transition-colors group cursor-pointer"
              >
                <div className={cn(
                  "w-8 h-8 rounded-lg bg-gradient-to-br flex items-center justify-center mb-2",
                  a.gradient
                )}>
                  <a.icon className="w-4 h-4 text-white" />
                </div>
                <p className="text-xs font-medium text-gray-300 group-hover:text-white transition-colors">
                  {a.label}
                </p>
              </Link>
            ))}
          </div>
        </div>

        {/* Agent Status */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
            Agent Durumu
          </h3>
          <div className="card space-y-2">
            {AGENTS.map((agent) => (
              <Link
                key={agent.name}
                href={agent.href}
                className="flex items-center justify-between py-2 hover:bg-surface-muted -mx-2 px-2 rounded-lg transition-colors"
              >
                <div className="flex items-center gap-2">
                  <agent.icon className={cn("w-4 h-4", agent.color)} />
                  <span className="text-sm text-gray-300">{agent.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  {agent.status === "running" ? (
                    <RefreshCw className="w-3 h-3 text-brand-400 animate-spin" />
                  ) : agent.status === "done" ? (
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  ) : agent.status === "error" ? (
                    <AlertCircle className="w-3 h-3 text-red-400" />
                  ) : (
                    <Clock className="w-3 h-3 text-gray-600" />
                  )}
                  <span className={cn(
                    "text-xs",
                    agent.status === "running" ? "text-brand-400" :
                    agent.status === "done" ? "text-emerald-400" :
                    agent.status === "error" ? "text-red-400" : "text-gray-600"
                  )}>
                    {agent.status === "running" ? "Çalışıyor" :
                     agent.status === "done" ? "Tamamlandı" :
                     agent.status === "error" ? "Hata" : "Bekliyor"}
                  </span>
                  <ArrowUpRight className="w-3 h-3 text-gray-600" />
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Content + Leads */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
            Son İçerikler
          </h3>
          <div className="card space-y-2">
            {recentContent.length === 0 ? (
              <div className="text-center py-6">
                <PenTool className="w-8 h-8 text-gray-700 mx-auto mb-2" />
                <p className="text-xs text-gray-500">Henüz içerik yok</p>
                <Link href="/dashboard/create" className="text-xs text-brand-400 hover:underline mt-1 block">
                  İlk içeriği üret →
                </Link>
              </div>
            ) : (
              recentContent.map((c) => (
                <div key={c.id} className="flex items-start gap-2 py-1.5">
                  <div className={cn(
                    "w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0",
                    c.status === "published" ? "bg-emerald-400" :
                    c.status === "scheduled" ? "bg-brand-400" :
                    c.status === "failed" ? "bg-red-400" : "bg-gray-600"
                  )} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-300 truncate">{c.hook || c.caption}</p>
                    <p className="text-xs text-gray-600 capitalize">{c.type} · {c.status}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Hot leads */}
          <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
            Sıcak Leads
          </h3>
          <div className="card space-y-2">
            {leads.length === 0 ? (
              <p className="text-xs text-gray-500 py-2">Lead bulunamadı</p>
            ) : (
              leads.map((l) => (
                <div key={l.id} className="flex items-center justify-between py-1">
                  <div>
                    <p className="text-xs font-medium text-gray-300">{l.name}</p>
                    <p className="text-xs text-gray-600">@{l.instagramHandle}</p>
                  </div>
                  <span className={cn(
                    "badge",
                    l.priorityScore >= 80 ? "badge-green" :
                    l.priorityScore >= 50 ? "badge-yellow" : "badge-blue"
                  )}>
                    {l.priorityScore}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
