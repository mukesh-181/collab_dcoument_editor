import { Navbar } from "@/components/layout/navbar";
import { Hero } from "./hero";
import { EditorMockup } from "./editor-mockup";
import { Footer } from "./footer";
import { User } from "@supabase/supabase-js";

export function LandingPage({ user }: { user: User | null }) {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-indigo-50/50 via-white/30 to-purple-50/40 dark:from-indigo-950/30 dark:via-zinc-950/30 dark:to-purple-950/30 relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.015] dark:opacity-[0.03] pointer-events-none mix-blend-overlay"></div>
      <div className="relative z-10 flex min-h-screen flex-col">
        <Navbar />

        <main className="flex flex-1 flex-col items-center justify-center px-4 py-24 text-center sm:px-6 lg:px-8">
          <Hero user={user} />
          <EditorMockup />
        </main>

        <Footer />
      </div>
    </div>
  );
}
