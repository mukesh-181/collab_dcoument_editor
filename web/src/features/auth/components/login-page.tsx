import { AuthTabs } from "./page/auth-tabs";

export function LoginPage({ next, tab }: { next: string; tab: string }) {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-zinc-50 px-4 dark:bg-zinc-950">
      <AuthTabs next={next} defaultTab={tab} />
    </div>
  );
}
