import { getUserDocuments } from "@/features/dashboard/actions/get-user-documents.action";
import { createClient } from "@/lib/supabase/server";
import { DashboardPage } from "@/features/dashboard/components/dashboard-page";

export default async function DashboardHome() {
  const documents = await getUserDocuments();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return <DashboardPage user={user} documents={documents} />;
}
