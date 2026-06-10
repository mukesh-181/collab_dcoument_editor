export type DashboardDocument = {
  id: string;
  title: string;
  updated_at: string;
  document_members?: Array<{
    role?: string | null;
  }> | null;
};
