# Grocery List

A simple grocery shopping app with two views:

- **Master List** – every grocery item you might buy, organized by category.
  Tap an item to add it to this week's list (tap again to remove it). You can
  also add your own custom items and categories, or delete items you never buy.
- **This Week's List** – the items you picked, grouped by category. Check items
  off as you shop, see your progress, and clear purchased or all items when
  you're done. You can also paste a recipe URL (or paste an ingredient list
  directly) to pull ingredients straight into this week's list — matching
  items are reused from the master list, and new items get added with a
  best-guess category.

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
