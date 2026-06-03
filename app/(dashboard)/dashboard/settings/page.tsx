"use client";

import { useEffect, useState } from "react";
import { Settings, Eye, EyeOff, Save, RefreshCw, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";

interface SettingsForm {
  openaiApiKey: string;
  anthropicApiKey: string;
  geminiApiKey: string;
  imageProvider: string;
  instagramAccessToken: string;
  instagramAccountId: string;
  language: string;
  autoSchedule: boolean;
  nightly_jobs: boolean;
}

const IMAGE_PROVIDERS = [
  { value: "openai", label: "OpenAI DALL-E 3", desc: "Yüksek kalite, metin desteği" },
  { value: "ideogram", label: "Ideogram", desc: "Metin ağırlıklı görseller" },
  { value: "flux", label: "Flux", desc: "Maliyet etkin seçenek" },
  { value: "stability", label: "Stability AI", desc: "Özelleştirilebilir modeller" },
];

export default function SettingsPage() {
  const [form, setForm] = useState<SettingsForm>({
    openaiApiKey: "", anthropicApiKey: "", geminiApiKey: "",
    imageProvider: "openai", instagramAccessToken: "", instagramAccountId: "",
    language: "tr", autoSchedule: false, nightly_jobs: true,
  });
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => setForm((prev) => ({ ...prev, ...d })));
  }, []);

  async function save() {
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 3000); toast.success("Ayarlar kaydedildi!"); }
    } catch { toast.error("Kayıt başarısız"); }
    finally { setSaving(false); }
  }

  function toggleShow(key: string) {
    setShowKeys((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  const apiKeys = [
    { key: "openaiApiKey", label: "OpenAI API Key", placeholder: "sk-..." },
    { key: "anthropicApiKey", label: "Anthropic (Claude) API Key", placeholder: "sk-ant-..." },
    { key: "geminiApiKey", label: "Google Gemini API Key", placeholder: "AI..." },
  ];

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gray-600/20 border border-gray-700/30 flex items-center justify-center">
            <Settings className="w-5 h-5 text-gray-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Ayarlar</h2>
            <p className="text-sm text-gray-500">API anahtarları ve sistem yapılandırması</p>
          </div>
        </div>
        <button onClick={save} disabled={saving} className="btn-primary text-sm">
          {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : saved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saved ? "Kaydedildi" : "Kaydet"}
        </button>
      </div>

      {/* API Keys */}
      <div className="card space-y-4">
        <h3 className="font-semibold text-white">AI API Anahtarları</h3>
        <p className="text-xs text-gray-500">Anahtarlar şifreli olarak saklanır. Asla dışa aktarılmaz.</p>
        {apiKeys.map(({ key, label, placeholder }) => (
          <div key={key}>
            <label className="text-xs text-gray-400 mb-1 block">{label}</label>
            <div className="relative">
              <input
                type={showKeys[key] ? "text" : "password"}
                className="input pr-10"
                placeholder={placeholder}
                value={(form as Record<string, string>)[key] ?? ""}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
              />
              <button
                type="button"
                onClick={() => toggleShow(key)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
              >
                {showKeys[key] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Image Provider */}
      <div className="card space-y-4">
        <h3 className="font-semibold text-white">Görsel Üretim Sağlayıcı</h3>
        <div className="grid grid-cols-2 gap-3">
          {IMAGE_PROVIDERS.map((p) => (
            <button
              key={p.value}
              onClick={() => setForm({ ...form, imageProvider: p.value })}
              className={cn(
                "text-left p-3 rounded-lg border transition-all",
                form.imageProvider === p.value
                  ? "bg-brand-950 border-brand-700"
                  : "border-surface-border hover:border-gray-600"
              )}
            >
              <p className={cn("text-sm font-medium", form.imageProvider === p.value ? "text-brand-300" : "text-gray-300")}>
                {p.label}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">{p.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Instagram */}
      <div className="card space-y-4">
        <h3 className="font-semibold text-white">Instagram Bağlantısı</h3>
        <p className="text-xs text-gray-500">Instagram Graph API erişim token'ı</p>
        <div>
          <label className="text-xs text-gray-400 mb-1 block">Access Token</label>
          <input
            type="password"
            className="input"
            placeholder="EAAG..."
            value={form.instagramAccessToken}
            onChange={(e) => setForm({ ...form, instagramAccessToken: e.target.value })}
          />
        </div>
        <div>
          <label className="text-xs text-gray-400 mb-1 block">Instagram Account ID</label>
          <input
            className="input"
            placeholder="17841..."
            value={form.instagramAccountId}
            onChange={(e) => setForm({ ...form, instagramAccountId: e.target.value })}
          />
        </div>
      </div>

      {/* General */}
      <div className="card space-y-4">
        <h3 className="font-semibold text-white">Genel Ayarlar</h3>
        <div>
          <label className="text-xs text-gray-400 mb-2 block">Sistem Dili</label>
          <div className="flex gap-2">
            {[{ value: "tr", label: "Türkçe 🇹🇷" }, { value: "en", label: "English 🇬🇧" }].map((l) => (
              <button
                key={l.value}
                onClick={() => setForm({ ...form, language: l.value })}
                className={cn(
                  "px-4 py-2 rounded-lg border text-sm transition-all",
                  form.language === l.value
                    ? "bg-brand-950 border-brand-700 text-brand-300"
                    : "border-surface-border text-gray-500 hover:text-gray-300"
                )}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between py-2 border-t border-surface-border">
          <div>
            <p className="text-sm text-white">Otomatik Planlama</p>
            <p className="text-xs text-gray-500">AI'nın içerikleri otomatik zamanlıyor</p>
          </div>
          <button
            onClick={() => setForm({ ...form, autoSchedule: !form.autoSchedule })}
            className={cn(
              "w-10 h-5 rounded-full transition-all relative",
              form.autoSchedule ? "bg-brand-600" : "bg-surface-border"
            )}
          >
            <span className={cn(
              "absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all shadow",
              form.autoSchedule ? "left-5" : "left-0.5"
            )} />
          </button>
        </div>

        <div className="flex items-center justify-between py-2 border-t border-surface-border">
          <div>
            <p className="text-sm text-white">Gece Otomasyonu</p>
            <p className="text-xs text-gray-500">Rakip tarama, trend analizi gece çalışır</p>
          </div>
          <button
            onClick={() => setForm({ ...form, nightly_jobs: !form.nightly_jobs })}
            className={cn(
              "w-10 h-5 rounded-full transition-all relative",
              form.nightly_jobs ? "bg-brand-600" : "bg-surface-border"
            )}
          >
            <span className={cn(
              "absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all shadow",
              form.nightly_jobs ? "left-5" : "left-0.5"
            )} />
          </button>
        </div>
      </div>
    </div>
  );
}
