import { Navbar } from "@/components/layout/navbar";
import { Hero } from "./page/hero";
import { EditorMockup } from "./page/editor-mockup";
import { Footer } from "./page/footer";
import { User } from "@supabase/supabase-js";

export function LandingPage({ user }: { user: User | null }) {
  return (
    <div className="flex min-h-screen flex-col bg-white dark:bg-zinc-950">
      <Navbar />

      <main className="flex flex-1 flex-col items-center justify-center px-4 py-24 text-center sm:px-6 lg:px-8">
        <Hero user={user} />
        <EditorMockup />
      </main>

      <Footer />
    </div>
  );
}
