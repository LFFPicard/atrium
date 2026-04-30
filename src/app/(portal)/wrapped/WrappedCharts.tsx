'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

export interface MonthPoint {
  month: string;
  plays: number;
}

const tooltipStyle: React.CSSProperties = {
  background: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: 8,
  color: 'var(--color-text)',
  fontSize: 12,
};

export function MonthlyBarChart({ data }: { data: MonthPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={160}>
      <BarChart data={data} margin={{ top: 4, right: 0, left: -24, bottom: 0 }}>
        <XAxis
          dataKey="month"
          tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }}
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
        />
        <Tooltip
          contentStyle={tooltipStyle}
          cursor={{ fill: 'var(--color-accent)', opacity: 0.1 }}
        />
        <Bar
          dataKey="plays"
          fill="var(--color-accent)"
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
