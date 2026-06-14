import { useState, type FormEvent } from "react";
import {
  extractIngredientLinesFromText,
  extractInstructionLinesFromText,
  extractRecipeDetails,
  fetchRecipeHtml,
  titleFromUrl,
  type ExtractedRecipe,
} from "../utils/recipeImport";

interface AddRecipeFormProps {
  onAdd: (recipe: ExtractedRecipe & { sourceUrl: string }) => void;
}

export function AddRecipeForm({ onAdd }: AddRecipeFormProps) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [name, setName] = useState("");
  const [pasted, setPasted] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function close() {
    setOpen(false);
    setUrl("");
    setName("");
    setPasted("");
    setError(null);
    setLoading(false);
  }

  async function handleFetch(e: FormEvent) {
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
          "Couldn't find a recipe on that page. Try pasting the recipe text below instead.",
        );
        return;
      }
      onAdd({ ...details, sourceUrl: trimmed });
      close();
    } catch {
      setError(
        "Couldn't load that page automatically — some sites block automated requests. Try pasting the recipe text below instead.",
      );
    } finally {
      setLoading(false);
    }
  }

  function handleParsePasted(e: FormEvent) {
    e.preventDefault();
    if (!pasted.trim()) return;
    const ingredients = extractIngredientLinesFromText(pasted);
    const instructions = extractInstructionLinesFromText(pasted);
    if (ingredients.length === 0 && instructions.length === 0) {
      setError(
        "Couldn't find an ingredient or instruction list in that text. Make sure ingredients and instructions each have their own heading (e.g. \"Ingredients\" and \"Instructions\").",
      );
      return;
    }
    setError(null);
    const trimmedUrl = url.trim();
    const recipeName =
      name.trim() || (trimmedUrl ? titleFromUrl(trimmedUrl) : "") || "Untitled recipe";
    onAdd({ name: recipeName, ingredients, instructions, sourceUrl: trimmedUrl });
    close();
  }

  if (!open) {
    return (
      <button type="button" className="btn btn-primary add-item-btn" onClick={() => setOpen(true)}>
        + Add a recipe from a link
      </button>
    );
  }

  return (
    <div className="add-item-form import-recipe-form">
      <h3>Add a recipe from a link</h3>

      <form onSubmit={handleFetch}>
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
        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "Fetching…" : "Add from link"}
          </button>
        </div>
      </form>

      {error && <p className="form-error">{error}</p>}

      <div className="form-divider">or paste the recipe text</div>

      <form onSubmit={handleParsePasted}>
        <label className="field">
          <span>Recipe name (optional)</span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Paper Plane Cocktail"
          />
        </label>
        <label className="field">
          <span>Recipe text</span>
          <textarea
            value={pasted}
            onChange={(e) => setPasted(e.target.value)}
            placeholder={
              "Ingredients\n3/4 oz bourbon\n3/4 oz Aperol\n3/4 oz Amaro Nonino\n3/4 oz lemon juice\n\nInstructions\n1. Combine all ingredients in a shaker with ice.\n2. Shake well and strain into a chilled glass."
            }
            rows={8}
          />
        </label>
        <div className="form-actions">
          <button type="button" className="btn btn-secondary" onClick={close}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary">
            Add recipe
          </button>
        </div>
      </form>
    </div>
  );
}
