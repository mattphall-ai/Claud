import type { Puzzle } from "../types";
import { WORDS, PANGRAM_SEEDS } from "./words";

/** Score for a single valid word, matching NYT Spelling Bee rules. */
export function scoreWord(word: string, isPangram: boolean): number {
  if (word.length === 4) return 1; // four-letter words are always 1 point
  return word.length + (isPangram ? 7 : 0); // 1 pt/letter, +7 bonus for pangrams
}

/** True if `word` can be built from the seven letters and uses the center. */
export function isAnswer(
  word: string,
  letterSet: Set<string>,
  center: string,
): boolean {
  if (word.length < 4) return false;
  if (!word.includes(center)) return false;
  for (const ch of word) {
    if (!letterSet.has(ch)) return false;
  }
  return true;
}

/** Rank tiers as cumulative percentages of the maximum score (NYT values). */
export const RANKS: { name: string; pct: number }[] = [
  { name: "Beginner", pct: 0 },
  { name: "Good Start", pct: 2 },
  { name: "Moving Up", pct: 5 },
  { name: "Good", pct: 8 },
  { name: "Solid", pct: 15 },
  { name: "Nice", pct: 25 },
  { name: "Great", pct: 40 },
  { name: "Amazing", pct: 50 },
  { name: "Genius", pct: 70 },
];

/** Point threshold required to reach each rank for a given puzzle. */
export function rankThresholds(maxScore: number): number[] {
  return RANKS.map((r) => Math.round((r.pct / 100) * maxScore));
}

export interface RankInfo {
  index: number;
  name: string;
  /** 0..1 progress toward the next rank (1 at Genius). */
  toNext: number;
  isQueenBee: boolean;
}

export function getRank(score: number, maxScore: number, foundAll: boolean): RankInfo {
  const thresholds = rankThresholds(maxScore);
  let index = 0;
  for (let i = 0; i < thresholds.length; i++) {
    if (score >= thresholds[i]) index = i;
  }
  const atTop = index >= RANKS.length - 1;
  let toNext = 1;
  if (!atTop) {
    const cur = thresholds[index];
    const next = thresholds[index + 1];
    toNext = next > cur ? (score - cur) / (next - cur) : 1;
  }
  return {
    index,
    name: RANKS[index].name,
    toNext: Math.max(0, Math.min(1, toNext)),
    isQueenBee: foundAll,
  };
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Build the full puzzle (answers, pangrams, score) for a fixed letter set. */
export function buildPuzzle(letters: string[], center: string): Puzzle {
  const lower = letters.map((l) => l.toLowerCase());
  const c = center.toLowerCase();
  const letterSet = new Set(lower);
  const full = lower.length === 7 ? letterSet : null;

  const answers: string[] = [];
  const pangrams: string[] = [];
  let maxScore = 0;
  for (const word of WORDS) {
    if (!isAnswer(word, letterSet, c)) continue;
    const isPangram = full !== null && new Set(word).size === full.size;
    answers.push(word);
    if (isPangram) pangrams.push(word);
    maxScore += scoreWord(word, isPangram);
  }
  answers.sort();
  pangrams.sort();

  return {
    letters: lower,
    center: c,
    outer: lower.filter((l) => l !== c),
    answers,
    pangrams,
    maxScore,
    createdAt: Date.now(),
  };
}

export interface GenerateOptions {
  minAnswers?: number;
  maxAnswers?: number;
}

/**
 * Generate a fresh random puzzle of roughly NYT difficulty: seven letters
 * (guaranteed at least one pangram, no "s") with a sensible number of answers.
 */
export function generatePuzzle(opts: GenerateOptions = {}): Puzzle {
  const minAnswers = opts.minAnswers ?? 20;
  const maxAnswers = opts.maxAnswers ?? 65;

  let fallback: Puzzle | null = null;
  for (let attempt = 0; attempt < 400; attempt++) {
    const seed = PANGRAM_SEEDS[Math.floor(Math.random() * PANGRAM_SEEDS.length)];
    const letters = Array.from(new Set(seed)); // exactly 7 unique letters
    const center = letters[Math.floor(Math.random() * letters.length)];
    const puzzle = buildPuzzle(letters, center);

    if (puzzle.pangrams.length === 0) continue;
    const n = puzzle.answers.length;
    if (n >= minAnswers && n <= maxAnswers) {
      puzzle.outer = shuffle(puzzle.outer);
      return puzzle;
    }
    // Remember a plausible near-miss in case the window is never hit.
    if (n >= 12 && (!fallback || Math.abs(n - 40) < Math.abs(fallback.answers.length - 40))) {
      fallback = puzzle;
    }
  }

  const result = fallback ?? buildPuzzle(["a", "e", "g", "l", "n", "r", "t"], "g");
  result.outer = shuffle(result.outer);
  return result;
}
