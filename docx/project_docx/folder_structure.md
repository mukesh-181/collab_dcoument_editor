# CollabDoc — Folder Structure

Complete project structure of the `web/` directory with one-liner descriptions.

---

```
web/
├── .env.local                          # Supabase URL and anon key (secrets, not committed)
├── .gitignore                          # Git ignore rules for node_modules, .next, etc.
├── components.json                     # Shadcn UI configuration (Radix, Nova preset, Tailwind v4)
├── eslint.config.mjs                   # ESLint config for Next.js
├── next.config.ts                      # Next.js configuration
├── next-env.d.ts                       # Auto-generated Next.js TypeScript declarations
├── package.json                        # Dependencies and scripts (next dev, build, start)
├── package-lock.json                   # Locked dependency tree
├── postcss.config.mjs                  # PostCSS config for Tailwind processing
├── tsconfig.json                       # TypeScript compiler options and path aliases (@/)
│
├── public/                             # Static assets served at root URL
│
└── src/                                # All application source code
    │
    ├── proxy.ts                        # Edge Proxy — intercepts every request for auth + route protection
    │
    ├── app/                            # Next.js App Router — strictly for URL routing only
    │   ├── globals.css                 # Global styles, Tailwind directives, CSS custom properties
    │   ├── layout.tsx                  # Root layout — wraps entire app with fonts, metadata, Toaster
    │   ├── page.tsx                    # Landing page (/) — auth-aware hero CTA + editor mockup
    │   ├── favicon.ico                 # Browser tab icon
    │   │
    │   ├── about/
    │   │   └── page.tsx                # Static about page placeholder
    │   │
    │   ├── auth/
    │   │   └── callback/
    │   │       └── route.ts            # OAuth callback — exchanges auth code for session (PKCE flow)
    │   │
    │   ├── login/
    │   │   └── page.tsx                # Login/Register page — renders AuthTabs with tab param support
    │   │
    │   └── dashboard/
    │       ├── layout.tsx              # Dashboard layout shell — provides global sidebar navigation
    │       ├── page.tsx                # Dashboard home — top navbar + document table list with CRUD actions
    │       └── [docId]/
    │           └── page.tsx            # Dynamic document page — displays individual document by ID
    │
    ├── components/                     # Shared, reusable components (not feature-specific)
    │   │
    │   ├── layout/
    │   │   └── navbar.tsx              # Global navbar — auth-aware (Get Started vs Login/Signup)
    │   │
    │   └── ui/                         # Shadcn UI primitives (auto-generated, customized)
    │       ├── avatar.tsx              # User avatar with image fallback
    │       ├── button.tsx              # Button component with forwardRef and variant system
    │       ├── card.tsx                # Card container with header, content, footer slots
    │       ├── dropdown-menu.tsx       # Radix dropdown menu with styled items
    │       ├── form.tsx                # React Hook Form integration with Shadcn fields
    │       ├── input.tsx               # Styled text input
    │       ├── label.tsx               # Form label with required-field support
    │       ├── popover.tsx             # Floating popover panel for member lists
    │       ├── separator.tsx           # Horizontal/vertical divider line
    │       ├── sheet.tsx               # Slide-out drawer (mobile sidebar, dialogs)
    │       ├── sonner.tsx              # Toast notification provider (success/error feedback)
    │       └── tabs.tsx                # Tab switcher with simplified pill-style triggers
    │
    ├── features/                       # Feature-based modules — all business logic lives here
    │   │
    │   ├── auth/                       # Authentication feature
    │   │   ├── actions/
    │   │   │   └── auth.actions.ts     # Server Actions — login, register, logout with Zod validation
    │   │   ├── components/
    │   │   │   ├── auth-tabs.tsx       # Tab container switching between LoginForm and RegisterForm
    │   │   │   ├── login-form.tsx      # Email/password login form with show/hide toggle
    │   │   │   ├── oauth-buttons.tsx   # GitHub OAuth button (client-side redirect)
    │   │   │   └── register-form.tsx   # Registration form with username, email, password, confirm
    │   │   ├── hooks/                  # (Empty) Reserved for auth-related custom hooks
    │   │   └── schemas/
    │   │       └── auth.schema.ts      # Zod schemas — loginSchema and registerSchema validation
    │   │
    │   ├── dashboard/                  # Dashboard feature
    │   │   ├── actions/
    │   │   │   └── document.actions.ts # Server Actions — createDocument, getUserDocuments, deleteDocument, updateDocumentTitle
    │   │   ├── components/
    │   │   │   ├── create-document-button.tsx # Client component — Dialog for creating new documents
    │   │   │   ├── dashboard-layout.tsx # Edge-to-edge sidebar layout shell
    │   │   │   └── sidebar-doc-list.tsx # Client component — highlights active document using usePathname
    │   │   └── hooks/                  # (Empty) Reserved for dashboard-related custom hooks
    │   │
    │   ├── collaboration/              # (Scaffolded) Real-time collaboration via Yjs/Hocuspocus
    │   │   ├── components/             # (Empty) Will hold presence indicators, cursor overlays
    │   │   └── hooks/                  # (Empty) Will hold useCollaboration, usePresence hooks
    │   │
    │   ├── document/                   # Document-level operations
    │   │   ├── actions/
    │   │   │   └── document.actions.ts # Server Actions — getDocumentById, getDocumentContent for secure access
    │   │   ├── components/
    │   │   │   ├── document-context.tsx # Context Provider — manages sync state (saving/saved/offline) between header and editor
    │   │   │   └── document-header.tsx # Client component — top navigation bar, handles title renaming and save status
    │   │   └── hooks/                  # (Empty) Will hold useDocument hook
    │   │
    │   ├── editor/                     # Rich text editor feature
    │   │   ├── components/             
    │   │   │   ├── editor.tsx          # EditorProvider wrapper with Pageless A4 layout and all extensions
    │   │   │   └── toolbar.tsx         # Reactive formatting toolbar (Font Family, Size, Color, Headings, Undo/Redo)
    │   │   ├── extensions/             
    │   │   │   └── font-size.ts        # Custom Tiptap extension — applies inline px font sizes via textStyle mark
    │   │   └── hooks/                  # (Empty) Will hold useEditor, useToolbar hooks
    │   │
    │   └── invites/                    # Sharing and access control feature
    │       ├── actions/
    │       │   └── invite.actions.ts   # Server Actions — createInviteLink, acceptInvite
    │       ├── components/
    │       │   └── share-dialog.tsx    # Client component — Dialog to generate one-time invite links
    │       └── hooks/                  # (Empty) Will hold useInvites hook
    │
    ├── lib/                            # Core utilities and third-party client setup
    │   ├── utils.ts                    # cn() helper — merges Tailwind classes via clsx + twMerge
    │   ├── utils/                      # (Empty) Reserved for additional utility modules
    │   └── supabase/                   # Supabase client factory (3 environments)
    │       ├── client.ts               # Browser client — reads cookies via document.cookie
    │       ├── server.ts               # Server client — reads cookies via next/headers
    │       └── proxy.ts                # Edge client — refreshes expired sessions on every request
    │
    ├── store/                          # (Empty) Reserved for Zustand/global state management
    ├── types/                          # (Empty) Reserved for shared TypeScript type definitions
    └── utils/                          # (Empty) Reserved for standalone utility functions
```

---

## Key Architectural Rules

1. **`app/` is for routing only** — no UI components or business logic. Pages import from `features/`.
2. **`features/` is the brain** — each feature owns its actions, components, hooks, schemas, and extensions.
3. **`components/ui/` is Shadcn** — auto-generated primitives, lightly customized for the project.
4. **`lib/supabase/` has 3 clients** — one per Next.js runtime (browser, server, edge).
5. **`proxy.ts` is the gatekeeper** — runs on every request, refreshes sessions, blocks unauthorized access.
6. **`features/editor/extensions/`** — custom Tiptap extensions live here, keeping editor logic modular and testable.
