import dotenv from "dotenv";

dotenv.config();

export const ENV = {
  SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  PORT: parseInt(process.env.PORT || "1235", 10),
} as const;
