"use client";

import { useEffect, useState } from "react";
import { Users, Plus, RefreshCw, Trash2, TrendingUp, FileText } from "lucide-react";
import toast from "react-hot-toast";
import { cn, formatNumber } from "@/lib/utils";
import type { Competitor } from "@/types";

export default function CompetitorsPage() {
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [report, setReport] = useState<{ summary: string; marketGaps: string[]; winningAngles: string[]; contentIdeas: string[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [form, setForm] = useState({ name: "", instagramHandle: "" });
  const [showForm, setShowForm] = useState(false);

  async function loadCompetitors() {
    const res = await fetch("/api/agents/competitor");
    const data = await res.json();
    setCompetitors(data.competitors ?? []);
  }

  useEffect(() => { loadCompetitors(); }, []);

  async function handleAdd() {
    if (!form.name || !form.instagramHandle) { toast.error("Tüm alanları doldurun"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/agents/competitor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "analyze", ...form }),
      });
      const data = await res.json();
      if (data.competitor) {
        setCompetitors((prev) => [...prev, data.competitor]);
        setForm({ name: "", instagramHandle: "" });
        setShowForm(false);
        toast.success("Rakip analiz edildi!");
      } else {
        toast.error(data.error ?? "Hata");
      }
    } catch {
      toast.error("API hatası");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    await fetch("/api/agents/competitor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete", id }),
    });
    setCompetitors((prev) => prev.filter((c) => c.id !== id));
    toast.success("Rakip silindi");
  }

  async function handleReport() {
    setReportLoading(true);
    try {
      const res = await fetch("/api/agents/competitor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "report" }),
      });
      const data = await res.json();
      if (data.report) setReport(data.report);
    } catch {
      toast.error("Rapor oluşturulamadı");
    } finally {
      setReportLoading(false);
    }
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-700/30 flex items-center justify-center">
            <Users className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Rakip Analizi</h2>
            <p className="text-sm text-gray-500">{competitors.length} rakip takipte</p>
          </div>
        </div>
        <div className="flex gap-2">
          {competitors.length > 0 && (
            <button onClick={handleReport} disabled={reportLoading} className="btn-secondary text-sm">
              {reportLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
              Rekabet Raporu
            </button>
          )}
          <button onClick={() => setShowForm(true)} className="btn-primary text-sm">
            <Plus className="w-4 h-4" />
            Rakip Ekle
          </button>
        </div>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="card space-y-4">
          <h3 className="font-semibold text-white">Yeni Rakip Ekle</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Marka Adı</label>
              <input className="input" placeholder="Örn: Starbucks Turkey" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Instagram Handle</label>
              <input className="input" placeholder="@starbucks_turkey" value={form.instagramHandle} onChange={(e) => setForm({ ...form, instagramHandle: e.target.value.replace("@", "") })} />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleAdd} disabled={loading} className="btn-primary text-sm">
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <TrendingUp className="w-4 h-4" />}
              {loading ? "Analiz Ediliyor..." : "AI ile Analiz Et"}
            </button>
            <button onClick={() => setShowForm(false)} className="btn-ghost text-sm">İptal</button>
          </div>
        </div>
      )}

      {/* Competitors grid */}
      {competitors.length === 0 ? (
        <div className="card text-center py-12">
          <Users className="w-12 h-12 text-gray-700 mx-auto mb-3" />
          <p className="text-gray-400 font-medium">Henüz rakip eklenmedi</p>
          <p className="text-gray-600 text-sm mt-1">Rakip ekleyerek içerik boşluklarını keşfedin</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {competitors.map((c) => (
            <div key={c.id} className="card space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-white">{c.name}</h3>
                  <p className="text-xs text-gray-500">@{c.instagramHandle}</p>
                </div>
                <button onClick={() => handleDelete(c.id)} className="text-gray-600 hover:text-red-400 transition-colors p-1">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {c.followerCount && (
                  <div className="bg-surface-muted rounded-lg p-2 text-center">
                    <p className="text-lg font-bold text-white">{formatNumber(c.followerCount)}</p>
                    <p className="text-xs text-gray-500">Takipçi</p>
                  </div>
                )}
                {c.engagementRate && (
                  <div className="bg-surface-muted rounded-lg p-2 text-center">
                    <p className="text-lg font-bold text-white">{c.engagementRate.toFixed(1)}%</p>
                    <p className="text-xs text-gray-500">Etkileşim</p>
                  </div>
                )}
              </div>

              {c.contentStyle && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">İçerik Stili</p>
                  <p className="text-sm text-gray-400">{c.contentStyle}</p>
                </div>
              )}

              {c.contentGaps && c.contentGaps.length > 0 && (
                <div>
                  <p className="text-xs text-gray-500 mb-1.5">İçerik Boşlukları</p>
                  <div className="space-y-1">
                    {c.contentGaps.slice(0, 3).map((gap, i) => (
                      <p key={i} className="text-xs text-emerald-400 flex items-center gap-1">
                        <span className="text-emerald-600">→</span> {gap}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {c.topHashtags && (
                <div className="flex flex-wrap gap-1">
                  {c.topHashtags.slice(0, 6).map((h) => (
                    <span key={h} className="badge badge-purple text-xs">#{h}</span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Report */}
      {report && (
        <div className="card space-y-4">
          <h3 className="font-bold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-purple-400" />
            Rekabet İstihbarat Raporu
          </h3>
          <p className="text-sm text-gray-400">{report.summary}</p>
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Pazar Boşlukları", items: report.marketGaps, color: "text-emerald-400" },
              { label: "Kazanma Açıları", items: report.winningAngles, color: "text-brand-400" },
              { label: "İçerik Fikirleri", items: report.contentIdeas, color: "text-amber-400" },
            ].map((s) => (
              <div key={s.label}>
                <p className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">{s.label}</p>
                <ul className="space-y-1.5">
                  {s.items?.map((item, i) => (
                    <li key={i} className={cn("text-xs", s.color)}>• {item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
