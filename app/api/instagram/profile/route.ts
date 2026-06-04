import { NextRequest, NextResponse } from "next/server";
import { memory } from "@/lib/memory/store";
import { runAI, parseJSON } from "@/lib/agents/base";

export interface InstagramProfileData {
  username: string;
  fullName: string;
  bio: string;
  followers: number;
  following: number;
  posts: number;
  isVerified: boolean;
  profilePic?: string;
  // AI-analyzed fields
  niche?: string;
  sector?: string;
  contentStyle?: string;
  audienceType?: string;
  engagementEstimate?: string;
  insights?: string[];
  fetchedAt: string;
}

/**
 * Fetch public Instagram profile data.
 * Uses Instagram's unofficial API endpoint that works for public profiles.
 */
async function fetchInstagramProfile(username: string): Promise<InstagramProfileData | null> {
  const clean = username.replace(/^@/, "").replace(/https?:\/\/(www\.)?instagram\.com\/?/, "").replace(/\/$/, "").split("?")[0].split("/")[0];

  // Method 1: Instagram's internal API (works for public profiles)
  try {
    const res = await fetch(
      `https://www.instagram.com/api/v1/users/web_profile_info/?username=${clean}`,
      {
        headers: {
          "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "application/json",
          "Accept-Language": "tr-TR,tr;q=0.9,en-US;q=0.8",
          "x-ig-app-id": "936619743392459",
          "x-requested-with": "XMLHttpRequest",
          "Referer": `https://www.instagram.com/${clean}/`,
          "Origin": "https://www.instagram.com",
        },
      }
    );

    if (res.ok) {
      const data = await res.json();
      const user = data?.data?.user;
      if (user) {
        return {
          username: clean,
          fullName: user.full_name || "",
          bio: user.biography || "",
          followers: user.edge_followed_by?.count ?? 0,
          following: user.edge_follow?.count ?? 0,
          posts: user.edge_owner_to_timeline_media?.count ?? 0,
          isVerified: user.is_verified ?? false,
          profilePic: user.profile_pic_url_hd || user.profile_pic_url,
          fetchedAt: new Date().toISOString(),
        };
      }
    }
  } catch {
    // try next method
  }

  // Method 2: Parse HTML meta tags from public profile page
  try {
    const res = await fetch(`https://www.instagram.com/${clean}/`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
        "Accept": "text/html,application/xhtml+xml",
        "Accept-Language": "tr-TR,tr;q=0.9",
      },
    });

    if (res.ok) {
      const html = await res.text();

      // Parse description meta tag: "X Followers, Y Following, Z Posts"
      const descMatch = html.match(/<meta[^>]+name="description"[^>]+content="([^"]+)"/i)
        || html.match(/<meta[^>]+content="([^"]+)"[^>]+name="description"/i);
      const ogDescMatch = html.match(/<meta[^>]+property="og:description"[^>]+content="([^"]+)"/i)
        || html.match(/<meta[^>]+content="([^"]+)"[^>]+property="og:description"/i);
      const titleMatch = html.match(/<meta[^>]+property="og:title"[^>]+content="([^"]+)"/i)
        || html.match(/<meta[^>]+content="([^"]+)"[^>]+property="og:title"/i);
      const imgMatch = html.match(/<meta[^>]+property="og:image"[^>]+content="([^"]+)"/i)
        || html.match(/<meta[^>]+content="([^"]+)"[^>]+property="og:image"/i);

      const desc = descMatch?.[1] || ogDescMatch?.[1] || "";
      const title = titleMatch?.[1] || clean;

      // "1,234 Followers, 567 Following, 89 Posts - See Instagram..."
      const followersMatch = desc.match(/([\d,\.]+[KkMm]?)\s*Followers?/i) || desc.match(/([\d,\.]+[KkMm]?)\s*Takipçi/i);
      const followingMatch = desc.match(/([\d,\.]+[KkMm]?)\s*Following/i) || desc.match(/([\d,\.]+[KkMm]?)\s*Takip/i);
      const postsMatch = desc.match(/([\d,\.]+[KkMm]?)\s*Posts?/i) || desc.match(/([\d,\.]+[KkMm]?)\s*Gönderi/i);

      const parseCount = (s?: string) => {
        if (!s) return 0;
        const n = s.replace(/,/g, "");
        if (/k/i.test(n)) return Math.round(parseFloat(n) * 1000);
        if (/m/i.test(n)) return Math.round(parseFloat(n) * 1000000);
        return parseInt(n) || 0;
      };

      const fullName = title.replace(/\(@[^)]+\)/, "").replace(/•.*$/, "").trim();

      return {
        username: clean,
        fullName,
        bio: desc.split(" - ")[1]?.split(" See Instagram")[0]?.trim() || "",
        followers: parseCount(followersMatch?.[1]),
        following: parseCount(followingMatch?.[1]),
        posts: parseCount(postsMatch?.[1]),
        isVerified: html.includes('"is_verified":true') || html.includes("Verified"),
        profilePic: imgMatch?.[1],
        fetchedAt: new Date().toISOString(),
      };
    }
  } catch {
    // both methods failed
  }

  return null;
}

/**
 * Use OpenAI to analyze the profile and extract niche/sector/insights
 */
async function analyzeProfileWithAI(profile: InstagramProfileData): Promise<Partial<InstagramProfileData>> {
  const prompt = `Analyze this Instagram profile and return marketing intelligence.

Profile:
- Username: @${profile.username}
- Name: ${profile.fullName}
- Bio: ${profile.bio}
- Followers: ${profile.followers.toLocaleString()}
- Following: ${profile.following.toLocaleString()}
- Posts: ${profile.posts}

Return JSON:
{
  "niche": "specific niche (e.g., 'Specialty Coffee', 'Fashion & Lifestyle')",
  "sector": "broad sector (e.g., 'Food & Beverage', 'E-commerce', 'Personal Brand')",
  "contentStyle": "e.g., 'Educational, behind-the-scenes, product showcases'",
  "audienceType": "e.g., 'Young professionals 25-35, urban, tech-savvy'",
  "engagementEstimate": "e.g., 'Above average (~4-6%)'",
  "insights": ["insight 1", "insight 2", "insight 3", "insight 4", "insight 5"]
}`;

  const raw = await runAI(
    "You are an Instagram marketing analyst. Analyze profiles and extract business intelligence. Return valid JSON only.",
    prompt
  );

  return parseJSON<Partial<InstagramProfileData>>(raw, {});
}

// ─── ROUTE HANDLERS ──────────────────────────────────────────────────────────

export async function GET() {
  const saved = await memory.getSettings();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const profileData = (saved as any).instagramProfileData as InstagramProfileData | undefined;
  return NextResponse.json({ profile: profileData || null });
}

export async function POST(req: NextRequest) {
  try {
    const { username } = await req.json();
    if (!username) return NextResponse.json({ error: "Username required" }, { status: 400 });

    // 1. Fetch public profile data
    const profileData = await fetchInstagramProfile(username);
    if (!profileData) {
      return NextResponse.json({
        error: "Profil bulunamadı. Hesap herkese açık (public) olmalı ve kullanıcı adı doğru olmalı."
      }, { status: 404 });
    }

    // 2. Analyze with AI
    const aiInsights = await analyzeProfileWithAI(profileData);
    const enriched: InstagramProfileData = { ...profileData, ...aiInsights };

    // 3. Save to memory (stored as a custom key via type cast)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await memory.saveSettings({ instagramProfileData: enriched } as any);

    // 4. Also update brand niche if not set
    const brand = await memory.getBrand();
    if (brand && !brand.niche && enriched.niche) {
      await memory.saveBrand({ ...brand, niche: enriched.niche });
    }

    return NextResponse.json({ success: true, profile: enriched });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error" },
      { status: 500 }
    );
  }
}
