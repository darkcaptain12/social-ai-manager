"use client";

import { useEffect, useState } from "react";
import { Instagram, Search, RefreshCw, Users, FileText, TrendingUp, CheckCircle2, AlertCircle, Sparkles } from "lucide-react";
import toast from "react-hot-toast";
import { cn, formatNumber } from "@/lib/utils";
import type { InstagramProfileData } from "@/app/api/instagram/profile/route";

export default function AudiencePage() {
  const [profile, setProfile] = useState<InstagramProfileData | null>(null);
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetch("/api/instagram/profile")
      .then((r) => r.json())
      .then((d) => { if (d.profile) setProfile(d.profile); });
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
        toast.success("Profil analiz edildi!");
      } else {
        toast.error(data.error ?? "Profil bulunamadı");
      }
    } catch {
      toast.error("Bağlantı hatası");
    } finally {
      setLoading(false);
    }
  }

  async function refresh() {
    if (!profile) return;
    setRefreshing(true);
    await fetchProfile(profile.username);
    setRefreshing(false);
  }

  const engagementRatio = profile && profile.followers > 0
    ? ((profile.posts / profile.followers) * 100).toFixed(2)
    : "—";

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
            <p className="text-sm text-gray-500">Instagram hesabını bağla, AI analiz etsin</p>
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
        <p className="text-xs text-gray-500">Herkese açık (public) hesaplar için çalışır. Giriş yapmak gerekmez.</p>
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
            {loading ? "Analiz..." : "Analiz Et"}
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
                  {profile.isVerified && (
                    <CheckCircle2 className="w-4 h-4 text-blue-400 flex-shrink-0" />
                  )}
                </div>
                <p className="text-sm text-gray-500">@{profile.username}</p>
                {profile.bio && (
                  <p className="text-sm text-gray-400 mt-2 leading-relaxed">{profile.bio}</p>
                )}
                {profile.niche && (
                  <div className="flex gap-2 mt-2">
                    <span className="badge badge-purple">{profile.niche}</span>
                    {profile.sector && <span className="badge badge-blue">{profile.sector}</span>}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Takipçi", value: formatNumber(profile.followers), icon: Users, color: "text-brand-400" },
              { label: "Takip Edilen", value: formatNumber(profile.following), icon: Users, color: "text-purple-400" },
              { label: "Gönderi", value: formatNumber(profile.posts), icon: FileText, color: "text-emerald-400" },
            ].map((s) => (
              <div key={s.label} className="stat-card">
                <s.icon className={cn("w-4 h-4", s.color)} />
                <p className="text-2xl font-bold text-white mt-2">{s.value}</p>
                <p className="text-xs text-gray-500">{s.label}</p>
              </div>
            ))}
          </div>

          {/* AI Analysis */}
          {(profile.contentStyle || profile.audienceType || profile.engagementEstimate) && (
            <div className="card space-y-4">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-brand-400" />
                AI Analizi
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {profile.contentStyle && (
                  <div className="bg-surface-muted rounded-lg p-3">
                    <p className="text-xs text-gray-500 mb-1">İçerik Stili</p>
                    <p className="text-sm text-gray-300">{profile.contentStyle}</p>
                  </div>
                )}
                {profile.audienceType && (
                  <div className="bg-surface-muted rounded-lg p-3">
                    <p className="text-xs text-gray-500 mb-1">Hedef Kitle</p>
                    <p className="text-sm text-gray-300">{profile.audienceType}</p>
                  </div>
                )}
                {profile.engagementEstimate && (
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
                    <span className="w-5 h-5 rounded-full bg-brand-950 border border-brand-800 text-brand-400 text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    {insight}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Follower ratio insight */}
          <div className="card bg-amber-950/20 border-amber-800/30">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-amber-300/80">
                <p className="font-semibold mb-1">Önerilen Aksiyon</p>
                <p>
                  {profile.followers > 10000
                    ? "Mikro-influencer seviyesindesin. İçerik kalitesini artırarak makro seviyeye ulaşabilirsin."
                    : profile.followers > 1000
                    ? "Büyüme aşamasındasın. Tutarlı paylaşım ve etkileşim ile takipçi artışını hızlandır."
                    : "Hesap büyüme döneminde. Nişe özel içerikler ve hashtag stratejisi kritik önemde."}
                </p>
              </div>
            </div>
          </div>
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
