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
  niche?: string;
  sector?: string;
  contentStyle?: string;
  audienceType?: string;
  engagementEstimate?: string;
  insights?: string[];
  fetchedAt: string;
  dataSource?: string;
}

function cleanUsername(raw: string): string {
  return raw
    .replace(/^@/, "")
    .replace(/https?:\/\/(www\.)?instagram\.com\/?/, "")
    .replace(/\/$/, "")
    .split("?")[0]
    .split("/")[0]
    .trim();
}

function parseCount(s?: string): number {
  if (!s) return 0;
  const clean = s.replace(/,/g, "").replace(/\s/g, "").trim();
  if (/[kK]$/.test(clean)) return Math.round(parseFloat(clean) * 1000);
  if (/[mM]$/.test(clean)) return Math.round(parseFloat(clean) * 1_000_000);
  if (/[bB]$/.test(clean)) return Math.round(parseFloat(clean) * 1_000_000_000);
  return parseInt(clean) || 0;
}

const BROWSER_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9,tr;q=0.8",
  "Cache-Control": "no-cache",
  "Pragma": "no-cache",
  "Sec-Fetch-Dest": "document",
  "Sec-Fetch-Mode": "navigate",
  "Sec-Fetch-Site": "none",
};

// ─── Method 1: Instagram internal API ─────────────────────────────────────────
async function tryInstagramAPI(username: string): Promise<Partial<InstagramProfileData> | null> {
  try {
    const res = await fetch(
      `https://www.instagram.com/api/v1/users/web_profile_info/?username=${username}`,
      {
        headers: {
          ...BROWSER_HEADERS,
          "Accept": "application/json, text/javascript, */*; q=0.01",
          "x-ig-app-id": "936619743392459",
          "x-requested-with": "XMLHttpRequest",
          "Referer": `https://www.instagram.com/${username}/`,
          "X-CSRFToken": "missing",
        },
      }
    );
    if (!res.ok) return null;
    const json = await res.json();
    const u = json?.data?.user;
    if (!u || (!u.edge_followed_by?.count && !u.full_name)) return null;
    return {
      fullName: u.full_name || "",
      bio: u.biography || "",
      followers: u.edge_followed_by?.count ?? 0,
      following: u.edge_follow?.count ?? 0,
      posts: u.edge_owner_to_timeline_media?.count ?? 0,
      isVerified: u.is_verified ?? false,
      profilePic: u.profile_pic_url_hd || u.profile_pic_url,
      dataSource: "instagram_api",
    };
  } catch { return null; }
}

// ─── Method 2: Parse __UNIVERSAL_DATA_FOR_REHYDRATION__ from HTML ────────────
async function tryUniversalData(username: string): Promise<Partial<InstagramProfileData> | null> {
  try {
    const res = await fetch(`https://www.instagram.com/${username}/`, { headers: BROWSER_HEADERS });
    if (!res.ok) return null;
    const html = await res.text();

    // Find the universal rehydration JSON blob
    const scriptMatch = html.match(
      /<script[^>]+id="__UNIVERSAL_DATA_FOR_REHYDRATION__"[^>]*>([^<]+)<\/script>/
    );
    if (!scriptMatch) return null;

    const data = JSON.parse(scriptMatch[1]);

    // Navigate the deeply nested structure
    const findUser = (obj: unknown): Record<string, unknown> | null => {
      if (!obj || typeof obj !== "object") return null;
      const o = obj as Record<string, unknown>;
      if (o.edge_followed_by || o.biography !== undefined) return o;
      for (const val of Object.values(o)) {
        const found = findUser(val);
        if (found) return found;
      }
      return null;
    };

    const u = findUser(data);
    if (!u) return null;

    return {
      fullName: String(u.full_name || ""),
      bio: String(u.biography || ""),
      followers: (u.edge_followed_by as { count?: number })?.count ?? 0,
      following: (u.edge_follow as { count?: number })?.count ?? 0,
      posts: (u.edge_owner_to_timeline_media as { count?: number })?.count ?? 0,
      isVerified: Boolean(u.is_verified),
      profilePic: String(u.profile_pic_url_hd || u.profile_pic_url || ""),
      dataSource: "universal_data",
    };
  } catch { return null; }
}

// ─── Method 3: Meta tag parsing (OG tags) ────────────────────────────────────
async function tryMetaTags(username: string): Promise<Partial<InstagramProfileData> | null> {
  try {
    // Try Instagram mobile endpoint — returns different HTML with more data
    const res = await fetch(`https://www.instagram.com/${username}/`, {
      headers: {
        ...BROWSER_HEADERS,
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
      },
    });
    if (!res.ok) return null;
    const html = await res.text();

    const get = (pattern: RegExp) => html.match(pattern)?.[1];

    const desc = get(/<meta[^>]+name="description"[^>]+content="([^"]+)"/i)
      || get(/<meta[^>]+content="([^"]+)"[^>]+name="description"/i)
      || get(/<meta[^>]+property="og:description"[^>]+content="([^"]+)"/i)
      || "";

    const title = get(/<meta[^>]+property="og:title"[^>]+content="([^"]+)"/i)
      || get(/<meta[^>]+content="([^"]+)"[^>]+property="og:title"/i)
      || username;

    const img = get(/<meta[^>]+property="og:image"[^>]+content="([^"]+)"/i)
      || get(/<meta[^>]+content="([^"]+)"[^>]+property="og:image"/i);

    // Try various follower patterns
    const followersMatch =
      desc.match(/([\d,\.]+[KkMm]?)\s*[Ff]ollowers?/) ||
      desc.match(/([\d,\.]+[KkMm]?)\s*[Tt]akip[çc]i/);
    const followingMatch =
      desc.match(/([\d,\.]+[KkMm]?)\s*[Ff]ollowing/) ||
      desc.match(/([\d,\.]+[KkMm]?)\s*[Tt]akip\s+[Ee]dilen/);
    const postsMatch =
      desc.match(/([\d,\.]+[KkMm]?)\s*[Pp]osts?/) ||
      desc.match(/([\d,\.]+[KkMm]?)\s*[Gg]önder/);

    const followers = parseCount(followersMatch?.[1]);
    const following = parseCount(followingMatch?.[1]);
    const posts = parseCount(postsMatch?.[1]);

    // Extract bio from description (after the stats part)
    const bioMatch = desc.match(/\d+\s*(?:Posts?|Gönder)[^-]+-\s*(.+?)(?:\s*See Instagram|$)/i);
    const bio = bioMatch?.[1]?.trim() || "";

    const fullName = title
      .split("(@")[0]
      .split("•")[0]
      .replace(/\s*on Instagram\s*/i, "")
      .trim();

    return {
      fullName: fullName || username,
      bio,
      followers,
      following,
      posts,
      isVerified: html.includes('"is_verified":true'),
      profilePic: img,
      dataSource: "meta_tags",
    };
  } catch { return null; }
}

// ─── Method 4: Picuki (third-party Instagram viewer) ─────────────────────────
async function tryPicuki(username: string): Promise<Partial<InstagramProfileData> | null> {
  try {
    const res = await fetch(`https://www.picuki.com/profile/${username}`, {
      headers: {
        ...BROWSER_HEADERS,
        "Referer": "https://www.picuki.com/",
      },
    });
    if (!res.ok) return null;
    const html = await res.text();

    const get = (pattern: RegExp) => html.match(pattern)?.[1]?.trim();

    const followers = parseCount(
      get(/<span[^>]*class="[^"]*followers[^"]*"[^>]*>([\d,KkMm\.]+)/i) ||
      get(/Followers<\/span>\s*<span[^>]*>([\d,KkMm\.]+)/i) ||
      get(/([\d,KkMm\.]+)\s*Followers/i)
    );
    const following = parseCount(
      get(/([\d,KkMm\.]+)\s*Following/i)
    );
    const posts = parseCount(
      get(/([\d,KkMm\.]+)\s*Posts?/i)
    );
    const fullName = get(/<h1[^>]*class="[^"]*profile-name[^"]*"[^>]*>([^<]+)/) || "";
    const bio = get(/<div[^>]*class="[^"]*profile-description[^"]*"[^>]*>([^<]+)/) || "";
    const img = get(/<img[^>]*class="[^"]*profile-avatar[^"]*"[^>]*src="([^"]+)"/) ||
      get(/<meta[^>]+property="og:image"[^>]+content="([^"]+)"/i);

    return {
      fullName,
      bio,
      followers,
      following,
      posts,
      isVerified: false,
      profilePic: img,
      dataSource: "picuki",
    };
  } catch { return null; }
}

// ─── MAIN FETCH (tries all methods in order) ─────────────────────────────────
async function fetchInstagramProfile(username: string): Promise<InstagramProfileData | null> {
  const methods = [tryInstagramAPI, tryUniversalData, tryMetaTags, tryPicuki];

  for (const method of methods) {
    const result = await method(username);
    // Accept result if we got at least a name or non-zero stats
    if (result && (result.fullName || (result.followers ?? 0) > 0 || (result.posts ?? 0) > 0)) {
      return {
        username,
        fullName: result.fullName || username,
        bio: result.bio || "",
        followers: result.followers ?? 0,
        following: result.following ?? 0,
        posts: result.posts ?? 0,
        isVerified: result.isVerified ?? false,
        profilePic: result.profilePic,
        dataSource: result.dataSource,
        fetchedAt: new Date().toISOString(),
      };
    }
  }
  return null;
}

// ─── AI ANALYSIS ─────────────────────────────────────────────────────────────
async function analyzeProfileWithAI(profile: InstagramProfileData): Promise<Partial<InstagramProfileData>> {
  const prompt = `Analyze this Instagram profile and return marketing intelligence.

Profile:
- Username: @${profile.username}
- Full Name: ${profile.fullName}
- Bio: ${profile.bio || "(no bio available)"}
- Followers: ${profile.followers.toLocaleString()}
- Following: ${profile.following.toLocaleString()}
- Posts: ${profile.posts}

Return JSON:
{
  "niche": "specific niche (e.g. Specialty Coffee, Fashion & Lifestyle, Digital Marketing)",
  "sector": "broad sector (e.g. Food & Beverage, E-commerce, Personal Brand)",
  "contentStyle": "e.g. Educational, behind-the-scenes, product showcases",
  "audienceType": "e.g. Young professionals 25-35, urban, tech-savvy",
  "engagementEstimate": "e.g. Above average (~4-6%)",
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

    const clean = cleanUsername(username);

    const profileData = await fetchInstagramProfile(clean);

    if (!profileData) {
      return NextResponse.json({
        error: `@${clean} profili bulunamadı. Hesabın herkese açık (public) olduğundan emin ol.`,
      }, { status: 404 });
    }

    // AI analysis
    const aiInsights = await analyzeProfileWithAI(profileData);
    const enriched: InstagramProfileData = { ...profileData, ...aiInsights };

    // Save
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await memory.saveSettings({ instagramProfileData: enriched } as any);

    // Auto-update brand niche
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
