# CollabDoc — Project Overview

This document provides a summary of how the `collab_docx` project is built. It covers the core architecture, the flow of data, and why we made certain technical choices.

---

## 1. What We've Built So Far

We are building a real-time collaborative document editor. We've finished the foundational setup, which includes:

- **Authentication**: Users can log in using Email/Password or GitHub. We use Supabase to handle the sessions.
- **Route Protection**: We have a proxy setup that automatically redirects logged-out users away from private pages (like the dashboard) and sends them to the login page.
- **Dashboard**: A simple interface where users can view, create, and delete their documents.
- **Document Access**: We use server-side checks to make sure users can only open documents they are allowed to see.
- **Rich Text Editor**: We added a text editor using Tiptap and Tailwind's typography plugin. It features real-time collaborative cursors, an offline-resilient sync state, and a custom responsive formatting toolbar.
- **Mobile Responsiveness**: The entire application is fully responsive, utilizing Shadcn Sheets for slide-out mobile navigation and horizontally scrollable toolbars.
- **UI & Styling**: The interface is built with Tailwind CSS v4 and Shadcn UI components, including premium Skeleton loading states to prevent layout shifts.

---

## 2. Our Tech Stack

We tried to keep the technology stack as unified as possible to avoid unnecessary complexity.

- **Next.js 15 (App Router)**: We use this as our core framework. By using Server Components and Server Actions, we can securely talk to our database straight from the server without needing to build a separate backend API.
- **Supabase**: We use Supabase for both our database and authentication. Because the database handles the logins natively, it inherently knows who is making the request. This makes setting up security rules (Row Level Security) much easier than if we used a separate auth library like Auth.js.
- **Tailwind v4 & Shadcn UI**: Tailwind handles the styling. Shadcn provides basic, accessible UI components (like dropdowns and buttons) that we copy into our codebase so we can customize them exactly how we need.
- **Zod & React Hook Form**: We use these for form validation. They make sure the user inputs valid data before the browser even tries to talk to the server.

---

## 3. How the App Actually Works

### A. Logging In & Database Sync
1. When a user submits the signup form, `react-hook-form` and `zod` check the inputs locally.
2. The form submits to a Next.js Server Action (`auth.actions.ts`). 
3. The server tells Supabase to create the account and sets a secure HTTP-only cookie to keep the user logged in.
4. Behind the scenes, the database has a trigger that automatically copies the new user's public info (like their name) into our `public.users` table so we can safely show it in the app.

### B. Protecting the Pages
1. Every time a user loads a page, the request goes through our Edge Proxy (`proxy.ts`).
2. The proxy checks if the user's login token is expiring and quietly refreshes it if needed.
3. If a logged-out user tries to access a private route like `/dashboard`, the proxy intercepts the request and issues a redirect to `/login`.

### C. Preventing UI "Flashes"
To prevent the page from flashing a logged-out state before realizing the user is actually logged in, we check the authentication state on the server.
1. Our global layout and navbar ask Supabase for the user's session before sending any HTML to the browser.
2. Because the server knows the auth state immediately, it renders the correct buttons ("Go to Dashboard" vs "Log In") on the very first paint.
3. We only use client-side React components when we need interactivity, like highlighting the active document in the sidebar based on the current URL.

---

## 4. How Our Folders are Organized

We group our files by feature rather than putting everything directly into the Next.js `app/` folder.

- **`src/app/`**: This is strictly for URL routing (like `page.tsx` and `layout.tsx`).
- **`src/features/`**: This is where the actual logic lives. We have folders for `auth`, `dashboard`, and `editor`. 
  - **Single-Responsibility Actions**: Inside each feature's `actions/` folder, every server action has its own dedicated file (e.g., `login.action.ts`, `create-document.action.ts`). This ensures maximum tree-shaking and reduces bundle sizes.
  - **Granular Components**: Complex UI components (like the Editor Toolbar) are decomposed into smaller sub-components (like `history-controls.tsx`) for easier maintenance and faster compilation.
- **`src/components/ui/`**: Reusable Shadcn UI components.
- **`src/lib/constants/env.ts`**: A centralized configuration file exporting strictly-typed environment variables, so we never access `process.env` randomly throughout the app.
- **`src/lib/supabase/`**: This contains our three Supabase clients. We need three because Next.js runs code in three different places: the browser (`client.ts`), the server (`server.ts`), and the Edge network (`proxy.ts`).

By separating the URL routing from the feature logic, the codebase stays predictable and easy to manage.

---

## 5. The Rich-Text Editor

We use [Tiptap](https://tiptap.dev) to power the document editing experience.

### Editor Setup
- We wrap the editor in an `EditorProvider`.
- We built a custom `FontSize` extension from scratch because Tiptap doesn't include one by default. It applies inline pixel sizes to the text.
- We designed the editor to look like a standard document page. It's a centered, white container with a drop shadow sitting on a gray background, similar to Google Docs.

### Toolbar Behavior
Making the formatting toolbar work smoothly required a few specific setups:
1. **Transaction listener**: We force the toolbar to re-render every time the cursor moves so the dropdowns and buttons always reflect the correct formatting.
2. **Preventing focus loss**: We added `e.preventDefault()` to the toolbar buttons. This stops the browser from moving focus away from the editor when you click a button, which prevents the editor from forgetting your formatting choices.
3. **Tracking text context**: The color picker and font size dropdown dynamically read the actual attributes of the text you are clicking on (`editor.getAttributes("textStyle")`). This ensures the toolbar accurately reflects the formatting of the text currently under your cursor.

### Saving, Renaming, and Real-Time Sync (Phase 7)
We completely ripped out our initial manual "REST-style" auto-save and upgraded to an industry-standard real-time collaborative engine:
1. **Renaming**: You can click the pencil icon right in the document header to change the document name. It verifies permissions on the server before applying the new title.
2. **Real-Time WebSockets**: As you type, your browser connects to a standalone Node.js server (`/hocuspocus-server`) via WebSockets. It uses a mathematical algorithm called a CRDT (Conflict-free Replicated Data Type) powered by Yjs. This mathematically guarantees that if 10 people type on the same line at the exact same millisecond, the document structure will never corrupt and will elegantly merge everyone's cursors and text.
3. **Database Persistence**: Relying purely on WebSocket memory is dangerous. Our Hocuspocus backend uses specific "hooks" to constantly listen to the live state and silently compress it into a base64 binary string. Every few seconds, it safely `upserts` this binary string straight into our `document_content_state` Supabase table. If the WebSocket server ever crashes, no one loses a single keystroke.

### UX Polish & Edge Cases (Phase 9)
To ensure the editor feels production-ready, we implemented comprehensive UX safeguards:
1. **Offline Resilience**: If the user's internet drops, an `OfflineBanner` subtly warns them. Because Yjs handles offline edits natively, the user can continue typing. The moment the connection is restored, Yjs mathematically merges their offline changes with the server.
2. **Live Presence Indicators**: By tapping into the Hocuspocus `onAwarenessUpdate` hook, we extract exactly who is actively viewing the document and render their avatars in a cluster in the document header, letting users know exactly who they are collaborating with.
3. **Responsive Mobile Layouts**: The editor padding and toolbars adapt dynamically to small screens, utilizing horizontal scrolling rather than breaking the layout, ensuring seamless mobile editing. We also wrap the dashboard sidebar in a slide-out drawer (`Sheet`) so mobile users retain full navigational control.

---

## 6. Sharing & Permissions

We've built a robust sharing system that allows users to invite others to their documents securely.

### One-Time Invite Links
Instead of generating a generic link that anyone can copy and paste forever, our system uses **one-time use tokens**. 
1. When you click the "Invite" button, the server generates a unique, random string (a UUID) and saves it in the database as a `pending` invite.
2. When someone clicks that link, the server checks the database. If the token is still `pending`, it adds them to the document and instantly marks the token as `accepted`. 
3. If anyone else tries to use that exact same link later, the system will reject them. This ensures you always know exactly who is joining your document.

### Flawless Onboarding
If you send an invite link to a friend who doesn't even have an account yet, our Edge Proxy handles it perfectly. The proxy sees they are logged out, remembers the exact invite token they were trying to use, redirects them to the signup page, and then automatically bounces them back to process the invite the moment they finish creating their account. They never lose the link.

### Intermediate Invite Screen
Before instantly dropping a user into a document, we show an intermediate invitation card (`/dashboard/invite`). This card securely fetches the document title, the inviter's name, and the specific role granted by the link. It gives the user a clear "Accept" or "Cancel" choice, and its layout is seamlessly integrated into the main dashboard shell (sidebar and top navbar included) for a cohesive experience.

### Member Visibility
In the document header, all active members are displayed as a cluster of overlapping avatars. To see exactly who has access, you can click anywhere on the avatar group. This opens a unified, scrollable list showing each member's profile picture, full name, email address, and their specific role (Owner, Editor, or Viewer).

### Strict Viewer Mode
We enforce permissions strictly based on your role (`owner`, `editor`, or `viewer`).
When a `viewer` opens a document:
1. The app detects their role on the server before the page even finishes loading.
2. The "Invite" button completely disappears from their header, so they can't invite others. They also lose the ability to rename the document.
3. We send a strict `editable=false` command deep into the Tiptap editor engine. This natively disables all keyboard inputs and prevents them from accidentally modifying the local content.
4. Finally, we completely hide the formatting toolbar and the link editing popups. This gives them a clean, distraction-free reading experience that feels like viewing a published article rather than an active editing app.
