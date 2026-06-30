export type UserRole = "student" | "instructor";

export interface ChatUser {
  id: string;
  name: string;
  avatar_url?: string | null;
  university?: string;
}

export function initials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? "")
    .join("");
}

const AVATAR_COLORS = [
  "bg-teal-600",
  "bg-emerald-600",
  "bg-cyan-600",
  "bg-indigo-600",
  "bg-violet-600",
  "bg-rose-600",
];

export function avatarColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

/** Render @mentions highlighted in message text */
export function renderMessageContent(content: string) {
  const parts = content.split(/(@[\w\s]+?(?=\s|$|@))/g);
  return parts.map((part, i) => {
    if (part.startsWith("@")) {
      return (
        <span key={i} className="text-teal-600 font-semibold">
          {part}
        </span>
      );
    }
    return <span key={i}>{part}</span>;
  });
}
