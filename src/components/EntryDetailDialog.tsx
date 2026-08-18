import { useEffect, useRef } from "react";
import type { ScoredEntry } from "../types";
import { MoodFace } from "./MoodFace";
import { CloseIcon } from "./icons";
import { formatDate } from "../lib/format";

export function EntryDetailDialog({
  entry,
  moodOrder,
  onClose,
}: {
  entry: ScoredEntry | null;
  moodOrder: string[];
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (entry && !dialog.open) dialog.showModal();
    if (!entry && dialog.open) dialog.close();
  }, [entry]);

  // The native <dialog> puts the rest of the page in the top layer's shadow
  // but doesn't stop it from scrolling on its own — lock <body> explicitly
  // while open, otherwise the background scrolls right under the backdrop.
  useEffect(() => {
    if (!entry) return;
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = overflow;
    };
  }, [entry]);

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === dialogRef.current) onClose();
      }}
      className="w-[calc(100vw-2.5rem)] max-w-sm animate-fade-in-up rounded-3xl border border-(--color-border) bg-(--color-surface) p-6"
    >
      {entry && (
        <>
          <button
            onClick={onClose}
            aria-label="Close"
            className="absolute top-4 right-4 flex h-9 w-9 items-center justify-center rounded-full border border-(--color-border) bg-(--color-surface-2) text-(--color-text-primary) transition-colors active:bg-(--color-border)"
          >
            <CloseIcon size={16} />
          </button>

          <div className="mb-4 flex items-center gap-3 pr-10">
            <MoodFace index={entry.moodValue} total={moodOrder.length} size={40} />
            <div>
              <p className="text-lg font-bold tracking-tight">{formatDate(entry.date)}</p>
              <p className="text-sm text-(--color-text-secondary)">
                {entry.weekday} · {entry.time} · {entry.mood}
              </p>
            </div>
          </div>

          {entry.activities.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {entry.activities.map((activity) => (
                <span
                  key={activity}
                  className="rounded-full bg-(--color-surface-2) px-3 py-1 text-sm"
                >
                  {activity}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-(--color-text-tertiary)">No activities logged.</p>
          )}

          <button
            onClick={onClose}
            className="mt-6 w-full rounded-full border border-(--color-border) bg-(--color-surface-2) py-2.5 text-sm font-semibold transition-colors active:bg-(--color-border)"
          >
            Close
          </button>
        </>
      )}
    </dialog>
  );
}
