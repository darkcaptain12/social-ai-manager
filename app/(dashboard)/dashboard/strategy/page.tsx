"use client";

import { useEffect, useState } from "react";
import { Layers, RefreshCw, Target, Clock, Lightbulb } from "lucide-react";
import toast from "react-hot-toast";
import type { ContentStrategy } from "@/types";

const DAY_LABELS: Record<string, string> = {
  monday: "Pazartesi", tuesday: "Salı", wednesday: "Çarşamba",
  thursday: "Perşembe", friday: "Cuma", saturday: "Cumartesi", sunday: "Pazar",
};

export default function StrategyPage() {
  const [strategy, setStrategy] = useState<ContentStrategy | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/agents/strategy")
      .then((r) => r.json())
      .then((d) => setStrategy(d.strategy));
  }, []);

  async function generateStrategy() {
    setLoading(true);
    try {
      const res = await fetch("/api/agents/strategy", { method: "POST" });
      const data = await res.json();
      if (data.strategy) { setStrategy(data.strategy); toast.success("Strateji oluşturuldu!"); }
      else toast.error(data.error ?? "Hata");
    } catch {
      toast.error("Strateji oluşturulamadı. Önce marka oluşturun.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-600/20 border border-amber-700/30 flex items-center justify-center">
            <Layers className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">İçerik Stratejisi</h2>
            <p className="text-sm text-gray-500">AI destekli haftalık plan</p>
          </div>
        </div>
        <button onClick={generateStrategy} disabled={loading} className="btn-primary text-sm">
          {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Target className="w-4 h-4" />}
          {loading ? "Oluşturuluyor..." : strategy ? "Yenile" : "Strateji Oluştur"}
        </button>
      </div>

      {!strategy ? (
        <div className="card text-center py-12">
          <Target className="w-12 h-12 text-gray-700 mx-auto mb-3" />
          <p className="text-gray-400">Henüz strateji oluşturulmadı</p>
          <p className="text-gray-600 text-sm mt-1">Önce marka profilinizi oluşturun, ardından AI stratejinizi hazırlasın</p>
        </div>
      ) : (
        <>
          {/* Content Pillars */}
          <div className="card space-y-4">
            <h3 className="font-semibold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-amber-400" />
              İçerik Pillarları
            </h3>
            <div className="space-y-3">
              {strategy.pillars?.map((pillar) => (
                <div key={pillar.id} className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: pillar.color }} />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-white">{pillar.name}</span>
                      <span className="text-xs text-gray-500">{pillar.percentage}%</span>
                    </div>
                    <div className="w-full bg-surface-muted rounded-full h-1.5">
                      <div className="h-1.5 rounded-full" style={{ width: `${pillar.percentage}%`, backgroundColor: pillar.color }} />
                    </div>
                    <p className="text-xs text-gray-600 mt-0.5">{pillar.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Timing & Frequency */}
          <div className="grid grid-cols-2 gap-4">
            <div className="card space-y-3">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <Target className="w-4 h-4 text-brand-400" />
                Yayın Sıklığı
              </h3>
              <p className="text-2xl font-bold text-white">{strategy.postingFrequency}</p>
              <p className="text-xs text-gray-500">AI önerisi</p>
            </div>
            <div className="card space-y-3">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-400" />
                Optimal Saatler
              </h3>
              <div className="flex flex-wrap gap-2">
                {strategy.optimalTimes?.map((t) => (
                  <span key={t} className="badge badge-green">{t}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Campaign Ideas */}
          <div className="card space-y-3">
            <h3 className="font-semibold text-white flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-yellow-400" />
              Kampanya Fikirleri
            </h3>
            <div className="space-y-2">
              {strategy.campaignIdeas?.map((idea, i) => (
                <div key={i} className="flex items-start gap-2 py-2 border-b border-surface-border last:border-0">
                  <span className="w-5 h-5 rounded-full bg-brand-950 border border-brand-800 text-brand-400 text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <p className="text-sm text-gray-300">{idea}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Weekly Plan */}
          <div className="card space-y-4">
            <h3 className="font-semibold text-white">Haftalık Plan</h3>
            <div className="grid grid-cols-1 gap-3">
              {Object.entries(strategy.weeklyPlan ?? {}).map(([day, items]) => (
                items && items.length > 0 && (
                  <div key={day} className="flex gap-3">
                    <div className="w-24 flex-shrink-0">
                      <p className="text-xs font-semibold text-gray-400 uppercase">{DAY_LABELS[day] ?? day}</p>
                    </div>
                    <div className="flex-1 space-y-2">
                      {items.map((item, i) => (
                        <div key={i} className="bg-surface-muted rounded-lg p-3 border border-surface-border">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="badge badge-blue capitalize">{item.type}</span>
                            <span className="badge badge-purple capitalize">{item.objective}</span>
                            {item.pillar && <span className="text-xs text-gray-600">{item.pillar}</span>}
                          </div>
                          <p className="text-sm text-white font-medium">{item.hook}</p>
                          <p className="text-xs text-gray-500 mt-1">{item.cta}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
