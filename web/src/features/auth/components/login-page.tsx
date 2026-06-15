import { AuthTabs } from "./page/auth-tabs";

export function LoginPage({ next, tab }: { next: string; tab: string }) {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-gradient-to-br from-indigo-50/50 via-white/30 to-purple-50/40 dark:from-indigo-950/30 dark:via-zinc-950/30 dark:to-purple-950/30 relative px-4 overflow-hidden">
      <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.015] dark:opacity-[0.03] pointer-events-none mix-blend-overlay"></div>
      <div className="relative z-10 w-full max-w-md">
        <AuthTabs next={next} defaultTab={tab} />
      </div>
    </div>
  );
}
