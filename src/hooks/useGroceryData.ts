import { useMemo } from "react";
import { useLocalStorage } from "./useLocalStorage";
import {
  CATEGORY_ORDER,
  DEFAULT_GROCERIES,
  slugify,
} from "../data/defaultGroceries";
import { findMatchingItem, guessCategory } from "../utils/recipeImport";
import type { GroceryItem, WeeklyEntry } from "../types";

const MASTER_LIST_KEY = "grocery-app:master-list";
const WEEKLY_LIST_KEY = "grocery-app:weekly-list";

export function useGroceryData() {
  const [masterList, setMasterList] = useLocalStorage<GroceryItem[]>(
    MASTER_LIST_KEY,
    DEFAULT_GROCERIES,
  );
  const [weeklyList, setWeeklyList] = useLocalStorage<WeeklyEntry[]>(
    WEEKLY_LIST_KEY,
    [],
  );

  const categories = useMemo(() => {
    const present = new Set(masterList.map((item) => item.category));
    const ordered = CATEGORY_ORDER.filter((c) => present.has(c));
    const extra = [...present]
      .filter((c) => !(CATEGORY_ORDER as readonly string[]).includes(c))
      .sort((a, b) => a.localeCompare(b));
    return [...ordered, ...extra];
  }, [masterList]);

  const itemsById = useMemo(() => {
    const map = new Map<string, GroceryItem>();
    for (const item of masterList) map.set(item.id, item);
    return map;
  }, [masterList]);

  const weeklyItemIds = useMemo(
    () => new Set(weeklyList.map((entry) => entry.itemId)),
    [weeklyList],
  );

  function addToWeekly(itemId: string) {
    setWeeklyList((prev) =>
      prev.some((entry) => entry.itemId === itemId)
        ? prev
        : [...prev, { itemId, checked: false }],
    );
  }

  function removeFromWeekly(itemId: string) {
    setWeeklyList((prev) => prev.filter((entry) => entry.itemId !== itemId));
  }

  function toggleWeekly(itemId: string) {
    setWeeklyList((prev) =>
      prev.some((entry) => entry.itemId === itemId)
        ? prev.filter((entry) => entry.itemId !== itemId)
        : [...prev, { itemId, checked: false }],
    );
  }

  function toggleChecked(itemId: string) {
    setWeeklyList((prev) =>
      prev.map((entry) =>
        entry.itemId === itemId
          ? { ...entry, checked: !entry.checked }
          : entry,
      ),
    );
  }

  function addCustomItem(name: string, category: string) {
    const trimmedName = name.trim();
    const trimmedCategory = category.trim();
    if (!trimmedName || !trimmedCategory) return;

    let id = slugify(trimmedCategory, trimmedName);
    setMasterList((prev) => {
      if (prev.some((item) => item.id === id)) {
        id = `${id}__${Date.now()}`;
      }
      return [...prev, { id, name: trimmedName, category: trimmedCategory }];
    });
  }

  function deleteItem(itemId: string) {
    setMasterList((prev) => prev.filter((item) => item.id !== itemId));
    setWeeklyList((prev) => prev.filter((entry) => entry.itemId !== itemId));
  }

  function updateItemCategory(itemId: string, category: string) {
    const trimmed = category.trim();
    if (!trimmed) return;
    setMasterList((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, category: trimmed } : item)),
    );
  }

  function clearChecked() {
    setWeeklyList((prev) => prev.filter((entry) => !entry.checked));
  }

  function clearAllWeekly() {
    setWeeklyList([]);
  }

  function importIngredients(names: string[]) {
    const cleanNames = names.map((n) => n.trim()).filter(Boolean);
    if (cleanNames.length === 0) return;

    const newItems: GroceryItem[] = [];
    const idsToAdd: string[] = [];
    const usedIds = new Set(masterList.map((item) => item.id));

    for (const name of cleanNames) {
      const match =
        findMatchingItem(name, masterList) ?? findMatchingItem(name, newItems);
      if (match) {
        idsToAdd.push(match.id);
        continue;
      }

      const category = guessCategory(name);
      let id = slugify(category, name);
      if (usedIds.has(id)) id = `${id}__${Date.now()}_${newItems.length}`;
      usedIds.add(id);

      const item: GroceryItem = { id, name, category };
      newItems.push(item);
      idsToAdd.push(id);
    }

    if (newItems.length > 0) {
      setMasterList((prev) => [...prev, ...newItems]);
    }

    setWeeklyList((prev) => {
      const existingIds = new Set(prev.map((entry) => entry.itemId));
      const additions = [...new Set(idsToAdd)]
        .filter((id) => !existingIds.has(id))
        .map((id) => ({ itemId: id, checked: false }));
      return additions.length > 0 ? [...prev, ...additions] : prev;
    });
  }

  return {
    masterList,
    weeklyList,
    categories,
    itemsById,
    weeklyItemIds,
    addToWeekly,
    removeFromWeekly,
    toggleWeekly,
    toggleChecked,
    addCustomItem,
    deleteItem,
    updateItemCategory,
    clearChecked,
    clearAllWeekly,
    importIngredients,
  };
}
