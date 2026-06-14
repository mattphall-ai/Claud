import { useMemo, useState } from "react";
import type { GroceryItem } from "../types";
import { AddItemForm } from "./AddItemForm";

interface MasterListProps {
  categories: string[];
  masterList: GroceryItem[];
  weeklyItemIds: Set<string>;
  onToggleWeekly: (itemId: string) => void;
  onAddCustomItem: (name: string, category: string) => void;
  onDeleteItem: (itemId: string) => void;
}

export function MasterList({
  categories,
  masterList,
  weeklyItemIds,
  onToggleWeekly,
  onAddCustomItem,
  onDeleteItem,
}: MasterListProps) {
  const [search, setSearch] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);

  const itemsByCategory = useMemo(() => {
    const map = new Map<string, GroceryItem[]>();
    const query = search.trim().toLowerCase();
    for (const item of masterList) {
      if (query && !item.name.toLowerCase().includes(query)) continue;
      if (!map.has(item.category)) map.set(item.category, []);
      map.get(item.category)!.push(item);
    }
    for (const items of map.values()) {
      items.sort((a, b) => a.name.localeCompare(b.name));
    }
    return map;
  }, [masterList, search]);

  const hasResults = [...itemsByCategory.values()].some((items) => items.length > 0);

  return (
    <div className="view">
      <div className="search-bar">
        <input
          type="search"
          placeholder="Search groceries…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search master grocery list"
        />
      </div>

      {!hasResults && (
        <p className="empty-state">No items match "{search}".</p>
      )}

      {categories.map((category) => {
        const items = itemsByCategory.get(category);
        if (!items || items.length === 0) return null;
        return (
          <section key={category} className="category-section">
            <h2>{category}</h2>
            <ul className="item-list">
              {items.map((item) => {
                const selected = weeklyItemIds.has(item.id);
                return (
                  <li key={item.id} className="item-row">
                    <button
                      type="button"
                      className={`item-toggle ${selected ? "selected" : ""}`}
                      onClick={() => onToggleWeekly(item.id)}
                      aria-pressed={selected}
                    >
                      <span className="checkmark" aria-hidden="true">
                        {selected ? "✓" : "+"}
                      </span>
                      <span className="item-name">{item.name}</span>
                    </button>
                    <button
                      type="button"
                      className="delete-btn"
                      onClick={() => onDeleteItem(item.id)}
                      aria-label={`Delete ${item.name} from master list`}
                      title="Remove from master list"
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

      {showAddForm ? (
        <AddItemForm
          categories={categories}
          onAdd={(name, category) => {
            onAddCustomItem(name, category);
            setShowAddForm(false);
          }}
          onCancel={() => setShowAddForm(false)}
        />
      ) : (
        <button
          type="button"
          className="btn btn-primary add-item-btn"
          onClick={() => setShowAddForm(true)}
        >
          + Add new grocery item
        </button>
      )}
    </div>
  );
}
