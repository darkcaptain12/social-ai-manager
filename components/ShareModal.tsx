"use client";

import { useState } from "react";
import { Instagram, Copy, Check, Download, ExternalLink, X, Smartphone, Monitor } from "lucide-react";
import { cn } from "@/lib/utils";

interface ShareModalProps {
  caption: string;
  hashtags: string[];
  imageUrl?: string;
  onClose: () => void;
}

export function ShareModal({ caption, hashtags, imageUrl, onClose }: ShareModalProps) {
  const [captionCopied, setCaptionCopied] = useState(false);
  const [hashtagsCopied, setHashtagsCopied] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);

  const fullCaption = `${caption}\n\n${hashtags.map((h) => `#${h}`).join(" ")}`;
  const hashtagText = hashtags.map((h) => `#${h}`).join(" ");
  const isMobile = typeof navigator !== "undefined" && /iPhone|iPad|Android/i.test(navigator.userAgent);

  async function copyCaption() {
    await navigator.clipboard.writeText(fullCaption);
    setCaptionCopied(true);
    setTimeout(() => setCaptionCopied(false), 2500);
    setStep(2);
  }

  async function copyHashtags() {
    await navigator.clipboard.writeText(hashtagText);
    setHashtagsCopied(true);
    setTimeout(() => setHashtagsCopied(false), 2500);
  }

  function downloadImage() {
    if (!imageUrl) return;
    const a = document.createElement("a");
    a.href = imageUrl;
    a.download = "social-ai-post.jpg";
    a.target = "_blank";
    a.click();
    setStep(3);
  }

  function openInstagram() {
    // Try mobile deep link first, fallback to web
    const mobileLink = "instagram://camera";
    const webLink = "https://www.instagram.com/create/select/";

    if (isMobile) {
      // Try app deep link
      window.location.href = mobileLink;
      // Fallback to web after 1.5s if app not installed
      setTimeout(() => { window.open(webLink, "_blank"); }, 1500);
    } else {
      window.open(webLink, "_blank");
    }
  }

  async function nativeShare() {
    if (!navigator.share) return;
    try {
      const shareData: ShareData = { text: fullCaption };

      // Try to include image file if available
      if (imageUrl) {
        try {
          const res = await fetch(imageUrl);
          const blob = await res.blob();
          const file = new File([blob], "post.jpg", { type: "image/jpeg" });
          if (navigator.canShare?.({ files: [file] })) {
            shareData.files = [file];
          }
        } catch {
          // Image fetch failed, share text only
        }
      }

      await navigator.share(shareData);
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        // Fallback to manual flow
        copyCaption();
      }
    }
  }

  const steps = [
    { n: 1, label: "Caption Kopyala", done: captionCopied || step > 1 },
    { n: 2, label: "Görseli İndir", done: step > 2, skip: !imageUrl },
    { n: 3, label: "Instagram'ı Aç", done: false },
  ];

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-surface-card border border-surface-border rounded-2xl w-full max-w-md shadow-2xl animate-slide-up">

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-surface-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-pink-500 via-purple-500 to-orange-400 flex items-center justify-center">
              <Instagram className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-white">Instagram'da Paylaş</h2>
              <p className="text-xs text-gray-500">3 adımda paylaş</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">

          {/* Mobile: native share button */}
          {isMobile && navigator.share && (
            <button
              onClick={nativeShare}
              className="w-full flex items-center justify-center gap-3 py-3.5 rounded-xl
                         bg-gradient-to-r from-pink-500 via-purple-500 to-orange-400
                         text-white font-bold text-sm shadow-lg transition-all hover:opacity-90"
            >
              <Smartphone className="w-5 h-5" />
              Paylaş (Instagram, WhatsApp, vb.)
            </button>
          )}

          {/* Step indicators */}
          <div className="flex items-center gap-2">
            {steps.filter(s => !s.skip).map((s, i, arr) => (
              <div key={s.n} className="flex items-center gap-2 flex-1">
                <div className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all",
                  s.done ? "bg-emerald-500 text-white" :
                  step === s.n ? "bg-brand-600 text-white" :
                  "bg-surface-muted text-gray-500 border border-surface-border"
                )}>
                  {s.done ? <Check className="w-3.5 h-3.5" /> : s.n}
                </div>
                <span className={cn(
                  "text-xs truncate",
                  s.done ? "text-emerald-400" : step === s.n ? "text-white" : "text-gray-600"
                )}>
                  {s.label}
                </span>
                {i < arr.length - 1 && <div className="flex-1 h-px bg-surface-border" />}
              </div>
            ))}
          </div>

          {/* Caption preview */}
          <div className="bg-surface rounded-xl border border-surface-border p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">Caption</span>
              <button
                onClick={copyHashtags}
                className="text-xs text-gray-500 hover:text-brand-400 transition-colors flex items-center gap-1"
              >
                {hashtagsCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                {hashtagsCopied ? "Kopyalandı" : "Sadece hashtag"}
              </button>
            </div>
            <p className="text-sm text-gray-300 line-clamp-4 leading-relaxed">{caption}</p>
            <div className="flex flex-wrap gap-1 pt-1 border-t border-surface-border">
              {hashtags.slice(0, 8).map((h) => (
                <span key={h} className="text-xs text-brand-400">#{h}</span>
              ))}
              {hashtags.length > 8 && <span className="text-xs text-gray-600">+{hashtags.length - 8}</span>}
            </div>
          </div>

          {/* Image preview */}
          {imageUrl && (
            <div className="relative rounded-xl overflow-hidden border border-surface-border aspect-square max-h-48 bg-surface">
              <img src={imageUrl} alt="Post görseli" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
            </div>
          )}

          {/* Action buttons */}
          <div className="space-y-2.5">

            {/* Step 1: Copy caption */}
            <button
              onClick={copyCaption}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all",
                step === 1
                  ? "bg-brand-600 hover:bg-brand-500 text-white shadow-lg shadow-brand-900/30"
                  : captionCopied || step > 1
                  ? "bg-emerald-900/30 border border-emerald-700/50 text-emerald-400"
                  : "bg-surface-muted border border-surface-border text-gray-300 hover:text-white"
              )}
            >
              {captionCopied || step > 1
                ? <Check className="w-4 h-4 flex-shrink-0" />
                : <Copy className="w-4 h-4 flex-shrink-0" />}
              <span className="flex-1 text-left">
                {captionCopied || step > 1 ? "Caption kopyalandı ✓" : "1. Caption + Hashtag'leri Kopyala"}
              </span>
              {step === 1 && <span className="text-xs opacity-70">Adım 1</span>}
            </button>

            {/* Step 2: Download image */}
            {imageUrl && (
              <button
                onClick={downloadImage}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all",
                  step === 2
                    ? "bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-900/30"
                    : step > 2
                    ? "bg-emerald-900/30 border border-emerald-700/50 text-emerald-400"
                    : "bg-surface-muted border border-surface-border text-gray-500"
                )}
              >
                {step > 2
                  ? <Check className="w-4 h-4 flex-shrink-0" />
                  : <Download className="w-4 h-4 flex-shrink-0" />}
                <span className="flex-1 text-left">
                  {step > 2 ? "Görsel indirildi ✓" : "2. Görseli İndir"}
                </span>
                {step === 2 && <span className="text-xs opacity-70">Adım 2</span>}
              </button>
            )}

            {/* Step 3: Open Instagram */}
            <button
              onClick={openInstagram}
              disabled={step < (imageUrl ? 3 : 2)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-bold text-sm transition-all",
                step >= (imageUrl ? 3 : 2)
                  ? "bg-gradient-to-r from-pink-500 via-purple-500 to-orange-400 text-white shadow-lg hover:opacity-90"
                  : "bg-surface-muted border border-surface-border text-gray-600 cursor-not-allowed opacity-50"
              )}
            >
              <Instagram className="w-5 h-5 flex-shrink-0" />
              <span className="flex-1 text-left">
                {isMobile ? "Instagram Uygulamasını Aç" : "Instagram.com'u Aç"}
              </span>
              <ExternalLink className="w-4 h-4 opacity-70" />
            </button>
          </div>

          {/* Hint */}
          <div className="flex items-start gap-2 bg-amber-950/20 border border-amber-800/30 rounded-lg p-3">
            <span className="text-amber-400 text-sm">💡</span>
            <p className="text-xs text-amber-300/80">
              Instagram açıldığında <strong>yeni post oluştur</strong> → galeriden indirdiğin görseli seç → caption alanına <strong>yapıştır</strong> (uzun bas → Yapıştır)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
