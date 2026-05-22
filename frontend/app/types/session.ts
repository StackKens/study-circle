export interface Session {
  id: string;
  group_id: string;
  title: string;
  start_time: string;
  end_time: string;
  participant_count: number;
  created_by?: string;
  created_at: string;
  status: string;
}
