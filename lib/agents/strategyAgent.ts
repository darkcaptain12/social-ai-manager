import { runAI, parseJSON } from "./base";
import { memory } from "@/lib/memory/store";
import type { ContentStrategy, ContentPillar } from "@/types";

const SYSTEM = `You are a Content Strategy Agent for Instagram. Create data-driven strategies. ALWAYS return valid JSON only.`;

export async function generateStrategy(): Promise<ContentStrategy> {
  const brand = await memory.getBrand();
  const competitors = await memory.getCompetitors();
  const audience = await memory.getAudience();
  const trends = (await memory.getTrends()).slice(0, 5);
  if (!brand) throw new Error("Brand not configured");

  const prompt = `Create a comprehensive Instagram content strategy.
Brand: ${JSON.stringify(brand)}
Audience: ${JSON.stringify(audience)}
Top trends: ${JSON.stringify(trends)}
Competitors: ${competitors.length} analyzed
Return JSON:
{
  "pillars": [{ "id": string, "name": string, "description": string, "percentage": number, "color": hex }],
  "postingFrequency": "X per week",
  "optimalTimes": ["HH:MM" x5],
  "campaignIdeas": [5 titles],
  "weeklyPlan": {
    "monday": [{ "type": "post|reel|story", "objective": "awareness|engagement|conversion|education|entertainment", "caption": string, "hook": string, "cta": string, "hashtags": [20], "pillar": string, "id": string, "status": "draft", "createdAt": ISO }],
    "tuesday": [...], "wednesday": [...], "thursday": [...], "friday": [...], "saturday": [...], "sunday": [...]
  },
  "generatedAt": ISO
}
Make 4-5 pillars summing to 100. Put 1-2 items per day.`;

  const raw = await runAI(SYSTEM, prompt);
  const parsed = parseJSON<Partial<ContentStrategy>>(raw, {});

  const strategy: ContentStrategy = {
    pillars: (parsed.pillars ?? defaultPillars()) as ContentPillar[],
    postingFrequency: parsed.postingFrequency ?? "5 per week",
    optimalTimes: parsed.optimalTimes ?? ["09:00", "12:00", "18:00", "20:00"],
    campaignIdeas: parsed.campaignIdeas ?? [],
    weeklyPlan: parsed.weeklyPlan ?? {},
    generatedAt: new Date().toISOString(),
  };

  await memory.saveStrategy(strategy);
  return strategy;
}

function defaultPillars(): ContentPillar[] {
  return [
    { id: "edu", name: "Eğitim", description: "Bilgi ve değer içerikleri", percentage: 30, color: "#6371f5" },
    { id: "eng", name: "Etkileşim", description: "Topluluk katılımı", percentage: 25, color: "#a855f7" },
    { id: "promo", name: "Tanıtım", description: "Ürün/hizmet tanıtımları", percentage: 20, color: "#ec4899" },
    { id: "insp", name: "İlham", description: "Motivasyonel içerikler", percentage: 15, color: "#f59e0b" },
    { id: "bts", name: "Sahne Arkası", description: "Marka hikayesi", percentage: 10, color: "#10b981" },
  ];
}
