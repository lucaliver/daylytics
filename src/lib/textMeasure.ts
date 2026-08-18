import { EXPORT_FONT_SANS } from "./theme";

let sharedCtx: CanvasRenderingContext2D | null = null;

function getCtx(): CanvasRenderingContext2D {
  if (!sharedCtx) {
    sharedCtx = document.createElement("canvas").getContext("2d");
  }
  return sharedCtx!;
}

/** Pixel width of `text` at the given size/weight, using the same font
 * stack the export card renders with (see EXPORT_FONT_SANS) — used to place
 * adjacent SVG <text> elements (e.g. two differently-colored words in one
 * line) side by side without overlapping or guessing at gaps. */
export function measureWidth(text: string, fontSizePx: number, fontWeight = 400): number {
  const ctx = getCtx();
  ctx.font = `${fontWeight} ${fontSizePx}px ${EXPORT_FONT_SANS}`;
  return ctx.measureText(text).width;
}

/** Largest font size at or below `maxFontSize` that renders `text` no wider
 * than `maxWidth` — for the handful of card elements (the year headline, the
 * big mood word) where shrinking to fit reads better than truncating text
 * that's short but of genuinely unpredictable width (a custom mood name, or
 * the word "All time" next to a 4-digit year at the same type scale). */
export function fitFontSize(
  text: string,
  maxWidth: number,
  maxFontSize: number,
  fontWeight = 800,
): number {
  const widthAtMax = measureWidth(text, maxFontSize, fontWeight);
  return widthAtMax > maxWidth ? maxFontSize * (maxWidth / widthAtMax) * 0.98 : maxFontSize;
}

/** Truncates `text` with a trailing ellipsis so it renders no wider than
 * `maxWidth` at the given size/weight. SVG <text> has no CSS text-overflow —
 * this measures with an offscreen canvas (same font stack as the card) and
 * trims to fit, for content whose length is entirely user-defined (activity
 * and mood names). */
export function truncateToWidth(
  text: string,
  maxWidth: number,
  fontSizePx: number,
  fontWeight = 400,
): string {
  const ctx = getCtx();
  ctx.font = `${fontWeight} ${fontSizePx}px ${EXPORT_FONT_SANS}`;
  if (ctx.measureText(text).width <= maxWidth) return text;

  let lo = 0;
  let hi = text.length;
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    const candidate = `${text.slice(0, mid).trimEnd()}…`;
    if (ctx.measureText(candidate).width <= maxWidth) lo = mid;
    else hi = mid - 1;
  }
  return lo === 0 ? "…" : `${text.slice(0, lo).trimEnd()}…`;
}
