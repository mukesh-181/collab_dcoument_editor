"use server";

import { createClient } from "@/lib/supabase/server";

export async function uploadImage(documentId: string, formData: FormData) {
  try {
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { error: "Unauthorized" };
    }

    const file = formData.get("file") as File;
    if (!file) {
      return { error: "No file provided" };
    }
    
    if (!file.type.startsWith("image/")) {
      return { error: "File must be an image" };
    }
    
    if (file.size > 5 * 1024 * 1024) {
      return { error: "File size must be less than 5MB" };
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${crypto.randomUUID()}.${fileExt}`;
    const filePath = `${documentId}/${fileName}`;
    
    const { error } = await supabase.storage
      .from("document-assets")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false
      });
      
    if (error) {
      console.error("Supabase Storage Upload Error:", error);
      return { error: "Failed to upload image." };
    }
    
    const { data: publicUrlData } = supabase.storage
      .from("document-assets")
      .getPublicUrl(filePath);
      
    return { success: true, publicUrl: publicUrlData.publicUrl };
  } catch (error) {
    console.error("Image upload exception:", error);
    return { error: "An unexpected error occurred during upload." };
  }
}
