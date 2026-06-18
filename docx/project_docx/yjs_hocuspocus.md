# Real-Time Collaboration: Yjs & Hocuspocus

This document explains the architecture of CollabDoc's real-time collaboration engine — how multiple users type simultaneously without conflicts, how the WebSocket server works, how documents are persisted, and how the frontend integrates with the collaboration layer.

---

## 1. The Core Concept: CRDTs (Conflict-free Replicated Data Types)

When multiple people edit a document simultaneously, you face a fundamental problem: whose edit wins? A naive last-write-wins approach loses data. Operational Transforms (OT), used by early Google Docs, work but are complex and require a central sequencing server.

**CRDTs take a fundamentally different approach.** A CRDT is a mathematical data structure with a merge function that is:
- **Commutative:** `merge(A, B) = merge(B, A)` — order doesn't matter.
- **Associative:** `merge(merge(A, B), C) = merge(A, merge(B, C))` — grouping doesn't matter.
- **Idempotent:** `merge(A, A) = A` — merging the same change twice is safe.

Because of these properties, any set of concurrent changes from any number of users will always merge to the **exact same result**, regardless of arrival order. No central sequencing server is needed. No changes are ever lost.

### How Yjs Works

We use **[Yjs](https://yjs.dev/)**, which implements the YATA algorithm optimized for text editing. Instead of saving "final HTML," Yjs maintains a mathematically traceable history of every keystroke, deletion, and formatting change (operations). Every character insertion and deletion is a CRDT operation. Yjs handles the merge math automatically — we just tell it what the user typed, and it guarantees convergence across all clients.

---

## 2. The WebSocket Backend: Hocuspocus

Yjs handles the math, but needs a transport layer. Next.js (especially on serverless platforms like Vercel) is stateless and cannot maintain persistent WebSocket connections.

This is why we run a **separate, standalone Node.js server** using **[Hocuspocus](https://tiptap.dev/hocuspocus)** — the official Tiptap-maintained WebSocket server for Yjs.

### Architecture

```
Browser (User A)  ─── WebSocket ──→ ┌─────────────────────┐
Browser (User B)  ─── WebSocket ──→ │  Hocuspocus Server  │ ──→ Supabase (Postgres)
Browser (User C)  ─── WebSocket ──→ └─────────────────────┘
                                            ↑
                                     Next.js App
                                  (serves HTML pages)
                                  (handles Server Actions)
```

- Hocuspocus lives in `/hocuspocus-server`, completely isolated from the Next.js `web/` app.
- It runs on `ws://0.0.0.0:1235` using the **`tsx`** runtime (built on `esbuild`).
- Next.js and Hocuspocus are fully decoupled. They share only the Supabase database.
- Hocuspocus holds the current Yjs document state in memory, acting as the central relay: all clients send updates to it, it merges them via Yjs, and broadcasts the merged state.

### Why `tsx` Instead of `ts-node`

The Hocuspocus server originally used `ts-node` with `nodemon`. After a Node.js v24 upgrade, this broke:
- `ts-node/esm` is deprecated, throwing `ExperimentalWarning` errors on every startup.
- Cached `nodemon` processes held ports open, causing `EADDRINUSE` crashes.

`tsx` (built on `esbuild`) starts in under 100ms, produces zero warnings on Node v24+, has built-in `--watch` for hot reloading, and handles ES Modules natively. Dev script: `"dev": "tsx --watch src/server.ts"`.

### Server Structure

```text
/hocuspocus-server
  ├── package.json                   # Dependencies (tsx, @hocuspocus/server, yjs, supabase-js)
  ├── tsconfig.json                  # ESNext module resolution
  └── src/
      ├── config/
      │   ├── env.ts                 # Centralized environment variable constants
      │   └── hocuspocus.config.ts   # Core logic — the 3 lifecycle hooks
      ├── lib/
      │   └── supabase.ts            # Supabase client (Service Role key to bypass RLS)
      └── server.ts                  # Entry point — starts HTTP/WebSocket listener
```

---

## 3. Database Persistence: The 3 Lifecycle Hooks

If documents only lived in WebSocket memory, a server restart would wipe everything. Hocuspocus provides three lifecycle hooks in `hocuspocus.config.ts` that bridge to Supabase.

### Hook 1: `onAuthenticate`

Fires when a client first connects via WebSocket. The client sends their Supabase JWT `access_token` as a connection parameter.

```ts
async onAuthenticate({ token }) {
  const supabase = createClient();
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) throw new Error('Unauthorized');
  return { user };
}
```

This validates the JWT against Supabase's auth server on every connection. Expired, forged, or missing tokens are rejected immediately. The server never trusts a client simply because they know a document ID.

### Hook 2: `onLoadDocument`

Fires when a client connects to a document not yet in the server's memory (e.g., after a restart or when the first user opens it).

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

`documentName` is the document UUID. The hook fetches the saved base64 Yjs binary, decodes it, and applies it via `Y.applyUpdate()`. The document is now byte-for-byte identical to the last save.

### Hook 3: `onStoreDocument`

Fires whenever the Yjs document state changes (every keystroke from any user, debounced).

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

**Why binary CRDT state instead of HTML/JSON?** The Yjs binary encodes not just current content but the entire operation history, including tombstoned (deleted) characters. This is what enables offline merge: when a user reconnects, Yjs applies their operations against the full history. Storing only HTML/JSON would lose this history and break offline merge.

**Why `upsert` with `onConflict`?** Without it, the first save attempts an `INSERT` (succeeds), but every subsequent save also attempts an `INSERT` (fails with Unique Constraint violation). `onConflict: 'document_id'` tells Postgres to `UPDATE` the existing row instead.

---

## 4. Frontend Integration

On the client side, the `Editor` component (`src/features/editor/components/editor.tsx`) sets up the collaboration layer.

### Tiptap Collaboration Extensions

1. **`@tiptap/extension-collaboration`**: Replaces Tiptap's native HTML history engine (Undo/Redo) with Yjs. The editor becomes a visual projection of the Yjs CRDT state.
2. **`@tiptap/extension-collaboration-cursor`**: Broadcasts cursor positions via the Yjs Awareness protocol. Renders remote cursors as colored carets (`.collaboration-cursor__caret`) with floating name labels (`.collaboration-cursor__label`), styled with custom CSS in `globals.css`.

> **Critical:** We are pinned to Tiptap **v2** (`^2.27.2`). Tiptap v3 breaks `@tiptap/extension-collaboration-cursor`. Do NOT upgrade.

### Provider Setup

```ts
// 1. Y.Doc stored in useState to survive React Strict Mode
const [ydoc] = useState(() => new Y.Doc());

// 2. Create Hocuspocus provider
const provider = new HocuspocusProvider({
  url: process.env.NEXT_PUBLIC_HOCUSPOCUS_URL,  // ws://localhost:1235
  name: documentId,                              // document UUID → documentName on server
  document: ydoc,
  token: accessToken,                            // Supabase JWT for onAuthenticate
  onStatus: ({ status }) => {
    if (status === 'connected') setSyncState('saved');
    if (status === 'disconnected') setSyncState('offline');
  },
});

// 3. Pass ydoc to Tiptap
const extensions = [
  Collaboration.configure({ document: ydoc }),
  CollaborationCursor.configure({
    provider,
    user: { name: userName, color: cursorColor },
  }),
  // ... all other extensions
];
```

**Why `useState(() => new Y.Doc())`?** React Strict Mode double-invokes component bodies in development. Without `useState`, Strict Mode creates two Y.Doc instances — the provider binds to one, Tiptap to the other, and they diverge. `useState` with an initializer ensures the Y.Doc is created exactly once.

**The `accessToken` source:** On the document page server component, we call `getUser()` (for identity) and `getSession()` (only to extract the raw JWT string). The JWT is passed as a prop to the Editor. `getUser()` doesn't return the token string — only the user object.

---

## 5. Live Cursors & Presence

### Cursor Rendering

Each user gets a deterministic color from a palette of vibrant Tailwind colors (based on their user ID hash). Tiptap renders:
- `.collaboration-cursor__caret` — a colored vertical line at the cursor position.
- `.collaboration-cursor__label` — a floating name chip above the caret with drop shadow, border-radius, and smooth `opacity` + `translateY` entry animation.

### Active Users Cluster

Beyond in-document cursors, the `DocumentHeader` shows overlapping avatar bubbles for every connected user:

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

Each avatar has a Tooltip showing "Online Now." The cursor color ring on each avatar matches their in-document caret — creating a visual link between header presence and document cursors.

---

## 6. The Sync State Indicator

The Editor drives three sync states via `DocumentContext`:

| State | When | Header Display |
|---|---|---|
| `saving` | Provider is actively writing to Supabase | Pulsing animated cloud icon |
| `saved` | Last save completed successfully | Cloud with checkmark |
| `offline` | WebSocket disconnected | Amber warning icon + "Offline" text |

The `DocumentSyncStatus` component reads `syncState` from context and renders the appropriate indicator.

---

## 7. Offline Resilience

If the user's internet drops, the WebSocket closes. The provider's `onStatus` fires with `disconnected`, setting `syncState('offline')`. The `OfflineBanner` component becomes visible:

> ⚠️ **You are offline.** Changes are being saved locally and will sync when you reconnect.

The user can **continue typing** — this is the CRDT guarantee. Yjs stores every operation locally in the in-memory Y.Doc. On reconnect, the provider automatically sends the accumulated operations to Hocuspocus, which merges them via Yjs's CRDT algorithm. All changes from all users — including those who typed while this user was offline — are merged without conflict.

The offline banner is purely informational. It **never blocks or dims the editor** — the CRDT model exists precisely so users can work through interruptions seamlessly.
