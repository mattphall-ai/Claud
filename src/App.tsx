import { useState } from "react";
import "./App.css";
import { useGroceryData } from "./hooks/useGroceryData";
import { useRecipes } from "./hooks/useRecipes";
import { MasterList } from "./components/MasterList";
import { WeeklyList } from "./components/WeeklyList";
import { RecipesView } from "./components/RecipesView";

type Tab = "master" | "weekly" | "recipes";

function App() {
  const [tab, setTab] = useState<Tab>("master");
  const data = useGroceryData();
  const recipes = useRecipes();

  return (
    <div className="app">
      <header className="app-header">
        <h1>🛒 Grocery List</h1>
      </header>

      <nav className="tab-bar">
        <button
          type="button"
          className={`tab-btn ${tab === "master" ? "active" : ""}`}
          onClick={() => setTab("master")}
        >
          Master List
        </button>
        <button
          type="button"
          className={`tab-btn ${tab === "weekly" ? "active" : ""}`}
          onClick={() => setTab("weekly")}
        >
          This Week's List
          {data.weeklyList.length > 0 && (
            <span className="badge">{data.weeklyList.length}</span>
          )}
        </button>
        <button
          type="button"
          className={`tab-btn ${tab === "recipes" ? "active" : ""}`}
          onClick={() => setTab("recipes")}
        >
          Recipes
          {recipes.recipes.length > 0 && (
            <span className="badge">{recipes.recipes.length}</span>
          )}
        </button>
      </nav>

      <main className="app-main">
        {tab === "master" ? (
          <MasterList
            categories={data.categories}
            masterList={data.masterList}
            weeklyItemIds={data.weeklyItemIds}
            onToggleWeekly={data.toggleWeekly}
            onAddCustomItem={data.addCustomItem}
            onDeleteItem={data.deleteItem}
          />
        ) : tab === "weekly" ? (
          <WeeklyList
            weeklyList={data.weeklyList}
            itemsById={data.itemsById}
            categories={data.categories}
            onToggleChecked={data.toggleChecked}
            onRemove={data.removeFromWeekly}
            onClearChecked={data.clearChecked}
            onClearAll={data.clearAllWeekly}
            onImportIngredients={data.importIngredients}
          />
        ) : (
          <RecipesView
            recipes={recipes.recipes}
            onAddRecipe={recipes.addRecipe}
            onDeleteRecipe={recipes.deleteRecipe}
            onUpdateChat={recipes.setChatHistory}
            onImportIngredients={data.importIngredients}
          />
        )}
      </main>
    </div>
  );
}

export default App;
