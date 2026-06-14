import raw from "../data/words.txt?raw";

/** The full curated dictionary (length >= 4, common words, no profanity). */
export const WORDS: string[] = raw
  .split("\n")
  .map((w) => w.trim().toLowerCase())
  .filter((w) => w.length >= 4);

export const WORD_SET: Set<string> = new Set(WORDS);

/**
 * Words made of exactly seven distinct letters and containing no "s".
 * These seed puzzle generation: each guarantees at least one pangram, and
 * the NYT convention is to never include "s" (it makes plurals trivial).
 */
export const PANGRAM_SEEDS: string[] = WORDS.filter(
  (w) => !w.includes("s") && new Set(w).size === 7,
);
