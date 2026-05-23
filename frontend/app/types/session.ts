export interface Session {
  id: string;
  group_id: string;
  title: string;
  start_time: string;
  end_time: string;
  participant_count: number;
  created_by?: string;
  created_at: string;
  group_name: string;
  has_joined?: boolean;
  meet_link?: string;
}
