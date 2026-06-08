# Our Database & Architecture

If you want to know exactly how we store our data and keep everything secure, this is the document. We use **Supabase** (which is essentially a super-powered PostgreSQL database) as our absolute source of truth.

Our database is built on a tight, clean 5-table schema. Here is exactly how it all connects together in plain English.

---

## The 5-Table System

### 1. The `users` Table (Your Public Face)
**What it does:** Stores your public profile, like your full name and your avatar.
**How it works:** 
The coolest part about our app is that we use Supabase Native Auth. When you sign up, your actual email and password go straight into a hidden, hyper-secure vault called `auth.users` that our app can't even see. 

To give you a public profile, I wrote a **PostgreSQL Trigger**. Basically, the split second you sign up, the database automatically creates a mirroring row in our `public.users` table with just your basic info. Our app never has to manually write to this table, which completely eliminates data duplication bugs!

### 2. The `documents` Table
**What it does:** Stores the basic info about a document.
**How it works:** 
When you click "New Document", we insert a row here. It holds the document's `title`, a link back to your user ID (so we know you created it), and a flag called `is_deleted`. 

Why `is_deleted`? Because when you delete a document, we don't actually permanently wipe it out. We just flip `is_deleted` to `true`. This is called a "soft delete" and it saves us from accidental data loss!

### 3. The `document_members` Table (The Bouncer)
**What it does:** Acts as the VIP list for every document.
**How it works:**
This is our Access Control List. It maps a `user_id` to a `document_id`. 
If your ID is not on this list for a specific document, the database will completely block you from opening it. 

It also assigns you a role:
- **Owner**: You have full control and can delete the document.
- **Editor**: You can write and make changes.
- **Viewer**: You can only read.

### 4. The `document_content_state` Table
**What it does:** Stores the actual text you type in the editor!
**How it works:**
Because our app allows multiple people to type at the exact same time without overwriting each other, we use a special algorithm called a CRDT (Conflict-free Replicated Data Type) powered by Yjs. 

Our Next.js frontend actually *never* talks to this table directly. Instead, when you type, your browser sends the data over a live WebSocket to a separate Node.js server. That Node server is responsible for merging everyone's typing together, and every few seconds, it quietly saves the final "state" into this table so nothing is lost if the server restarts.

### 5. The `invites` Table
**What it does:** Manages those secure "Share Links" you generate.
**How it works:**
When you want to invite a friend to your document, you generate a secure link. That link gets stored in this table. When your friend clicks the link, we check if the token is still valid. If it is, we instantly add their `user_id` to the `document_members` table (The Bouncer) as an editor or viewer, and mark the invite as 'accepted' so it can't be used again.

---

## How Next.js Connects to the Database

We have three different ways of talking to the database depending on where the code is running:

1. **Browser Client**: Used when you click a button on the page. It automatically knows how to securely attach your login cookie.
2. **Server Client**: Used when the server needs to fetch your documents before drawing the screen. It carefully reads the HTTP headers to find your cookie.
3. **Edge Proxy**: Used behind the scenes to silently refresh your login token so you don't get booted out while working!
