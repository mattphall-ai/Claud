import { useEffect, useState } from "react";
import type { Puzzle } from "../types";
import { buildPuzzle, generatePuzzle } from "../game/puzzle";

interface Props {
  onClose: () => void;
  onCreate: (puzzle: Puzzle) => void;
}

export function NewPuzzleDialog({ onClose, onCreate }: Props) {
  const [mode, setMode] = useState<"random" | "custom">("random");
  const [preview, setPreview] = useState<Puzzle>(() => generatePuzzle());

  // Custom mode inputs.
  const [letters, setLetters] = useState("");
  const [center, setCenter] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const uniqueLetters = Array.from(
    new Set(letters.toLowerCase().replace(/[^a-z]/g, "")),
  );

  function buildCustom(): Puzzle | null {
    setError(null);
    if (uniqueLetters.length !== 7) {
      setError("Enter exactly 7 distinct letters (a–z).");
      return null;
    }
    const c = center.toLowerCase();
    if (!uniqueLetters.includes(c)) {
      setError("Pick a center letter from your 7 letters.");
      return null;
    }
    const p = buildPuzzle(uniqueLetters, c);
    if (p.answers.length === 0) {
      setError("That combination has no valid words. Try different letters.");
      return null;
    }
    return p;
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label="New puzzle"
        onClick={(e) => e.stopPropagation()}
      >
        <h2>New Puzzle</h2>

        <div className="tabs">
          <button
            className={mode === "random" ? "tab on" : "tab"}
            onClick={() => setMode("random")}
          >
            Random
          </button>
          <button
            className={mode === "custom" ? "tab on" : "tab"}
            onClick={() => setMode("custom")}
          >
            Custom letters
          </button>
        </div>

        {mode === "random" ? (
          <div className="mode">
            <p className="hint">
              Generates a fresh puzzle with at least one pangram, matching the
              usual difficulty.
            </p>
            <div className="preview-letters">
              {preview.letters.map((l) => (
                <span
                  key={l}
                  className={l === preview.center ? "pl center" : "pl"}
                >
                  {l.toUpperCase()}
                </span>
              ))}
            </div>
            <p className="preview-stats">
              {preview.answers.length} words · {preview.pangrams.length} pangram
              {preview.pangrams.length === 1 ? "" : "s"} · {preview.maxScore} max
              points
            </p>
            <div className="modal-actions">
              <button
                className="btn-ghost"
                onClick={() => setPreview(generatePuzzle())}
              >
                ⟳ Regenerate
              </button>
              <button className="btn primary" onClick={() => onCreate(preview)}>
                Start this puzzle
              </button>
            </div>
          </div>
        ) : (
          <div className="mode">
            <p className="hint">
              Choose your own 7 distinct letters, then pick which one must appear
              in every word.
            </p>
            <label className="field">
              <span>7 letters</span>
              <input
                value={letters}
                maxLength={20}
                placeholder="e.g. glnaert"
                onChange={(e) => {
                  setLetters(e.target.value);
                  setError(null);
                }}
                autoFocus
              />
            </label>

            {uniqueLetters.length > 0 && (
              <div className="center-pick">
                <span>Center letter:</span>
                <div className="center-options">
                  {uniqueLetters.map((l) => (
                    <button
                      key={l}
                      className={center === l ? "pl center" : "pl"}
                      onClick={() => setCenter(l)}
                    >
                      {l.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {error && <p className="error">{error}</p>}

            <div className="modal-actions">
              <button className="btn-ghost" onClick={onClose}>
                Cancel
              </button>
              <button
                className="btn primary"
                onClick={() => {
                  const p = buildCustom();
                  if (p) onCreate(p);
                }}
              >
                Create puzzle
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
