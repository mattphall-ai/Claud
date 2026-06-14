import { useState } from "react";
import type { ChatMessage, Recipe } from "../types";
import type { ExtractedRecipe } from "../utils/recipeImport";
import { AddRecipeForm } from "./AddRecipeForm";
import { RecipeDetail } from "./RecipeDetail";

interface RecipesViewProps {
  recipes: Recipe[];
  onAddRecipe: (recipe: ExtractedRecipe & { sourceUrl: string }) => Recipe;
  onDeleteRecipe: (recipeId: string) => void;
  onUpdateChat: (recipeId: string, messages: ChatMessage[]) => void;
  onImportIngredients: (names: string[]) => void;
}

export function RecipesView({
  recipes,
  onAddRecipe,
  onDeleteRecipe,
  onUpdateChat,
  onImportIngredients,
}: RecipesViewProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = recipes.find((r) => r.id === selectedId) ?? null;

  if (selected) {
    return (
      <RecipeDetail
        recipe={selected}
        onBack={() => setSelectedId(null)}
        onDelete={() => {
          onDeleteRecipe(selected.id);
          setSelectedId(null);
        }}
        onImportIngredients={onImportIngredients}
        onUpdateChat={(messages) => onUpdateChat(selected.id, messages)}
      />
    );
  }

  return (
    <div className="view">
      <AddRecipeForm
        onAdd={(extracted) => {
          const recipe = onAddRecipe(extracted);
          setSelectedId(recipe.id);
        }}
      />

      {recipes.length === 0 ? (
        <div className="empty-state">
          <p>No recipes saved yet.</p>
          <p>Paste a recipe link above to save it here.</p>
        </div>
      ) : (
        <ul className="item-list recipe-list">
          {recipes.map((recipe) => (
            <li key={recipe.id} className="item-row recipe-row">
              <button
                type="button"
                className="item-toggle recipe-card-btn"
                onClick={() => setSelectedId(recipe.id)}
              >
                {recipe.image && <img src={recipe.image} alt="" className="recipe-thumb" />}
                <span className="item-name">{recipe.name}</span>
              </button>
              <button
                type="button"
                className="delete-btn"
                onClick={() => onDeleteRecipe(recipe.id)}
                aria-label={`Delete ${recipe.name}`}
                title="Delete recipe"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
