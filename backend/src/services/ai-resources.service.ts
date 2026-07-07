import { callAiChat } from "./ai.service";

type UserProfile = {
  university: string;
  course: string;
  year_of_study: number;
};

type ResourceCandidate = {
  id: string;
  title: string;
  type: string;
  url: string;
  subject: string;
  group_name: string;
  uploaded_by_name: string;
  downloads: number;
};

type ResourceCandidateWithContent = ResourceCandidate & {
  content_preview?: string | null;
};

type ResourceRecommendation = ResourceCandidate & {
  score: number;
  reason: string;
};

function toNumber(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function tokenize(value: string) {
  return new Set(
    value
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((token) => token.length > 2),
  );
}

function overlapScore(a: string, b: string) {
  const left = tokenize(a);
  const right = tokenize(b);
  if (left.size === 0 || right.size === 0) return 0;
  let matches = 0;
  for (const token of left) {
    if (right.has(token)) matches += 1;
  }
  return matches / Math.max(left.size, right.size);
}

function fallbackResourceRecommendations(
  profile: UserProfile,
  candidates: ResourceCandidateWithContent[],
): ResourceRecommendation[] {
  return candidates
    .map((r) => {
      const relevance = overlapScore(
        profile.course,
        `${r.title} ${r.subject} ${r.group_name}`,
      );
      const popularity = Math.min(15, toNumber(r.downloads) * 2);
      const score = Math.min(98, Math.round(30 + relevance * 45 + popularity));
      const reason = `Relevant to your ${profile.course} studies — shared in ${r.group_name}.`;
      return { ...r, downloads: toNumber(r.downloads), score, reason };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
}

async function getAiResourceRecommendations(
  profile: UserProfile,
  candidates: ResourceCandidateWithContent[],
): Promise<{ resourceId: string; score: number; reason: string }[]> {
  const systemMsg = `Recommend study resources for a university student. Prefer strong relevance to their course, popular materials, and clear academic value. Use the extracted content preview (if available) to judge the actual material. Return concise, student-friendly reasons.

Respond with valid JSON only, using this exact structure:
{
  "recommendations": [
    {"resourceId": "<id>", "score": <0-100>, "reason": "<string>"}
  ]
}`;

  const payload = {
    profile,
    resources: candidates.map((r) => ({
      id: r.id,
      title: r.title,
      type: r.type,
      subject: r.subject,
      group_name: r.group_name,
      downloads: r.downloads,
      content_preview: r.content_preview || null,
    })),
  };

  const outputText = await callAiChat([
    { role: "system", content: systemMsg },
    { role: "user", content: JSON.stringify(payload) },
  ]);

  if (!outputText) return [];

  try {
    const parsed = JSON.parse(outputText) as {
      recommendations?: { resourceId: string; score: number; reason: string }[];
    };
    return parsed.recommendations || [];
  } catch {
    return [];
  }
}

export async function recommendResourcesForUser(
  profile: UserProfile,
  candidates: ResourceCandidateWithContent[],
): Promise<ResourceRecommendation[]> {
  const normalized = candidates.map((r) => ({
    ...r,
    downloads: toNumber(r.downloads),
  }));

  try {
    const aiResults = await getAiResourceRecommendations(profile, normalized);
    const byId = new Map(normalized.map((r) => [r.id, r]));
    const ranked = aiResults
      .map((r) => {
        const res = byId.get(r.resourceId);
        return res ? { ...res, score: r.score, reason: r.reason } : null;
      })
      .filter((r): r is ResourceRecommendation => Boolean(r));
    if (ranked.length > 0) return ranked;
  } catch (err) {
    console.warn(
      "AI resource recommendations unavailable, using fallback:",
      err,
    );
  }

  return fallbackResourceRecommendations(profile, normalized);
}
