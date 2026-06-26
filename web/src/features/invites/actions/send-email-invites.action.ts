"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { ROUTES } from "@/constants/routes";
import { sendMail } from "./sendgrid.action";
import { ENV } from "@/constants/env";

export async function sendEmailInvites(
  documentId: string,
  emails: string[],
  role: "viewer" | "editor",
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  // Filter out the user's own email
  const uniqueEmails = Array.from(new Set(emails));
  const emailsToProcess = uniqueEmails.filter(
    (email) => email.toLowerCase() !== user.email?.toLowerCase(),
  );

  if (emailsToProcess.length === 0) {
    if (uniqueEmails.length > 0) {
      throw new Error("You cannot invite yourself.");
    }
    throw new Error("No valid emails provided.");
  }

  // Verify the current user is an owner or editor
  const { data: member } = await supabase
    .from("document_members")
    .select("role")
    .eq("document_id", documentId)
    .eq("user_id", user.id)
    .single();

  if (!member || (member.role !== "owner" && member.role !== "editor")) {
    throw new Error(
      "You do not have permission to invite users to this document",
    );
  }

  // 1. Check if any of these emails belong to users who are ALREADY members
  const { data: registeredUsers } = await supabase
    .from("users")
    .select("id, email")
    .in("email", emailsToProcess);

  const memberEmails = new Set<string>();
  if (registeredUsers && registeredUsers.length > 0) {
    const { data: existingMembers } = await supabase
      .from("document_members")
      .select("user_id")
      .eq("document_id", documentId)
      .in(
        "user_id",
        registeredUsers.map((u) => u.id),
      );

    if (existingMembers && existingMembers.length > 0) {
      const memberUserIds = new Set(existingMembers.map((m) => m.user_id));
      registeredUsers.forEach((u) => {
        if (memberUserIds.has(u.id)) {
          memberEmails.add(u.email.toLowerCase());
        }
      });
    }
  }

  // 2. Fetch existing pending invites for the selected emails
  const { data: existingInvites } = await supabase
    .from("invites")
    .select("email, expires_at")
    .eq("document_id", documentId)
    .eq("status", "pending")
    .in("email", emailsToProcess);

  const now = new Date();

  // 3. Filter out emails that are already members or have an active pending invite
  const finalEmailsToInvite = emailsToProcess.filter((email) => {
    const emailLower = email.toLowerCase();

    // Already a member
    if (memberEmails.has(emailLower)) return false;

    // Has active pending invite
    const existing = existingInvites?.find(
      (inv) => inv.email.toLowerCase() === emailLower,
    );
    if (existing) {
      const expiresAt = new Date(existing.expires_at);
      if (expiresAt > now) {
        return false;
      }
    }

    return true;
  });

  if (finalEmailsToInvite.length === 0) {
    throw new Error(
      "The selected users already have an active invitation or are already members of this document.",
    );
  }

  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24);
  const expiresAtISO = expiresAt.toISOString();

  const invitesToInsert = finalEmailsToInvite.map((email) => ({
    document_id: documentId,
    email: email,
    role: role,
    token: crypto.randomUUID(),
    status: "pending",
    expires_at: expiresAtISO,
  }));

  const { error } = await supabase.from("invites").insert(invitesToInsert);

  if (error) {
    console.error("Error creating email invites:", error);
    throw new Error("Failed to send invites");
  }

  // Get document info for email
  const { data: document } = await supabase
    .from("documents")
    .select("title")
    .eq("id", documentId)
    .single();

  // Get inviter info
  const { data: inviter } = await supabase
    .from("users")
    .select("name, email")
    .eq("id", user.id)
    .single();
  const inviterName = inviter?.name || inviter?.email || "A CollabDoc User";

  for (const invite of invitesToInsert) {
    try {
      const inviteLink = `${ENV.NEXT_PUBLIC_APP_URL}${ROUTES.INVITE(invite.token)}`;

      await sendMail({
        to: invite.email,
        subject: `${inviterName} invited you to collaborate on ${document?.title ?? "a document"}`,
        html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invitation to collaborate</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #fafafa; color: #18181b;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #fafafa; padding: 40px 0;">
    <tr>
      <td align="center">
        <!-- Main Card -->
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 12px; border: 1px solid #e4e4e7; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
          
          <!-- Header / Navbar -->
          <tr>
            <td align="center" style="padding: 24px 0; background-color: #ffffff; border-bottom: 1px solid #e4e4e7;">
              <a href="${ENV.NEXT_PUBLIC_APP_URL}" target="_blank" style="text-decoration: none; display: inline-block;">
                <img src="https://jzpgkqxrmpkbuzrkjgpy.supabase.co/storage/v1/object/public/publis-assets/logo-final.png" 
                     alt="CollabDoc" 
                     height="40" 
                     style="display: block; border: 0; max-width: 100%; height: 40px; object-fit: contain; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 26px; font-weight: 700; color: #18181b; letter-spacing: -0.5px; text-decoration: none;" />
              </a>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 32px;">
              <h2 style="margin: 0 0 16px; font-size: 20px; font-weight: 600; color: #18181b;">You've been invited!</h2>
              
              <p style="margin: 0 0 16px; font-size: 16px; line-height: 24px; color: #52525b;">
                <strong style="font-weight: 700; color: #18181b;">${inviterName}</strong> has invited you to collaborate on:
              </p>
              
              <div style="background-color: #f4f4f5; padding: 16px; border-radius: 8px; margin-bottom: 32px; border: 1px solid #e4e4e7; border-left: 4px solid #4f46e5;">
                <p style="margin: 0; font-size: 14px; color: #71717a;">
                  Document Title: <strong style="color: #18181b; text-transform: capitalize;">${document?.title ?? "Untitled Document"}</strong>
                </p>
                <p style="margin: 0; font-size: 14px; color: #71717a;">
                  Role: <strong style="color: #18181b; text-transform: capitalize;">${invite.role}</strong>
                </p>
              </div>

              <!-- Button -->
              <table border="0" cellspacing="0" cellpadding="0" style="margin: 0 auto 32px; width: 100%;">
                <tr>
                  <td align="center">
                    <a href="${inviteLink}" target="_blank" style="display: inline-block; padding: 14px 32px; font-size: 16px; font-weight: 600; color: #ffffff; text-decoration: none; border-radius: 8px; background-color: #18181b; border: 1px solid #18181b;">
                      Open Document
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 12px; font-size: 14px; line-height: 20px; color: #52525b;">
                If you don't know who this is or aren't interested, you can safely ignore this email.
              </p>
              
              <p style="margin: 0; font-size: 14px; line-height: 20px; color: #a1a1aa;">
                This invitation link will expire in 24 hours.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding: 24px; background-color: #fafafa; border-top: 1px solid #e4e4e7;">
              <p style="margin: 0; font-size: 12px; color: #a1a1aa;">
                &copy; CollabDoc. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
      });
      console.log("Invitation sent successfully to:", invite.email);
    } catch (err) {
      console.error(`Failed sending email to ${invite.email}:`, err);
    }
  }

  revalidatePath(ROUTES.DOCUMENT(documentId));
  return { success: true };
}
