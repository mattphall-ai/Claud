import { useState } from "react";
import type { ChatMessage, Recipe } from "../types";
import { cleanIngredientName } from "../utils/recipeImport";
import { RecipeChat } from "./RecipeChat";

interface RecipeDetailProps {
  recipe: Recipe;
  onBack: () => void;
  onDelete: () => void;
  onImportIngredients: (names: string[]) => void;
  onUpdateChat: (messages: ChatMessage[]) => void;
}

export function RecipeDetail({
  recipe,
  onBack,
  onDelete,
  onImportIngredients,
  onUpdateChat,
}: RecipeDetailProps) {
  const [checked, setChecked] = useState<boolean[]>(() => recipe.ingredients.map(() => true));

  function toggle(index: number) {
    setChecked((prev) => prev.map((c, i) => (i === index ? !c : c)));
  }

  function handleAddToWeekly() {
    const names = recipe.ingredients
      .filter((_, i) => checked[i])
      .map((raw) => cleanIngredientName(raw));
    if (names.length === 0) return;
    onImportIngredients(names);
  }

  return (
    <div className="view recipe-detail">
      <div className="recipe-detail-header">
        <button type="button" className="btn btn-secondary" onClick={onBack}>
          ← Back
        </button>
        <button type="button" className="btn btn-danger" onClick={onDelete}>
          Delete recipe
        </button>
      </div>

      {recipe.image && <img src={recipe.image} alt="" className="recipe-image" />}

      <h2>{recipe.name}</h2>
      {recipe.sourceUrl && (
        <a
          href={recipe.sourceUrl}
          target="_blank"
          rel="noreferrer"
          className="recipe-source-link"
        >
          View original recipe
        </a>
      )}

      {recipe.ingredients.length > 0 && (
        <section className="category-section">
          <h2>Ingredients</h2>
          <ul className="ingredient-review-list">
            {recipe.ingredients.map((ingredient, i) => (
              <li key={i} className="ingredient-review-row">
                <input
                  type="checkbox"
                  checked={checked[i]}
                  onChange={() => toggle(i)}
                />
                <span>{ingredient}</span>
              </li>
            ))}
          </ul>
          <div className="form-actions">
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleAddToWeekly}
              disabled={!checked.some(Boolean)}
            >
              Add selected to this week's list
            </button>
          </div>
        </section>
      )}

      {recipe.instructions.length > 0 && (
        <section className="category-section">
          <h2>Instructions</h2>
          <ol className="recipe-instructions">
            {recipe.instructions.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ol>
        </section>
      )}

      <RecipeChat recipe={recipe} onUpdateChat={onUpdateChat} />
    </div>
  );
}
