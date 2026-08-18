import {
  Area,
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { MonthlyMoodPoint, YearlyMoodReference } from "../types";
import { Card } from "./Card";
import { MoodFace } from "./MoodFace";

/** "2024-01" -> "Jan '24" — a bare month number repeats every year, so the
 * year has to be on the tick itself rather than left to context. */
function formatMonthTick(monthKey: string): string {
  const [year, month] = monthKey.split("-").map(Number);
  const label = new Date(year, month - 1, 1).toLocaleDateString(undefined, { month: "short" });
  return `${label} '${String(year).slice(-2)}`;
}

function MoodAxisTick({
  x,
  y,
  payload,
  moodOrder,
}: {
  x?: number;
  y?: number;
  payload?: { value: number };
  moodOrder: string[];
}) {
  if (x === undefined || y === undefined || !payload) return null;
  const index = Math.round(payload.value);
  if (index < 0 || index >= moodOrder.length) return null;
  const size = 22;
  return (
    <g transform={`translate(${Math.max(0, x - size)}, ${y - size / 2})`}>
      <MoodFace index={index} total={moodOrder.length} size={size} />
    </g>
  );
}

export function MoodTimeline({
  monthlyMood,
  yearlyReferences,
  moodOrder,
}: {
  monthlyMood: MonthlyMoodPoint[];
  yearlyReferences: YearlyMoodReference[];
  moodOrder: string[];
}) {
  const bestColor = "var(--color-accent)";
  const wordsColor = "var(--color-info)";

  return (
    <Card
      title="Mood over time"
      subtitle="Monthly average mood, with a 3-month moving average and words written per month"
    >
      <div className="h-80 w-full">
        <ResponsiveContainer>
          <ComposedChart data={monthlyMood} margin={{ left: 8, right: 8, top: 8 }}>
            <defs>
              <linearGradient id="moodAreaFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={bestColor} stopOpacity={0.35} />
                <stop offset="100%" stopColor={bestColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="month"
              tick={{ fill: "var(--color-text-secondary)", fontSize: 11 }}
              tickFormatter={formatMonthTick}
              axisLine={{ stroke: "var(--color-border)" }}
              tickLine={false}
              minTickGap={24}
            />
            <YAxis
              yAxisId="mood"
              domain={[0, moodOrder.length - 1]}
              ticks={moodOrder.map((_, i) => i)}
              tick={<MoodAxisTick moodOrder={moodOrder} />}
              axisLine={false}
              tickLine={false}
              width={40}
            />
            <YAxis
              yAxisId="words"
              orientation="right"
              domain={[0, (max: number) => Math.ceil(max * 1.25) || 1]}
              tick={{ fill: wordsColor, fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              width={34}
            />
            <Tooltip
              contentStyle={{
                background: "var(--color-surface-2)",
                border: "1px solid var(--color-border)",
                borderRadius: 12,
              }}
              labelStyle={{ color: "var(--color-text-primary)" }}
              formatter={(value: number, name: string) =>
                name === "Words written"
                  ? [value, name]
                  : [moodOrder[Math.round(value)] ?? value.toFixed(2), name]
              }
            />
            <Legend
              wrapperStyle={{ fontSize: 12, color: "var(--color-text-secondary)" }}
              iconType="circle"
              iconSize={8}
            />
            {yearlyReferences.map((ref) => (
              <ReferenceLine
                key={ref.year}
                yAxisId="mood"
                y={ref.avgMood}
                stroke="var(--color-text-tertiary)"
                strokeDasharray="4 4"
                label={{
                  value: String(ref.year),
                  position: "insideTopLeft",
                  fill: "var(--color-text-tertiary)",
                  fontSize: 10,
                }}
              />
            ))}
            <Bar
              yAxisId="words"
              dataKey="totalWords"
              name="Words written"
              fill={wordsColor}
              fillOpacity={0.28}
              radius={[3, 3, 0, 0]}
              barSize={10}
            />
            <Line
              yAxisId="mood"
              type="monotone"
              dataKey="avgMood"
              name="Monthly average"
              stroke="var(--color-text-tertiary)"
              strokeWidth={1.25}
              dot={false}
            />
            <Area
              yAxisId="mood"
              type="monotone"
              dataKey="movingAvg3"
              name="3-month moving average"
              stroke={bestColor}
              strokeWidth={2.5}
              fill="url(#moodAreaFill)"
              dot={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
