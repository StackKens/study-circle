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

function extractOutputText(data: any) {
  if (typeof data.output_text === "string") return data.output_text;

  for (const item of data.output || []) {
    for (const content of item.content || []) {
      if (typeof content.text === "string") return content.text;
    }
  }

  return "";
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
      model: process.env.OPENAI_MODEL || "gpt-5.2",
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

  const data = await response.json();
  const outputText = extractOutputText(data);
  if (!outputText) return [];

  const parsed = JSON.parse(outputText) as {
    recommendations?: AiRecommendation[];
  };

  return parsed.recommendations || [];
}

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
