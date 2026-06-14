import { useState, type FormEvent } from "react";
import {
  cleanIngredientName,
  extractIngredients,
  fetchRecipeHtml,
} from "../utils/recipeImport";

interface ImportRecipeProps {
  onImport: (names: string[]) => void;
}

interface ReviewRow {
  text: string;
  checked: boolean;
}

export function ImportRecipe({ onImport }: ImportRecipeProps) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [pasted, setPasted] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<ReviewRow[] | null>(null);

  function reset() {
    setUrl("");
    setPasted("");
    setError(null);
    setRows(null);
    setLoading(false);
  }

  function close() {
    setOpen(false);
    reset();
  }

  async function handleFetch(e: FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const html = await fetchRecipeHtml(url.trim());
      const ingredients = extractIngredients(html);
      if (ingredients.length === 0) {
        setError(
          "Couldn't find an ingredient list on that page. For videos, this works best when the creator includes a written ingredient list in the description or caption. Try pasting the ingredients below instead.",
        );
        return;
      }
      setRows(
        ingredients.map((raw) => ({
          text: cleanIngredientName(raw),
          checked: true,
        })),
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong loading that page.",
      );
    } finally {
      setLoading(false);
    }
  }

  function handleParsePasted(e: FormEvent) {
    e.preventDefault();
    const lines = pasted
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
    if (lines.length === 0) return;
    setError(null);
    setRows(lines.map((line) => ({ text: cleanIngredientName(line), checked: true })));
  }

  function updateRow(index: number, updates: Partial<ReviewRow>) {
    setRows((prev) =>
      prev ? prev.map((row, i) => (i === index ? { ...row, ...updates } : row)) : prev,
    );
  }

  function removeRow(index: number) {
    setRows((prev) => (prev ? prev.filter((_, i) => i !== index) : prev));
  }

  function handleAdd() {
    if (!rows) return;
    const names = rows.filter((row) => row.checked).map((row) => row.text);
    onImport(names);
    close();
  }

  if (!open) {
    return (
      <button
        type="button"
        className="btn btn-primary add-item-btn"
        onClick={() => setOpen(true)}
      >
        + Add ingredients from a recipe or video
      </button>
    );
  }

  return (
    <div className="add-item-form import-recipe-form">
      <h3>Import ingredients from a recipe or video</h3>

      {!rows && (
        <>
          <form onSubmit={handleFetch}>
            <label className="field">
              <span>Recipe or video link</span>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Recipe page, or YouTube / Instagram / TikTok link"
                inputMode="url"
              />
            </label>
            <div className="form-actions">
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? "Fetching…" : "Fetch ingredients"}
              </button>
            </div>
          </form>

          {error && <p className="form-error">{error}</p>}

          <div className="form-divider">or paste ingredients (one per line)</div>

          <form onSubmit={handleParsePasted}>
            <label className="field">
              <span>Ingredients</span>
              <textarea
                value={pasted}
                onChange={(e) => setPasted(e.target.value)}
                placeholder={"2 cups flour\n1 tsp salt\n3 eggs"}
                rows={5}
              />
            </label>
            <div className="form-actions">
              <button type="button" className="btn btn-secondary" onClick={close}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Parse ingredients
              </button>
            </div>
          </form>
        </>
      )}

      {rows && (
        <>
          <p className="form-hint">
            Review the ingredients below, uncheck anything you don't need, then add
            them to this week's list.
          </p>
          <ul className="ingredient-review-list">
            {rows.map((row, index) => (
              <li key={index} className="ingredient-review-row">
                <input
                  type="checkbox"
                  checked={row.checked}
                  onChange={(e) => updateRow(index, { checked: e.target.checked })}
                />
                <input
                  type="text"
                  className="ingredient-review-input"
                  value={row.text}
                  onChange={(e) => updateRow(index, { text: e.target.value })}
                />
                <button
                  type="button"
                  className="delete-btn"
                  onClick={() => removeRow(index)}
                  aria-label={`Remove ${row.text}`}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={close}>
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleAdd}
              disabled={!rows.some((row) => row.checked)}
            >
              Add to this week's list
            </button>
          </div>
        </>
      )}
    </div>
  );
}
