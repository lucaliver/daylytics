import { Card } from "./Card";

const FULL_DATE_RE = /\b\d{1,2}(?:st|nd|rd|th)\s+[A-Z][a-z]+\s+\d{4}\b/;
const ANNIVERSARY_RE = /\d+(?:st|nd|rd|th)\s+Daylio anniversary/;
const TOKEN_RE = new RegExp(
  `("[^"]+"|[+-]?\\d+(?:\\.\\d+)?%|${FULL_DATE_RE.source}|${ANNIVERSARY_RE.source}|\\b\\d{4}\\b)`,
  "g",
);
const SIGNED_PCT_RE = /^[+-]\d+(?:\.\d+)?%$/;
const BOLD_RE = new RegExp(
  `^(${FULL_DATE_RE.source}|${ANNIVERSARY_RE.source}|\\d{4}|\\d+(?:\\.\\d+)?%)$`,
);

/** Quoted activity names, the anniversary date and "Nth Daylio
 * anniversary" phrase, standalone years, and plain (unsigned) percentages
 * are bolded; signed percentages (a directional change) are colored
 * green/red by sign instead. Everything else renders as plain text. */
function renderInsight(text: string) {
  const parts = text.split(TOKEN_RE);
  return parts.map((part, i) => {
    if (part.startsWith('"') && part.endsWith('"')) {
      return (
        <strong key={i} className="font-semibold text-(--color-text-primary)">
          {part}
        </strong>
      );
    }
    if (SIGNED_PCT_RE.test(part)) {
      return (
        <span
          key={i}
          className="font-semibold"
          style={{ color: part.startsWith("-") ? "var(--color-negative)" : "var(--color-accent)" }}
        >
          {part}
        </span>
      );
    }
    if (BOLD_RE.test(part)) {
      return (
        <strong key={i} className="font-semibold text-(--color-text-primary)">
          {part}
        </strong>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

export function KeyInsights({ insights }: { insights: string[] }) {
  if (insights.length === 0) return null;

  return (
    <Card title="Key insights" subtitle="About you">
      <ul className="space-y-2">
        {insights.map((insight, i) => (
          <li key={i} className="flex gap-2 text-sm">
            <span className="text-(--color-accent)">•</span>
            <span>{renderInsight(insight)}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
