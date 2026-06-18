export type DashboardDocument = {
  id: string;
  title: string;
  updated_at: string;
  previewJson?: Record<string, unknown> | null;
  document_members?: Array<{
    role?: string | null;
  }> | null;
};
