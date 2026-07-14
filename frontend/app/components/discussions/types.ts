export interface Discussion {
  id: string;
  title: string;
  content: string;
  author_name: string;
  is_answered: boolean;
  reply_count: number;
  created_at: string;
  course_id?: string;
  course_title?: string;
}

export interface Reply {
  id: string;
  discussion_id: string;
  author_id: string;
  content: string;
  created_at: string;
  author_name: string;
  author_avatar: string | null;
  like_count: number;
  liked: boolean;
}

export function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
