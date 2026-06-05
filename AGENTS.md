# AGENTS Context & Log

**Purpose**: This file provides immediate, comprehensive context to any AI model/agent working on the `collab_docx` project. You MUST read this entire document to understand the architectural paradigms and security flows before taking action or suggesting changes.

## Current Architecture & Stack
- **Framework**: Next.js 15 (App Router)
- **Database & Authentication**: Supabase (Native Auth via `@supabase/ssr`). **NO Auth.js. NO Prisma.**
- **Routing & Security**: Edge Proxy (`src/proxy.ts` and `src/lib/supabase/proxy.ts`)
- **Styling & UI**: Tailwind CSS + Shadcn/Radix. 
- **Modularity**: Strict Feature-Based Folder Structure (`src/features/`).
- **Real-time Collaboration**: (Upcoming) Yjs & Hocuspocus.

## Critical Implementation Rules for Agents

1. **Database & Auth Interaction (The 3 Clients)**
   Do not create generic Supabase clients. Next.js App Router runs in 3 environments, and you MUST use the correct client for the environment:
   - **Client Components (`'use client'`)**: Use `src/lib/supabase/client.ts`. It reads/writes cookies via the browser.
   - **Server Components & Actions (`'use server'`)**: Use `src/lib/supabase/server.ts`. It securely reads/writes cookies from Next.js headers.
   - **Edge Proxy**: Use `src/lib/supabase/proxy.ts`. It handles token refreshing globally.
   - *Never introduce Auth.js or Prisma. Stick to native Supabase RLS and Session management.*

2. **Routing & Proxy Protection**
   - The application uses an Edge Proxy (`src/proxy.ts` -> `src/lib/supabase/proxy.ts`) to intercept ALL routes.
   - Public routes (e.g., `/`, `/login`, `/auth/callback`) are explicitly whitelisted.
   - Unauthorized access to protected routes (e.g., `/dashboard`) forces a redirect to `/login?next=[intended_path]`.
   - Always ensure new public routes are added to the whitelist in `src/lib/supabase/proxy.ts`.

3. **Feature-Based Folder Structure**
   - **DO NOT** clutter the Next.js `app/` router directory with UI components or server actions. The `app/` directory is strictly for URL routing (`page.tsx`, `layout.tsx`).
   - Place all logic inside `src/features/[feature_name]/`. For example, authentication components live in `src/features/auth/components/` and auth actions in `src/features/auth/actions/`.

4. **Phased Approach & Documentation**
   - Implement features step-by-step. Do not attempt massive monolithic PRs.
   - For every major feature, create/update an explanatory markdown file inside `docx/project/`.
   - Update `docx/project/step_by_step_log.md` with detailed explanations of *what* you did, *how* it works, and *why* you chose that approach.

---

## Detailed Progress & Context Log

The following timeline details the exact evolution of the project to help you understand the current state:

### Phase 1: Project Setup & Authentication Pivot (2026-06-04)
- **Initial Plan**: The project started with the intention of using NextAuth/Auth.js.
- **The Pivot**: We quickly realized that bridging Auth.js sessions into Supabase Row Level Security (RLS) is overly complex. We dropped Auth.js entirely and installed `@supabase/ssr` to handle native sessions.
- **The Result**: Supabase is now the absolute source of truth for Authentication.

### Phase 2: Feature-Based Refactoring & UI (2026-06-04)
- **Refactoring**: Moved tightly-coupled authentication logic out of the `app/` directory and into `src/features/auth/`.
- **UI Components**: Installed Shadcn UI and created a stunning, minimalist Landing Page (`src/app/page.tsx`) and a central global Navbar (`src/components/layout/navbar.tsx`).
- **OAuth Update**: Removed Google OAuth. The app exclusively uses **GitHub OAuth**. The Client ID and Secret are managed directly in the Supabase Dashboard, NOT in the local `.env` file.

### Phase 3: Advanced Routing, Proxy, and Dashboard (2026-06-04)
- **Proxy Convention**: Next.js threw a framework warning regarding middleware. We renamed the routing interceptor to `proxy.ts`.
- **Smart Redirects**: Implemented complex `next` parameter tracking. If a user visits `/about` while logged out, they go to `/login?next=/about`. After logging in via Email or GitHub, they are seamlessly redirected back to `/about`.
- **Empty State Routes**: Created `/dashboard/page.tsx` and a dynamic `/dashboard/[docId]/page.tsx` that currently just display their pathnames in `<h1>` tags to prevent 404 errors during early development.

### Phase 4: Core Database Schema (2026-06-05)
- **Supabase Native Auth Realignment**: Updated the database schema to completely sever ties with Auth.js. User data is now synced directly from Supabase `auth.users` to `public.users` via a PostgreSQL Trigger.
- **5-Table MVP Schema**: Finalized the `users`, `documents`, `document_members`, `document_content_state`, and `invites` tables.
- **Documentation Overhaul**: Created `docx/project/db.md` and updated `docx/DATABASE.md` to reflect the new architecture. All subsequent Phase 2 Dashboard actions will now query these finalized tables.

### Phase 5: Client and Server Validation (2026-06-05)
- **Zod & React Hook Form**: Implemented strict validation schemas (`loginSchema` and `registerSchema`). Replaced standard HTML forms with `react-hook-form` to prevent network requests on invalid input.
- **Server Actions**: Updated auth actions to return JSON payloads (`{ success, error }`) instead of utilizing Next.js `redirect()` on error.
- **Sonner Toasts**: Added native toast notifications for instant, non-intrusive feedback on login/signup success or failure.

### Phase 6: Production UI Polish & Hydration Fixes (2026-06-05)
- **Hydration Mismatches**: Resolved SSR vs. Client rendering mismatches by removing `asChild` from nested Radix primitives in Server Components, preventing full client-side tree regeneration.
- **Auth-Aware UI**: Converted the global Navbar and Landing Page into async Server Components. They now check `supabase.auth.getUser()` on the server to instantly display the correct Call-To-Action ("Get Started" vs "Log In") without client-side flicker.
- **Dashboard Refinements**: Built a dynamic `SidebarDocList` Client Component to track the active URL and highlight the current document. Polished hover states, integrated Shadcn's native `variant="destructive"` for delete menus, and removed redundant mobile hamburger navigation.
- **Documentation**: Added `docx/project/folder_structure.md` to provide agents with a comprehensive, one-liner mapping of the entire `web/` directory and its architectural rules.
