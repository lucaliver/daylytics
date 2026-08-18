import { useEffect, useRef, useState } from "react";
import { parseDaylioCsv } from "../parser/csvParser";
import { normalizeRows } from "../parser/normalizer";
import { useData } from "../data/useData";
import { Spinner } from "./Spinner";
import { ChevronDownIcon } from "./icons";

export function FileUpload() {
  const { loadEntries } = useData();
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  // On some devices the native file picker takes a visible moment to open
  // (or to hand back the picked file). There's no event for "the picker is
  // opening," so this covers the gap: flip on tap, and clear it either when
  // a file arrives (onChange, below) or the picker is dismissed without one
  // (the window regains focus).
  const [isOpening, setIsOpening] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const helpRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpening) return;
    const handleFocus = () => setIsOpening(false);
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [isOpening]);

  // A floating panel (rather than an inline <details>) so opening it never
  // reflows the rest of the page — this whole screen is vertically centered,
  // and an inline-expanding block would shove the logo/dropzone upward.
  useEffect(() => {
    if (!showHelp) return;
    function handlePointerDown(e: PointerEvent) {
      if (helpRef.current && !helpRef.current.contains(e.target as Node)) setShowHelp(false);
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setShowHelp(false);
    }
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [showHelp]);

  async function handleFile(file: File) {
    setError(null);
    setIsOpening(false);
    setIsLoading(true);
    const startedAt = Date.now();
    // Real exports parse in well under this, so without a floor the loading
    // state would flash and disappear before it registers as feedback.
    const MIN_VISIBLE_MS = 500;

    try {
      const rows = await parseDaylioCsv(file);
      const entries = normalizeRows(rows);
      if (entries.length === 0) {
        setError("No valid entries found in this file. Is it a Daylio CSV export?");
        return;
      }
      const remaining = MIN_VISIBLE_MS - (Date.now() - startedAt);
      if (remaining > 0) await new Promise((r) => setTimeout(r, remaining));
      loadEntries(entries);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not read that file.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-dvh flex-col items-center p-5">
      <div className="flex w-full flex-1 items-center justify-center">
        <div className="w-full max-w-md animate-fade-in-up text-center">
          <h1 className="mb-2 text-4xl font-extrabold tracking-tight">
            <span className="text-(--color-text-primary)">Day</span>
            <span className="text-(--color-accent)">lytics</span>
          </h1>
          <p className="mb-8 text-(--color-text-secondary)">
            See your Daylio history from a different angle, entirely in your
            browser.
          </p>

          {isLoading ? (
            <div className="flex flex-col items-center gap-3 rounded-3xl border border-(--color-border) bg-(--color-surface) p-10">
              <Spinner />
              <p className="text-sm text-(--color-text-secondary)">Reading your data…</p>
            </div>
          ) : (
            <label
              onClick={() => setIsOpening(true)}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                const file = e.dataTransfer.files[0];
                if (file) void handleFile(file);
              }}
              className={`block cursor-pointer rounded-3xl border-2 border-dashed p-10 transition-all duration-200 ${
                isDragging
                  ? "scale-[1.02] border-(--color-accent) bg-(--color-surface-2)"
                  : "border-(--color-border) bg-(--color-surface)"
              } ${isOpening ? "opacity-70" : ""}`}
            >
              {isOpening ? (
                <div className="flex flex-col items-center gap-3 py-2">
                  <Spinner size={22} />
                  <p className="text-sm text-(--color-text-secondary)">Opening file picker…</p>
                </div>
              ) : (
                <>
                  <p className="font-semibold">Drop your Daylio CSV export here</p>
                  <p className="mt-1 text-sm text-(--color-text-secondary)">
                    or tap to choose a file
                  </p>
                </>
              )}
              <input
                ref={inputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void handleFile(file);
                  else setIsOpening(false);
                }}
              />
            </label>
          )}

          {error && (
            <p className="mt-4 text-sm" style={{ color: "var(--color-negative)" }}>
              {error}
            </p>
          )}

          <div className="relative mt-8 inline-block" ref={helpRef}>
            <button
              type="button"
              onClick={() => setShowHelp((v) => !v)}
              aria-expanded={showHelp}
              aria-haspopup="true"
              className="flex items-center gap-1 text-sm font-medium text-(--color-text-secondary) transition-colors active:text-(--color-text-primary)"
            >
              Don't have the CSV file yet?
              <ChevronDownIcon
                size={14}
                className={`transition-transform ${showHelp ? "rotate-180" : ""}`}
              />
            </button>

            {showHelp && (
              <div
                role="dialog"
                aria-label="How to export your Daylio data"
                className="absolute left-1/2 top-[calc(100%+0.75rem)] z-20 w-[calc(100vw-3rem)] max-w-72 -translate-x-1/2 rounded-2xl border border-(--color-border) bg-(--color-surface-2) p-4 text-left shadow-xl"
              >
                <p className="mb-2 text-sm font-semibold text-(--color-text-primary)">
                  Export from Daylio
                </p>
                <ol className="list-decimal space-y-1.5 pl-5 text-sm text-(--color-text-secondary)">
                  <li>Open Daylio and tap "More" in the bottom bar.</li>
                  <li>Scroll down and tap "Export entries."</li>
                  <li>Choose "CSV table" and save the file.</li>
                </ol>
              </div>
            )}
          </div>
        </div>
      </div>

      <p className="mb-2 w-full max-w-md rounded-2xl border border-(--color-border) bg-(--color-surface) px-4 py-3 text-center text-sm text-(--color-text-secondary)">
        No data collected. <br />
        Everything runs locally in your browser
      </p>
    </div>
  );
}
