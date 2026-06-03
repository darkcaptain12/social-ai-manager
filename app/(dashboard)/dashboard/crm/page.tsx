"use client";

import { useEffect, useState } from "react";
import { UserCheck, Plus, RefreshCw, Wand2, Trash2, Edit3, ChevronDown } from "lucide-react";
import toast from "react-hot-toast";
import { cn, formatDate } from "@/lib/utils";
import type { Lead, LeadStatus } from "@/types";

const STATUS_LABELS: Record<LeadStatus, string> = {
  new: "Yeni", contacted: "İletişim Kuruldu", interested: "İlgileniyor",
  qualified: "Nitelikli", converted: "Dönüştü", lost: "Kayıp",
};

const STATUS_COLORS: Record<LeadStatus, string> = {
  new: "badge-blue", contacted: "badge-yellow", interested: "badge-purple",
  qualified: "badge-green", converted: "badge-green", lost: "badge-red",
};

const KANBAN_COLUMNS: LeadStatus[] = ["new", "contacted", "interested", "qualified", "converted"];

export default function CRMPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [view, setView] = useState<"list" | "kanban">("list");
  const [loading, setLoading] = useState(false);
  const [genLoading, setGenLoading] = useState(false);

  async function loadLeads() {
    const res = await fetch("/api/agents/crm");
    const data = await res.json();
    setLeads(data.leads ?? []);
  }

  useEffect(() => { loadLeads(); }, []);

  async function generateLeads() {
    setGenLoading(true);
    try {
      const res = await fetch("/api/agents/crm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "generate", count: 10 }),
      });
      const data = await res.json();
      if (data.leads) { await loadLeads(); toast.success(`${data.leads.length} lead oluşturuldu!`); }
    } catch { toast.error("Lead oluşturulamadı"); }
    finally { setGenLoading(false); }
  }

  async function updateStatus(id: string, status: LeadStatus) {
    await fetch("/api/agents/crm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "update", id, patch: { status } }),
    });
    setLeads((prev) => prev.map((l) => l.id === id ? { ...l, status } : l));
  }

  async function deleteLead(id: string) {
    await fetch("/api/agents/crm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete", id }),
    });
    setLeads((prev) => prev.filter((l) => l.id !== id));
    toast.success("Lead silindi");
  }

  const stats = {
    total: leads.length,
    new: leads.filter((l) => l.status === "new").length,
    interested: leads.filter((l) => l.status === "interested").length,
    converted: leads.filter((l) => l.status === "converted").length,
    avgScore: leads.length > 0 ? Math.round(leads.reduce((s, l) => s + l.priorityScore, 0) / leads.length) : 0,
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-600/20 border border-teal-700/30 flex items-center justify-center">
            <UserCheck className="w-5 h-5 text-teal-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">CRM & Lead Yönetimi</h2>
            <p className="text-sm text-gray-500">{stats.total} toplam lead</p>
          </div>
        </div>
        <div className="flex gap-2">
          <div className="flex rounded-lg border border-surface-border overflow-hidden">
            {(["list", "kanban"] as const).map((v) => (
              <button key={v} onClick={() => setView(v)} className={cn(
                "px-3 py-1.5 text-sm capitalize transition-colors",
                view === v ? "bg-brand-950 text-brand-300" : "text-gray-500 hover:text-white"
              )}>
                {v === "list" ? "Liste" : "Kanban"}
              </button>
            ))}
          </div>
          <button onClick={generateLeads} disabled={genLoading} className="btn-primary text-sm">
            {genLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
            AI Lead Bul
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Toplam", value: stats.total, color: "text-white" },
          { label: "Yeni", value: stats.new, color: "text-brand-400" },
          { label: "İlgileniyor", value: stats.interested, color: "text-purple-400" },
          { label: "Dönüştü", value: stats.converted, color: "text-emerald-400" },
        ].map((s) => (
          <div key={s.label} className="stat-card">
            <p className={cn("text-2xl font-bold", s.color)}>{s.value}</p>
            <p className="text-xs text-gray-500">{s.label}</p>
          </div>
        ))}
      </div>

      {/* List view */}
      {view === "list" && (
        <div className="card">
          {leads.length === 0 ? (
            <div className="text-center py-12">
              <UserCheck className="w-12 h-12 text-gray-700 mx-auto mb-3" />
              <p className="text-gray-400">Lead bulunamadı</p>
              <p className="text-gray-600 text-sm mt-1">AI ile otomatik lead bul</p>
            </div>
          ) : (
            <div className="divide-y divide-surface-border">
              {leads.map((l) => (
                <div key={l.id} className="flex items-center gap-4 py-3 hover:bg-surface-muted -mx-4 px-4 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-white">{l.name}</p>
                      {l.instagramHandle && <span className="text-xs text-gray-600">@{l.instagramHandle}</span>}
                    </div>
                    <p className="text-xs text-gray-500 truncate">{l.notes}</p>
                    <div className="flex gap-1 mt-1">
                      {l.tags?.map((t) => <span key={t} className="badge badge-purple text-xs">{t}</span>)}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-center">
                      <p className={cn(
                        "text-sm font-bold",
                        l.priorityScore >= 80 ? "text-emerald-400" :
                        l.priorityScore >= 50 ? "text-amber-400" : "text-gray-400"
                      )}>{l.priorityScore}</p>
                      <p className="text-xs text-gray-600">skor</p>
                    </div>
                    <select
                      value={l.status}
                      onChange={(e) => updateStatus(l.id, e.target.value as LeadStatus)}
                      className="bg-surface-muted border border-surface-border text-xs text-gray-300 rounded-lg px-2 py-1"
                    >
                      {Object.entries(STATUS_LABELS).map(([v, label]) => (
                        <option key={v} value={v}>{label}</option>
                      ))}
                    </select>
                    <button onClick={() => deleteLead(l.id)} className="text-gray-600 hover:text-red-400 transition-colors p-1">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Kanban view */}
      {view === "kanban" && (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {KANBAN_COLUMNS.map((status) => {
            const colLeads = leads.filter((l) => l.status === status);
            return (
              <div key={status} className="flex-shrink-0 w-64">
                <div className="flex items-center justify-between mb-3">
                  <span className={cn("badge", STATUS_COLORS[status])}>{STATUS_LABELS[status]}</span>
                  <span className="text-xs text-gray-600">{colLeads.length}</span>
                </div>
                <div className="space-y-2">
                  {colLeads.map((l) => (
                    <div key={l.id} className="card p-3 space-y-2 cursor-pointer hover:border-brand-700 transition-colors">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-medium text-white">{l.name}</p>
                          {l.instagramHandle && <p className="text-xs text-gray-600">@{l.instagramHandle}</p>}
                        </div>
                        <span className={cn(
                          "text-xs font-bold",
                          l.priorityScore >= 80 ? "text-emerald-400" :
                          l.priorityScore >= 50 ? "text-amber-400" : "text-gray-400"
                        )}>{l.priorityScore}</span>
                      </div>
                      <p className="text-xs text-gray-500 line-clamp-2">{l.notes}</p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
