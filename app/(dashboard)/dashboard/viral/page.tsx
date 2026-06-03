"use client";

import { useEffect, useState } from "react";
import { TrendingUp, RefreshCw, Flame, Wand2 } from "lucide-react";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";
import type { TrendItem } from "@/types";

export default function ViralPage() {
  const [trends, setTrends] = useState<TrendItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [template, setTemplate] = useState<{ template: string; hooks: string[]; adaptedCaption: string } | null>(null);
  const [selectedTrend, setSelectedTrend] = useState<TrendItem | null>(null);
  const [templateLoading, setTemplateLoading] = useState(false);

  useEffect(() => {
    fetch("/api/agents/viral")
      .then((r) => r.json())
      .then((d) => setTrends(d.trends ?? []));
  }, []);

  async function detectTrends() {
    setLoading(true);
    try {
      const res = await fetch("/api/agents/viral", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "detect" }),
      });
      const data = await res.json();
      if (data.trends) { setTrends(data.trends); toast.success("Trendler güncellendi!"); }
    } catch {
      toast.error("Trend analizi başarısız");
    } finally {
      setLoading(false);
    }
  }

  async function getTemplate(trend: TrendItem) {
    setSelectedTrend(trend);
    setTemplateLoading(true);
    try {
      const res = await fetch("/api/agents/viral", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "template", trend }),
      });
      const data = await res.json();
      if (data.template) setTemplate(data);
    } catch {
      toast.error("Şablon oluşturulamadı");
    } finally {
      setTemplateLoading(false);
    }
  }

  const getScoreColor = (score: number) =>
    score >= 80 ? "text-red-400" : score >= 60 ? "text-amber-400" : "text-emerald-400";

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-pink-600/20 border border-pink-700/30 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-pink-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Viral & Trend Motor</h2>
            <p className="text-sm text-gray-500">{trends.length} aktif trend</p>
          </div>
        </div>
        <button onClick={detectTrends} disabled={loading} className="btn-primary text-sm">
          {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <TrendingUp className="w-4 h-4" />}
          {loading ? "Taranıyor..." : "Trend Tara"}
        </button>
      </div>

      {trends.length === 0 ? (
        <div className="card text-center py-12">
          <Flame className="w-12 h-12 text-gray-700 mx-auto mb-3" />
          <p className="text-gray-400">Trend verisi yok</p>
          <p className="text-gray-600 text-sm mt-1">AI ile güncel trendleri tara</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {trends.map((t) => (
            <div
              key={t.id}
              className={cn(
                "card cursor-pointer hover:border-brand-700 transition-colors space-y-3",
                selectedTrend?.id === t.id && "border-brand-700 bg-brand-950/20"
              )}
              onClick={() => getTemplate(t)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-white">{t.title}</h3>
                  <span className="badge badge-blue text-xs mt-1">{t.format}</span>
                </div>
                <div className="text-right">
                  <p className={cn("text-2xl font-bold", getScoreColor(t.viralScore))}>
                    {t.viralScore}
                  </p>
                  <p className="text-xs text-gray-600">viral skoru</p>
                </div>
              </div>
              <p className="text-sm text-gray-400">{t.description}</p>
              <div className="bg-surface-muted rounded-lg p-3 border-l-2 border-brand-600">
                <p className="text-xs text-gray-500 mb-1">Viral Hook Formülü</p>
                <p className="text-sm text-brand-300 italic">"{t.hook}"</p>
              </div>
              <button className="btn-ghost text-xs w-full justify-center">
                <Wand2 className="w-3.5 h-3.5" />
                Şablon Oluştur
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Template panel */}
      {(template || templateLoading) && selectedTrend && (
        <div className="card space-y-4">
          <h3 className="font-bold text-white flex items-center gap-2">
            <Wand2 className="w-4 h-4 text-brand-400" />
            "{selectedTrend.title}" için Özel Şablon
          </h3>
          {templateLoading ? (
            <div className="flex items-center gap-2 text-gray-500">
              <RefreshCw className="w-4 h-4 animate-spin" />
              Şablon oluşturuluyor...
            </div>
          ) : template && (
            <div className="space-y-4">
              <div className="bg-surface rounded-lg p-4 border border-surface-border">
                <p className="text-xs text-gray-500 mb-2">Şablon ([ ] ile doldurun)</p>
                <p className="text-sm text-amber-300 font-mono">{template.template}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-2">5 Hook Varyasyonu</p>
                <div className="space-y-2">
                  {template.hooks?.map((h, i) => (
                    <div key={i} className="flex items-center gap-2 bg-surface-muted rounded-lg p-3">
                      <span className="text-xs text-brand-500 font-bold">{i + 1}</span>
                      <p className="text-sm text-gray-300">{h}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-2">Uyarlanmış Caption</p>
                <div className="bg-surface rounded-lg p-4 border border-surface-border">
                  <p className="text-sm text-gray-300 whitespace-pre-wrap">{template.adaptedCaption}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
