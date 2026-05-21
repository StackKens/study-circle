export interface Session {
  id: string;
  groupId: string;
  title: string;
  startTime: string;
  endTime: string;
  attendees: string[];
  participants: number;
  createdAt: string;
  status: string;
}
