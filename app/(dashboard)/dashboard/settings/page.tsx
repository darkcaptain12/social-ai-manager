"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Settings, Eye, EyeOff, Save, RefreshCw, CheckCircle2, Instagram, Link2, Unlink, AlertCircle } from "lucide-react";
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

interface IGStatus {
  connected: boolean;
  username?: string;
  accountId?: string;
}

const IMAGE_PROVIDERS = [
  { value: "openai", label: "OpenAI DALL-E 3", desc: "Yüksek kalite, metin desteği" },
  { value: "ideogram", label: "Ideogram", desc: "Metin ağırlıklı görseller" },
  { value: "flux", label: "Flux", desc: "Maliyet etkin seçenek" },
  { value: "stability", label: "Stability AI", desc: "Özelleştirilebilir modeller" },
];

export default function SettingsPage() {
  return (
    <Suspense>
      <SettingsInner />
    </Suspense>
  );
}

function SettingsInner() {
  const [form, setForm] = useState<SettingsForm>({
    openaiApiKey: "", anthropicApiKey: "", geminiApiKey: "",
    imageProvider: "openai", instagramAccessToken: "", instagramAccountId: "",
    language: "tr", autoSchedule: false, nightly_jobs: true,
  });
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [igStatus, setIgStatus] = useState<IGStatus>({ connected: false });
  const [igConnecting, setIgConnecting] = useState(false);
  const [appIdMissing, setAppIdMissing] = useState(false);
  const searchParams = useSearchParams();

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => {
        setForm((prev) => ({ ...prev, ...d }));
        // If token exists in settings, mark as connected
        if (d.instagramAccessToken) {
          setIgStatus({
            connected: true,
            accountId: d.instagramAccountId,
          });
        }
      });
  }, []);

  // Handle OAuth callback query params
  useEffect(() => {
    const connected = searchParams.get("ig_connected");
    const error = searchParams.get("ig_error");
    const username = searchParams.get("ig_username");
    if (connected === "1") {
      setIgStatus({ connected: true, username: username ?? undefined });
      toast.success(`Instagram bağlandı${username ? `: @${username}` : ""}!`);
    }
    if (error) {
      toast.error(`Instagram hatası: ${decodeURIComponent(error)}`);
    }
  }, [searchParams]);

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

  async function connectInstagram() {
    setIgConnecting(true);
    try {
      const res = await fetch("/api/instagram/auth");
      const data = await res.json();
      if (data.error) {
        setAppIdMissing(true);
        toast.error("INSTAGRAM_APP_ID tanımlanmamış. .env.local dosyasına ekleyin.");
        return;
      }
      window.location.href = data.url;
    } catch {
      toast.error("OAuth başlatılamadı");
    } finally {
      setIgConnecting(false);
    }
  }

  async function disconnectInstagram() {
    await fetch("/api/instagram", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "disconnect" }),
    });
    setIgStatus({ connected: false });
    setForm((prev) => ({ ...prev, instagramAccessToken: "", instagramAccountId: "" }));
    toast.success("Instagram bağlantısı kesildi");
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
                value={(form as unknown as Record<string, string>)[key] ?? ""}
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
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-pink-600 to-purple-600 flex items-center justify-center flex-shrink-0">
            <Instagram className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Instagram Bağlantısı</h3>
            <p className="text-xs text-gray-500">Meta Graph API ile hesabınızı bağlayın</p>
          </div>
          {igStatus.connected && (
            <span className="ml-auto badge badge-green flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Bağlı
            </span>
          )}
        </div>

        {igStatus.connected ? (
          /* ── CONNECTED STATE ── */
          <div className="space-y-3">
            <div className="bg-emerald-950/30 border border-emerald-800/40 rounded-xl p-4 flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              <div>
                {igStatus.username && (
                  <p className="text-sm font-semibold text-white">@{igStatus.username}</p>
                )}
                {igStatus.accountId && (
                  <p className="text-xs text-gray-500">Hesap ID: {igStatus.accountId}</p>
                )}
                {!igStatus.username && !igStatus.accountId && (
                  <p className="text-sm text-emerald-300">Instagram hesabı bağlı</p>
                )}
              </div>
            </div>
            <button
              onClick={disconnectInstagram}
              className="btn-ghost text-sm text-red-400 hover:text-red-300 hover:bg-red-950/20"
            >
              <Unlink className="w-4 h-4" />
              Bağlantıyı Kes
            </button>
          </div>
        ) : (
          /* ── DISCONNECTED STATE ── */
          <div className="space-y-3">
            <button
              onClick={connectInstagram}
              disabled={igConnecting}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl
                         bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500
                         text-white font-semibold transition-all duration-200 shadow-lg shadow-pink-900/20"
            >
              {igConnecting ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                <Instagram className="w-5 h-5" />
              )}
              {igConnecting ? "Yönlendiriliyor..." : "Instagram ile Bağlan"}
            </button>

            {appIdMissing && (
              <div className="bg-amber-950/30 border border-amber-800/40 rounded-xl p-3 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-amber-300 space-y-1">
                  <p className="font-semibold">Meta App ID gerekli</p>
                  <p className="text-amber-400">.env.local dosyasına ekleyin:</p>
                  <code className="block bg-black/30 rounded px-2 py-1 text-amber-200 font-mono">
                    INSTAGRAM_APP_ID=your_app_id{"\n"}
                    INSTAGRAM_APP_SECRET=your_app_secret{"\n"}
                    NEXT_PUBLIC_APP_URL=http://localhost:3000
                  </code>
                  <a
                    href="https://developers.facebook.com/apps"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-brand-400 hover:underline mt-1"
                  >
                    <Link2 className="w-3 h-3" />
                    Meta Developer Console
                  </a>
                </div>
              </div>
            )}

            {/* Fallback: manual token */}
            <details className="group">
              <summary className="text-xs text-gray-600 hover:text-gray-400 cursor-pointer select-none transition-colors">
                Manuel token ile bağla (gelişmiş)
              </summary>
              <div className="mt-3 space-y-3">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Access Token</label>
                  <div className="relative">
                    <input
                      type={showKeys["igToken"] ? "text" : "password"}
                      className="input pr-10 text-sm"
                      placeholder="EAAG..."
                      value={form.instagramAccessToken}
                      onChange={(e) => setForm({ ...form, instagramAccessToken: e.target.value })}
                    />
                    <button
                      type="button"
                      onClick={() => toggleShow("igToken")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                    >
                      {showKeys["igToken"] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Account ID</label>
                  <input
                    className="input text-sm"
                    placeholder="17841..."
                    value={form.instagramAccountId}
                    onChange={(e) => setForm({ ...form, instagramAccountId: e.target.value })}
                  />
                </div>
              </div>
            </details>
          </div>
        )}
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
