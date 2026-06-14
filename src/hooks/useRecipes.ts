import { useLocalStorage } from "./useLocalStorage";
import type { ChatMessage, Recipe } from "../types";

const RECIPES_KEY = "grocery-app:recipes";

export function useRecipes() {
  const [recipes, setRecipes] = useLocalStorage<Recipe[]>(RECIPES_KEY, []);

  function addRecipe(recipe: Omit<Recipe, "id" | "addedAt" | "chatHistory">): Recipe {
    const newRecipe: Recipe = {
      ...recipe,
      id: `recipe_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      addedAt: Date.now(),
      chatHistory: [],
    };
    setRecipes((prev) => [newRecipe, ...prev]);
    return newRecipe;
  }

  function deleteRecipe(recipeId: string) {
    setRecipes((prev) => prev.filter((r) => r.id !== recipeId));
  }

  function setChatHistory(recipeId: string, messages: ChatMessage[]) {
    setRecipes((prev) =>
      prev.map((r) => (r.id === recipeId ? { ...r, chatHistory: messages } : r)),
    );
  }

  return { recipes, addRecipe, deleteRecipe, setChatHistory };
}
