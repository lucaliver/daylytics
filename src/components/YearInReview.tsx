import { useRef, useState } from "react";
import type { YearInReviewData } from "../types";
import { Card } from "./Card";
import { ShareCardPreview } from "./ShareCardPreview";
import { DownloadIcon, ShareIcon } from "./icons";
import { Spinner } from "./Spinner";

const EXPORT_W = 1080;
const EXPORT_H = 1920;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not render the preview."));
    img.src = src;
  });
}

// The card is plain SVG (shapes + <text>, no HTML/foreignObject, no webfonts
// or external images) specifically so this trip — clone, serialize, load as
// an <img>, draw to <canvas> — rasterizes the same way in every browser.
async function renderToPng(svg: SVGSVGElement): Promise<Blob> {
  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.setAttribute("width", String(EXPORT_W));
  clone.setAttribute("height", String(EXPORT_H));
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");

  const svgString = new XMLSerializer().serializeToString(clone);
  // A blob: URL, not a data: URI — activity/mood names can carry non-ASCII
  // text (this app's own test fixtures include it), which breaks the usual
  // btoa() data-URI trick. Blob URLs also don't taint the canvas below.
  const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
  const svgUrl = URL.createObjectURL(svgBlob);

  try {
    const img = await loadImage(svgUrl);
    const canvas = document.createElement("canvas");
    canvas.width = EXPORT_W;
    canvas.height = EXPORT_H;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("This browser can't create images.");
    ctx.drawImage(img, 0, 0, EXPORT_W, EXPORT_H);

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
    if (!blob) throw new Error("This browser can't create images.");
    return blob;
  } finally {
    URL.revokeObjectURL(svgUrl);
  }
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// Capability, not state — doesn't change mid-session, so this runs once
// rather than on every render. Probing with a real (if empty) File is the
// standard way to ask "can this browser's share sheet take image files."
const canFileShare =
  typeof navigator !== "undefined" &&
  typeof navigator.canShare === "function" &&
  navigator.canShare({ files: [new File([], "share.png", { type: "image/png" })] });

export function YearInReview({
  scopes,
  moodOrder,
}: {
  scopes: YearInReviewData[];
  moodOrder: string[];
}) {
  // "All time" is always last in `scopes` (see analytics/yearInReview.ts).
  const [tabIndex, setTabIndex] = useState(() => scopes.length - 1);
  const [status, setStatus] = useState<"idle" | "saving" | "sharing" | "error">("idle");
  const previewRef = useRef<HTMLDivElement>(null);

  if (scopes.length === 0) return null;
  const active = scopes[Math.min(tabIndex, scopes.length - 1)];

  async function handleSave() {
    const svg = previewRef.current?.querySelector("svg");
    if (!svg) return;
    setStatus("saving");
    try {
      const blob = await renderToPng(svg);
      downloadBlob(blob, `daylytics-${active.year ?? "all-time"}.png`);
      setStatus("idle");
    } catch {
      setStatus("error");
    }
  }

  async function handleShare() {
    const svg = previewRef.current?.querySelector("svg");
    if (!svg) return;
    setStatus("sharing");
    try {
      const blob = await renderToPng(svg);
      const file = new File([blob], `daylytics-${active.year ?? "all-time"}.png`, { type: "image/png" });
      try {
        await navigator.share({ files: [file] });
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          setStatus("idle");
          return;
        }
        throw err;
      }
      setStatus("idle");
    } catch {
      setStatus("error");
    }
  }

  return (
    <Card title="Share" subtitle="A vertical card for Instagram, Reddit, wherever.">
      <div
        role="tablist"
        aria-label="Share scope"
        className="thin-scrollbar mb-4 flex gap-1.5 overflow-x-auto pb-1"
      >
        {scopes.map((s, i) => (
          <button
            key={s.label}
            type="button"
            role="tab"
            aria-selected={i === tabIndex}
            onClick={() => {
              setTabIndex(i);
              setStatus("idle");
            }}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
              i === tabIndex
                ? "bg-(--color-accent) text-black"
                : "bg-(--color-surface-2) text-(--color-text-secondary) active:bg-(--color-border)"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="mx-auto w-full max-w-[280px]">
        <div
          ref={previewRef}
          className="overflow-hidden rounded-2xl border border-(--color-border)"
          style={{ aspectRatio: "9 / 16" }}
        >
          <ShareCardPreview data={active} moodOrder={moodOrder} />
        </div>
      </div>

      <div className="mt-5 flex gap-3">
        <button
          onClick={() => void handleSave()}
          disabled={status !== "idle"}
          className="flex flex-1 items-center justify-center gap-2 rounded-full bg-(--color-accent) py-3.5 text-sm font-semibold text-black transition-transform active:scale-[0.98] active:opacity-90 disabled:opacity-60"
        >
          {status === "saving" ? <Spinner size={18} /> : <DownloadIcon size={17} />}
          Save
        </button>

        {canFileShare && (
          <button
            onClick={() => void handleShare()}
            disabled={status !== "idle"}
            className="flex flex-1 items-center justify-center gap-2 rounded-full border border-(--color-border) bg-(--color-surface-2) py-3.5 text-sm font-semibold text-(--color-text-primary) transition-transform active:scale-[0.98] active:bg-(--color-border) disabled:opacity-60"
          >
            {status === "sharing" ? <Spinner size={18} /> : <ShareIcon size={17} />}
            Share
          </button>
        )}
      </div>

      {status === "error" && (
        <p className="mt-3 text-center text-sm" style={{ color: "var(--color-negative)" }}>
          Couldn't create the image on this browser. Try again, or screenshot the preview above.
        </p>
      )}
    </Card>
  );
}
