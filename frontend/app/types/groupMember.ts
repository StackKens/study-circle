export interface GroupMember {
  user_id: string;
  name: string;
  university: string;
  course: string;
  year_of_study: number;
  role: "admin" | "member";
  joined_at: string;
  avatar_url?: string;
}
