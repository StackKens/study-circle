export interface Resource {
  id: string;
  group_id: string;
  group_name: string;
  subject: string;
  title: string;
  type: "pdf" | "link" | "video" | "document" | "slides";
  url: string;
  uploaded_by: string;
  uploaded_by_name: string;
  downloads: number;
  created_at: string;
}
