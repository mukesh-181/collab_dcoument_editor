# Authentication Architecture in CollabDoc

Our authentication system is designed to be blazingly fast, highly secure, and seamless for the user. We completely bypass heavy third-party state managers like Auth.js or ORMs like Prisma. Instead, we use **Supabase Native Auth** coupled with Next.js Server-Side Rendering (SSR) utilities.

This document details the *what*, the *how*, and the *why* of our authentication implementation.

---

## 1. The "Three Clients" Architecture

Because Next.js App Router executes code across three distinct runtime environments, using a single database client is impossible. We established three environment-specific Supabase clients to securely manage session cookies in every context:

1. **The Browser Client (`src/lib/supabase/client.ts`)**
   - **Where it's used:** Inside Client Components (files starting with `'use client'`).
   - **How it works:** It uses `createBrowserClient` to read and write sessions directly from the browser's `document.cookie`.
   - **The Approach:** When a user interacts with the UI (like clicking a button), this client seamlessly attaches their hidden session JWT to the request. We don't have to manually pass tokens around.

2. **The Server Client (`src/lib/supabase/server.ts`)**
   - **Where it's used:** Inside Server Components and Server Actions.
   - **How it works:** Since the Node.js server lacks a global `document`, this client extracts cookies from the incoming HTTP request headers using `next/headers` (`cookies().getAll()`).
   - **The Approach:** By reading cookies on the server, we can query the database directly before sending any HTML to the browser. This guarantees zero-layout-shift and securely enforces Row Level Security (RLS).

3. **The Edge Proxy (`src/proxy.ts` -> `src/lib/supabase/proxy.ts`)**
   - **Where it's used:** In the Next.js Edge runtime, executing on *every single request* before the page loads.
   - **How it works:** It calls `supabase.auth.getUser()`. If a user's session JWT has expired (typically after 1 hour), Supabase transparently uses the hidden Refresh Token to issue a new session, attaching the updated cookies to the `NextResponse`.
   - **The Approach:** This is our invisible gatekeeper. It strictly protects private routes (bouncing unauthorized users to `/login?next=[path]`) and ensures active users are *never* randomly logged out while typing, providing a flawless user experience.

---

## 2. Forms, Validation, and UX

We abandoned traditional HTML form submissions for a highly optimized, double-validated client-side approach.

### Client-Side Validation (`zod` + `react-hook-form`)
- **What we did:** We implemented `zod` schemas (`auth.schema.ts`) and bound them to Shadcn form components using `@hookform/resolvers`.
- **Why it's efficient:** If a user types a 3-character password, the form blocks the submission instantly in the browser. This saves a full network round-trip to the server, dramatically speeding up the UX and saving server resources.

### Graceful Feedback (`sonner` + Loading States)
- **What we did:** We eliminated full-page redirects on error. Instead, Server Actions return JSON payloads (`{ success, error }`).
- **The Approach:** When the user clicks submit, the button visually locks its dimensions and replaces its text with a centered spinner (`opacity-0` text + `absolute inset-0` spinner). If the server action fails, a beautiful, non-intrusive `sonner` toast notification pops up. No page flashes, no jitter.

---

## 3. GitHub OAuth (PKCE Flow)

We rely exclusively on GitHub for OAuth integration.

- **Configuration:** The credentials (`GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET`) are configured directly in the Supabase Dashboard, *not* in the local `.env`. Supabase's backend handles the secure handshake.
- **The PKCE Flow:** When the user approves the login on GitHub, they are redirected to our `app/auth/callback/route.ts` API route with a temporary code.
- **Why an API Route?:** By calling `exchangeCodeForSession(code)` on the server, we securely swap the code for a permanent session cookie before the user is ever routed to the dashboard. This prevents client-side token exposure and ensures the dashboard renders fully hydrated.

---

## 4. The Sign-Out Pattern

Instantly signing a user out when they misclick the "Log Out" button is a frustrating UX anti-pattern. 

- **What we did:** We centralized all logout logic into a single `SignOutButton` component.
- **The Approach:** The button wraps a Shadcn `Dialog` that asks "Are you sure you want to log out?". Upon confirmation, it executes a server action that calls `supabase.auth.signOut()`, obliterating the session cookies and returning them to the login screen. This adds a critical safety net while maintaining our premium application aesthetic.

---

## Conclusion

By leveraging Supabase Native Auth, we achieved an architecture where the database inherently knows exactly who is requesting data, enforcing RLS at the deepest level. The combination of Edge proxies, Server Actions, and Zod validation results in an enterprise-grade authentication flow that feels instantaneous to the user.
