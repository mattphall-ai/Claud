export interface GroceryItem {
  id: string;
  name: string;
  category: string;
}

export interface WeeklyEntry {
  itemId: string;
  checked: boolean;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface Recipe {
  id: string;
  name: string;
  sourceUrl: string;
  ingredients: string[];
  instructions: string[];
  image?: string;
  addedAt: number;
  chatHistory: ChatMessage[];
}
