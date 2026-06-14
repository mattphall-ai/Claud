# Spelling Bee

A clone of the New York Times **Spelling Bee** word game, with the ability to
generate a brand-new puzzle whenever you want.

## How to play

- Seven letters are arranged in a honeycomb, with one **center letter**
  (yellow) that every word must use.
- Make words of **4 letters or more**. Letters may be reused as often as you
  like.
- Each word must be in the dictionary. The center letter is required in every
  word.
- A word that uses **all seven letters** is a **pangram** — every puzzle has at
  least one.

### Scoring & ranks

- 4-letter words are worth **1 point**.
- Longer words score **1 point per letter** (a 6-letter word = 6 points).
- Pangrams earn a **+7 bonus** on top of their length.
- Your rank climbs from *Beginner* up to *Genius* as a percentage of the
  puzzle's maximum score, matching the NYT thresholds. Find every word to
  become **Queen Bee**.

### Controls

- **Type** on your keyboard, or **tap** the letters in the hive.
- **Enter** (or the Return key) submits a word.
- **Delete** (or Backspace) removes the last letter.
- **Shuffle** (⟳) rearranges the outer letters.

## Making new puzzles

Click **New Puzzle** at the top. You can either:

1. **Random** – generate a fresh puzzle of the usual difficulty (guaranteed to
   have at least one pangram). Hit *Regenerate* until you find one you like,
   then *Start*.
2. **Custom letters** – enter your own 7 distinct letters and choose the center
   letter. The app computes all valid words, pangrams, and the score for you.

Your current puzzle and the words you've found are saved in the browser
(`localStorage`), so you can close the tab and pick up where you left off.

## How puzzles are validated

The game bundles a curated list of ~35,000 common English words (length 4+,
proper nouns and offensive words filtered out). Puzzles are generated from
words that contain exactly seven distinct letters and no "s" (an NYT
convention), which guarantees a solvable puzzle with at least one pangram.

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```
