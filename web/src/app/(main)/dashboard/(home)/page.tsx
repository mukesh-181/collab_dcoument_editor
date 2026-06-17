import { getUserDocuments } from "@/features/dashboard/actions/get-user-documents.action";
import { createClient } from "@/lib/supabase/server";
import { DocumentList } from "@/features/dashboard/components/page/document-list";

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

  return (
    <div className="flex flex-col flex-1 w-full min-h-0 overflow-hidden">
      <div className="flex min-h-0 w-full flex-1 flex-col overflow-hidden">
        <DocumentList documents={documents} user={user} totalPages={totalPages} currentPage={page} totalCount={totalCount} />
      </div>
    </div>
  );
}
