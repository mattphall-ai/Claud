import { useState, type FormEvent } from "react";
import { guessCategory } from "../utils/recipeImport";

interface AddItemFormProps {
  categories: string[];
  onAdd: (name: string, category: string) => void;
  onCancel: () => void;
}

const NEW_CATEGORY_VALUE = "__new__";

export function AddItemForm({ categories, onAdd, onCancel }: AddItemFormProps) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState(categories[0] ?? NEW_CATEGORY_VALUE);
  const [newCategory, setNewCategory] = useState("");
  const [categoryTouched, setCategoryTouched] = useState(false);

  const isNewCategory = category === NEW_CATEGORY_VALUE;

  function handleNameChange(value: string) {
    setName(value);
    if (!categoryTouched) {
      const guess = guessCategory(value);
      if (categories.includes(guess)) setCategory(guess);
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const finalCategory = isNewCategory ? newCategory.trim() : category;
    const finalName = name.trim();
    if (!finalName || !finalCategory) return;
    onAdd(finalName, finalCategory);
    setName("");
    setNewCategory("");
    setCategoryTouched(false);
  }

  return (
    <form className="add-item-form" onSubmit={handleSubmit}>
      <h3>Add a grocery item</h3>
      <label className="field">
        <span>Item name</span>
        <input
          type="text"
          value={name}
          onChange={(e) => handleNameChange(e.target.value)}
          placeholder="e.g. Sourdough Bread"
          autoFocus
          required
        />
      </label>
      <label className="field">
        <span>Category</span>
        <select
          value={category}
          onChange={(e) => {
            setCategoryTouched(true);
            setCategory(e.target.value);
          }}
        >
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
          <option value={NEW_CATEGORY_VALUE}>+ New category…</option>
        </select>
      </label>
      {!isNewCategory && (
        <p className="form-hint">
          Category is suggested automatically based on the name — change it
          if needed.
        </p>
      )}
      {isNewCategory && (
        <label className="field">
          <span>New category name</span>
          <input
            type="text"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            placeholder="e.g. Baby"
            required
          />
        </label>
      )}
      <div className="form-actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary">
          Add to master list
        </button>
      </div>
    </form>
  );
}
