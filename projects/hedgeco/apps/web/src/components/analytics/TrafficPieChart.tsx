"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { cn } from "@/lib/utils";

interface TrafficSource {
  name: string;
  value: number;
  color?: string;
}

interface TrafficPieChartProps {
  data: TrafficSource[];
  className?: string;
  title?: string;
}

const DEFAULT_COLORS = [
  "#6366f1", // indigo-500
  "#10b981", // emerald-500
  "#f59e0b", // amber-500
  "#ec4899", // pink-500
  "#8b5cf6", // violet-500
  "#06b6d4", // cyan-500
  "#f97316", // orange-500
  "#84cc16", // lime-500
];

export function TrafficPieChart({ 
  data, 
  className,
  title = "Traffic Sources" 
}: TrafficPieChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number; payload: TrafficSource }> }) => {
    if (active && payload && payload.length) {
      const item = payload[0];
      const percentage = ((item.value / total) * 100).toFixed(1);
      return (
        <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3">
          <p className="font-semibold text-slate-900">{item.name}</p>
          <p className="text-sm text-slate-600">
            {item.value.toLocaleString()} visits ({percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  const renderCustomLegend = () => {
    return (
      <div className="grid grid-cols-2 gap-2 mt-4">
        {data.map((entry, index) => {
          const percentage = ((entry.value / total) * 100).toFixed(1);
          return (
            <div key={entry.name} className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: entry.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length] }}
              />
              <div className="min-w-0">
                <span className="text-sm font-medium text-slate-700 truncate block">
                  {entry.name}
                </span>
                <span className="text-xs text-slate-500">
                  {percentage}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold text-slate-900">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[220px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={2}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length]}
                    stroke="none"
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        {/* Center label */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ top: "calc(50% - 60px)" }}>
          <div className="text-center">
            <div className="text-2xl font-bold text-slate-900">{total.toLocaleString()}</div>
            <div className="text-xs text-slate-500">Total Visits</div>
          </div>
        </div>
        
        {renderCustomLegend()}
      </CardContent>
    </Card>
  );
}

export default TrafficPieChart;
