# CollabDoc — Folder Structure
*(Last Updated: 2026-06-25)*

Complete project structure of the `web/` directory with one-liner descriptions, incorporating recent modularization and feature enhancements.

---

```text
collab_docx/
├── hocuspocus-server/                  # Standalone WebSocket server for real-time collaboration
│   ├── package.json                    # Dependencies (tsx, @hocuspocus/server, yjs, supabase-js)
│   ├── tsconfig.json                   # TypeScript compiler options (ESNext module resolution)
│   ├── src/                            # Server source code
│   │   ├── config/
│   │   │   ├── env.ts                  # Centralized constants for environment variables
│   │   │   └── hocuspocus.config.ts    # Core logic — onAuthenticate, onLoadDocument, onStoreDocument hooks
│   │   ├── lib/
│   │   │   └── supabase.ts             # Supabase client initialized with Service Role key to bypass RLS
│   │   └── server.ts                   # Entry point — starts the HTTP/WebSocket listener
│   └── tests/                          # Vitest unit test suite for WebSocket server
│       ├── env.test.ts                 # Validates environment variable parsing
│       └── hooks.test.ts               # Mocks Supabase and tests auth/persistence hooks
│
├── web/                                # Next.js frontend application
│   ├── AGENTS.md                       # LLM agent instructions & context
│   ├── CLAUDE.md                       # IDE specific agent instructions
│   ├── components.json                 # Shadcn UI configuration (Radix, Nova preset, Tailwind v4)
│   ├── eslint.config.mjs               # ESLint config for Next.js
│   ├── next.config.ts                  # Next.js configuration
│   ├── next-env.d.ts                   # Auto-generated Next.js TypeScript declarations
│   ├── package.json                    # Dependencies and scripts (next dev, build, start)
│   ├── postcss.config.mjs              # PostCSS config for Tailwind processing
│   ├── tsconfig.json                   # TypeScript compiler options and path aliases (@/)
│   ├── vitest.config.ts                # Vitest configuration for unit testing
│   ├── proxy.ts                        # Edge Proxy — intercepts every request for auth + route protection
│   ├── app/                            # Next.js App Router — strictly for URL routing only
│   │   ├── (main)/dashboard/           # Main dashboard routes group
│   │   │   ├── (home)/                 # Route group — isolates loading.tsx
│   │   │   │   ├── loading.tsx         # Instantly rendered Suspense fallback using skeletons
│   │   │   │   └── page.tsx            # Dashboard home — top navbar + document table list with CRUD actions
│   │   │   ├── [docId]/
│   │   │   │   └── page.tsx            # Dynamic document page — displays individual document by ID
│   │   │   ├── invite/
│   │   │   │   └── page.tsx            # Intermediate Accept/Cancel invitation screen
│   │   │   └── layout.tsx              # Dashboard layout shell — provides global sidebar navigation

│   │   ├── auth/callback/route.ts      # OAuth callback — exchanges auth code for session (PKCE flow)
│   │   ├── forgot-password/page.tsx    # Password reset request page
│   │   ├── inbox/page.tsx              # Interactive inbox displaying pending and historical invitations
│   │   ├── login/page.tsx              # Login/Register page — renders AuthTabs with tab param support
│   │   ├── update-password/page.tsx    # New password entry page
│   │   ├── favicon.ico                 # Browser tab icon
│   │   ├── globals.css                 # Global styles, Tailwind directives, CSS custom properties
│   │   ├── layout.tsx                  # Root layout — wraps entire app with fonts, metadata, Toaster
│   │   ├── not-found.tsx               # Custom 404 error page for unmatched routes
│   │   └── page.tsx                    # Landing page (/) — auth-aware hero CTA + editor mockup
│   │
│   ├── public/                         # Static assets
│   │   └── noise.png                   # Glassmorphic texture overlay used for UI backgrounds
│   │
│   ├── components/                     # Shared, reusable components (not feature-specific)
│   │   ├── layout/
│   │   │   └── navbar.tsx              # Global navbar — auth-aware (Get Started vs Login/Signup)
│   │   └── ui/                         # Shadcn UI primitives (auto-generated, customized)
│   │       ├── avatar.tsx              # User avatar with image fallback
│   │       ├── button.tsx              # Button component with forwardRef and variant system
│   │       ├── card.tsx                # Card container with header, content, footer slots
│   │       ├── dialog.tsx
│   │       ├── dropdown-menu.tsx       # Radix dropdown menu with styled items
│   │       ├── form.tsx                # React Hook Form integration with Shadcn fields
│   │       ├── input.tsx               # Styled text input
│   │       ├── label.tsx               # Form label with required-field support
│   │       ├── popover.tsx             # Floating popover panel for member lists
│   │       ├── select.tsx
│   │       ├── separator.tsx           # Horizontal/vertical divider line
│   │       ├── sheet.tsx               # Slide-out drawer (mobile sidebar, dialogs)
│   │       ├── skeleton.tsx            # Pulsing loading state primitive
│   │       ├── sonner.tsx              # Toast notification provider (success/error feedback)
│   │       ├── tabs.tsx                # Tab switcher with simplified pill-style triggers
│   │       ├── toggle.tsx
│   │       ├── tooltip.tsx
│   │       └── tooltip-wrapper.tsx     # Reusable tooltip wrapper component
│   │
│   ├── constants/
│   │   ├── env.ts                      # Centralized constants for environment variables
│   │   └── routes.ts                   # Unified registry for all application routes
│   │
│   ├── features/                       # Feature-based modules — all business logic lives here
│   │   ├── about/
│   │   │   └── components/
│   │   │       └── about-page.tsx
│   │   │
│   │   ├── auth/                       # Authentication feature
│   │   │   ├── actions/
│   │   │   │   ├── login.action.ts
│   │   │   │   ├── logout.action.ts
│   │   │   │   ├── request-password-reset.action.ts
│   │   │   │   ├── signup.action.ts
│   │   │   │   └── update-password.action.ts
│   │   │   ├── components/
│   │   │   │   ├── page/
│   │   │   │   │   ├── auth-tabs.tsx
│   │   │   │   │   ├── login-form.tsx
│   │   │   │   │   ├── oauth-buttons.tsx
│   │   │   │   │   └── register-form.tsx
│   │   │   │   ├── forgot-password-form.tsx
│   │   │   │   ├── login-page.tsx
│   │   │   │   ├── sign-out-button.tsx
│   │   │   │   └── update-password-form.tsx
│   │   │   └── schemas/
│   │   │       └── auth.schema.ts
│   │   │
│   │   ├── dashboard/                  # Dashboard feature
│   │   │   ├── actions/
│   │   │   │   ├── create-document.action.ts
│   │   │   │   ├── delete-document.action.ts
│   │   │   │   ├── get-user-documents.action.ts
│   │   │   │   └── update-document-title.action.ts
│   │   │   ├── components/
│   │   │   │   ├── dialogs/
│   │   │   │   │   ├── document-delete-dialog.tsx
│   │   │   │   │   └── document-rename-dialog.tsx
│   │   │   │   ├── layout/
│   │   │   │   │   ├── create-document-button.tsx
│   │   │   │   │   ├── dashboard-header.tsx
│   │   │   │   │   ├── main-wrapper.tsx
│   │   │   │   │   ├── mobile-sidebar.tsx
│   │   │   │   │   └── sidebar-content.tsx
│   │   │   │   ├── page/
│   │   │   │   │   ├── document-card.tsx
│   │   │   │   │   ├── document-list-skeleton.tsx
│   │   │   │   │   └── document-list.tsx
│   │   │   │   ├── dashboard-layout.tsx
│   │   │   │   └── document-action-menu.tsx
│   │   │   ├── hooks/
│   │   │   │   └── use-document-preview.ts
│   │   │   └── types.ts
│   │   │
│   │   ├── document/                   # Document-level operations
│   │   │   ├── actions/
│   │   │   │   ├── get-document-activity.action.ts
│   │   │   │   ├── get-document-by-id.action.ts
│   │   │   │   ├── leave-document.action.ts
│   │   │   │   ├── remove-member.action.ts
│   │   │   │   └── update-member-role.action.ts
│   │   │   └── components/
│   │   │       ├── page/
│   │   │       │   ├── active-users-cluster.tsx
│   │   │       │   ├── document-activity-tree.tsx
│   │   │       │   ├── document-client-layout.tsx
│   │   │       │   ├── document-context.tsx
│   │   │       │   ├── document-header.tsx
│   │   │       │   ├── document-members-popover.tsx
│   │   │       │   ├── document-realtime-listener.tsx
│   │   │       │   ├── document-skeleton.tsx
│   │   │       │   ├── document-sync-status.tsx
│   │   │       │   ├── leave-document-dialog.tsx
│   │   │       │   ├── no-permission-page.tsx
│   │   │       │   └── remove-member-dialog.tsx
│   │   │       └── document-page.tsx
│   │   │
│   │   ├── editor/                     # Rich text editor feature
│   │   │   ├── actions/
│   │   │   │   └── upload-image.action.ts
│   │   │   ├── components/
│   │   │   │   ├── toolbar/
│   │   │   │   │   ├── alignment-controls.tsx
│   │   │   │   │   ├── color-control.tsx
│   │   │   │   │   ├── font-family-control.tsx
│   │   │   │   │   ├── font-size-control.tsx
│   │   │   │   │   ├── format-controls.tsx
│   │   │   │   │   ├── heading-controls.tsx
│   │   │   │   │   ├── highlight-control.tsx
│   │   │   │   │   ├── history-controls.tsx
│   │   │   │   │   ├── image-control.tsx
│   │   │   │   │   ├── link-control.tsx
│   │   │   │   │   ├── list-controls.tsx
│   │   │   │   │   └── table-control.tsx
│   │   │   │   ├── editor.tsx
│   │   │   │   ├── formatting-bubble-menu.tsx
│   │   │   │   ├── lazy-editor.tsx         # Lazy loaded editor to prevent SSR mismatch
│   │   │   │   ├── link-bubble-menu.tsx
│   │   │   │   ├── offline-banner.tsx
│   │   │   │   ├── page-thumbnails.tsx     # Extracted page thumbnails navigation sidebar
│   │   │   │   ├── slash-menu-list.tsx
│   │   │   │   └── toolbar.tsx             # Composer layout for all toolbar controls
│   │   │   ├── config/
│   │   │   │   └── editor-extensions.ts    # Centralized configuration for all extensions
│   │   │   ├── extensions/
│   │   │   │   ├── font-size.ts
│   │   │   │   ├── inline-quote.ts
│   │   │   │   ├── resizable-image.tsx
│   │   │   │   └── slash-command.tsx
│   │   │   └── utils/
│   │   │       └── page-extraction.ts      # HTML page content extraction logic for export and previews
│   │   │
│   │   ├── inbox/                      # Inbox feature
│   │   │   ├── actions/
│   │   │   │   ├── get-inbox.action.ts
│   │   │   │   └── get-unread-count.action.ts
│   │   │   └── components/
│   │   │       ├── inbox-client-list.tsx
│   │   │       ├── inbox-item-dialogs.tsx
│   │   │       ├── inbox-item.tsx
│   │   │       ├── inbox-list.tsx
│   │   │       ├── inbox-realtime-listener.tsx
│   │   │       └── inbox-skeleton.tsx
│   │   │
│   │   ├── invites/                    # Sharing and access control feature
│   │   │   ├── actions/
│   │   │   │   ├── accept-invite.action.ts
│   │   │   │   ├── create-invite.action.ts
│   │   │   │   ├── delete-invite.action.ts
│   │   │   │   ├── get-invite-details.action.ts
│   │   │   │   ├── reject-invite.action.ts
│   │   │   │   ├── search-users.action.ts
│   │   │   │   ├── send-email-invites.action.ts
│   │   │   │   └── sendgrid.action.ts      # Email API sending wrapper
│   │   │   └── components/
│   │   │       ├── accept-invite-button.tsx
│   │   │       ├── create-link-tab.tsx
│   │   │       ├── invite-page.tsx
│   │   │       ├── navbar.tsx
│   │   │       ├── send-email-tab.tsx
│   │   │       ├── share-dialog.tsx
│   │   │       └── user-search-input.tsx
│   │   │
│   │   ├── landing/                    # Marketing / Landing page UI components
│   │   │   └── components/
│   │   │       ├── editor-mockup.tsx
│   │   │       ├── features-grid.tsx
│   │   │       ├── footer.tsx
│   │   │       ├── hero.tsx
│   │   │       └── landing-page.tsx
│   │   │
│   │   └── user/                       # User profile and settings feature
│   │       ├── actions/
│   │       │   ├── update-profile.action.ts
│   │       │   └── upload-avatar.action.ts
│   │       ├── components/
│   │       │   ├── profile-settings-tab.tsx
│   │       │   ├── settings-dialog.tsx
│   │       │   └── user-dropdown-menu.tsx
│   │       └── schemas/
│   │           └── user.schema.ts
│   │
│   ├── lib/
│   │   └── supabase/                   # Supabase client factory (3 environments)
│   │       ├── client.ts               # Browser client — reads cookies via document.cookie
│   │       ├── proxy.ts                # Edge client — refreshes expired sessions on every request
│   │       └── server.ts               # Server client — reads cookies via next/headers
│   │
│   └── utils/
│       ├── cn.ts                       # ClassName merging wrapper
│       ├── string-utils.ts             # Assorted string manipulations
│       └── user-utils.ts               # User avatar/initials extraction logic
│
│   └── tests/                          # Automated testing suites
│       └── unit/                       # Vitest unit tests (300+ tests achieving 100% action/UI coverage)
│           ├── constants/              # Route and environment variable tests
│           ├── features/               # Server Actions, Context Providers, and UI Component tests
│           └── utils/                  # Standalone utility function tests
```

---

## Key Architectural Rules

1. **`app/` is for routing only** — no UI components or business logic. Pages import from `features/`.
2. **`features/` is the brain** — each feature owns its actions, components, hooks, schemas, and extensions.
3. **`components/ui/` is Shadcn** — auto-generated primitives, lightly customized for the project.
4. **`lib/supabase/` has 3 clients** — one per Next.js runtime (browser, server, edge).
5. **`proxy.ts` is the gatekeeper** — runs on every request, refreshes sessions, blocks unauthorized access.
6. **`features/editor/extensions/`** — custom Tiptap extensions live here, keeping editor logic modular and testable.
