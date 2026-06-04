// ─── BRAND ───────────────────────────────────────────────────────────────────
export interface Brand {
  id: string;
  name: string;
  description: string;
  logo?: string;
  colorPalette: string[];
  toneOfVoice: string;
  targetAudience: string;
  keywords: string[];
  positioning: string;
  instagramHandle?: string;
  niche: string;
  language: string;
  updatedAt: string;
}

// ─── COMPETITOR ──────────────────────────────────────────────────────────────
export interface Competitor {
  id: string;
  name: string;
  instagramHandle: string;
  followerCount?: number;
  engagementRate?: number;
  contentStyle?: string;
  postingFrequency?: string;
  topHashtags?: string[];
  contentGaps?: string[];
  opportunities?: string[];
  lastAnalyzed?: string;
}

// ─── AUDIENCE ─────────────────────────────────────────────────────────────────
export interface AudienceProfile {
  ageRange: string;
  gender: string;
  location: string[];
  interests: string[];
  buyingIntent: string;
  painPoints: string[];
  contentPreferences: string[];
  activeHours: string;
  analyzedAt: string;
}

// ─── CONTENT ─────────────────────────────────────────────────────────────────
export type ContentType = "post" | "story" | "reel" | "carousel";
export type ContentStatus = "draft" | "scheduled" | "published" | "failed";
export type ContentObjective =
  | "awareness"
  | "engagement"
  | "conversion"
  | "education"
  | "entertainment";

export interface ContentItem {
  id: string;
  type: ContentType;
  status: ContentStatus;
  objective: ContentObjective;
  caption: string;
  hook: string;
  cta: string;
  hashtags: string[];
  imageUrl?: string;
  imagePrompt?: string;
  scheduledAt?: string;
  publishedAt?: string;
  pillar?: string;
  engagementRate?: number;
  reach?: number;
  likes?: number;
  comments?: number;
  createdAt: string;
}

// ─── CONTENT STRATEGY ────────────────────────────────────────────────────────
export interface ContentPillar {
  id: string;
  name: string;
  description: string;
  percentage: number;
  color: string;
}

export interface ContentStrategy {
  pillars: ContentPillar[];
  postingFrequency: string;
  optimalTimes: string[];
  campaignIdeas: string[];
  weeklyPlan: WeeklyPlan;
  generatedAt: string;
}

export interface WeeklyPlan {
  monday?: ContentItem[];
  tuesday?: ContentItem[];
  wednesday?: ContentItem[];
  thursday?: ContentItem[];
  friday?: ContentItem[];
  saturday?: ContentItem[];
  sunday?: ContentItem[];
}

// ─── VIRAL / TREND ───────────────────────────────────────────────────────────
export interface TrendItem {
  id: string;
  title: string;
  description: string;
  format: string;
  hook: string;
  viralScore: number;
  niche: string;
  detectedAt: string;
  expiresAt?: string;
}

// ─── CRM ─────────────────────────────────────────────────────────────────────
export type LeadStatus =
  | "new"
  | "contacted"
  | "interested"
  | "qualified"
  | "converted"
  | "lost";

export interface Lead {
  id: string;
  name: string;
  instagramHandle?: string;
  email?: string;
  phone?: string;
  status: LeadStatus;
  priorityScore: number;
  notes: string;
  tags: string[];
  followUpDate?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── CALENDAR ────────────────────────────────────────────────────────────────
export interface CalendarEvent {
  id: string;
  contentId: string;
  title: string;
  type: ContentType;
  scheduledAt: string;
  status: ContentStatus;
  color?: string;
}

// ─── ANALYTICS ───────────────────────────────────────────────────────────────
export interface AnalyticsSnapshot {
  date: string;
  followers: number;
  followersGrowth: number;
  engagementRate: number;
  reach: number;
  impressions: number;
  postsPublished: number;
  topPost?: ContentItem;
}

// ─── SETTINGS ────────────────────────────────────────────────────────────────
export interface Settings {
  openaiApiKey?: string;
  imageProvider: "openai" | "ideogram" | "flux" | "stability" | "replicate";
  instagramAccessToken?: string;
  instagramAccountId?: string;
  // Buffer integration (Facebook-free Instagram publishing)
  bufferAccessToken?: string;
  bufferProfileId?: string;
  language: "tr" | "en";
  theme: "dark" | "light" | "system";
  autoSchedule: boolean;
  nightly_jobs: boolean;
}

// ─── AGENT ───────────────────────────────────────────────────────────────────
export type AgentName =
  | "brand"
  | "competitor"
  | "audience"
  | "viral"
  | "strategy"
  | "copywriting"
  | "visual"
  | "crm"
  | "scheduling"
  | "analytics";

export type AgentStatus = "idle" | "running" | "done" | "error";

export interface AgentState {
  name: AgentName;
  status: AgentStatus;
  lastRun?: string;
  output?: unknown;
  error?: string;
}

// ─── MEMORY SLICES ────────────────────────────────────────────────────────────
export interface MemoryStore {
  brand: Brand | null;
  competitors: Competitor[];
  audience: AudienceProfile | null;
  trends: TrendItem[];
  strategy: ContentStrategy | null;
  contentHistory: ContentItem[];
  leads: Lead[];
  calendar: CalendarEvent[];
  analytics: AnalyticsSnapshot[];
  settings: Settings;
}
