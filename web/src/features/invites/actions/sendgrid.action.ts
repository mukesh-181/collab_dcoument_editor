"use server";

import sgMail from "@sendgrid/mail";
import { ENV } from "@/constants/env";

if (ENV.SENDGRID_API_KEY) {
  sgMail.setApiKey(ENV.SENDGRID_API_KEY);
}

interface SendMailParams {
  to: string;
  subject: string;
  html: string;
}

export async function sendMail({
  to,
  subject,
  html,
}: SendMailParams) {
  try {
    await sgMail.send({
      to,
      from: {
        email: ENV.SENDGRID_FROM_EMAIL!,
        name: "CollabDoc",
      },
      subject,
      html,
    });

    return { success: true };
  } catch (error) {
    console.error("SendGrid Error:", error);
    throw new Error("Failed to send email via sendgrid ");
  }
}