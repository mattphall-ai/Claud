import { useState, type FormEvent } from "react";
import { extractRecipeDetails, fetchRecipeHtml, type ExtractedRecipe } from "../utils/recipeImport";

interface AddRecipeFormProps {
  onAdd: (recipe: ExtractedRecipe & { sourceUrl: string }) => void;
}

export function AddRecipeForm({ onAdd }: AddRecipeFormProps) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function close() {
    setOpen(false);
    setUrl("");
    setError(null);
    setLoading(false);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = url.trim();
    if (!trimmed) return;
    setLoading(true);
    setError(null);
    try {
      const html = await fetchRecipeHtml(trimmed);
      const details = extractRecipeDetails(html);
      if (details.ingredients.length === 0 && details.instructions.length === 0) {
        setError(
          "Couldn't find a recipe on that page. Try a different link, or a page with a written ingredient list and instructions.",
        );
        return;
      }
      onAdd({ ...details, sourceUrl: trimmed });
      close();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong loading that page.",
      );
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        className="btn btn-primary add-item-btn"
        onClick={() => setOpen(true)}
      >
        + Add a recipe from a link
      </button>
    );
  }

  return (
    <form className="add-item-form" onSubmit={handleSubmit}>
      <h3>Add a recipe from a link</h3>
      <label className="field">
        <span>Recipe link</span>
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Recipe page, or YouTube / Instagram / TikTok link"
          inputMode="url"
          autoFocus
        />
      </label>
      {error && <p className="form-error">{error}</p>}
      <div className="form-actions">
        <button type="button" className="btn btn-secondary" onClick={close}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? "Fetching…" : "Add recipe"}
        </button>
      </div>
    </form>
  );
}
