// ─── Shared ────────────────────────────────────────────────────────────────

type UserProfile = {
  university: string;
  course: string;
  year_of_study: number;
};

export type GroupRecommendationCandidate = {
  id: string;
  name: string;
  description: string | null;
  subject: string;
  university: string;
  total_members: number;
  session_count: number;
  resource_count: number;
};

export type GroupRecommendation = GroupRecommendationCandidate & {
  score: number;
  reason: string;
};

type AiRecommendation = {
  groupId: string;
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

function fallbackRecommendations(
  profile: UserProfile,
  candidates: GroupRecommendationCandidate[],
): GroupRecommendation[] {
  return candidates
    .map((group) => {
      const courseMatch = overlapScore(
        profile.course,
        `${group.subject} ${group.name} ${group.description || ""}`,
      );
      const sameUniversity =
        group.university.toLowerCase() === profile.university.toLowerCase();
      const activityBoost = Math.min(
        18,
        toNumber(group.session_count) * 4 +
          toNumber(group.resource_count) * 3 +
          toNumber(group.total_members),
      );
      const score = Math.round(
        35 + courseMatch * 35 + (sameUniversity ? 25 : 0) + activityBoost,
      );

      const reason = sameUniversity
        ? `Strong fit for your ${profile.course} profile at ${profile.university}.`
        : `Relevant to your ${profile.course} studies and active enough to explore.`;

      return {
        ...group,
        total_members: toNumber(group.total_members),
        session_count: toNumber(group.session_count),
        resource_count: toNumber(group.resource_count),
        score: Math.min(score, 98),
        reason,
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
}

async function getAiRecommendations(
  profile: UserProfile,
  candidates: GroupRecommendationCandidate[],
): Promise<AiRecommendation[]> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return [];

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      input: [
        {
          role: "system",
          content:
            "Rank study groups for a university student. Prefer strong course fit, same university, active groups, and clear academic value. Return concise, student-friendly reasons.",
        },
        {
          role: "user",
          content: JSON.stringify({ profile, groups: candidates }),
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "group_recommendations",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              recommendations: {
                type: "array",
                maxItems: 5,
                items: {
                  type: "object",
                  additionalProperties: false,
                  properties: {
                    groupId: { type: "string" },
                    score: { type: "integer", minimum: 0, maximum: 100 },
                    reason: { type: "string" },
                  },
                  required: ["groupId", "score", "reason"],
                },
              },
            },
            required: ["recommendations"],
          },
        },
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI request failed with ${response.status}`);
  }

  const data = await response.json() as any;
  const outputText = data.output?.[0]?.content?.[0]?.text || "";
  if (!outputText) return [];

  const parsed = JSON.parse(outputText) as {
    recommendations?: AiRecommendation[];
  };

  return parsed.recommendations || [];
}

// ─── Friend recommendations ─────────────────────────────────────────────────

export type FriendCandidate = {
  id: string;
  name: string;
  university: string;
  course: string;
  year_of_study: number;
  mutual_groups: number;
};

export type FriendRecommendation = FriendCandidate & {
  score: number;
  reason: string;
};

function fallbackFriendRecommendations(
  profile: UserProfile,
  candidates: FriendCandidate[],
): FriendRecommendation[] {
  return candidates
    .map((u) => {
      const sameCourse = overlapScore(profile.course, u.course);
      const sameUni = u.university.toLowerCase() === profile.university.toLowerCase();
      const sameYear = u.year_of_study === profile.year_of_study ? 10 : 0;
      const mutualBoost = Math.min(20, toNumber(u.mutual_groups) * 7);
      const score = Math.min(98, Math.round(20 + sameCourse * 35 + (sameUni ? 20 : 10) + sameYear + mutualBoost));
      const reason = sameUni
        ? `Studies ${u.course} at ${u.university} — likely a great study partner.`
        : `Studies ${u.course} at ${u.university} — cross-university connection worth making.`;
      return { ...u, mutual_groups: toNumber(u.mutual_groups), score, reason };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
}

async function getAiFriendRecommendations(
  profile: UserProfile,
  candidates: FriendCandidate[],
): Promise<{ userId: string; score: number; reason: string }[]> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return [];

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      input: [
        {
          role: "system",
          content: "Recommend study partners for a university student. Consider course similarity, mutual groups, year of study, and cross-university value. Return concise, friendly reasons.",
        },
        { role: "user", content: JSON.stringify({ profile, candidates }) },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "friend_recommendations",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              recommendations: {
                type: "array",
                maxItems: 5,
                items: {
                  type: "object",
                  additionalProperties: false,
                  properties: {
                    userId: { type: "string" },
                    score: { type: "integer", minimum: 0, maximum: 100 },
                    reason: { type: "string" },
                  },
                  required: ["userId", "score", "reason"],
                },
              },
            },
            required: ["recommendations"],
          },
        },
      },
    }),
  });

  if (!response.ok) throw new Error(`OpenAI request failed with ${response.status}`);
  const data = await response.json() as any;
  const outputText = data.output?.[0]?.content?.[0]?.text || "";
  if (!outputText) return [];
  const parsed = JSON.parse(outputText) as { recommendations?: { userId: string; score: number; reason: string }[] };
  return parsed.recommendations || [];
}

export async function recommendFriendsForUser(
  profile: UserProfile,
  candidates: FriendCandidate[],
): Promise<FriendRecommendation[]> {
  const normalized = candidates.map((u) => ({ ...u, mutual_groups: toNumber(u.mutual_groups) }));
  try {
    const aiResults = await getAiFriendRecommendations(profile, normalized);
    const byId = new Map(normalized.map((u) => [u.id, u]));
    const ranked = aiResults
      .map((r) => { const u = byId.get(r.userId); return u ? { ...u, score: r.score, reason: r.reason } : null; })
      .filter((u): u is FriendRecommendation => Boolean(u));
    if (ranked.length > 0) return ranked;
  } catch (err) {
    console.warn("AI friend recommendations unavailable, using fallback:", err);
  }
  return fallbackFriendRecommendations(profile, normalized);
}

// ─── Resource recommendations ─────────────────────────────────────────────────

export type ResourceCandidate = {
  id: string;
  title: string;
  type: string;
  subject: string;
  group_name: string;
  uploaded_by_name: string;
  downloads: number;
};

export type ResourceRecommendation = ResourceCandidate & {
  score: number;
  reason: string;
};

function fallbackResourceRecommendations(
  profile: UserProfile,
  candidates: ResourceCandidate[],
): ResourceRecommendation[] {
  return candidates
    .map((r) => {
      const relevance = overlapScore(profile.course, `${r.title} ${r.subject} ${r.group_name}`);
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
  candidates: ResourceCandidate[],
): Promise<{ resourceId: string; score: number; reason: string }[]> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return [];

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      input: [
        {
          role: "system",
          content: "Recommend study resources for a university student. Prefer strong relevance to their course, popular materials, and clear academic value. Return concise, student-friendly reasons.",
        },
        { role: "user", content: JSON.stringify({ profile, resources: candidates }) },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "resource_recommendations",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              recommendations: {
                type: "array",
                maxItems: 5,
                items: {
                  type: "object",
                  additionalProperties: false,
                  properties: {
                    resourceId: { type: "string" },
                    score: { type: "integer", minimum: 0, maximum: 100 },
                    reason: { type: "string" },
                  },
                  required: ["resourceId", "score", "reason"],
                },
              },
            },
            required: ["recommendations"],
          },
        },
      },
    }),
  });

  if (!response.ok) throw new Error(`OpenAI request failed with ${response.status}`);
  const data = await response.json() as any;
  const outputText = data.output?.[0]?.content?.[0]?.text || "";
  if (!outputText) return [];
  const parsed = JSON.parse(outputText) as { recommendations?: { resourceId: string; score: number; reason: string }[] };
  return parsed.recommendations || [];
}

export async function recommendResourcesForUser(
  profile: UserProfile,
  candidates: ResourceCandidate[],
): Promise<ResourceRecommendation[]> {
  const normalized = candidates.map((r) => ({ ...r, downloads: toNumber(r.downloads) }));
  try {
    const aiResults = await getAiResourceRecommendations(profile, normalized);
    const byId = new Map(normalized.map((r) => [r.id, r]));
    const ranked = aiResults
      .map((r) => { const res = byId.get(r.resourceId); return res ? { ...res, score: r.score, reason: r.reason } : null; })
      .filter((r): r is ResourceRecommendation => Boolean(r));
    if (ranked.length > 0) return ranked;
  } catch (err) {
    console.warn("AI resource recommendations unavailable, using fallback:", err);
  }
  return fallbackResourceRecommendations(profile, normalized);
}

// ─── Group recommendations ────────────────────────────────────────────────────

export async function recommendGroupsForUser(
  profile: UserProfile,
  candidates: GroupRecommendationCandidate[],
): Promise<GroupRecommendation[]> {
  const normalizedCandidates = candidates.map((group) => ({
    ...group,
    total_members: toNumber(group.total_members),
    session_count: toNumber(group.session_count),
    resource_count: toNumber(group.resource_count),
  }));

  try {
    const aiRecommendations = await getAiRecommendations(
      profile,
      normalizedCandidates,
    );
    const groupsById = new Map(
      normalizedCandidates.map((group) => [group.id, group]),
    );

    const ranked = aiRecommendations
      .map((recommendation) => {
        const group = groupsById.get(recommendation.groupId);
        if (!group) return null;
        return {
          ...group,
          score: recommendation.score,
          reason: recommendation.reason,
        };
      })
      .filter((group): group is GroupRecommendation => Boolean(group));

    if (ranked.length > 0) return ranked;
  } catch (err) {
    console.warn("AI group recommendations unavailable, using fallback:", err);
  }

  return fallbackRecommendations(profile, normalizedCandidates);
}
