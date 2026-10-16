import type { CategoryId } from "../types";

export interface CategoryMeta {
  id: CategoryId;
  label: string;
  emoji: string;
  colorHex: string;
  colorClass: string;
}

export const CATEGORIES: CategoryMeta[] = [
  { id: "people", label: "People", emoji: "🧑", colorHex: "#2D6E8E", colorClass: "bg-primary/10 text-primary border-primary/30" },
  { id: "needs", label: "Needs", emoji: "💧", colorHex: "#5C8A72", colorClass: "bg-sage/10 text-sage border-sage/30" },
  { id: "questions", label: "Questions", emoji: "❓", colorHex: "#E8A23D", colorClass: "bg-amber/10 text-amber-dark border-amber/30" },
  { id: "actions", label: "Actions", emoji: "⚡", colorHex: "#1F4F68", colorClass: "bg-primary/10 text-primary-dark border-primary/30" },
  { id: "emergency", label: "Emergency", emoji: "🚨", colorHex: "#D96459", colorClass: "bg-emergency/10 text-emergency border-emergency/30" },
];

interface CategoryPickerProps {
  value: CategoryId;
  onChange: (id: CategoryId) => void;
}

export default function CategoryPicker({ value, onChange }: CategoryPickerProps) {
  return (
    <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Category">
      {CATEGORIES.map((cat) => {
        const active = value === cat.id;
        return (
          <button
            key={cat.id}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(cat.id)}
            className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary ${
              active ? `${cat.colorClass} border-2` : "border-transparent bg-canvas text-inkmuted hover:bg-primary-light/40"
            }`}
          >
            <span aria-hidden="true">{cat.emoji}</span>
            {cat.label}
          </button>
        );
      })}
    </div>
  );
}
