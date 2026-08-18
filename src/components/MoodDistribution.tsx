import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { MoodDistributionRow } from "../types";
import { Card } from "./Card";
import { moodColor } from "../lib/color";

export function MoodDistribution({
  rows,
  moodOrder,
}: {
  rows: MoodDistributionRow[];
  moodOrder: string[];
}) {
  const data = rows.map((row) => ({
    year: String(row.year),
    ...row.percentages,
  }));

  return (
    <Card
      title="Mood composition"
      subtitle="How the mix of mood states shifted year to year"
    >
      <div className="h-72 w-full">
        <ResponsiveContainer>
          <BarChart data={data} margin={{ left: 8, right: 10 }}>
            <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="year"
              tick={{ fill: "var(--color-text-secondary)", fontSize: 12 }}
              axisLine={{ stroke: "var(--color-border)" }}
              tickLine={false}
            />
            <YAxis
              domain={[0, 100]}
              ticks={[0, 25, 50, 75, 100]}
              tick={{ fill: "var(--color-text-secondary)", fontSize: 11 }}
              tickFormatter={(v: number) => `${v}%`}
              axisLine={false}
              tickLine={false}
              width={44}
            />
            <Tooltip
              contentStyle={{
                background: "var(--color-surface-2)",
                border: "1px solid var(--color-border)",
                borderRadius: 12,
              }}
              formatter={(value: number) => `${value.toFixed(0)}%`}
            />
            <Legend wrapperStyle={{ fontSize: 12, color: "var(--color-text-secondary)" }} />
            {moodOrder.map((mood, i) => (
              <Bar
                key={mood}
                dataKey={mood}
                stackId="mood"
                fill={moodColor(i, moodOrder.length)}
                radius={i === moodOrder.length - 1 ? [6, 6, 0, 0] : 0}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
