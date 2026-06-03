"use client";

import { useEffect, useState } from "react";
import { Sparkles, RefreshCw, CheckCircle2, Edit3, Save } from "lucide-react";
import toast from "react-hot-toast";
import type { Brand } from "@/types";

export default function BrandPage() {
  const [brand, setBrand] = useState<Brand | null>(null);
  const [insights, setInsights] = useState<{ strengths: string[]; weaknesses: string[]; opportunities: string[]; recommendations: string[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [editing, setEditing] = useState(false);

  const [form, setForm] = useState({
    name: "",
    description: "",
    niche: "",
    targetAudience: "",
    keywords: "",
    language: "tr",
  });

  useEffect(() => {
    fetch("/api/agents/brand")
      .then((r) => r.json())
      .then((d) => {
        if (d.brand) {
          setBrand(d.brand);
          setForm({
            name: d.brand.name,
            description: d.brand.description,
            niche: d.brand.niche,
            targetAudience: d.brand.targetAudience,
            keywords: d.brand.keywords?.join(", ") ?? "",
            language: d.brand.language ?? "tr",
          });
        } else {
          setEditing(true);
        }
      });
  }, []);

  async function handleAnalyze() {
    if (!form.name || !form.description) {
      toast.error("Marka adı ve açıklaması zorunlu");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/agents/brand", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "analyze",
          name: form.name,
          description: form.description,
          niche: form.niche,
          targetAudience: form.targetAudience,
          keywords: form.keywords.split(",").map((k) => k.trim()).filter(Boolean),
          language: form.language,
        }),
      });
      const data = await res.json();
      if (data.brand) {
        setBrand(data.brand);
        setEditing(false);
        toast.success("Marka analiz edildi!");
      }
    } catch {
      toast.error("Analiz başarısız");
    } finally {
      setLoading(false);
    }
  }

  async function handleInsights() {
    setAnalyzing(true);
    try {
      const res = await fetch("/api/agents/brand", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "insights" }),
      });
      const data = await res.json();
      if (data.insights) setInsights(data.insights);
    } catch {
      toast.error("İçgörü analizi başarısız");
    } finally {
      setAnalyzing(false);
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-brand flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Marka Zekası</h2>
            <p className="text-sm text-gray-500">Marka kimliğinizi AI ile analiz edin</p>
          </div>
        </div>
        {brand && (
          <div className="flex gap-2">
            <button onClick={() => setEditing(!editing)} className="btn-secondary text-sm">
              <Edit3 className="w-4 h-4" />
              {editing ? "İptal" : "Düzenle"}
            </button>
            <button onClick={handleInsights} disabled={analyzing} className="btn-primary text-sm">
              {analyzing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              İçgörü Al
            </button>
          </div>
        )}
      </div>

      {/* Form */}
      {(editing || !brand) && (
        <div className="card space-y-4">
          <h3 className="font-semibold text-white">Marka Bilgileri</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Marka Adı *</label>
              <input className="input" placeholder="Örn: Kozmik Kahve" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Niş</label>
              <input className="input" placeholder="Örn: Specialty Coffee" value={form.niche} onChange={(e) => setForm({ ...form, niche: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Marka Açıklaması *</label>
            <textarea className="input min-h-[80px] resize-none" placeholder="Markanızı kısaca tanıtın..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Hedef Kitle</label>
            <input className="input" placeholder="Örn: 25-35 yaş arası kahve tutkunları" value={form.targetAudience} onChange={(e) => setForm({ ...form, targetAudience: e.target.value })} />
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Anahtar Kelimeler (virgülle ayırın)</label>
            <input className="input" placeholder="kahve, espresso, third wave..." value={form.keywords} onChange={(e) => setForm({ ...form, keywords: e.target.value })} />
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Dil</label>
            <select className="input" value={form.language} onChange={(e) => setForm({ ...form, language: e.target.value })}>
              <option value="tr">Türkçe</option>
              <option value="en">English</option>
            </select>
          </div>
          <button onClick={handleAnalyze} disabled={loading} className="btn-primary">
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {loading ? "AI Analiz Ediyor..." : "Marka Analizi Başlat"}
          </button>
        </div>
      )}

      {/* Brand Card */}
      {brand && !editing && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="card space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex gap-1">
                {brand.colorPalette?.map((c) => (
                  <div key={c} className="w-6 h-6 rounded-full border border-surface-border" style={{ backgroundColor: c }} />
                ))}
              </div>
              <div>
                <h3 className="font-bold text-white text-lg">{brand.name}</h3>
                <p className="text-xs text-gray-500">{brand.niche}</p>
              </div>
            </div>
            <p className="text-sm text-gray-400">{brand.description}</p>
            <div>
              <p className="text-xs text-gray-500 mb-1">Ton</p>
              <span className="badge badge-blue">{brand.toneOfVoice}</span>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Hedef Kitle</p>
              <p className="text-sm text-gray-300">{brand.targetAudience}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-2">Konumlandırma</p>
              <p className="text-sm text-gray-300 italic">"{brand.positioning}"</p>
            </div>
          </div>

          <div className="card">
            <h4 className="text-sm font-semibold text-gray-300 mb-3">Anahtar Kelimeler</h4>
            <div className="flex flex-wrap gap-2">
              {brand.keywords?.map((k) => (
                <span key={k} className="badge badge-purple">{k}</span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Insights */}
      {insights && (
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: "Güçlü Yönler", items: insights.strengths, color: "badge-green" },
            { label: "Zayıf Yönler", items: insights.weaknesses, color: "badge-red" },
            { label: "Fırsatlar", items: insights.opportunities, color: "badge-blue" },
            { label: "Öneriler", items: insights.recommendations, color: "badge-yellow" },
          ].map((section) => (
            <div key={section.label} className="card">
              <h4 className="text-sm font-semibold text-gray-300 mb-3">{section.label}</h4>
              <ul className="space-y-2">
                {section.items?.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-400">
                    <CheckCircle2 className="w-3.5 h-3.5 text-brand-400 flex-shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
