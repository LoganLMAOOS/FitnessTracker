import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from "recharts";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

// Sample data - would be replaced with actual workout data
const weeklyData = [
  { name: "Mon", calories: 230 },
  { name: "Tue", calories: 450 },
  { name: "Wed", calories: 320 },
  { name: "Thu", calories: 780 },
  { name: "Fri", calories: 690 },
  { name: "Sat", calories: 520 },
  { name: "Sun", calories: 710 },
];

const monthlyData = [
  { name: "Week 1", calories: 2300 },
  { name: "Week 2", calories: 3150 },
  { name: "Week 3", calories: 2800 },
  { name: "Week 4", calories: 3700 },
];

interface ProgressChartProps {
  title?: string;
}

export function ProgressChart({ title = "Your Progress" }: ProgressChartProps) {
  const [timeRange, setTimeRange] = useState<"week" | "month">("week");
  const { theme } = useTheme();
  
  const chartData = timeRange === "week" ? weeklyData : monthlyData;
  
  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-semibold text-gray-900">{title}</h2>
          <div className="flex text-sm space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setTimeRange("week")}
              className={cn(
                "rounded-full px-2.5 py-1",
                timeRange === "week" ? "bg-primary-100 text-primary" : "text-gray-500 hover:bg-gray-100"
              )}
            >
              Week
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setTimeRange("month")}
              className={cn(
                "rounded-full px-2.5 py-1",
                timeRange === "month" ? "bg-primary-100 text-primary" : "text-gray-500 hover:bg-gray-100"
              )}
            >
              Month
            </Button>
          </div>
        </div>
        <div className="h-40 mb-3">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{
                top: 5,
                right: 0,
                left: -20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} />
              <YAxis hide={true} />
              <Tooltip
                contentStyle={{
                  backgroundColor: theme === "dark" ? "#1f2937" : "#fff",
                  border: "none",
                  borderRadius: "0.5rem",
                  boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
                }}
                formatter={(value: number) => [`${value} cal`, "Calories Burned"]}
              />
              <Bar
                dataKey="calories"
                fill="hsl(var(--primary))"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
