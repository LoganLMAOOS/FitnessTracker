import { Card, CardContent } from "@/components/ui/card";
import { Goal } from "@shared/schema";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { Terminal, Flame } from "lucide-react";

interface GoalCardProps {
  goal: Goal;
}

export function GoalCard({ goal }: GoalCardProps) {
  const getGoalIcon = () => {
    if (goal.unit === "km") {
      return <Terminal className="text-primary" />;
    } else if (goal.unit === "calories") {
      return <Flame className="text-secondary-600" />;
    } else {
      return <Flame className="text-secondary-600" />;
    }
  };
  
  const getGoalStatus = () => {
    const percentage = (goal.progress / goal.target) * 100;
    
    if (goal.isCompleted) {
      return {
        text: "Completed",
        bgClass: "bg-green-100",
        textClass: "text-green-700"
      };
    } else if (percentage >= 75) {
      return {
        text: "On Track",
        bgClass: "bg-secondary-100",
        textClass: "text-secondary-700"
      };
    } else if (percentage >= 25) {
      return {
        text: "In Progress",
        bgClass: "bg-yellow-100",
        textClass: "text-yellow-700"
      };
    } else {
      return {
        text: "Behind",
        bgClass: "bg-red-100",
        textClass: "text-red-700"
      };
    }
  };
  
  const percentage = Math.round((goal.progress / goal.target) * 100);
  const status = getGoalStatus();
  
  return (
    <Card className="mb-3">
      <CardContent className="p-4">
        <div className="flex justify-between mb-2">
          <div className="flex items-center">
            <div className="p-2 bg-primary-100 rounded-lg mr-3">
              {getGoalIcon()}
            </div>
            <div>
              <h3 className="font-medium text-gray-900">{goal.title}</h3>
              <p className="text-sm text-gray-500">{goal.target} {goal.unit}</p>
            </div>
          </div>
          <div className="text-right">
            <span className={cn(
              "text-xs px-2 py-0.5 rounded-full",
              status.bgClass,
              status.textClass
            )}>
              {status.text}
            </span>
          </div>
        </div>
        <div className="mt-2">
          <Progress value={percentage} className="h-2.5" />
          <div className="flex justify-between mt-1">
            <span className="text-xs text-gray-500">{goal.progress} {goal.unit} completed</span>
            <span className="text-xs text-gray-500">{goal.target - goal.progress} {goal.unit} remaining</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
