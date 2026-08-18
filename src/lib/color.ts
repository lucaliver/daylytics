/** Daylio's mood scale, worst -> best: red, orange, gold, lime, green. */
const MOOD_STOPS: [number, number, number][] = [
  [229, 72, 77], // awful — red
  [226, 130, 60], // bad — orange
  [234, 187, 44], // meh — gold
  [168, 201, 59], // good — lime
  [47, 169, 104], // rad — green
];

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** Interpolates across Daylio's 5-color mood ramp for any scale length, so
 * custom mood sets (not just the default 5) still land on sane colors. */
export function moodColor(index: number, total: number): string {
  if (total <= 1) return `rgb(${MOOD_STOPS[4].join(",")})`;

  const t = index / (total - 1); // 0 = worst, 1 = best
  const scaled = t * (MOOD_STOPS.length - 1);
  const lower = Math.floor(scaled);
  const upper = Math.min(lower + 1, MOOD_STOPS.length - 1);
  const localT = scaled - lower;

  const [r, g, b] = MOOD_STOPS[lower].map((c, i) =>
    Math.round(lerp(c, MOOD_STOPS[upper][i], localT)),
  );
  return `rgb(${r}, ${g}, ${b})`;
}
