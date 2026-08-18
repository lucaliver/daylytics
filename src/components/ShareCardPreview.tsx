import type { ReactNode } from "react";
import type { YearInReviewData } from "../types";
import { moodColor } from "../lib/color";
import { EXPORT_COLORS, EXPORT_FONT_SANS } from "../lib/theme";
import { fitFontSize, measureWidth, truncateToWidth } from "../lib/textMeasure";
import { formatShortDate } from "../lib/format";
import { MoodFace } from "./MoodFace";

const W = 1080;
const H = 1920;
const CX = W / 2;
const PAD = 76;
const CONTENT_W = W - PAD * 2;
const C = EXPORT_COLORS;

// SVG <text> has no line-height — every block below picks its own baseline
// from a "top" cursor using this fixed ratio rather than the (also fixed,
// but different) one a browser would use for HTML, so a block's declared
// height and its actual ink stay predictable as the cursor advances.
function baseline(top: number, fontSize: number): number {
  return top + fontSize * 0.8;
}

/** The vertical, 1080x1920 "wrapped"-style share card — hand-rolled SVG
 * (matching MoodFace/Sparkline elsewhere) rather than an HTML node, because
 * it gets rasterized standalone (YearInReview.tsx serializes this exact
 * element to a PNG) and plain SVG shapes/text survive that trip reliably,
 * with no external stylesheet or webfont to lose along the way. This same
 * component is also the on-screen preview, scaled down — what you see is
 * what gets exported. */
export function ShareCardPreview({
  data,
  moodOrder,
}: {
  data: YearInReviewData;
  moodOrder: string[];
}) {
  const nodes: ReactNode[] = [];
  let y = 72;

  nodes.push(<rect key="bg" width={W} height={H} fill={C.bg} />);
  nodes.push(<rect key="glow" width={W} height={H} fill="url(#heroGlow)" />);

  {
    const fs = 34;
    const by = baseline(y, fs);
    const dayW = measureWidth("Day", fs, 800);
    nodes.push(
      <g key="brand">
        <text x={PAD} y={by} fontSize={fs} fontWeight={800} fill={C.textPrimary}>
          Day
        </text>
        <text x={PAD + dayW} y={by} fontSize={fs} fontWeight={800} fill={C.accent}>
          lytics
        </text>
      </g>,
    );
    y += 44 + 36;
  }

  {
    const eyebrowFs = 24;
    nodes.push(
      <text
        key="eyebrow"
        x={PAD}
        y={baseline(y, eyebrowFs)}
        fontSize={eyebrowFs}
        fontWeight={700}
        letterSpacing="0.14em"
        fill={C.textSecondary}
      >
        {data.year === null ? "ALL-TIME REVIEW" : "YEAR IN REVIEW"}
      </text>,
    );
    y += 30 + 10;

    const yearTop = y;
    const yearText = data.year === null ? "All time" : String(data.year);
    const yearFs = fitFontSize(yearText, CONTENT_W, 172, 800);
    nodes.push(
      <text
        key="year"
        x={PAD}
        y={baseline(yearTop, yearFs)}
        fontSize={yearFs}
        fontWeight={800}
        fill={C.textPrimary}
        letterSpacing="-0.02em"
      >
        {yearText}
      </text>,
    );

    // The pill sits beside the year number (not below it) so a partial year
    // doesn't need its own extra row — every scope's headline block stays
    // the same fixed height, which is what the rest of the card's vertical
    // budget below is tuned against.
    if (data.isPartial) {
      const yearWidth = measureWidth(yearText, yearFs, 800);
      const pillFs = 22;
      const pillLabel = "PARTIAL YEAR";
      const pillW = measureWidth(pillLabel, pillFs, 700) + 40;
      const pillH = 46;
      const pillX = PAD + yearWidth + 28;
      const pillY = yearTop + 67;
      nodes.push(
        <g key="partial-pill">
          <rect
            x={pillX}
            y={pillY}
            width={pillW}
            height={pillH}
            rx={pillH / 2}
            fill="none"
            stroke={C.border}
            strokeWidth={2}
          />
          <text
            x={pillX + 20}
            y={baseline(pillY + (pillH - pillFs) / 2, pillFs)}
            fontSize={pillFs}
            fontWeight={700}
            letterSpacing="0.06em"
            fill={C.textSecondary}
          >
            {pillLabel}
          </text>
        </g>,
      );
    }
    y += 180 + 28;
  }

  {
    const faceSize = 190;
    const heroIndex = Math.min(moodOrder.length - 1, Math.max(0, Math.round(data.avgMood)));
    nodes.push(
      <g key="hero-face" transform={`translate(${CX - faceSize / 2}, ${y})`}>
        <MoodFace index={heroIndex} total={moodOrder.length} size={faceSize} />
      </g>,
    );
    y += faceSize + 24;

    const word = moodOrder[heroIndex].toUpperCase();
    const wordFs = fitFontSize(word, CONTENT_W - 40, 84, 800);
    nodes.push(
      <text
        key="hero-word"
        x={CX}
        y={baseline(y, wordFs)}
        textAnchor="middle"
        fontSize={wordFs}
        fontWeight={800}
        fill={moodColor(heroIndex, moodOrder.length)}
      >
        {word}
      </text>,
    );
    y += wordFs * 1.05 + 16;

    const fractionFs = 32;
    nodes.push(
      <text
        key="hero-fraction"
        x={CX}
        y={baseline(y, fractionFs)}
        textAnchor="middle"
        fontSize={fractionFs}
        fontWeight={600}
        fill={C.textSecondary}
      >
        {(data.avgMood + 1).toFixed(2)} / {moodOrder.length}
      </text>,
    );
    y += 40;

    if (data.year !== null && data.avgMoodDeltaPct !== null) {
      const rounded = Math.round(data.avgMoodDeltaPct);
      if (rounded !== 0) {
        const deltaFs = 26;
        nodes.push(
          <text
            key="hero-delta"
            x={CX}
            y={baseline(y, deltaFs)}
            textAnchor="middle"
            fontSize={deltaFs}
            fontWeight={700}
            fill={rounded > 0 ? C.accent : C.negative}
          >
            {rounded > 0 ? "+" : ""}
            {rounded}% vs. {data.year - 1}
          </text>,
        );
        y += 34;
      }
    }
    y += 44;
  }

  {
    const gridTop = y;
    const tileGap = 20;
    const tileW = (CONTENT_W - tileGap * 3) / 4;
    const tileH = 152;
    const tilePad = 22;
    const labelFs = 19;
    const tiles = [
      { label: "ENTRIES", value: String(data.entryCount) },
      { label: "DAYS TRACKED", value: `${data.daysTracked}/${data.spanDays}` },
      { label: "ACTIVITIES", value: String(data.activityDiversity) },
      { label: "BEST DAY", value: data.bestDay ? formatShortDate(data.bestDay.date) : "—" },
    ];
    nodes.push(
      <g key="stats">
        {tiles.map((tile, i) => {
          const tx = PAD + i * (tileW + tileGap);
          const valueFs = fitFontSize(tile.value, tileW - tilePad * 2, 44, 800);
          return (
            <g key={tile.label}>
              <rect x={tx} y={gridTop} width={tileW} height={tileH} rx={24} fill={C.surface} />
              <text
                x={tx + tilePad}
                y={baseline(gridTop + tilePad, labelFs)}
                fontSize={labelFs}
                fontWeight={700}
                letterSpacing="0.03em"
                fill={C.textTertiary}
              >
                {tile.label}
              </text>
              <text
                x={tx + tilePad}
                y={gridTop + tileH - tilePad}
                fontSize={valueFs}
                fontWeight={800}
                fill={C.textPrimary}
              >
                {tile.value}
              </text>
            </g>
          );
        })}
      </g>,
    );
    y += tileH + 44;
  }

  if (data.monthlySparkline.length >= 2) {
    const labelFs = 22;
    nodes.push(
      <text
        key="spark-label"
        x={PAD}
        y={baseline(y, labelFs)}
        fontSize={labelFs}
        fontWeight={700}
        letterSpacing="0.06em"
        fill={C.textSecondary}
      >
        {data.year === null ? "MOOD ACROSS ALL TIME" : "MOOD ACROSS THE YEAR"}
      </text>,
    );
    y += 26 + 16;

    const chartTop = y;
    const chartH = 170;
    const domainMax = Math.max(1, moodOrder.length - 1);
    const values = data.monthlySparkline;
    const stepX = CONTENT_W / (values.length - 1);
    const points = values.map((v, i): [number, number] => {
      const px = PAD + i * stepX;
      const clamped = Math.min(domainMax, Math.max(0, v));
      const py = chartTop + chartH - (clamped / domainMax) * chartH;
      return [px, py];
    });
    const linePath = points
      .map((p, i) => `${i === 0 ? "M" : "L"} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`)
      .join(" ");
    const last = points[points.length - 1];
    const first = points[0];
    const areaPath = `${linePath} L ${last[0].toFixed(1)} ${chartTop + chartH} L ${first[0].toFixed(1)} ${chartTop + chartH} Z`;

    nodes.push(
      <g key="sparkline">
        <path d={areaPath} fill="url(#sparkFill)" stroke="none" />
        <path
          d={linePath}
          fill="none"
          stroke={C.accent}
          strokeWidth={5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>,
    );
    y += chartH + 44;
  }

  {
    const labelFs = 22;
    nodes.push(
      <text
        key="mix-label"
        x={PAD}
        y={baseline(y, labelFs)}
        fontSize={labelFs}
        fontWeight={700}
        letterSpacing="0.06em"
        fill={C.textSecondary}
      >
        MOOD MIX
      </text>,
    );
    y += 26 + 16;

    const barH = 44;
    const barTop = y;
    let cursorX = PAD;
    const segments: ReactNode[] = [];
    moodOrder.forEach((mood, i) => {
      const pct = data.moodPercentages[mood] ?? 0;
      const segW = (pct / 100) * CONTENT_W;
      if (segW > 0) {
        segments.push(
          <rect key={mood} x={cursorX} y={barTop} width={segW} height={barH} fill={moodColor(i, moodOrder.length)} />,
        );
      }
      cursorX += segW;
    });
    nodes.push(
      <g key="mix-bar">
        <clipPath id="mixClip">
          <rect x={PAD} y={barTop} width={CONTENT_W} height={barH} rx={barH / 2} />
        </clipPath>
        <g clipPath="url(#mixClip)">{segments}</g>
      </g>,
    );
    y += barH + 22;

    const present = moodOrder
      .map((mood, i) => ({ mood, i, pct: data.moodPercentages[mood] ?? 0 }))
      .filter((m) => m.pct > 0);
    const legendFs = 22;
    const chipW = CONTENT_W / Math.max(1, present.length);
    nodes.push(
      <g key="mix-legend">
        {present.map((m, idx) => {
          const chipX = PAD + idx * chipW;
          const dotR = 7;
          const name = truncateToWidth(m.mood, chipW - 60, legendFs, 600);
          return (
            <g key={m.mood}>
              <circle
                cx={chipX + dotR}
                cy={y + legendFs * 0.55}
                r={dotR}
                fill={moodColor(m.i, moodOrder.length)}
              />
              <text
                x={chipX + dotR * 2 + 10}
                y={baseline(y, legendFs)}
                fontSize={legendFs}
                fontWeight={600}
                fill={C.textSecondary}
              >
                {name} {Math.round(m.pct)}%
              </text>
            </g>
          );
        })}
      </g>,
    );
    y += 30 + 44;
  }

  if (data.topActivities.length > 0) {
    const labelFs = 22;
    nodes.push(
      <text
        key="act-label"
        x={PAD}
        y={baseline(y, labelFs)}
        fontSize={labelFs}
        fontWeight={700}
        letterSpacing="0.06em"
        fill={C.textSecondary}
      >
        TOP ACTIVITIES
      </text>,
    );
    y += 26 + 18;

    const maxPct = data.topActivities[0].pctDays;
    const nameFs = 30;
    const pctFs = 26;
    const unitH = 54;
    const rowGap = 18;

    data.topActivities.forEach((a, i) => {
      const rowTop = y + i * (unitH + rowGap);
      const pctText = `${Math.round(a.pctDays)}%`;
      const pctW = measureWidth(pctText, pctFs, 700);
      const name = truncateToWidth(a.activity, CONTENT_W - pctW - 24, nameFs, 600);
      const fillW = Math.max(8, (a.pctDays / maxPct) * CONTENT_W);
      const barY = rowTop + 40;
      nodes.push(
        <g key={a.activity}>
          <text x={PAD} y={baseline(rowTop, nameFs)} fontSize={nameFs} fontWeight={600} fill={C.textPrimary}>
            {name}
          </text>
          <text
            x={PAD + CONTENT_W}
            y={baseline(rowTop, pctFs)}
            textAnchor="end"
            fontSize={pctFs}
            fontWeight={700}
            fill={C.accent}
          >
            {pctText}
          </text>
          <rect x={PAD} y={barY} width={CONTENT_W} height={10} rx={5} fill={C.surface2} />
          <rect x={PAD} y={barY} width={fillW} height={10} rx={5} fill={C.accent} />
        </g>,
      );
    });

    const rows = data.topActivities.length;
    y += rows * unitH + (rows - 1) * rowGap + 40;
  }

  {
    nodes.push(
      <line key="footer-divider" x1={PAD} y1={y} x2={PAD + CONTENT_W} y2={y} stroke={C.border} strokeWidth={2} />,
    );
    y += 32;

    const madeFs = 24;
    const madeWithText = "Made with ";
    const madeWithW = measureWidth(madeWithText, madeFs, 500);
    const wordmarkW = measureWidth("Daylytics", madeFs, 800);
    const startX = CX - (madeWithW + wordmarkW) / 2;
    const by = baseline(y, madeFs);
    nodes.push(
      <g key="footer">
        <text x={startX} y={by} fontSize={madeFs} fontWeight={500} fill={C.textTertiary}>
          {madeWithText}
        </text>
        <text x={startX + madeWithW} y={by} fontSize={madeFs} fontWeight={800} fill={C.textSecondary}>
          Daylytics
        </text>
      </g>,
    );
  }

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      height="100%"
      xmlns="http://www.w3.org/2000/svg"
      style={{ fontFamily: EXPORT_FONT_SANS, display: "block" }}
    >
      <defs>
        <radialGradient id="heroGlow" cx="50%" cy="2%" r="60%">
          <stop offset="0%" stopColor={C.accent} stopOpacity={0.18} />
          <stop offset="100%" stopColor={C.accent} stopOpacity={0} />
        </radialGradient>
        <linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={C.accent} stopOpacity={0.35} />
          <stop offset="100%" stopColor={C.accent} stopOpacity={0} />
        </linearGradient>
      </defs>
      {nodes}
    </svg>
  );
}
