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

/** Render @mentions highlighted and URLs as clickable links in message text */
export function renderMessageContent(content: string, mentionClass = "text-teal-600 font-semibold") {
  // Split on URLs or @mentions, keeping the delimiters
  const parts = content.split(/(https?:\/\/[^\s]+|@[\w\s]+?(?=\s|$|@))/g);
  return parts.map((part, i) => {
    if (/^https?:\/\//.test(part)) {
      return (
        <a
          key={i}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-2 break-all hover:opacity-80"
          onClick={(e) => e.stopPropagation()}
        >
          {part}
        </a>
      );
    }
    if (part.startsWith("@")) {
      return (
        <span key={i} className={mentionClass}>
          {part}
        </span>
      );
    }
    return <span key={i}>{part}</span>;
  });
}
