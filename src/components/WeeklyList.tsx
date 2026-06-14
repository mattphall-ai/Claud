import { useMemo } from "react";
import type { GroceryItem, WeeklyEntry } from "../types";
import { ImportRecipe } from "./ImportRecipe";

interface WeeklyListProps {
  weeklyList: WeeklyEntry[];
  itemsById: Map<string, GroceryItem>;
  categories: string[];
  onToggleChecked: (itemId: string) => void;
  onRemove: (itemId: string) => void;
  onClearChecked: () => void;
  onClearAll: () => void;
  onImportIngredients: (names: string[]) => void;
}

export function WeeklyList({
  weeklyList,
  itemsById,
  categories,
  onToggleChecked,
  onRemove,
  onClearChecked,
  onClearAll,
  onImportIngredients,
}: WeeklyListProps) {
  const grouped = useMemo(() => {
    const map = new Map<string, WeeklyEntry[]>();
    for (const entry of weeklyList) {
      const item = itemsById.get(entry.itemId);
      if (!item) continue;
      if (!map.has(item.category)) map.set(item.category, []);
      map.get(item.category)!.push(entry);
    }
    for (const entries of map.values()) {
      entries.sort((a, b) => {
        const aName = itemsById.get(a.itemId)?.name ?? "";
        const bName = itemsById.get(b.itemId)?.name ?? "";
        return aName.localeCompare(bName);
      });
    }
    return map;
  }, [weeklyList, itemsById]);

  const total = weeklyList.length;
  const checkedCount = weeklyList.filter((e) => e.checked).length;

  if (total === 0) {
    return (
      <div className="view">
        <div className="empty-state">
          <p>Your list for this week is empty.</p>
          <p>Go to the Master List tab and tap items to add them here.</p>
        </div>
        <ImportRecipe onImport={onImportIngredients} />
      </div>
    );
  }

  return (
    <div className="view">
      <ImportRecipe onImport={onImportIngredients} />
      <div className="progress-bar">
        <div className="progress-text">
          {checkedCount} of {total} purchased
        </div>
        <div className="progress-track">
          <div
            className="progress-fill"
            style={{ width: `${total === 0 ? 0 : (checkedCount / total) * 100}%` }}
          />
        </div>
      </div>

      {categories.map((category) => {
        const entries = grouped.get(category);
        if (!entries || entries.length === 0) return null;
        return (
          <section key={category} className="category-section">
            <h2>{category}</h2>
            <ul className="item-list">
              {entries.map((entry) => {
                const item = itemsById.get(entry.itemId);
                if (!item) return null;
                return (
                  <li
                    key={entry.itemId}
                    className={`item-row weekly-row ${entry.checked ? "checked" : ""}`}
                  >
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={entry.checked}
                        onChange={() => onToggleChecked(entry.itemId)}
                      />
                      <span className="item-name">{item.name}</span>
                    </label>
                    <button
                      type="button"
                      className="delete-btn"
                      onClick={() => onRemove(entry.itemId)}
                      aria-label={`Remove ${item.name} from this week's list`}
                      title="Remove from this week's list"
                    >
                      ×
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}

      <div className="footer-actions">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={onClearChecked}
          disabled={checkedCount === 0}
        >
          Clear purchased
        </button>
        <button type="button" className="btn btn-danger" onClick={onClearAll}>
          Clear entire list
        </button>
      </div>
    </div>
  );
}
