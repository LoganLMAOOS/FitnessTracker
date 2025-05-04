import OpenAI from "openai";

// The newest OpenAI model is "gpt-4o" which was released May 13, 2024. Do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Generates insights about workout mood patterns
 * 
 * @param workouts Array of user's workouts with mood data
 * @returns AI-generated insights about mood patterns
 */
export async function generateMoodInsights(workouts: any[]) {
  if (!workouts || workouts.length < 2) {
    return "Track more workouts to get AI-powered mood insights.";
  }

  // Filter only workouts with mood data
  const workoutsWithMood = workouts.filter(workout => workout.mood);
  
  if (workoutsWithMood.length < 2) {
    return "Add mood to more workouts to get personalized insights.";
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // Latest model
      messages: [
        {
          role: "system", 
          content: `You are a fitness psychology expert that analyzes workout mood patterns.
          Provide short, insightful observations about the user's workout moods.
          Focus on patterns related to workout types, intensity, duration, and emotional responses.
          Be encouraging, motivational, and practical - suggest small actionable tips based on patterns.
          Keep the insights concise (maximum 2-3 sentences) and digestible.`
        },
        {
          role: "user",
          content: `Analyze these workout entries with mood data and provide insights:
          ${JSON.stringify(workoutsWithMood)}`
        }
      ],
      max_tokens: 200,
      temperature: 0.7,
    });

    return response.choices[0].message.content.trim();
  } catch (error) {
    console.error("Error generating mood insights:", error);
    return "Unable to generate insights at this time. Please try again later.";
  }
}

/**
 * Quick analysis of a single workout mood
 * 
 * @param workout Single workout with mood data
 * @returns Quick analysis of the workout mood
 */
export async function analyzeWorkoutMood(workout: any) {
  if (!workout || !workout.mood) {
    return "";
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // Latest model
      messages: [
        {
          role: "system", 
          content: `You are a fitness coach that provides brief, positive workout mood analysis.
          Provide a single sentence response about what the user's mood might indicate.
          Be encouraging and keep responses very short and practical.`
        },
        {
          role: "user",
          content: `Analyze this workout entry with mood data and provide a quick insight:
          Workout Type: ${workout.workoutType}
          Exercise: ${workout.exercise}
          Duration: ${workout.duration} minutes
          Intensity: ${workout.intensity}
          Mood: ${workout.mood}
          Mood Reason: ${workout.moodReason || "Not provided"}`
        }
      ],
      max_tokens: 100,
      temperature: 0.7,
    });

    return response.choices[0].message.content.trim();
  } catch (error) {
    console.error("Error analyzing workout mood:", error);
    return "";
  }
}