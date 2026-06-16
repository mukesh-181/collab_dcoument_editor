import { ReactNode } from "react";
import { DashboardHeader } from "./layout/dashboard-header";
import { MainWrapper } from "./layout/main-wrapper";
import { createClient } from "@/lib/supabase/server";
export async function DashboardLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="flex min-h-screen w-full flex-col bg-zinc-50 dark:bg-zinc-950 relative overflow-clip">
      {/* Dynamic Background */}
      <div className="absolute top-0 left-1/2 -z-10 -ml-[50rem] h-[50rem] w-[100rem] opacity-30 dark:opacity-40" aria-hidden="true">
        <div className="mx-auto h-full w-full bg-[radial-gradient(circle_at_center,theme(colors.indigo.200)_0%,transparent_100%)] dark:bg-[radial-gradient(circle_at_center,theme(colors.indigo.900)_0%,transparent_100%)]" />
      </div>
      <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.02] dark:opacity-[0.04] pointer-events-none mix-blend-overlay z-0"></div>

      <div className="relative z-10 flex min-h-screen flex-col">
        <DashboardHeader user={user} />
        <MainWrapper>
          {children}
        </MainWrapper>
      </div>
    </div>
  );
}
