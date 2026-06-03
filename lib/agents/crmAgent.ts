import { runClaude, parseJSON } from "./base";
import { memory } from "@/lib/memory/store";
import { generateId } from "@/lib/utils";
import type { Lead, LeadStatus } from "@/types";

const SYSTEM = `You are a CRM Intelligence Agent for Instagram lead management.
Analyze leads, score them, and generate follow-up strategies.
ALWAYS return valid JSON only.`;

export async function scoreLead(lead: Partial<Lead>): Promise<{
  score: number;
  reasoning: string;
  suggestedAction: string;
  followUpMessage?: string;
}> {
  const brand = memory.getBrand();

  const prompt = `Score this potential Instagram lead for our brand.

Brand: ${JSON.stringify({ name: brand?.name, targetAudience: brand?.targetAudience, niche: brand?.niche })}
Lead: ${JSON.stringify(lead)}

Return JSON:
{
  "score": 1-100,
  "reasoning": string,
  "suggestedAction": "dm|comment|follow|ignore",
  "followUpMessage": string (personalized DM template if action is dm)
}`;

  const raw = await runClaude(SYSTEM, prompt);
  return parseJSON(raw, { score: 50, reasoning: "", suggestedAction: "follow" });
}

export async function generateLeads(params: {
  niche?: string;
  count?: number;
}): Promise<Lead[]> {
  const brand = memory.getBrand();
  const niche = params.niche ?? brand?.niche ?? "general";
  const count = params.count ?? 10;

  const prompt = `Generate ${count} potential Instagram leads for a brand in the "${niche}" niche.
These should be realistic prospect profiles.
Target audience: ${brand?.targetAudience ?? "general"}

Return JSON array:
[{
  "id": string,
  "name": string,
  "instagramHandle": string,
  "status": "new",
  "priorityScore": 1-100,
  "notes": string (why this is a good lead),
  "tags": [2-3 relevant tags],
  "createdAt": ISO_date,
  "updatedAt": ISO_date
}]`;

  const raw = await runClaude(SYSTEM, prompt);
  const parsed = parseJSON<Lead[]>(raw, []);
  const leads = parsed.map((l) => ({
    ...l,
    id: l.id || generateId(),
    status: "new" as LeadStatus,
    createdAt: l.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));

  leads.forEach((l) => memory.addLead(l));
  return leads;
}

export async function getFollowUpTasks(): Promise<{
  urgent: Lead[];
  upcoming: Lead[];
  suggestions: string[];
}> {
  const leads = memory.getLeads();
  const now = new Date();

  const urgent = leads.filter((l) => {
    if (!l.followUpDate) return false;
    const followUp = new Date(l.followUpDate);
    const diff = (followUp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    return diff <= 1;
  });

  const upcoming = leads.filter((l) => {
    if (!l.followUpDate) return false;
    const followUp = new Date(l.followUpDate);
    const diff = (followUp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    return diff > 1 && diff <= 7;
  });

  const suggestions = [
    `${urgent.length} urgent follow-up${urgent.length !== 1 ? "s" : ""} due today`,
    `${leads.filter((l) => l.status === "new").length} new leads to contact`,
    `${leads.filter((l) => l.status === "interested").length} interested leads to qualify`,
  ];

  return { urgent, upcoming, suggestions };
}
