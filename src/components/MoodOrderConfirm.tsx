import { useState } from "react";
import { inferMoodOrder } from "../parser/moodInference";
import { useData } from "../data/useData";
import { MoodFace } from "./MoodFace";
import { ChevronDownIcon, ChevronUpIcon, GripIcon } from "./icons";

export function MoodOrderConfirm() {
  const { rawEntries, confirmMoodOrder } = useData();
  // Shown to the user best -> worst (top to bottom), which reads more
  // naturally for a "confirm your scale" screen. `inferMoodOrder` and
  // `confirmMoodOrder` both deal in worst -> best (Plan.md/TECH_DOC's
  // "mood order is worst -> best everywhere" rule), so this component
  // reverses on the way in and again on the way out — the inversion never
  // leaks past this screen.
  const [order, setOrder] = useState<string[]>(() =>
    rawEntries ? [...inferMoodOrder(rawEntries)].reverse() : [],
  );
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  function moveTo(targetIndex: number) {
    if (dragIndex === null || dragIndex === targetIndex) return;
    setOrder((prev) => {
      const next = [...prev];
      const [moved] = next.splice(dragIndex, 1);
      next.splice(targetIndex, 0, moved);
      return next;
    });
    setDragIndex(targetIndex);
  }

  // Native HTML5 drag-and-drop (used above on desktop) has no touch
  // equivalent, so these buttons are the only way to reorder on mobile —
  // and a fully keyboard/screen-reader-accessible way on any device.
  function moveBy(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= order.length) return;
    setOrder((prev) => {
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  return (
    <div className="flex min-h-dvh items-center justify-center p-5">
      <div className="w-full max-w-md animate-fade-in-up">
        <h2 className="mb-2 text-2xl font-extrabold tracking-tight">Confirm your mood scale</h2>
        <p className="mb-6 text-sm text-(--color-text-secondary)">
          We guessed this order from best to worst. <br />
          If it's wrong, use the arrows below or drag and drop.
        </p>

        <ul className="mb-6 flex flex-col gap-2">
          {order.map((mood, i) => (
            <li
              key={mood}
              draggable
              onDragStart={() => setDragIndex(i)}
              onDragOver={(e) => {
                e.preventDefault();
                moveTo(i);
              }}
              onDragEnd={() => setDragIndex(null)}
              className="flex cursor-grab items-center gap-3 rounded-2xl border border-(--color-border) bg-(--color-surface) py-3 pl-2.5 pr-3 transition-opacity active:cursor-grabbing"
              style={{ opacity: dragIndex === i ? 0.5 : 1 }}
            >
              <GripIcon size={16} className="shrink-0 text-(--color-text-tertiary)" />
              <MoodFace index={order.length - 1 - i} total={order.length} size={26} />
              <span className="flex-1 font-medium">{mood}</span>
              <span className="text-sm text-(--color-text-tertiary)">
                {i === 0 ? "best" : i === order.length - 1 ? "worst" : ""}
              </span>
              <div className="flex flex-col">
                <button
                  type="button"
                  onClick={() => moveBy(i, -1)}
                  disabled={i === 0}
                  aria-label={`Move ${mood} up`}
                  className="flex h-6 w-6 items-center justify-center rounded text-(--color-text-secondary) transition-colors active:bg-(--color-surface-2) disabled:opacity-25"
                >
                  <ChevronUpIcon size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => moveBy(i, 1)}
                  disabled={i === order.length - 1}
                  aria-label={`Move ${mood} down`}
                  className="flex h-6 w-6 items-center justify-center rounded text-(--color-text-secondary) transition-colors active:bg-(--color-surface-2) disabled:opacity-25"
                >
                  <ChevronDownIcon size={14} />
                </button>
              </div>
            </li>
          ))}
        </ul>

        <button
          onClick={() => confirmMoodOrder([...order].reverse())}
          className="w-full rounded-full bg-(--color-accent) py-3.5 font-medium text-black transition-transform active:scale-[0.98] active:opacity-90"
        >
          Confirm
        </button>
      </div>
    </div>
  );
}
