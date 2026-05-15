export interface GroupMember {
  userId: string;
  groupId: string;
  role: "admin" | "member";
  joinedAt: string;
}
