import type { GroceryItem } from "../types";

const CORS_PROXIES: ((url: string) => string)[] = [
  (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  (url) => `https://corsproxy.io/?url=${encodeURIComponent(url)}`,
  (url) => `https://cors.deno.dev/${url}`,
  (url) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
];

const PROXY_TIMEOUT_MS = 10_000;

const PROXY_HEADERS: Record<string, string> = {
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
};

export async function fetchRecipeHtml(url: string): Promise<string> {
  const controllers = CORS_PROXIES.map(() => new AbortController());
  const timers = controllers.map((c) =>
    window.setTimeout(() => c.abort(), PROXY_TIMEOUT_MS),
  );

  const attempts = CORS_PROXIES.map((proxy, i) =>
    fetch(proxy(url), { signal: controllers[i].signal, headers: PROXY_HEADERS })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.text();
      })
      .then((html) => {
        if (!html.trim()) throw new Error("empty response");
        return html;
      })
      .finally(() => window.clearTimeout(timers[i])),
  );

  // Suppress unhandled-rejection warnings from losing promises
  attempts.forEach((p) => p.catch(() => {}));

  try {
    const html = await Promise.any(attempts);
    controllers.forEach((c) => c.abort());
    timers.forEach((t) => window.clearTimeout(t));
    return html;
  } catch {
    timers.forEach((t) => window.clearTimeout(t));
    throw new Error("Couldn't load that page automatically");
  }
}

function findRecipeObject(data: unknown): Record<string, unknown> | null {
  if (Array.isArray(data)) {
    for (const entry of data) {
      const found = findRecipeObject(entry);
      if (found) return found;
    }
    return null;
  }
  if (typeof data !== "object" || data === null) return null;

  const obj = data as Record<string, unknown>;
  const type = obj["@type"];
  const isRecipe =
    type === "Recipe" || (Array.isArray(type) && type.includes("Recipe"));
  if (isRecipe) return obj;

  if (Array.isArray(obj["@graph"])) {
    return findRecipeObject(obj["@graph"]);
  }

  return null;
}

function findAllRecipeObjects(doc: Document): Record<string, unknown>[] {
  const found: Record<string, unknown>[] = [];
  for (const script of doc.querySelectorAll('script[type="application/ld+json"]')) {
    try {
      const data = JSON.parse(script.textContent ?? "");
      const recipe = findRecipeObject(data);
      if (recipe) found.push(recipe);
    } catch {
      // ignore malformed JSON-LD blocks and keep looking
    }
  }
  return found;
}

function recipeIngredients(recipe: Record<string, unknown>): string[] {
  const ingredients = recipe.recipeIngredient ?? recipe.ingredients;
  if (!Array.isArray(ingredients)) return [];
  return ingredients.filter(
    (i): i is string => typeof i === "string" && i.trim().length > 0,
  );
}

export function extractIngredientsFromHtml(html: string): string[] {
  const doc = new DOMParser().parseFromString(html, "text/html");
  for (const recipe of findAllRecipeObjects(doc)) {
    const ingredients = recipeIngredients(recipe);
    if (ingredients.length > 0) return ingredients;
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
const INSTRUCTION_HEADER_RE =
  /^#*\s*(instructions?|directions?|method|steps?|preparation)\s*:?$/i;
const INSTRUCTION_STOP_HEADER_RE = /^#*\s*(notes?|nutrition|equipment|tips?)\b/i;
const STOP_HEADER_RE =
  /^#*\s*(instructions?|directions?|method|steps?|prep(ar(e|ation))?|notes?|nutrition|equipment)\b/i;
const LEADING_SYMBOLS_RE = /^[^\p{L}\p{N}⅛⅜⅝⅞¼½¾⅓⅔]+/u;
const INGREDIENT_LINE_RE = /^[\d⅛⅜⅝⅞¼½¾⅓⅔]/;
const LEADING_STEP_NUMBER_RE = /^(?:step\s*)?\d+\s*[.):]\s*/i;

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

export function extractInstructionLinesFromText(text: string): string[] {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim().replace(LEADING_SYMBOLS_RE, "").trim());

  for (let i = 0; i < lines.length; i++) {
    if (!INSTRUCTION_HEADER_RE.test(lines[i])) continue;
    const found: string[] = [];
    for (let j = i + 1; j < lines.length && found.length < 40; j++) {
      const line = lines[j];
      if (!line) {
        if (found.length > 0) break;
        continue;
      }
      if (INSTRUCTION_STOP_HEADER_RE.test(line)) break;
      found.push(line.replace(LEADING_STEP_NUMBER_RE, ""));
    }
    if (found.length > 0) return found;
  }

  return [];
}

function flattenInstructions(data: unknown): string[] {
  if (typeof data === "string") {
    return data
      .split(/\r?\n+/)
      .map((s) => s.trim())
      .filter(Boolean);
  }
  if (Array.isArray(data)) {
    return data.flatMap(flattenInstructions);
  }
  if (typeof data === "object" && data !== null) {
    const obj = data as Record<string, unknown>;
    if (Array.isArray(obj.itemListElement)) return flattenInstructions(obj.itemListElement);
    if (typeof obj.text === "string") return flattenInstructions(obj.text);
    if (typeof obj.name === "string") return flattenInstructions(obj.name);
  }
  return [];
}

function flattenImage(data: unknown): string | undefined {
  if (typeof data === "string") return data;
  if (Array.isArray(data)) return flattenImage(data[0]);
  if (typeof data === "object" && data !== null) {
    const obj = data as Record<string, unknown>;
    if (typeof obj.url === "string") return obj.url;
  }
  return undefined;
}

function extractPageTitle(doc: Document): string {
  const og = doc.querySelector('meta[property="og:title"]')?.getAttribute("content");
  if (og && og.trim()) return og.trim();
  const title = doc.querySelector("title")?.textContent;
  if (title && title.trim()) return title.trim();
  return "Untitled recipe";
}

function extractPageImage(doc: Document): string | undefined {
  const og = doc.querySelector('meta[property="og:image"]')?.getAttribute("content");
  return og && og.trim() ? og.trim() : undefined;
}

export interface ExtractedRecipe {
  name: string;
  ingredients: string[];
  instructions: string[];
  image?: string;
}

export function extractRecipeDetails(html: string): ExtractedRecipe {
  const doc = new DOMParser().parseFromString(html, "text/html");

  for (const recipe of findAllRecipeObjects(doc)) {
    const ingredients = recipeIngredients(recipe);
    const instructions = flattenInstructions(recipe.recipeInstructions);
    if (ingredients.length > 0 || instructions.length > 0) {
      const name =
        typeof recipe.name === "string" && recipe.name.trim()
          ? recipe.name.trim()
          : extractPageTitle(doc);
      return {
        name,
        ingredients,
        instructions,
        image: flattenImage(recipe.image) ?? extractPageImage(doc),
      };
    }
  }

  const description = extractDescriptionFromHtml(html);
  return {
    name: extractPageTitle(doc),
    ingredients: extractIngredientLinesFromText(description),
    instructions: extractInstructionLinesFromText(description),
    image: extractPageImage(doc),
  };
}

export function titleFromUrl(url: string): string {
  try {
    const { pathname } = new URL(url);
    const segments = pathname.split("/").filter(Boolean);
    const slug = segments[segments.length - 1] ?? "";
    const cleaned = slug
      .replace(/\.[a-z0-9]+$/i, "")
      .replace(/^a?\d{4,}-/i, "")
      .replace(/[-_]+/g, " ")
      .trim();
    if (!cleaned || /^\d+$/.test(cleaned)) return "Untitled recipe";
    return cleaned.replace(/\b\w/g, (c) => c.toUpperCase());
  } catch {
    return "Untitled recipe";
  }
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
  const lower = name.toLowerCase().trim();
  for (const item of candidates) {
    if (item.name.toLowerCase().trim() === lower) return item;
  }
  return null;
}
