"use client";

import { useEffect, useState } from "react";
import { BarChart2, TrendingUp, Users, Image, RefreshCw } from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import { formatNumber } from "@/lib/utils";

interface AnalyticsData {
  totalPosts: number;
  avgEngagement: number;
  scheduled: number;
  drafts: number;
  byType: Record<string, number>;
  recentSnapshots: Array<{ date: string; followers: number; engagementRate: number; reach: number }>;
}

const PIE_COLORS = ["#6371f5", "#a855f7", "#ec4899", "#f59e0b", "#10b981"];

const MOCK_GROWTH = Array.from({ length: 14 }, (_, i) => ({
  date: `${i + 1}/6`,
  takipçi: 1200 + i * 45 + Math.floor(Math.random() * 30),
  etkileşim: 3.2 + Math.random() * 1.5,
  erişim: 2400 + i * 120,
}));

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/analytics")
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const pieData = data?.byType
    ? Object.entries(data.byType).map(([name, value]) => ({ name, value }))
    : [];

  const statCards = [
    { label: "Toplam İçerik", value: data?.totalPosts ?? 0, icon: Image, change: "+12", changeLabel: "bu ay" },
    { label: "Ort. Etkileşim", value: `${data?.avgEngagement ?? 0}%`, icon: TrendingUp, change: "+0.8%", changeLabel: "geçen aya göre" },
    { label: "Planlanan", value: data?.scheduled ?? 0, icon: BarChart2, change: "", changeLabel: "bu hafta" },
    { label: "Taslak", value: data?.drafts ?? 0, icon: RefreshCw, change: "", changeLabel: "bekliyor" },
  ];

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-sky-600/20 border border-sky-700/30 flex items-center justify-center">
          <BarChart2 className="w-5 h-5 text-sky-400" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-white">Analitik</h2>
          <p className="text-sm text-gray-500">Performans özeti</p>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <div key={s.label} className="stat-card">
            <div className="flex items-center justify-between">
              <s.icon className="w-4 h-4 text-gray-500" />
              {s.change && <span className="text-xs text-emerald-400 font-medium">{s.change}</span>}
            </div>
            <p className="text-2xl font-bold text-white mt-2">
              {loading ? "—" : s.value}
            </p>
            <p className="text-xs text-gray-500">{s.label}</p>
            <p className="text-xs text-gray-600">{s.changeLabel}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Follower growth */}
        <div className="lg:col-span-2 card">
          <h3 className="font-semibold text-white mb-4">Takipçi Büyümesi (14 Gün)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={MOCK_GROWTH}>
              <CartesianGrid strokeDasharray="3 3" stroke="#252540" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#6b7280" }} />
              <YAxis tick={{ fontSize: 11, fill: "#6b7280" }} />
              <Tooltip
                contentStyle={{ background: "#16162a", border: "1px solid #252540", borderRadius: "8px", color: "#fff" }}
              />
              <Line type="monotone" dataKey="takipçi" stroke="#6371f5" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Content by type */}
        <div className="card">
          <h3 className="font-semibold text-white mb-4">İçerik Türü Dağılımı</h3>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="value">
                  {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "#16162a", border: "1px solid #252540", borderRadius: "8px", color: "#fff" }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col gap-2 mt-4">
              {[
                { name: "Post", value: 45 },
                { name: "Reel", value: 30 },
                { name: "Story", value: 20 },
                { name: "Carousel", value: 5 },
              ].map((item, i) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: PIE_COLORS[i] }} />
                  <span className="text-xs text-gray-400 flex-1">{item.name}</span>
                  <span className="text-xs text-gray-500">{item.value}%</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Engagement chart */}
      <div className="card">
        <h3 className="font-semibold text-white mb-4">Etkileşim Oranı (%)</h3>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={MOCK_GROWTH}>
            <CartesianGrid strokeDasharray="3 3" stroke="#252540" />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#6b7280" }} />
            <YAxis tick={{ fontSize: 11, fill: "#6b7280" }} domain={[0, 6]} />
            <Tooltip contentStyle={{ background: "#16162a", border: "1px solid #252540", borderRadius: "8px", color: "#fff" }} />
            <Bar dataKey="etkileşim" fill="#a855f7" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Insights */}
      <div className="card">
        <h3 className="font-semibold text-white mb-3">AI Öngörüleri</h3>
        <div className="grid grid-cols-3 gap-4">
          {[
            { insight: "En iyi yayın saatiniz 18:00-20:00 arasıdır. Bu saatlerde erişim %23 daha yüksek.", type: "timing" },
            { insight: "Reel içerikler post içeriklere göre 3x daha fazla etkileşim alıyor. Daha fazla reel planlayın.", type: "format" },
            { insight: "Eğitim kategorisindeki içerikler kaydetme oranında %40 üstün. Bu pilları artırın.", type: "content" },
          ].map((item, i) => (
            <div key={i} className="bg-surface-muted rounded-lg p-3 border border-surface-border">
              <div className="w-2 h-2 rounded-full bg-brand-400 mb-2" />
              <p className="text-xs text-gray-300">{item.insight}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
