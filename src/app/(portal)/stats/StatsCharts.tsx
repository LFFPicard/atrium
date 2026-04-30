'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';

export interface LinePoint {
  date: string;
  TV: number;
  Movies: number;
}

export interface PlatformPoint {
  platform: string;
  plays: number;
}

const tooltipStyle = {
  background: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: 8,
  fontSize: 12,
  color: 'var(--color-text)',
};

export function PlaysLineChart({ data }: { data: LinePoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fill: 'var(--color-text-muted)', fontSize: 10 }}
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fill: 'var(--color-text-muted)', fontSize: 10 }}
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
        />
        <Tooltip contentStyle={tooltipStyle} />
        <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
        <Line
          type="monotone"
          dataKey="TV"
          stroke="var(--color-accent)"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4 }}
        />
        <Line
          type="monotone"
          dataKey="Movies"
          stroke="#f59e0b"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function PlatformBarChart({ data }: { data: PlatformPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={Math.max(100, data.length * 42)}>
      <BarChart layout="vertical" data={data} margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
        <XAxis
          type="number"
          tick={{ fill: 'var(--color-text-muted)', fontSize: 10 }}
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
        />
        <YAxis
          type="category"
          dataKey="platform"
          width={120}
          tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip contentStyle={tooltipStyle} />
        <Bar dataKey="plays" fill="var(--color-accent)" radius={[0, 4, 4, 0]} maxBarSize={24} />
      </BarChart>
    </ResponsiveContainer>
  );
}
