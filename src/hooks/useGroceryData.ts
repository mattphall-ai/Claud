import { useMemo } from "react";
import { useLocalStorage } from "./useLocalStorage";
import {
  CATEGORY_ORDER,
  DEFAULT_GROCERIES,
  slugify,
} from "../data/defaultGroceries";
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

  function clearChecked() {
    setWeeklyList((prev) => prev.filter((entry) => !entry.checked));
  }

  function clearAllWeekly() {
    setWeeklyList([]);
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
    clearChecked,
    clearAllWeekly,
  };
}
