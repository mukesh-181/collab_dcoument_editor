import { Zap, Shield, Users, Layers, Sparkles, Clock } from "lucide-react";

export function FeaturesGrid() {
  const features = [
    {
      name: "Real-time Sync",
      description: "Powered by Yjs and Hocuspocus for sub-millisecond collaboration, ensuring you never miss a beat.",
      icon: Zap,
    },
    {
      name: "Rich Text Editing",
      description: "A beautiful, block-based Tiptap editor that feels familiar but packs advanced formatting capabilities.",
      icon: Layers,
    },
    {
      name: "Role-based Access",
      description: "Secure your documents with Editor and Viewer roles. Only invite the people you trust.",
      icon: Shield,
    },
    {
      name: "Live Presence",
      description: "See exactly who is editing and where their cursor is with real-time avatar bubbles and live cursors.",
      icon: Users,
    },
    {
      name: "Modern Design",
      description: "Crafted with dark mode, glassmorphism, and subtle micro-animations for a stunning authoring experience.",
      icon: Sparkles,
    },
    {
      name: "Instant Updates",
      description: "No refresh required. Changes, comments, and invites appear instantly across all your connected devices.",
      icon: Clock,
    },
  ];

  return (
    <div className="mx-auto mt-32 max-w-7xl px-6 lg:px-8">
      <div className="mx-auto max-w-2xl sm:text-center">
        <h2 className="text-base font-semibold leading-7 text-indigo-600 dark:text-indigo-400">Everything you need</h2>
        <p className="mt-2 text-3xl font-bold tracking-tight text-zinc-900 dark:text-white sm:text-4xl">
          Designed for speed and focus.
        </p>
        <p className="mt-6 text-lg leading-8 text-zinc-600 dark:text-zinc-400">
          We built CollabDoc to be the fastest, most reliable collaborative editor. Here&apos;s what makes it different.
        </p>
      </div>

      <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
        <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
          {features.map((feature) => (
            <div key={feature.name} className="flex flex-col rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 p-6 shadow-sm hover:shadow-md transition-shadow backdrop-blur-sm">
              <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-zinc-900 dark:text-white">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600/10 dark:bg-indigo-500/10 border border-indigo-600/20 dark:border-indigo-500/20">
                  <feature.icon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" aria-hidden="true" />
                </div>
                {feature.name}
              </dt>
              <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-zinc-600 dark:text-zinc-400">
                <p className="flex-auto">{feature.description}</p>
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
