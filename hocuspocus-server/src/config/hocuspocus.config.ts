import { Server } from "@hocuspocus/server";
import * as Y from "yjs";
import { supabase } from "../lib/supabase.js";
import { ENV } from "./env.js";

export const server = new Server({
  port: ENV.PORT,
  async onListen() {
    console.log(`[Hocuspocus] Server is running on port ${ENV.PORT}`);
  },

  async onAuthenticate(data) {
    const { token } = data;
    if (!token) throw new Error("Unauthorized: No token provided");

    // Verify the Supabase JWT
    const { data: authData, error } = await supabase.auth.getUser(token);
    if (error || !authData.user) {
      throw new Error("Unauthorized: Invalid token");
    }

    // We can return context that will be available in subsequent hooks
    return {
      user: authData.user,
    };
  },

  async onLoadDocument(data) {
    const { documentName } = data;

    // Query the database for the document state
    const { data: docState, error } = await supabase
      .from("document_content_state")
      .select("ydoc_state")
      .eq("document_id", documentName)
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 means zero rows found, which is fine for a new doc
      console.error(
        `[onLoadDocument] Error fetching doc ${documentName}:`,
        error.message,
      );
    }

    if (docState?.ydoc_state) {
      try {
        // Attempt to decode base64 back into Uint8Array
        const buffer = Buffer.from(docState.ydoc_state, "base64");
        // Apply the binary update to the document
        Y.applyUpdate(data.document, buffer);
        return data.document;
      } catch (err) {
        console.error(
          `[onLoadDocument] Failed to parse existing state for ${documentName}. It may be in legacy HTML format. Ignoring...`,
        );
      }
    }

    // If no state exists or parsing fails, return the empty document
    return data.document;
  },

  async onStoreDocument(data) {
    const { documentName, document } = data;

    // Encode the Yjs state as a base64 string for safe Postgres text/bytea storage
    const state = Buffer.from(Y.encodeStateAsUpdate(document)).toString(
      "base64",
    );
    
    const now = new Date().toISOString();

    const { error } = await supabase.from("document_content_state").upsert(
      {
        document_id: documentName,
        ydoc_state: state,
        updated_at: now,
      },
      {
        onConflict: "document_id",
      },
    );

    if (error) {
      console.error(
        `[onStoreDocument] Error saving doc ${documentName}:`,
        error.message,
      );
    } else {
      // Update the parent document's updated_at timestamp so it floats to the top of the dashboard
      const { error: updateDocError } = await supabase
        .from("documents")
        .update({ updated_at: now })
        .eq("id", documentName);
        
      if (updateDocError) {
        console.error(
          `[onStoreDocument] Error updating document timestamp ${documentName}:`,
          updateDocError.message,
        );
      }
    }
  },
});
