# CollabDoc — Folder Structure
*(Last Updated: 2026-06-16)*

Complete project structure of the `web/` directory with one-liner descriptions, incorporating recent modularization and feature enhancements.

---

```
collab_docx/
├── hocuspocus-server/                  # Standalone WebSocket server for real-time collaboration
│   ├── .env                            # Supabase URL and service role key (secrets, not committed)
│   ├── package.json                    # Dependencies (tsx, @hocuspocus/server, yjs, supabase-js)
│   ├── tsconfig.json                   # TypeScript compiler options (ESNext module resolution)
│   └── src/                            # Server source code
│       ├── config/
│       │   ├── env.ts                  # Centralized constants for environment variables
│       │   └── hocuspocus.config.ts    # Core logic — onAuthenticate, onLoadDocument, onStoreDocument hooks
│       ├── lib/
│       │   └── supabase.ts             # Supabase client initialized with Service Role key to bypass RLS
│       └── server.ts                   # Entry point — starts the HTTP/WebSocket listener
│
├── web/                                # Next.js frontend application
│   ├── AGENTS.md                       # LLM agent instructions & context
│   ├── CLAUDE.md                       # IDE specific agent instructions
│   ├── components.json                 # Shadcn UI configuration (Radix, Nova preset, Tailwind v4)
│   ├── .env.local                      # Supabase URL and anon key (secrets, not committed)
│   ├── eslint.config.mjs               # ESLint config for Next.js
│   ├── .gitignore                      # Git ignore rules for node_modules, .next, etc.
│   ├── next.config.ts                  # Next.js configuration
│   ├── next-env.d.ts                   # Auto-generated Next.js TypeScript declarations
│   ├── package.json                    # Dependencies and scripts (next dev, build, start)
│   ├── package-lock.json               # Locked dependency tree
│   ├── postcss.config.mjs              # PostCSS config for Tailwind processing
│   ├── public/                         # Static assets served at root URL
│   │   ├── file.svg
│   │   ├── globe.svg
│   │   ├── next.svg
│   │   ├── vercel.svg
│   │   └── window.svg
│   ├── README.md
│   ├── tsconfig.json                   # TypeScript compiler options and path aliases (@/)
│   ├── tsconfig.tsbuildinfo
│   └── src/                            # All application source code
│       ├── proxy.ts                    # Edge Proxy — intercepts every request for auth + route protection
│       ├── app/                        # Next.js App Router — strictly for URL routing only
│       │   ├── about/
│       │   │   └── page.tsx            # Static about page placeholder
│       │   │
│       │   ├── auth/
│       │   │   └── callback/
│       │   │       └── route.ts        # OAuth callback — exchanges auth code for session (PKCE flow)
│       │   │
│       │   ├── dashboard/
│       │   │   ├── (home)/
│       │   │   │   ├── loading.tsx         # Instantly rendered Suspense fallback using skeletons
│       │   │   │   └── page.tsx            # Dashboard home — top navbar + document table list with CRUD actions
│       │   │   ├── [docId]/
│       │   │   │   └── page.tsx        # Dynamic document page — displays individual document by ID
│       │   │   ├── invite/
│       │   │   │   └── page.tsx        # Intermediate Accept/Cancel invitation screen
│       │   │   └── layout.tsx          # Dashboard layout shell — provides global sidebar navigation
│       │   │
│       │   ├── inbox/
│       │   │   └── page.tsx            # Interactive inbox displaying pending and historical invitations
│       │   ├── not-found.tsx           # Custom 404 error page for unmatched routes
│       │   ├── favicon.ico             # Browser tab icon
│       │   ├── globals.css             # Global styles, Tailwind directives, CSS custom properties
│       │   ├── layout.tsx              # Root layout — wraps entire app with fonts, metadata, Toaster
│       │   ├── login/
│       │   │   └── page.tsx            # Login/Register page — renders AuthTabs with tab param support
│       │   └── page.tsx                # Landing page (/) — auth-aware hero CTA + editor mockup
│       │
│       ├── components/                 # Shared, reusable components (not feature-specific)
│       │   ├── layout/
│       │   │   └── navbar.tsx          # Global navbar — auth-aware (Get Started vs Login/Signup)
│       │   │
│       │   └── ui/                     # Shadcn UI primitives (auto-generated, customized)
│       │       ├── avatar.tsx          # User avatar with image fallback
│       │       ├── button.tsx          # Button component with forwardRef and variant system
│       │       ├── card.tsx            # Card container with header, content, footer slots
│       │       ├── dialog.tsx
│       │       ├── dropdown-menu.tsx   # Radix dropdown menu with styled items
│       │       ├── form.tsx            # React Hook Form integration with Shadcn fields
│       │       ├── input.tsx           # Styled text input
│       │       ├── label.tsx           # Form label with required-field support
│       │       ├── popover.tsx         # Floating popover panel for member lists
│       │       ├── select.tsx
│       │       ├── separator.tsx       # Horizontal/vertical divider line
│       │       ├── sheet.tsx           # Slide-out drawer (mobile sidebar, dialogs)
│       │       ├── skeleton.tsx        # Pulsing loading state primitive
│       │       ├── sonner.tsx          # Toast notification provider (success/error feedback)
│       │       ├── tabs.tsx            # Tab switcher with simplified pill-style triggers
│       │       ├── toggle.tsx
│       │       ├── tooltip.tsx
│       │       └── tooltip-wrapper.tsx # Reusable tooltip wrapper component
│       │
│       ├── features/                   # Feature-based modules — all business logic lives here
│       │   ├── about/
│       │   │   └── components/
│       │   │       └── about-page.tsx
│       │   │
│       │   ├── auth/                   # Authentication feature
│       │   │   ├── actions/
│       │   │   │   ├── login.action.ts   # Server Action — login
│       │   │   │   ├── logout.action.ts  # Server Action — logout
│       │   │   │   └── signup.action.ts  # Server Action — register
│       │   │   │
│       │   │   ├── components/
│       │   │   │   ├── login-page.tsx
│       │   │   │   ├── sign-out-button.tsx       # Reusable button with confirmation dialog
│       │   │   │   └── page/
│       │   │   │       ├── auth-tabs.tsx     # Tab container switching between LoginForm and RegisterForm
│       │   │   │       ├── login-form.tsx    # Email/password login form with show/hide toggle
│       │   │   │       ├── oauth-buttons.tsx # GitHub OAuth button (client-side redirect)
│       │   │   │       └── register-form.tsx # Registration form with username, email, password, confirm
│       │   │   │
│       │   │   ├── hooks/
│       │   │   └── schemas/
│       │   │       └── auth.schema.ts  # Zod schemas — loginSchema and registerSchema validation
│       │   │
│       │   ├── collaboration/          # Real-time collaboration via Yjs/Hocuspocus
│       │   │   ├── components/
│       │   │   └── hooks/
│       │   │
│       │   ├── dashboard/              # Dashboard feature
│       │   │   ├── actions/
│       │   │   │   ├── create-document.action.ts
│       │   │   │   ├── delete-document.action.ts
│       │   │   │   ├── get-user-documents.action.ts
│       │   │   │   ├── update-document-content.action.ts
│       │   │   │   └── update-document-title.action.ts
│       │   │   │
│       │   │   ├── components/
│       │   │   │   ├── dashboard-layout.tsx       # Edge-to-edge sidebar layout shell
│       │   │   │   ├── dashboard-page.tsx
│       │   │   │   ├── document-action-menu.tsx   # Action menu dropdown (Rename/Delete)
│       │   │   │   ├── document-delete-dialog.tsx # Extracted Delete confirmation dialog
│       │   │   │   ├── document-rename-dialog.tsx # Extracted Rename input dialog
│       │   │   │   ├── layout/
│       │   │   │   │   ├── create-document-button.tsx # Client component — Dialog for creating new documents
│       │   │   │   │   ├── mobile-sidebar.tsx         # Slide-out Shadcn Sheet for mobile navigation
│       │   │   │   │   ├── sidebar-content.tsx        # Shared navigation links for desktop and mobile
│       │   │   │   │   └── sidebar-doc-list.tsx       # Client component — highlights active document
│       │   │   │   └── page/
│       │   │   │       ├── dashboard-header.tsx
│       │   │   │       ├── document-card.tsx          # Extracted single document preview card
│       │   │   │       ├── document-list.tsx
│       │   │   │       └── document-list-skeleton.tsx # Loading skeleton for the dashboard table
│       │   │   │
│       │   │   └── hooks/
│       │   │
│       │   ├── inbox/                    # Inbox feature
│       │   │   ├── actions/
│       │   │   │   ├── delete-invite.action.ts
│       │   │   │   ├── get-inbox.action.ts
│       │   │   │   ├── get-unread-count.action.ts
│       │   │   │   └── reject-invite.action.ts
│       │   │   ├── components/
│       │   │   │   ├── inbox-client-list.tsx # Client component for instant filter rendering
│       │   │   │   ├── inbox-item-dialogs.tsx# Dialogs for Accept/Reject/Delete logic
│       │   │   │   ├── inbox-item.tsx        # Individual persistent invitation card
│       │   │   │   ├── inbox-list.tsx        # Server component fetching and passing invites
│       │   │   │   ├── inbox-realtime-listener.tsx # Realtime badge and list updates
│       │   │   │   └── inbox-skeleton.tsx    # Loading skeleton for the inbox
│       │   │   └── hooks/
│       │   │
│       │   ├── document/               # Document-level operations
│       │   │   ├── actions/
│       │   │   │   ├── get-document-by-id.action.ts
│       │   │   │   ├── get-document-content.action.ts
│       │   │   │   ├── leave-document.action.ts
│       │   │   │   ├── remove-member.action.ts
│       │   │   │   └── update-member-role.action.ts
│       │   │   │
│       │   │   ├── components/
│       │   │   │   ├── document-page.tsx
│       │   │   │   └── page/
│       │   │   │       ├── active-users-cluster.tsx   # Renders online member avatars
│       │   │   │       ├── document-client-layout.tsx # Layout wrapper for document pages
│       │   │   │       ├── document-context.tsx       # Context Provider — manages sync state
│       │   │   │       ├── document-header.tsx        # Client component — top navigation bar
│       │   │   │       ├── document-members-popover.tsx # Popover displaying full member list
│       │   │   │       ├── document-realtime-listener.tsx # Handles UI updates for role changes and access revocation
│       │   │   │       ├── document-rename-dialog.tsx # Dialog for renaming document titles
│       │   │   │       ├── document-skeleton.tsx      # Skeleton loader for documents
│       │   │   │       └── document-sync-status.tsx   # UI indicator for save/offline states
│       │   │   │
│       │   │   └── hooks/
│       │   │
│       │   ├── editor/                 # Rich text editor feature
│       │   │   ├── actions/
│       │   │   │   └── upload-image.action.ts # Server action for persisting images to Supabase
│       │   │   ├── components/
│       │   │   │   ├── editor.tsx      # EditorProvider wrapper with Pageless A4 layout and all extensions
│       │   │   │   ├── formatting-bubble-menu.tsx # Floating menu for bold/italic/color
│       │   │   │   ├── link-bubble-menu.tsx
│       │   │   │   ├── offline-banner.tsx # Warning displayed when WebSocket disconnects
│       │   │   │   ├── slash-menu-list.tsx # Popover list for slash commands
│       │   │   │   ├── toolbar/
│       │   │   │   │   ├── alignment-controls.tsx
│       │   │   │   │   ├── color-control.tsx
│       │   │   │   │   ├── font-family-control.tsx # Font family selection dropdown
│       │   │   │   │   ├── font-size-control.tsx
│       │   │   │   │   ├── format-controls.tsx
│       │   │   │   │   ├── heading-controls.tsx
│       │   │   │   │   ├── highlight-control.tsx   # Text highlight color picker
│       │   │   │   │   ├── history-controls.tsx
│       │   │   │   │   ├── image-control.tsx
│       │   │   │   │   ├── link-control.tsx
│       │   │   │   │   ├── list-controls.tsx
│       │   │   │   │   └── table-control.tsx
│       │   │   │   └── toolbar.tsx     # Composer layout for all toolbar controls
│       │   │   │
│       │   │   ├── extensions/
│       │   │   │   ├── font-size.ts    # Custom Tiptap extension — applies inline px font sizes
│       │   │   │   ├── resizable-image.tsx # Custom extension for drag-to-resize images
│       │   │   │   └── slash-command.tsx # Custom extension enabling '/' keyboard triggers
│       │   │   │
│       │   │   └── hooks/
│       │   │
│       │   ├── invites/                # Sharing and access control feature
│       │   │   ├── actions/
│       │   │   │   ├── accept-invite.action.ts
│       │   │   │   ├── create-invite.action.ts
│       │   │   │   ├── get-invite-details.action.ts
│       │   │   │   ├── search-users.action.ts
│       │   │   │   └── send-email-invites.action.ts
│       │   │   │
│       │   │   ├── components/
│       │   │   │   ├── accept-invite-button.tsx
│       │   │   │   ├── create-link-tab.tsx       # Extracted link generation form tab
│       │   │   │   ├── invite-page.tsx
│       │   │   │   ├── send-email-tab.tsx        # Bulk email dispatch form
│       │   │   │   ├── share-dialog.tsx          # Client component — Dialog container for invites
│       │   │   │   └── user-search-input.tsx     # Debounced, multi-email token input with Github avatars
│       │   │   │
│       │   │   └── hooks/
│       │   │
│       │   └── landing/
│       │       └── components/
│       │           ├── landing-page.tsx
│       │           └── page/
│       │               ├── editor-mockup.tsx
│       │               ├── footer.tsx
│       │               └── hero.tsx
│       │
│       ├── constants/
│       │   │   └── routes.ts           # Unified registry for all application routes
│       │   ├── lib/                        # Core utilities and third-party client setup
│       │   │   ├── constants/
│       │   │   │   └── env.ts              # Centralized, strictly-typed environment variables
│       │   │   ├── supabase/               # Supabase client factory (3 environments)
│       │   │   │   ├── client.ts           # Browser client — reads cookies via document.cookie
│       │   │   │   ├── proxy.ts            # Edge client — refreshes expired sessions on every request
│       │   │   │   └── server.ts           # Server client — reads cookies via next/headers
│       │   │   └── utils.ts                # cn() helper — merges Tailwind classes via clsx + twMerge
│       │   ├── store/                      # (Empty) Reserved for Zustand/global state management
│       │   ├── types/                      # (Empty) Reserved for shared TypeScript type definitions
│       │   └── utils/                      # Shared utility and configuration files
│       │       ├── editor-config.ts    # Centralized Tiptap extensions and editorProps config
│       │       └── string-utils.ts     # General string helpers (e.g., getInitials)
```

---

## Key Architectural Rules

1. **`app/` is for routing only** — no UI components or business logic. Pages import from `features/`.
2. **`features/` is the brain** — each feature owns its actions, components, hooks, schemas, and extensions.
3. **`components/ui/` is Shadcn** — auto-generated primitives, lightly customized for the project.
4. **`lib/supabase/` has 3 clients** — one per Next.js runtime (browser, server, edge).
5. **`proxy.ts` is the gatekeeper** — runs on every request, refreshes sessions, blocks unauthorized access.
6. **`features/editor/extensions/`** — custom Tiptap extensions live here, keeping editor logic modular and testable.
