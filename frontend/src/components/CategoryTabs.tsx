import type { Category, CategoryId } from "../types";

interface Props {
  categories: Category[];
  activeId: CategoryId | "all";
  onSelect: (id: CategoryId | "all") => void;
}

export default function CategoryTabs({ categories, activeId, onSelect }: Props) {
  return (
    <div
      role="tablist"
      aria-label="Message categories"
      className="flex gap-3 overflow-x-auto pb-2 px-1 -mx-1 snap-x"
    >
      <TabButton
        active={activeId === "all"}
        onClick={() => onSelect("all")}
        emoji="⭐"
        label="All"
        colorClass="bg-ink text-white"
        activeColorClass="bg-ink text-white"
      />
      {categories.map((cat) => (
        <TabButton
          key={cat.id}
          active={activeId === cat.id}
          onClick={() => onSelect(cat.id)}
          emoji={cat.emoji}
          label={cat.label}
          colorClass={cat.colorClass}
          activeColorClass={cat.colorClass}
        />
      ))}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  emoji,
  label,
  colorClass,
}: {
  active: boolean;
  onClick: () => void;
  emoji: string;
  label: string;
  colorClass: string;
  activeColorClass: string;
}) {
  return (
    <button
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`snap-start shrink-0 flex items-center gap-2 px-5 py-3 rounded-full font-bold text-lg transition-all
        ${active ? `${colorClass} shadow-card scale-105` : "bg-surface text-inkmuted shadow-card"}
      `}
    >
      <span className="text-2xl leading-none" aria-hidden="true">
        {emoji}
      </span>
      {label}
    </button>
  );
}
