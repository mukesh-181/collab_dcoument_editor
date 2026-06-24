# System Architecture: CollabDoc Collaborative Editor

This document describes the **implemented production architecture** of the CollabDoc project — a real-time collaborative document editor built on a modern full-stack TypeScript architecture.

---

## 1. Tech Stack

| Technology | Role |
|---|---|
| **Next.js 15 (App Router)** | Core framework — Server Components, Server Actions, Edge Proxy |
| **Tiptap v2** (`^2.27.2`) | Rich text editor (ProseMirror-based). Pinned to v2 for Collaboration Cursor compatibility |
| **Yjs** | CRDT engine for conflict-free real-time text collaboration |
| **Hocuspocus** | Standalone Node.js WebSocket server for Yjs sync |
| **Supabase** | PostgreSQL database + Native Auth (`@supabase/ssr`) + Cloud Storage |
| **Tailwind CSS v4 + Shadcn UI** | Styling (Nova preset, Radix component library) |
| **Zod + React Hook Form** | Client + server double validation |
| **SendGrid** | Transactional email for document invitations |
| **tsx** | Hocuspocus runtime (replaces deprecated `ts-node/nodemon` for Node v24+) |

> **Note:** We use **Supabase Native Auth** exclusively. Auth.js and Prisma are NOT used. GitHub is the sole OAuth provider, with credentials configured in the Supabase Dashboard (not `.env.local`).

---

## 2. The 3-Layer Architecture

| Layer | Type | Handles | Runs On |
|---|---|---|---|
| **Next.js** | App + API | UI, Auth, Dashboard, Routing, Server Actions, Edge Proxy | Vercel (Serverless) |
| **Supabase** | Database + Auth + Storage | Persisting documents, users, Yjs states, image assets, and authentication | Supabase Cloud |
| **Hocuspocus** | Real-time engine | WebSockets, Yjs sync, Presence, Cursor awareness | VPS (Render, Railway, etc.) |

```
Browser (User A)  ─── WebSocket ──→ ┌─────────────────────┐
Browser (User B)  ─── WebSocket ──→ │  Hocuspocus Server  │ ──→ Supabase (Postgres)
Browser (User C)  ─── WebSocket ──→ └─────────────────────┘
                                            ↑
                                     Next.js App
                                  (serves HTML pages)
                                  (handles Server Actions)
```

Next.js and Hocuspocus are completely decoupled. Next.js handles page rendering, server actions, and REST operations. Hocuspocus handles only the real-time WebSocket layer. They share only the Supabase database.

---

## 3. Why Hocuspocus Requires a Separate Node.js Server

**Vercel (and all serverless platforms) do not support persistent WebSocket connections.** A serverless function is stateless and short-lived — it spins up, processes a request, and is destroyed. A WebSocket requires a long-lived, persistent TCP connection that stays open for the entire editing session.

A standalone Node.js server (on a traditional VM or container) maintains persistent connections natively. Hocuspocus holds the current Yjs document state in memory for every open document, acting as the central relay.

> **Industry Standard:** Google Docs, Notion, and Figma all use this exact architecture — a separate WebSocket backend dedicated to real-time sync.

---

## 4. Hocuspocus Server Structure

The server lives in `/hocuspocus-server`, completely isolated from the Next.js `web/` application. It runs on `ws://0.0.0.0:1235` using the `tsx` runtime with built-in `--watch` for hot reloading.

```text
/hocuspocus-server
  ├── package.json                   # Dependencies (tsx, @hocuspocus/server, yjs, supabase-js)
  ├── tsconfig.json                  # ESNext module resolution
  └── src/
      ├── config/
      │   ├── env.ts                 # Centralized environment variable constants
      │   └── hocuspocus.config.ts   # Core logic — onAuthenticate, onLoadDocument, onStoreDocument hooks
      ├── lib/
      │   └── supabase.ts            # Supabase client (Service Role key to bypass RLS)
      └── server.ts                  # Entry point — starts HTTP/WebSocket listener
```

### The Three Lifecycle Hooks (`hocuspocus.config.ts`)

1. **`onAuthenticate`**: Validates the Supabase JWT `access_token` via `supabase.auth.getUser(token)`. Rejects expired, forged, or missing tokens immediately.
2. **`onLoadDocument`**: Fetches the saved base64 Yjs binary state from `document_content_state`, decodes it, and applies it via `Y.applyUpdate()`. The document is now byte-for-byte identical to the last save.
3. **`onStoreDocument`**: Encodes the entire Yjs document state into base64, upserts it to `document_content_state` with `onConflict: 'document_id'`. Stores binary CRDT state (not HTML/JSON) to preserve the full operation history required for offline merge.

---

## 5. The Three Supabase Clients

Next.js runs code in three distinct environments. Each requires its own Supabase client:

| Client | File | Used In | Cookie Mechanism |
|---|---|---|---|
| Browser | `src/lib/supabase/client.ts` | `'use client'` components | `document.cookie` |
| Server | `src/lib/supabase/server.ts` | Server Components & Server Actions | `next/headers` cookies() |
| Edge Proxy | `src/lib/supabase/proxy.ts` | Edge Proxy (`proxy.ts`) | NextRequest + NextResponse cookie bridge |

The Edge Proxy calls `supabase.auth.getUser()` on **every request**, silently refreshing expired JWTs via Refresh Tokens. This guarantees users are never randomly logged out.

> **Security Rule:** Always use `supabase.auth.getUser()` (not `getSession()`) for identity checks. `getSession()` trusts the cookie without server validation.

---

## 6. System Flow

```text
User Opens App
   ↓
Edge Proxy (proxy.ts) intercepts — validates session, refreshes JWT if needed
   ↓
Supabase Native Auth (GitHub OAuth PKCE or Email/Password)
   ↓
PostgreSQL Trigger (handle_new_user) auto-creates public.users profile
   ↓
Next.js App loads Dashboard (Server Component — fetches docs + permissions via Server Actions)
   ↓
User opens a document → page.tsx (Server Component) verifies membership via document_members JOIN
   ↓
Role (owner/editor/viewer) extracted and passed as prop to all children
   ↓
Tiptap Editor mounts with Yjs collaboration extensions
   ↓
HocuspocusProvider connects via WebSocket (sends JWT for onAuthenticate)
   ↓
Real-time sync: keystrokes → Hocuspocus → broadcast to all clients
   ↓
Persistence: onStoreDocument → base64 Yjs binary → upsert to document_content_state
```

---

## 7. Feature-Based Folder Structure

```text
src/
├── app/                          # Routing ONLY — page.tsx, layout.tsx, loading.tsx
│   ├── (main)/dashboard/
│   │   ├── (home)/               # Route group isolating loading.tsx skeleton
│   │   ├── [docId]/              # Document editor page
│   │   └── invite/               # Intermediate invite acceptance screen
│   ├── auth/callback/route.ts    # OAuth PKCE code exchange
│   ├── inbox/page.tsx
│   └── login/page.tsx
├── features/                     # All business logic lives here
│   ├── auth/                     # actions/, components/, schemas/
│   ├── dashboard/                # actions/, components/, hooks/
│   ├── document/                 # actions/, components/
│   ├── editor/                   # actions/, components/toolbar/, extensions/, config/
│   ├── inbox/                    # actions/, components/
│   └── invites/                  # actions/, components/
├── components/ui/                # Shadcn UI primitives
├── lib/supabase/                 # The 3 Supabase clients
├── constants/                    # env.ts, routes.ts
└── utils/                        # cn.ts, string-utils.ts, user-utils.ts
```

**Key Rules:**
- `app/` is strictly for URL routing. No UI components or business logic.
- One Server Action per file (`login.action.ts`, `create-document.action.ts`, etc.) for maximum tree-shaking.
- Complex components (Toolbar, Share Dialog, Document Header) are decomposed into single-responsibility sub-components.

---

## 8. Authentication & Route Protection

- **GitHub OAuth (PKCE):** Client-side redirect via `signInWithOAuth`, server-side code exchange in `app/auth/callback/route.ts`.
- **Email/Password:** Server Action calls `signInWithPassword()` directly.
- **Password Reset:** Generates a Magic Link via `resetPasswordForEmail`, routes through `auth/callback` PKCE exchange, and securely lands on `/update-password`.
- **Edge Proxy (`proxy.ts`):** Intercepts all routes. Public routes are whitelisted. Unauthorized access redirects to `/login?next=[intended_path]` — preserving invite tokens through sign-up flows.
- **Sign-Out:** Centralized `SignOutButton` with confirmation Dialog to prevent accidental logouts.

---

## 9. Role-Based Access Control

Roles (`owner`, `editor`, `viewer`) are enforced via the `document_members` table, checked server-side before any HTML renders:

| Element | Owner/Editor | Viewer |
|---|---|---|
| Rename pencil icon | ✅ Shown | ❌ Hidden |
| Invite button | ✅ Shown | ❌ Hidden |
| Formatting toolbar | ✅ Shown | ❌ Hidden |
| Tiptap `editable` prop | `true` | `false` (engine-level lock) |
| "View Only" badge | ❌ Hidden | ✅ Shown |

---

## 10. Deployment Strategy

1. **Frontend (Next.js):** Deploy to Vercel (serverless).
2. **Database + Auth + Storage:** Supabase Cloud.
3. **WebSocket Server (Hocuspocus):** Deploy as a persistent service on Render, Railway, Fly.io, or DigitalOcean.
