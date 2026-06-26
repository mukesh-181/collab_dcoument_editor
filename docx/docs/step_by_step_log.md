# Step-by-Step Implementation Log

This document serves as a detailed log of every major step, code generation, and architectural decision made during the project. It explains *what* was done, *how* it works, and *why* specific lines or approaches were used.

---

## Step 2: Supabase Setup (2026-06-04)

We installed the Supabase Server-Side Rendering (SSR) packages (`@supabase/supabase-js` and `@supabase/ssr`) and created three utility files in `web/src/utils/supabase/`. 

Because Next.js App Router runs code in three different environments (Browser, Node.js Server, and Edge Proxy), we cannot use a single, simple database client. We have to create three separate "clients" that know how to handle cookies in their specific environment.

### 1. `client.ts` (For Client Components)
This file is used whenever you have a component with `'use client'` at the top.

```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```
**How it works & Why we use it:**
- **`createBrowserClient`**: We use this specific function because it automatically knows how to read and write cookies in the browser environment via `document.cookie`. 
- **The Approach**: When a user is logged in, their session is stored in an HTTP cookie. When you make a database request from a Client Component, the browser automatically attaches this cookie to the request. This means you don't have to manually pass the user's token around; Supabase handles it securely behind the scenes.

### 2. `server.ts` (For Server Components & API Routes)
This file is used in Server Components (the default in Next.js) and Server Actions.

```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient( url, key, {
    cookies: {
      getAll() { return cookieStore.getAll() },
      setAll(cookiesToSet) { /* loops and sets cookies */ }
    }
  })
}
```
**How it works & Why we use it:**
- **`next/headers` -> `cookies()`**: Unlike the browser, the server doesn't have a global `document.cookie`. To read the user's session cookie on the server, we have to extract it from the incoming HTTP request headers. `cookies()` gives us access to those headers.
- **The `getAll()` and `setAll()` methods**: We are essentially building a bridge between Next.js and Supabase. We are telling the Supabase client: *"Here is how you read cookies from the Next.js request (`getAll`), and here is how you write cookies back to the Next.js response (`setAll`)."*
- **The Approach**: By securely reading the cookie on the server, we can query the database directly from our server components (making our app incredibly fast) while strictly enforcing Row Level Security (RLS) policies so users can only see their own data.

### 3. `proxy.ts` (For Edge Proxy)
This file is executed on every single page load before the page even renders.

```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Inside updateSession():
let supabaseResponse = NextResponse.next({ request })
// ... initializes createServerClient with cookie handlers ...
await supabase.auth.getUser()
return supabaseResponse
```
**How it works & Why we use it:**
- **`NextResponse.next()`**: We create an initial "response" object that basically says "let the user continue to the page they requested."
- **`await supabase.auth.getUser()`**: This is the most critical line. Sessions (JWTs) expire eventually (usually after 1 hour). When we call `getUser()` in the proxy, Supabase checks if the session is expired. If it is expired, Supabase automatically uses a hidden "Refresh Token" to generate a brand-new, valid session.
- **The Approach**: Because we wired up the `setAll` cookie logic in this file, when Supabase generates that new session, it immediately attaches the new cookies to `supabaseResponse`. This guarantees that your user never gets randomly logged out while actively using the app.

---

## Step 2.5: Supabase Shadcn Integration (2026-06-04)

Based on your provided instructions, we ran the Shadcn integration for Supabase:
`npx shadcn@latest add @supabase/supabase-client-nextjs`

### What we did & How it works
1. **Shadcn Initialization**: Because we hadn't initialized Shadcn in this project yet, the command first ran a preflight check and created a `components.json` file. It automatically detected Next.js and Tailwind v4. We selected the **Radix** component library and the **Nova** preset.
2. **Supabase Utility Bootstrap**: The command automatically generated the Supabase client utilities (similar to the logic we wrote manually in Step 2) but placed them inside `src/lib/supabase/`. 
3. **Environment Variables**: We created `.env.local` and added `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Note that standard Supabase uses `ANON_KEY`, but the new shadcn integration specifically looks for `PUBLISHABLE_KEY` (which is functionally the exact same string from your Supabase dashboard).

### Why we used this approach
Using the official `shadcn` Supabase package is highly beneficial because it guarantees that our database clients are perfectly aligned with the UI components we will install later. It automatically handles the exact imports and types needed. To keep things clean, I also deleted the manual `src/utils/supabase` folder we created earlier so there are no duplicate files.

---

## Step 3: Auth UI & Logic (2026-06-04)

We generated the user interface and backend logic for authentication. This includes Email/Password login, Signup, and OAuth integration (Google/GitHub).

### 1. `features/auth/actions/auth.actions.ts` (Server Actions)
```typescript
'use server'
import { createClient } from '@/lib/supabase/server'
// ...
export async function login(formData: FormData) {
  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  // ...
}
```
**How it works & Why we use it:**
- **Server Actions (`'use server'`)**: These are secure, server-side functions that can be called directly from HTML `<form>` elements or client components. 
- **The Approach**: By using Server Actions, we securely process the user's password entirely on the server. We initialize the Supabase server client, authenticate the credentials, and Supabase automatically sets the session cookies via the `setAll` method we configured in Step 2. If it succeeds, we redirect the user; if it fails, we return an error message in the URL search parameters.

### 2. `features/auth/components/oauth-buttons.tsx` (Client OAuth Handlers)
```tsx
'use client'
import { createClient } from '@/lib/supabase/client'
// ...
export function OAuthButtons() {
  const supabase = createClient()
  const handleOAuth = async (provider) => {
    await supabase.auth.signInWithOAuth({ provider, options: { redirectTo: ... } })
  }
}
```
**How it works & Why we use it:**
- **`signInWithOAuth`**: This Supabase method redirects the user to the provider (e.g., Google). After successful login, the provider redirects the user back to our `redirectTo` URL.
- **The Approach**: We must use `'use client'` because this involves browser redirection. We initialize the Supabase browser client, and bind the `handleOAuth` function to our Shadcn buttons.

### 3. `app/auth/callback/route.ts` (OAuth Redirect Handler)
```typescript
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // ...
  const { error } = await supabase.auth.exchangeCodeForSession(code)
}
```
**How it works & Why we use it:**
- **`exchangeCodeForSession`**: When Google/GitHub redirects the user back to our app, they include a temporary "auth code" in the URL. This route handler takes that code and securely swaps it with Supabase for a permanent session JWT.
- **The Approach**: This is standard OAuth 2.0 PKCE flow. Handling this in a Next.js API Route ensures the session cookies are safely established on the server before the user is redirected to the `/dashboard`.

### 4. `app/login/page.tsx` (Minimalist UI)
**How it works & Why we use it:**
- **Shadcn UI**: We used `npx shadcn@latest add card input button label separator` to get beautiful, accessible components.
- **The Approach**: We built a centered card (`h-screen flex items-center justify-center`) combining the `OAuthButtons` client component and a standard HTML `<form>` for the Email/Password inputs. We linked the form submission to our server actions using the `formAction={login}` attribute on the submit button. This keeps the page itself as a Server Component, drastically improving load speed and SEO.

---

## Step 4: Feature-Based Refactoring & Landing Page (2026-06-04)

We successfully refactored the project architecture to follow a strict **Feature-Based Folder Structure**, created a global **Navbar** component, and implemented a premium **Landing Page**.

### 1. Feature-Based Architecture
**What we did:**
- Created the `src/features/auth` directory.
- Moved `app/login/actions.ts` -> `src/features/auth/actions/auth.actions.ts`.
- Moved `app/login/oauth-buttons.tsx` -> `src/features/auth/components/oauth-buttons.tsx`.
- Extracted the login UI into `src/features/auth/components/login-form.tsx`.

**How it works & Why we use it:**
- **The Approach**: Previously, UI components and server actions were tightly coupled inside the Next.js `app/` router directory. This creates a messy "spaghetti code" structure as the app scales. By moving them into `src/features/`, the `app/` directory becomes exclusively responsible for URL routing. Any page simply imports the pre-packaged features it needs. This ensures code reusability, isolation, and significantly easier debugging.

### 2. Global Navbar Component (`src/components/layout/navbar.tsx`)
**What we did:**
- Built a global navigation bar utilizing Shadcn UI Buttons, featuring a responsive, glassmorphic (`backdrop-blur-md`) design, displaying the "CollabDoc" branding and Login/Signup routes.

**How it works & Why we use it:**
- **The Approach**: We placed this in `src/components/layout` so that it can be imported across any page or layout without duplicating the HTML structure. This directly satisfies the requirement to reuse components and avoid code duplication.

### 3. Premium Landing Page (`src/app/page.tsx`)
**What we did:**
- Replaced the default Next.js boilerplate with a custom landing page. It includes the new global Navbar, a modern hero section with gradient text ("Write together, in real-time"), pulse animations, and a CSS-based minimalist mockup of the collaborative editor.

**How it works & Why we use it:**
- **The Approach**: Tailoring the home page to the project builds immediate aesthetic value. The use of Tailwind CSS utility classes (like `animate-pulse` and `bg-gradient-to-r`) allows us to achieve a highly dynamic, "wow-factor" design without needing complex external animation libraries.

---

## Step 4.1: OAuth UI Update (2026-06-04)

We updated the OAuth integration to exclusively use **GitHub**.

### What we did & How it works
- Modified `src/features/auth/components/oauth-buttons.tsx` to remove the Google login button.
- Updated the grid layout (`grid-cols-2` -> `flex w-full`) so the GitHub button expands to fill the entire width of the card.
- **Environment Variables Note**: For Supabase OAuth, the `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` are **not** placed in the Next.js `.env.local` file. Instead, they must be added directly to your Supabase Dashboard under `Authentication -> Providers -> GitHub`. This is because the Supabase backend server performs the secure OAuth handshake, not the Next.js frontend.

---

## Step 5: Dashboard Architecture & Route Protection (2026-06-04)

We implemented the authenticated Dashboard shell and strictly locked down its routes.

### 1. Route Protection (`src/proxy.ts` & `src/lib/supabase/proxy.ts`)
**What we did:**
- Created the Next.js Edge Proxy file (`src/proxy.ts`) to intercept every incoming request.
- Configured the proxy to execute `updateSession` from our Supabase utilities.
- Updated `updateSession` to specifically protect all routes (except public ones). If no user session is found, it redirects to `/login`.

**How it works & Why we use it:**
- **The Approach**: Without this, a user could manually type `localhost:3000/dashboard` into their browser and see the page even if they aren't logged in. The proxy checks the Supabase session token on the Edge server before the page even begins to load, guaranteeing that unauthorized users are bounced back to the login screen immediately.

### 2. Dashboard Layout (`src/features/dashboard/components/dashboard-layout.tsx`)
**What we did:**
- Created a robust UI shell composed of a sticky Sidebar and a Top Navbar.
- The Sidebar includes a prominent "New Document" button and a placeholder list of documents.
- The Top Navbar includes a "Sign Out" button.

**How it works & Why we use it:**
- **The Approach**: Following our Feature-Based architecture, we isolated this massive UI component inside `src/features/dashboard/`. We then imported it into `src/app/dashboard/layout.tsx`. By wrapping the children inside `layout.tsx`, Next.js ensures that the Sidebar and Navbar never re-render when you navigate between different documents, making the app feel incredibly fast and app-like.

### 3. Dashboard Pages
**What we did:**
- Created the root dashboard page (`src/app/dashboard/page.tsx`) with an `<h1>` displaying `/dashboard`.
- Created a dynamic document route (`src/app/dashboard/[docId]/page.tsx`) with an `<h1>` displaying the specific document ID (e.g., `/dashboard/doc-1`).

**How it works & Why we use it:**
- **The Approach**: You requested placeholders to verify navigation without hitting 404 errors. By utilizing Next.js dynamic routing (`[docId]`), any URL like `/dashboard/123` will automatically route to the document page and extract `123` as a parameter.

### 4. Advanced Routing & Sign Out (Proxy Update)
**What we did:**
- Renamed `middleware.ts` to `proxy.ts` to comply with the Next.js framework warning you encountered.
- Updated `src/lib/supabase/proxy.ts` to strictly protect *all* routes in the application, except explicitly public ones (`/`, `/login`, `/auth/callback`).
- Integrated `next` redirect parameters. If an unauthorized user tries to access `/about`, they are redirected to `/login?next=/about`. Once they log in, the server actions dynamically redirect them to `/about` instead of hardcoding `/dashboard`.
- Connected the "Sign Out" button in the `DashboardLayout` to a server action that invokes `supabase.auth.signOut()` and destroys the session cookies.

### 5. Client and Server Validation (Zod + React Hook Form)
**What we did:**
- Installed `zod`, `react-hook-form`, `@hookform/resolvers`, `sonner`, and `@radix-ui/react-tabs` via Shadcn.
- Created `src/features/auth/schemas/auth.schema.ts` defining strict types and validation rules for `loginSchema` and `registerSchema` (requiring 8+ char passwords and valid emails).
- Redesigned the authentication page to use an `AuthTabs` component, allowing users to toggle between a `LoginForm` and `RegisterForm`.
- Refactored `auth.actions.ts` Server Actions to utilize Zod's `safeParse` for server-side validation. The actions now return JSON payloads (`{ success, error }`) instead of utilizing Next.js `redirect()` internally on error.
- Implemented `toast` notifications from `sonner` inside the client forms to cleanly display success and error states directly to the user.

**How it works & Why we use it:**
- **The Approach**: Previously, standard HTML `<form action={login}>` caused full-page flashes and opaque server redirects when authentication failed. By adopting React Hook Form and Zod, we intercept the submission, validate the data locally (saving a network request), display a loading spinner, and gracefully handle server responses using beautiful, non-intrusive Toast notifications. This results in a massive UX improvement and ensures double validation (client-side & server-side).
---

## Step 6: Database Schema & Supabase Triggers (2026-06-05)

We established the 5-table core MVP database schema to support document CRUD operations and real-time collaboration.

### 1. The Schema Transition
**What we did:**
- Updated the database documentation (`DATABASE.md`) to reflect the pivot from Auth.js to **Supabase Native Auth**.
- Designed the core 5 tables: `users` (public profiles), `documents` (metadata), `document_members` (access control), `document_content_state` (Yjs real-time state), and `invites`.
- Created dedicated connection documentation in `docx/project/db.md`.

**How it works & Why we use it:**
- **The Approach**: Because Supabase securely manages authentication within its own hidden `auth.users` schema, we do not need our Next.js application to manually insert user records upon signup. We created a `public.users` table for public profiles (names, avatars) and linked it to `auth.users` via a Foreign Key.

### 2. PostgreSQL Triggers
**What we did:**
- Wrote a PostgreSQL Database Trigger (`handle_new_user`) that automatically executes whenever a new row is inserted into `auth.users`.
- The trigger takes the raw metadata (full name, avatar) and automatically creates a corresponding row in our `public.users` table.

**How it works & Why we use it:**
- **The Approach**: This prevents data duplication and eliminates race conditions. The Next.js frontend simply calls the standard Supabase `signUp` methods, and the PostgreSQL database handles building the public profile entirely behind the scenes. This ensures maximum data integrity.

---

## Step 7: Document CRUD & Dashboard UI Integration (2026-06-05)

We replaced the placeholder dashboard UI with real database interactions, allowing users to create, view, and delete documents natively connected to Supabase.

### 1. Server Actions (`features/dashboard/actions/document.actions.ts`)
**What we did:**
- Created `createDocument()`, `getUserDocuments()`, and `deleteDocument()`.
- Implemented a two-step transaction for creation: inserting into `documents` and immediately inserting the user as `owner` into `document_members`.

**How it works & Why we use it:**
- **The Approach**: Using Next.js Server Actions ensures all database logic (and checking `supabase.auth.getUser()`) is safely executed server-side. We use `revalidatePath('/dashboard')` after creation or deletion so the UI instantly updates without a hard refresh.

### 2. Async UI Refactoring (`dashboard-layout.tsx` & `dashboard/page.tsx`)
**What we did:**
- Converted `DashboardLayout` into an async Server Component to fetch `getUserDocuments()`.
- Mapped over the fetched documents to render sidebar links.
- Transformed the root `/dashboard` page to render a premium grid of documents using Shadcn `Card` components, displaying titles, dates, and member roles.
- Wired up the "New Document" button using `<form action={createDocument}>` and the delete button using the Server Action `.bind()` pattern.

**How it works & Why we use it:**
- **The Approach**: In Next.js App Router, combining Server Components (for data fetching) with Server Actions (for data mutation via `<form>`) allows us to build extremely fast, zero-JS-required interactive pages. The `.bind(null, doc.id)` pattern cleanly passes arguments to server actions without needing to convert the entire Card into a Client Component.

---

## Step 8: Production UI Overhaul & Dashboard Navigation (2026-06-05)

We stripped away the "vibe-coded" aesthetics (heavy gradients, massive blurs, glowing shadows) and implemented a strict, professional, production-grade interface modeled after top-tier products like Stripe, Linear, and Vercel.

### 1. Landing Page & Global Navbar Redesign
**What we did:**
- Removed `bg-gradient-to-r`, `animate-pulse`, and excessive `backdrop-blur` classes from `src/app/page.tsx` and `src/components/layout/navbar.tsx`.
- Implemented a strict 4px/8px grid system with solid backgrounds (`bg-white` and `bg-zinc-950`).
- Rewrote the hero copy to be highly structured and utilitarian.
- Updated the "Sign Up" button in the navbar to navigate to `/login?tab=register`.

**Why we use it:**
- True production-grade UI relies on clear hierarchy, crisp borders (`border-zinc-200`), and minimalist elegance rather than flashy animations. This ensures the app feels like a trustworthy SaaS product rather than an AI-generated template.

### 2. Dashboard Architecture Upgrades
**What we did:**
- Installed Shadcn `sheet`, `avatar`, and `dropdown-menu` components.
- Extracted the active user's metadata by executing `await supabase.auth.getUser()` inside `DashboardLayout`.
- Built a mobile-responsive **Hamburger Menu** (`Sheet`) that triggers the sidebar on smaller screens.
- Added a polished `Avatar` in the top right corner of the navbar displaying the user's name or initial.
- Converted the dashboard document view (`src/app/dashboard/page.tsx`) from oversized stacked cards into a sleek, compact table-list view.

**How it works & Why we use it:**
- **The Approach**: By pushing the user data extraction to the server component (`DashboardLayout`), we securely retrieve their identity without a loading spinner. The `Sheet` component provides a native-feeling slide-out drawer for mobile users without compromising the desktop sidebar experience. The table-list view maximizes information density and readability, mimicking professional developer tools.

---

## Step 9: Authentication UI Refinement & Hydration Fixes (2026-06-05)

We meticulously polished the authentication flows to achieve pixel-perfect rendering and resolved critical Server-Side Rendering (SSR) bugs introduced by Shadcn's base components.

### 1. Pixel-Perfect Authentication Tabs (`auth-tabs.tsx` & `tabs.tsx`)
**What we did:**
- Overhauled the `TabsList` and `TabsTrigger` components by replacing Shadcn's default height math (`h-[calc(100%-1px)]`) with a robust CSS Grid approach (`h-14` parent, `h-full` children).
- Implemented a centered, structural 1px vertical separator using `grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]` to guarantee flawless alignment.
- Added explicitly defined interactive states (`hover:text-zinc-900`, `data-[state=active]:bg-zinc-900`) for absolute contrast between active and inactive tabs.

**Why we use it:**
- **The Approach**: Relying on internal padding and pseudo-element borders (`after:absolute`) often causes layout shifts when components are resized. Forcing a rigid flex/grid constraint ensures the UI never breaks, scales beautifully, and looks mathematically perfect.

### 2. Form Experience & Security Toggles
**What we did:**
- Added explicit red asterisks (`*`) to all required labels (`Username`, `Email`, `Password`).
- Added strict, contextual placeholders (`login@gmail.com`, `********`).
- Built functional "Show/Hide Password" toggles directly into the input fields using `lucide-react`'s `Eye` and `EyeOff` icons.

**Why we use it:**
- **The Approach**: Enhances accessibility and significantly reduces user frustration during login and registration. Visual feedback and explicit requirements create a trustworthy user experience.

### 3. Layout Simplification
**What we did:**
- Completely stripped out the mobile hamburger menu (`Sheet`) and unused `lucide-react` icons from the `DashboardLayout`.
- Cleaned up the top navigation bar to maintain strict minimalism.

**Why we use it:**
- **The Approach**: Reduces DOM complexity and eliminates unnecessary client-side JS overhead for components that are no longer strictly necessary for the core product flow.

---

## Step 10: Auth-Aware Navigation & Sidebar Active State (2026-06-05)

We made the public-facing pages session-aware and added URL-based active highlighting to the dashboard sidebar.

### 1. Auth-Aware Navbar & Landing Page (`navbar.tsx` & `page.tsx`)
**What we did:**
- Converted the global `Navbar` and the root landing page into **async Server Components** that call `supabase.auth.getUser()` on the server.
- If the user is logged in, the navbar shows a single **"Get Started"** button linking to `/dashboard`. If not, it shows the original **"Log in"** + **"Sign up"** buttons.
- The hero CTA button on the landing page similarly switches between **"Go to Dashboard"** and **"Start writing for free"** based on session state.

**Why we use it:**
- **The Approach**: Checking auth on the server means zero client-side flicker. The correct buttons render on the very first paint, providing a seamless experience whether the user is authenticated or not.

### 2. Sidebar Active Document Highlighting (`sidebar-doc-list.tsx`)
**What we did:**
- Created a new **Client Component** (`src/features/dashboard/components/sidebar-doc-list.tsx`) that uses `usePathname()` from `next/navigation` to detect the current URL.
- Compares the pathname against each document's route (`/dashboard/{docId}`) and applies a visible `bg-zinc-300` background with bold text to the active match.
- Locked the hover state on the active item so it keeps its selected background instead of flashing to the lighter hover color.
- Increased sidebar document items from `h-8` to `h-9` for better readability.
- Added a horizontal separator below the "New Document" button to visually separate actions from the document list.
- Increased the "Your Documents" section label from `text-[11px]` to `text-xs`.

**Why we use it:**
- **The Approach**: `usePathname()` is a client-side hook, so we extracted only the document list into a tiny Client Component while keeping the rest of `DashboardLayout` as a Server Component. This minimizes the client JS bundle while still enabling dynamic URL-based highlighting.

### 3. Delete Dropdown Hover Refinement (`dashboard/page.tsx`)
**What we did:**
- Updated the delete option inside the `DropdownMenu` to show a subtle **red background** (`bg-red-50`) on hover instead of changing the trash icon color.
- The text and icon remain consistently red at all times for clarity.

**Why we use it:**
- **The Approach**: Changing icon colors on hover can feel jarring. A soft background tint provides the same interactive feedback while keeping the destructive intent visually clear and consistent.

## Step 11: Document Page Security & Header (2026-06-08)

We transitioned the dynamic document route from a placeholder into a secure, functional page by implementing Phase 3 of our roadmap.

### 1. Document Server Action (`document.actions.ts`)
**What we did:**
- Created `getDocumentById(docId)` in `src/features/document/actions/document.actions.ts`.
- The action queries Supabase for the specific document and joins with `document_members`.
- It strictly enforces that `is_deleted` is `false` and that the current user's ID exists in the document's members list.

**How it works & Why we use it:**
- **The Approach**: This ensures Row-Level Security at the application layer. Even if a user guesses a valid document ID, the database query will return `null` if they aren't explicitly listed in the `document_members` table for that document, completely securing the content.

### 2. Document Header Component (`document-header.tsx`)
**What we did:**
- Created the `DocumentHeader` component in `src/features/document/components/`.
- Included a `lucide-react` back arrow linking to `/dashboard`.
- Rendered the document title dynamically.

**How it works & Why we use it:**
- **The Approach**: This establishes the top navigation bar tailored specifically for the editing interface, isolating it from the global dashboard layout.

### 3. Route Protection & Layout (`dashboard/[docId]/page.tsx`)
**What we did:**
- Converted the page to securely fetch the document using `getDocumentById(params.docId)`.
- If the document is null (doesn't exist or access denied), we use Next.js `redirect('/dashboard')` to bounce them back.
- If successful, it renders the new `DocumentHeader` and leaves an empty editor area for the next phase.

**Why we use it:**
- **The Approach**: Fetching the document on the server guarantees the user never sees a flash of unauthorized content. The redirect happens before the page even reaches the browser.

## Step 11.5: Dashboard Layout Refactoring (2026-06-08)

We restructured the `DashboardLayout` to correctly support full-bleed document editing interfaces without double-headers.

### 1. Removing Top Navbar from Layout
**What we did:**
- Extracted the Top Navbar (containing the User Avatar and Sign Out button) entirely out of `src/features/dashboard/components/dashboard-layout.tsx`.
- Removed the global padding (`p-4 sm:p-6 lg:p-8`) from the layout's `<main>` container.

**Why we use it:**
- **The Approach**: Previously, the layout forced padding and a top navbar on *every* child route. This trapped the document editor inside a padded box and caused a "double header" effect when rendering the `DocumentHeader`. By removing it from the global layout, dynamic routes like `/dashboard/[docId]` can now stretch edge-to-edge.

### 2. Dashboard Home Table View (`dashboard/page.tsx`)
**What we did:**
- Restored the Top Navbar directly inside the `DashboardHome` component.
- Applied the necessary padding directly to the dashboard home content area so the document list remains visually bounded.

**Why we use it:**
- **The Approach**: The dashboard home route correctly displays the standard app interface (Navbar + Padded List), while the document route takes full control of the screen, creating a much more professional editing experience.

## Step 12: Tiptap Editor Integration (2026-06-08)

We replaced the empty document placeholder with a fully functional rich-text editor using Tiptap, establishing Phase 4 of our roadmap.

### 1. Editor Architecture (`editor.tsx`)
**What we did:**
- Created a new feature domain `src/features/editor/`.
- Built the `<Editor />` client component utilizing the `@tiptap/react` hook.
- Integrated `@tiptap/starter-kit` and `@tiptap/extension-placeholder`.
- Used Tailwind's `@tailwindcss/typography` plugin (`prose prose-zinc`) to style the resulting HTML content beautifully.

**Why we use it:**
- **The Approach**: Tiptap provides a headless editor interface, meaning it handles the complex contenteditable logic while letting us dictate 100% of the UI. This is critical for maintaining our bespoke design system and preparing for Phase 6 (Hocuspocus real-time sync).

### 2. Formatting Toolbar (`toolbar.tsx`)
**What we did:**
- Built a floating toolbar pinned to the top of the editor container.
- Utilized Shadcn UI's `<Toggle>` components and `lucide-react` icons (Bold, Italic, Strike, Headings).
- Bound the toggle states to `editor.isActive()` to visually indicate when a format is applied.
- Wired the clicks to `editor.chain().focus().toggle*().run()` to apply the rich text formatting.

**Why we use it:**
- **The Approach**: Decoupling the toolbar from the editor core allows for total UI flexibility. By using Shadcn Toggles, the toolbar perfectly matches the rest of the application's aesthetic.

## Step 12.5: Advanced Editor Features & Styling (2026-06-08)

We upgraded the editor to function more like a premium word processor, including a "Pageless" document view and advanced font controls.

### 1. The "Pageless" Layout & Typography
**What we did:**
- Restructured `dashboard/[docId]/page.tsx` and `editor.tsx` to mount the editor on a gray background (`bg-zinc-50`).
- Styled the Tiptap `div` as a centered, white, drop-shadowed container (`max-w-[816px] min-h-[1056px] mx-auto p-12 shadow-md`) mimicking an A4 piece of paper.
- Tightened the line-spacing significantly by overriding default `@tailwindcss/typography` styles (`prose-p:my-1 prose-headings:my-2`).

**Why we use it:**
- **The Approach**: True pagination (splitting a paragraph visually across two separate DOM elements) is excessively difficult on the web. By using the "Pageless" continuous scroll approach (popularized by Google Docs and Notion), we deliver the familiar "document" feel while guaranteeing high performance and zero cross-page rendering bugs.

### 2. Font Controls & Custom Extensions
**What we did:**
- Installed `@tiptap/extension-text-style`, `@tiptap/extension-color`, and `@tiptap/extension-font-family`.
- Created a highly optimized custom extension (`src/features/editor/extensions/font-size.ts`) to handle exact pixel font sizing because Tiptap doesn't natively provide one.
- Added Shadcn `Select` dropdowns to the `toolbar.tsx` for Font Family and Font Size.
- Added a native HTML `<input type="color">` wrapped in a stylized box to act as an instant color picker.

**Why we use it:**
- **The Approach**: Exposing these controls allows the user to truly customize their documents. Writing a custom `FontSize` extension demonstrates how extensible Tiptap is, avoiding reliance on heavy third-party plugins.

## Step 13: Editor Polish — Toolbar Reactivity, Color Persistence & Bug Fixes (2026-06-08)

This step focused on fixing a series of interconnected reactivity and state-management bugs in the Tiptap toolbar, and polishing the UI to match Google Docs.

### 1. Google Docs Toolbar Styling
**What we did:**
- Changed the toolbar background from plain white to `bg-[#f0f4f9]` (Google Docs blue-gray).
- Removed borders from `SelectTrigger` components and replaced them with transparent hover states.
- Replaced all `h-6` vertical separators with `h-4 bg-zinc-300` for a flatter, cleaner look.
- Changed the Font Family default from "Inter" to "Arial" to match Google Docs.

**Why:**
- Visual fidelity to Google Docs makes the editor feel immediately familiar and professional.

### 2. Blue Active States for Toggle Buttons
**What we did:**
- Created a shared `toggleClass` string with `data-[state=on]:bg-blue-100 data-[state=on]:text-blue-900` and applied it to all 6 Toggle buttons (H1, H2, H3, Bold, Italic, Strike).

**Why:**
- The default Shadcn Toggle uses a subtle gray active state that was nearly invisible. A blue highlight provides instant, unambiguous visual feedback.

### 3. Toolbar Reactivity via Transaction Listener
**What we did:**
- Added a `useEffect` that subscribes to Tiptap's `transaction` event and calls `forceUpdate(n => n + 1)` to trigger a React re-render.
- Added `key` props to the Font Family and Font Size `<Select>` components, bound to the current editor attribute value, forcing them to remount and display the correct value when the cursor moves.

**Why:**
- Tiptap's `EditorProvider` + `useCurrentEditor()` does NOT automatically re-render React components on selection changes. Without this listener, the color circle, dropdowns, and toggle states would freeze and show stale values.

### 4. Persistent Color Palette
**What we did:**
- Replaced the color picker's value source from `editor.getAttributes('textStyle').color` to a local `useState('#000000')`.
- The circle's `backgroundColor` is now driven by this local state, and the `onChange` handler both updates the state and calls `editor.chain().focus().setColor()`.

**Why:**
- The user wants the color circle to act as a "bucket" that remembers the last chosen color, not a reactive indicator that changes every time the cursor lands on differently-colored text.

### 5. Empty-Document Color Recovery
**What we did:**
- Added a separate `useEffect` subscribing to Tiptap's `update` event (not `transaction`).
- When `editor.isEmpty` is true and the selected color isn't black, it uses `queueMicrotask()` to re-apply the color via `editor.commands.setColor()`.
- Used a `useRef` to read the current color inside the event handler without adding it to the dependency array.

**Why:**
- When the user deletes all text, Tiptap strips all formatting marks. Without this fix, typing after clearing the document would always revert to black, even though the color palette showed a different color.
- The initial attempt put `setColor` directly inside the `transaction` handler, which caused an **infinite recursion** (`setColor` → transaction → `setColor` → ...). Splitting it to the `update` event and wrapping in `queueMicrotask` breaks the synchronous cycle.

### 6. StoredMarks Preservation via `preventDefault`
**What we did:**
- Added `onMouseDown={(e) => e.preventDefault()}` to every single Toggle button and Undo/Redo button in the toolbar.

**Why:**
- When you click a toolbar button, the browser's default behavior moves focus from the editor's contenteditable `div` to the clicked button. When the Tiptap editor loses focus, ProseMirror immediately flushes its `storedMarks` — the temporary in-memory formatting state that tells it "the next character you type should be in Courier New, 24px, red".
- By preventing the default mousedown, the editor never loses focus, and Tiptap never flushes those marks. This was the root cause of font family and font size resetting when clicking Bold, Heading, or List buttons.

### 7. Undo/Redo Fixed
**What we did:**
- Replaced the Undo and Redo `<Toggle>` components with native `<button>` elements using `onClick`.

**Why:**
- `<Toggle>` expects an on/off pressed state and uses `onPressedChange`. Undo/Redo are one-shot actions, not toggleable states. Using Toggle caused them to sometimes not fire correctly. A plain button with `onClick` is semantically correct and always fires reliably.

## Step 14: Deep Toolbar Optimization & Link Security (2026-06-08)

This step focused on streamlining the editor for a pure, distraction-free writing experience, fortifying link behavior against browser quirks, and making the toolbar controls fully reactive to the document context.

### 1. Dynamic Font Size Dropdown
**What we did:**
- Implemented a `FontSize` Tiptap extension that applies inline CSS `font-size` without hacking the native DOM caret behavior (reverting zero-width space workarounds to maintain clean ASTs).
- Added a `Select` dropdown component positioned exclusively via `position="popper"` to force it below the toolbar, avoiding native macOS overlay behaviors.
- Completely removed the `TooltipWrapper` from the font-size dropdown to prevent high-z-index hovers from overlapping the dropdown items.
- Wrote a smart `getCurrentFontSize()` helper that calculates default pixel values even when no inline style is present (e.g., mapping Heading 1 to `36px`, Heading 2 to `24px`), giving users accurate contextual feedback.

### 2. Reactive Color Picker
**What we did:**
- Ripped out the disconnected, manual React `useState('#000000')` for the Color Picker.
- Replaced it with a dynamically computed `currentColor` that reads `editor.getAttributes("textStyle").color` on every transaction.

**Why:**
- Previously, the color picker circle only showed what the user last clicked in the menu. Now, it acts as a true contextual indicator. If the user clicks on red text, the circle instantly becomes red. If they click on black text, it instantly goes back to black.

### 3. Fortified Link Management
**What we did:**
- **Navigation Blocking**: Implemented a `CustomLink` extension and a global `onClickCapture` event handler to aggressively `e.preventDefault()` all clicks on `<a>` tags inside the editor, completely preventing accidental browser navigation during editing.
- **Ghost Mark Resolution**: Added silent `onUpdate` observers to the editor root. If a user deletes all characters of a link, Tiptap natively keeps the link mark active in memory (a "ghost mark"), meaning the next typed word becomes a link. The new observer scans the AST (`$from.nodeBefore` and `nodeAfter`) upon empty selections and aggressively executes `.unsetLink()` if it detects an orphaned link mark.
- **Selection Preservation**: Updated `handleLinkSubmit` so that when a user creates a link by highlighting existing text, the selection range is preserved (`extendMarkRange` without `setTextSelection(to)`).

**Why:**
- Preserving the selection range when creating a link over highlighted text ensures the UI feels seamless. It allows the `LinkBubbleMenu` (Edit, Copy, Unlink) to appear instantly without requiring the user to re-click the text.

## Step 15: Phase 5 Auto-Save UI and REST Database Sync (2026-06-09)

We bridged the gap between the isolated client-side editor and the database, establishing the Phase 5 "REST-style" save architecture.

### 1. Document Creation Popup
**What we did:**
- Built a `<CreateDocumentButton />` client component using Shadcn's `Dialog`.
- Updated the `createDocument` server action to accept a custom title via `FormData` and return the new document's UUID instead of throwing a `redirect()`.
- The client button triggers the server action, closes the dialog, and securely uses `router.push()` to navigate to the new document.

**Why:**
- Previously, creating a document hardcoded the title to "Untitled Document". Asking for the title upfront is a vastly superior UX. Returning the ID instead of redirecting from the server action avoids Next.js `NEXT_REDIRECT` errors being caught by our client-side `try/catch` block.

### 2. Rename Document Title (Document Header)
**What we did:**
- Converted `DocumentHeader` into a Client Component.
- Replaced static text with an interactive layout featuring a Shadcn `Dialog` triggered by a small Pencil icon.
- Created `updateDocumentTitle(documentId, newTitle)` server action that verifies the user's role (`owner` or `editor`) before issuing a Supabase `.update()`.

**Why:**
- Allows users to seamlessly rename their documents. Verifying the `document_members` role entirely on the server ensures viewers cannot rename the document.

### 3. Document Sync Context
**What we did:**
- Created a `DocumentContext` provider wrapping the document page.
- Created a `syncState` enum (`saving`, `saved`, `offline`).
- Placed micro-UI indicators (pulsing cloud, checkmark cloud, offline warning) in the `DocumentHeader` bound to this state.

**Why:**
- Because the Header and the Editor are separate React components, they cannot easily share state. Wrapping them in a React Context allows the Editor to broadcast "I am saving" and the Header to instantly display the UI.

### 4. REST Database Auto-Save
**What we did:**
- Created a temporary `updateDocumentContent` server action that executes an `upsert` into the `document_content_state` table, saving the raw Tiptap HTML string into the `ydoc_state` column.
- Hooked into Tiptap's `onUpdate` event inside `Editor`. As the user types, we trigger `setSyncState('saving')`. We use a 1-second `setTimeout` (debouncer) to wait until the user pauses.
- Once paused, we extract `editor.getHTML()` and push it to the server action.
- Updated `[docId]/page.tsx` to pre-fetch the saved HTML via a new `getDocumentContent` server action and feed it to the `Editor` as `initialContent`.

**Why:**
- While our Phase 6 final architecture uses a standalone WebSocket server for binary Yjs state, we needed a fully functional saving mechanism *now*. This REST-style approach provides immediate persistence without blocking development. We will swap the server action out for the Hocuspocus provider in Phase 6.

## Step 16: Document Sharing, Invites, and Viewer Mode (2026-06-09)

We jumped ahead to implement **Phase 8 (Invites & Sharing)** to establish strict role-based access control and one-time use invite links.

### 1. Secure Server Actions (`invite.actions.ts`)
**What we did:**
- Created `createInviteLink(documentId, role)` which verifies the current user is an owner or editor, generates a `crypto.randomUUID()`, and inserts it into the `invites` table with a `pending` status.
- Created `acceptInvite(token)` which finds the pending token, adds the user to the `document_members` table with the assigned role, and updates the token to `accepted`.

**Why:**
- **Strict One-Time Use:** By updating the token to `accepted`, we guarantee that a link can only be used by a single person. This is vastly more secure than generic shareable links.

### 2. Edge Proxy Redirection Updates
**What we did:**
- Updated `src/lib/supabase/proxy.ts` to ensure that when it intercepts an unauthenticated request to `/invite?token=123`, it preserves the `?token=123` query parameters in the `next` redirect URL (`/login?next=/invite?token=123`).

**Why:**
- This provides a flawless onboarding UX. If you send a link to someone who doesn't have an account, the proxy seamlessly redirects them to sign up, and then instantly routes them back to process the invite token without losing it.

### 3. Share Dialog & Member Avatars
**What we did:**
- Created `ShareDialog` (now renamed to "Invite") which allows Editors/Owners to select a role and generate the one-time link.
- Updated `getDocumentById` to fetch all `document_members` joined with `users` (to get names and avatars).
- Rendered the active members as a row of overlapping `Avatar` components in the `DocumentHeader`.
- Grouped the entire avatar cluster into a single Shadcn `Popover` button. Clicking anywhere on the group opens a scrollable list displaying every member's avatar, name, email, and specific role.

### 4. Read-Only Viewer Mode Lockdown
**What we did:**
- **Data Flow:** Extracted the current user's role in `app/dashboard/[docId]/page.tsx` and passed it down to all child components.
- **Header Lock:** If the role is `viewer`, the "Invite" button and the document Rename pencil icon completely disappear. A "View Only" badge renders next to the avatars.
- **Editor Lock:** We passed `editable={false}` to Tiptap's `<EditorProvider />` for viewers, natively disabling all typing, backspacing, and focus events.
- **Distraction-Free UI:** We conditionally hid the formatting `<Toolbar />` and the `<LinkBubbleMenu />` for viewers to provide a clean, published-document aesthetic.

**Why:**
- True collaborative applications require strict permissions. Disabling the Tiptap editor at the provider level guarantees that viewers cannot accidentally modify the local state, while hiding the toolbars signals to the user that they are in read-only mode.

## Step 17: Intermediate Invitation Screen (2026-06-09)

We refined the invite onboarding experience by introducing an intermediate "Accept/Cancel" screen, ensuring users are fully aware of what document they are joining before actually joining it.

### 1. Route Relocation
**What we did:**
- Deleted the root-level `app/invite` folder.
- Moved the invitation processing logic to `src/app/dashboard/invite/page.tsx`.
- Updated the `ShareDialog` to generate `/dashboard/invite?token=...` links natively.

**Why:**
- **Layout Inheritance:** By moving the invite page under `/dashboard`, it automatically inherits the global `DashboardLayout` (including the sidebar). We manually restored the Top Navbar (avatar + sign-out) to this page, meaning the invitation screen looks like a seamless, integrated part of the core application rather than an isolated, disconnected popup.

### 2. Intermediate "You've been invited!" Card
**What we did:**
- Created a new `getInviteDetails(token)` server action that safely looks up the document title, owner name, and role without actually consuming the invite token.
- Designed a new centered card that displays "You've been invited!" along with the extracted details.
- Added a "Cancel" button that safely routes the user back to the dashboard, leaving the invite token untouched.
- Extracted the "Accept Invite" logic into a dedicated Client Component (`AcceptInviteButton.tsx`) which shows a loading spinner, executes the `acceptInvite` server action, and then redirects to the document.

**Why:**
- The previous implementation instantly dropped users into the document when they clicked the link. An intermediate confirmation screen is a crucial UX pattern for security and transparency. It allows the user to verify who is inviting them and to which document before their account is permanently added to the `document_members` table.


## Phase 7: Real-Time Collaborative Editing via Yjs & Hocuspocus (2026-06-09)

We replaced the manual REST API auto-save mechanism with a fully real-time WebSocket architecture to enable live collaborative editing with cursors.

### 1. Dedicated Hocuspocus WebSocket Server
**What we did:**
- Initialized a standalone Node.js server inside  to completely decouple real-time WebSocket connections from the Next.js frontend (since Vercel serverless functions do not support persistent WebSockets).
- Configured Hocuspocus with  and strict ES Modules architecture.
- Replaced  and  with  (TypeScript Execute) for lightning-fast, warning-free development without experimental module flags.

**Why:**
- Hocuspocus is the official backend for Tiptap collaborative extensions. By running it locally as a separate process, multiple users can connect to the exact same Yjs document state concurrently.

### 2. Database Persistence via Hocuspocus Hooks
**What we did:**
- Implemented the  hook to securely intercept the Supabase JWT token from the WebSocket connection, verifying it natively via .
- Implemented the  hook to fetch existing binary CRDT states from the  table and apply them to the Yjs document instance via .
- Implemented the  hook to continuously listen to state changes, encode the Yjs document into base64, and safely perform an  (with explicit ) back into the Supabase database.

**Why:**
- Native Tiptap collaboration removes the burden of handling race conditions. The Yjs CRDT mathematically ensures that two users typing over each other will never corrupt the document structure, resulting in an industry-standard live collaborative experience.

## Phase 7: Real-Time Collaborative Editing via Yjs & Hocuspocus (2026-06-09)

We replaced the manual REST API auto-save mechanism with a fully real-time WebSocket architecture to enable live collaborative editing with cursors.

### 1. Dedicated Hocuspocus WebSocket Server
**What we did:**
- Initialized a standalone Node.js server inside `/hocuspocus-server` to completely decouple real-time WebSocket connections from the Next.js frontend (since Vercel serverless functions do not support persistent WebSockets).
- Configured Hocuspocus with `@hocuspocus/server` and strict ES Modules architecture.
- Replaced `nodemon` and `ts-node` with `tsx` (TypeScript Execute) for lightning-fast, warning-free development without experimental module flags.

**Why:**
- Hocuspocus is the official backend for Tiptap collaborative extensions. By running it locally as a separate process, multiple users can connect to the exact same Yjs document state concurrently.

### 2. Database Persistence via Hocuspocus Hooks
**What we did:**
- Implemented the `onAuthenticate` hook to securely intercept the Supabase JWT token from the WebSocket connection, verifying it natively via `supabase.auth.getUser(token)`.
- Implemented the `onLoadDocument` hook to fetch existing binary CRDT states from the `document_content_state` table and apply them to the Yjs document instance via `Y.applyUpdate()`.
- Implemented the `onStoreDocument` hook to continuously listen to state changes, encode the Yjs document into base64, and safely perform an `upsert` (with explicit `onConflict: 'document_id'`) back into the Supabase database.

**Why:**
- Relying entirely on memory is dangerous. The hooks bridge the gap between volatile WebSocket memory and permanent Postgres storage, guaranteeing that no state is lost if the WebSocket server ever reboots or crashes.

### 3. Frontend Tiptap Provider Integration
**What we did:**
- Removed all REST-based initial content fetching logic (`useEffect` auto-saving) from `Editor.tsx`.
- Refactored the Editor component to generate an empty `Y.Doc` explicitly via `useState`, preventing destructive unmount cycles during React Strict Mode Fast Refreshes.
- Configured the `@hocuspocus/provider` to bind the frontend Tiptap instance to the backend `ws://` URL, passing the user's access token for authentication.
- Rolled all Tiptap extensions back to version `^2.27.2` to resolve a massive architectural incompatibility between Tiptap v3 and the Tiptap Collaboration Cursor extension.
- Added premium, custom CSS logic into `globals.css` to accurately style the `collaboration-cursor__caret` and `collaboration-cursor__label` with subtle drop shadows, smooth entry animations, and a curated palette of vibrant Tailwind colors.

**Why:**
- Native Tiptap collaboration removes the burden of handling race conditions. The Yjs CRDT mathematically ensures that two users typing over each other will never corrupt the document structure, resulting in an industry-standard live collaborative experience.

## Phase 7.5: Post-Launch Bug Fixes & Architecture Hardening (2026-06-09)

Immediately following the real-time WebSocket launch, we resolved several critical runtime errors and deprecation warnings to ensure the application is completely stable.

### 1. Supabase Upsert Constraint Violation
**What we did:**
- Updated the `onStoreDocument` hook in the Hocuspocus server.
- Added `{ onConflict: 'document_id' }` to the Supabase `.upsert()` call.

**Why:**
- Supabase was trying to perform a blind `INSERT` every time the document saved, which tripped a Unique Constraint violation on the `document_id` column. This meant the Yjs state was silently failing to save, causing the document to clear on server restarts. Providing the `onConflict` column allows Postgres to correctly overwrite the existing row.

### 2. Node v24 Deprecation & tsx Migration
**What we did:**
- Completely uninstalled `nodemon` and `ts-node` from the `/hocuspocus-server`.
- Installed and migrated to `tsx` (TypeScript Execute) as the primary development server environment.

**Why:**
- The legacy `ts-node/esm` loader is heavily deprecated in Node.js v24+, throwing severe `fs.Stats` and `ExperimentalWarning` logs. Furthermore, cached nodemon processes were holding port `1235` open causing `EADDRINUSE` crashes. `tsx` runs on native `esbuild`, providing a warning-free, lightning-fast execution environment with built-in watching.

### 3. Next.js Server Component Security Warning
**What we did:**
- Refactored `/dashboard/[docId]/page.tsx` to fetch the user profile via `supabase.auth.getUser()` rather than extracting it locally from `supabase.auth.getSession()`.
- Maintained the `getSession()` call purely to extract the raw `access_token` string required by Hocuspocus.

**Why:**
- Extracting a user object directly from the session cookie in a Server Component triggered a Supabase Security Warning, as cookies can technically be intercepted or spoofed without verifying against the backend database. `getUser()` explicitly validates the session against the auth server, resolving the security risk.

## Step 18: Codebase Modularization & Refactoring (2026-06-10)

We performed a massive architectural refactoring to decompose monolithic files into single-responsibility modules, significantly improving compile times, tree-shaking, and developer efficiency.

### 1. UI Component Breakdown
**What we did:**
- Extracted the inline `TooltipWrapper` from `toolbar.tsx` into a globally reusable component (`src/components/ui/tooltip-wrapper.tsx`).
- Decomposed the massive 600+ line `toolbar.tsx` into 8 separate sub-components (e.g., `history-controls.tsx`, `heading-controls.tsx`, `color-control.tsx`) housed inside `features/editor/components/toolbar/`.
- Refactored `toolbar.tsx` to act purely as a composer, importing and rendering the sub-components.

**Why:**
- Massive React components are difficult to maintain and cause severe Git merge conflicts. By isolating each formatting control, developers can modify specific tools (like the Link tool) without touching the rest of the editor UI. This also drastically improves Next.js Fast Refresh speeds during local development because only the modified sub-component is recompiled.

### 2. Server Action Decomposition
**What we did:**
- Deleted the monolithic `*.actions.ts` files (like `auth.actions.ts`, `document.actions.ts`, `invite.actions.ts`).
- Split every single server action into its own dedicated `.action.ts` file (e.g., `login.action.ts`, `create-document.action.ts`, `accept-invite.action.ts`).
- Updated all imports across the Next.js `app/` router and client components to point to these new granular files.

**Why:**
- **Tree-shaking**: By importing specific action files, the Next.js bundler only includes the necessary code for that specific route. Previously, importing `login` from `auth.actions.ts` might have forced the bundler to include the logic and dependencies for `signup` and `logout` as well.
- **Maintainability**: A single-responsibility file is easier to test, debug, and trace.

### 3. Centralized Environment Constants
**What we did:**
- Created `src/lib/constants/env.ts` in the web application and `src/config/env.ts` in the Hocuspocus server.
- Extracted all `process.env` lookups (like `NEXT_PUBLIC_SUPABASE_URL`) into these strictly typed `ENV` objects.
- Refactored all database clients and WebSockets to use the `ENV` object.

**Why:**
- Accessing `process.env` directly throughout the codebase is prone to typos and makes it tracking required variables easier. A centralized constant file provides a single source of truth.

## Step 19: Phase 9 UX Polish & Mobile Responsiveness (2026-06-10)

We performed a comprehensive UX polish, handling edge cases like offline states, skeleton loaders, live presence indicators, and mobile responsiveness.

### 1. Live Presence Indicators
**What we did:**
- Extended `DocumentContext` to hold the real-time `activeUsers` array.
- Tapped into the `onAwarenessUpdate` event natively provided by the `@hocuspocus/provider` in the `Editor` component.
- Extracted and mapped connected clients (names, avatars, cursor colors) into the shared context.
- Created the `ActiveUsersCluster` component, rendering a row of overlapping `Avatar` bubbles dynamically wrapped in `TooltipProvider` to display "Online Now".

**Why:**
- Without an awareness cluster, users have no idea who is currently viewing the document with them. Tiptap's Collaboration Cursor extension handles the actual blinking carets, but this UI explicitly surfaces presence in the document header.

### 2. WebSocket Reconnection & Error UI
**What we did:**
- Built an `OfflineBanner` component that reads `syncState === "offline"` from `DocumentContext`.
- Integrated the banner securely into the top of the `Editor` component container.

**Why:**
- If the WebSocket connection drops, users need immediate visual feedback. Crucially, because Yjs uses CRDTs, users *can* safely continue typing while offline. The banner notifies them without completely blocking the UI, and Yjs will automatically sync and merge their offline changes the moment the connection restores.

### 3. Loading States & Skeletons
**What we did:**
- Created dedicated `loading.tsx` and `page.tsx` splits inside `app/dashboard/(home)` and `app/dashboard/[docId]`.
- Implemented rich, layout-aware skeleton loaders that perfectly match the actual content grid before it renders.
- Utilized an opacity-based CSS animation trick (`opacity-0 animate-[fade-in_0.2s_ease-out_forwards]`) on actual content to prevent jarring layout shifts when the data finishes loading.

**Why:**
- Skeleton loaders provide perceived performance improvements. By ensuring the skeleton perfectly matches the final DOM structure, the user experiences a seamless transition without the screen "jumping" as images and text load in.

---

## Step 20: Performance Optimization & Advanced UI Upgrades (2026-06-16)

We executed a comprehensive performance optimization phase, stabilizing the real-time sync engine, overhauling the dashboard data architecture, and expanding the rich-text editor's capabilities.

### 1. Dashboard Overhaul & Server-Side Pagination
**What we did:**
- Completely overhauled the dashboard layout, introducing a new header and main wrapper component architecture.
- Replaced client-side rendering with robust server-side pagination, search, and filtering for user documents.
- Standardized the Inbox UI to fetch and render dynamically via server-side pagination, ensuring accurate "total count" indicators driven strictly by the database.

**Why:**
- As the user accumulates hundreds of documents and invites, fetching all records into the browser degrades performance. Server-side pagination guarantees O(1) rendering time regardless of database size, and ensures filtering remains accurate across the entire dataset.

### 2. UI Standardization & Semantic Theming
**What we did:**
- Refactored core UI components to utilize theme-based design tokens and semantic color variables instead of hardcoded hex values.
- Unified editor role synchronization and updated UI controls to prevent edge cases where dropdown menus would steal browser focus, thereby disrupting Yjs cursor tracking.
- Added consistent loading spinner overlays to action buttons across authentication, dashboard, and invitation workflows.

**Why:**
- A unified design system ensures visual consistency and makes future theming (e.g., dark mode refinements) effortless. Preventing focus-stealing is critical for collaborative environments, as the CRDT engine relies on persistent editor focus to broadcast remote cursors accurately.

### 3. Realtime Synchronization Hardening
**What we did:**
- Identified and resolved a critical race condition between multiple Supabase Realtime Postgres event listeners in the `DocumentRealtimeListener` and `DocumentHeader`.
- Intercepted the generic `document_members` delete event to prevent the Next.js Server Component from crashing into a "No Permission" page when a user was removed, allowing the graceful "Access Revoked" modal to display persistently.
- Implemented `useTransition` and `forceUpdate` throttling (250ms delay) in the formatting toolbar and bubble menus.

**Why:**
- Real-time applications are prone to race conditions when multiple WebSocket events fire simultaneously. Strictly guarding the listeners ensures the UI responds predictably. Throttling the React state updates guarantees that the main thread remains fluid and responsive during high-frequency typing events.

### 4. Advanced Editor Integrations
**What we did:**
- Re-enabled and stabilized the Tiptap Table extension, allowing for table insertion and collaborative cell editing. (Table column resizing is actively being refined).
- Implemented resizable and movable images using drag-to-resize handles.
- Introduced an advanced Fonts dropdown, a comprehensive text highlighter with a custom color picker, and blockquote support to match premium word processors.
- Installed the Shadcn `Skeleton` component (`npx shadcn@latest add skeleton`).
- Created a `DocumentListSkeleton` component specifically designed to mimic the exact structural layout of the dashboard document table.
- Implemented `app/dashboard/loading.tsx` using Next.js 15 routing conventions.

**Why:**
- Fetching user documents via server actions creates a slight network delay. Utilizing native Next.js Suspense boundaries via `loading.tsx` allows the browser to instantly display the layout shell (sidebar/navbar) alongside the pulsing skeleton, eliminating Cumulative Layout Shifts (CLS) and creating a premium perception of speed.

### 4. Responsive Mobile Navigation
**What we did:**
- Adjusted the fixed desktop padding of the Editor (`px-16`) to scale smoothly on mobile (`px-4 sm:px-16`).
- Fixed the Tiptap formatting toolbar by applying `whitespace-nowrap overflow-x-auto scrollbar-hide`, allowing mobile users to horizontally scroll through formatting tools without the layout wrapping and breaking.
- Restored the Mobile Hamburger Menu:
  - Extracted the desktop sidebar navigation logic out of `DashboardLayout` into a highly reusable `SidebarContent` component.
  - Wrapped `SidebarContent` inside a Shadcn `Sheet` to build a slide-out `MobileSidebar`.
  - Injected the `MobileSidebar` into both `DashboardHeader` and `DocumentHeader`, ensuring users can switch documents seamlessly even on small devices.

## Step 20: Dashboard Scroll Containment Fix (2026-06-10)

### 1. Viewport-Locked Dashboard Shell
**What we did:**
- Changed the dashboard layout shell to use `fixed inset-0` with `h-[100dvh]` and `overflow-hidden`.
- Kept the sidebar and main content as clipped flex columns with `min-h-0`, so nested children can shrink instead of forcing the document body to scroll.
- Removed an unused Supabase user fetch from `DashboardLayout`, because the layout only needs documents for the sidebar.

**Why:**
- The dashboard should behave like an app surface, not a normal webpage. Pinning the shell to the viewport prevents wheel gestures outside the document table from bubbling into a full-page scroll.

### 2. Document List Owns Vertical Scrolling
**What we did:**
- Converted the dashboard page content into a non-scrolling flex container.
- Converted `DocumentList` and `DocumentListSkeleton` into full-height flex columns.
- Kept the "Documents" title and table header fixed, while the table rows use `overflow-y-auto overscroll-contain`.

**Why:**
- Users expect the dashboard chrome, header, title, and table heading to stay in place. Only the document rows should scroll when there are more documents than fit in the available viewport.

## Step 21: UI Refinement and Component Modularization (2026-06-10)

We performed a targeted UI refactor to extract inline modal components, standardize interactive hover states, and create a centralized Sign Out confirmation flow.

### 1. Extracting Inline Dialogs (`document-action-menu.tsx`)
**What we did:**
- Extracted the "Rename Document" and "Delete Document" Shadcn `<Dialog>` elements out of the `DocumentActionMenu` component.
- Created `document-rename-dialog.tsx` and `document-delete-dialog.tsx`.
- Refactored `DocumentActionMenu` to only render the `DropdownMenu` and manage the boolean open state passed to the new dialog components.

**Why:**
- The menu component was bloated with excessive markup and state variables (`draftTitle`, `isPending`). Moving the dialogs into their own files keeps the codebase modular and adheres to our rule of creating single-responsibility reusable components.

### 2. Sign Out Confirmation Dialog
**What we did:**
- Created a new `SignOutButton` component in `src/features/auth/components/sign-out-button.tsx`.
- Integrated a premium `Dialog` asking "Are you sure you want to log out?" before executing the `logout` server action.
- Replaced the hardcoded inline `<form action={logout}>` elements in both the `DashboardHeader` and the `InvitePage` header with this unified component.

**Why:**
- Instantly signing a user out when they misclick the LogOut button is a frustrating user experience. An intermediate confirmation dialog provides a safety net and maintains consistency with the application's premium aesthetic. Consolidating the logic prevents code duplication.

### 3. Persistent Hover States (CSS `:has` Selector)
**What we did:**
- Updated the main `DocumentList` row and the `SidebarDocList` row container elements.
- Applied the Tailwind CSS pseudo-selector `has-[[data-state=open]]:bg-zinc-50` and `has-[[data-state=open]]:bg-zinc-200/70` respectively.

**Why:**
- Previously, when a user clicked the 3-dot action menu and hovered over the dropdown items, the parent document row lost its highlighted background. By using `:has`, the parent row "knows" its child dropdown is open and retains the active hover background, providing an elegant UX interaction.

## Step 22: Dashboard Document Cards & Codebase De-duplication (2026-06-11)

We implemented a highly visual Document Card system for the dashboard and performed a rigorous modularization of the entire project to ensure strict adherence to our Single Responsibility Principle (SRP).

### 1. Architectural De-duplication & Localized State
**What we did:**
- Decomposed `document-header.tsx` (a massive 318-line monolith) into `document-rename-dialog.tsx`, `document-members-popover.tsx`, and `document-sync-status.tsx`.
- Decomposed `share-dialog.tsx` into `create-link-tab.tsx` and `send-email-tab.tsx`.
- Extracted the inline mapping logic from `document-list.tsx` into a standalone `document-card.tsx` component.

**How it works & Why we use it:**
- **The Approach**: In React, state changes cause re-renders. Previously, the `ShareDialog` held the `email` input state at its top level. This meant that every single keystroke in the email field caused the entire modal (including the unrelated Create Link tab) to re-render. By extracting the email tab into its own file (`send-email-tab.tsx`) and keeping the state localized there, we dramatically improved rendering performance and prevented "prop-drilling." The parent components now act as clean layout "shells" orchestrating optimized child components.

### 2. Client-Side Search and Filtering
**What we did:**
- Implemented a live, client-side search bar (`searchQuery`) and a dropdown filter (`filterType`).
- Wrapped the document array in a React `useMemo` hook to calculate `filteredDocuments`.

**How it works & Why we use it:**
- **The Approach**: 
  ```tsx
  const filteredDocuments = useMemo(() => {
    return documents.filter(doc => {
      // 1. Search Query Match
      if (searchQuery && !doc.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      
      // 2. Role Filter Match
      const role = doc.document_members?.[0]?.role || 'viewer';
      switch (filterType) {
        case 'owned-by-me': return role === 'owner';
        case 'owned-by-others': return role !== 'owner';
        case 'editor': return role === 'editor';
        case 'viewer': return role === 'viewer';
        case 'all': default: return true;
      }
    })
  }, [documents, searchQuery, filterType]);
  ```
- Because we already fetched the user's documents from the server, we don't need to make slow database round-trips to filter them. `useMemo` instantly recalculates the list in milliseconds whenever the user types or selects a role, creating a snappy, lag-free user experience.

### 3. Tiptap HTML Previews (Thumbnail Generation)
**What we did:**
- Created a `DocumentPreview` component that renders inside the `DocumentCard`.
- We take the raw `previewJson` (the Yjs state stored in the database) and run Tiptap's headless `generateHTML(json, [StarterKit])` method.
- Scaled the output down using Tailwind: `scale-[0.5]` combined with `width: 200%` and `height: 200%`.

**How it works & Why we use it:**
- **The Approach**: Tiptap requires the DOM (`window`) to safely generate HTML. To avoid Next.js Hydration errors (where the server tries to render HTML without a `window`), we added an `isMounted` state inside a `useEffect`. The HTML generation is deferred until the component hits the browser. 
- Using `pointer-events-none` and `overflow-hidden` over the scaled `dangerouslySetInnerHTML` output creates a perfect, non-interactive visual thumbnail of exactly what the document looks like, without the overhead of loading actual iframe editors.

### 4. Stacked Avatar Presence & Fallback Logic
**What we did:**
- Positioned a cluster of avatars `absolute bottom-2 right-2` on top of the document preview thumbnail.
- Sliced the `all_members` array to a maximum of 3 avatars: `doc.all_members.slice(0, 3)`.
- Applied dynamic inline styles `style={{ zIndex: 10 - i }}`.
- Implemented a robust fallback: `{(member.user.name || member.user.email || "?").charAt(0).toUpperCase()}`.

**How it works & Why we use it:**
- **The Approach**: The dynamic `zIndex` ensures that the first member's avatar is physically stacked on top of the second, matching modern UI patterns. If a document has 5 members, we render 3 avatars and a final `+2` badge. The cascading fallback logic ensures that if a user hasn't set an image or a name in their public profile, it gracefully drops back to the first letter of their email address, rather than rendering a broken UI block.

## Step 23: Multi-Email Invites & Advanced Inbox Workflow (2026-06-11)

We massively expanded the invitation system to support bulk email inputs and introduced a dedicated, interactive Inbox with persistent invite history.

### 1. `(home)` Route Group & Skeleton Isolation
**What we did:**
- Moved the dashboard `page.tsx` and `loading.tsx` into a special Next.js Route Group folder named `app/(main)/(home)/`.
- Updated the path imports accordingly without changing the actual URL structure (route groups are invisible in URLs).

**How it works & Why we use it:**
- **The Approach**: Previously, `loading.tsx` sat at the root of `app/(main)/dashboard/`. Next.js applies `loading.tsx` to the current route *and all nested child routes*. This meant that if a user was in the dashboard and clicked to open `/dashboard/[docId]`, the dashboard list's skeleton loader would flash on the screen during the transition! By wrapping the dashboard list in `(home)`, the `loading.tsx` is strictly isolated to *only* the dashboard list page. Navigating into a document now skips the list skeleton entirely, resulting in a buttery-smooth page transition.

### 2. Multi-Email Token Input (`UserSearchInput.tsx`)
**What we did:**
- Rebuilt the `UserSearchInput` from a simple text field into a dynamic, Slack/Gmail-style token input.
- Users can type emails and press `Enter` to create visual "pills" representing selected contacts.
- Implemented concurrent debounced database lookups (`searchUsersByEmail`) that fetch a registered user's GitHub avatar and name.
- Solved a complex async race condition using `useRef` for the `selectedContacts` array.

**How it works & Why we use it:**
- **The Approach**: When a user rapidly types an email and hits Enter, the 300ms search debounce hasn't finished. If we don't handle this, the pill generates as a "Custom Email" with no avatar. We bypassed the debounce on `Enter` to instantly verify the email against the database. 
- **The Stale Closure Bug**: Because database checks are asynchronous (taking ~100ms), if the user deleted another pill while waiting for the avatar to resolve, React's closure would overwrite the state using an old snapshot of the array, bringing the deleted pill back to life! By mirroring the state into a mutable `useRef`, our async function always has access to the absolutely latest, up-to-the-millisecond array of pills, entirely preventing data-loss.

### 3. Bulk Invite Server Action (`send-email-invites.action.ts`)
**What we did:**
- Upgraded the "Send via Email" tab to accept the array of selected contacts.
- Built a new server action that iterates over every selected email.
- Generates a `crypto.randomUUID()` token for each email, applies a 24-hour expiration (`expires_at`), and performs a single bulk `insert` into the `invites` table.

**How it works & Why we use it:**
- **The Approach**: Handling bulk inserts on the server guarantees security and prevents malicious clients from manipulating tokens. The `invites` table now elegantly scales from single-use shared links to targeted email campaigns.

### 4. Interactive Inbox & Status Persistence (`inbox-list.tsx` & `inbox-item.tsx`)
**What we did:**
- Built the `/inbox` route to query the `invites` table where the `email` column matches the logged-in user.
- Dynamically joined the `documents` and `users` tables to display the original Document Owner's name, email, and avatar directly inside the inbox item.
- Implemented "Accept" and "Reject" buttons wrapped in `AlertDialog` confirmation popups.
- Upgraded the database schema check constraint (`invites_status_check`) to allow `'rejected'` statuses.

**How it works & Why we use it:**
- **The Approach**: The user requested that accepted and rejected invites *remain* in the inbox for historical purposes. When an action executes, the invite isn't deleted. Instead, the UI dynamically replaces the buttons with stylish "Accepted" or "Rejected" badges based on the `status` enum. 
- A final "Delete" (Trash icon) action was added, allowing users to physically run a `DELETE` query to clean up their inbox only when they explicitly choose to do so.

### 5. Universal UI Polish: Consistent Loading Spinners & Error Handling
**What we did:**
- Replaced all raw text loading states (e.g., "Signing in...", "Creating...", "Saving...") with a perfectly centered `Loader2` spinner from `lucide-react` across **all 12 primary actions** (Authentication, Dashboard, and Invitation systems).
- Fixed a bug where buttons would visually shrink or layout would jitter when the text was replaced by the spinner.
- Enhanced the `sendEmailInvites` server action to automatically filter out "self-invites" and intelligently prevent sending duplicate invitations if a user already has an active pending invite or is already a member for the requested role.
- Updated Next.js `<form action={...}>` handlers to `onSubmit` React events to ensure the loading spinner rendered immediately without being batched by Next.js Server Action transitions.

**How it works & Why we use it:**
- **The Zero-Jitter Spinner Trick**: Instead of deleting the button text to show the spinner, we keep the text in the DOM but apply `opacity-0` when loading. The spinner is then rendered via `absolute inset-0 flex items-center justify-center`. This physically locks the button width and height to its original dimensions, creating an incredibly smooth, premium UI interaction without any layout jumps.
- **Form Action Batching Fix**: In React 18 / Next.js 14, Server Actions triggered directly via the `action` attribute implicitly wrap updates in `useTransition`. This prevents `isPending` state changes from immediately appearing on the screen. By intercepting the submit with an `e.preventDefault()` `onSubmit` handler, React triggers the `isPending` re-render instantaneously before executing the async action.
- **Silent Email De-duplication**: When an owner bulk-invites 5 people, but 1 is their own email and 1 already accepted the invite, the backend silently drops those two and issues an invite to the remaining 3 without crashing the entire batch operation. It provides specific, detailed error messages (`toast.error`) only if every email in the payload fails the validation checks.

### 6. Filterable Client-Side Inbox List (`inbox-client-list.tsx`)
**What we did:**
- Refactored the main `/inbox` route to separate data fetching (Server Component) from UI state management (Client Component).
- Built `<InboxClientList />` to wrap the inbox items.
- Added a dynamic Shadcn `<Select>` dropdown filter for `All Invites`, `Pending`, `Accepted`, `Rejected`, and `Expired`.
- Memoized the filtered array computation using `useMemo` to ensure maximum UI performance during re-renders.

**How it works & Why we use it:**
- **The Approach**: By pushing the array into a Client Component, we can instantaneously filter the inbox items using local state instead of firing off new database queries or causing full-page reloads. 
- **Dynamic Expiration Tracking**: The filter checks the `expires_at` timestamp on the fly. This means if a pending invite hits its 24-hour mark, it automatically falls under the "Expired" filter category without the user ever needing to refresh the page.
- **useMemo Optimization**: Calculating date-math and array intersections on every render can be slow. By wrapping the `filteredInvites` in a `useMemo` hook with `[initialInvites, filter]` dependencies, the browser only runs the filtering logic when the underlying data or the selected filter option actually changes.

---

## Step 24: Collaborative Editor UX Polish - Images, Lists, Checklists, and CSS (2026-06-12)

We implemented several key improvements to the collaborative editor's usability, focusing on media integration, list formatting consistency, cursor selection stability, and pixel-perfect styling.

### 1. Supabase Storage & Image Uploads
We implemented a complete end-to-end image uploading pipeline, replacing temporary local blobs with persistent storage.

#### Client-Side Image Insertion (`src/features/editor/components/toolbar/image-control.tsx`)
- **UI Trigger**: A dedicated image icon button wrapped in a `<TooltipWrapper>` triggers a hidden native `<input type="file" accept="image/*">` click handler.
- **Visual Feedback**: When a file is selected, the client sets `isUploading(true)`, instantly replacing the image icon with a spinning `Loader2` loader to signal active progress.
- **Server Communication**: It appends the selected file to a standard JavaScript `FormData` payload and calls the `uploadImage` server action.
- **Insertion**: Upon receiving the public URL from the server action, it inserts the image into the editor using `editor.chain().focus().setImage({ src: publicUrl }).run()`.
- **Cleanup**: Resets the file input's raw value `e.target.value = ""` so the same file can be uploaded again if deleted.

#### Server-Side Upload Processing (`src/features/editor/actions/upload-image.action.ts`)
- **Authentication Check**: Verifies that the client is authenticated by calling `supabase.auth.getUser()`. If missing, aborts with an `Unauthorized` error.
- **MIME & Size Validation**: Checks that the file exists, has a type starting with `image/`, and is smaller than 5MB.
- **Asset Grouping**: Extracts the file extension and constructs a collision-resistant filename using `crypto.randomUUID()`. It defines the file path as `${documentId}/${fileName}`. This ensures that assets are logically structured and isolated by their corresponding document ID.
- **Upload**: Uploads the file into the `"document-assets"` storage bucket on Supabase.
- **Public URL Retrieval**: Calls `supabase.storage.from("document-assets").getPublicUrl(filePath)` to obtain the CDN-backed public link returned to the editor.

#### Database Storage Requirements
- **Bucket Configuration**: The `document-assets` bucket must be configured as **Public** in the Supabase Dashboard. This permits anonymous reading so that standard `<img>` tags can load the URL without needing temporary signed tokens.
- **RLS Policies**: A Row-Level Security policy must be established on the `storage.objects` table:
  - **SELECT**: Public read permission for objects in `document-assets`.
  - **INSERT**: Authenticated write permission allowing users to upload.

---

### 2. Formatting Lists, Checklists, and Alignment Preservation
Toggling lists or text alignment is a common source of layout loss and cursor drift in rich text editors. We resolved these core editor behaviors.

#### Preservation of Text Alignment during List Toggles (`src/features/editor/components/toolbar/list-controls.tsx` & `src/features/editor/extensions/slash-command.tsx`)
- **The Problem**: In Tiptap, list items are distinct node types (`listItem` for bullets/numbers, and `taskItem` for checklists). Toggling list types deletes the old node and creates a new one. Because default list toggle commands do not preserve alignment, text alignment (center, right, justify) was lost when users switched list types.
- **The Solution**: 
  1. Configured the Tiptap `TextAlign` extension in `editor.tsx` to support the custom list types:
     ```typescript
     TextAlign.configure({
       types: ["heading", "paragraph", "listItem", "taskItem"],
     })
     ```
  2. Wrapped all list toggles in a transaction helper `toggleListAndPreserveAlignment(type)`. This helper reads the active alignment (e.g. `editor.isActive({ textAlign: "center" })`), performs the node type toggle, and immediately re-applies the captured alignment in the same atomic action.
  3. Applied the same alignment-preservation logic to slash command hooks in `slash-command.tsx` so `/bullet`, `/ordered`, and `/task` maintain selection styles.

#### Selection Mapping and Flexbox Crashes (`src/app/globals.css`)
- **The Problem**: Initially, we styled checklists (`taskList`) using CSS Flexbox (`display: flex`) to place the checkbox and text on a single line. However, this caused severe crashes in ProseMirror: `TextSelection endpoint not pointing into a node with inline content`. Flexbox leaves empty gap spaces. If a user clicked in the gap between the checkbox and text, the browser selection resolved to the block level `<li>` instead of the inline text paragraph. ProseMirror threw an error because it expects text selections to reside inside inline paragraphs.
- **The Solution**: We completely abandoned Flexbox for checklists and moved to an **Absolute Positioning and Block-Padding** approach.
  1. The `<li>` item remains a standard block-level element.
  2. The checklist checkbox is wrapped in a label positioned absolutely (`position: absolute; left: 0;`).
  3. Clicks on the label are disabled (`pointer-events: none`) but enabled on the input itself (`pointer-events: auto`).
  4. The text block (`div` or `p`) has a left padding (`padding-left: 1.5rem !important`) covering the checkbox area, ensuring that clicks anywhere in the item register safely inside the text paragraph and prevent DOM selection mapping crashes.

#### Bullet List & Checklist Alignments
- **The Problem**: Moving list bullet markers or checkbox labels along with text in a centered/right-aligned list is difficult because they are outer markers.
- **The Solution**: We wrote modern CSS rules utilizing the `:has()` selector in `globals.css`:
  - When a list item has an aligned child (`li:has(> p[style*="text-align: center"])` or `li:has(> div > p[style*="text-align: center"])`), the stylesheet forces the `<li>` width to `fit-content` and centers it using `margin-inline: auto`.
  - For right alignment, it uses `margin-left: auto; margin-right: 0;`.
  - This collapses the block around the text and moves the entire list item across the screen, keeping the bullet/checkbox perfectly locked alongside the text.
  - We added resets targeting nested lists (`.prose li:has(...) > ul`) so nested items do not inherit parent alignment and stay correctly structured.

---

### 3. CSS Customizations & Polish (`src/app/globals.css`)
We refined the stylesheet with unlayered classes to bypass Tailwind specifiers:
- **Unlayered Specificity**: Moved checklist styles out of `@layer base` and placed them at the root of `globals.css`. Unlayered CSS rules bypass CSS Layer rules, ensuring that our checklist overrides take highest priority over Tailwind's default resets.
- **Spacing Sweet-Spot**: Set checklist padding to `1.5rem` (`pl-6`), matching bullet lists. This keeps the vertical text alignment uniform throughout the document and leaves a clean 8px gap for the checkbox.
- **Inline Code Red theme**: Styled inline code (`code:not(pre code)`) with a light grey background (`#f4f4f5`) and a red typography color (`#dc2626` in light mode, `#f87171` in dark mode) to deliver a classic editor feel.
- **Task completion**: Styled completed tasks (`li[data-checked="true"]`) to automatically render with a strike-through text decoration and a muted grey color (`color: #71717a`).

---

## Step 25: Multi-Page Document Pagination (2026-06-12)

We implemented a Google Docs-style multi-page pagination system to render the collaborative document with distinct, visually separated A4 pages and dynamic footers.

## Step 25: Multi-Page Document Pagination (2026-06-12)

We implemented a true Google Docs-style multi-page pagination system. Instead of the editor functioning as a single, infinitely scrolling webpage, the collaborative document is visually split into distinct A4 pages with physical gaps, headers, and footers.

### 1. The Challenge of Pagination in Tiptap
Tiptap and ProseMirror are built around continuous DOM nodes. True pagination is notoriously difficult because you must split a continuous block of text (which could be a single massive paragraph or table) across multiple visual HTML boundaries without breaking the underlying JSON data structure. If you modify the JSON schema to insert physical "page break" nodes, it severely disrupts collaborative editing (Yjs) and copy-pasting.

### 2. How the Community Package Solved This
To solve this without corrupting the document structure, we utilized the `tiptap-pagination-plus` community package.
**How it works under the hood:**
- It does **not** alter the underlying Tiptap JSON data or Yjs synchronization structure.
- Instead, it operates entirely on the frontend view layer using **ProseMirror Decorations**.
- It listens to the editor's update lifecycle, measures the actual DOM height of the rendered HTML nodes, and dynamically injects floated "Page Breaker" widget decorations into the editor view whenever the content exceeds the defined page height.
- These injected widgets act as physical spacers, pushing subsequent text down and creating the visual illusion of distinct pages complete with gaps and borders.

### 3. Detailed Property Configuration in `editor.tsx`
We configured the `PaginationPlus` extension with specific physical layout dimensions to perfectly match standard A4 paper at 96 DPI. Here is a deep dive into every property we configured:

- **`pageWidth: 794`**: The exact width of the page container in pixels. This translates to the 210mm width of an A4 page.
- **`pageHeight: 1123`**: The exact height of the page container in pixels. This translates to the 297mm height of an A4 page. The extension calculates when to insert a break based on this boundary.
- **`marginTop: 72` & `marginBottom: 72`**: These dictate the physical white space (in pixels) reserved at the very top and bottom of every page edge before any content or headers/footers appear. 72px is roughly a standard 1-inch print margin.
- **`marginLeft: 64` & `marginRight: 64`**: The horizontal layout margins ensuring text doesn't touch the edges of the white page card.
- **`contentMarginTop: 8` & `contentMarginBottom: 8`**: This defines the padding specifically between the Headers/Footers and the actual typed document content. It acts as a safety buffer so text doesn't overlap the page numbers.
- **`pageGap: 40`**: The visual gap (gray space) rendered between the bottom of one page and the top of the next page.
- **`pageGapBorderColor: "transparent"`**: Disables any hard-coded border lines in the page gap, allowing us to manage depth and shadows smoothly via Tailwind CSS.
- **`pageBreakBackground: "var(--rm-page-break-bg, #f4f4f5)"`**: This maps the gap background directly to our CSS variable, ensuring the "desk" background seamlessly transitions when toggling between Light and Dark mode.
- **`headerLeft: ""` & `headerRight: ""`**: These properties define the content injected into the top boundaries of the page. We explicitly set these to empty strings `""` to completely remove the document title from the top of the pages, delivering a cleaner, distraction-free aesthetic.
- **`footerLeft: ""` & `footerRight: "Page {page}"`**: We left the bottom-left empty, but injected a dynamic string into the bottom-right footer. The package automatically replaces `{page}` with CSS counters (`counter-reset` and `counter-increment`) to render accurate, auto-updating page numbers at the bottom right of every page.

### 4. Prose Width Override & Column Layout Fix
**What we did:**
Added the `max-w-none` Tailwind typography class to the editorProps attributes class list.
**Why it was critical:**
Tailwind Typography's default `.prose` class enforces a strict maximum width constraint of `65ch` (~520px) to optimize reading length. However, because the pagination extension forcefully sets the editor's internal DOM width to `794px` (A4 standard) and inserts floated page-breaker elements spanning that entire width, the browser's CSS layout engine conflicted. The text container was squeezed by the `65ch` limit while sitting next to a `794px` float, resulting in paragraphs being squished into a single-character wide column. Bypassing the Tailwind typography limit with `max-w-none` ensures the editor fully respects the A4 width and text formats normally across the page.

## Step 26: Enhanced Invitation UI UX & Server State Optimization (2026-06-15)

We optimized the document invitation flow to significantly improve the user experience and reduce unnecessary database queries.

### 1. Pre-fetching Member and Invite States
**What we did:**
- Modified the `getDocumentById` server action to additionally select all pending invites for the document (`invites(email, status, expires_at)`).
- Passed this pre-fetched `invites` data, along with the existing `all_members` array, sequentially down through the component tree: `DocumentHeader` -> `ShareDialog` -> `SendEmailTab` -> `UserSearchInput`.

**Why we use it:**
- **The Approach**: Since the document page is already fetching data server-side on load, pre-fetching the active invites eliminates the need for the client to make extra asynchronous database calls when the user opens the "Invite" dialogue. By drilling this data down, the UI components instantly know exactly who is already invited and who is already a member.

### 2. Smart User Search & Badges (`user-search-input.tsx`)
**What we did:**
- Updated the dropdown suggestion list in `UserSearchInput`.
- When a user's email matches an email in the `all_members` list, we inject a "Member" badge next to their name.
- When it matches an active pending invite, we inject an "Invited" badge.
- If a user is already a member or invited, we apply `opacity-50`, `cursor-not-allowed`, and completely disable clicking on that dropdown item (`disabled={true}`).

**Why we use it:**
- **The Approach**: Previously, the user might blindly invite someone who was already on the document, wasting time and sending redundant emails. Giving them immediate, unclickable visual feedback directly within the search interface provides an incredibly smart and polished user experience.

### 3. Strict Form Validation Blocks (`send-email-tab.tsx`)
**What we did:**
- Updated the manual email entry logic so that if a user bypasses the dropdown and manually types a registered email (and hits Enter or Comma), the system silently rejects turning it into a selected contact "pill" if that email is already a member or invited.
- Implemented `isSubmitDisabled` logic that disables the primary "Send Invitation" button unless the form contains at least one valid, non-member, non-invited email address.

**Why we use it:**
- **The Approach**: This prevents API errors from occurring in the first place. Instead of letting the user click Submit and waiting for the server action to return a "Duplicate Invite" error, the frontend explicitly refuses to let them make the mistake, saving a network request and preventing UI frustration.

## Step 27: Multi-Use Universal Invite Links with 24-Hour Expiry (2026-06-15)

### 1. Distinct Lifecycle for Universal vs. Email Invites
**What we did:**
- Updated `accept-invite.action.ts` to differentiate between targeted Email invites (which have a non-null `email` field) and Universal Shareable links (which have a `null` email field).
- Instead of unconditionally marking all invites as `accepted` (invalidating them) upon use, the system now only marks the status as `accepted` if `invite.email` exists.
- Universal links remain in the `pending` state indefinitely, allowing them to be utilized by multiple unique users without breaking.

**Why we use it:**
- **The Approach**: A manually generated "Create Link" is meant to be shared in chat rooms or slack channels. If it was strictly single-use, the owner would have to generate a new link for every individual employee. By allowing multi-use for non-email tokens, it significantly improves team onboarding UX.

### 2. Time-Based Expiry for Universal Links
**What we did:**
- Updated `create-invite.action.ts` to automatically attach a `24-hour` expiry timestamp to newly generated universal links, aligning their security model with email invites.
- Updated the backend validation in `get-invite-details.action.ts` to strictly enforce this `expires_at` timestamp. 
- Updated the `create-link-tab.tsx` disclaimer UI to explicitly inform the owner that the link they are copying is a 24-hour multi-use token.

**Why we use it:**
- **The Approach**: Infinite multi-use links are a massive security hazard. If a link leaked, anyone could join forever. By enforcing a strict 24-hour time-to-live (TTL), we get the convenience of a universal multi-use link with the strict security bounds of a highly-secure enterprise application.

## Step 28: Editor UI Polish, Focus Management, and Drag-and-Drop Images (2026-06-15)

We performed critical focus management fixes and resolved edge cases that were disrupting the collaborative editing experience, specifically preventing Yjs selection loss when interacting with the UI.

### 1. Radix UI Focus Stealing Fixes (`font-family-control.tsx`, `font-size-control.tsx`, `table-control.tsx`)
**What we did:**
- Identified that standard Radix UI `DropdownMenu` and `Select` components forcefully steal DOM focus away from the Tiptap `contenteditable` when hovered or opened.
- Replaced the strict `DropdownMenuItem` primitives with passive HTML `<div>` elements inside `DropdownMenuContent`.
- Configured the menus with `modal={false}` and overrode `onCloseAutoFocus` and `onOpenAutoFocus` with `e.preventDefault()`.

**Why we use it:**
- **The Approach**: In collaborative editors (Yjs), the remote selection highlight is strictly tied to the editor's focus state. If the browser blurs the editor, the selection vanishes for all other users. By converting these complex dropdowns into passive, focus-free HTML elements, users can select fonts, sizes, and tables while Tiptap seamlessly maintains control over the browser's active selection.

### 2. URL Popover Focus Fixes (`link-control.tsx` and `link-bubble-menu.tsx`)
**What we did:**
- Removed `autoFocus={true}` from the URL text inputs.
- Applied `onOpenAutoFocus={(e) => e.preventDefault()}` to the Radix `PopoverContent`.
- Applied `onMouseDown={(e) => e.preventDefault()}` to the link trigger buttons.

**Why we use it:**
- **The Approach**: Clicking the "Link" button previously caused the popover to instantly hijack keyboard focus, which blurred the editor and immediately wiped the user's text selection before they could even type. By blocking the aggressive auto-focus, the popover opens peacefully, keeping the selection visible until the user explicitly clicks into the input field to type the URL.

### 3. Native Image Dragging (`resizable-image.tsx`)
**What we did:**
- Enabled native browser drag-and-drop for images by passing `data-drag-handle` and toggling `draggable={true}` based on the selection state.

**Why we use it:**
- **The Approach**: Previously, Tiptap's drag capabilities were blocked because the custom image extension overrode the native `draggable` attribute to protect its resize handles. Adding `data-drag-handle` correctly interfaces with ProseMirror, allowing users to naturally click and drag images around the document just like text blocks.

### Summary of Recent Completed Goals (as per Project Status)
- Enhanced editor with advanced features, improved image handling, modularized configuration, and updated directory structure.
- Implemented full inbox system with real-time notifications, invite management actions, and an interactive UI for tracking pending invitations.
- Refactored and standardized user profile displays with new utility functions and updated inbox filtering logic.
- Revamped global UI design with updated font typography, refined component styling, and enhanced glassmorphism effects.
- Added consistent loading spinner overlays to buttons across authentication, dashboard, and invitation features, and improved email Invitation logic.
- Implemented a true A4 multi-page document pagination system with visual page breaks and dynamic footers.
- Built a contextual floating formatting bubble menu for highlighted text (Bold, Italic, Underline, Highlight).
- Implemented a `/` slash command listener to instantly insert headings, lists, tables, and images without using the mouse.
- Replaced ephemeral `blob:` URLs with persistent image uploads to a Supabase Storage bucket via Next.js Server Actions.
- Unified editor role synchronization and updated UI controls for improved reactivity and consistency (resolving focus-stealing edge cases).

## Step 29: Dashboard Modernization and UI Overhaul (2026-06-16)

We modernized the dashboard interface by moving away from a sidebar-heavy layout to a clean, grid-based layout centered around sleek, landscape document cards.

### 1. Unified Dashboard Navigation
**What we did:**
- Removed the heavy left sidebar (`MobileSidebar` and related desktop configurations) in favor of a clean, persistent top navigation bar.
- Refactored `document-list.tsx` to handle a responsive 3-column grid layout for documents.

**Why we use it:**
- **The Approach**: A full-width grid provides a much more immersive experience, similar to modern file browsers, making it easier to scan document titles and preview content without a sidebar taking up 20% of the screen.

### 2. High-Fidelity Document Cards
**What we did:**
- Redesigned the `DocumentCard` component into a dual-section landscape card (`h-[280px]`).
- The top half integrates a scaled-down rich-text `previewJson` generated server-side.
- The bottom half explicitly houses document metadata (role badge, timestamps) and the persistent action menu (`DocumentActionMenu`).

**Why we use it:**
- **The Approach**: Moving from simple text-only cards to rich-preview cards allows users to instantly recognize their documents visually. Repositioning the action menu to the preview area and making it always visible increases discoverability for quick actions like Rename or Delete.

### 3. Tiptap Preview Engine Fixes
**What we did:**
- Fixed a silent failure in the `useDocumentPreview` hook by explicitly registering the full suite of Tiptap extensions (`Table`, `TaskList`, `ResizableImage`, etc.) required by the editor.

**Why we use it:**
- **The Approach**: The `generateHTML` utility requires exact knowledge of all custom nodes present in the JSON AST. Without these extensions registered, Tiptap could not parse complex documents containing tables or tasks, causing the preview to fail and render empty text.

### 4. Smart "Create Document" Theming
**What we did:**
- Overhauled the `CreateDocumentButton` UI to respect the global project light/dark theme instead of a hardcoded pure black design.
- Streamlined the icon selection to a curated list of relevant document emojis.
- Implemented an implicit icon-save mechanism by dynamically prepending the selected icon directly into the document `title` field upon creation.

**Why we use it:**
- **The Approach**: Since the `documents` database table lacks a dedicated `icon` column, prepending it to the title allows us to fulfill the UI requirement (displaying an icon before the title on the document cards) without running a complex schema migration that could disrupt the live database.

## Step 30: Interactive Table Column Resizing (2026-06-16)

We implemented interactive column resizing for data tables within the collaborative editor, aligning the user experience with other resizable media components.

### 1. Enable Table Resizing
**What we did:**
- Updated the Tiptap `Table` extension configuration in `src/utils/editor-config.ts` to set `resizable: true`.

**Why we use it:**
- **The Approach**: Enabling built-in table column resizing allows ProseMirror to dynamically inject `<colgroup>` and `<col>` elements into the DOM, making columns resizable by dragging their boundaries. Since the column widths are stored directly in the cell schema attributes, they are synchronized automatically across all collaborative clients via the Yjs/WebSockets synchronization layer.

### 2. Standardize Resize Cursor CSS
**What we did:**
- Corrected the `.resize-cursor` styling selector in `src/app/globals.css` from `.prose .resize-cursor` to `.prose.resize-cursor, .resize-cursor`.

**Why we use it:**
- **The Approach**: ProseMirror applies the `resize-cursor` class to the main editor element itself (which also has the `.prose` class) during resizing. The previous descendant selector `.prose .resize-cursor` searched for a nested element and failed to apply the `cursor: col-resize` style. Correcting the selector ensures a standard, responsive resize cursor appears whenever the user hovers over and drags column borders.

## Step 31: Dashboard Scalability & Pagination UI Refinements (2026-06-16)

We modernized the dashboard's document grid by shifting from client-side filtering to robust, URL-driven server-side pagination to ensure smooth performance at scale.

### 1. Server-Side URL Pagination
**What we did:**
- Refactored `getUserDocuments` server action to accept `search` and `page` parameters, utilizing Supabase's `.range()` for explicit 6-item pagination limits.
- Updated `document-list.tsx` to read `searchParams` directly from the URL.

**Why we use it:**
- **The Approach**: Loading all user documents into memory at once causes immense slowdowns for heavy users. By shifting filtering and pagination to the database and driving the state via URL parameters (`?page=2`), we guarantee scalable performance and enable users to bookmark or share specific dashboard views.

### 2. Next.js Prefetching and Instant Navigation
**What we did:**
- Used Next.js native `<Link prefetch={true}>` for the "Next" and "Previous" pagination buttons instead of manual `router.push`.

**Why we use it:**
- **The Approach**: This natively instructs the Next.js router to fetch the subsequent page's data in the background *before* the user clicks. When they click "Next", the transition is effectively instant, providing an incredibly fast, native-feeling application experience without needing manual loading states.

### 3. Overlay Search Spinner & Flex Layout
**What we did:**
- Implemented a 500ms `useDebounce` hook for the search input.
- Added an `isLoading` state overlay that dims the active document cards (`opacity-40`) and renders a centered spinner when typing, rather than replacing the grid entirely.
- Added `flex-1` and `min-h-full` layout classes to the dashboard container to anchor the pagination row strictly at the bottom of the screen.

**Why we use it:**
- **The Approach**: Completely replacing document cards with a blank loading screen feels jarring. A dimmed overlay provides immediate visual feedback that a search is processing while maintaining spatial context. Pushing the pagination row to the bottom via Flexbox prevents layout shifts ("jumping") regardless of whether the grid renders 2 or 6 documents.

## Step 32: Real-time Inbox Optimization & Stale Closure Fixes (2026-06-17)

We heavily optimized the real-time invitation system to provide an instant, seamless UX without triggering full-page reloads or jarring skeleton loaders when background events occur.

### 1. Removing Full-Page Reloads (`inbox-realtime-listener.tsx`)
**What we did:**
- Removed `router.refresh()` from the Supabase Postgres changes listener.
- Replaced it with a direct callback `onNewEvent()` that triggers the local React state update instead of a Next.js server-side reload.

**Why we use it:**
- **The Approach**: `router.refresh()` forces the entire Next.js routing tree to re-fetch its server components. This caused a heavy "flash" on the page every time an invite was received. By using a local callback, the Inbox component can quietly fetch its own data and inject it into the UI.

### 2. Silent Background Fetching (`inbox-client-list.tsx`)
**What we did:**
- Added a `silent` boolean parameter to the `fetchFiltered(silent = false)` function.
- If `silent` is true, it intentionally skips turning on the `setIsFilterLoading(true)` skeleton loader.
- Updated the real-time listener to execute `onNewEvent(true)`.

**Why we use it:**
- **The Approach**: When a user clicks a filter tab (like "Documents"), they expect a loading skeleton to acknowledge their click. However, when an invite arrives in the background, a sudden loading skeleton interrupting their workflow is jarring. The `silent` fetch pulls the new data invisibly and React's diffing engine seamlessly injects the new row into the DOM without a single pixel of layout shift.

### 3. The "Stale Closure" Bug Fix
**What we did:**
- Wrapped the `onNewEvent` callback inside a `useRef` container (`const onNewEventRef = useRef(onNewEvent)`).
- Added a small `useEffect` watcher that continuously updates the ref's `.current` value whenever the user changes filters.
- Re-routed the Supabase WebSocket listener to execute `onNewEventRef.current(true)` instead of the raw `onNewEvent` prop.

**Why we use it:**
- **The Approach**: The WebSocket `useEffect` runs exactly once on mount, capturing the initial `filter` state (`"all"`). This created a classic **Stale Closure** bug—even if the user switched to the "Documents" tab later, a new invite arriving would trigger the old function, fetching the "All" list and forcefully overriding the user's current view. By using a mutable `useRef`, the permanent WebSocket connection is provided a stable memory address that we quietly update with the freshest function context behind the scenes, ensuring incoming data strictly respects the user's active filter tab.

## Step 33: Page Thumbnails Sidebar (2026-06-17)

We introduced a "Page Thumbnails" sidebar to the document editor, giving users a Google Docs-like navigation pane that displays real-time mini previews of every page.

### 1. Debounced Tiptap DOM Cloning (`page-thumbnails.tsx`)
**What we did:**
- Created a new `<PageThumbnails>` component attached to the left side of the editor layout.
- Utilized a `MutationObserver` mapped to the Tiptap editor DOM node (`.ProseMirror`).
- Implemented a 500ms `useDebounce` hook that triggers an update whenever the user pauses typing.
- Extracted the raw HTML of every Tiptap `.page` node and rendered them within the sidebar.

**Why we use it:**
- **The Approach**: Rendering complex real-time previews is incredibly demanding on the browser. If we updated the thumbnails on every keystroke, the editor would lag significantly. By debouncing the extraction and leveraging Tailwind's CSS transform (`scale(0.282)`) on the raw HTML, we achieve pixel-perfect thumbnails (including images, tables, and colors) without sacrificing editor performance.

### 2. Smooth Scrolling & Collapsible UI
**What we did:**
- Assigned unique IDs to every dynamically generated `.page` node.
- Bound the thumbnail `onClick` events to `element.scrollIntoView({ behavior: 'smooth' })`.
- Added a toggle state to collapse the entire sidebar into a narrow 32px strip when more screen real estate is needed.

**Why we use it:**
- **The Approach**: Gives power users the ability to rapidly navigate large documents while ensuring that laptop users aren't permanently penalized by the loss of horizontal screen space.

### 3. Tiptap DOM Recycling & Scroll Navigation Fix
**What we did:**
- Identified that Tiptap recycles DOM nodes internally (e.g., shifting the physical HTML element for Page 1 down to become Page 2 to save memory).
- Switched the thumbnail navigation logic from using static `id` attributes (which became stale due to recycling) to a real-time `pageNumber` DOM index query (`document.querySelectorAll('.tiptap .page')[pageNumber - 1]`).
- Bypassed native `window.scrollTo` and `scrollIntoView` quirks by explicitly targeting the Next.js layout's `<main>` overflow container.
- Implemented exact pixel math (`elRect.top - containerRect.top + container.scrollTop - offset`) to guarantee the scrolled page perfectly clears the application's sticky header.

**Why we use it:**
- **The Approach**: Because Tiptap tightly controls its DOM and dynamically shifts elements, storing static IDs causes thumbnails to scroll to the wrong visual pages (e.g., clicking Page 1 scrolls to Page 2). By querying the live DOM array at the exact millisecond of the click, we guarantee 100% accuracy. Additionally, manually scrolling the `<main>` container rather than relying on CSS `scroll-margin-top` ensures pixel-perfect alignment that cannot be stripped or overridden by Tiptap's internal rendering engine.

---

## Step 34: ESLint & TypeScript Error Cleanup (2026-06-18)

We performed a comprehensive cleanup of all ESLint and TypeScript errors across the `web/` and `hocuspocus-server/` directories, fixing **70 ESLint errors** and resolving type safety issues introduced by Supabase's dynamic data shapes.

### 1. ESLint Error Resolution (`web/`)

**What we did:**
- Fixed all 70 ESLint errors across 22 files in the web application.

**Error categories:**

| Rule | Count | Fix |
|------|-------|-----|
| `@typescript-eslint/no-explicit-any` | ~20 | Replaced with typed interfaces (`DocData`, `DocMember`, `ActiveUser`) or `unknown` with `instanceof Error` guards |
| `@typescript-eslint/no-unused-vars` | ~18 | Removed unused imports (`Label`, `FileText`, `PlusSquare`, `useRef`, `EditorSkeleton`, `ShieldAlert`, `getInitials`, `useTransition`) and unused variables (`error`, `err`, `setTitle`, `data`) |
| `react/no-unescaped-entities` | 3 | Escaped `'` to `&apos;` in `not-found.tsx` and `auth-tabs.tsx` |
| `react-hooks/static-components` | 6 | Extracted `NavItem` components outside render functions in `dashboard-header.tsx` and `sidebar-content.tsx`; passed `pathname` as a prop |
| `react-hooks/set-state-in-effect` | 3 | Refactored `document-rename-dialog.tsx` to use conditional render instead of `useEffect`; added eslint-disable for Y.js/Hocuspocus initialization in `editor.tsx` |
| `react-hooks/exhaustive-deps` | 2 | Added missing dependencies (`router`, `setCurrentUserRole`, `setActiveUsers`) |
| `react-hooks/refs` | 8 | Moved ref access into `useEffect` in `document-list.tsx` |

**Key changes:**
- **`document-card.tsx`**: Defined `DocData` and `DocMember` interfaces replacing `any` prop types; removed all inline `as` casts
- **`dashboard-header.tsx`**: Extracted `NavItem` into a standalone component with proper `LucideIcon` typing
- **`sidebar-content.tsx`**: Extracted `NavItem` into a standalone component with `pathname` prop
- **`editor.tsx`**: Fixed `onAwarenessUpdate` callback to use `ActiveUser[]` type; removed unused imports; removed `documentTitle` interface field
- **`document-rename-dialog.tsx`**: Replaced `useEffect` sync with inline conditional render to satisfy `set-state-in-effect` rule
- **`document-list.tsx`**: Replaced ref-based filter sync with `useEffect` pattern
- **`sign-out-button.tsx`**: Added proper interface for `SignOutDialogContent` props

### 2. TypeScript Type Safety Fixes (`web/`)

**What we did:**
- Fixed a pre-existing type mismatch in `inbox-list.tsx` where Supabase query results (returning `documents` as an array, `owner` as an array) were passed directly to `InboxClientList` which expected a flat `InboxInvite` type.

**How it works & Why we use it:**
- Created a data mapping layer in `inbox-list.tsx` that transforms the raw Supabase array-response format into the expected `InboxInvite` shape, flattening nested arrays and ensuring required fields exist.

### 3. Lint Status (`hocuspocus-server/`)

**What we found:**
- `tsc --noEmit` passes with zero errors.
- No ESLint configuration exists in the directory; no eslint package is installed.

**Current state:** All ESLint errors in `web/` are resolved. All TypeScript errors (except pre-existing, unrelated issues) are resolved. `hocuspocus-server` compiles cleanly.

---

## Step 35: Hydration Fix & Smooth Loading Transitions (2026-06-18)

We resolved a critical Next.js hydration mismatch in the dashboard document cards and added smooth fade-in transitions across three preview surfaces.

### 1. Hydration Mismatch Fix (`document-card.tsx`)

**What we did:**
- Identified that `@tiptap/react`'s `generateHTML()` produced different output on the server (empty string → SVG placeholder) vs the client (actual HTML → scaled A4 preview), causing React hydration to fail with an HTML structure mismatch.
- Replaced a `useEffect` + `useState` pattern (which triggered the `react-hooks/set-state-in-effect` lint rule) with `useSyncExternalStore` — the idiomatic React API for differentiating server from client rendering.
  ```tsx
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,   // client snapshot
    () => false   // server snapshot
  );
  ```

**Why:**
- `useSyncExternalStore` returns `false` during SSR (preventing hydration mismatch) and `true` after hydration — all without effects or cascading re-renders.

### 2. Smooth Fade-In Transitions

We applied a consistent fade-in pattern across three components using `requestAnimationFrame` to defer a `showPreview` state update to the next paint frame, combined with CSS `transition-opacity duration-500 ease-in-out`.

| Component | Before | After |
|-----------|--------|-------|
| `DocumentPreview` (dashboard card) | Abrupt switch from SVG placeholder to A4 preview on mount | SVG placeholder visible immediately; preview fades in with 500ms opacity transition |
| `PageThumbnails` (editor sidebar) | "Loading pages..." replaced by thumbnails instantly | Thumbnail container fades in with 500ms opacity transition |
| `Editor` (document view) | Full editor rendered instantly after Yjs sync | Editor container fades in with 500ms opacity transition after sync completes |

**How it works:**
1. Both the placeholder and content divs are always present in the DOM (absolute positioned, overlapping)
2. Content div starts at `opacity: 0`
3. `requestAnimationFrame(() => setShowPreview(true))` defers the state update to the next frame, ensuring the element is in the DOM at `opacity: 0` before the CSS transition triggers
4. CSS transition smoothly animates `opacity` from `0` to `1`

### 3. Smooth PageThumbnails Open/Close

**What we did:**
- Restructured `page-thumbnails.tsx` to use a single container with two animated children instead of two separate conditional returns (which prevented CSS transitions).
  - **Sidebar panel**: `overflow-hidden transition-[width] duration-300 ease-in-out` — width smoothly animates between `16rem` (open) and `0` (closed)
  - **Toggle button**: `transition-all duration-300 ease-in-out` — fades and scales away when sidebar opens, reappears when closed

**Why:**
- Previously, the sidebar open/close was instant because React unmounted one element tree and mounted another. By always rendering both the panel and the button, and using width/opacity transitions, the sidebar now slides open and closed smoothly.

---

## Step 36: SendGrid API Integration & Document Preview Rendering Fixes (2026-06-18)

We finalized the email invitation architecture by integrating SendGrid and resolved a critical boundary detection bug in the document page preview system.

### 1. Sequential SendGrid Email Integration (`sendgrid.action.ts` & `send-email-invites.action.ts`)

**What we did:**
- Implemented a dedicated `sendgrid.action.ts` wrapper to handle the SendGrid API communication.
- Refactored `sendEmailInvites` to operate as a two-step sequential process:
  1. **Database First**: The invitation is inserted into the `invites` table. This is the primary source of truth, ensuring the invite immediately appears in the recipient's in-app inbox.
  2. **SendGrid Second**: Only after a successful database insertion does the system trigger the SendGrid API to dispatch the email notification.

**Why:**
- **Failure Handling & Resilience**: By inserting into the database first, we guarantee that the invitation exists in the system regardless of email delivery issues. If the database insertion fails, the process halts. If the SendGrid API fails, the error is logged, but the inbox invitation remains intact, ensuring the user can still access the document via the application.

### 2. Document Preview Boundary Detection (`page-extraction.ts`)

**What we did:**
- Resolved a visual bug in the document export and preview feature where the first line of subsequent pages was incorrectly rendered at the bottom of the preceding page.
- Refined the `extractPageContent` logic in `page-extraction.ts` to implement strict element-to-page boundary mapping.

**Why:**
- Tiptap's DOM recycling and continuous node structure make it difficult to split content perfectly across visual pages. Enhancing the boundary detection ensures that text blocks align correctly with their assigned page coordinates, eliminating content duplication and visual overflow in the thumbnails and exported documents.

---

## Step 37: Automated Testing Infrastructure & 100% Coverage (2026-06-24)

We established a comprehensive, enterprise-grade automated testing suite, prioritizing programmatic stability and complete coverage of all application logic.

### 1. Vitest Unit Testing (`tests/unit/`)

**What we did:**
- Implemented a massive unit testing suite utilizing `vitest`, `@testing-library/react`, and `jsdom`.
- Achieved **100% testing coverage** across all core functionalities. The suite now contains **303 passing tests** split across **53 highly-granular test files**.
- Maintained strict architectural colocation: `login-form.tsx` is tested by `login-form.test.tsx`, and `create-document.action.ts` is tested by `create-document.action.test.ts`.

**Why:**
- **Performance & Isolation:** Splitting tests into 53 separate files allows Vitest to heavily parallelize the execution, running over 300 assertions in under 20 seconds. It isolates failures immediately, prevents git merge conflicts, and ensures that Server Actions (the core security boundaries) are impenetrable.

---

## Step 38: Forgot Password Flow & Professional HTML Email Templates (2026-06-24)

We successfully finalized the user authentication lifecycle by implementing a robust "Forgot Password" architecture and overhauled our SendGrid email templates for a premium, branded user experience.

### 1. Traditional Magic Link Password Reset Flow
**What we did:**
- Built a secure, traditional password reset flow relying on Supabase's `resetPasswordForEmail` API.
- Users request a reset via `app/forgot-password/page.tsx` and receive a secure Magic Link via email.
- The link directs them to the existing `app/auth/callback/route.ts` (PKCE flow), which automatically establishes an authenticated session and redirects them to the new `app/update-password/page.tsx`.
- Implemented `update-password.action.ts` which uses `supabase.auth.getUser()` to safely update the password for the newly authenticated session.
- Whitelisted the `/forgot-password` route in the `src/lib/supabase/proxy.ts` Edge Proxy so unauthenticated users can access it.

**Why:**
- **Security:** Handling resets via a Magic Link -> PKCE Callback flow means we don't need to manually map or pass around insecure user IDs in URLs. The `auth/callback` handles the complex security handshake and session establishment natively.

### 2. Premium SendGrid HTML Email Templates
**What we did:**
- Designed a fully responsive, modern HTML email template for both the "Password Reset" (managed in Supabase Dashboard) and "Collaboration Invites" (managed in codebase).
- Integrated the project's logo dynamically from the Supabase Storage bucket (`document-assets`).
- Built a fallback mechanism to render pure text ("CollabDoc") if the image ever fails to load.
- Updated `send-email-invites.action.ts` to dynamically fetch the inviter's name from the `users` table, displaying it securely in the email subject and body.
- Enhanced the invite template layout to display the Document Title and Role in a sleek, isolated highlight box (similar to Notion and Figma invites).
- Configured `sendgrid.action.ts` to use "CollabDoc" as the explicit sender name in the `From` field instead of displaying a raw system email address.

**Why:**
- **Branding & Trust:** Default plain-text emails often end up in spam folders and fail to inspire trust. By utilizing well-designed, mobile-responsive HTML templates with dynamic personalization, the application feels enterprise-grade from the moment the user opens their inbox.

---

## Step 39: User Profile Sync & Avatar Upload UX Polish (2026-06-24)

We resolved a critical database synchronization issue regarding user profile pictures and significantly improved the UX of avatar uploading.

### 1. Database Schema Synchronization (`image` vs `avatar_url`)
**What we did:**
- Discovered a discrepancy where the application was querying a non-existent `avatar_url` column instead of the actual `image` column in the `public.users` table, which caused profile pictures to fail globally.
- Reverted all database selectors, TypeScript interfaces, and `extractUserInfo` utility mappings across the project (`get-document-by-id.action.ts`, `get-user-documents.action.ts`, `search-users.action.ts`, etc.) to use the authoritative `image` column.
- Updated `update-profile.action.ts` to correctly persist new avatar uploads into the `image` column.
- Synchronized the architectural documentation (`DATABASE.md` and `AGENTS.md`) to reflect this schema truth.

**Why:**
- **Source of Truth:** Aligning the codebase perfectly with the actual PostgreSQL schema eliminates 500 errors and ensures that profile updates propagate instantly across all components (Dashboard, Document Headers, Member Popovers, and Invites).

### 2. Avatar Upload UX & Zero-Jitter Loader
**What we did:**
- Redesigned the avatar upload flow in `profile-settings-tab.tsx` to completely decouple file selection from database mutation.
- When a user selects an image, it instantly generates a local `URL.createObjectURL()` preview without making any API calls to Supabase Storage. This allows users to preview multiple images freely.
- Uploads are strictly deferred until the user clicks "Save Changes".
- Upgraded the "Save Changes" button to utilize the project's standard "zero-jitter spinner pattern" (`opacity-0` text with an absolute centered `<Loader2 />`).
- Implemented a seamless background image preloader during the save process: the loading spinner remains active while the newly uploaded image is silently downloaded from Supabase. The spinner is only removed when the `onload` event fires, completely eliminating image flashing or broken UI states.
- Removed unnecessary hover scaling (`group-hover:scale-105`) and opacity fading from the Navbar user dropdown and Profile Settings avatar to maintain a solid, premium aesthetic.

**Why:**
- **Performance & Polish:** Deferring uploads prevents orphaned files in the storage bucket and reduces unnecessary database mutations. Preloading the image before dismissing the spinner guarantees a perfectly smooth, flash-free transition, resulting in a significantly more polished, app-like feel.

---

## Step 40: Type Safety Strictness & Inbox Real-Time Revocation (2026-06-25)

We established 100% strict TypeScript typing across the entire codebase and resolved the complex WebSocket synchronization bug for invite revocations.

### 1. 100% Strict Type Safety & ESLint Compliance
**What we did:**
- Achieved a completely clean `npx tsc --noEmit` and `npm run lint` output across all 100+ files in the repository.
- Removed all usages of `any` and `// @ts-ignore` from the `src/` feature application code.
- Handled advanced Vitest mocking mismatches (where `ReturnType<typeof vi.fn>` conflicted with chained Supabase query resolution) by explicitly adding `/* eslint-disable @typescript-eslint/no-explicit-any */` pragmas only inside the `tests/unit/setup/` mock files.

**Why:**
- By isolating the `any` casting exclusively to the test environment, we protect the production application logic from loose typing while still satisfying the rigorous TypeScript compiler. A strictly typed codebase prevents runtime exceptions and enables fearless refactoring.

### 2. Real-Time Revocation Synchronicity
**What we did:**
- Refactored `revokeInviteAction` in the server to perform a two-step mutation:
  1. `UPDATE` the invite to `status = 'rejected'`
  2. `DELETE` the invite row immediately
- Updated the client-side `inbox-realtime-listener` to process the `UPDATE` payload and filter out the revoked invite locally.

**Why:**
- Supabase Realtime's `postgres_changes` listener does not forward row payloads when a `DELETE` event occurs. Previously, this meant the recipient's UI couldn't identify which invite was deleted without a full page reload. By explicitly triggering an `UPDATE` event first, we force Supabase to broadcast the full invite payload (including the ID), allowing the client to instantly remove the revoked invite from their inbox list in real-time.

### 3. Glassmorphic UI Perfection
**What we did:**
- Integrated the missing `noise.png` static asset into the `/public/` directory.
- Resolved widespread 404 network errors caused by Tailwind CSS `bg-[url('/noise.png')]` classes.

**Why:**
- The application relies heavily on this static asset to achieve its signature frosted glass, textured aesthetic (mix-blend-overlay). Caching it correctly guarantees the premium look and feel is consistently rendered across all dialogs, skeletons, and layouts.

---

## Step 41: Document Activity Tree Implementation (2026-06-25)

We implemented a comprehensive, GitHub-style linear activity audit log to track the entire lifecycle of a document, including member joins, role updates, removals, and creation events.

### 1. Database Schema Additions
**What we did:**
- Added a new `document_activity` table to track historical events (`action_type`, `metadata`, `actor_id`, `target_user_id`).
- Created a Supabase SQL migration script enforcing strict Row Level Security (RLS) so that only users present in the `document_members` table can view the activity.
- Integrated logging triggers across all relevant server actions (`create-document.action.ts`, `accept-invite.action.ts`, `update-member-role.action.ts`, `remove-member.action.ts`, `leave-document.action.ts`, `accept-request.action.ts`).

**Why:**
- Documenting the lifecycle of collaboration provides critical auditability and transparency. Users can explicitly trace who made changes to permissions and when.

### 2. Activity UI Tree Component
**What we did:**
- Built the `DocumentActivityTree` component utilizing Shadcn's `Sheet` for a slide-out drawer experience.
- Implemented a mathematically precise, continuous vertical timeline (`absolute w-0.5 z-0`) that connects user avatars end-to-end flawlessly without visual disconnects, replicating the GitHub-style timeline UI.
- Integrated conditional layout tags (like the green `Recent` badge for the newest event and the blue `Created` badge tied to the `document_created` event) localized intelligently via CSS Flexbox `justify-between`.
- Hooked the component into a new server action `getDocumentActivity` that aggregates events, joining the `public.users` table for metadata extraction via our `user-utils.ts` utilities.
- Placed the trigger natively into the `DocumentHeader` via a new History icon.

**Why:**
- Providing a visual, scrollable audit log elevates the app from a basic editor into an enterprise-ready collaboration tool. Ensuring the design is pixel-perfect (with no visual disconnects in the tree branches) maintains the premium standard established throughout the project.

---

## Step 40: Advanced Session & Access Management (2026-06-25)

We implemented advanced user profile management focusing on active sessions and document invitations.

### 1. Two-Step Invite Revocation
**What we did:**
- Implemented a dual-action system for revoking invites: first `UPDATE` the invite to `status = 'rejected'` to force a full payload broadcast containing the invite ID over Supabase Realtime, then immediately `DELETE` the row.

**Why:**
- Supabase Realtime does not forward the row payload on a `DELETE` event. Without the ID, the client-side UI cannot filter out the revoked invite instantaneously. This two-step mutation ensures the UI updates instantly without requiring a full-page reload.

### 2. Sessions Settings Tab
**What we did:**
- Created a `sessions-settings-tab.tsx` interface to manage active authenticated sessions.
- Allows users to securely view and revoke their active login sessions across devices.

**Why:**
- Provides essential account security and visibility, crucial for enterprise collaboration tools.

---

## Step 41: SWR Caching & Realtime WebSocket Architecture (2026-06-25)

We entirely eliminated background network polling and migrated the application to a highly optimized, event-driven Cache-First architecture.

### 1. The Migration to SWR (`useSWRInfinite`)
**What we did:**
- Refactored the Inbox list, Document Activity log, and Document Settings list away from standard React `useEffect` + local state fetching.
- Integrated `swr` (Stale-While-Revalidate) using the `useSWRInfinite` hook to handle cursor/page-based infinite scrolling natively.
- Passed array-based keys (e.g., `['activity', documentId, pageIndex]`) into `getKey` to strictly identify cache boundaries.

**How SWR Operates & Why We Chose It:**
- SWR creates a centralized global cache keyed by the exact endpoint and parameters. 
- **Initialization:** When a component mounts, SWR checks its memory cache. If data exists, it renders instantly (Zero-UI jitter). 
- **Operation:** By default, it then silently revalidates against the server to check for freshness. However, we locked this down explicitly (`revalidateOnFocus: false`, `revalidateIfStale: false`) to completely freeze background HTTP requests.
- **Why SWR vs React Query/Redux:** SWR is exceptionally lightweight, tightly integrates with Next.js App Router patterns, and handles complex infinite pagination states seamlessly out-of-the-box compared to building custom `useEffect` dependency arrays which are prone to race conditions and memory leaks.

### 2. Strict Realtime WebSockets
**What we did:**
- Created dedicated invisible React listener components (e.g., `DocumentActivityRealtimeListener`, `DocumentListRealtimeListener`, `InboxRealtimeListener`).
- These components utilize `@supabase/supabase-js` to open persistent `channel` subscriptions to the `postgres_changes` events for specific tables (`document_activity`, `document_members`, `documents`, `invites`).
- Bound the Realtime payload directly to SWR's `mutate()` function.

**Why:**
- This achieves the ultimate "Silent Network Tab". The application never wastes resources asking the database "did anything change?" via HTTP polling. Instead, it relies 100% on its instant SWR cache, and only executes a network fetch when Supabase explicitly pushes a WebSocket event confirming a database mutation occurred (e.g., when a user joins, leaves, or updates a role).

---

## Step 42: Inbox Notification & Read-State Synchronization (2026-06-26)

We implemented a robust, cookie-based architecture to manage Inbox read states and dynamic visual highlights for new notifications, replacing unreliable local state.

### 1. The `last_inbox_read_at` Cookie Pattern
**What we did:**
- Migrated the Inbox read-state tracking from client-side state/localStorage to a secure, server-accessible cookie (`last_inbox_read_at`).
- Refactored the `getUnreadCount.action.ts` server action to purely calculate unread items by comparing the invite's `created_at` timestamp against this cookie.
- Implemented `markInboxAsReadAction` to update this cookie whenever the user explicitly opens the Inbox list.

**Why:**
- Avoids complex database migrations (no new `is_read` column or pivot tables needed). The cookie acts as a 'time capsule', ensuring the unread count displayed globally in the Dashboard header stays perfectly in sync with the user's actual Inbox visits across all browser tabs.

### 2. Strict Mode Double-Mount Safety & Visual Highlights
**What we did:**
- Added a distinct `bg-indigo-50` (light) / `bg-indigo-950/60` (dark) background highlight to unread Inbox items to clearly differentiate them from older history.
- Protected the `markInboxAsReadAction` invocation inside `inbox-client-list.tsx` using a `useRef` initialized guard.

**Why:**
- React Strict Mode intentionally double-mounts components in development. Without the `useRef` guard, the Inbox would immediately mark itself as read twice before the user could even perceive the UI, instantly wiping out the "New" highlight on unread items. The guard ensures the cookie update is only dispatched once, preserving the visual highlight for the duration of the user's session in the Inbox.

### 3. Preserving Historical Audit Trails
**What we did:**
- Modified `remove-member.action.ts` and `update-member-role.action.ts` to perform `UPDATE status = 'accepted'/'rejected'` on related role invitations rather than executing a hard `DELETE`.

**Why:**
- Deleting invite rows outright destroys the audit trail. By explicitly rejecting or accepting them instead, the history remains visible in the user's Inbox UI, allowing them to see a permanent log of all access grants and revocations.
