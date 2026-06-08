# How Authentication Works in CollabDoc

If you're wondering how users log in, stay logged in, and get kicked out when they shouldn't be here, this is the document for you. 

We keep things incredibly simple and secure by using **Supabase Native Auth**. This means we don't mess around with third-party tools like Auth.js or heavy database managers like Prisma. Supabase handles everything natively, which makes our app faster and our code much cleaner.

---

## The "Three Clients" Rule

Because we are using Next.js, our code actually runs in three entirely different places. To handle authentication properly, we had to create three different Supabase "clients" so that our app knows how to read cookies no matter where the code is running.

1. **The Browser Client (`client.ts`)**: 
   Whenever you see `'use client'` at the top of a file, we use this client. It knows how to grab the user's session straight from the browser's `document.cookie`. When a user clicks a button to fetch data, this client automatically attaches their hidden session token to the request.

2. **The Server Client (`server.ts`)**: 
   This is for our Server Components and Server Actions. Since the server doesn't have a browser, it can't just read `document.cookie`. Instead, this client digs into the incoming HTTP headers (using `next/headers`) to find the user's cookie. This is how we securely check who the user is before we even send the HTML to their screen.

3. **The Edge Proxy (`proxy.ts`)**: 
   This is our invisible gatekeeper. It runs on the Edge network before *every single page load*. Its main job is to check if the user's login session has expired. If it has, it quietly uses a hidden "Refresh Token" to get a brand new session and attaches it to the response. This means our users never get randomly logged out while typing a document!

---

## The User Journey: Step-by-Step

### 1. The Bouncer (Route Protection)
Imagine our `proxy.ts` file as a bouncer standing at the door. If someone tries to visit a private page (like `/dashboard`) but they aren't logged in, the bouncer instantly redirects them to `/login`. But it’s smart—it remembers where they were trying to go! It adds a little note to the URL (like `?next=/dashboard`), so once they finally log in, we can send them exactly where they wanted to be.

### 2. Logging In & Signing Up
When a user types their email and password:
1. We check their input instantly on the browser using `react-hook-form` and `zod` to make sure they didn't do something silly (like typing a 2-letter password).
2. If it looks good, we send the data to a secure **Server Action**. 
3. The server talks directly to Supabase to log them in or create their account. 
4. If it fails, the server sends back an error message and we show a nice little toast pop-up. If it succeeds, the server locks in their secure cookie and redirects them to the dashboard.

### 3. Login with GitHub
If a user clicks the "Login with GitHub" button, our browser client sends them over to GitHub's website. Once they approve the login, GitHub sends them back to our special `/auth/callback` page with a secret code. Our server quickly swaps that temporary code for a permanent, secure session cookie, and then welcomes them into the app.

### 4. Logging Out
When the user clicks "Sign Out", we trigger a server action that tells Supabase to destroy their session everywhere. We delete their cookies, clear their data, and kick them back to the login screen.

---

## Why does this matter for the rest of the app?
- **Real-time Editing**: When we connect our real-time editor (Yjs), we will pass this exact same authentication token to the WebSocket server so it knows exactly who is typing.
- **Data Security**: Because Supabase handles the auth, our database naturally knows who is asking for documents. If user A asks for user B's private document, the database just says "No," thanks to Row Level Security (RLS).
