# Grocery List

A simple grocery shopping app with three views:

- **Master List** – every grocery item you might buy, organized by category.
  Tap an item to add it to this week's list (tap again to remove it). You can
  also add your own custom items — the category is suggested automatically
  based on the name, but you can change it — or delete items you never buy.
- **This Week's List** – the items you picked, grouped by category. Check items
  off as you shop, see your progress, and clear purchased or all items when
  you're done. You can quickly add a one-off item directly to this week's
  list (new items are also saved to the master list with a best-guess
  category for next time). You can also paste a link to a recipe page or a
  recipe video (YouTube, Instagram, TikTok) — or paste an ingredient list
  directly — to pull ingredients straight into this week's list. Matching
  items are reused from the master list (only on an exact name match), and
  new items get added with a best-guess category. Video import works by
  reading any written ingredient list in the video's description or caption.
- **Recipes** – paste a link to a recipe page or video to save it under its
  title. The app extracts the ingredient list and step-by-step instructions
  so you can read the recipe without leaving the app, pick which ingredients
  to add to this week's list, and view the original page anytime. Each saved
  recipe also has a chat panel — ask questions like "I just added the butter,
  what's next?" and get short, step-aware answers powered by Claude. Tap the
  mic to ask by voice, and enable "Speak replies" to have answers read aloud
  hands-free while you cook. Chat requires an Anthropic API key, which is
  stored only in your browser and used to call the API directly.

All data is stored locally in the browser (`localStorage`), so it works
offline and persists between visits.

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```
