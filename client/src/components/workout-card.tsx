import { Card, CardContent } from "@/components/ui/card";
import { Workout } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";
import { Heart, Dumbbell, SmilePlus, Brain } from "lucide-react";

interface WorkoutCardProps {
  workout: Workout;
}

export function WorkoutCard({ workout }: WorkoutCardProps) {
  const getWorkoutIcon = () => {
    if (workout.workoutType === "cardio") {
      return <Heart className="text-primary" />;
    } else {
      return <Dumbbell className="text-secondary-600" />;
    }
  };
  
  const getFormattedDate = (date: Date | string) => {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  };
  
  const formatIntensity = (intensity: string) => {
    return intensity.charAt(0).toUpperCase() + intensity.slice(1);
  };
  
  return (
    <Card className="mb-3">
      <CardContent className="p-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <div className="p-2 bg-primary-100 rounded-lg mr-3">
              {getWorkoutIcon()}
            </div>
            <div>
              <h3 className="font-medium text-gray-900">{workout.exercise}</h3>
              <p className="text-sm text-gray-500">
                {workout.duration} mins • {formatIntensity(workout.intensity)} intensity
              </p>
            </div>
          </div>
          <span className="text-xs text-gray-400">{getFormattedDate(workout.date)}</span>
        </div>
        <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-3 gap-2 text-center">
          {workout.workoutType === "cardio" ? (
            <>
              <div>
                <p className="text-xs text-gray-500">Distance</p>
                <p className="font-semibold">3.2 km</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Calories</p>
                <p className="font-semibold">{workout.caloriesBurned}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Pace</p>
                <p className="font-semibold">5'40"/km</p>
              </div>
            </>
          ) : (
            <>
              <div>
                <p className="text-xs text-gray-500">Exercises</p>
                <p className="font-semibold">1</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Sets</p>
                <p className="font-semibold">3</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Calories</p>
                <p className="font-semibold">{workout.caloriesBurned}</p>
              </div>
            </>
          )}
        </div>
        {workout.notes && (
          <div className="mt-2 text-sm text-gray-500 italic">
            "{workout.notes}"
          </div>
        )}
        
        {/* Mood display */}
        {workout.mood && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <div className="flex items-center">
              <SmilePlus className="h-4 w-4 text-blue-500 mr-1.5" />
              <p className="text-sm font-medium text-gray-700">
                Workout Mood: <span className="text-xl">{workout.mood}</span>
              </p>
            </div>
            
            {workout.moodReason && (
              <p className="mt-1 text-sm text-gray-500 ml-5.5">{workout.moodReason}</p>
            )}
            
            {/* AI Insights section */}
            {workout.aiInsights && (
              <div className="mt-2 ml-5.5 p-3 bg-purple-50 rounded-md border border-purple-100">
                <div className="flex items-start">
                  <Brain className="h-4 w-4 text-purple-600 mr-2 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="text-xs text-purple-600 font-medium">AI INSIGHT</span>
                    <p className="text-sm text-purple-800">{workout.aiInsights}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
