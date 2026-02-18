"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { cn } from "@/lib/utils";

interface EngagementDataPoint {
  action: string;
  count: number;
  previousCount?: number;
}

interface EngagementChartProps {
  data: EngagementDataPoint[];
  className?: string;
  title?: string;
  loading?: boolean;
  showComparison?: boolean;
}

const COLORS = {
  current: "#6366f1",
  previous: "#c7d2fe",
};

export function EngagementChart({
  data,
  className,
  title = "Engagement Metrics",
  loading = false,
  showComparison = false,
}: EngagementChartProps) {
  if (loading) {
    return (
      <Card className={cn("", className)}>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center">
            <div className="animate-pulse w-full h-full bg-slate-100 rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("", className)}>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
              layout="vertical"
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={true} vertical={false} />
              <XAxis
                type="number"
                tick={{ fontSize: 12, fill: "#64748b" }}
                tickLine={false}
                axisLine={{ stroke: "#e2e8f0" }}
              />
              <YAxis
                type="category"
                dataKey="action"
                tick={{ fontSize: 12, fill: "#64748b" }}
                tickLine={false}
                axisLine={{ stroke: "#e2e8f0" }}
                width={100}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                }}
                labelStyle={{ fontWeight: 600, color: "#0f172a" }}
              />
              {showComparison && (
                <Legend />
              )}
              {showComparison && (
                <Bar
                  dataKey="previousCount"
                  name="Previous Period"
                  fill={COLORS.previous}
                  radius={[0, 4, 4, 0]}
                />
              )}
              <Bar
                dataKey="count"
                name="Current Period"
                fill={COLORS.current}
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

export default EngagementChart;
