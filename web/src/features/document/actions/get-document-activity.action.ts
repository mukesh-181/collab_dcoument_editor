"use server";

import { createClient } from "@/lib/supabase/server";

export async function getDocumentActivity(documentId: string) {
  const supabase = await createClient();

  // First, verify access to the document (implicit via RLS, but we'll do an explicit check just in case or let RLS handle it)
  // RLS is enabled on document_activity and requires document_members access.
  
  const { data, error } = await supabase
    .from("document_activity")
    .select(`
      id,
      action_type,
      metadata,
      created_at,
      actor:users!document_activity_actor_id_fkey(id, name, image, email),
      target:users!document_activity_target_user_id_fkey(id, name, image, email)
    `)
    .eq("document_id", documentId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching document activity:", error);
    return { success: false, error: "Failed to fetch document activity" };
  }

  return { success: true, activity: data };
}
