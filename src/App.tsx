import { useState } from "react";
import "./App.css";
import { useGroceryData } from "./hooks/useGroceryData";
import { MasterList } from "./components/MasterList";
import { WeeklyList } from "./components/WeeklyList";

type Tab = "master" | "weekly";

function App() {
  const [tab, setTab] = useState<Tab>("master");
  const data = useGroceryData();

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
        ) : (
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
        )}
      </main>
    </div>
  );
}

export default App;
