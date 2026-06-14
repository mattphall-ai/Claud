export interface GroceryItem {
  id: string;
  name: string;
  category: string;
}

export interface WeeklyEntry {
  itemId: string;
  checked: boolean;
}
