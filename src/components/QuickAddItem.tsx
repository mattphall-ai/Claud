import { useState, type FormEvent } from "react";

interface QuickAddItemProps {
  onAdd: (name: string) => void;
}

export function QuickAddItem({ onAdd }: QuickAddItemProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");

  function close() {
    setOpen(false);
    setName("");
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setName("");
  }

  if (!open) {
    return (
      <button
        type="button"
        className="btn btn-primary add-item-btn"
        onClick={() => setOpen(true)}
      >
        + Add an item
      </button>
    );
  }

  return (
    <form className="add-item-form" onSubmit={handleSubmit}>
      <h3>Add an item to this week's list</h3>
      <label className="field">
        <span>Item name</span>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Birthday candles"
          autoFocus
        />
      </label>
      <p className="form-hint">
        If this is a new item, it's also saved to your master list under a
        best-guess category.
      </p>
      <div className="form-actions">
        <button type="button" className="btn btn-secondary" onClick={close}>
          Done
        </button>
        <button type="submit" className="btn btn-primary">
          Add
        </button>
      </div>
    </form>
  );
}
