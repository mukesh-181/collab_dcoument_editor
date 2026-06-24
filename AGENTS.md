# AGENTS Context & Log

**Purpose**: This file provides immediate, comprehensive context to any AI model/agent working on the `collab_docx` project. You MUST read this entire document to understand the architectural paradigms and security flows before taking action or suggesting changes.

---

## 📚 Project Documentation Reference (READ FIRST)

Before making any changes, consult the relevant project documentation in `docx/project_docx/`. These files are the authoritative source of truth for how the project is built and why:

| Document | When to Read |
|---|---|
| **`docx/project_docx/Brief_Overview.md`** | **Start here.** A condensed summary covering all 16 architectural areas. Read this first to get full project context quickly. |
| **`docx/project_docx/Full_Project_Overview.md`** | **Deep dives.** The complete 2000+ line reference explaining *what* every component does, *how* it works, and *why* decisions were made. Read relevant sections when you need detailed understanding. |

For **specific topics**, read the corresponding extracted document:

| Document | Topic |
|---|---|
| **`docx/project_docx/Architecture.md`** | System architecture, 3-layer design, deployment strategy, three Supabase clients, feature-based folder structure |
| **`docx/project_docx/DATABASE.md`** | 5-table schema, SQL migrations, RLS policies, `document-assets` storage bucket |
| **`docx/project_docx/folder_structure.md`** | Complete file tree of `web/` and `hocuspocus-server/` with one-liner descriptions |
| **`docx/project_docx/auth.md`** | Three-client auth architecture, GitHub OAuth PKCE flow, Edge Proxy session refresh, sign-out pattern |
| **`docx/project_docx/yjs_hocuspocus.md`** | CRDT theory, Hocuspocus hooks, frontend provider integration, live cursors, offline resilience |

> **Rule for AI agents:** Always prefer reading these docs over re-analyzing the codebase from scratch. They contain critical context about solved bugs, design trade-offs, and non-obvious patterns that cannot be inferred from code alone.

---

## Current Architecture & Stack

- **Framework**: Next.js 15 (App Router)
- **Database & Authentication**: Supabase (Native Auth via `@supabase/ssr`). **NO Auth.js. NO Prisma.**
- **Routing & Security**: Edge Proxy (`src/proxy.ts` and `src/lib/supabase/proxy.ts`)
- **Styling & UI**: Tailwind CSS v4 + Shadcn/Radix (Nova preset, Radix component library)
- **Modularity**: Strict Feature-Based Folder Structure (`src/features/`)
- **Real-time Collaboration**: Active (Yjs CRDT + Standalone Hocuspocus WebSocket Server in `/hocuspocus-server`)
- **Rich Text Editor**: Tiptap v2 (`^2.27.2`) with ProseMirror — pinned to v2 for Collaboration Cursor compatibility
- **Environment Constants**: `src/lib/constants/env.ts` (web) and `src/config/env.ts` (hocuspocus-server)
- **Hocuspocus Runtime**: `tsx` (TypeScript Execute, replaces ts-node/nodemon) — warning-free under Node v24+
- **OAuth Provider**: GitHub OAuth exclusively (credentials live in Supabase Dashboard, NOT `.env.local`)
- **Image Storage**: Supabase Storage bucket `document-assets` (public bucket with RLS)

---

## Project Layout & Version Control (Monorepo)

The codebase is structured as a **Monorepo** containing two distinct, isolated applications:
- **`/web`**: The Next.js frontend application.
- **`/hocuspocus-server`**: The standalone Node.js WebSocket backend.

**Critical rules regarding this structure:**
1. **Isolated Dependencies**: Because these are two separate Node.js environments, they each maintain their own `package.json` and `node_modules` folders. DO NOT attempt to merge them into a single root `node_modules`. Running `npm install` must be done specifically inside `cd web/` or `cd hocuspocus-server/`.
2. **Root Git Initialization**: A single `.git` repository is initialized at the absolute root (`/collab_docx`). This is intentional. It ensures that frontend and backend changes are tracked and committed together in atomic commits (e.g., if a new real-time feature requires both a frontend UI change and a backend hook change, they are tracked in the exact same version history). Do NOT initialize separate git repositories inside `web/` or `hocuspocus-server/`.

---

## Critical Implementation Rules for Agents

### 1. Database & Auth Interaction (The 3 Clients)

Do not create generic Supabase clients. Next.js App Router runs in 3 environments, and you MUST use the correct client for the environment:

- **Client Components (`'use client'`)**: Use `src/lib/supabase/client.ts`. Uses `createBrowserClient` — reads/writes cookies via `document.cookie`.
- **Server Components & Actions (`'use server'`)**: Use `src/lib/supabase/server.ts`. Uses `createServerClient` with `next/headers` cookies — bridges Next.js request/response cookies to Supabase.
- **Edge Proxy**: Use `src/lib/supabase/proxy.ts`. Calls `getUser()` on every request to transparently refresh expired JWTs via Refresh Tokens and attach the new session cookie to the response. This guarantees users are never randomly logged out.
- *Never introduce Auth.js or Prisma. Stick to native Supabase RLS and Session management.*
- *Always use `supabase.auth.getUser()` (not `getSession()`) in Server Components — `getUser()` validates against the auth server, whereas `getSession()` trusts the cookie unverified (security warning).*

### 2. Routing & Proxy Protection

- The application uses an Edge Proxy (`src/proxy.ts` → `src/lib/supabase/proxy.ts`) to intercept ALL routes.
- Public routes (e.g., `/`, `/login`, `/auth/callback`) are explicitly whitelisted.
- Unauthorized access to protected routes forces a redirect to `/login?next=[intended_path]`, preserving full query parameters (critical for invite token flows: `/login?next=/dashboard/invite?token=...`).
- Always ensure new public routes are added to the whitelist in `src/lib/supabase/proxy.ts`.

### 3. Code Modularity & De-duplication

- **Avoid Monolithic Files**: Never write entire logic blocks in a single file. Decompose large components into single-responsibility sub-components. Massive files cause Git conflicts and slow Next.js Fast Refresh.
- **Single Responsibility (SRP)**: Each server action MUST live in its own dedicated `.action.ts` file (e.g., `login.action.ts`, `create-document.action.ts`). Never aggregate multiple actions into one `*.actions.ts` file.
- **Reusability**: Extract duplicated UI elements into shared components. Do not write complex modal/dialog code inline within a dropdown menu. Keep state localized to the components that need it to prevent unnecessary re-renders of parent trees.
- **Tree-shaking**: Granular `.action.ts` files allow Next.js bundler to only include necessary code per route, preventing cross-contamination of dependencies.

### 4. Feature-Based Folder Structure

- **DO NOT** clutter the Next.js `app/` router directory with UI components or server actions. The `app/` directory is strictly for URL routing (`page.tsx`, `layout.tsx`).
- Place all logic inside `src/features/[feature_name]/`. Examples:
  - Auth: `src/features/auth/components/`, `src/features/auth/actions/`, `src/features/auth/schemas/`
  - Dashboard: `src/features/dashboard/components/`
  - Editor: `src/features/editor/components/`, `src/features/editor/extensions/`, `src/features/editor/actions/`
- The toolbar is decomposed into 8+ sub-components in `src/features/editor/components/toolbar/` (e.g., `history-controls.tsx`, `heading-controls.tsx`, `color-control.tsx`, `font-family-control.tsx`, `font-size-control.tsx`, `list-controls.tsx`, `link-control.tsx`, `image-control.tsx`).

### 5. Phased Approach & Documentation

- Implement features step-by-step. Do not attempt massive monolithic PRs.
- For every major feature, create/update an explanatory markdown file inside `docx/project/`.
- Update `docx/project/step_by_step_log.md` with detailed explanations of *what* you did, *how* it works, and *why* you chose that approach.

### 6. Tiptap-Specific Rules

- Always use Tiptap **v2** (`^2.27.2`). Do NOT upgrade to v3 — it breaks the `@tiptap/extension-collaboration-cursor` architecture.
- All toolbar buttons must have `onMouseDown={(e) => e.preventDefault()}` to prevent the editor from losing focus (which flushes ProseMirror `storedMarks` and resets formatting).
- Radix UI `DropdownMenu` and `Select` components steal DOM focus from the Tiptap `contenteditable`. Use `modal={false}` and override `onCloseAutoFocus` / `onOpenAutoFocus` with `e.preventDefault()` wherever they're used inside the toolbar. Replace `DropdownMenuItem` with passive `<div>` elements inside `DropdownMenuContent` for focus-critical toolbar controls.
- `generateHTML()` requires the DOM — always guard with `useSyncExternalStore` (not `useEffect`) for SSR safety.
- The Y.Doc instance for the editor must be stored in `useState` to survive React Strict Mode Fast Refreshes without destructive remounts.

### 7. Real-Time / Yjs Rules

- The Hocuspocus server is a **standalone Node.js process** in `/hocuspocus-server`, decoupled from Next.js. Vercel serverless functions do not support persistent WebSockets.
- Three critical Hocuspocus hooks are implemented: `onAuthenticate` (JWT validation via `supabase.auth.getUser(token)`), `onLoadDocument` (fetches binary Yjs CRDT state from `document_content_state` via `Y.applyUpdate()`), `onStoreDocument` (upserts base64-encoded Yjs state back to Supabase with `onConflict: 'document_id'`).
- Yjs CRDTs guarantee conflict-free merges. Users can safely type offline; changes sync automatically on reconnection.
- The `DocumentContext` provider wraps document pages to share `syncState`, `activeUsers`, and document metadata between `DocumentHeader` and `Editor` without prop drilling.

### 8. Server Action Patterns

- Actions return JSON payloads `{ success, error }` — never throw redirects inside actions called by client components (causes `NEXT_REDIRECT` errors in try/catch).
- Use `zod` + `safeParse` for server-side validation.
- Use `sonner` toast notifications for user feedback.
- Form submission must use `onSubmit` with `e.preventDefault()` (not `action={...}`) when `isPending` loading state needs to render instantly — React 18 batches `useTransition` updates when using the `action` attribute directly.
- **Zero-jitter spinner pattern**: Keep button text in DOM but `opacity-0` when loading; overlay spinner with `absolute inset-0 flex items-center justify-center`. Prevents width/height jitter.

### 9. React Patterns to Follow

- Use `useSyncExternalStore` (not `useEffect + useState`) for SSR/client differentiation to avoid hydration mismatches.
- Use `useRef` to escape stale closures in WebSocket/Supabase Realtime listener callbacks — the listener captures state at mount; a ref allows you to update the captured function without re-subscribing.
- Use `useMemo` for filtered/sorted arrays to prevent recalculation on every render.
- Use `requestAnimationFrame(() => setState(true))` + `transition-opacity duration-500` for smooth fade-in animations on content that renders after mount.

### 10. Automated Testing & Documentation Sync

- **Mandatory Testing**: Always create a corresponding unit test file when implementing a new feature, server action, or UI component. Maintain the project's 100% unit test coverage standard. (Note: E2E testing is deferred for later; focus exclusively on unit tests via Vitest for now).
- **Verification**: After making code changes, you MUST run the test suite (`npm run test` in `web/`), run ESLint, and run TypeScript checking to ensure all previous tests pass, linting is clean, and types are valid before completing your task. You must also create and verify any newly created tests for your feature.
- **Documentation Sync**: If you create, move, or **delete** any files, you MUST immediately update `docx/project_docx/Folder_Structure.md` and `docx/project_docx/step_by_step_log.md` to reflect those architectural changes accurately. Detecting and logging file deletions is critical to prevent future agents from hallucinating missing files.

---

## Database Schema (5-Table MVP)

| Table | Key Columns | Notes |
|---|---|---|
| `users` | `id`, `name`, `email`, `avatar_url` | Synced from `auth.users` via PostgreSQL trigger |
| `documents` | `id`, `title`, `owner_id`, `created_at`, `updated_at` | `title` may be prefixed with an emoji icon (no separate `icon` column) |
| `document_members` | `document_id`, `user_id`, `role` | Roles: `owner`, `editor`, `viewer` |
| `document_content_state` | `document_id`, `ydoc_state` (base64), `preview_json` | One row per document; upserted via Hocuspocus `onStoreDocument` hook |
| `invites` | `token`, `document_id`, `email` (nullable), `role`, `status`, `expires_at` | Status: `pending`, `accepted`, `rejected`. `email=null` = universal multi-use link. Only email invites flip to `accepted`; universal links stay `pending`. |

**RLS**: Strictly enforced. All queries are scoped to the authenticated user's session.

**Storage**: `document-assets` Supabase bucket (public). RLS policies: SELECT public, INSERT authenticated. Image paths: `{documentId}/{uuid}.{ext}`.

---

## Application Route Map

```
/                          → Landing Page (Server Component, auth-aware CTA)
/login                     → GitHub OAuth only
/auth/callback             → OAuth PKCE code exchange (Route Handler)
/dashboard                 → Route group: app/(main)/dashboard/(home)/
  /dashboard/[docId]       → Document editor (full-bleed, no shared padding)
  /dashboard/invite        → Intermediate "Accept/Cancel" invite onboarding screen
/inbox                     → Invite history & management
```

**Route Groups**:
- `app/(main)/dashboard/(home)/` — Isolates dashboard list `loading.tsx` so it does NOT flash when navigating into `/dashboard/[docId]`.

---

## Detailed Progress & Context Log

### Phase 1 — Project Setup & Authentication (2026-06-04)

- Dropped Auth.js in favor of Supabase SSR (`@supabase/supabase-js` + `@supabase/ssr`). Supabase is the absolute source of truth.
- Initialized Shadcn via `npx shadcn@latest add @supabase/supabase-client-nextjs` (Radix library, Nova preset). This generated the three Supabase clients under `src/lib/supabase/`.
- Note: The Shadcn Supabase integration uses `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (not `ANON_KEY`) — they are functionally identical strings from the dashboard.
- OAuth implemented as GitHub-only. Credentials (`GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`) are configured in **Supabase Dashboard → Authentication → Providers → GitHub**, not in `.env.local`.
- Auth callback at `app/auth/callback/route.ts` handles OAuth 2.0 PKCE code exchange via `supabase.auth.exchangeCodeForSession(code)`.

### Phase 2 — Feature-Based Refactoring & UI (2026-06-04)

- Moved all auth logic out of `app/` into `src/features/auth/`.
- Built global Navbar (`src/components/layout/navbar.tsx`) with glassmorphic design (`backdrop-blur-md`).
- Premium Landing Page with gradient text, pulse animations, and CSS mockup.
- Validation: `zod` schemas in `src/features/auth/schemas/auth.schema.ts` with `loginSchema` and `registerSchema` (8+ char passwords). React Hook Form + `@hookform/resolvers` on the client. `zod.safeParse` on the server.
- Auth forms use `AuthTabs` (Login / Register), toast notifications via `sonner`.

### Phase 3 — Edge Proxy & Dashboard Shell (2026-06-04)

- Edge Proxy (`src/proxy.ts` → `src/lib/supabase/proxy.ts`) intercepts all routes, refreshes sessions, and redirects unauthorized users to `/login?next=[path]`.
- Dashboard layout (`src/features/dashboard/components/dashboard-layout.tsx`) uses a sticky Sidebar + Top Navbar. The Sidebar and Navbar never re-render during document navigation because they live in `app/dashboard/layout.tsx`.
- Sign Out runs a server action (`logout.action.ts`) that calls `supabase.auth.signOut()` and destroys session cookies, then shows a `SignOutButton` confirmation dialog.
- Dashboard layout uses `fixed inset-0 h-[100dvh] overflow-hidden` — the app behaves like a native app surface, not a scrollable webpage. Only the document row list scrolls internally.

### Phase 4 — Database Schema (2026-06-05)

- Finalized 5-table MVP schema (see above).
- `users` table is auto-populated from Supabase `auth.users` via a PostgreSQL Trigger.
- All tables enforce RLS. Role checks (`owner` | `editor` | `viewer`) are done on the server before any mutation.

### Phase 5 — Dashboard UI Polish & Server Actions (2026-06-05)

- Dashboard document list with client-side search (`useMemo` filtering) and URL-driven server-side pagination (`?page=N`, `?search=...`).
- 6 documents per page; Supabase `.range()` for efficient slicing.
- Next.js `<Link prefetch={true}>` on pagination buttons — next page data is fetched in background before click.
- Overlay search spinner: debounced 500ms input, dimmed cards (`opacity-40`) + centered spinner while fetching — no layout shift.
- `DocumentList` and `DocumentListSkeleton` are full-height flex columns with `overflow-y-auto overscroll-contain`. Dashboard chrome stays fixed.
- Document cards are landscape dual-section (`h-[280px]`): top half shows scaled Tiptap HTML preview, bottom half shows metadata + action menu.
- `DocumentPreview` uses `generateHTML(json, extensions)` — requires full extension registration (including `Table`, `TaskList`, `ResizableImage`, etc.) or previews silently fail. Guards SSR with `useSyncExternalStore`.
- Stacked avatars on cards: max 3 shown, excess shown as `+N` badge. Dynamic `zIndex` for stacking. Fallback: `(name || email || "?").charAt(0)`.
- Document creation dialog accepts title + emoji icon prefix; icon is prepended to `title` string (no separate `icon` column in DB).

### Phase 6 — Document Editor (Tiptap) (2026-06-08)

- `src/features/editor/` feature domain. `<Editor />` is a Client Component.
- Tiptap v2 with `@tiptap/starter-kit` + `@tailwindcss/typography` (`prose prose-zinc max-w-none`).
- **`max-w-none` is critical** — Tailwind Typography's 65ch limit conflicts with the pagination extension's 794px A4 width, causing paragraphs to squeeze into a single character column without it.
- Custom `FontSize` extension (`src/features/editor/extensions/font-size.ts`) for exact pixel sizing.
- Toolbar reactivity via Tiptap `transaction` event → `forceUpdate` → React re-render. Font family and size `<Select>` components use `key` prop bound to current editor attribute to force remount on cursor move.
- Persistent color: local `useState` stores last-picked color. Empty-document color recovery uses `update` event + `queueMicrotask` to re-apply color without infinite recursion.
- `onMouseDown={(e) => e.preventDefault()}` on ALL toolbar buttons to prevent `storedMarks` flush.
- Google Docs toolbar aesthetic: `bg-[#f0f4f9]`, blue active states (`data-[state=on]:bg-blue-100`), `h-4 bg-zinc-300` separators.
- Undo/Redo use plain `<button onClick>` (not `<Toggle>`) — they are one-shot actions, not toggle states.

### Phase 6.5 — Advanced Editor Features (2026-06-08–09)

- **Multi-page pagination**: `tiptap-pagination-plus` community package. Does NOT alter Yjs/JSON data — operates on ProseMirror Decorations only. A4 dimensions: `pageWidth: 794`, `pageHeight: 1123`, `marginTop/Bottom: 72`, `marginLeft/Right: 64`, `pageGap: 40`. Footer: `footerRight: "Page {page}"`, headers: empty strings.
- **Tables**: `Table` extension with `resizable: true`. Column widths stored in cell schema attributes → synced via Yjs. CSS fix: `.prose.resize-cursor, .resize-cursor` (NOT `.prose .resize-cursor`) for column resize cursor.
- **Images**: `ResizableImage` custom extension with drag-to-resize handles and `data-drag-handle` for ProseMirror native drag-and-drop. Uploaded to Supabase Storage `document-assets` bucket via `upload-image.action.ts` server action (auth check + MIME/size validation + `crypto.randomUUID()` filename + public URL retrieval).
- **Slash commands**: `/` command listener for instant heading, list, table, image insertion.
- **Link management**: `CustomLink` extension, `onClickCapture` prevents accidental navigation during editing. Ghost mark resolver via `onUpdate` observer. URL popover uses `onOpenAutoFocus={(e) => e.preventDefault()}` and `onMouseDown={(e) => e.preventDefault()}` to preserve text selection.
- **Bubble menu**: Floating format menu for highlighted text (Bold, Italic, Underline, Highlight).
- **Text alignment + list preservation**: `TextAlign` extension configured for `["heading", "paragraph", "listItem", "taskItem"]`. `toggleListAndPreserveAlignment()` helper captures active alignment, toggles node, and re-applies alignment atomically.
- **Checklist CSS**: Uses absolute positioning (NOT Flexbox) for `taskList` items to prevent ProseMirror `TextSelection endpoint not pointing into a node with inline content` crash. Checkbox `pointer-events: none` on label, `pointer-events: auto` on input. Text block has `padding-left: 1.5rem`.
- **List alignment**: CSS `:has()` selector in `globals.css` — `li:has(> p[style*="text-align: center"])` forces `width: fit-content; margin-inline: auto`. Nested list resets prevent inheritance.
- **Inline code**: `#f4f4f5` background, `#dc2626` (light) / `#f87171` (dark) red text.
- **Completed tasks**: `li[data-checked="true"]` → strikethrough + `color: #71717a`.
- **Fonts**: Advanced font family dropdown + comprehensive text highlighter with custom color picker + blockquote.
- **Bubble menu + `useTransition` throttling**: 250ms delay on formatting toolbar and bubble menu state updates to keep main thread fluid during high-frequency typing.

### Phase 7 — Real-Time Collaboration via Yjs & Hocuspocus (2026-06-09)

- Replaced REST auto-save with WebSocket CRDT architecture.
- `/hocuspocus-server` is a standalone Node.js process (`tsx` runtime, ES Modules).
- Three hooks: `onAuthenticate`, `onLoadDocument` (`Y.applyUpdate()`), `onStoreDocument` (upsert with `onConflict: 'document_id'`).
- Frontend: `@hocuspocus/provider` bound to `ws://` URL with Supabase `access_token` for auth.
- `access_token` extracted from `supabase.auth.getSession()` (used only to get the raw token string, NOT for user identity — `getUser()` is called separately for security).
- Collaboration cursors with custom CSS in `globals.css`: `collaboration-cursor__caret`, `collaboration-cursor__label`, vibrant Tailwind color palette, drop shadows, entry animations.
- `DocumentContext` holds `syncState` enum (`saving` | `saved` | `offline`) and `activeUsers` array. Sync indicators (pulsing cloud, checkmark cloud, offline warning) live in `DocumentHeader`.
- `ActiveUsersCluster` component reads `onAwarenessUpdate` events → extracts connected clients (name, avatar, cursor color) → renders overlapping `Avatar` bubbles with "Online Now" tooltips.
- `OfflineBanner` renders when `syncState === "offline"`. Users can continue typing — Yjs merges offline changes on reconnection.

### Phase 8 — Invites, Sharing & Access Control (2026-06-09)

- **Roles**: `owner`, `editor`, `viewer` enforced via `document_members` table.
  - `viewer`: Tiptap `editable={false}`, toolbar hidden, rename pencil hidden, invite button hidden, "View Only" badge shown.
  - `editor`/`owner`: Full editing capabilities.
- **Invite types**:
  - *Email invites* (`email` column non-null): Single-use, flipped to `accepted` upon use, 24-hour TTL.
  - *Universal links* (`email` column null): Multi-use, stay `pending` forever but have 24-hour TTL from creation. Useful for sharing in Slack/chat.
- **Invite flow**: `createInviteLink(documentId, role)` generates `crypto.randomUUID()` token → `acceptInvite(token)` validates token, checks expiry, adds user to `document_members`.
- **Intermediate invite screen**: `/dashboard/invite?token=...` shows "You've been invited!" card with document title, owner name, and role before accepting. Cancel returns to dashboard without consuming token.
- **Edge Proxy**: Preserves `?token=...` in `next` param during unauthenticated redirects: `/login?next=/dashboard/invite?token=abc`.
- **Share dialog**: Two tabs — "Create Link" (universal link generator) and "Send Email" (multi-email token input).
- **UserSearchInput**: Slack/Gmail-style token/pill input. Debounced DB lookup for registered users (avatar + name). `useRef` escapes stale closure in async pill creation. Dropdown shows "Member" and "Invited" badges; already-added users are `disabled` + `opacity-50`.
- **Smart validation**: `isSubmitDisabled` blocks form submission if all emails are already members or invited. Server action silently drops self-invites and duplicates; only errors if ALL recipients fail.
- **Member popover**: Clicking the avatar cluster in `DocumentHeader` opens a scrollable list of all members with name, email, role.
- **Inbox** (`/inbox`): Filterable list of all received invites. Filter options: All, Pending, Accepted, Rejected, Expired. Status-based badges replace action buttons after resolution. Delete (trash icon) physically removes the row. `useMemo` with client-side expiry math for "Expired" filter — no page refresh needed.

### Phase 9 — UX Polish & Codebase Modularization (2026-06-10)

- **Architectural Refactoring**: Decomposed `document-header.tsx` (318 lines) → `document-rename-dialog.tsx`, `document-members-popover.tsx`, `document-sync-status.tsx`. Decomposed `share-dialog.tsx` → `create-link-tab.tsx`, `send-email-tab.tsx`. Split `toolbar.tsx` (600+ lines) → 8 sub-components.
- **Persistent hover states**: CSS `:has([[data-state=open]])` on document list rows so they retain highlight background when their child dropdown is open.
- **Sign Out confirmation**: `<SignOutButton />` in `src/features/auth/components/sign-out-button.tsx` wraps a Shadcn `Dialog`. Replaces all inline `<form action={logout}>` instances.
- **Route Group isolation**: `(home)` route group prevents dashboard list `loading.tsx` from flashing during document navigation.
- **Dashboard layout**: `fixed inset-0 h-[100dvh]` app shell. Only document rows scroll internally. Sidebar removed in favor of clean top navigation bar.
- **Mobile**: Editor padding scales `px-4 sm:px-16`. Toolbar is `whitespace-nowrap overflow-x-auto scrollbar-hide`. `MobileSidebar` (Shadcn Sheet wrapping `SidebarContent`) injected into `DashboardHeader` and `DocumentHeader`.
- **Page Thumbnails sidebar**: `<PageThumbnails>` component left of editor. `MutationObserver` on `.ProseMirror` DOM node + 500ms debounce → extracts raw HTML of every `.page` node → scales via `scale(0.282)`. Navigation via real-time `document.querySelectorAll('.tiptap .page')[pageNumber - 1]` (not stale `id` attributes, because Tiptap recycles DOM nodes). Scrolls `<main>` container with exact pixel math (`elRect.top - containerRect.top + container.scrollTop - offset`). Sidebar open/close: `transition-[width] duration-300` (never unmounts, prevents losing CSS transitions).

### Phase 10 — Performance, Realtime Hardening & Lint Cleanup (2026-06-15–18)

- **Realtime race condition fix**: `DocumentRealtimeListener` and `DocumentHeader` Supabase Realtime listeners were racing. `document_members` delete events are intercepted to show "Access Revoked" modal instead of crashing into a "No Permission" page.
- **Inbox stale closure fix**: Supabase WebSocket listener uses `useRef` for the `onNewEvent` callback. A `useEffect` watcher keeps the ref's `.current` fresh whenever the user changes filters. The WebSocket executes `onNewEventRef.current(true)` — ensuring it always uses the current filter context, not the stale one captured at mount.
- **Silent background inbox fetch**: `fetchFiltered(silent = true)` skips the `setIsFilterLoading(true)` skeleton when triggered by background real-time events (not user interaction). Prevents jarring skeleton flashes.
- **Hydration fix in `document-card.tsx`**: `useSyncExternalStore` pattern (not `useEffect`) to differentiate SSR (returns `false`) from client (returns `true`), preventing React hydration mismatch between server-generated SVG placeholder and client-generated Tiptap HTML preview.
- **Smooth fade-in pattern**: `requestAnimationFrame(() => setShowPreview(true))` + `transition-opacity duration-500 ease-in-out`. Applied to `DocumentPreview`, `PageThumbnails`, and `Editor` post-Yjs-sync. Placeholder and content both always present in DOM (absolute, overlapping); content starts `opacity-0`.
- **ESLint cleanup**: 70 ESLint errors resolved across 22 files. Key fixes:
  - `no-explicit-any` → typed interfaces (`DocData`, `DocMember`, `ActiveUser`)
  - `no-unused-vars` → removed all unused imports and variables
  - `react/no-unescaped-entities` → `&apos;`
  - `react-hooks/static-components` → `NavItem` extracted outside render functions, `pathname` passed as prop
  - `react-hooks/set-state-in-effect` → `document-rename-dialog.tsx` uses conditional render instead of `useEffect`; Yjs init in `editor.tsx` uses `eslint-disable`
  - `react-hooks/refs` → ref access moved into `useEffect` in `document-list.tsx`
- **TypeScript fixes**: `inbox-list.tsx` maps raw Supabase array responses (nested arrays) into flat `InboxInvite` shape. `hocuspocus-server`: `tsc --noEmit` passes with zero errors.

---

## File/Folder Reference Map

```
src/
├── app/                          # URL routing ONLY (page.tsx, layout.tsx)
│   ├── (main)/dashboard/
│   │   ├── (home)/               # Route group — isolates loading.tsx
│   │   │   ├── page.tsx
│   │   │   └── loading.tsx
│   │   ├── [docId]/page.tsx
│   │   └── invite/page.tsx
│   ├── auth/callback/route.ts
│   ├── inbox/page.tsx
│   └── login/page.tsx
├── features/
│   ├── auth/
│   │   ├── actions/              # login.action.ts, logout.action.ts, etc.
│   │   ├── components/           # auth-tabs.tsx, sign-out-button.tsx, oauth-buttons.tsx
│   │   └── schemas/auth.schema.ts
│   ├── dashboard/
│   │   └── components/           # dashboard-layout.tsx, document-list.tsx, document-card.tsx, etc.
│   └── editor/
│       ├── actions/              # upload-image.action.ts
│       ├── components/
│       │   ├── editor.tsx
│       │   ├── toolbar/          # 8+ sub-components
│       │   ├── page-thumbnails.tsx
│       │   ├── document-header.tsx (decomposed)
│       │   └── ...
│       └── extensions/           # font-size.ts, slash-command.tsx, resizable-image.tsx, etc.
├── lib/
│   ├── supabase/
│   │   ├── client.ts             # Browser Client Component client
│   │   ├── server.ts             # Server Component/Action client
│   │   └── proxy.ts              # Edge Proxy session refresh
│   └── constants/env.ts          # Typed ENV constants
├── components/
│   ├── layout/navbar.tsx
│   └── ui/                       # Shared Shadcn + custom components
└── proxy.ts                      # Next.js Edge Proxy entry point

hocuspocus-server/
├── src/
│   ├── index.ts                  # Hocuspocus server bootstrap
│   └── config/env.ts             # Hocuspocus ENV constants
└── package.json                  # tsx runtime, ES Modules
```

---

## Known Constraints & Gotchas

1. **Tiptap v2 only** — v3 breaks Collaboration Cursor extension. Do not upgrade.
2. **Supabase upsert** requires `{ onConflict: 'document_id' }` in `onStoreDocument` — without it, the second save throws a Unique Constraint violation.
3. **`max-w-none` on editor** — required to prevent Tailwind Typography's `65ch` limit from squishing text alongside the A4-width pagination plugin's floated DOM elements.
4. **Toolbar `onMouseDown` `preventDefault`** — must be on every toolbar button. Without it, ProseMirror flushes `storedMarks` on click, resetting font family/size/color.
5. **`getUser()` not `getSession()`** — Server Components must use `getUser()` for Supabase security. `getSession()` can only be used to extract the raw `access_token` string.
6. **Checklist absolute-position CSS** — Flexbox on `taskList` items causes ProseMirror selection mapping crash. Must use absolute positioning + padding approach.
7. **Tiptap DOM recycling** — Thumbnail navigation must use `querySelectorAll('.tiptap .page')[n]` at click time, not cached `id` attributes. Tiptap shifts DOM nodes internally.
8. **React `action` attribute batching** — `isPending` from `useTransition` does not update instantly when using Next.js `<form action={...}>`. Use `onSubmit` + `e.preventDefault()` for instant loading state feedback.
9. **Radix focus stealing** — All toolbar dropdowns/selects must use `modal={false}` + `preventDefault` on open/close focus events to prevent blurring the Tiptap editor and losing Yjs remote selections.
10. **ESLint `react-hooks/static-components`** — Never define components (functions that return JSX) inside other components' render scope. Extract them to module level and pass data as props.