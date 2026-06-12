# AGENTS Context & Log

**Purpose**: This file provides immediate, comprehensive context to any AI model/agent working on the `collab_docx` project. You MUST read this entire document to understand the architectural paradigms and security flows before taking action or suggesting changes.

## Current Architecture & Stack
- **Framework**: Next.js 15 (App Router)
- **Database & Authentication**: Supabase (Native Auth via `@supabase/ssr`). **NO Auth.js. NO Prisma.**
- **Routing & Security**: Edge Proxy (`src/proxy.ts` and `src/lib/supabase/proxy.ts`)
- **Styling & UI**: Tailwind CSS + Shadcn/Radix. 
- **Modularity**: Strict Feature-Based Folder Structure (`src/features/`).
- **Real-time Collaboration**: Active (Yjs & Standalone Hocuspocus WebSocket Server).

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

3. **Code Modularity & De-duplication**
   - **Avoid Monolithic Files**: Never write entire logic blocks in a single file. Break large components down into smaller sub-components (e.g. `DocumentRenameDialog`). This reduces Git conflicts, improves tree-shaking, and makes Next.js Fast Refresh instantaneous.
   - **Single Responsibility (SRP)**: Each server action MUST live in its own dedicated `.action.ts` file (e.g., `login.action.ts`).
   - **Reusability**: Extract duplicated UI elements into shared components (e.g., `<SignOutButton />`). Do not write complex modal/dialog code inline within a dropdown menu. Keep state localized to the components that need it.

4. **Feature-Based Folder Structure**
   - **DO NOT** clutter the Next.js `app/` router directory with UI components or server actions. The `app/` directory is strictly for URL routing (`page.tsx`, `layout.tsx`).
   - Place all logic inside `src/features/[feature_name]/`. For example, authentication components live in `src/features/auth/components/` and auth actions in `src/features/auth/actions/`.

5. **Phased Approach & Documentation**
   - Implement features step-by-step. Do not attempt massive monolithic PRs.
   - For every major feature, create/update an explanatory markdown file inside `docx/project/`.
   - Update `docx/project/step_by_step_log.md` with detailed explanations of *what* you did, *how* it works, and *why* you chose that approach.

---

## Detailed Progress & Context Log

The following timeline details the exact evolution of the project to help you understand the current state:

### Phase 1: Project Setup & Authentication Pivot (2026-06-04)
- **The Pivot**: Dropped Auth.js for Supabase Server-Side Rendering (SSR) packages to handle native sessions and Row Level Security. Supabase is the absolute source of truth.

### Phase 2: Feature-Based Refactoring & UI (2026-06-04)
- **Refactoring**: Moved tightly-coupled authentication logic out of the `app/` directory and into `src/features/auth/`.
- **OAuth Update**: App exclusively uses **GitHub OAuth**.

### Phase 3: Advanced Routing, Proxy, and Dashboard (2026-06-04)
- **Smart Redirects**: Implemented complex `next` parameter tracking with Edge Proxy intercepts.

### Phase 4: Core Database Schema (2026-06-05)
- **5-Table MVP Schema**: Finalized the `users`, `documents`, `document_members`, `document_content_state`, and `invites` tables. User data is synced from Supabase `auth.users` via a PostgreSQL Trigger.

### Phase 5 & 6: Production UI Polish & Server Actions (2026-06-05)
- **Validation**: Implemented strict validation schemas with Zod and React Hook Form.
- **Server Actions**: Actions return JSON payloads (`{ success, error }`) and utilize native toast notifications for instant feedback.
- **Auth-Aware UI**: Global Navbar and Landing Page are async Server Components that instantly display correct Call-To-Action states without client-side flicker.

### Phase 7 & 8: Real-Time Collaboration & Access Control (2026-06-09)
- **WebSockets**: Transitioned from REST database sync to an industry-standard Yjs + standalone Node.js Hocuspocus WebSocket server. Database persistence happens via hooks (`onStoreDocument`).
- **Invites & Presence**: Implemented secure one-time invite links with an intermediate "Accept/Cancel" onboarding screen. Enforced strict "Viewer" and "Editor" roles via the `document_members` table, and added Live Presence indicators (avatar bubbles) mapping connected clients.

### Phase 9: UX Polish & Codebase Modularization (2026-06-10)
- **Architectural Refactoring**: Decomposed monolithic files (e.g., a massive 600-line toolbar and bulk action files) into granular, single-responsibility components and dedicated `.action.ts` files to optimize Next.js tree-shaking and compilation speeds.
- **Interactive Consistency**: Implemented persistent hover states utilizing the CSS `:has` selector for dropdown menus, standardized destructive warning dialogs, extracted inline modals, and created a unified Sign Out confirmation flow.
