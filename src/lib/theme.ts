/** Literal mirrors of the `--color-*`/`--font-sans` custom properties in
 * index.css. The share-card SVG (ShareCardPreview.tsx) gets serialized and
 * rasterized standalone (see YearInReview.tsx) — at that point it's parsed
 * as its own document with no access to this page's `:root`, so `var(...)`
 * references would resolve to nothing. Everything the card draws has to use
 * these literal values instead. Keep in sync with index.css by hand. */
export const EXPORT_COLORS = {
  bg: "#121317",
  surface: "#1c1e24",
  surface2: "#26282f",
  border: "#2e313a",
  textPrimary: "#f5f6f8",
  textSecondary: "#9a9fac",
  textTertiary: "#6b6f7b",
  accent: "#34c471",
  negative: "#e5484d",
} as const;

export const EXPORT_FONT_SANS =
  'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
