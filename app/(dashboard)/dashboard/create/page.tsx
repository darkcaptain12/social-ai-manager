"use client";

import { useState } from "react";
import { PenTool, Image, RefreshCw, Copy, Wand2, Check, Download } from "lucide-react";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";
import type { ContentItem, ContentType, ContentObjective } from "@/types";

const CONTENT_TYPES: { value: ContentType; label: string }[] = [
  { value: "post", label: "Post" },
  { value: "story", label: "Story" },
  { value: "reel", label: "Reel" },
  { value: "carousel", label: "Carousel" },
];

const OBJECTIVES: { value: ContentObjective; label: string }[] = [
  { value: "awareness", label: "Farkındalık" },
  { value: "engagement", label: "Etkileşim" },
  { value: "conversion", label: "Dönüşüm" },
  { value: "education", label: "Eğitim" },
  { value: "entertainment", label: "Eğlence" },
];

export default function CreatePage() {
  const [step, setStep] = useState<"form" | "copy" | "visual">("form");
  const [form, setForm] = useState({
    type: "post" as ContentType,
    objective: "engagement" as ContentObjective,
    topic: "",
    pillar: "",
    additionalContext: "",
  });
  const [content, setContent] = useState<ContentItem | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [imgLoading, setImgLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  async function generateCopy() {
    if (!form.topic) { toast.error("Konu zorunlu"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/agents/copywriting", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "generate", ...form }),
      });
      const data = await res.json();
      if (data.content) {
        setContent(data.content);
        setStep("copy");
        toast.success("Metin oluşturuldu!");
      } else {
        toast.error(data.error ?? "Hata");
      }
    } catch {
      toast.error("AI bağlantısı başarısız. API anahtarını kontrol edin.");
    } finally {
      setLoading(false);
    }
  }

  async function generateImage() {
    if (!content?.imagePrompt) return;
    setImgLoading(true);
    try {
      const res = await fetch("/api/agents/visual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "generate", prompt: content.imagePrompt }),
      });
      const data = await res.json();
      if (data.url) {
        setImageUrl(data.url);
        setStep("visual");
        toast.success("Görsel oluşturuldu!");
      } else {
        toast.error(data.error ?? "Görsel oluşturulamadı");
      }
    } catch {
      toast.error("Görsel API hatası");
    } finally {
      setImgLoading(false);
    }
  }

  function copyCaption() {
    if (!content) return;
    navigator.clipboard.writeText(
      `${content.caption}\n\n${content.hashtags.map((h) => `#${h}`).join(" ")}`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Kopyalandı!");
  }

  return (
    <div className="max-w-4xl space-y-6">
      {/* Step indicators */}
      <div className="flex items-center gap-2">
        {[
          { key: "form", label: "1. Konu", icon: PenTool },
          { key: "copy", label: "2. Metin", icon: Wand2 },
          { key: "visual", label: "3. Görsel", icon: Image },
        ].map(({ key, label, icon: Icon }, i) => (
          <div key={key} className="flex items-center gap-2">
            <button
              onClick={() => step !== "form" && setStep(key as typeof step)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                step === key
                  ? "bg-brand-950 text-brand-300 border border-brand-700"
                  : "text-gray-500 hover:text-gray-300"
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
            {i < 2 && <div className="w-8 h-px bg-surface-border" />}
          </div>
        ))}
      </div>

      {/* Step 1: Form */}
      {step === "form" && (
        <div className="card space-y-4">
          <h3 className="font-semibold text-white">İçerik Parametreleri</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-400 mb-2 block">İçerik Türü</label>
              <div className="grid grid-cols-2 gap-2">
                {CONTENT_TYPES.map((t) => (
                  <button
                    key={t.value}
                    onClick={() => setForm({ ...form, type: t.value })}
                    className={cn(
                      "py-2 px-3 rounded-lg text-sm border transition-all",
                      form.type === t.value
                        ? "bg-brand-950 border-brand-700 text-brand-300"
                        : "border-surface-border text-gray-500 hover:text-gray-300"
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-2 block">Hedef</label>
              <div className="space-y-1">
                {OBJECTIVES.map((o) => (
                  <button
                    key={o.value}
                    onClick={() => setForm({ ...form, objective: o.value })}
                    className={cn(
                      "w-full text-left py-1.5 px-3 rounded-lg text-sm border transition-all",
                      form.objective === o.value
                        ? "bg-brand-950 border-brand-700 text-brand-300"
                        : "border-transparent text-gray-500 hover:text-gray-300 hover:bg-surface-muted"
                    )}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Konu / Fikir *</label>
            <input
              className="input"
              placeholder="Örn: Sabah kahvesinin üretkenliğe etkisi"
              value={form.topic}
              onChange={(e) => setForm({ ...form, topic: e.target.value })}
            />
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">İçerik Pillar (opsiyonel)</label>
            <input
              className="input"
              placeholder="Örn: Eğitim, İlham, Tanıtım..."
              value={form.pillar}
              onChange={(e) => setForm({ ...form, pillar: e.target.value })}
            />
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Ek Bağlam (opsiyonel)</label>
            <textarea
              className="input resize-none min-h-[60px]"
              placeholder="Özel notlar, kampanya detayları..."
              value={form.additionalContext}
              onChange={(e) => setForm({ ...form, additionalContext: e.target.value })}
            />
          </div>
          <button onClick={generateCopy} disabled={loading} className="btn-primary w-full justify-center">
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
            {loading ? "AI Yazıyor..." : "Metin Oluştur"}
          </button>
        </div>
      )}

      {/* Step 2: Copy */}
      {step === "copy" && content && (
        <div className="space-y-4">
          <div className="card space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-white">Oluşturulan Metin</h3>
              <div className="flex gap-2">
                <button onClick={generateCopy} disabled={loading} className="btn-ghost text-xs">
                  <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
                  Yenile
                </button>
                <button onClick={copyCaption} className="btn-secondary text-xs">
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? "Kopyalandı" : "Kopyala"}
                </button>
              </div>
            </div>

            <div className="bg-surface-muted rounded-lg p-4 border border-surface-border">
              <p className="text-xs text-brand-400 font-semibold mb-2">HOOK</p>
              <p className="text-white font-medium">{content.hook}</p>
            </div>

            <div>
              <p className="text-xs text-gray-500 mb-2">Tam Caption</p>
              <div className="bg-surface rounded-lg p-4 border border-surface-border">
                <p className="text-sm text-gray-300 whitespace-pre-wrap">{content.caption}</p>
              </div>
            </div>

            <div>
              <p className="text-xs text-gray-500 mb-2">CTA</p>
              <p className="text-sm text-emerald-400 font-medium">{content.cta}</p>
            </div>

            <div>
              <p className="text-xs text-gray-500 mb-2">Hashtag'ler ({content.hashtags.length})</p>
              <div className="flex flex-wrap gap-1.5">
                {content.hashtags.map((h) => (
                  <span key={h} className="badge badge-blue">#{h}</span>
                ))}
              </div>
            </div>
          </div>

          {content.imagePrompt && (
            <div className="card space-y-3">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <Image className="w-4 h-4 text-cyan-400" />
                Görsel Oluştur
              </h3>
              <div className="bg-surface rounded-lg p-3 border border-surface-border">
                <p className="text-xs text-gray-500 mb-1">AI Görsel Prompt</p>
                <p className="text-sm text-gray-400">{content.imagePrompt}</p>
              </div>
              <button onClick={generateImage} disabled={imgLoading} className="btn-primary">
                {imgLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Image className="w-4 h-4" />}
                {imgLoading ? "Görsel Oluşturuluyor..." : "Görsel Oluştur (DALL-E 3)"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Step 3: Visual */}
      {step === "visual" && imageUrl && (
        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-white flex items-center gap-2">
              <Image className="w-4 h-4 text-cyan-400" />
              Oluşturulan Görsel
            </h3>
            <div className="flex gap-2">
              <button onClick={generateImage} disabled={imgLoading} className="btn-ghost text-xs">
                <RefreshCw className={cn("w-3.5 h-3.5", imgLoading && "animate-spin")} />
                Yeni Varyant
              </button>
              <a href={imageUrl} download target="_blank" rel="noreferrer" className="btn-secondary text-xs">
                <Download className="w-3.5 h-3.5" />
                İndir
              </a>
            </div>
          </div>
          <div className="rounded-xl overflow-hidden border border-surface-border aspect-square max-w-md mx-auto">
            <img src={imageUrl} alt="Generated" className="w-full h-full object-cover" />
          </div>
          <div className="flex gap-3">
            <button onClick={() => setStep("copy")} className="btn-secondary flex-1 justify-center text-sm">
              ← Metne Dön
            </button>
            <button className="btn-primary flex-1 justify-center text-sm">
              Takvime Ekle →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
