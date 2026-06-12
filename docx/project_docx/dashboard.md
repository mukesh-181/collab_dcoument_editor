# Dashboard & The Editor

This document breaks down how our Dashboard and Document Editor actually work under the hood. I built this using a very modern Next.js approach called **Zero-JS Data Fetching**. It sounds fancy, but it just means we do all the heavy lifting on the server before the browser even sees the page. This makes the app incredibly fast and completely secure.

---

## 1. How We Handle Documents (The Dashboard)

When you look at the Dashboard, you're seeing two main things working together: Server Components and Server Actions.

### Fetching Documents (Server Components)
When you visit `/dashboard`, the server securely checks who you are and asks Supabase for a list of your documents. Because the server does this *before* it sends the HTML to your browser, you never see a "loading spinner" or a flash of an empty page. It just works instantly. We display these documents in a sleek, professional table-list view.

### Dashboard Scroll Behavior
The dashboard is intentionally viewport-locked. The outer dashboard shell is fixed to the visible browser window and clips overflow, so the sidebar, account header, page title, and table header stay still. If the user has enough documents to overflow the available space, only the document rows scroll. The row container uses `overscroll-contain` so wheel or trackpad gestures inside the list do not leak into a full-page scroll.

### Creating & Deleting Documents (Server Actions)
When you click the "New Document" or "Delete" button, we don't use messy API routes. Instead, we use **Server Actions** (`document.actions.ts`). 
- **Creating**: The server creates a blank "Untitled Document" in the database and immediately links your user ID to it as the `owner`. Then it instantly redirects you into the editor.
- **Deleting**: We don't actually delete the document from the database (just in case!). We do a **soft delete** by marking it as `is_deleted = true`. We also double-check that you are actually the owner before we let this happen.

---

## 2. The Editor Layout

When you open a document (`/dashboard/[docId]`), the app does one final security check. It asks the database, "Is this user actually allowed to see this specific document?" If the answer is no, it immediately kicks you back to the dashboard.

If you are allowed in, you'll see our beautiful "Pageless" editor. 

Instead of a boring white screen, I designed it to look like Google Docs. The background is a soft gray, and the editor itself looks like a crisp white A4 piece of paper floating in the center of the screen with a subtle drop shadow. As you type, the page just keeps scrolling forever, so you never have to deal with awkward page breaks splitting your paragraphs in half.

---

## 3. The Toolbar & How It Stays Synchronized

At the very top of the editor is our formatting toolbar. It has all the standard tools you'd expect: Font Family, Font Size, Text Color, Headings, Bold, Italic, and Undo/Redo.

But making a toolbar work smoothly with a rich-text editor (we use Tiptap) is actually really tricky! Here is how I solved the biggest problems to make it feel like a premium app:

### 1. Instant Reaction to Your Cursor
If you click on a word that is **Bold**, the Bold button in the toolbar needs to light up instantly. To do this, I added a "Transaction Listener". Every single time your cursor moves or you type a letter, the toolbar re-evaluates the text and updates the buttons to match perfectly.

### 2. Smart Context Tracking (Color & Font Size)
The Color Picker and the Font Size dropdown don't just guess what color or size you're using. They dynamically read the exact underlying code (the Abstract Syntax Tree) of the text you are clicking on. 
- If you click red text, the color circle instantly turns red.
- If you click a giant Heading 1, the font size dropdown realizes it's a heading and correctly displays "36px" so you always know exactly what size you are looking at.

### 3. Preventing the "Stolen Focus" Bug
Normally, if you highlight some text in an editor and then click a button in the toolbar (like a font dropdown), your browser steals the focus away from the editor and gives it to the button. This causes the editor to "forget" what you were doing! 

To fix this, I added a tiny piece of code (`e.preventDefault()`) to every single button in the toolbar. This tells the browser, "Do not take focus away from the editor." Because of this trick, you can rapidly click around the toolbar changing fonts and colors without the editor ever losing its mind.
