export interface Group {
  id: string;
  name: string;
  description: string | null;
  subject: string;
  university: string;
  created_by: string;
  total_members: number;
  created_at: string;
  role?: "admin" | "member";
}
