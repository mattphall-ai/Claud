export interface Puzzle {
  /** The seven distinct lowercase letters in the hive. */
  letters: string[];
  /** The required center letter (one of `letters`). */
  center: string;
  /** The six non-center letters. */
  outer: string[];
  /** Every valid answer for this puzzle, sorted alphabetically. */
  answers: string[];
  /** Answers that use all seven letters. */
  pangrams: string[];
  /** Total score achievable by finding every answer. */
  maxScore: number;
  /** When this puzzle was created (ms epoch), used as a stable id. */
  createdAt: number;
}

export interface GameState {
  puzzle: Puzzle;
  found: string[];
}
