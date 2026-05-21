export interface Resource {
  id: string;
  groupId: string;
  title: string;
  type: "pdf" | "link" | "video" | "document";
  uploadedBy: string;
  downloads: number;
  ratings: number;
  createdAt: string;
}
