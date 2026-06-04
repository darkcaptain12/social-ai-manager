import { runAI, parseJSON } from "./base";
import { memory } from "@/lib/memory/store";
import { generateId } from "@/lib/utils";
import type { Lead, LeadStatus } from "@/types";

const SYSTEM = `You are a CRM Intelligence Agent. Analyze leads and generate follow-up strategies. ALWAYS return valid JSON only.`;

export async function scoreLead(lead: Partial<Lead>): Promise<{
  score: number; reasoning: string; suggestedAction: string; followUpMessage?: string;
}> {
  const brand = await memory.getBrand();
  const prompt = `Score this Instagram lead for our brand.
Brand: ${JSON.stringify({ name: brand?.name, targetAudience: brand?.targetAudience, niche: brand?.niche })}
Lead: ${JSON.stringify(lead)}
Return JSON: { "score": 1-100, "reasoning": string, "suggestedAction": "dm|comment|follow|ignore", "followUpMessage": string }`;

  const raw = await runAI(SYSTEM, prompt);
  return parseJSON(raw, { score: 50, reasoning: "", suggestedAction: "follow" });
}

export async function generateLeads(params: { niche?: string; count?: number }): Promise<Lead[]> {
  const brand = await memory.getBrand();
  const niche = params.niche ?? brand?.niche ?? "general";
  const count = params.count ?? 10;

  const prompt = `Generate ${count} potential Instagram leads for a "${niche}" niche brand.
Target audience: ${brand?.targetAudience ?? "general"}
Return JSON array: [{ "id": string, "name": string, "instagramHandle": string, "status": "new", "priorityScore": 1-100, "notes": string, "tags": [2-3], "createdAt": ISO, "updatedAt": ISO }]`;

  const raw = await runAI(SYSTEM, prompt);
  const parsed = parseJSON<Lead[]>(raw, []);
  const leads = parsed.map((l) => ({
    ...l, id: l.id || generateId(),
    status: "new" as LeadStatus,
    createdAt: l.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));

  for (const l of leads) await memory.addLead(l);
  return leads;
}

export async function getFollowUpTasks(): Promise<{
  urgent: Lead[]; upcoming: Lead[]; suggestions: string[];
}> {
  const leads = await memory.getLeads();
  const now = new Date();

  const urgent = leads.filter((l) => {
    if (!l.followUpDate) return false;
    const diff = (new Date(l.followUpDate).getTime() - now.getTime()) / 86400000;
    return diff <= 1;
  });
  const upcoming = leads.filter((l) => {
    if (!l.followUpDate) return false;
    const diff = (new Date(l.followUpDate).getTime() - now.getTime()) / 86400000;
    return diff > 1 && diff <= 7;
  });

  return {
    urgent, upcoming,
    suggestions: [
      `${urgent.length} acil takip bugün`,
      `${leads.filter((l) => l.status === "new").length} yeni lead bekliyor`,
      `${leads.filter((l) => l.status === "interested").length} ilgilenen lead nitelendirmeyi bekliyor`,
    ],
  };
}
