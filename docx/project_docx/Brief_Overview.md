# CollabDoc — Brief Project Overview

A condensed reference covering the entire `collab_docx` project. For deep dives into any section, see `Full_Project_Overview.md`.

---

## 1. What Is CollabDoc?

A **real-time collaborative document editor** — like Google Docs — built from scratch on a modern full-stack TypeScript architecture. Multiple users can open the same document, see each other's cursors live, and type concurrently without corruption, even on the same line at the same millisecond.

---

## 2. Technology Stack

| Technology | Role | Why |
|---|---|---|
| **Next.js 15 (App Router)** | Core framework | Server Components eliminate client-side data-fetching flicker; Server Actions replace REST APIs; Edge Proxy intercepts requests for auth |
| **Supabase** | Database + Auth + Storage | PostgreSQL with RLS, Native Auth (no Auth.js/Prisma), `document-assets` storage bucket for persistent image CDN URLs |
| **Tiptap v2** (`^2.27.2`) | Rich text editor | Headless, extensible, first-class Yjs collaboration support. Pinned to v2 — v3 breaks `@tiptap/extension-collaboration-cursor` |
| **Yjs + Hocuspocus** | Real-time CRDT engine | Conflict-free merges via CRDT math; Hocuspocus is a standalone Node.js WebSocket relay server |
| **Tailwind v4 + Shadcn UI** | Styling & components | Nova preset, Radix primitives, semantic CSS variables for dark mode |
| **Zod + React Hook Form** | Validation | Client-side + server-side double validation on all forms |
| **SendGrid** | Transactional email | Server-side invite dispatch; API key never touches the browser |
| **tsx** | Hocuspocus runtime | Replaces deprecated `ts-node/nodemon`; zero warnings on Node v24+, built-in `--watch` |

**Three Supabase Clients:** Browser (`client.ts` → `document.cookie`), Server (`server.ts` → `next/headers`), Edge Proxy (`proxy.ts` → refreshes expired JWTs on every request). Always use `getUser()` over `getSession()` for identity checks — `getSession()` trusts the cookie without server validation.

---

## 3. The Dashboard

A full-viewport, app-shell interface (`fixed inset-0 h-[100dvh] overflow-hidden`) — only the document grid scrolls internally.

- **Document Cards** (`h-[280px]`): Top half renders a real scaled-down HTML preview (via `generateHTML` + `scale-[0.282]` CSS transform), bottom half shows title, role badge, timestamp, and action menu. CSS `:has([[data-state=open]])` keeps hover highlight active when dropdown is open.
- **Preview Engine**: `generateHTML(json, extensions)` converts stored Tiptap JSON to HTML. Requires registering the exact same extensions the editor uses. SSR-safe via `useSyncExternalStore` (not `useEffect`). Smooth 500ms cross-dissolve from SVG placeholder using `requestAnimationFrame`.
- **Stacked Avatars**: Max 3 shown with `+N` overflow badge. Dynamic `zIndex` for stacking. Fallback chain: `name → email → "?"`.
- **Action Menu**: Decomposed into 3 files (`document-action-menu.tsx`, `document-rename-dialog.tsx`, `document-delete-dialog.tsx`) to localize state and prevent full-tree re-renders on keystrokes.
- **Create Document**: Emoji icon is prepended to the `title` string (no separate DB column). Server action returns the new ID as JSON; client navigates with `router.push()` (avoids `NEXT_REDIRECT` error).
- **Server-Side Pagination**: URL-driven (`?page=N&search=...`), 6 docs per page via Supabase `.range()`. `<Link prefetch={true}>` pre-fetches next page data.
- **Debounced Search**: 500ms delay, dim overlay (`opacity-40`) + spinner while loading — no layout shift.
- **Skeleton Loading**: `loading.tsx` in a `(home)` Route Group isolates the skeleton so it doesn't flash during document navigation. Pixel-accurate card dimensions prevent CLS. Content fades in via `opacity-0 animate-[fade-in_0.2s]`.

---

## 4. The Inbox

Manages all received invitations at `/inbox` with real-time updates and persistent history.

- **Server + Client Split**: `inbox-list.tsx` (Server) fetches enriched invite data with JOINs; `inbox-client-list.tsx` (Client) owns all UI state.
- **Persistent History**: Accept/Reject updates `status` column — row is NOT deleted. Badges replace buttons. Trash icon for explicit cleanup.
- **Client-Side Filtering**: `useMemo` with 5 filters (All, Pending, Accepted, Rejected, Expired). Expired is computed live via `new Date(expires_at) < new Date()` — no server round-trip.
- **Real-Time via Supabase Realtime**: `postgres_changes` INSERT listener on `invites` table. Uses localized `onNewEvent()` callback instead of `router.refresh()` to avoid full-page flash.
- **Silent Background Fetch**: `fetchFiltered(silent=true)` skips skeleton for WebSocket-triggered updates.
- **Stale Closure Fix**: WebSocket listener captures initial state permanently. Fixed with `useRef` — a separate `useEffect` keeps `onNewEventRef.current` fresh on every render. WebSocket always calls `.current`.
- **Zero-Jitter Spinners**: Button text stays in DOM at `opacity-0`; spinner overlays with `absolute inset-0`. Applied globally to all 12+ action buttons.

---

## 5. The Document Page

The core editing experience at `/dashboard/[docId]` — full-bleed, no inherited padding.

- **Server-Side Security**: `page.tsx` is a Server Component. Calls `getDocumentById()` which JOINs `document_members`. Returns `null` → `redirect('/dashboard')` before any HTML renders. Role is extracted and passed as prop to all children.
- **`DocumentContext`**: React Context sharing `syncState` (saving/saved/offline) and `activeUsers` between the Header and Editor without prop drilling.
- **Document Header**: Decomposed into `document-rename-dialog.tsx`, `document-members-popover.tsx`, `document-sync-status.tsx`, and `ActiveUsersCluster`. Each owns its own state.
- **Strict Role Enforcement**:

  | Element | Owner/Editor | Viewer |
  |---|---|---|
  | Rename pencil | ✅ | ❌ |
  | Invite button | ✅ | ❌ |
  | Toolbar | ✅ | ❌ |
  | Tiptap `editable` | `true` | `false` (engine-level lock) |

- **"Access Revoked" Modal**: Supabase Realtime detects `document_members` DELETE. Instead of `router.refresh()` (which crashed), sets `isRevoked=true` → renders a persistent full-screen modal.
- **Full-Bleed Layout**: Dashboard `layout.tsx` is a pure structural shell. Each route owns its own chrome. Prevents double headers and padded editors.
- **Intermediate Invite Screen** (`/dashboard/invite`): Shows document title, owner, and role before acceptance. Token is read-only until user clicks Accept. Cancel preserves the token.

---

## 6. The Toolbar

Google Docs aesthetic (`bg-[#f0f4f9]`, blue active states). Decomposed from 600+ line monolith into 8+ sub-components under `toolbar/`.

| Sub-component | Responsibility |
|---|---|
| `history-controls.tsx` | Undo/Redo (plain `<button>`, not `<Toggle>`) |
| `heading-controls.tsx` | H1, H2, H3 toggles |
| `text-format-controls.tsx` | Bold, Italic, Strikethrough |
| `font-family-control.tsx` | Font dropdown (solves Radix focus-stealing with `modal={false}` + `onOpenAutoFocus` prevention + passive `<div>` items) |
| `font-size-control.tsx` | 8px–72px with smart contextual default mapping heading levels to pixel sizes |
| `color-control.tsx` | Reactive color circle + empty-document color recovery via `queueMicrotask` (prevents infinite recursion) |
| `list-controls.tsx` | Bullet/Ordered/Task lists with `toggleListAndPreserveAlignment()` atomic chain. Checklist uses absolute positioning (not Flexbox) to avoid ProseMirror `TextSelection` crash |
| `link-control.tsx` | Ghost mark resolution, selection preservation after link creation |
| `image-control.tsx` | Server action upload to Supabase Storage → permanent public CDN URL |

**Critical Rules:**
- Every toolbar element must have `onMouseDown={(e) => e.preventDefault()}` to preserve ProseMirror's `storedMarks`.
- Toolbar reactivity via `transaction` event → `forceUpdate`. Font dropdowns use `key` prop for forced remount on cursor move.
- `useTransition` + 250ms throttling prevents main-thread stalls during fast typing.

---

## 7. Real-Time Collaboration

### Architecture
```
Browsers ─── WebSocket ──→ Hocuspocus Server (standalone Node.js) ──→ Supabase (Postgres)
                                    ↑
                              Next.js App (serves HTML, handles API actions)
```
Hocuspocus runs independently in `/hocuspocus-server` because **serverless platforms cannot maintain persistent WebSocket connections**.

### Three Hocuspocus Hooks
1. **`onAuthenticate`**: Validates Supabase JWT via `getUser(token)`. Rejects expired/forged/missing tokens.
2. **`onLoadDocument`**: Fetches base64 Yjs binary from `document_content_state`, decodes it, applies via `Y.applyUpdate()`.
3. **`onStoreDocument`**: Encodes Yjs state → base64, upserts to DB with `onConflict: 'document_id'`. Stores binary CRDT (not HTML/JSON) to preserve full operation history for offline merge.

### Frontend Integration
- `Y.Doc` stored in `useState(() => new Y.Doc())` to survive React Strict Mode double-render.
- `accessToken` extracted from `getSession()` (only for the raw JWT string; identity comes from `getUser()`).
- **Live Cursors**: `CollaborationCursor` extension via Yjs Awareness protocol. Deterministic color assignment per user. Custom CSS animations in `globals.css`.
- **Presence**: `onAwarenessUpdate` → `setActiveUsers()` → `ActiveUsersCluster` in header.
- **Sync States**: saving (pulsing cloud) → saved (checkmark cloud) → offline (amber warning).
- **Offline Resilience**: Users continue typing. Yjs stores operations locally. On reconnect, CRDT merge resolves all changes automatically. `OfflineBanner` is informational, never blocks the editor.

---

## 8. Pagination

Uses `tiptap-pagination-plus` — operates entirely via **ProseMirror Decorations** (zero effect on document data). The JSON/Yjs state is identical whether the document has 1 or 100 pages.

- **A4 Dimensions**: `pageWidth: 794`, `pageHeight: 1123`, margins `72px` top/bottom, `64px` left/right, `pageGap: 40`.
- **Footer**: `Page {page}` via CSS counters. Headers empty for distraction-free editing.
- **Dark Mode**: `pageBreakBackground` uses a CSS variable (`--rm-page-break-bg`).
- **The `max-w-none` Fix**: Tailwind Typography's `.prose` class enforces `max-width: 65ch`. This conflicts with the 794px page floats, squishing text to single-character columns. `max-w-none` overrides this.
- **Data Purity**: `getJSON()`, `getHTML()`, `Y.encodeStateAsUpdate()`, and `generateHTML()` all produce clean content with no pagination artefacts.

---

## 9. Skeleton Loading

- **`loading.tsx`**: Auto-wrapped in React `<Suspense>` by Next.js. Streams immediately while server fetches data (streaming SSR).
- **`(home)` Route Group**: Isolates the skeleton to the dashboard list page only — prevents skeleton flash during document navigation.
- **`DocumentListSkeleton`**: Pixel-accurate replica (same grid, same `h-[280px]` cards, same 6-item count, `animate-pulse`). CLS = 0.
- **Fade-In Pattern**: Real content starts `opacity-0`, animates via `@keyframes fade-in` (200ms). Same pattern applied to card previews (500ms) and editor container.
- **`useSyncExternalStore`**: Used for SSR/client differentiation instead of `useEffect + useState` to avoid hydration mismatches and extra render cycles.

---

## 10. Page Thumbnails Sidebar

A collapsible left panel rendering real-time miniature previews of every page.

- **DOM Observation**: `MutationObserver` on the Tiptap container (`childList + subtree + characterData`). **500ms debounce** prevents per-keystroke re-renders.
- **`extractPages()`**: Queries `.tiptap .page` nodes, captures `outerHTML`, stores in state. Thumbnails rendered at `scale-[0.282]` with inverse `354%` width/height.
- **DOM Recycling Fix**: ProseMirror recycles DOM nodes — static `id` attributes break navigation. Fixed by querying the live DOM via `querySelectorAll` at click time using index-based lookup.
- **Manual Scroll Math**: `scrollIntoView` failed because of the sticky header. Replaced with explicit `getBoundingClientRect()` math against the `<main>` overflow container with `HEADER_OFFSET` subtraction.
- **Collapsible Animation**: Always-rendered panel (never conditionally mounted). Width animates between `w-64` and `w-0` with `transition-[width] duration-300`. Content fades in separately over 500ms via `requestAnimationFrame`.

---

## 11. The Email Invitation System

### `invites` Table — One Schema, Two Types
- **Email invite** (`email` non-null): Single-use. `acceptInvite()` flips status to `accepted`.
- **Universal link** (`email` null): Multi-use. Status stays `pending` until 24-hour TTL expires.
- **`expired`** is never stored — computed live from `expires_at` vs current timestamp.

### Share Dialog
Decomposed into `create-link-tab.tsx` and `send-email-tab.tsx` — each owns its own state.

### UserSearchInput (`user-search-input.tsx`)
Slack/Gmail-style pill input. Debounced 300ms lookup, `Enter` bypasses debounce for immediate verification. Stale-closure bug fixed with `useRef`. Dropdown shows "Member" / "Invited" badges and disables duplicates.

### Bulk Invite Server Action
1. `filterValidRecipients()` silently drops self-invites, existing members, and pending invites.
2. Single bulk DB insert (atomic).
3. SendGrid dispatch per-recipient, failures logged but don't roll back DB rows.

### SendGrid Integration
- DB write happens **first** (source of truth). SendGrid second. If email fails, invite still appears in recipient's in-app Inbox.
- `sendgrid.action.ts` is a dedicated wrapper — separates "what an invite is" from "how it's emailed."

### Edge Proxy Token Preservation
Unauthenticated invite links redirect to `/login?next=/dashboard/invite?token=<uuid>`. After sign-up, user is routed directly back to the invite screen.

---

## 12. Database Schema & Triggers

### 5-Table MVP

| Table | Purpose |
|---|---|
| `users` | Public profiles (`name`, `email`, `image`) mirroring `auth.users` |
| `documents` | Metadata: `title`, `owner_id`, timestamps, `is_deleted` |
| `document_members` | ACL: `document_id`, `user_id`, `role` (owner/editor/viewer) |
| `document_content_state` | `ydoc_state` (base64 CRDT binary) + `preview_json` |
| `invites` | Tokens, roles, expiry, email (nullable) |

### `handle_new_user` Trigger
PostgreSQL trigger fires on `auth.users` INSERT → auto-creates matching `public.users` row. Eliminates race conditions from client-side profile creation. Makes it structurally impossible for an auth user to exist without a public profile.

### Table Separation Design
`documents` (metadata) is kept separate from `document_content_state` (content) and `document_members` (access). This lets Hocuspocus upsert content without touching metadata, and the Dashboard list join members without pulling the Yjs binary.

### Row Level Security
Every table has RLS enabled. Queries are automatically scoped to the authenticated user. This is the second defense layer underneath all UI-level role checks.

---

## 13. Feature-Based Architecture

- **`app/` is routing-only**: Pages import from `features/` and wire them together. No UI components or server actions in `app/`.
- **One Server Action, One File**: `login.action.ts`, `create-document.action.ts`, etc. Enables maximum tree-shaking and minimal bundle sizes.
- **Component Decomposition**: Large components (toolbar, share dialog, action menu) are split into single-responsibility sub-components to prevent cascade re-renders and Git conflicts.
- **Centralized `ENV` Constants**: All `process.env` lookups go through a typed `ENV` object in `env.ts`. Catches typos at compile time and documents every required variable.

---

## 14. The Authentication System

- **Email/Password**: Server Action calls `signInWithPassword()`. Password never round-trips through a client-side `fetch`.
- **GitHub OAuth (PKCE)**: Client-side redirect to GitHub (`signInWithOAuth`), server-side code exchange in `app/auth/callback/route.ts` via `exchangeCodeForSession()`. GitHub credentials live in Supabase Dashboard, NOT in `.env.local`.
- **Forgot Password (Magic Link)**: Uses `resetPasswordForEmail` to send a branded HTML email, routing through the PKCE callback to securely authenticate before reaching `/update-password`.
- **User Profile Sync**: Profile updates (like avatar uploads) use a deferred local-preview model, saving the image to the database's `image` column only when explicitly submitted.
- **Double Validation**: Zod schemas consumed by React Hook Form (client) and `.safeParse()` (server).
- **Auth-Aware Navbar**: Async Server Component calls `getUser()` during render — correct buttons baked into first HTML response, zero-flicker.
- **`{ success, error }` Contract**: Actions return JSON, never throw `redirect()` internally. Prevents `NEXT_REDIRECT` errors in client `try/catch` blocks.
- **Sign-Out Confirmation**: Centralized `SignOutButton` with Dialog — prevents accidental logouts.

---

## 15. Document CRUD Server Actions

- **`createDocument`**: Two-step — inserts `documents` row + `document_members` row (creator as owner). Returns ID; client navigates with `router.push()`.
- **`getUserDocuments`**: Uses `.bind(null, doc.id)` to pass document IDs into Server Actions from Server Components without needing Client Components.
- **`deleteDocument`**: Soft delete + `revalidatePath('/dashboard')` to bust Next.js cache.
- **`updateDocumentTitle`**: Server-side role check (owner/editor only) before write — defense layer even if UI hides the pencil icon.
- **Auto-Save History**: Originally a 1-second debounced REST upsert. Fully replaced by Hocuspocus `onStoreDocument` WebSocket hook.

---

## 16. Image Upload & Storage

- **`document-assets` Bucket**: Public (anonymous reads for `<img>` tags) + RLS-protected writes (authenticated only).
- **File Path**: `{documentId}/{crypto.randomUUID()}.{ext}` — groups assets by document, prevents filename collisions.
- **Validation**: MIME type (`image/*`), 5MB size limit, auth check — all in `upload-image.action.ts` before the file reaches Supabase Storage.
- **Why Server Action**: Supabase service role key must never be exposed to the browser.
