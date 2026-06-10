import { createClient } from "@supabase/supabase-js";
import { ENV } from "../config/env.js";

// This client is strictly for database operations. For auth validation we can just use the public key.
export const supabase = createClient(ENV.SUPABASE_URL, ENV.SUPABASE_PUBLISHABLE_KEY);
