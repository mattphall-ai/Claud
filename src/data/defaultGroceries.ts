import type { GroceryItem } from "../types";

export const CATEGORY_ORDER = [
  "Produce",
  "Dairy & Eggs",
  "Meat & Seafood",
  "Bakery",
  "Frozen",
  "Pantry",
  "Beverages",
  "Snacks",
  "Condiments & Spices",
  "Household & Personal Care",
] as const;

export function slugify(category: string, name: string): string {
  const clean = (s: string) =>
    s
      .toLowerCase()
      .trim()
      .replace(/&/g, "and")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  return `${clean(category)}__${clean(name)}`;
}

const RAW: Record<string, string[]> = {
  Produce: [
    "Bananas",
    "Apples",
    "Oranges",
    "Strawberries",
    "Blueberries",
    "Avocados",
    "Tomatoes",
    "Lettuce",
    "Spinach",
    "Carrots",
    "Onions",
    "Potatoes",
    "Garlic",
    "Bell Peppers",
    "Cucumbers",
    "Broccoli",
    "Mushrooms",
    "Lemons",
    "Limes",
    "Celery",
  ],
  "Dairy & Eggs": [
    "Milk",
    "Eggs",
    "Butter",
    "Cheddar Cheese",
    "Mozzarella Cheese",
    "Yogurt",
    "Greek Yogurt",
    "Cream Cheese",
    "Sour Cream",
    "Heavy Cream",
  ],
  "Meat & Seafood": [
    "Chicken Breast",
    "Ground Beef",
    "Bacon",
    "Salmon",
    "Shrimp",
    "Pork Chops",
    "Ground Turkey",
    "Sausage",
    "Steak",
  ],
  Bakery: [
    "Bread",
    "Bagels",
    "Tortillas",
    "Hamburger Buns",
    "Croissants",
    "English Muffins",
  ],
  Frozen: [
    "Frozen Vegetables",
    "Frozen Pizza",
    "Ice Cream",
    "Frozen Berries",
    "Frozen Waffles",
    "Frozen Chicken Nuggets",
  ],
  Pantry: [
    "Rice",
    "Pasta",
    "Flour",
    "Sugar",
    "Olive Oil",
    "Peanut Butter",
    "Cereal",
    "Oatmeal",
    "Canned Tomatoes",
    "Canned Beans",
    "Soup",
    "Canned Tuna",
    "Pasta Sauce",
    "Honey",
  ],
  Beverages: [
    "Coffee",
    "Tea",
    "Orange Juice",
    "Soda",
    "Sparkling Water",
    "Wine",
    "Beer",
    "Almond Milk",
  ],
  Snacks: [
    "Chips",
    "Crackers",
    "Popcorn",
    "Mixed Nuts",
    "Granola Bars",
    "Pretzels",
    "Cookies",
  ],
  "Condiments & Spices": [
    "Ketchup",
    "Mustard",
    "Mayonnaise",
    "Salt",
    "Black Pepper",
    "Soy Sauce",
    "Hot Sauce",
    "Salsa",
    "BBQ Sauce",
    "Vinegar",
    "Garlic Powder",
    "Cinnamon",
  ],
  "Household & Personal Care": [
    "Paper Towels",
    "Toilet Paper",
    "Dish Soap",
    "Laundry Detergent",
    "Trash Bags",
    "Shampoo",
    "Toothpaste",
    "Hand Soap",
  ],
};

export const DEFAULT_GROCERIES: GroceryItem[] = CATEGORY_ORDER.flatMap(
  (category) =>
    RAW[category].map((name) => ({
      id: slugify(category, name),
      name,
      category,
    })),
);
