# CollabDoc — Project Overview

This document is a deep-dive reference for the `collab_docx` project. It explains **what** every component does, **how** it works under the hood, and **why** specific technical decisions were made. It is written so that any developer — or AI agent — can pick up the project with full context.

---

## 1. What Is CollabDoc?

CollabDoc is a **real-time collaborative document editor** built for the web — think Google Docs, but built from scratch on a modern full-stack TypeScript architecture. Multiple users can open the same document simultaneously, see each other's cursors live, and type concurrently without ever corrupting the document, even if two people edit the same line at the same millisecond.

The core value propositions are:

- **True real-time collaboration** with live cursors, presence indicators, and offline resilience.
- **Google Docs-style A4 paginated layout** with visual page breaks, page numbers, and thumbnails.
- **Rich text editing** with fonts, colors, tables, images, checklists, slash commands, and a bubble menu.
- **Secure invite system** with one-time email tokens, multi-use universal links, an intermediate onboarding screen, and a persistent inbox.
- **Role-based access control** — Owner, Editor, and Viewer — enforced server-side before any HTML reaches the browser.

---

## 2. Technology Stack — What We Use and Why

Every technology in this project was chosen deliberately. Here is the full stack with the rationale for each choice:

### Next.js 15 (App Router)

We use Next.js as the core framework. The App Router model gives us **React Server Components** — components that render entirely on the server, can query the database directly, and ship zero JavaScript to the browser. This means:

- The dashboard loads with real data on the very first HTML response — no flickering "loading" states from the client fetching data after mount.
- Server Actions (`'use server'`) let us write backend mutation logic (creating documents, sending invites, uploading images) directly alongside UI code, without building a separate REST or GraphQL API layer.
- The Edge Proxy (`src/proxy.ts`) intercepts every page request at the network edge to handle authentication before the page even begins rendering.

### Supabase (Database + Auth + Storage)

Supabase replaces what would traditionally be three separate services:

- **PostgreSQL database** with Row Level Security (RLS) — every query is automatically scoped to the authenticated user. No manual `WHERE user_id = $1` boilerplate needed.
- **Native Auth** via `@supabase/ssr` — we deliberately dropped Auth.js because Supabase Auth is deeply integrated with RLS. The database inherently knows who is making every request, making permission enforcement seamless.
- **Supabase Storage** — the `document-assets` bucket stores all user-uploaded images persistently. Images get a permanent public CDN URL, solving the `blob:` URL problem that would break images in collaborative sessions (a `blob:` URL is local to the browser tab that created it — other users or page refreshes would show broken images).

We use **three separate Supabase clients** because Next.js runs code in three environments:

| Client | File | Used In | How It Reads Cookies |
|---|---|---|---|
| Browser Client | `src/lib/supabase/client.ts` | `'use client'` components | `document.cookie` (browser native) |
| Server Client | `src/lib/supabase/server.ts` | Server Components & Server Actions | `next/headers` cookies() API |
| Proxy Client | `src/lib/supabase/proxy.ts` | Edge Proxy (`proxy.ts`) | NextRequest + NextResponse cookie bridge |

The Proxy Client does one additional critical job: it calls `supabase.auth.getUser()` on every request, which causes Supabase to silently refresh expired JWTs using the stored Refresh Token. The fresh session cookie is then attached to the response. This is why users are never randomly logged out mid-session.

**Important**: Server Components must always use `supabase.auth.getUser()` for identity checks — never `getSession()`. `getSession()` trusts the cookie without validating it against the Supabase backend, which is a security risk Supabase explicitly warns about.

### Tiptap v2 (Rich Text Editor)

Tiptap is a headless, framework-agnostic rich text editor built on top of **ProseMirror**. We use it because:

- It gives us 100% control over the UI — we design every button, every dropdown, every visual element ourselves.
- It has a first-class extension system, so we can write custom extensions (like `FontSize`, `ResizableImage`, `SlashCommand`) without forking the core library.
- It has official support for **Yjs real-time collaboration** via `@tiptap/extension-collaboration` and `@tiptap/extension-collaboration-cursor`.

**Critical constraint**: We are pinned to Tiptap **v2** (`^2.27.2`). Tiptap v3 introduced a breaking architectural change that is incompatible with `@tiptap/extension-collaboration-cursor`. Upgrading to v3 would break live cursor rendering for all users. Do not upgrade.

### Yjs + Hocuspocus (Real-Time Collaboration Engine)

**Yjs** is a CRDT (Conflict-free Replicated Data Type) library. A CRDT is a mathematical data structure that can be modified by multiple actors simultaneously and will always converge to the same result, no matter what order the operations arrive. This is what makes true multi-user editing possible without locking mechanisms or operational transforms.

**Hocuspocus** is the official Tiptap-maintained WebSocket server for Yjs. It acts as the central relay: all connected clients send their Yjs document updates to it, it merges them and broadcasts the merged state back to everyone else.

**Why a separate Node.js server?** We run Hocuspocus in `/hocuspocus-server` as a completely independent Node.js process, separate from Next.js. The reason is fundamental: **Vercel (and most serverless platforms) do not support persistent WebSocket connections**. Serverless functions are stateless and short-lived — a WebSocket requires a long-lived, always-open TCP connection. A standalone Node.js server handles this natively.

### Tailwind CSS v4 + Shadcn UI (Nova Preset, Radix Library)

Tailwind provides utility-class styling. Shadcn UI provides accessible, unstyled component primitives (Dialog, DropdownMenu, Popover, Sheet, Avatar, etc.) that we copy directly into our codebase and customize. Using the Nova preset and Radix library means our components use semantic CSS variables for theming, making dark mode and future rebranding trivial.

### Zod + React Hook Form

Zod provides TypeScript-first schema validation. React Hook Form manages form state efficiently (only re-renders changed fields). Together they provide:
- Client-side validation before any network request is made.
- Server-side validation via `zod.safeParse()` inside Server Actions, preventing malformed data from ever reaching the database.

### SendGrid (Transactional Email)

SendGrid handles email delivery for the invitation system. When an owner invites collaborators by email address, our server action constructs a personalized invite email containing the unique token link and dispatches it via the SendGrid API. This is entirely server-side — the API key never touches the browser.

### tsx (TypeScript Execute — Hocuspocus Runtime)

The `/hocuspocus-server` runs using `tsx` instead of the legacy `ts-node + nodemon` combo. This was a necessary migration because `ts-node/esm` is deprecated in Node.js v24+, producing severe `ExperimentalWarning` and `fs.Stats` errors. `tsx` is built on `esbuild` — it starts in milliseconds, has zero deprecation warnings, and supports ES Modules natively with `--watch` for hot reloading during development.

---

---

## 3. The Dashboard

The dashboard is the home screen every authenticated user lands on. It is a full-viewport, app-shell interface — it does not scroll like a webpage. Instead, the outer shell is locked to the viewport (`fixed inset-0 h-[100dvh] overflow-hidden`) and only the document card grid scrolls internally. This is an intentional architectural decision: users should never accidentally scroll the page chrome (the top navigation bar, the title row, the search bar) out of view.

The dashboard is built around a **responsive 3-column card grid** and a clean **top navigation bar**, replacing the earlier sidebar-heavy layout. The top nav is persistent and always visible regardless of scroll position inside the grid.

---

### 3.1 The Document Card (`document-card.tsx`)

Each document in the grid is rendered as a **dual-section landscape card** (`h-[280px]`).

**Top half — Rich HTML Preview**: This is the most visually interesting part. Instead of showing a plain title, the card renders an actual miniaturized preview of the document's content exactly as it appears in the editor — fonts, colors, tables, images, and all.

**Bottom half — Metadata & Actions**: Shows the document title, a role badge (Owner / Editor / Viewer), the last-modified timestamp, and the action menu button.

#### How the card layout handles hover states

A subtle but important detail: when the user opens the 3-dot action menu on a card, the card row must visually stay "active" (highlighted background) even while the cursor is hovering over dropdown items outside the card boundary. Without a special fix, the hover background disappears the moment the cursor leaves the card. We solved this with the CSS `:has` selector:

```css
has-[[data-state=open]]:bg-zinc-50
```

This tells the card: *"if any descendant element has `data-state=open` (which Radix sets on open dropdowns), keep the background active."* The card now stays highlighted for the entire duration the dropdown is open, providing an elegant, premium interaction.

---

### 3.2 The Document Preview Engine (`DocumentPreview` + `useDocumentPreview`)

The preview inside each card is not a screenshot or a static image — it is **real rendered HTML**, generated from the live Tiptap document JSON stored in the database, and then scaled down using a CSS transform.

#### How it works step by step

1. **Data source**: When the Hocuspocus server saves the document, it also stores a `preview_json` snapshot in the `document_content_state` table. This is the Tiptap ProseMirror JSON representation of the document content.

2. **HTML generation**: On the client, `useDocumentPreview` calls Tiptap's headless `generateHTML(json, extensions)` utility. This function takes the JSON AST and converts it to an HTML string without needing a live editor instance or the DOM.

3. **Critical extension registration**: `generateHTML` must be given the **exact same set of extensions** that the editor uses. If a document contains a table or a task list and those extensions are not registered with `generateHTML`, Tiptap silently fails to parse those nodes and the preview renders as empty text. Every custom extension — `Table`, `TaskList`, `ResizableImage`, `FontSize`, `TextAlign`, etc. — must be listed explicitly.

4. **SSR / Hydration safety**: `generateHTML` accesses browser APIs internally. If Next.js tries to run it on the server during SSR, it will throw. We protect against this using `useSyncExternalStore`:

   ```tsx
   const mounted = useSyncExternalStore(
     () => () => {},
     () => true,   // client: returns true
     () => false   // server: returns false
   );
   ```

   This is the idiomatic React API for telling server vs client apart. It returns `false` during SSR (so the server renders an SVG placeholder instead), and `true` after hydration (so the client generates the real HTML). We deliberately use this instead of `useEffect + useState` because `useEffect` causes hydration mismatches — the server and client render different HTML, and React throws a hydration error.

5. **Scaling**: The generated HTML is injected via `dangerouslySetInnerHTML` inside a container that is scaled down using Tailwind's `scale-[0.282]` transform (for the dashboard card size). Because CSS `transform: scale()` does not affect layout flow, we also set `width: 200%` and `height: 200%` on the inner div to ensure the full A4 page width is visible before scaling.

6. **Non-interactive overlay**: `pointer-events-none` is applied over the scaled HTML so users cannot accidentally click links or trigger interactions inside the thumbnail.

7. **Smooth fade-in**: Both the SVG placeholder and the HTML preview are always present in the DOM (absolute positioned, overlapping). The preview starts at `opacity-0`. After mount, `requestAnimationFrame(() => setShowPreview(true))` defers the state update to the next paint frame, triggering a `transition-opacity duration-500 ease-in-out` CSS animation. This ensures the placeholder is visible immediately on mount, the preview fades in smoothly, and there is never a jarring flash or blank white square.

---

### 3.3 Stacked Presence Avatars on Cards

In the bottom-right corner of every card's preview area, there is a cluster of overlapping circular avatars showing who has access to the document.

- We slice the `all_members` array to a **maximum of 3** (`doc.all_members.slice(0, 3)`).
- If there are more than 3 members, a final badge shows the overflow count (e.g., `+2`).
- Dynamic `zIndex` (`style={{ zIndex: 10 - i }}`) ensures the first avatar is physically on top of the second, matching modern stacking UI patterns from apps like Figma and Notion.
- **Fallback chain**: `(member.user.name || member.user.email || "?").charAt(0).toUpperCase()` — if a user has no avatar image, no name, and no email, it shows `?` rather than a broken UI block.

---

### 3.4 The Document Action Menu (`document-action-menu.tsx`)

The 3-dot menu on each card opens a `DropdownMenu` with three actions: **Open**, **Rename**, and **Delete**.

This component is architecturally decomposed into three files:

- `document-action-menu.tsx` — renders only the `DropdownMenu` and manages the boolean open states for the dialogs.
- `document-rename-dialog.tsx` — a `Dialog` with a text input pre-filled with the current title. On submit it calls the `updateDocumentTitle` server action, which verifies the user is an `owner` or `editor` before writing to the database. Viewers cannot rename.
- `document-delete-dialog.tsx` — a destructive confirmation `AlertDialog`. On confirm it calls the `deleteDocument` server action.

This decomposition exists for performance: previously the `DropdownMenu` held all the dialog state (`draftTitle`, `isPending`, form state) at its top level, causing the entire action menu — and potentially the parent card — to re-render on every single keystroke in the rename input. By moving the dialogs into their own files with localized state, only the dialog re-renders when the user types.

---

### 3.5 Create Document Dialog (`CreateDocumentButton`)

The "New Document" button opens a `Dialog` that asks for a title and lets the user pick an emoji icon from a curated list.

**The icon storage trick**: The `documents` database table does not have a dedicated `icon` column. Rather than running a schema migration, the emoji is **prepended directly to the `title` string** at creation time (e.g., `"📄 My Document"`). The dashboard cards display this as an icon prefix, which works seamlessly across the whole app — the editor header, sidebar, and document list all read the same `title` field.

After the server action creates the document and returns the new UUID, the client uses `router.push()` to navigate directly to `/dashboard/[docId]`. This is intentional — the server action returns the ID as JSON instead of calling `redirect()` internally. If it called `redirect()` server-side, the Next.js redirect mechanism would throw a `NEXT_REDIRECT` error that a client-side `try/catch` would mistakenly catch as a failure.

---

### 3.6 Server-Side Pagination

The dashboard uses **URL-driven server-side pagination**. The current page and search query are read from the URL's `searchParams` on the server:

```
/dashboard?page=2&search=quarterly
```

The `getUserDocuments` server action passes these parameters directly to Supabase's `.range()` method, which applies an `OFFSET` and `LIMIT` at the database level:

```ts
.range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)
```

We cap the page size at **6 documents per page**. The total document count is fetched with `{ count: 'exact' }` to drive the pagination controls accurately.

**Why server-side instead of client-side?** Client-side pagination means loading all documents into the browser at once and slicing an array. For a user with 200 documents, this means a 200-row database query, a large JSON payload, and a full re-render of the entire list on every filter change. Server-side pagination guarantees that every page load queries exactly 6 rows from the database, regardless of total document count — O(1) rendering time at any scale.

**Pagination buttons use `<Link prefetch={true}>`**: Next.js native `<Link>` components with `prefetch={true}` instruct the router to silently fetch the next page's server component data in the background while the user is reading the current page. When they click "Next", the transition is instant because the data is already cached in the router.

---

### 3.7 Search with Debounce and Overlay Spinner

The search input does **not** fire a database query on every keystroke. Instead, a `useDebounce` hook delays the URL update by **500ms** after the user stops typing. Only then does the URL change, triggering a Next.js server re-render with the new `search` param.

While the 500ms debounce is running (the user is still typing), an `isLoading` overlay activates:
- The existing document cards **dim to `opacity-40`** — they do not disappear.
- A centered spinner overlays the grid.

This is deliberately different from showing a full skeleton loader. Completely replacing the grid with a skeleton during every search keystroke would cause the entire layout to jump and feel unstable. The dim-and-overlay approach provides immediate feedback that "something is happening" while maintaining the spatial context of where documents are located in the grid.

---

### 3.8 Skeleton Loading and the `(home)` Route Group

Next.js 15's `loading.tsx` convention wraps a route's `page.tsx` in a React `Suspense` boundary automatically. While the server fetches document data, `loading.tsx` renders a `DocumentListSkeleton` — a pulsing gray placeholder that perfectly mirrors the structure and dimensions of the real card grid.

**The Route Group isolation problem**: Initially, `loading.tsx` sat at `app/dashboard/`. In Next.js, a `loading.tsx` applies to its route **and all nested child routes**. This caused a serious UX bug: when a user clicked a document card to open `/dashboard/[docId]`, the dashboard skeleton loader would flash on the screen during the navigation transition — even though the user was leaving the dashboard, not loading it.

**The fix**: We moved the dashboard home page into a **Route Group** folder called `(home)`:

```
app/
└── dashboard/
    ├── (home)/
    │   ├── page.tsx        ← dashboard list
    │   └── loading.tsx     ← skeleton ONLY for this page
    └── [docId]/
        └── page.tsx        ← document editor
```

Route Groups (folders wrapped in parentheses) are invisible in the URL — `/dashboard` still works exactly the same. But by scoping `loading.tsx` inside `(home)`, it now only triggers for the dashboard list page. Navigating into a document completely skips the skeleton, resulting in a smooth, instant-feeling transition.

**The `DocumentListSkeleton` component** mimics the exact layout of the card grid — same number of cards, same `h-[280px]` height, same dual-section structure. Tailwind's `animate-pulse` applies a breathing opacity effect. Because the skeleton's dimensions exactly match the real content's dimensions, React's reconciliation produces zero layout shift (CLS = 0) when the real cards load in.

---

### 3.9 Dashboard Layout Shell

The entire dashboard is wrapped in a `fixed inset-0 h-[100dvh] overflow-hidden` shell. This is what makes it feel like a native application rather than a webpage:

- **`fixed inset-0`**: The shell is removed from normal document flow and pinned to all four edges of the viewport.
- **`h-[100dvh]`**: Uses the dynamic viewport height unit (not `vh`), which correctly accounts for mobile browser chrome (address bars, tab bars) that appear and disappear on scroll.
- **`overflow-hidden`**: Nothing can overflow the shell boundary.

Inside the shell, the document grid uses `overflow-y-auto overscroll-contain`. `overscroll-contain` prevents the browser's default "bounce" scroll behavior from propagating to the outer shell when the user reaches the top or bottom of the grid — a subtle but important polish detail.

---

---

## 4. The Inbox

The Inbox (`/inbox`) is a dedicated page where users manage all document invitations sent to their email address. It is more than a simple list — it handles real-time updates, persistent history, client-side filtering with live expiry tracking, and a particularly tricky JavaScript bug called a stale closure that required a careful architectural solution.

---

### 4.1 Architecture: Server Component + Client Component Split

The inbox is deliberately split into two layers:

- **`inbox-list.tsx` (Server Component)**: Runs on the server. Queries the `invites` table via Supabase, filtering by `email = current_user_email`. It also joins the `documents` and `users` tables in the same query so each invite row arrives already enriched with the document title, the inviter's name, avatar, and email. This data is fetched once at page load and passed as a prop to the client layer.

- **`inbox-client-list.tsx` (Client Component)**: Receives the initial invite array from the server and takes full ownership of UI state — filtering, real-time updates, loading states. All interactivity lives here so the server component stays lean and fast.

This split is the React Server Component pattern at its best: the server does the expensive data fetching, the client handles the interactive UI, and no data is fetched twice.

---

### 4.2 Invite Items and Persistent History (`inbox-item.tsx`)

Each invite row shows the inviter's avatar, name, email, the document title, the role offered (`Editor` or `Viewer`), and the invitation timestamp.

**The key UX decision: invites are never automatically deleted.** When a user accepts or rejects an invite, the underlying database row is not removed. Instead:

- The `status` column in the `invites` table is updated to `accepted` or `rejected`.
- The UI dynamically replaces the Accept/Reject action buttons with a styled badge — a green "Accepted" chip or a red "Rejected" chip — based on the `status` value.
- A trash icon button is shown alongside the badge, allowing the user to explicitly run a `DELETE` server action to permanently remove the row only when they choose to clean up.

This gives users a **permanent history log** of every document they've been invited to, which is important for accountability and reference. The database schema's `invites_status_check` constraint was updated to allow `'rejected'` as a valid status value alongside `'pending'` and `'accepted'`.

---

### 4.3 Client-Side Filtering with Live Expiry Tracking

The inbox has a filter dropdown with five options: **All**, **Pending**, **Accepted**, **Rejected**, and **Expired**.

The filtering runs entirely in the browser using `useMemo`:

```ts
const filteredInvites = useMemo(() => {
  return initialInvites.filter(invite => {
    if (filter === 'all') return true;
    if (filter === 'expired') {
      return invite.status === 'pending' && new Date(invite.expires_at) < new Date();
    }
    return invite.status === filter;
  });
}, [initialInvites, filter]);
```

**Why client-side filtering here (but server-side on the dashboard)?** The dashboard can have hundreds of documents, so server-side filtering is necessary for scale. The inbox is scoped to invites for a single user's email — a much smaller, bounded dataset. Loading it all client-side is safe, and it enables the critical "Expired" filter.

**The "Expired" filter works without any page refresh.** `new Date(invite.expires_at) < new Date()` computes the expiry check at the exact millisecond the user opens the filter dropdown. A `pending` invite that was valid when the page first loaded will naturally fall into "Expired" as time passes — the `useMemo` recalculates whenever the `filter` dependency changes, which includes the user switching filter tabs. No server round-trip, no refresh needed.

---

### 4.4 Real-Time Updates via Supabase Realtime (`inbox-realtime-listener.tsx`)

When someone sends you an invite while your inbox is open, the new row should appear instantly — not after a page refresh. This is handled by `inbox-realtime-listener.tsx`, a client component that subscribes to Supabase's Postgres Changes real-time channel:

```ts
supabase
  .channel('inbox-changes')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'invites',
    filter: `email=eq.${userEmail}`
  }, () => {
    onNewEventRef.current(true); // silent fetch
  })
  .subscribe();
```

When a new `INSERT` fires on the `invites` table for the current user's email, it triggers a callback that silently re-fetches the inbox data.

**Why not `router.refresh()`?** Our first implementation called `router.refresh()` inside the Realtime callback. This forces the entire Next.js routing tree to re-fetch all its server components simultaneously — the inbox page, the layout, everything. The result was a heavy, visible "flash" every time an invite arrived. It felt like a full page reload triggered randomly mid-session. We replaced this with a localized `onNewEvent()` callback that only re-fetches the inbox data, leaving everything else on screen completely untouched.

---

### 4.5 Silent Background Fetching

Inside `inbox-client-list.tsx`, the fetch function has a `silent` boolean parameter:

```ts
async function fetchFiltered(silent = false) {
  if (!silent) setIsFilterLoading(true);
  const data = await getInboxInvites(filter);
  setInvites(data);
  setIsFilterLoading(false);
}
```

- **`silent = false`** (user-triggered): When the user manually clicks a filter tab, `setIsFilterLoading(true)` activates a skeleton loader to acknowledge the interaction.
- **`silent = true`** (background real-time event): When a new invite arrives via WebSocket, the fetch runs invisibly — no skeleton, no loading state, no UI disruption. React's virtual DOM diffing engine quietly inserts the new row into the list with zero layout shift.

This distinction matters enormously for perceived quality. A skeleton loader that appears and disappears randomly while you are reading your inbox (triggered by someone else sending you an invite) feels like a bug. Silent fetching makes real-time updates feel as natural as messages appearing in a chat app.

---

### 4.6 The Stale Closure Bug and the `useRef` Fix

This was one of the most subtle bugs in the entire project. Here is the exact scenario that caused it:

1. The inbox mounts. The Supabase Realtime WebSocket subscribes. At this moment, it captures the `fetchFiltered` function in its closure, with `filter = "all"`.
2. The user switches the filter dropdown to `"Pending"`. React re-renders `inbox-client-list.tsx` with the new filter state. A new version of `fetchFiltered` is created that knows `filter = "pending"`.
3. An invite arrives via WebSocket. The WebSocket callback fires — but it still holds a reference to the **original** `fetchFiltered` captured in step 1, where `filter = "all"`.
4. The callback fetches the "All" list and sets it as the new state — completely overriding the user's active "Pending" filter view with the full unfiltered list.

This is the classic JavaScript stale closure problem: the WebSocket `useEffect` runs exactly once on mount and permanently captures the initial state of everything it closes over. Subsequent state changes in the component do not update what the WebSocket has captured.

**The fix: a mutable `useRef`.**

```ts
const onNewEventRef = useRef(onNewEvent);

useEffect(() => {
  onNewEventRef.current = onNewEvent; // keep ref fresh on every render
}, [onNewEvent]);

// inside the WebSocket useEffect (runs once):
.on('postgres_changes', ..., () => {
  onNewEventRef.current(true); // always calls the latest version
})
```

A `useRef` creates a stable memory address that persists across renders. The WebSocket permanently holds a reference to `onNewEventRef` — not to `onNewEvent` directly. A separate `useEffect` runs on every render and updates `onNewEventRef.current` to point to the freshest version of the function. The WebSocket always calls `.current`, which is always up to date, without ever needing to re-subscribe.

---

### 4.7 Zero-Jitter Loading Spinners (Applied Globally)

While implementing inbox action buttons (Accept, Reject, Delete), we solved a universal UI problem that now applies to all interactive buttons across the entire app.

**The problem**: When a button transitions from its default text state to a loading state, the naive approach is to replace the text with a spinner component. But spinner icons are typically smaller than the text they replace, causing the button to visually shrink mid-interaction — a jarring layout jump.

**The zero-jitter pattern**:

```tsx
<button onClick={handleAction} disabled={isPending}>
  <span className={isPending ? 'opacity-0' : 'opacity-100'}>
    Accept Invitation
  </span>
  {isPending && (
    <span className="absolute inset-0 flex items-center justify-center">
      <Loader2 className="animate-spin" />
    </span>
  )}
</button>
```

The button text is never removed from the DOM — it is hidden with `opacity-0`. Because the text is still physically present, the button retains its exact original width and height. The spinner is rendered via `absolute inset-0`, sitting on top of the invisible text. The result is a button that never changes size during loading. This pattern is applied to all 12 primary action buttons across auth, dashboard, and invitation flows.

**The `onSubmit` vs `action` attribute problem**: React 18 / Next.js wraps Server Actions triggered via the HTML `action` attribute in `useTransition` implicitly. This batches state updates and delays the `isPending` flag from rendering until after the transition completes — meaning the spinner appears too late, after the network request has already started. By switching to `onSubmit` with `e.preventDefault()` and calling the server action manually inside the handler, React renders the `isPending` state change synchronously and immediately, making the spinner appear the instant the user clicks.

---

---

## 5. The Document Page

The document page (`/dashboard/[docId]`) is the core editing experience. It is intentionally full-bleed — it takes over the entire viewport with no inherited padding or shared chrome from the dashboard layout. This section covers everything that surrounds the editor itself: how the page is secured before it loads, how state is shared between the header and the editor, how roles are enforced, and how edge cases like access revocation are handled gracefully.

---

### 5.1 Server-Side Security Before Any HTML Renders

`app/dashboard/[docId]/page.tsx` is a **React Server Component**. This is a deliberate and important choice. Before a single byte of HTML is sent to the browser, the server:

1. Calls `getDocumentById(docId)` — a server action that queries Supabase for the document and does a JOIN against `document_members` to verify the current user's `user_id` is explicitly listed as a member.
2. Also checks that `is_deleted = false` — soft-deleted documents are invisible.
3. If the query returns `null` (document doesn't exist, user has no membership, or it's deleted), Next.js `redirect('/dashboard')` fires immediately. The user is bounced back before any document content, title, or metadata ever reaches their browser.

This is fundamentally more secure than client-side access checks. With a client-side guard, the browser receives the page HTML first, renders it briefly, then checks auth and redirects — creating a flash of unauthorized content. The server-side approach makes unauthorized access physically impossible: there is nothing to flash because the redirect happens at the network layer.

The server also extracts the current user's `role` from the `document_members` join and passes it as a prop down the entire component tree. Every child component — the header, the toolbar, the editor — receives the role and adjusts its behaviour accordingly without making any additional database queries.

---

### 5.2 The `DocumentContext` Provider

`DocumentContext` is a React Context provider that wraps the entire document page. It solves a fundamental React architecture problem: the `DocumentHeader` and the `Editor` are completely separate components in the component tree, with no direct parent-child relationship that would allow them to pass state between each other via props. Yet they both need to share two pieces of live data:

- **`syncState`** — whether the document is currently saving, saved, or offline. The Editor sets this; the Header displays it.
- **`activeUsers`** — the array of users currently connected to the document via WebSocket. The Editor populates this from Hocuspocus awareness events; the Header renders it as the presence avatar cluster.

By wrapping both components in `DocumentContext`, the Editor can call `setSyncState('saving')` and the Header reads `syncState` from the same context — no prop drilling, no event emitters, no global state library needed.

The context shape:

```ts
type DocumentContextValue = {
  syncState: 'saving' | 'saved' | 'offline';
  setSyncState: (state: SyncState) => void;
  activeUsers: ActiveUser[];
  setActiveUsers: (users: ActiveUser[]) => void;
};
```

---

### 5.3 The Document Header (`document-header.tsx`)

The document header is the sticky top bar on the document page. It is itself a Client Component (it needs interactivity) and is decomposed into four distinct sub-components to keep state localized and renders minimal:

#### `document-rename-dialog.tsx`
A `Dialog` containing a text input pre-filled with the current document title. Triggered by a small Pencil icon next to the title. On submit, it calls the `updateDocumentTitle(documentId, newTitle)` server action. This action does a server-side role check first — only `owner` and `editor` are allowed to write. If the user is a `viewer`, the Pencil icon is not rendered at all (the role prop gates the render in JSX).

Previously this rename dialog was defined inline inside the header file as an embedded component. This caused a problem: the rename input's `useState` lived at the header level, so every keystroke in the rename field forced the entire header — including the avatar cluster, sync status, and all buttons — to re-render. Moving it to its own file with fully localized state means only the dialog re-renders as the user types.

#### `document-members-popover.tsx`
A Shadcn `Popover` triggered by clicking anywhere on the stacked avatar cluster. It opens a scrollable list showing every member's avatar, full name, email address, and role label (Owner / Editor / Viewer). The data is already available from the server-side `getDocumentById` query, so no additional fetch is needed on open.

#### `document-sync-status.tsx`
A small micro-indicator in the header that reads `syncState` from `DocumentContext` and renders one of three states:
- **Saving**: An animated pulsing cloud icon — conveys that a save is in progress.
- **Saved**: A cloud with a checkmark — confirms the document is safely persisted.
- **Offline**: An amber warning icon with "Offline" text — signals the WebSocket has disconnected.

This component has no logic of its own. It is a pure display component that reads one value from context and renders the appropriate icon. Keeping it separate means changing the sync indicator visuals never touches any other part of the header.

#### `ActiveUsersCluster` (inside the header)
Reads the `activeUsers` array from `DocumentContext` and renders overlapping circular avatars for each currently connected user. Each avatar has a Tooltip showing the user's name and "Online Now". The cursor color used for their live caret in the document is also reflected in a small colored ring on their avatar, creating a visual link between the header presence indicator and the cursor you see in the document body.

---

### 5.4 Strict Role-Based UI Enforcement

The role received from the server (passed as a prop from `page.tsx`) gates UI elements at the JSX level throughout the document page:

| Element | Owner | Editor | Viewer |
|---|---|---|---|
| Rename pencil icon | ✅ Shown | ✅ Shown | ❌ Hidden |
| Invite button | ✅ Shown | ✅ Shown | ❌ Hidden |
| "View Only" badge | ❌ Hidden | ❌ Hidden | ✅ Shown |
| Formatting toolbar | ✅ Shown | ✅ Shown | ❌ Hidden |
| Link bubble menu | ✅ Shown | ✅ Shown | ❌ Hidden |
| Tiptap `editable` prop | `true` | `true` | `false` |

The most important enforcement is `editable={false}` passed to Tiptap's `<EditorProvider>`. This is not a UI-level lock — it is a deep engine-level lock. When `editable` is false, Tiptap/ProseMirror natively disables all `keydown` events, `contenteditable` interactions, clipboard paste, and drag-and-drop into the editor. A viewer cannot accidentally or intentionally modify the document content, even by opening browser DevTools and manually dispatching keyboard events — ProseMirror ignores them.

Hiding the toolbar and bubble menu for viewers additionally signals the read-only state visually, giving them a clean published-article aesthetic without distracting formatting controls.

---

### 5.5 The "Access Revoked" Modal (Realtime Race Condition Fix)

This was a critical production stability issue. The scenario:

1. User A and User B are both inside a document. User A is the owner.
2. The owner opens the members popover and removes User B from the document.
3. This fires a `DELETE` event on the `document_members` table via Supabase Realtime.
4. `DocumentRealtimeListener` (a client component subscribed to this table) detects the DELETE.

**The bug (before the fix)**: The Realtime listener naively called `router.refresh()` whenever any change was detected on `document_members`. When User B's membership was deleted, `router.refresh()` triggered Next.js to re-run the server component — which called `getDocumentById` again. This time the function returned `null` (because the user is no longer a member), which triggered `redirect('/dashboard')` inside the server component. But the redirect was happening inside an already-rendered client context, causing Next.js to throw an unhandled error and crash the page into a generic error boundary — a jarring, unexplained experience for User B.

**The fix**: We intercept the `document_members` DELETE event specifically. Instead of calling `router.refresh()`, we check whether the deleted membership belongs to the current user. If it does, we set a local `isRevoked` state flag to `true`. This renders a persistent full-screen modal overlay: *"Your access to this document has been revoked."* with a button to return to the dashboard. The modal cannot be dismissed — once access is revoked, there is no state to go back to. The user navigates away manually, cleanly, with a clear explanation of what happened.

---

### 5.6 The Full-Bleed Layout (No Double Header)

The `app/dashboard/layout.tsx` file wraps all dashboard routes. Early in the project, this layout included a global top navbar and padding applied to all children. This worked fine for the dashboard list, but caused two problems on the document page:

1. **Double header**: The document page has its own `DocumentHeader`. With the layout's header also rendering, the page had two stacked navigation bars.
2. **Padded editor**: The layout's `p-4 sm:p-6 lg:p-8` padding trapped the editor inside an indented box, preventing it from stretching edge-to-edge.

The fix was to remove the top navbar and padding from `layout.tsx` entirely. The dashboard list page (`(home)/page.tsx`) adds its own top navbar and padding directly, since it needs them. The document page adds its own full-bleed `DocumentHeader` and stretches the editor to the full viewport width. Each route owns its own chrome — the layout is a pure structural shell with no visual opinion.

---

### 5.7 The Intermediate Invite Acceptance Screen (`/dashboard/invite`)

When a user clicks an invite link (e.g., `/dashboard/invite?token=abc123`), they do not land directly in the document. Instead they see an intermediate "You've been invited!" confirmation card.

**Why this screen exists**: Without it, clicking an invite link would immediately and silently add the user to the document's member list and redirect them to the editor. The user would have no idea what document they were joining, who sent the invite, or what role they were being granted before their account was permanently modified.

**How it works**:
1. The page server component calls `getInviteDetails(token)` — a server action that looks up the token in the `invites` table and returns the document title, the owner's name and avatar, the role being offered, and the expiry timestamp. **This action does not consume the token** — it only reads it. The user's `document_members` record is not created yet.
2. The page renders a centered card with all this information plus two buttons: **Accept** and **Cancel**.
3. Cancel routes the user to `/dashboard` without touching the token at all — it remains `pending`.
4. Accept triggers the `acceptInvite(token)` server action, which validates the token is still `pending` and not expired, creates the `document_members` record, marks email invite tokens as `accepted` (universal links stay `pending`), and then redirects to the actual document.

The invite page lives at `/dashboard/invite` (inside the dashboard route segment) so it automatically inherits the dashboard layout — the user sees the full app chrome (top nav, sign out button) rather than a disconnected standalone page. This makes the experience feel cohesive rather than like they have been sent to an external website.

---

---

## 6. The Toolbar

The formatting toolbar sits pinned to the top of the editor container. It looks and feels like Google Docs — a `bg-[#f0f4f9]` blue-gray background, flat separators, borderless selects, and blue active states on toggle buttons. Under the hood it is one of the most architecturally complex parts of the app, because getting a rich text toolbar right requires solving several non-obvious problems: preventing focus loss, keeping dropdowns reactive to cursor position, handling Radix UI's aggressive focus stealing, and avoiding infinite recursion in color state.

---

### 6.1 Modularization — From a 600-Line Monolith to 8 Sub-components

The toolbar started life as a single `toolbar.tsx` file exceeding 600 lines. This caused real problems:

- Every state change anywhere in the toolbar (e.g., the user typing in the color picker) re-rendered the entire 600-line component tree.
- Fixing the Link control required navigating 600 lines of mixed concerns.
- Git conflicts were constant — any two features touching the toolbar at the same time would collide.

The toolbar was decomposed into 8 single-responsibility sub-components, each in its own file inside `src/features/editor/components/toolbar/`:

| Sub-component | Responsibility |
|---|---|
| `history-controls.tsx` | Undo and Redo buttons |
| `heading-controls.tsx` | H1, H2, H3 toggle buttons |
| `text-format-controls.tsx` | Bold, Italic, Strikethrough toggles |
| `font-family-control.tsx` | Font family dropdown (Arial, Courier New, Georgia, etc.) |
| `font-size-control.tsx` | Font size dropdown (8px–72px) with smart contextual default |
| `color-control.tsx` | Text color picker circle + color palette |
| `list-controls.tsx` | Bullet list, ordered list, task list (checklist) toggles |
| `link-control.tsx` | Link insertion popover with URL input |
| `image-control.tsx` | Image upload trigger and Supabase upload handler |
| `table-control.tsx` | Table insertion dropdown |
| `alignment-controls.tsx` | Left, center, right, justify alignment buttons |

The root `toolbar.tsx` now acts purely as a **composer** — it imports and arranges these sub-components with separator dividers between groups. No logic lives in the root file. This means modifying the link behavior touches only `link-control.tsx`, and Next.js Fast Refresh recompiles only that file rather than the entire toolbar.

---

### 6.2 The `onMouseDown` Rule — Preserving `storedMarks`

This is the single most important rule for the toolbar. **Every toolbar button, toggle, and control must have `onMouseDown={(e) => e.preventDefault()}`**.

Here is exactly why:

ProseMirror (Tiptap's underlying engine) maintains a concept called `storedMarks` — an in-memory list of formatting marks that should be applied to the *next character typed*. This is how formatting-before-you-type works: you click Bold, you haven't typed anything yet, but ProseMirror remembers "the next character should be bold" via `storedMarks`.

When the browser processes a `mousedown` event on any element outside the `contenteditable` div (like a toolbar button), its default behaviour is to move DOM focus to that element. The moment the Tiptap editor's `contenteditable` loses focus, ProseMirror **immediately flushes `storedMarks` to empty**. This was the root cause of a particularly confusing bug: setting the font to Courier New, then clicking Bold, caused the font to silently revert to the default because ProseMirror discarded the stored font-family mark when focus left the editor on the Bold click.

`e.preventDefault()` on `mousedown` stops the browser from moving focus. The editor never loses focus. `storedMarks` survives. Every formatting mark the user set before typing is faithfully applied to the first new character.

This rule applies to **every interactive element** in the toolbar — toggles, buttons, dropdowns, selects, and color pickers.

---

### 6.3 Toolbar Reactivity — The Transaction Listener

Tiptap's `useCurrentEditor()` hook does not automatically cause React components to re-render when the cursor moves or the selection changes. Without intervention, moving the cursor from bold text to italic text would leave the Bold button stuck in the "active" (highlighted) state even though the cursor is no longer on bold text.

The fix is a `useEffect` in the toolbar root that subscribes to Tiptap's `transaction` event:

```ts
useEffect(() => {
  if (!editor) return;
  const handler = () => forceUpdate(n => n + 1);
  editor.on('transaction', handler);
  return () => editor.off('transaction', handler);
}, [editor]);
```

Every ProseMirror transaction (a cursor move, a keystroke, a formatting change) triggers `forceUpdate`, incrementing a counter that causes the toolbar to re-render. On re-render, every `editor.isActive('bold')`, `editor.getAttributes('textStyle').color`, etc. call is evaluated fresh against the current cursor position.

For the Font Family and Font Size `<Select>` dropdowns specifically, we add a `key` prop bound to the current attribute value:

```tsx
<Select key={editor.getAttributes('textStyle').fontFamily ?? 'Arial'} ...>
```

When the `key` changes (cursor moves from Arial text to Courier text), React unmounts and remounts the Select component with the new value — guaranteeing the dropdown always shows what is actually under the cursor, not what was there the last time the user clicked it.

Additionally, `useTransition` + 250ms throttling is applied to the transaction handler to ensure high-frequency typing events do not cause the toolbar to re-render on every single keystroke, keeping the main thread fluid.

---

### 6.4 `history-controls.tsx` — Undo / Redo

Undo and Redo use plain `<button onClick>` elements, **not** Shadcn `<Toggle>` components. This is an important semantic distinction.

`<Toggle>` is designed for on/off binary states — it maintains a `pressed` boolean and fires `onPressedChange`. Undo and Redo are **one-shot actions** with no persistent state. Using `<Toggle>` caused them to occasionally misfire because Radix was trying to manage a pressed state that didn't exist. Plain `<button onClick={editor.chain().focus().undo().run()}` fires exactly once, reliably, every time.

---

### 6.5 `heading-controls.tsx` + `text-format-controls.tsx` — Toggle Buttons

H1, H2, H3, Bold, Italic, and Strikethrough are Shadcn `<Toggle>` components with:
- `pressed={editor.isActive(...)}` — Tiptap tells the toggle whether the format is active at the cursor.
- `onPressedChange={() => editor.chain().focus().toggle*().run()}` — clicking applies or removes the format.
- `data-[state=on]:bg-blue-100 data-[state=on]:text-blue-900` — a shared Tailwind class string provides the blue active highlight (the default Shadcn gray was nearly invisible).
- `onMouseDown={(e) => e.preventDefault()}` — preserves `storedMarks`.

---

### 6.6 `font-family-control.tsx` — The Radix Focus-Stealing Problem

The font family dropdown is a Radix `DropdownMenu`. Radix menus are designed for application navigation, not for embedded editor toolbars. They have an aggressive focus management system: opening the menu steals focus from the current focused element, and closing the menu attempts to return focus to a "safe" element — not necessarily the editor.

In a collaborative editor this is catastrophic. When the font dropdown opens, Yjs broadcasts the cursor position based on the editor's focus state. Losing focus causes the remote cursor highlight to disappear for all other connected users. The selection the user had made (to apply a font to highlighted text) is also wiped.

The fix has three parts:

1. **`modal={false}`** on `DropdownMenuContent` — prevents Radix from creating a focus trap or blocking pointer events on the rest of the page.
2. **`onOpenAutoFocus={(e) => e.preventDefault()}`** — blocks Radix from moving focus into the menu when it opens.
3. **`onCloseAutoFocus={(e) => e.preventDefault()}`** — blocks Radix from attempting to "restore" focus to some other element when the menu closes.
4. **Replace `DropdownMenuItem` with passive `<div>` elements** — `DropdownMenuItem` has its own focus management and keyboard navigation built in. Replacing it with a `<div onClick>` inside the menu content removes all Radix focus logic from individual items.

After these changes, the font dropdown opens and closes without the editor ever losing focus. The user's selection is preserved for the entire interaction.

---

### 6.7 `font-size-control.tsx` — Smart Contextual Default

The font size `<Select>` offers sizes from 8px to 72px. Its smart behaviour is the `getCurrentFontSize()` helper:

```ts
function getCurrentFontSize(editor: Editor): string {
  const fontSize = editor.getAttributes('textStyle').fontSize;
  if (fontSize) return fontSize; // e.g. "18px"
  // No inline style — infer from node type
  if (editor.isActive('heading', { level: 1 })) return '36px';
  if (editor.isActive('heading', { level: 2 })) return '24px';
  if (editor.isActive('heading', { level: 3 })) return '18px';
  return '16px'; // paragraph default
}
```

Without this helper, the font size dropdown would show blank/empty whenever the cursor is on a heading node — because headings get their size from CSS, not from an inline `font-size` style. The helper maps heading levels to their visual pixel equivalents, so the dropdown always shows a meaningful, accurate value regardless of where the cursor sits.

The Select is also positioned with `position="popper"` (not the default `position="item-aligned"`). This forces the dropdown to always appear directly below the toolbar button, avoiding a macOS-specific bug where native system overlays would obscure the dropdown items when positioned with the default strategy.

---

### 6.8 `color-control.tsx` — Reactive Circle + Empty-Doc Recovery

The color control has two behaviours that needed careful engineering:

**Reactive circle (current version)**: The color circle's `backgroundColor` is computed directly from `editor.getAttributes("textStyle").color` on every transaction re-render. If the cursor moves to red text, the circle turns red. Move to black text, it turns black. This makes the color control a true contextual indicator of what is under the cursor.

**Empty-document color recovery**: When a user deletes all content in the document, Tiptap strips every formatting mark, including color. The color circle correctly shows black. But the next thing the user types should ideally be in the color they had selected before clearing. We attach a `useEffect` to Tiptap's `update` event:

```ts
editor.on('update', () => {
  if (editor.isEmpty && colorRef.current !== '#000000') {
    queueMicrotask(() => editor.commands.setColor(colorRef.current));
  }
});
```

`queueMicrotask` is critical here. The first attempt placed `setColor` directly inside the `transaction` handler. But `setColor` itself creates a new transaction — which fires the `transaction` handler again — which calls `setColor` again — infinite recursion, crashing the browser tab. Using `queueMicrotask` defers the `setColor` call to the next microtask queue tick, *after* the current transaction has fully settled, breaking the synchronous cycle entirely.

---

### 6.9 `list-controls.tsx` — Alignment Preservation

Toggling between list types (bullet → task → ordered) in Tiptap deletes the current node and creates a new one of the requested type. The new node is created with no formatting attributes — which means text alignment is silently lost on every list type switch.

The fix is `toggleListAndPreserveAlignment(type)`, a transaction helper:

```ts
function toggleListAndPreserveAlignment(editor, type) {
  const align = ['left','center','right','justify']
    .find(a => editor.isActive({ textAlign: a })) ?? 'left';
  editor.chain()
    .focus()
    .toggleList(type)           // creates new node, drops alignment
    .setTextAlign(align)        // immediately re-applies the captured alignment
    .run();
}
```

Both operations happen inside a single `.chain()` call, making them a single atomic ProseMirror transaction. From the user's perspective the text never loses alignment — it switches list type and keeps its position in one instant operation.

The same helper is applied inside the slash command extension so that `/bullet`, `/ordered`, and `/task` slash commands also preserve alignment.

**The checklist Flexbox crash**: Checkboxes in task lists were initially styled with `display: flex` to put the checkbox and the text on the same line. This caused ProseMirror to throw `TextSelection endpoint not pointing into a node with inline content`. The reason: Flexbox creates invisible gap spaces between flex children. If a user clicked in the gap between the checkbox and the text, the browser resolved the click target to the `<li>` block element rather than the inline text paragraph inside it. ProseMirror's selection model requires selections to point into inline content — clicking the block-level gap violated this invariant.

The fix abandons Flexbox entirely in favour of absolute positioning:
- The `<li>` remains a normal block element.
- The checkbox label is `position: absolute; left: 0` — visually overlaid on the left of the block.
- `pointer-events: none` on the label, `pointer-events: auto` on the `<input>` — clicks on the checkbox still work, but clicks on empty space fall through to the text paragraph.
- The text `<p>` gets `padding-left: 1.5rem` — this pushes the text right to clear the checkbox while ensuring any click anywhere in the item lands safely inside the inline paragraph, not the block gap.

---

### 6.10 `link-control.tsx` — Ghost Marks and Selection Preservation

The link control involves a Radix `Popover` containing a URL text input. Three specific engineering problems had to be solved:

**1. The focus-steal problem**: Clicking the link button opened the popover, which hijacked keyboard focus. This blurred the editor and wiped the user's text selection before they could type a URL — meaning the link would be inserted at an empty cursor rather than wrapping the highlighted text. Fix: `onMouseDown={(e) => e.preventDefault()}` on the trigger button + `onOpenAutoFocus={(e) => e.preventDefault()}` on `PopoverContent`. The popover opens without touching focus. The selection stays intact until the user explicitly clicks into the URL input.

**2. Ghost mark resolution**: After a user creates a link and then deletes all its characters, Tiptap keeps the link mark alive in `storedMarks` — a "ghost mark". The next word the user types would become a link, even though there is no visible link in the document. Fix: an `onUpdate` observer watches for empty selections and scans the AST using `$from.nodeBefore` and `nodeAfter`. If it detects an orphaned link mark with no surrounding characters, it calls `.unsetLink()` to clean it up.

**3. Selection preservation after link creation**: When a user highlights text and creates a link over it, the default Tiptap behaviour collapses the selection to the end of the link after insertion. This makes the `LinkBubbleMenu` (Edit / Copy / Unlink) disappear immediately, forcing the user to re-click the link to see options. Fix: `extendMarkRange('link')` without calling `setTextSelection(to)` after — the selection stays on the entire linked text, the bubble menu remains visible.

---

### 6.11 `image-control.tsx` — Upload Flow

The image button triggers a hidden native `<input type="file" accept="image/*">`. The upload flow:

1. User selects a file. The button icon is replaced with a `Loader2` spinning animation (`isUploading = true`).
2. The file is appended to a `FormData` object and passed to the `uploadImage` server action.
3. The server action verifies authentication, checks MIME type starts with `image/`, enforces a 5MB size limit, constructs a collision-resistant filename (`${documentId}/${crypto.randomUUID()}.${ext}`), uploads to the `document-assets` Supabase Storage bucket, and returns the permanent public CDN URL.
4. The client receives the URL and inserts the image via `editor.chain().focus().setImage({ src: publicUrl }).run()`.
5. `e.target.value = ""` resets the file input so the same file can be uploaded again immediately if needed.

Using a server action for the upload is essential — the Supabase service role key (needed for storage writes) must never be exposed to the browser. The server action runs in the Node.js environment where environment variables are safe.

---

---

## 7. Real-Time Collaboration

Real-time collaborative editing is the defining feature of CollabDoc. Multiple users can open the same document simultaneously, see each other's cursors live, and type concurrently — even on the same word — without ever producing conflicting or corrupted output. This section explains exactly how that is achieved, from the mathematical foundations of CRDTs to the concrete engineering of the WebSocket server, the three Hocuspocus hooks, the frontend provider integration, and the offline resilience model.

---

### 7.1 Why CRDTs? The Problem with Naive Collaborative Editing

The naive approach to collaborative editing is **last-write-wins**: when two users edit the same document simultaneously, you pick one version and discard the other. This is obviously unacceptable — User A loses their work every time User B saves.

A slightly better approach is **Operational Transforms (OT)**, used by early versions of Google Docs. OT works by transforming each operation relative to concurrent operations. It is mathematically correct but notoriously complex to implement correctly, requiring a central server to sequence operations and resolve conflicts. It scales poorly.

**CRDTs (Conflict-free Replicated Data Types)** take a fundamentally different approach. A CRDT is a data structure with a mathematical merge function that is:
- **Commutative**: `merge(A, B) = merge(B, A)` — order doesn't matter.
- **Associative**: `merge(merge(A, B), C) = merge(A, merge(B, C))` — grouping doesn't matter.
- **Idempotent**: `merge(A, A) = A` — merging the same change twice is safe.

Because of these properties, any set of concurrent changes from any number of users will always merge to the **exact same result**, regardless of what order they arrive. No central sequencing server is needed. No changes are ever lost.

**Yjs** is the CRDT library we use. It implements a specific CRDT algorithm called YATA (Yet Another Transformation Approach) optimised for text editing. Every character insertion and deletion is represented as a CRDT operation. Yjs handles the merge math automatically — we just tell it what the user typed, and it ensures every client converges to the same document.

---

### 7.2 Why a Separate Node.js Server?

We run the Hocuspocus server in `/hocuspocus-server` as an entirely independent Node.js process, separate from Next.js. This is not a preference — it is a hard technical requirement.

**Vercel (and all serverless platforms) do not support persistent WebSocket connections.** A serverless function is stateless and short-lived: it spins up to handle a request, processes it, and is destroyed. A WebSocket requires a long-lived, persistent TCP connection that stays open for the entire duration of the user's editing session. These two models are fundamentally incompatible.

A standalone Node.js server (running on a traditional VM or container, e.g., Railway, Fly.io, or a VPS) maintains persistent TCP connections natively. Hocuspocus is specifically designed to run in this environment. It holds the current Yjs document state in memory for every open document, acting as the central relay: all connected clients send their updates to it, it merges them using Yjs, and broadcasts the merged state back to everyone.

The architecture:

```
Browser (User A)  ─── WebSocket ──→ ┌─────────────────────┐
Browser (User B)  ─── WebSocket ──→ │  Hocuspocus Server  │ ──→ Supabase (Postgres)
Browser (User C)  ─── WebSocket ──→ └─────────────────────┘
                                            ↑
                                     Next.js App
                                  (serves HTML pages)
                                  (handles API actions)
```

Next.js and Hocuspocus are completely decoupled. Next.js handles page rendering, server actions, and REST operations. Hocuspocus handles only the real-time WebSocket layer. They share only the Supabase database.

---

### 7.3 The Three Hocuspocus Hooks

Hocuspocus provides a lifecycle hook system. We implement three critical hooks in `/hocuspocus-server/src/index.ts`:

#### `onAuthenticate`

Fires when a client first connects via WebSocket. The client passes the user's Supabase JWT `access_token` as part of the WebSocket connection parameters.

```ts
async onAuthenticate({ token }) {
  const supabase = createClient();
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) throw new Error('Unauthorized');
  // attach user to connection context for use in other hooks
  return { user };
}
```

This validates the JWT against Supabase's auth server on every new connection. An expired token, a forged token, or a missing token all result in an immediate connection rejection. The Hocuspocus server never trusts that a connected client is authenticated simply because they know a document ID — every connection must present a valid, live JWT.

#### `onLoadDocument`

Fires when a client connects to a document that is not yet loaded in the server's memory (e.g., after a server restart, or when the first user opens a document).

```ts
async onLoadDocument({ documentName, document }) {
  const { data } = await supabase
    .from('document_content_state')
    .select('ydoc_state')
    .eq('document_id', documentName)
    .single();

  if (data?.ydoc_state) {
    const binaryState = Buffer.from(data.ydoc_state, 'base64');
    Y.applyUpdate(document, binaryState);
  }
}
```

`documentName` is the document's UUID (passed from the frontend). The hook fetches the previously saved binary Yjs state from Supabase, decodes it from base64 back to a `Uint8Array`, and applies it to the in-memory Yjs document instance via `Y.applyUpdate()`. After this call, the in-memory document is byte-for-byte identical to the last saved state. Any connecting client immediately receives the full document history.

#### `onStoreDocument`

Fires whenever the Yjs document state changes — which happens on every keystroke from any connected user.

```ts
async onStoreDocument({ documentName, document }) {
  const binaryState = Y.encodeStateAsUpdate(document);
  const base64State = Buffer.from(binaryState).toString('base64');

  await supabase
    .from('document_content_state')
    .upsert(
      { document_id: documentName, ydoc_state: base64State },
      { onConflict: 'document_id' }
    );
}
```

`Y.encodeStateAsUpdate()` serialises the entire Yjs document — the full CRDT history — into a compact binary `Uint8Array`. We encode it as base64 for storage in Postgres (which doesn't have a native binary column type in our schema). The `upsert` with `onConflict: 'document_id'` is critical: without it, the first save attempts an `INSERT` which succeeds, but every subsequent save also attempts an `INSERT` which fails with a Unique Constraint violation because the row already exists. The `onConflict` directive tells Postgres to `UPDATE` the existing row instead.

**Why store binary Yjs state instead of HTML or JSON?**
The Yjs binary state is the full CRDT — it encodes not just the current content but the entire history of operations, including tombstoned (deleted) characters. This is what allows Yjs to correctly merge offline edits: when a user reconnects after typing offline, Yjs applies their operations against the full history, not just the current snapshot. Storing only HTML or JSON would lose this history and break offline merge.

---

### 7.4 Frontend Provider Integration (`editor.tsx`)

On the client side, the `Editor` component sets up the Hocuspocus connection:

```ts
// 1. Create a stable Y.Doc stored in useState
const [ydoc] = useState(() => new Y.Doc());

// 2. Create the Hocuspocus provider
const provider = new HocuspocusProvider({
  url: process.env.NEXT_PUBLIC_HOCUSPOCUS_URL, // ws://localhost:1235
  name: documentId,       // document UUID — maps to documentName on the server
  document: ydoc,
  token: accessToken,     // Supabase JWT, validated in onAuthenticate
  onStatus: ({ status }) => {
    if (status === 'connected') setSyncState('saved');
    if (status === 'disconnected') setSyncState('offline');
  },
});

// 3. Pass the ydoc to Tiptap's CollaborationExtension
const extensions = [
  Collaboration.configure({ document: ydoc }),
  CollaborationCursor.configure({
    provider,
    user: { name: userName, color: cursorColor },
  }),
  // ... all other extensions
];
```

**Why `useState(() => new Y.Doc())`?** React Strict Mode double-invokes component bodies in development. If `new Y.Doc()` were called as a plain expression, Strict Mode would create two Y.Doc instances on mount — the provider binds to one, Tiptap's extension binds to the other, and they diverge immediately. Storing the Y.Doc in `useState` with an initialiser function ensures it is created exactly once and survives Strict Mode's double-render.

**The `accessToken` source**: On the document page server component, we call both `supabase.auth.getUser()` (for identity, validated against Supabase servers) and `supabase.auth.getSession()` (only to extract the raw JWT string). The JWT string is passed as a prop to the `Editor`. We cannot use `getUser()` for the JWT because `getUser()` doesn't return the token string — it only returns the user object.

---

### 7.5 Live Cursors — `CollaborationCursor`

Every connected user's cursor position is broadcast to all other clients in real time. The `@tiptap/extension-collaboration-cursor` extension handles this using Yjs's **Awareness** protocol — a separate, non-persistent channel for ephemeral data like cursor positions and presence info.

Each user has:
- A **name** (from their Supabase profile)
- A **color** — deterministically assigned from a palette of vibrant Tailwind colors based on the user's ID hash, so the same user always gets the same color across sessions

Tiptap renders remote cursors as:
- `.collaboration-cursor__caret` — the blinking vertical line at the remote cursor's position
- `.collaboration-cursor__label` — a floating name chip above the caret

We define custom CSS for both in `globals.css`:
- `collaboration-cursor__label` gets a drop shadow, border-radius, and smooth `opacity` + `translateY` entry animation — the label fades and slides in when a collaborator connects
- Each user's color is applied via an inline CSS variable set by the extension, which our CSS consumes for the background of the label chip and the color of the caret line

---

### 7.6 Live Presence in the Header (`ActiveUsersCluster`)

Beyond the in-document cursors, the document header shows a cluster of circular avatar bubbles — one for each user currently connected to the document via WebSocket.

This data comes from Hocuspocus's **Awareness** system, accessed on the frontend via:

```ts
provider.on('awarenessUpdate', ({ states }) => {
  const users = Array.from(states.values()).map(state => ({
    name: state.user?.name,
    avatar: state.user?.avatar,
    color: state.user?.color,
  }));
  setActiveUsers(users); // updates DocumentContext
});
```

`states` is a `Map` of `clientId → awarenessState`. Each entry represents one connected WebSocket client. The `Editor` maps these into `ActiveUser` objects and pushes them into `DocumentContext` via `setActiveUsers`. The `ActiveUsersCluster` component in the header reads `activeUsers` from context and renders an overlapping avatar row with `TooltipProvider` showing "Online Now" on hover.

The cursor color ring on each header avatar matches the color of that user's in-document caret — creating a visual link between the header presence indicator and the cursor visible in the document body.

---

### 7.7 The Sync State Indicator

The Editor drives three sync states via `DocumentContext`:

| State | When | Header Display |
|---|---|---|
| `saving` | Provider is actively writing to Supabase | Pulsing animated cloud icon |
| `saved` | Last save completed successfully | Cloud with checkmark |
| `offline` | WebSocket disconnected | Amber warning icon + "Offline" text |

The transition from `saving` to `saved` is driven by Hocuspocus's `onSynced` callback — it fires after the `onStoreDocument` hook completes successfully, confirming the binary state actually reached Postgres.

---

### 7.8 Offline Resilience

If the user's internet drops while editing, the WebSocket connection closes. The provider's `onStatus` callback fires with `status: 'disconnected'`, setting `syncState('offline')`. The `OfflineBanner` component (rendered inside the editor container above the page content) becomes visible:

> ⚠️ **You are offline.** Changes are being saved locally and will sync when you reconnect.

The user can **continue typing** — this is the CRDT guarantee. Yjs stores every operation locally in the in-memory Y.Doc. When the WebSocket reconnects, the provider automatically sends the locally accumulated operations to Hocuspocus. Hocuspocus applies them via Yjs's CRDT merge — if other users also typed while this user was offline, all changes are merged mathematically without conflict. No data is lost, and no human resolution is required.

The offline banner does not block or dim the editor. Blocking the UI would be counterproductive — the CRDT model exists precisely so users can work through network interruptions seamlessly. The banner is purely informational.

---

### 7.9 The `tsx` Runtime and Why `ts-node` Was Replaced

The Hocuspocus server originally used `ts-node` with `nodemon` for hot reloading during development. After a Node.js v24 upgrade, this setup broke severely:

- `ts-node/esm` is deprecated in Node v24+, throwing `ExperimentalWarning: `--experimental-vm-modules`` and `fs.Stats` deprecation errors on every startup.
- Cached `nodemon` processes held port `1235` open across restarts, causing `EADDRINUSE: address already in use` crashes.

We migrated to **`tsx`** (TypeScript Execute), built on `esbuild`. It:
- Starts in under 100ms (vs several seconds for `ts-node`)
- Produces zero deprecation warnings on Node v24+
- Has a built-in `--watch` flag for hot reloading without `nodemon`
- Handles ES Module syntax natively without `--experimental-vm-modules`

The `package.json` dev script: `"dev": "tsx --watch src/index.ts"`.

---

## 8. Pagination

Pagination is one of the most deceptively complex features in the entire project. On the surface it sounds simple — split the document into pages. In practice, making a continuous, collaborative, CRDT-driven rich text editor behave like a physical stack of A4 sheets without corrupting a single byte of document data is a genuinely hard problem. This section explains the challenge, the solution we chose, every configuration property we set, and the CSS bugs that nearly broke it.

---

### 8.1 Why Pagination Is Hard in a Rich Text Editor

Tiptap and its underlying engine ProseMirror represent a document as a continuous tree of nodes. A heading, a paragraph, a table cell, a list item — all of them are sequential nodes in a single, unbroken data structure. There are no "pages" in this model. The document is one infinite scroll.

The naive way to add pagination is to introduce a physical `pageBreak` node into the ProseMirror schema — a special node type that acts as a divider in the data. But this approach has a cascade of catastrophic consequences in a collaborative system:

- **Schema corruption**: Yjs synchronises the ProseMirror document tree. Injecting fake structural nodes means those nodes are synchronised to every collaborator and persisted into the database. The document's JSON snapshot now contains page-break noise that must be stripped before rendering anywhere else (cards, previews, exports).
- **Copy-paste breakage**: A user copying a paragraph across a page break would copy the page-break node itself. Pasting it elsewhere would insert a phantom structural node in the middle of the target text.
- **CRDT conflicts**: If two users simultaneously type near a page break node, Yjs's merge algorithm has to reconcile operations against a node type it was never designed to understand.

The correct approach is to add pagination **purely at the view layer** — as visual decorations on top of the existing data — without ever touching the underlying JSON.

---

### 8.2 The Package: `tiptap-pagination-plus`

We use the community package `tiptap-pagination-plus` to implement pagination. It is a Tiptap extension that operates entirely via **ProseMirror Decorations**.

Decorations are a first-class ProseMirror concept: they are visual overlays injected into the rendered DOM that have **zero effect on the document data model**. ProseMirror renders decorations as floating DOM elements positioned at specific points in the editor view. They are invisible to Yjs, invisible to `getJSON()`, invisible to `generateHTML()`, and invisible to copy-paste. They exist only for the person looking at the screen.

**How `tiptap-pagination-plus` works under the hood:**

1. It registers a listener on every editor `update` event — every keystroke, paste, or formatting change that modifies the document.
2. On each update, it measures the real rendered DOM height of every block node from the top of the editor downward.
3. When the cumulative height exceeds the defined `pageHeight` (1123px for A4), it calculates the exact insertion point and injects a **"Page Breaker" widget decoration** at that position.
4. The widget decoration is a floated `<div>` spanning the full page width. It creates a physical visual gap — a grey strip of `pageGap` height — between the bottom of the last paragraph that fit on the page and the first paragraph that overflows to the next.
5. Page number footers and header/footer zones are rendered as additional decorations above and below each page gap.
6. On the next update (if the user deletes text and a page shrinks back), the extension recalculates and removes the decoration. Pages reflow dynamically, exactly like a word processor.

The critical guarantee: the document's `getJSON()` output is identical whether the document has 1 page or 100 pages. The pagination is cosmetic all the way down.

---

### 8.3 Configuration: Every Property Explained

The extension is configured inside `editor.tsx`. Every value was chosen to exactly match the physical dimensions of an A4 sheet at 96 DPI (the standard screen resolution):

```ts
PaginationPlus.configure({
  pageWidth: 794,
  pageHeight: 1123,
  marginTop: 72,
  marginBottom: 72,
  marginLeft: 64,
  marginRight: 64,
  contentMarginTop: 8,
  contentMarginBottom: 8,
  pageGap: 40,
  pageGapBorderColor: 'transparent',
  pageBreakBackground: 'var(--rm-page-break-bg, #f4f4f5)',
  headerLeft: '',
  headerRight: '',
  footerLeft: '',
  footerRight: 'Page {page}',
})
```

**`pageWidth: 794`**
The internal width of the page container in pixels. 210mm (A4 width) × (96px / 25.4mm) = 793.7px, rounded to 794. This is the value the extension uses to set the editor's internal container width and to calculate the width of page-break decorations.

**`pageHeight: 1123`**
The pixel height at which the extension triggers a page break. 297mm (A4 height) × (96px / 25.4mm) = 1122.5px, rounded to 1123. When the cumulative rendered content height crosses this threshold, a new page begins.

**`marginTop: 72` and `marginBottom: 72`**
The white space reserved at the very top and bottom edges of each page, between the physical page boundary and the header/footer zones. 72px ≈ 0.75 inches — a standard document print margin. This space is visually empty: it creates the "breathing room" that makes the editor feel like actual paper rather than a cramped HTML div.

**`marginLeft: 64` and `marginRight: 64`**
The horizontal padding inside each page. Text never touches the left or right edges of the white page card. 64px gives roughly 17mm of side margin — slightly narrower than the top/bottom margin, which is conventional in word processors.

**`contentMarginTop: 8` and `contentMarginBottom: 8`**
A secondary inner padding applied specifically between the header/footer zones and the first/last line of body text on each page. This is a buffer zone — without it, the bottom of the last text line on a page would be pixel-adjacent to the "Page X" footer number, which looks cramped and amateurish. 8px provides a clean visual separation.

**`pageGap: 40`**
The height in pixels of the grey strip rendered between the bottom edge of one page and the top edge of the next. 40px was chosen after visual testing — it is large enough to make the page boundary obvious and feel like physical space between sheets of paper, but small enough that users do not need to scroll significantly between pages.

**`pageGapBorderColor: 'transparent'`**
The extension's default behaviour is to render a visible border line around the page gap. We disable this entirely — set to `transparent` — because the visual depth is achieved instead through Tailwind CSS box-shadow utilities applied to the white page cards. Letting the extension draw its own border would duplicate the visual treatment and create a hard pixel line that fights the softer box-shadow.

**`pageBreakBackground: 'var(--rm-page-break-bg, #f4f4f5)'`**
This maps the gap's background colour to a CSS variable, with `#f4f4f5` (a light grey) as the fallback. The reason this is a CSS variable rather than a hardcoded hex value: the app supports dark mode. In dark mode, `--rm-page-break-bg` is overridden in `globals.css` to the dark surface colour. Without this, the grey gap between pages would remain light grey in dark mode — a jarring bright stripe cutting across a dark editor.

**`headerLeft: ''` and `headerRight: ''`**
The extension supports injecting document metadata (like the document title) into the top header zone of every page — the same way Microsoft Word can auto-populate page headers. We explicitly set both to empty strings `''`. CollabDoc's design philosophy is a distraction-free editing surface. A title header on every page is a print-document convention that feels out of place in a web collaborative editor.

**`footerLeft: ''`**
The bottom-left footer zone is also empty. No document metadata, no author name. Keeping it clean.

**`footerRight: 'Page {page}'`**
The bottom-right footer injects the literal string `Page {page}` into every page. The extension resolves `{page}` using CSS `counter-reset` and `counter-increment` — native CSS counters that auto-increment as the browser renders each successive page decoration. The result is "Page 1", "Page 2", "Page 3" — correctly numbered, automatically maintained, requiring zero JavaScript state management. If the user types enough to push a paragraph to a new page, page numbers reflow instantly.

---

### 8.4 The `max-w-none` Fix — The Bug That Squished All Text

After installing the pagination extension, we encountered a severe CSS layout bug: all text in the editor was squished into a single-character-wide column. A paragraph that should span the full 794px page was rendering as a 1-2 character wide column wrapping vertically.

**Root cause**: Tailwind Typography's `.prose` class.

Tiptap applies `.prose` to its editor container for baseline text styling (font sizes, line heights, heading weights). Tailwind Typography's `.prose` class also enforces a hard `max-width: 65ch` constraint — approximately 520px — on its container. This is intentional for body text readability in article layouts: lines longer than ~65 characters are harder to read.

The pagination extension works by injecting floated `<div>` elements into the editor's DOM. These floats span the full 794px page width. When the browser's layout engine encounters a 65ch-limited container with a 794px float inside it, it does what the CSS spec says: it wraps the block content around the float in the remaining space. But the remaining space after a 794px float inside a 65ch (~520px) container is mathematically negative — the float is wider than the container. The browser resolves this by collapsing the text column to effectively zero usable width, resulting in single-character-wide wrapping.

**The fix**: Adding `max-w-none` to the Tiptap `editorProps` class list.

```ts
editorProps: {
  attributes: {
    class: 'prose prose-sm max-w-none focus:outline-none',
  },
},
```

`max-w-none` overrides Tailwind Typography's `max-width: 65ch` constraint, setting `max-width: none`. The editor container is now free to expand to whatever its parent allows — which is 794px, as set by the pagination extension. Text renders at full A4 width exactly as intended.

---

### 8.5 Why the Document JSON Never Changes

This point deserves its own section because it has important implications for every other part of the system that reads document data.

The pagination extension operates in a `DecorationSet` — a ProseMirror-managed set of visual overlays attached to the editor view. When you call:

- `editor.getJSON()` — pagination decorations are absent. The output is pure document content.
- `editor.getHTML()` — same. Pure content HTML, no page dividers.
- `Y.encodeStateAsUpdate(ydoc)` — the binary Yjs state contains only document operations. No pagination data.
- `generateHTML(json, extensions)` — used for card preview thumbnails. The output has no pages. The thumbnail shows continuous text, which is correct for a small scaled preview.

This means:
- The database stores only real content — no pagination schema pollution.
- The Hocuspocus server's `onStoreDocument` hook saves and loads clean Yjs states with no page-break artefacts.
- Dashboard card previews work perfectly — they call `generateHTML` on the same JSON and render continuous content scaled down to card size.
- Future export features (PDF, Word) can use the same JSON without pre-processing to strip out structural noise.

The pagination extension is entirely self-contained at the view layer. It reads the same state everyone else reads, draws its decorations on top, and disappears when the view is destroyed.

---
## 9. Skeleton Loading

Skeleton loading is not just a visual nicety — in a Next.js App Router application, it is an architectural pattern that directly affects how React renders pages, how the browser perceives load performance, and whether users experience jarring layout shifts. This section covers every skeleton surface in CollabDoc, why each one exists, how it is built, and the specific bugs it solves.

---

### 9.1 The Problem Skeleton Loaders Solve

When a user navigates to the dashboard, the server has to query Supabase for their documents before any real content can be rendered. This takes time — typically 80–300ms depending on database load and network latency. Without a skeleton, the user sees one of two bad outcomes:

- **A blank white screen**: The browser shows nothing until the server responds. The user has no idea if the app is working.
- **A layout flash**: The page renders a partially-hydrated shell, then the content pops in — causing the entire grid to jump position as elements load in and push others around. This is measured as **Cumulative Layout Shift (CLS)** — a Core Web Vitals metric that penalises sites for unstable layouts.

A skeleton loader solves both. It renders immediately from a `loading.tsx` file (which Next.js wraps in a React Suspense boundary automatically). It fills the exact same space the real content will occupy. When the real content loads, React's reconciliation engine swaps the skeleton for the content in place — zero shift, zero jump, zero blank screen.

---

### 9.2 Next.js `loading.tsx` — How It Works

Next.js 15's App Router has a built-in convention: if you create a `loading.tsx` file alongside a `page.tsx`, Next.js automatically wraps that page in a `<Suspense>` boundary and renders `loading.tsx` as the fallback while the page's async data fetching completes.

```
app/
└── dashboard/
    ├── (home)/
    │   ├── page.tsx        ← async Server Component, queries Supabase
    │   └── loading.tsx     ← renders DocumentListSkeleton immediately
    └── [docId]/
        └── page.tsx        ← document editor page
```

The user hits `/dashboard`. Next.js immediately streams `loading.tsx` to the browser — no waiting. The browser renders the skeleton instantly. Simultaneously, the server begins executing `page.tsx`'s async data fetching. When the data resolves, Next.js streams the real page content and React swaps it in.

This is **streaming SSR**: the browser receives and renders HTML in chunks rather than waiting for the entire page to be ready. The skeleton is the first chunk. The real content is the second.

---

### 9.3 The `(home)` Route Group — Isolating the Skeleton

Here is the subtle and important architectural problem that required creating the `(home)` route group.

In Next.js, a `loading.tsx` file applies to its route **and every nested child route underneath it**. Initially, the file structure was:

```
app/dashboard/
├── page.tsx        ← dashboard list
├── loading.tsx     ← skeleton
└── [docId]/
    └── page.tsx    ← document editor
```

With this structure, `loading.tsx` sat at the `dashboard/` level. Because `[docId]` is a child of `dashboard/`, Next.js applied the same `loading.tsx` to document navigation too. This caused a serious UX bug: when a user clicked a document card to navigate to `/dashboard/abc-123`, the dashboard skeleton loader would flash on the screen during the transition — a pulsing grey grid appearing briefly before the document editor loaded. The skeleton was built for the dashboard list, not the editor. It looked like a glitch.

**The fix: a Next.js Route Group.**

Route Groups are folders wrapped in parentheses: `(home)`. They are invisible to the URL routing system — `/dashboard` still works exactly the same. But they create a new scope boundary for Next.js layout and loading files. By moving `page.tsx` and `loading.tsx` into `(home)`:

```
app/dashboard/
├── (home)/
│   ├── page.tsx        ← dashboard list
│   └── loading.tsx     ← skeleton ONLY for this route
└── [docId]/
    └── page.tsx        ← document editor, loading.tsx does NOT apply here
```

Now `loading.tsx` is strictly scoped to `(home)/page.tsx`. Navigating to a document route completely bypasses the skeleton. The transition goes directly from the dashboard grid to the document editor with no skeleton flash.

---

### 9.4 `DocumentListSkeleton` — The Dashboard Card Grid Skeleton

The `DocumentListSkeleton` component is a pixel-accurate replica of the dashboard document grid in its loading state.

**Why pixel-accurate matters**: If the skeleton's dimensions do not match the real content exactly, React's swap will cause a layout shift — the skeleton occupies slightly different space, and elements jump when replaced. CLS > 0. The skeleton must be structurally identical to what will replace it.

The dashboard card grid is a 3-column responsive grid of `h-[280px]` landscape cards. The skeleton renders the same:
- A `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` container — same responsive breakpoints as the real grid.
- Six skeleton cards — matching the `PAGE_SIZE = 6` documents per page limit.
- Each skeleton card is `h-[280px]` — exactly matching the real `DocumentCard` height.
- Each card has two visual sections:
  - **Top section** (`h-[180px]`): A `rounded-t-xl bg-muted animate-pulse` block representing the document preview area.
  - **Bottom section** (`h-[100px]`): Contains three horizontal skeleton bars of varying widths representing the title, role badge, and timestamp metadata.

Tailwind's `animate-pulse` class applies a `@keyframes pulse` animation — a smooth opacity oscillation between `100%` and `40%` — that makes the grey blocks appear to breathe. This is the universal skeleton "shimmer" pattern that signals to users that content is loading rather than broken.

The skeleton also replicates the pagination row at the bottom — a row of grey pill shapes where the "Previous" / "Next" buttons will appear. This prevents the pagination row from popping in below the grid after load and pushing the footer down.

---

### 9.5 The Shadcn `Skeleton` Primitive

The skeleton blocks are built on Shadcn UI's `<Skeleton>` component (`npx shadcn@latest add skeleton`).

```tsx
import { Skeleton } from '@/components/ui/skeleton'

// Usage:
<Skeleton className="h-[180px] w-full rounded-t-xl" />
<Skeleton className="h-4 w-3/4" />
<Skeleton className="h-3 w-1/2" />
```

The `Skeleton` component is a single `<div>` with `animate-pulse bg-muted rounded-md` applied. It has no logic — it is purely a styled placeholder. Its value is semantic clarity: `<Skeleton>` communicates intent far more clearly than `<div className="animate-pulse bg-muted rounded-md h-4 w-3/4">` across a codebase, and it inherits the correct `--muted` CSS variable from the design system, ensuring skeleton colours stay consistent when the user switches between light and dark mode.

---

### 9.6 The `opacity-0` Fade-In Pattern — Preventing the Hard Swap

When the real content loads and replaces the skeleton, a naive implementation produces a hard cut — the skeleton is visible one frame, the real grid is visible the next. Even without a layout shift, this feels jarring: the visual weight of the page changes instantly.

We solve this with the `opacity-0 animate-[fade-in_0.2s_ease-out_forwards]` pattern applied to the real content container:

```css
/* globals.css */
@keyframes fade-in {
  from { opacity: 0; }
  to   { opacity: 1; }
}
```

```tsx
<div className="opacity-0 animate-[fade-in_0.2s_ease-out_forwards]">
  {/* real document cards */}
</div>
```

The `opacity-0` initial state means the real content starts invisible. The `animate-[...]` class triggers the `fade-in` keyframe immediately on mount. `forwards` fill mode means the element stays at `opacity: 1` after the animation completes rather than snapping back to `opacity: 0`.

The result: when the server data arrives and React swaps in the real grid, the grid fades in smoothly over 200ms. The transition from skeleton to content looks like a dissolve rather than a cut. This is the same animation applied to the document card previews (500ms duration there) and the editor container — three separate surfaces all using the same underlying pattern for visual consistency.

---

### 9.7 The `DocumentPreview` Fade-In — Inside the Card

Within each real document card, there is a second, independent loading transition: the card preview thumbnail.

The dashboard card renders immediately with the card shell (title, badges, metadata) but the preview area has its own two-phase render:

**Phase 1 — SVG Placeholder**: An SVG graphic (a stylised document icon) renders immediately as a grey placeholder inside the preview area. This is fast because it requires no data — it is a static inline SVG.

**Phase 2 — HTML Preview**: The `useDocumentPreview` hook calls `generateHTML(previewJson, extensions)` to produce real rendered HTML from the stored document JSON. This is a CPU-side operation (not a network request) but it involves parsing a potentially complex JSON tree and generating HTML strings, which takes a few milliseconds.

The switch from Phase 1 to Phase 2 uses `requestAnimationFrame`:

```ts
requestAnimationFrame(() => setShowPreview(true));
```

`requestAnimationFrame` defers the state update to the next browser paint frame. This guarantees that the SVG placeholder has been painted to screen before the state update triggers a re-render that mounts the HTML preview. Without this deferral, the preview HTML and the placeholder can mount in the same paint frame — the placeholder is never visible and the preview appears to "snap in" from nothing.

Both the SVG and the HTML preview are always present in the DOM simultaneously, stacked via `absolute` positioning. The HTML preview starts at `opacity-0` and transitions to `opacity-100` using `transition-opacity duration-500 ease-in-out`. The SVG placeholder fades out simultaneously. The result is a smooth 500ms cross-dissolve from the placeholder to the real preview — the same dissolve pattern used everywhere in the app.

---

### 9.8 `useSyncExternalStore` — The SSR/Hydration Safety Guard

`generateHTML()` from `@tiptap/react` internally accesses browser APIs. If Next.js attempts to run it during server-side rendering (before the page reaches the browser), it throws a runtime error. Additionally, if the server renders the SVG placeholder and the client then immediately renders the HTML preview, React's hydration system detects a mismatch between server-rendered HTML and client-rendered HTML and throws a hydration error.

The solution is `useSyncExternalStore` — a React hook specifically designed to return different values on the server vs the client without causing a hydration mismatch:

```tsx
const mounted = useSyncExternalStore(
  () => () => {},   // subscribe: no-op (we don't need subscriptions)
  () => true,       // client snapshot: returns true after hydration
  () => false       // server snapshot: returns false during SSR
);
```

During SSR: `mounted = false` → render only the SVG placeholder → no `generateHTML` call → no browser API access → no error.

After hydration: `mounted = true` → run `generateHTML` → fade in the real HTML preview.

**Why not `useEffect + useState`?** The classic alternative is:

```ts
const [mounted, setMounted] = useState(false);
useEffect(() => { setMounted(true); }, []);
```

This produces a hydration mismatch: the server renders `mounted = false`, the initial client render also has `mounted = false` (hydration-safe), but then `useEffect` fires, `setMounted(true)` triggers a second client render with `mounted = true`. React processes this as a post-hydration update — it causes an extra render cycle and, depending on timing, can produce brief visual flickers. `useSyncExternalStore` resolves to the correct value in a single render pass on each environment, with no extra cycle needed.

---

### 9.9 The `PageThumbnails` Sidebar Fade-In

The page thumbnails sidebar in the document editor (covered in detail in Section 10) also uses the fade-in pattern. When the sidebar opens, the thumbnail content starts at `opacity-0` and fades to `opacity-100` with a 500ms CSS transition. This prevents the sudden appearance of six or more thumbnail images simultaneously, which would feel visually jarring — especially on large documents where all thumbnails render at once.

The sidebar panel itself uses a width transition for its open/close animation:

```css
transition-[width] duration-300 ease-in-out
```

Width animates between `16rem` (open) and `0` (closed). The content inside fades independently. Both elements are always present in the DOM — neither is conditionally mounted or unmounted. Conditional mounting would prevent CSS transitions from firing (you cannot transition an element that doesn't exist yet). By always keeping both the panel and the toggle button in the DOM and animating their visual properties, the sidebar slides open and closed smoothly rather than snapping.

---
## 10. Page Thumbnails Sidebar

The Page Thumbnails Sidebar is the collapsible left panel in the document editor that renders real-time miniature previews of every page — the same feature you find in Google Docs and Microsoft Word. It looks simple from the outside: a column of small page images that scroll with you and let you jump to any page. But building it correctly inside a collaborative, dynamically-paginated Tiptap editor required solving three distinct hard problems: performant DOM observation, a Tiptap-specific DOM recycling bug that caused navigation to scroll to the wrong page, and smooth open/close animation without React unmounting the panel.

---

### 10.1 Architecture Overview

The sidebar lives in `page-thumbnails.tsx`, a Client Component mounted to the left side of the editor layout. It is positioned alongside the Tiptap editor container in a flex row:

```
┌──────────────────────────────────────────────────────┐
│  [Thumbnails Panel]  │  [A4 Editor Pages]             │
│  16rem wide          │  flex-1                        │
└──────────────────────────────────────────────────────┘
```

The component has two responsibilities:
1. **Observe** the Tiptap editor DOM for content changes and extract page HTML.
2. **Render** those extracted pages as scaled-down thumbnails and respond to click events by scrolling the editor to that page.

It receives a single prop: a `ref` pointing to the Tiptap editor's outer container DOM node, which is used to attach the `MutationObserver`.

---

### 10.2 How Pages Are Detected — The `MutationObserver`

The pagination extension (`tiptap-pagination-plus`) injects `.page` CSS class nodes into the editor's DOM as visual decorations. Each logical A4 page is wrapped in a `<div class="page">` element. The number of `.page` divs in the DOM at any moment equals the current page count of the document.

The thumbnails sidebar needs to know when pages are added, removed, or their content changes. The mechanism for watching DOM changes without controlling the source (Tiptap controls its own DOM) is a `MutationObserver`:

```ts
const observer = new MutationObserver(() => {
  debouncedExtract();
});

observer.observe(editorRef.current, {
  childList: true,
  subtree: true,
  characterData: true,
});
```

- **`childList: true`**: Watch for nodes being added or removed (new pages being created, pages merging when text is deleted).
- **`subtree: true`**: Watch the entire subtree of the editor container, not just its direct children. Page content is nested deeply — paragraphs inside `.page` divs inside the ProseMirror root.
- **`characterData: true`**: Watch for text content changes inside existing nodes. Without this, typing within an existing page would not trigger the observer, because the paragraph node itself is not added or removed — only its text content changes.

The observer fires on every DOM mutation. With `subtree: true` and `characterData: true`, that means it fires on literally every keystroke. This cannot trigger a React state update directly — doing so would cause a re-render on every character typed, which is catastrophically expensive when each re-render involves cloning and processing six or more page DOM nodes.

---

### 10.3 The `useDebounce` Hook — Making Observation Affordable

Between the `MutationObserver` callback and the actual thumbnail extraction logic sits a **500ms debounce**:

```ts
const debouncedExtract = useDebounce(() => {
  extractPages();
}, 500);
```

`useDebounce` wraps a function in a `setTimeout`. Every time the debounced function is called, the timer resets. The wrapped function only executes after 500ms of silence — meaning 500ms with no DOM mutations.

In practice: the user types rapidly. The `MutationObserver` fires dozens of times per second. The debounce absorbs all of those calls and waits for the user to pause. When they stop typing for half a second, `extractPages()` runs once. The thumbnails update once. No intermediate states. No intermediate re-renders.

500ms was chosen deliberately. It is short enough that thumbnails feel live — a user who types a paragraph and pauses sees their thumbnail update within half a second. It is long enough that fast typing never triggers mid-word thumbnail updates that would show incomplete sentences.

---

### 10.4 `extractPages()` — Cloning and Rendering Thumbnails

When the debounce fires, `extractPages()` queries the live DOM for all current page nodes:

```ts
function extractPages() {
  const pageNodes = editorRef.current?.querySelectorAll('.tiptap .page');
  if (!pageNodes) return;

  const htmlArray = Array.from(pageNodes).map(node => node.outerHTML);
  setPageHTMLs(htmlArray);
}
```

`querySelectorAll('.tiptap .page')` returns a `NodeList` of every `.page` div currently in the editor DOM. `.outerHTML` on each node produces the complete HTML string of that page — including all its nested paragraphs, headings, tables, images, lists, and inline styles exactly as Tiptap rendered them.

These HTML strings are stored in `pageHTMLs` state as an array. The render function maps over this array:

```tsx
{pageHTMLs.map((html, i) => (
  <div
    key={i}
    onClick={() => scrollToPage(i)}
    className="cursor-pointer rounded border hover:border-primary transition-colors"
  >
    <div
      className="pointer-events-none origin-top-left scale-[0.282]"
      style={{ width: '354%', height: '354%' }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  </div>
))}
```

**The scale math**: Each A4 page is 794px wide. The thumbnail container is approximately 224px wide (inside a 16rem sidebar with padding). The scale factor is 224 / 794 ≈ 0.282. Because CSS `transform: scale()` does not affect layout flow (the element still occupies its original unscaled dimensions in the document), the container's `width` and `height` are set to `354%` (the inverse of the scale: 1 / 0.282 ≈ 3.546) so the full A4 content is visible before scaling. This is the same inverse-scale pattern used in the dashboard card previews.

`pointer-events-none` on the scaled content prevents accidental link clicks or focus events inside the thumbnail. The click handler belongs to the outer wrapper, not the inner content.

---

### 10.5 The DOM Recycling Bug — Why Static IDs Break Navigation

The first implementation of thumbnail click navigation stored a static `id` attribute on each `.page` div during extraction:

```ts
// BROKEN approach
node.setAttribute('id', `page-${i + 1}`);
```

Then on thumbnail click:

```ts
// BROKEN approach
document.getElementById(`page-${i + 1}`)?.scrollIntoView({ behavior: 'smooth' });
```

This appeared to work in testing — but broke in production in a specific scenario: when the document was long enough to have many pages and the user scrolled down past the first few.

**The root cause**: Tiptap (via ProseMirror) recycles DOM nodes internally for performance. ProseMirror does not keep a fixed DOM node for each logical document position. As the user scrolls, ProseMirror shifts the physical DOM elements — the `<div>` that was rendering Page 1's content can be physically relocated in the DOM to render Page 3's content, with only its inner content replaced. The element's position in the DOM tree changes, but if we set a static `id="page-1"` on it, that `id` travels with the element to its new position.

The result: `document.getElementById('page-1')` finds the DOM element that originally rendered Page 1 — but that element is now at the DOM position of Page 3. Clicking the "Page 1" thumbnail scrolls to Page 3. Clicking "Page 3" scrolls somewhere else entirely. The mapping is completely wrong.

**The fix: query the live DOM at click time, using index position.**

```ts
function scrollToPage(pageIndex: number) {
  const pages = document.querySelectorAll('.tiptap .page');
  const target = pages[pageIndex];
  if (!target) return;

  const container = document.querySelector('main');
  if (!container) return;

  const elRect = target.getBoundingClientRect();
  const containerRect = container.getBoundingClientRect();
  const scrollTop = elRect.top - containerRect.top + container.scrollTop - HEADER_OFFSET;

  container.scrollTo({ top: scrollTop, behavior: 'smooth' });
}
```

Instead of looking up a pre-stored `id`, this function calls `querySelectorAll('.tiptap .page')` at the exact millisecond the user clicks. This always returns the current, live, correctly-ordered list of page DOM nodes in their actual rendered positions. `pages[pageIndex]` is the `pageIndex`-th page as it exists in the DOM right now — regardless of what ProseMirror did to recycle or reorder nodes since the last `extractPages()` call.

---

### 10.6 Why `scrollIntoView` Was Replaced with Manual Scroll Math

The initial fix used `target.scrollIntoView({ behavior: 'smooth' })`. This is the browser's native scroll-to-element API. It mostly worked — but had one specific failure: the scrolled page would land partially behind the sticky document header.

The document page has a sticky `DocumentHeader` with a fixed pixel height. `scrollIntoView` scrolls the target element to the top of the **viewport** — not the top of the scrollable content area below the header. This means the top 60-80px of the target page was hidden behind the header after scrolling.

CSS `scroll-margin-top` is the standard fix for this — setting `scroll-margin-top: 80px` on the `.page` elements tells `scrollIntoView` to leave that much space above the element. But because `tiptap-pagination-plus` dynamically injects `.page` nodes as decorations, there is no reliable point to apply `scroll-margin-top` that cannot be overridden or stripped by the extension on its next render cycle.

The robust solution is manual scroll math that explicitly targets the `<main>` overflow container:

```ts
const elRect = target.getBoundingClientRect();        // target's position relative to viewport
const containerRect = container.getBoundingClientRect(); // container's position relative to viewport
const scrollTop =
  elRect.top          // distance from viewport top to element top
  - containerRect.top // subtract container's offset from viewport top
  + container.scrollTop // add current scroll offset (makes it absolute within container)
  - HEADER_OFFSET;    // subtract header height to clear sticky bar

container.scrollTo({ top: scrollTop, behavior: 'smooth' });
```

`HEADER_OFFSET` is a constant (e.g., `80`) matching the document header's rendered height. The result is pixel-perfect scroll positioning: the target page's top edge lands exactly `HEADER_OFFSET` pixels below the sticky header — neither hidden behind it nor with unnecessary extra space above it.

Explicitly targeting `container` (the `<main>` element with `overflow-y-auto`) rather than calling `window.scrollTo` is also important. The document editor page uses a contained scroll surface — `window` itself does not scroll. Calling `window.scrollTo` would do nothing. The scroll must be applied to the element that actually has the scrollbar.

---

### 10.7 Collapsible Sidebar — The Width Transition Pattern

The sidebar has a toggle button that collapses it from `16rem` wide to `0`, giving the user the full viewport width for the editor. This sounds trivial — but it has a React-specific implementation challenge.

The naive implementation uses conditional rendering:

```tsx
// BROKEN for animation
{isOpen && <SidebarPanel />}
<ToggleButton />
```

This works functionally but CSS transitions are impossible on a conditionally mounted element. A CSS `transition-[width]` on `SidebarPanel` has nowhere to animate from when it mounts — it starts at `0px` and jumps instantly to `16rem`. The unmount also jumps instantly — there is no element to animate `width` down to `0` on, because React has already removed it from the DOM before the transition could play.

The correct approach: **always render both elements, animate their visual properties.**

```tsx
<div
  className={cn(
    'overflow-hidden transition-[width] duration-300 ease-in-out',
    isOpen ? 'w-64' : 'w-0'
  )}
>
  <SidebarPanel />
</div>

<button
  className={cn(
    'transition-all duration-300 ease-in-out',
    isOpen ? 'opacity-0 scale-0' : 'opacity-100 scale-100'
  )}
  onClick={() => setIsOpen(true)}
>
  {/* chevron icon */}
</button>
```

- The sidebar panel wrapper animates its `width` between `w-64` (`16rem`) and `w-0`. `overflow-hidden` ensures the content is clipped at the container boundary during the transition — you see the panel slide in from the left rather than content overflowing out of a narrowing box.
- The toggle button animates `opacity` and `scale` — it fades and shrinks away when the sidebar opens, and fades and grows back when the sidebar closes.
- Both elements are always in the DOM. React never unmounts them. The CSS transitions always have a starting value and an ending value to interpolate between.

The `duration-300` (300ms) for the panel width and `duration-300` for the button match each other intentionally — the button disappears at the same rate the panel appears, so the combined animation feels like a single coordinated motion rather than two separate things happening sequentially.

---

### 10.8 The Content Fade-In on Sidebar Open

When the sidebar opens, the thumbnail images do not appear instantly at full opacity. They fade in over 500ms using the same `requestAnimationFrame` + `transition-opacity` pattern used on dashboard card previews:

```ts
useEffect(() => {
  if (isOpen) {
    requestAnimationFrame(() => setShowContent(true));
  } else {
    setShowContent(false);
  }
}, [isOpen]);
```

```tsx
<div className={cn(
  'transition-opacity duration-500',
  showContent ? 'opacity-100' : 'opacity-0'
)}>
  {thumbnails}
</div>
```

Without this, opening the sidebar causes all thumbnails to appear simultaneously at full opacity the instant the panel width animation completes — a sudden visual "slam" of content. The 500ms fade staggers the content appearance slightly behind the panel animation, creating a layered reveal: panel slides open first, content fades in after. This depth of sequencing is what distinguishes a polished UI from a functional one.

---
## 11. The Email Invitation System

Section 4 (The Inbox) already covered the **recipient's** side of invitations — how an invited user sees, filters, accepts, or rejects an invite in real time. This section covers the **owner's** side: how an invite token is actually born, how it differs depending on whether it was generated as a shareable link or addressed to specific people, how it eventually reaches the recipient's inbox via SendGrid, and the security logic that prevents the whole system from being abused.

At the center of everything is a single Postgres table, `invites`, that has to serve two very different use cases at once.

---

### 11.1 The `invites` Table — One Schema, Two Invitation Types

| Column | Purpose |
|---|---|
| `id` | Primary key |
| `document_id` | Which document this invite grants access to |
| `token` | The unguessable `crypto.randomUUID()` string embedded in the invite URL |
| `role` | `editor` or `viewer` — the permission the recipient receives on acceptance |
| `email` | **Nullable.** Non-null for a targeted email invite, `null` for a universal shareable link |
| `status` | `pending`, `accepted`, or `rejected` (enforced by the `invites_status_check` constraint) |
| `expires_at` | Timestamp — every invite, of either type, now carries a 24-hour TTL |
| `created_at` | Audit timestamp |

The decision to model both invite types in **one table** rather than two separate tables (`email_invites` and `share_links`) was deliberate. Both flows ultimately answer the same question — *"does this token grant access to this document, and at what role?"* — so `acceptInvite(token)` only needs to branch on **one column** (`email`) instead of querying two different tables and merging the results. This single design decision is what allows the Inbox, the accept-invite flow, and the expiry filtering logic in Section 4 to all share the exact same code path regardless of how the invite was created.

Note that **`expired` is not a stored status.** It is never written to the database. It is computed live, on the fly, by comparing `expires_at` against the current timestamp. The expiry is a pure function of time, not a mutable state.

---

### 11.2 `create-link-tab.tsx` vs. `send-email-tab.tsx` — Two Tabs, One Dialog

Originally, both flows lived inside a single `ShareDialog` component with one shared piece of state for the email input field declared at the top of the dialog. Every keystroke typed into the email field re-rendered the entire dialog — including the unrelated "Create Link" tab. The fix was architectural: the dialog was decomposed into two independent components, each owning its own local state:

```
ShareDialog (shell — just renders Tabs + TabsContent)
 ├── create-link-tab.tsx   (owns: selectedRole, generatedLink, isGenerating)
 └── send-email-tab.tsx    (owns: selectedRole, selectedContacts, isSending)
```

**`create-link-tab.tsx`**: role `<Select>` → "Generate Link" (calls `createInviteLink(documentId, role)`) → read-only input with copy-to-clipboard → a disclaimer explicitly telling the owner the link is multi-use and expires in 24 hours, since that behavior is unusual enough to need calling out.

**`send-email-tab.tsx`**: role `<Select>`, the `UserSearchInput` pill picker (11.6), and a "Send Invitation" button gated by `isSubmitDisabled`.

Splitting these enforces a clean Single Responsibility boundary — the `ShareDialog` shell doesn't need to know *how* a link is generated or *how* an email is validated.

---

### 11.3 Token Lifecycle — The State Machine Behind Every Invite

Every invite is created `pending` with a `crypto.randomUUID()` token — chosen over a sequential ID specifically because the token doubles as the access credential; a UUID is infeasible to guess.

```ts
// accept-invite.action.ts (simplified)
const invite = await getInviteByToken(token);

if (invite.email) {
  // Targeted email invite — single recipient, single use.
  await addMember(invite.document_id, userId, invite.role);
  await updateInvite(invite.id, { status: 'accepted' }); // token is now dead
} else {
  // Universal shareable link — multi-use.
  await addMember(invite.document_id, userId, invite.role);
  // status is intentionally left as 'pending' — the token stays alive
}
```

- **Targeted email invites** (`email` non-null): accepted flips the status to `accepted`, permanently killing the token.
- **Universal links** (`email` null): status is deliberately never flipped — the token stays `pending` until its 24-hour `expires_at` passes, so it can be reused.
- **`rejected`** is only reachable via the Inbox's Reject button, and only applies to email invites.

Get this branch backwards and either universal links become single-use (breaking onboarding) or email invites become infinitely reusable (a real security hole).

---

### 11.4 24-Hour Expiry — Why Every Token Has a TTL

Targeted email invites carried a 24-hour `expires_at` from the moment bulk invites were introduced. Universal links were a harder case — a link with no expiry is convenient (paste once into Slack, works forever) but a slow-burning hazard if that channel is ever leaked or archived. The fix gives universal links the same 24-hour TTL, enforced server-side in `get-invite-details.action.ts`. This gives the convenience of "one link, many people" with the security bound of "self-destructs in a day" — an owner needing longer access just generates a fresh link.

---

### 11.5 Multi-Use Universal Links — Solving the Team Onboarding Problem

The scenario: an owner drops one invite link into a Slack channel so ten engineers can self-serve into a document. A strictly single-use link breaks this — the first click consumes it, everyone after hits a dead link. The fix in 11.3 — only flipping `status` to `accepted` when `invite.email` is non-null — is what makes this work, since a universal link's `email` is always `null` and never triggers the consuming branch. This is also why `createInviteLink` never asks for an email — its absence *is* the mechanism that keeps the token alive.

---

### 11.6 The UserSearchInput Pill Component (`user-search-input.tsx`)

Rebuilt from a plain `<input type="email">` into a Slack/Gmail-style token input — type an email, press `Enter`, get a removable pill.

**Lookup flow**: a debounced (300ms) `searchUsersByEmail` call checks for a registered user and pulls their name/avatar; no match falls back to a "Custom Email" pill.

**Why `Enter` bypasses the debounce**: if the 300ms window hasn't resolved when `Enter` fires, the pill would get stuck as a generic "Custom Email" even for a registered user. `Enter` triggers an immediate, un-debounced verification instead.

**The stale-closure bug**: async lookups take ~100ms. If a pill is deleted *while* its lookup is still in flight, the resolving `.then()` callback holds a closure over the array as it existed when the lookup started — and would resurrect the deleted pill. Fixed by mirroring the array into a `useRef`, so any async callback always reads the array as it exists right now, not as it existed at closure-creation time.

**Badge system**: dropdown suggestions are cross-referenced against `all_members` and `invites` (drilled down from `getDocumentById`) — a match renders a "Member" or "Invited" badge and disables that row (`opacity-50 cursor-not-allowed disabled`). The same check blocks manual entry of an already-member/invited email on `Enter`/`,`, and gates the submit button via `isSubmitDisabled`.

---

### 11.7 The Bulk Invite Server Action (`send-email-invites.action.ts`)

```ts
'use server'

export async function sendEmailInvites(documentId: string, role: Role, contacts: Contact[]) {
  const validRecipients = await filterValidRecipients(documentId, contacts); // 11.8

  const newInvites = validRecipients.map((c) => ({
    document_id: documentId,
    email: c.email,
    role,
    token: crypto.randomUUID(),
    expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  }));

  await supabase.from('invites').insert(newInvites); // single bulk insert
  await Promise.all(newInvites.map(sendInviteEmail));  // 11.9
}
```

Token and expiry are generated **entirely server-side** — never accepted from the client — so a malicious client can't craft an invite with a token of its choosing or no expiry. The insert is a single bulk call rather than N sequential inserts: one round-trip, and atomic (the whole batch writes, or none of it does).

---

### 11.8 Silent De-duplication — Graceful Handling of Partial Batch Failures

```ts
async function filterValidRecipients(documentId: string, contacts: Contact[]) {
  const { ownerEmail, existingMembers, pendingInvites } = await getDocumentInviteContext(documentId);

  return contacts.filter((c) => {
    if (c.email === ownerEmail) return false;        // self-invite
    if (existingMembers.has(c.email)) return false;   // already a member
    if (pendingInvites.has(c.email)) return false;    // already invited, not expired
    return true;
  });
}
```

Invalid entries are silently dropped, not treated as batch-ending errors — five contacts in, two filtered out, three still succeed. `toast.error` only fires if **every** contact fails validation. Fail as narrowly as possible; one bad apple shouldn't spoil the batch. (The frontend in 11.6 already blocks most of this client-side — this is the trust-no-client backstop.)

---

### 11.9 SendGrid — The Two-Step Sequential Dispatch (`sendgrid.action.ts`)

The integration was finalized as a dedicated wrapper file, `sendgrid.action.ts`, whose only job is talking to the SendGrid API — `send-email-invites.action.ts` doesn't build SendGrid payloads itself, it calls into this wrapper. This keeps "what an invite is" (database) cleanly separated from "how it gets emailed" (third-party API).

**The order is strictly sequential, not parallel:**

```ts
// send-email-invites.action.ts (simplified)
export async function sendEmailInvites(documentId: string, role: Role, contacts: Contact[]) {
  const validRecipients = await filterValidRecipients(documentId, contacts); // 11.8

  // Step 1 — Database first. This is the source of truth.
  const { data: newInvites, error: dbError } = await supabase
    .from('invites')
    .insert(buildInviteRows(documentId, role, validRecipients))
    .select();

  if (dbError) {
    throw new Error('Failed to create invites'); // halt — nothing was emailed, nothing half-exists
  }

  // Step 2 — SendGrid second. Only attempted once the rows above are confirmed written.
  for (const invite of newInvites) {
    try {
      await sendInviteEmail(invite); // sendgrid.action.ts
    } catch (err) {
      console.error(`SendGrid dispatch failed for ${invite.email}`, err); // logged, not thrown
    }
  }
}
```

**Why the database write happens first, not alongside or after:** the `invites` row is what makes the invitation visible in the recipient's Inbox. If SendGrid were called first, a slow or failed API response could leave the invite floating with no record anywhere. Writing to Postgres first means the invite is already actionable from inside the app the instant the insert succeeds, regardless of what happens to the email next.

**Why a SendGrid failure doesn't roll back the DB write or fail the whole action:** email delivery is the less reliable half of this pipeline — rate limits, timeouts, malformed addresses. The failure is caught per-recipient and logged, but the row from Step 1 stands. Even if every SendGrid call in a batch fails, every invited user can still find their invitation just by opening the app and checking the Inbox — the notification channel failed, the actual grant of access didn't. Same "fail as narrowly as possible" principle as 11.8, applied to a network dependency instead of input validation.

This is entirely server-side — `SENDGRID_API_KEY` lives only in server env vars, used exclusively inside `sendgrid.action.ts`, never serialized to the browser. Each email's only dynamic payload is the invite link itself, pointing at the same intermediate "You've been invited!" route from Section 5.7 — SendGrid's job is just getting that URL in front of the right inbox.

The boundary between the two tabs is now precise: Create Link stops at "row inserted, URL displayed for the owner to copy" — no SendGrid call at all, since the owner distributes it themselves. Send Email runs the full two-step sequence above.

---

### 11.10 The Edge Proxy's Role — Preserving the Token Through Sign-Up

`src/lib/supabase/proxy.ts` intercepts every request at the edge. When it catches an unauthenticated request to `/dashboard/invite?token=<uuid>`, it redirects to `/login?next=/dashboard/invite?token=<uuid>` instead of just bouncing to a bare login screen. The moment sign-up completes, the brand-new user is routed straight back to the exact invite-acceptance screen they were trying to reach — the token never leaves their hands, even through the account-creation detour.

---

## 12. Database Schema & Triggers

Sections 3 through 11 all quietly assume a database schema exists underneath them — the Inbox queries `invites`, the Toolbar's image control writes to a bucket, the Dashboard reads `document_members` to compute a role badge. This section is the foundation those sections were built on top of: the five-table MVP schema designed in Step 6, and the one PostgreSQL trigger that keeps it in sync with Supabase's own internal auth tables.

---

### 12.1 The Five-Table MVP

| Table | Purpose |
|---|---|
| `users` | Public profile data (name, email, avatar) — mirrors Supabase's internal `auth.users` |
| `documents` | Document metadata (`title`, `owner_id`, `created_at`, `updated_at`) |
| `document_members` | Access control — `document_id`, `user_id`, `role` (`owner` / `editor` / `viewer`) |
| `document_content_state` | The real-time content payload — `ydoc_state` (base64 Yjs binary) and `preview_json` |
| `invites` | Pending/accepted/rejected invitation tokens (fully documented in Section 11) |

Five tables is a deliberately small surface area for an app this feature-rich. The schema design explicitly separates **what a document is** (`documents`), **who can touch it** (`document_members`), and **what's inside it** (`document_content_state`) into three distinct tables rather than bundling them into one wide `documents` row with a JSON `content` column and an array `members` column. This separation is what allows, for example, the Hocuspocus server (Section 7) to upsert into `document_content_state` on every keystroke without ever touching the `documents` row's metadata, and what lets the Dashboard's card grid (Section 3) join against `document_members` to compute a role badge without pulling the (potentially large) Yjs binary state along with it.

---

### 12.2 `public.users` — Mirroring Supabase's Hidden `auth.users`

Supabase manages authentication entirely inside its own internal `auth.users` schema — a table the application never queries directly and, by design, mostly can't. That table holds credentials, provider metadata, and session bookkeeping, none of which the app needs to expose. What the app *does* need — a name to display in an avatar, an email to show in a member list, a profile picture — lives in a separate `public.users` table, linked back to `auth.users` by a foreign key on a shared `id`.

This split exists because `auth.users` is intentionally a black box owned by Supabase's auth system. Trying to extend it directly with application-specific columns (display name, avatar URL) would mean fighting Supabase's internal migrations every time the platform updates. A separate `public.users` table that simply *references* the auth table's ID gives the application complete freedom over its own profile schema while still being able to answer "is this a real, authenticated user" by checking the foreign key relationship.

---

### 12.3 The `handle_new_user` Trigger — Why the Database Builds the Profile, Not Next.js

The obvious way to populate `public.users` would be: after a successful `signUp()` call on the frontend, fire a second request to insert a matching row into `public.users`. This was deliberately avoided. Instead, a PostgreSQL trigger named `handle_new_user` fires automatically whenever a new row lands in `auth.users`, reads the raw signup metadata (full name, avatar URL — both available from GitHub's OAuth payload), and inserts the corresponding `public.users` row itself.

```sql
-- handle_new_user (conceptual shape)
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();
```

The reasoning is about eliminating an entire class of race condition. If profile creation lived in the Next.js application layer, every signup path — email/password, GitHub OAuth, and any future provider — would need to remember to call that second insert, and any failure between the two steps (a dropped request, a slow network, a redirect that fires before the second call resolves) would leave a user able to authenticate but with no row in `public.users`, silently breaking every join that expects one. By moving the responsibility into the database itself, the guarantee becomes unconditional: **it is structurally impossible for a row to exist in `auth.users` without a matching row in `public.users`**, because the insert that creates the first is the same transaction that triggers the second.

---

### 12.4 `documents`, `document_members`, and `document_content_state` — Splitting Metadata, Access, and Content

`documents` is intentionally thin — just enough to render a card in the Dashboard grid (title, timestamps) and to identify an `owner_id` for permission checks. It does **not** hold the document's actual text content.

`document_members` is the access-control join table: one row per (document, user) pair, carrying a `role`. This is the table every RBAC check in the app ultimately reads from — whether a user can see the Invite button, whether the Tiptap editor mounts with `editable={true}`, whether the Rename pencil icon renders. Centralizing role storage in one join table (rather than, say, an array column on `documents`) is what lets a single Supabase Realtime subscription on this table drive the "Access Revoked" modal — a `DELETE` event on a row in this table is unambiguous and easy to listen for.

`document_content_state` holds the actual collaborative payload: `ydoc_state`, a base64-encoded binary blob of the Yjs CRDT state, and `preview_json`, a lighter-weight JSON snapshot used purely to render the Dashboard card thumbnails (Section 3.2) without needing to decode the full Yjs binary on every dashboard page load. This table is written almost exclusively by the standalone Hocuspocus server's `onStoreDocument` hook (Section 7), not by ordinary Next.js server actions — it's the one table in the schema whose write path bypasses the usual Server Action pattern entirely, because it's driven by WebSocket events instead of HTTP requests.

---

### 12.5 Row Level Security — The Enforcement Layer Underneath Every Query

Every table above has RLS enabled. This is what was meant in Section 2 when this document said Supabase "replaces manual `WHERE user_id = $1` boilerplate" — a query like `select * from documents` issued from a Server Component using the authenticated user's Supabase client doesn't return *all* documents; Postgres itself filters the result set down to rows the requesting user is actually allowed to see, based on policies defined against `document_members`. This is a deliberate second layer of defense underneath the role checks already described throughout Sections 5 and 11 — even if a UI bug somehow let a viewer click a button it shouldn't see, the underlying database query would still refuse to return or mutate rows that user doesn't have a `document_members` row for.

---

## 13. Feature-Based Architecture & Action-File Decomposition

This section documents a structural rule that every other section in this document has been silently following: where code is allowed to live, and how finely it has to be split.

---

### 13.1 Why `app/` Is Routing-Only

In a typical Next.js App Router project, it's common to see UI components, server actions, and validation schemas all living directly inside the `app/` directory alongside the routes that use them. This project deliberately rejects that pattern. The rule, established in Step 4 and reinforced through Step 18, is strict: **`app/` exists only to define URLs.** A file like `app/dashboard/[docId]/page.tsx` should contain almost nothing but imports from elsewhere and the JSX that wires them together — it should not contain the `DocumentHeader` implementation, the `getDocumentById` query logic, or any validation schema.

Everything else — UI components, server actions, Zod schemas, custom hooks, Tiptap extensions — lives in `src/features/[feature_name]/`. The project currently has features like `auth`, `dashboard`, `editor`, and `invites`, each a self-contained vertical slice.

```
src/
├── app/                          # routing only
│   ├── login/page.tsx
│   └── dashboard/[docId]/page.tsx
└── features/
    ├── auth/
    │   ├── actions/
    │   ├── components/
    │   └── schemas/
    ├── dashboard/
    └── editor/
```

The benefit isn't just tidiness. Once a route file is reduced to "import the feature, render it," any page can compose multiple features without caring how any single one of them is implemented internally — `app/dashboard/[docId]/page.tsx` imports pieces from both `editor` and `invites` without either feature needing to know about Next.js routing conventions at all.

---

### 13.2 One Server Action, One File

The most aggressively enforced rule in the codebase is this: **a server action file may contain exactly one exported action.** Early in the project, actions were grouped into shared files like `auth.actions.ts` or `document.actions.ts` — a natural instinct, since `login`, `logout`, and `signup` all conceptually belong together. Step 18 deliberately undid this, splitting every single action into its own file: `login.action.ts`, `logout.action.ts`, `create-document.action.ts`, `accept-invite.action.ts`, and so on, one file per verb.

The motivation is **tree-shaking**, not just code organization. When a client component imports `login` from a shared `auth.actions.ts` file, Next.js's bundler has to consider the entire module — including `logout`, `signup`, and any other export in that file — as a unit that might need to ship to the browser, even though the component only ever calls `login`. Splitting each action into its own file with a single export gives the bundler an unambiguous, minimal dependency graph: importing `create-document.action.ts` pulls in exactly the code that action needs, and nothing belonging to `delete-document.action.ts` sitting two files over. At the scale of dozens of server actions across `auth`, `dashboard`, `editor`, and `invites`, this is a meaningful difference in bundle size and Fast Refresh speed during development.

---

### 13.3 Component Decomposition Follows the Same Rule

The same single-responsibility instinct governs UI components, and Section 6.1 already documented its most visible result: the original 600-line `toolbar.tsx` decomposed into 8+ sub-components (`history-controls.tsx`, `font-family-control.tsx`, `color-control.tsx`, and so on), each living in its own file under `features/editor/components/toolbar/`. Section 11.2 documented the same pattern applied to `share-dialog.tsx` (split into `create-link-tab.tsx` and `send-email-tab.tsx`), and Step 21 applied it again to `document-action-menu.tsx`, extracting its inline rename/delete dialogs into `document-rename-dialog.tsx` and `document-delete-dialog.tsx`.

The reasoning is consistent across all three cases: a large component with many pieces of local state is fragile in two specific ways — every keystroke in any one field re-renders the entire component tree underneath it (the exact bug described in Section 11.2), and large files are disproportionately prone to Git merge conflicts when two people touch unrelated parts of the same file in the same week. Splitting along natural boundaries — one file per formatting tool, one file per dialog — fixes both problems simultaneously without any single component needing to grow more complex to compensate.

---

### 13.4 Centralized Environment Constants

The last piece of this architectural discipline is `src/lib/constants/env.ts` (and its mirror, `src/config/env.ts`, inside the standalone Hocuspocus server). Every `process.env.SOMETHING` lookup in the codebase is funneled through this one typed object rather than being accessed ad hoc wherever a value is needed.

```ts
// src/lib/constants/env.ts (conceptual shape)
export const ENV = {
  SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  SENDGRID_API_KEY: process.env.SENDGRID_API_KEY!,
  // ...
} as const;
```

Scattering raw `process.env.X` calls throughout a codebase makes two things hard: knowing the complete list of environment variables a project actually depends on, and catching typos (`process.env.SENDGRID_API_KY` silently evaluates to `undefined` with no compile-time warning). Centralizing every lookup into one strictly typed object turns both into non-issues — the `ENV` object's shape *is* the documentation of every required environment variable, and TypeScript will refuse to compile a typo'd property access against it.

---

## 14. The Authentication System

With the schema (Section 12) and the architectural conventions (Section 13) in place, this section covers how a person actually gets an authenticated session in the first place — the login/signup flows, the GitHub OAuth handshake, and the UI polish layered on top of both.

---

### 14.1 Email/Password Login — A Server Action, Not an API Route

```ts
// login.action.ts
'use server'
import { createClient } from '@/lib/supabase/server'

export async function login(formData: FormData) {
  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  // ...
}
```

Authenticating with a password happens entirely inside a `'use server'` function rather than a traditional REST API route. This means the password the user types is sent directly to a server-side function call — never round-tripped through a client-side `fetch` to a separate API endpoint that then has to be secured independently. The server action initializes the **Server Client** (Section 2's three-client table), calls `signInWithPassword`, and Supabase's `@supabase/ssr` package automatically attaches the resulting session cookies to the response via the `setAll` cookie bridge already established in Section 2.

---

### 14.2 GitHub OAuth — A Client Redirect, Then a Server-Side Code Exchange

OAuth requires two distinct pieces of code running in two different environments, because the flow itself crosses from the browser to GitHub's servers and back.

**The client side** (`oauth-buttons.tsx`) has to run in the browser, because initiating OAuth means physically navigating the user's tab to GitHub's authorization page:

```tsx
'use client'
import { createClient } from '@/lib/supabase/client'

export function OAuthButtons() {
  const supabase = createClient()
  const handleOAuth = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: { redirectTo: `${origin}/auth/callback` },
    })
  }
}
```

**The server side** (`app/auth/callback/route.ts`) is a Next.js Route Handler — not a Server Action — because GitHub redirects the browser back with an authorization `code` in the URL's query string, and only a route that can read incoming `GET` request parameters can capture it:

```ts
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const supabase = await createClient()
  await supabase.auth.exchangeCodeForSession(code);
  // ... redirect to /dashboard
}
```

`exchangeCodeForSession` is the standard OAuth 2.0 PKCE step: that temporary `code` is single-use and short-lived, and swapping it for a real session JWT has to happen server-side so the resulting session cookie can be set on the response before the user ever sees `/dashboard` render. Doing this exchange in a Route Handler — rather than, say, trying to read the code on the client and ship it to a server action — keeps the entire credential-bearing step server-side from start to finish.

---

### 14.3 Why GitHub Was Chosen — and Why Its Secrets Never Touch `.env.local`

The project briefly supported both Google and GitHub OAuth before consolidating to **GitHub exclusively**. Once Google was removed, the OAuth button's layout changed from a two-column `grid-cols-2` to a single `flex w-full` button, since there was no longer a second provider to sit beside it.

The detail worth calling out specifically: `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` are **not** stored in this project's `.env.local` at all. They live exclusively inside the Supabase Dashboard, under Authentication → Providers → GitHub. This is because the OAuth handshake's secret-bearing exchange is performed by Supabase's own backend, not by the Next.js application — Next.js never needs to see the client secret, because it's Supabase's servers, not this project's servers, that talk to GitHub's token endpoint. Putting the secret in `.env.local` would have been not just unnecessary but actively wrong, since the Next.js app has no code path that would ever read it.

---

### 14.4 Double Validation — Zod on the Server, React Hook Form on the Client

`src/features/auth/schemas/auth.schema.ts` defines `loginSchema` and `registerSchema` using Zod — strict types requiring, for example, 8+ character passwords and syntactically valid emails. These schemas are consumed on both sides of the request:

- **Client-side**: React Hook Form resolves against the Zod schema via `@hookform/resolvers`, catching invalid input before a network request is even made, and managing form state efficiently (re-rendering only the changed field rather than the whole form).
- **Server-side**: the server action re-validates the exact same schema with `.safeParse()`, refusing to trust whatever the client sent — because a malicious or buggy client could bypass the React Hook Form layer entirely and post directly to the action.

This double validation is also where the `{ success, error }` return contract (covered fully in Section 15.5) was introduced — `auth.actions.ts` was refactored to return a JSON payload describing what happened, rather than calling Next.js's `redirect()` internally on failure, specifically so client components could catch the failure and display a `sonner` toast instead of triggering an opaque server-side redirect.

---

### 14.5 Pixel-Perfect Auth Tabs — A CSS Grid, Not Padding Math

The `AuthTabs` component toggles between `LoginForm` and `RegisterForm`. Its underlying Shadcn `TabsList`/`TabsTrigger` originally relied on Shadcn's default sizing approach — `h-[calc(100%-1px)]` combined with absolutely positioned pseudo-element borders — which is fragile under resize and prone to subtle layout shift. The fix replaced this with a deliberate CSS Grid: a fixed-height `h-14` parent split into `grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]`, where the middle, fixed-width `auto` column renders a literal 1px vertical separator between the two tabs rather than relying on calculated padding to fake one. Explicit `data-[state=active]:bg-zinc-900` styling was layered on top to make the active/inactive contrast unambiguous. The result is a tab control that can never visually drift out of alignment regardless of viewport width, because the grid math is exact rather than approximated.

---

### 14.6 Auth-Aware Navbar & Landing Page — Zero-Flicker Session Detection

The public-facing `Navbar` and the root landing page (`src/app/page.tsx`) are both **async Server Components** that call `supabase.auth.getUser()` directly during render, before any HTML reaches the browser. Depending on the result, the navbar renders either "Log in" + "Sign up" or a single "Get Started" button pointed at `/dashboard`; the landing page's hero CTA does the same, switching between "Start writing for free" and "Go to Dashboard."

Performing this check on the server, rather than fetching the session after the page mounts on the client, eliminates a flicker that's common in apps that check auth client-side: a half-second where a logged-in user briefly sees the logged-out "Sign up" button before the client-side session check resolves and swaps it out. Because the correct button is already baked into the very first HTML response, there is nothing to swap — the first paint is already correct.

---

### 14.7 Forgot Password & Magic Link Flow

The password reset flow relies on Supabase's native "Magic Link" API rather than custom hash tokens.

- **The Request**: Users enter their email at `/forgot-password`. We call `supabase.auth.resetPasswordForEmail`, triggering a branded SendGrid HTML email containing a secure link.
- **The Callback**: The emailed link points back to `app/auth/callback/route.ts` (the same PKCE handler used by GitHub OAuth). The Edge Proxy intercepts the payload, seamlessly establishing an authenticated session.
- **The Reset**: The callback redirects the authenticated user to `/update-password`. Here, `update-password.action.ts` runs `supabase.auth.updateUser({ password })` to save the new credentials.

This architecture offloads token generation and verification to Supabase, eliminating the need to pass insecure IDs in URLs.

---

## 15. Document CRUD Server Actions

This section documents the actions behind the Dashboard's most basic verbs — create, read, rename, delete — and the design decisions that make them safe to call directly from forms and buttons.

---

### 15.1 `createDocument` — A Two-Step Transaction

```ts
// create-document.action.ts (conceptual shape)
export async function createDocument(title: string) {
  const supabase = await createClient();
  const { data: user } = await supabase.auth.getUser();

  const { data: doc } = await supabase
    .from('documents')
    .insert({ title, owner_id: user.id })
    .select()
    .single();

  await supabase
    .from('document_members')
    .insert({ document_id: doc.id, user_id: user.id, role: 'owner' });

  return { success: true, documentId: doc.id };
}
```

Creating a document is really two related writes: a row in `documents`, and a row in `document_members` granting the creator the `owner` role on their own document. Without the second insert, the creator would have a document with no recorded permission to access it — every RBAC check throughout Sections 5 and 12.4 depends on a `document_members` row existing, including for the owner. Returning the new document's ID (rather than calling `redirect()` from inside the action) lets the calling client component close its creation dialog and navigate with `router.push()` itself — see Section 15.5 for why that distinction matters.

---

### 15.2 `getUserDocuments` and the `.bind()` Pattern

Reading a user's documents and rendering action buttons next to each one (like Delete) creates a small but real wiring challenge: a Server Action invoked from a `<form action={...}>` doesn't get to receive arbitrary extra arguments the way a normal function call would — the form only knows how to submit its own fields. The fix used throughout the Dashboard is JavaScript's native `.bind()`:

```tsx
<form action={deleteDocument.bind(null, doc.id)}>
  <button type="submit">Delete</button>
</form>
```

`.bind(null, doc.id)` produces a new function with `doc.id` permanently pre-filled as its first argument, which can then be handed to `action={...}` exactly like any zero-argument server action. This lets a `DocumentCard` rendered inside a Server Component pass its own ID into a mutation without ever needing to become a Client Component itself — the binding happens at render time, entirely on the server, and the resulting form just works.

---

### 15.3 `deleteDocument` and `revalidatePath`

Deletion follows the same Server Action shape, but pairs it with `revalidatePath('/dashboard')` after the database row is removed. Next.js caches the rendered output of Server Components aggressively; without explicitly invalidating that cache, a user who deletes a document would see it vanish only on a hard refresh, not immediately. Calling `revalidatePath` after the mutation tells Next.js to discard its cached render of `/dashboard` and re-fetch fresh data on the very next render — which is what makes deletions (and creations) feel instant without any client-side state management of the document list at all.

---

### 15.4 `updateDocumentTitle` — Role-Gated Rename

```ts
export async function updateDocumentTitle(documentId: string, newTitle: string) {
  const role = await getUserRoleForDocument(documentId);
  if (role !== 'owner' && role !== 'editor') {
    return { success: false, error: 'Not authorized' };
  }
  await supabase.from('documents').update({ title: newTitle }).eq('id', documentId);
  return { success: true };
}
```

The pencil-icon rename flow on `DocumentHeader` (Section 5.3) is backed by this action, and the role check is performed entirely server-side before the update is even attempted — not just hidden behind a UI condition that decides whether to show the pencil icon at all. This double-layering matters for the same reason RLS (Section 12.5) exists underneath role-gated UI everywhere else in the app: a viewer who somehow triggers the rename action directly (bypassing the hidden pencil icon) would still be rejected by this explicit role check before any write to `documents` occurs.

---

### 15.5 The `{ success, error }` Contract — Why Actions Don't Throw Redirects

Early server actions in this project called Next.js's `redirect()` directly on failure paths. This turned out to interact badly with client-side `try/catch` blocks: Next.js implements `redirect()` by throwing a special internal `NEXT_REDIRECT` error that's meant to be caught by Next.js's own routing machinery — but a client component's own `try/catch` around the action call intercepts that same thrown error first, treating a successful redirect-on-failure as if it were an unhandled exception.

The fix, applied consistently across `auth`, `dashboard`, and `invites` actions alike, is for every action to return a plain, predictable JSON shape — `{ success: true, ... }` or `{ success: false, error: '...' }` — and let the **calling client component** decide what to do next: show a toast, redirect with `router.push()`, or update local state. The action itself never throws control flow back at the framework; it just reports what happened and hands control back to the caller.

---

### 15.6 The Auto-Save Detour and Why It Doesn't Exist Anymore

Before the Yjs/Hocuspocus architecture (Section 7) existed, document content was persisted through a temporary `updateDocumentContent` server action: a 1-second debounced `setTimeout` on Tiptap's `onUpdate` event extracted `editor.getHTML()` and upserted the raw HTML string into `document_content_state`. This REST-style approach was explicitly built as a stopgap — described in the implementation log as something to "swap out for the Hocuspocus provider" once the real-time architecture landed — and it has since been fully replaced. Content is no longer written via any Server Action at all; it flows exclusively through the Hocuspocus server's `onStoreDocument` hook described in Section 7. The `DocumentContext`'s `syncState` enum (`saving` / `saved` / `offline`) that originally reflected this debounced REST save (Section 5.2) survived the swap unchanged — only the underlying mechanism writing to the database changed, not the UI contract built on top of it.

---

## 16. Image Upload Storage Configuration

Section 6.11 already documented the client-and-server upload *flow* — the hidden file input, the loading spinner, `uploadImage` validating and uploading the file. This section covers the storage-layer configuration underneath that flow: the bucket itself, and the RLS policies that decide who can read and write to it.

---

### 16.1 The `document-assets` Bucket — Public, but RLS-Protected

Uploaded images live in a Supabase Storage bucket named `document-assets`, configured as **Public**. "Public" here specifically means the bucket permits anonymous, unauthenticated *reads* — necessary because a plain `<img src="...">` tag has no way to attach an auth header, and collaborators viewing a document need its images to load without each of them needing a freshly signed, expiring URL. Section 2 already established why this matters: a `blob:` URL is scoped to the browser tab that created it, so persistent, publicly-readable storage is what makes images survive a page refresh or appear correctly for a second collaborator at all.

---

### 16.2 The Two RLS Policies — Public `SELECT`, Authenticated `INSERT`

"Public" describes only the read side. Writes are still gated by Row Level Security on `storage.objects`:

- **`SELECT`**: open to everyone, including unauthenticated requests — this is what lets `<img>` tags load instantly for any visitor with the URL.
- **`INSERT`**: restricted to authenticated users only — an anonymous visitor cannot upload a file into the bucket, even though they can read whatever's already there.

This pairing is the actual mechanism that makes "Public bucket" and "secure bucket" not contradictory. A bucket being publicly *readable* says nothing about who can *write* to it; the two RLS policies independently control each direction. Without the `INSERT` restriction, a fully public bucket would let anyone on the internet upload arbitrary files into the project's storage, regardless of whether they have any relationship to the application at all.

---

### 16.3 File Path Structure — `{documentId}/{uuid}.{ext}`

Every uploaded file is stored at a path shaped like `{documentId}/{crypto.randomUUID()}.{ext}` — for example, `a1b2c3.../9f8e7d6c-....png`. The document ID prefix isn't cosmetic: it groups every asset belonging to a given document under a shared "folder" inside the bucket, which makes the storage structure trivially auditable (every file under a given document ID belongs to that document, with no cross-document ambiguity) and would make a future "delete this document and all its assets" operation a simple prefix-based bucket cleanup rather than a database lookup to find scattered, unrelated filenames. The `crypto.randomUUID()` portion guarantees collision resistance — two users uploading files named `photo.png` to the same document at the same moment will never overwrite each other, because the actual filename on disk has nothing to do with the original filename the user's OS gave it.

---

### 16.4 Why This Validation Lives in `upload-image.action.ts`, Not the Bucket Policies Alone

RLS handles *who* can write to the bucket, but it has no concept of file size or MIME type. Those checks — verifying the file's type starts with `image/`, enforcing a 5MB ceiling, confirming the request is authenticated before doing any work at all — are performed inside the `upload-image.action.ts` server action itself (Section 6.11), before the file ever reaches Supabase Storage. This is a deliberate division of labor: RLS is the database-level guarantee that can't be bypassed even if application code has a bug, while the action-level validation is the friendlier, more specific gate that rejects bad input early with a clear error message rather than letting an oversized or non-image file reach storage and fail (or worse, succeed) silently.

---

## 17. User Profile Sync and Avatar Uploads

The user profile settings handle identity updates, specifically the user's name and avatar image. This is heavily tied to the `public.users` table schema described in Section 12.

### 17.1 Database Schema Synchronization (`image` column)

In early iterations, the codebase queried an `avatar_url` column. This was corrected to align with the actual PostgreSQL schema of `public.users`, which uses the `image` column to store profile pictures. All data fetching (e.g., `get-document-by-id.action.ts`), TypeScript interfaces, and utility functions (`extractUserInfo`) are now strictly mapped to `image` as the ultimate source of truth.

### 17.2 Avatar Upload UX & Preloading

Avatar uploads inside the Profile Settings tab deliberately avoid immediate database mutations. 

- **Local Preview**: When a user selects a file, it generates a zero-cost local object URL via `URL.createObjectURL()`. This allows users to test multiple images without uploading them to Supabase Storage.
- **Deferred Upload**: The actual upload (`upload-avatar.action.ts`) and profile mutation (`update-profile.action.ts`) only fire when the "Save Changes" button is submitted.
- **Zero-Jitter Spinner & Preloading**: The "Save Changes" button transitions to a spinner. Upon a successful database update, the spinner intentionally remains active while a background `new Image()` silently downloads the newly generated Supabase URL. The UI only clears the spinner when the `onload` event confirms the image is fully cached, guaranteeing a completely flash-free update.

---

## 18. Final Architecture Polish: Type Safety, Revocation Pattern, and UI Consistency

### 18.1 100% Strict Type Safety & Lint Compliance
The core application logic (`src/`) has achieved full TypeScript and ESLint compliance (`npx tsc --noEmit` exits with 0). 
- All usages of `any` were removed from feature modules (e.g., `get-inbox.action.ts`, `documents-settings-tab.tsx`).
- React hook violations (`exhaustive-deps`, `set-state-in-effect`) were meticulously resolved by restructuring component side-effects.
- In `tests/unit/`, Vitest mocking mismatches (where `ReturnType<typeof vi.fn>` causes strict typescript resolution to fail on chained mock queries) were circumvented explicitly via `/* eslint-disable @typescript-eslint/no-explicit-any */` pragmas to avoid polluting the core application with loosely typed test payloads.

### 18.2 Two-Step Revocation Sync
The real-time `inbox` updates relied on a `postgres_changes` listener for inserts and deletes. However, Supabase Realtime does not forward the row payload on a `DELETE` event, meaning clients couldn't know *which* invite was revoked.
The `revokeInviteAction` was redesigned to perform a two-step mutation:
1. `UPDATE` the invite to `status = 'rejected'` — forcing a full payload broadcast containing the invite ID.
2. `DELETE` the invite row immediately afterward to clear the database.
This guarantees the client WebSocket receives the full row payload on the update event, allowing the local `inbox-list` state to filter out the revoked invite instantaneously without requiring a full-page reload.

### 18.3 Seamless Glassmorphic Textures (`noise.png`)
The application heavily relies on `bg-[url('/noise.png')] mix-blend-overlay` in Tailwind classes to achieve a frosted glass, textured aesthetic across dialogs, page layouts, and skeletons. The `noise.png` static asset was integrated into the `public/` directory, resolving widespread 404 network errors and ensuring the premium UI consistency is flawlessly rendered.

---

## 19. Document Activity Tree

CollabDoc provides an auditable, GitHub-style linear activity log for every document, allowing owners and editors to track the entire lifecycle of a document in a premium visual format.

### 19.1 Architecture & Schema
The history is powered by a new `document_activity` table that stores immutable historical events.
- **Event Logging:** Natively triggers on document creation, member invitations, member roles updates, member removals, and document departures.
- **Metadata:** Each row stores the `action_type`, the `actor_id` who triggered the event, an optional `target_user_id` for user-to-user actions, and a flexible JSONB `metadata` column for action-specific details (e.g. `new_role`).
- **Security:** RLS is strictly enforced. The queries inherently verify the current user exists in the `document_members` table for that document before aggregating historical logs.

### 19.3 Real-Time WebSocket Hooks
The activity tree relies heavily on a dedicated `DocumentActivityRealtimeListener`. Since the activity log is a slide-out drawer, fetching data on every open would cause unnecessary database load. Instead, the UI subscribes directly to `postgres_changes` on the `document_activity` table. When an `INSERT` event fires (e.g. an owner removes a member), the WebSocket pushes the payload to the active listener, which immediately triggers a local cache revalidation.

---

## 20. SWR Caching & The "Silent Network" Architecture

A major architectural shift was made from manual React `useState` / `useEffect` data fetching to an event-driven, cache-first architecture using SWR (Stale-While-Revalidate).

### 20.1 Why `useSWRInfinite`?
Managing cursor-based infinite scrolling natively in React involves complex dependency arrays, memory leak risks on unmount, and race conditions if requests fire concurrently. `useSWRInfinite` was chosen because it orchestrates sequential page fetching effortlessly by defining a global cache key shape (e.g. `['activity', documentId, pageIndex]`). 

### 20.2 Locking Down the Polling
By default, SWR attempts to ensure data freshness by revalidating (HTTP polling) the cache whenever the user re-focuses the browser window or when the cache becomes stale. To completely silence the network tab and reduce database load to absolute zero during idle usage, we applied strict config flags: `{ revalidateOnFocus: false, revalidateIfStale: false }`.

### 20.3 Integrating with Supabase Realtime
With background HTTP polling disabled, the application relies exclusively on Supabase WebSockets. Invisible listener components (`InboxRealtimeListener`, `DocumentListRealtimeListener`) maintain persistent channels to PostgreSQL. 
When an event occurs (e.g., an invite is sent), the WebSocket receives the payload and manually invokes SWR's `mutate()` method. This instantly invalidates the local memory cache and triggers a targeted UI refresh. The result is a frontend that feels instantly responsive, drawing from cache on navigation, and only pinging the server when an actual database mutation happens.

---

## 21. Advanced Session & Access Management

### 21.1 Two-Step Invite Revocation
A known limitation of Supabase Realtime is that `DELETE` event payloads do not contain the deleted row's data (only its primary key). Because the frontend inbox state needed the invite data to properly filter the array, blind deletes caused state desynchronization.
We implemented a two-step mutation pattern in `revokeInviteAction`:
1. `UPDATE` the invite to `status = 'rejected'`. This forces Supabase to broadcast the full row payload (including the ID).
2. Immediately `DELETE` the row in the same transaction.
The frontend WebSocket listener catches the `UPDATE` payload, reads the ID, and instantly strips the revoked invite from the UI before the row is permanently destroyed on the backend.

### 21.2 Sessions Management
A new `sessions-settings-tab.tsx` was introduced to provide enterprise-grade visibility into active authentication sessions. It leverages Supabase's native sessions API to list active logins across devices, allowing users to securely revoke stale or unauthorized sessions remotely.
