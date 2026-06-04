import { NextResponse } from "next/server";
import { memory } from "@/lib/memory/store";

export async function GET() {
  const [analytics, contentHistory] = await Promise.all([
    memory.getAnalytics(),
    memory.getContentHistory(),
  ]);
  const published = contentHistory.filter((c) => c.status === "published");
  const avgEngagement = published.length
    ? published.reduce((s, c) => s + (c.engagementRate ?? 0), 0) / published.length : 0;

  const byType = published.reduce((acc, c) => {
    acc[c.type] = (acc[c.type] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topPost = [...published].sort((a, b) => (b.engagementRate ?? 0) - (a.engagementRate ?? 0))[0];

  return NextResponse.json({
    totalPosts: published.length,
    avgEngagement: Math.round(avgEngagement * 100) / 100,
    byType, topPost,
    recentSnapshots: analytics.slice(0, 30),
    scheduled: contentHistory.filter((c) => c.status === "scheduled").length,
    drafts: contentHistory.filter((c) => c.status === "draft").length,
  });
}
