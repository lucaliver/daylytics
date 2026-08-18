import { useEffect, useRef, useState } from "react";
import { SlidersIcon } from "./icons";

export function SectionsMenu({
  sections,
  hidden,
  onToggle,
}: {
  sections: { id: string; label: string }[];
  hidden: Set<string>;
  onToggle: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(e: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="true"
        aria-label="Sections"
        className="flex items-center gap-1.5 rounded-full border border-(--color-border) px-3.5 py-2 text-sm text-(--color-text-secondary) transition-colors active:bg-(--color-surface-2)"
      >
        <SlidersIcon size={17} />
        <span className="hidden sm:inline">Sections</span>
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Toggle visible sections"
          className="absolute right-0 top-[calc(100%+0.5rem)] z-40 w-60 rounded-2xl border border-(--color-border) bg-(--color-surface) p-2 shadow-xl"
        >
          <p className="px-2.5 pb-1.5 pt-1 text-sm font-medium uppercase tracking-wide text-(--color-text-tertiary)">
            Show sections
          </p>
          {sections.map((s) => (
            <label
              key={s.id}
              className="flex cursor-pointer items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm transition-colors active:bg-(--color-surface-2)"
            >
              <input
                type="checkbox"
                checked={!hidden.has(s.id)}
                onChange={() => onToggle(s.id)}
                className="h-4 w-4 accent-(--color-accent)"
              />
              {s.label}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
