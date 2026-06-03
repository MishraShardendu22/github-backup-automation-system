"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type MetricsChartPoint = {
  date: string;
  successful: number;
  failed: number;
  duration: number;
  total: number;
};

interface MetricsChartsProps {
  data: MetricsChartPoint[];
}

const tooltipStyle = {
  background: "#fff",
  border: "1px solid #d9e0e7",
  borderRadius: 8,
  fontSize: 12,
  boxShadow: "0 10px 24px rgba(15, 23, 42, 0.08)",
};

export default function MetricsCharts({ data }: MetricsChartsProps) {
  return (
    <div className="split-grid">
      <section className="card chart-card">
        <div className="section-title">Success vs failure</div>
        <div className="chart-frame">
          <ResponsiveContainer
            width="100%"
            height="100%"
            minWidth={0}
            minHeight={220}
          >
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e1e7ef" />
              <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={11} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="successful" fill="#0f766e" radius={[4, 4, 0, 0]} />
              <Bar dataKey="failed" fill="#dc2626" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="card chart-card">
        <div className="section-title">Duration trend</div>
        <div className="chart-frame">
          <ResponsiveContainer
            width="100%"
            height="100%"
            minWidth={0}
            minHeight={220}
          >
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e1e7ef" />
              <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={11} />
              <Tooltip contentStyle={tooltipStyle} />
              <Area
                type="monotone"
                dataKey="duration"
                stroke="#1e293b"
                fill="rgba(15, 118, 110, 0.12)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}
