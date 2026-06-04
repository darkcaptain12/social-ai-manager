"use client";

import { useEffect, useState } from "react";
import {
  Instagram, Search, RefreshCw, Users, FileText, TrendingUp,
  CheckCircle2, AlertCircle, Sparkles, Edit3, Save,
} from "lucide-react";
import toast from "react-hot-toast";
import { cn, formatNumber } from "@/lib/utils";
import type { InstagramProfileData } from "@/app/api/instagram/profile/route";

export default function AudiencePage() {
  const [profile, setProfile] = useState<InstagramProfileData | null>(null);
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [editingStats, setEditingStats] = useState(false);
  const [manualStats, setManualStats] = useState({ followers: 0, following: 0, posts: 0 });

  useEffect(() => {
    fetch("/api/instagram/profile")
      .then((r) => r.json())
      .then((d) => {
        if (d.profile) {
          setProfile(d.profile);
          setManualStats({ followers: d.profile.followers, following: d.profile.following, posts: d.profile.posts });
        }
      });
  }, []);

  async function fetchProfile(u?: string) {
    const target = u ?? username;
    if (!target) { toast.error("Kullanıcı adı girin"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/instagram/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: target }),
      });
      const data = await res.json();
      if (data.profile) {
        setProfile(data.profile);
        setManualStats({ followers: data.profile.followers, following: data.profile.following, posts: data.profile.posts });
        toast.success("Profil analiz edildi!");
      } else {
        toast.error(data.error ?? "Profil bulunamadı");
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "";
      if (msg.includes("API key") || msg.includes("OpenAI")) {
        toast.error("OpenAI API key eksik — Ayarlar'dan ekleyin");
      } else {
        toast.error("Hata: " + msg.slice(0, 80));
      }
    } finally {
      setLoading(false);
    }
  }

  async function saveManualStats() {
    if (!profile) return;
    const updated = { ...profile, ...manualStats };
    setProfile(updated);
    // Re-run AI analysis with corrected stats
    setLoading(true);
    try {
      const res = await fetch("/api/instagram/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: profile.username,
          manualOverride: manualStats,
        }),
      });
      const data = await res.json();
      if (data.profile) {
        setProfile(data.profile);
        toast.success("İstatistikler güncellendi, AI yeniden analiz etti!");
      }
    } catch {
      // Optimistically save locally anyway
      toast.success("İstatistikler güncellendi!");
    } finally {
      setLoading(false);
      setEditingStats(false);
    }
  }

  async function refresh() {
    if (!profile) return;
    setRefreshing(true);
    await fetchProfile(profile.username);
    setRefreshing(false);
  }

  const statsZero = profile && profile.followers === 0 && profile.following === 0 && profile.posts === 0;

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-600 to-purple-600 flex items-center justify-center">
            <Instagram className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Profil & Kitle Analizi</h2>
            <p className="text-sm text-gray-500">Instagram hesabını analiz et, AI içgörü üretsin</p>
          </div>
        </div>
        {profile && (
          <button onClick={refresh} disabled={refreshing} className="btn-secondary text-sm">
            <RefreshCw className={cn("w-4 h-4", refreshing && "animate-spin")} />
            Yenile
          </button>
        )}
      </div>

      {/* Search */}
      <div className="card space-y-3">
        <h3 className="font-semibold text-white text-sm">Instagram Kullanıcı Adı</h3>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">@</span>
            <input
              className="input pl-7"
              placeholder="kullaniciadi"
              value={username}
              onChange={(e) => setUsername(e.target.value.replace(/^@/, ""))}
              onKeyDown={(e) => e.key === "Enter" && fetchProfile()}
            />
          </div>
          <button onClick={() => fetchProfile()} disabled={loading} className="btn-primary">
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            {loading ? "Analiz ediliyor..." : "Analiz Et"}
          </button>
        </div>
      </div>

      {/* Profile Data */}
      {profile && (
        <>
          {/* Profile Card */}
          <div className="card">
            <div className="flex items-start gap-4">
              {profile.profilePic ? (
                <img
                  src={profile.profilePic}
                  alt={profile.username}
                  className="w-16 h-16 rounded-full border-2 border-surface-border object-cover flex-shrink-0"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-gradient-brand flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold text-xl">{profile.username[0].toUpperCase()}</span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-white text-lg">{profile.fullName || `@${profile.username}`}</h3>
                  {profile.isVerified && <CheckCircle2 className="w-4 h-4 text-blue-400 flex-shrink-0" />}
                </div>
                <p className="text-sm text-gray-500">@{profile.username}</p>
                {profile.bio && <p className="text-sm text-gray-400 mt-2 leading-relaxed">{profile.bio}</p>}
                <div className="flex gap-2 mt-2 flex-wrap">
                  {profile.niche && profile.niche !== "Unknown" && (
                    <span className="badge badge-purple">{profile.niche}</span>
                  )}
                  {profile.sector && profile.sector !== "Unknown" && (
                    <span className="badge badge-blue">{profile.sector}</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Stats — with manual edit */}
          <div className="card space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-400">İstatistikler</h3>
              <button
                onClick={() => setEditingStats(!editingStats)}
                className="btn-ghost text-xs"
              >
                <Edit3 className="w-3.5 h-3.5" />
                {editingStats ? "İptal" : "Manuel Gir"}
              </button>
            </div>

            {/* Warning if all zeros */}
            {statsZero && !editingStats && (
              <div className="bg-amber-950/30 border border-amber-800/40 rounded-lg p-3 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-amber-300">
                  <p className="font-semibold">Instagram istatistikleri çekilemedi</p>
                  <p className="text-amber-400/80 mt-0.5">Instagram, sunucu isteklerini engelliyor. <button onClick={() => setEditingStats(true)} className="underline hover:text-amber-300">Manuel gir</button> butonuyla kendi takipçi sayını yazabilirsin — AI analiz için kullanır.</p>
                </div>
              </div>
            )}

            {editingStats ? (
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { key: "followers", label: "Takipçi" },
                    { key: "following", label: "Takip Edilen" },
                    { key: "posts", label: "Gönderi" },
                  ].map(({ key, label }) => (
                    <div key={key}>
                      <label className="text-xs text-gray-400 mb-1 block">{label}</label>
                      <input
                        type="number"
                        className="input text-center font-bold"
                        value={(manualStats as Record<string, number>)[key]}
                        onChange={(e) => setManualStats({ ...manualStats, [key]: parseInt(e.target.value) || 0 })}
                        min={0}
                      />
                    </div>
                  ))}
                </div>
                <button onClick={saveManualStats} disabled={loading} className="btn-primary text-sm w-full justify-center">
                  {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {loading ? "Kaydediliyor..." : "Kaydet & AI Analiz Et"}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: "Takipçi", value: profile.followers, icon: Users, color: "text-brand-400" },
                  { label: "Takip Edilen", value: profile.following, icon: Users, color: "text-purple-400" },
                  { label: "Gönderi", value: profile.posts, icon: FileText, color: "text-emerald-400" },
                ].map((s) => (
                  <div key={s.label} className="bg-surface-muted rounded-xl p-4 text-center">
                    <p className={cn("text-2xl font-bold", s.color)}>
                      {s.value > 0 ? formatNumber(s.value) : "—"}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{s.label}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* AI Analysis */}
          {(profile.contentStyle || profile.audienceType) && (
            <div className="card space-y-4">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-brand-400" />
                AI Analizi
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {profile.contentStyle && profile.contentStyle !== "Unknown" && (
                  <div className="bg-surface-muted rounded-lg p-3">
                    <p className="text-xs text-gray-500 mb-1">İçerik Stili</p>
                    <p className="text-sm text-gray-300">{profile.contentStyle}</p>
                  </div>
                )}
                {profile.audienceType && profile.audienceType !== "Unknown" && (
                  <div className="bg-surface-muted rounded-lg p-3">
                    <p className="text-xs text-gray-500 mb-1">Hedef Kitle</p>
                    <p className="text-sm text-gray-300">{profile.audienceType}</p>
                  </div>
                )}
                {profile.engagementEstimate && !profile.engagementEstimate.toLowerCase().includes("unknown") && !profile.engagementEstimate.toLowerCase().includes("no ") && !profile.engagementEstimate.toLowerCase().includes("henüz") && (
                  <div className="bg-surface-muted rounded-lg p-3">
                    <p className="text-xs text-gray-500 mb-1">Tahmini Etkileşim</p>
                    <p className="text-sm text-emerald-400">{profile.engagementEstimate}</p>
                  </div>
                )}
                <div className="bg-surface-muted rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">Son Güncelleme</p>
                  <p className="text-sm text-gray-400">
                    {new Date(profile.fetchedAt).toLocaleString("tr-TR")}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Insights */}
          {profile.insights && profile.insights.length > 0 && (
            <div className="card space-y-3">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-amber-400" />
                Stratejik İçgörüler
              </h3>
              <ul className="space-y-2">
                {profile.insights.map((insight, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-400">
                    <span className="w-5 h-5 rounded-full bg-brand-950 border border-brand-800 text-brand-400 text-xs flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                    {insight}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}

      {!profile && !loading && (
        <div className="card text-center py-12">
          <Instagram className="w-12 h-12 text-gray-700 mx-auto mb-3" />
          <p className="text-gray-400 font-medium">Henüz profil eklenmedi</p>
          <p className="text-gray-600 text-sm mt-1">Instagram kullanıcı adını girerek analiz başlat</p>
        </div>
      )}
    </div>
  );
}
