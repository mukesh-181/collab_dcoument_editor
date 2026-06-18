export function EditorMockup() {
  return (
    <div className="mt-24 w-full max-w-5xl px-4 sm:px-6 lg:px-8 relative group">
      {/* Decorative background glow */}
      <div className="absolute -inset-1 rounded-[2rem] bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-20 blur-2xl transition duration-1000 group-hover:opacity-30"></div>

      <div className="relative overflow-hidden rounded-2xl border border-white/20 bg-white/60 shadow-2xl backdrop-blur-xl dark:border-zinc-800/50 dark:bg-zinc-950/50">
        <div className="flex items-center border-b border-zinc-200/50 bg-zinc-50/50 px-4 py-3 dark:border-zinc-800/50 dark:bg-zinc-900/50 backdrop-blur-md">
          <div className="flex gap-2">
            <div className="h-3 w-3 rounded-full bg-red-400/80 dark:bg-zinc-700"></div>
            <div className="h-3 w-3 rounded-full bg-yellow-400/80 dark:bg-zinc-700"></div>
            <div className="h-3 w-3 rounded-full bg-green-400/80 dark:bg-zinc-700"></div>
          </div>
          <div className="mx-auto flex h-6 items-center rounded-md bg-white/50 px-3 text-[11px] font-medium text-zinc-500 shadow-sm ring-1 ring-zinc-200/50 dark:bg-zinc-950/50 dark:ring-zinc-800/50 backdrop-blur-sm">
            <span className="truncate max-w-[200px]">collabdoc.app/d/project-setup</span>
          </div>
        </div>

        <div className="relative p-8 sm:p-14 min-h-[400px]">
          <div className="mx-auto max-w-3xl space-y-6 text-left">
            <h2 className="text-4xl font-bold text-zinc-900 dark:text-zinc-50 font-serif tracking-tight">Project Setup &amp; Guidelines</h2>

            <p className="text-lg text-zinc-600 leading-relaxed dark:text-zinc-300">
              CollabDoc is designed to handle multiple concurrent users seamlessly.
              The underlying architecture relies on <strong className="text-zinc-900 dark:text-white font-medium">Conflict-free Replicated Data Types (CRDTs)</strong> to ensure that text merges deterministically without a central authority dictating state.
            </p>

            <div className="pl-4 border-l-2 border-indigo-500/30 text-zinc-500 dark:text-zinc-400 italic">
              &quot;We need to ensure the WebSocket connection reconnects automatically with exponential backoff.&quot;
            </div>

            <div className="pt-8">
              <div className="flex items-center gap-2">
                <input type="checkbox" className="h-4 w-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-600 dark:border-zinc-700 dark:bg-zinc-800" defaultChecked />
                <span className="text-zinc-700 dark:text-zinc-300 line-through opacity-60">Set up Yjs and Hocuspocus</span>
              </div>
              <div className="flex items-center gap-2 mt-3">
                <input type="checkbox" className="h-4 w-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-600 dark:border-zinc-700 dark:bg-zinc-800" />
                <span className="text-zinc-700 dark:text-zinc-300">Implement UI components</span>
              </div>
            </div>

            {/* Simulated Collaborative Cursors */}
            <div className="absolute top-[50%] left-[60%] flex flex-col items-start animate-bounce-slow pointer-events-none">
              <svg width="18" height="24" viewBox="0 0 18 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-indigo-500 drop-shadow-md">
                <path d="M2.85244 1.25881C2.17937 0.528414 1 1.00583 1 1.99616V22.2536C1 23.3644 2.37893 23.8821 3.10986 23.0456L7.91306 17.5501C8.19946 17.2223 8.61864 17.0308 9.05562 17.0308H15.9388C16.9421 17.0308 17.4116 15.7937 16.6664 15.1481L2.85244 1.25881Z" fill="currentColor"/>
              </svg>
              <div className="mt-1 rounded-full bg-indigo-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
                Mukesh
              </div>
            </div>

            <div className="absolute top-[70%] left-[20%] flex flex-col items-start animate-bounce-slow-delayed pointer-events-none delay-500">
              <svg width="18" height="24" viewBox="0 0 18 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-pink-500 drop-shadow-md">
                <path d="M2.85244 1.25881C2.17937 0.528414 1 1.00583 1 1.99616V22.2536C1 23.3644 2.37893 23.8821 3.10986 23.0456L7.91306 17.5501C8.19946 17.2223 8.61864 17.0308 9.05562 17.0308H15.9388C16.9421 17.0308 17.4116 15.7937 16.6664 15.1481L2.85244 1.25881Z" fill="currentColor"/>
              </svg>
              <div className="mt-1 rounded-full bg-pink-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
                Guest
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
