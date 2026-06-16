import { getUserDocuments } from "@/features/dashboard/actions/get-user-documents.action";
import { createClient } from "@/lib/supabase/server";
import { DashboardPage } from "@/features/dashboard/components/dashboard-page";

export default async function DashboardHome({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const search = typeof params.search === 'string' ? params.search : undefined;
  const filter = typeof params.filter === 'string' ? params.filter : undefined;
  const page = typeof params.page === 'string' ? parseInt(params.page, 10) : 1;

  const { documents, totalPages, totalCount } = await getUserDocuments({ search, filter, page });
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return <DashboardPage user={user} documents={documents} totalPages={totalPages} currentPage={page} totalCount={totalCount} />;
}
