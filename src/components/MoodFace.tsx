import { moodColor } from "../lib/color";

const DOT_EYES = (
  <>
    <circle cx="8.3" cy="10" r="1.15" fill="rgba(0,0,0,0.45)" />
    <circle cx="15.7" cy="10" r="1.15" fill="rgba(0,0,0,0.45)" />
  </>
);

const HAPPY_EYES = (
  <>
    <path d="M 6.6 9.7 Q 8.3 7.7 10 9.7" stroke="rgba(0,0,0,0.45)" strokeWidth="1.3" strokeLinecap="round" fill="none" />
    <path d="M 14 9.7 Q 15.7 7.7 17.4 9.7" stroke="rgba(0,0,0,0.45)" strokeWidth="1.3" strokeLinecap="round" fill="none" />
  </>
);

const WORRIED_BROWS = (
  <>
    <path d="M 6.2 7.5 L 9.8 9" stroke="rgba(0,0,0,0.45)" strokeWidth="1.1" strokeLinecap="round" />
    <path d="M 14.2 9 L 17.8 7.5" stroke="rgba(0,0,0,0.45)" strokeWidth="1.1" strokeLinecap="round" />
  </>
);

/** Five hand-drawn expressions, keyed to Daylio's own worst -> best glyphs:
 * a scrunched frown, a plain frown, a flat line, a gentle smile, and a big
 * open grin. */
function Expression({ bucket }: { bucket: 0 | 1 | 2 | 3 | 4 }) {
  switch (bucket) {
    case 0: // awful
      return (
        <>
          {WORRIED_BROWS}
          {DOT_EYES}
          <path
            d="M 7.5 16.3 Q 12 13.3 16.5 16.3"
            stroke="rgba(0,0,0,0.45)"
            strokeWidth="1.4"
            strokeLinecap="round"
            fill="none"
          />
        </>
      );
    case 1: // bad
      return (
        <>
          {DOT_EYES}
          <path
            d="M 8 16 Q 12 13.8 16 16"
            stroke="rgba(0,0,0,0.45)"
            strokeWidth="1.4"
            strokeLinecap="round"
            fill="none"
          />
        </>
      );
    case 2: // meh
      return (
        <>
          {DOT_EYES}
          <line x1="8.3" y1="15.5" x2="15.7" y2="15.5" stroke="rgba(0,0,0,0.45)" strokeWidth="1.4" strokeLinecap="round" />
        </>
      );
    case 3: // good
      return (
        <>
          {DOT_EYES}
          <path
            d="M 8 15 Q 12 17.3 16 15"
            stroke="rgba(0,0,0,0.45)"
            strokeWidth="1.4"
            strokeLinecap="round"
            fill="none"
          />
        </>
      );
    case 4: // rad
      return (
        <>
          {HAPPY_EYES}
          <path
            d="M 7.4 14.6 Q 12 14.8 16.6 14.6 Q 16 19.2 12 19.2 Q 8 19.2 7.4 14.6 Z"
            fill="rgba(0,0,0,0.45)"
          />
        </>
      );
  }
}

/** A small emoji-style face, colored and expressed along the mood scale —
 * matching Daylio's own mood glyphs (a scrunched frown at the worst end, an
 * open grin at the best) so the same visual language carries into every
 * chart. Expressions are bucketed into Daylio's 5 archetypes; the fill color
 * still interpolates continuously so non-5-point scales land on sane hues. */
export function MoodFace({
  index,
  total,
  size = 22,
}: {
  index: number;
  total: number;
  size?: number;
}) {
  const t = total > 1 ? index / (total - 1) : 1; // 0 = worst, 1 = best
  const bucket = Math.round(t * 4) as 0 | 1 | 2 | 3 | 4;
  const fill = moodColor(index, total);

  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      <circle cx="12" cy="12" r="11" fill={fill} />
      <Expression bucket={bucket} />
    </svg>
  );
}
