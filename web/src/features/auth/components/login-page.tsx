import { AuthTabs } from "./page/auth-tabs";

export function LoginPage({ next, tab }: { next: string; tab: string }) {
  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-zinc-950 relative overflow-hidden items-center justify-center px-4">
      {/* Dynamic Background */}
      <div className="absolute top-0 left-1/2 -z-10 -ml-[50rem] h-[50rem] w-[100rem] opacity-30 dark:opacity-40" aria-hidden="true">
        <div className="mx-auto h-full w-full bg-[radial-gradient(circle_at_center,theme(colors.indigo.200)_0%,transparent_100%)] dark:bg-[radial-gradient(circle_at_center,theme(colors.indigo.900)_0%,transparent_100%)]" />
      </div>
      <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.02] dark:opacity-[0.04] pointer-events-none mix-blend-overlay z-0"></div>
      
      <div className="relative z-10 w-full max-w-md">
        <AuthTabs next={next} defaultTab={tab} />
      </div>
    </div>
  );
}
