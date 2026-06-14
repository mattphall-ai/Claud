import type { GroceryItem } from "../types";

const CORS_PROXIES: ((url: string) => string)[] = [
  (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  (url) => `https://corsproxy.io/?url=${encodeURIComponent(url)}`,
  (url) => `https://thingproxy.freeboard.io/fetch/${url}`,
];

export async function fetchRecipeHtml(url: string): Promise<string> {
  let lastError: unknown;
  for (const proxy of CORS_PROXIES) {
    try {
      const res = await fetch(proxy(url));
      if (!res.ok) throw new Error(`request failed (${res.status})`);
      const html = await res.text();
      if (html.trim()) return html;
    } catch (err) {
      lastError = err;
    }
  }
  const detail = lastError instanceof Error ? `: ${lastError.message}` : "";
  throw new Error(`Couldn't load that page${detail}`);
}

function findRecipeIngredients(data: unknown): string[] | null {
  if (Array.isArray(data)) {
    for (const entry of data) {
      const found = findRecipeIngredients(entry);
      if (found) return found;
    }
    return null;
  }
  if (typeof data !== "object" || data === null) return null;

  const obj = data as Record<string, unknown>;
  const type = obj["@type"];
  const isRecipe =
    type === "Recipe" || (Array.isArray(type) && type.includes("Recipe"));

  if (isRecipe) {
    const ingredients = obj.recipeIngredient ?? obj.ingredients;
    if (Array.isArray(ingredients)) {
      const strings = ingredients.filter(
        (i): i is string => typeof i === "string" && i.trim().length > 0,
      );
      if (strings.length > 0) return strings;
    }
  }

  if (Array.isArray(obj["@graph"])) {
    return findRecipeIngredients(obj["@graph"]);
  }

  return null;
}

export function extractIngredientsFromHtml(html: string): string[] {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const scripts = doc.querySelectorAll('script[type="application/ld+json"]');
  for (const script of scripts) {
    try {
      const data = JSON.parse(script.textContent ?? "");
      const ingredients = findRecipeIngredients(data);
      if (ingredients) return ingredients;
    } catch {
      // ignore malformed JSON-LD blocks and keep looking
    }
  }
  return [];
}

function decodeJsonString(escaped: string): string {
  try {
    return JSON.parse(`"${escaped}"`);
  } catch {
    return escaped;
  }
}

export function extractDescriptionFromHtml(html: string): string {
  const doc = new DOMParser().parseFromString(html, "text/html");

  for (const selector of [
    'meta[property="og:description"]',
    'meta[name="description"]',
    'meta[name="twitter:description"]',
  ]) {
    const content = doc.querySelector(selector)?.getAttribute("content");
    if (content && content.trim()) return content;
  }

  // YouTube embeds the full video description as JSON inside an inline script.
  for (const script of doc.querySelectorAll("script")) {
    const text = script.textContent ?? "";
    const match = text.match(/"shortDescription":"((?:\\.|[^"\\])*)"/);
    if (match) return decodeJsonString(match[1]);
  }

  return "";
}

const INGREDIENT_HEADER_RE = /^#*\s*ingredients?\s*:?$/i;
const STOP_HEADER_RE =
  /^#*\s*(instructions?|directions?|method|steps?|prep(ar(e|ation))?|notes?|nutrition|equipment)\b/i;
const LEADING_SYMBOLS_RE = /^[^\p{L}\p{N}⅛⅜⅝⅞¼½¾⅓⅔]+/u;
const INGREDIENT_LINE_RE = /^[\d⅛⅜⅝⅞¼½¾⅓⅔]/;

export function extractIngredientLinesFromText(text: string): string[] {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim().replace(LEADING_SYMBOLS_RE, "").trim());

  for (let i = 0; i < lines.length; i++) {
    if (!INGREDIENT_HEADER_RE.test(lines[i])) continue;
    const found: string[] = [];
    for (let j = i + 1; j < lines.length && found.length < 40; j++) {
      const line = lines[j];
      if (!line) {
        if (found.length > 0) break;
        continue;
      }
      if (STOP_HEADER_RE.test(line)) break;
      found.push(line);
    }
    if (found.length > 0) return found;
  }

  return lines.filter((line) => line.length > 0 && line.length < 100 && INGREDIENT_LINE_RE.test(line));
}

export function extractIngredients(html: string): string[] {
  const structured = extractIngredientsFromHtml(html);
  if (structured.length > 0) return structured;
  return extractIngredientLinesFromText(extractDescriptionFromHtml(html));
}

const LEADING_WORDS =
  "a|an|of|the|" +
  "cups?|tablespoons?|tbsps?|tbsp|teaspoons?|tsps?|tsp|" +
  "ounces?|oz|pounds?|lbs?|grams?|kilograms?|kgs?|" +
  "milliliters?|millilitres?|mls?|liters?|litres?|" +
  "pints?|quarts?|gallons?|" +
  "cans?|jars?|bags?|boxes?|packages?|pkgs?|" +
  "cloves?|slices?|sticks?|stalks?|sprigs?|heads?|fillets?|pieces?|bunch(es)?|" +
  "pinch(es)?|dash(es)?|" +
  "large|medium|small";

const LEADING_WORD_RE = new RegExp(`^(${LEADING_WORDS})\\b\\.?\\s*`, "i");
const LEADING_QUANTITY_RE = /^[\d⅛⅜⅝⅞¼½¾⅓⅔./\-\s]+/;
const TRAILING_NOTE_RE =
  /\b(to taste|for garnish|for serving|as needed|if needed|optional|or to taste)\b.*$/i;

export function cleanIngredientName(raw: string): string {
  let text = raw
    .toLowerCase()
    .replace(/\([^)]*\)/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const commaIndex = text.indexOf(",");
  if (commaIndex > 0) text = text.slice(0, commaIndex).trim();

  text = text.replace(TRAILING_NOTE_RE, "").trim();
  text = text.replace(LEADING_QUANTITY_RE, "").trim();

  for (let i = 0; i < 4; i++) {
    const next = text.replace(LEADING_WORD_RE, "").trim();
    if (next === text) break;
    text = next;
  }

  if (!text) text = raw.trim().toLowerCase();

  return text.charAt(0).toUpperCase() + text.slice(1);
}

const CATEGORY_KEYWORDS: [string, string[]][] = [
  ["Frozen", ["frozen"]],
  [
    "Produce",
    [
      "lettuce", "tomato", "onion", "garlic", "bell pepper", "carrot", "potato",
      "apple", "banana", "lemon", "lime", "spinach", "broccoli", "cucumber",
      "celery", "avocado", "mushroom", "cilantro", "parsley", "basil",
      "ginger", "zucchini", "berr", "kale", "scallion", "shallot",
    ],
  ],
  ["Dairy & Eggs", ["milk", "cheese", "butter", "yogurt", "cream", "egg"]],
  [
    "Meat & Seafood",
    [
      "chicken", "beef", "pork", "turkey", "sausage", "bacon", "steak",
      "fish", "salmon", "shrimp", "lamb", "ham",
    ],
  ],
  ["Bakery", ["bread", "bun", "bagel", "tortilla", "roll", "baguette", "pita"]],
  ["Beverages", ["juice", "soda", "wine", "beer", "coffee", "tea", "broth", "stock"]],
  [
    "Condiments & Spices",
    [
      "salt", "pepper", "sauce", "oil", "vinegar", "spice", "cumin",
      "paprika", "cinnamon", "oregano", "thyme", "powder", "extract",
      "syrup", "mustard", "mayo", "ketchup", "honey", "seasoning", "zest",
    ],
  ],
];

export function guessCategory(name: string): string {
  const lower = name.toLowerCase();
  for (const [category, keywords] of CATEGORY_KEYWORDS) {
    if (keywords.some((kw) => lower.includes(kw))) return category;
  }
  return "Pantry";
}

export function findMatchingItem(
  name: string,
  candidates: GroceryItem[],
): GroceryItem | null {
  const lower = name.toLowerCase();
  let best: GroceryItem | null = null;
  let bestScore = 0;

  for (const item of candidates) {
    const itemLower = item.name.toLowerCase();
    if (lower === itemLower) return item;
    if (lower.includes(itemLower) || itemLower.includes(lower)) {
      const score = Math.min(itemLower.length, lower.length);
      if (score > bestScore && score >= 3) {
        bestScore = score;
        best = item;
      }
    }
  }

  return best;
}
