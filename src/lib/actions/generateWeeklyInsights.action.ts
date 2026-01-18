"use server";

/**
 * Server Action for generating AI-powered weekly insights
 *
 * Analyzes weekly productivity stats and returns actionable insights
 * using OpenAI GPT-4o-mini.
 */

import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";
import { authAction } from "@/lib/actions/safe-actions";
import { GenerateWeeklyInsightsSchema } from "./generateWeeklyInsights.schema";
import type { WeeklyStats } from "@/lib/stats/calculateWeeklyStats";
import { logger } from "@/lib/logger";

const model = openai("gpt-4o-mini");

const buildPrompt = (stats: WeeklyStats): string => {
  const completionRate =
    stats.totalTasks > 0
      ? Math.round((stats.completedTasks / stats.totalTasks) * 100)
      : 0;

  const hoursUsageRate =
    stats.maxHours > 0
      ? Math.round((stats.totalHours / stats.maxHours) * 100)
      : 0;

  return `You are DevFlow AI, a productivity assistant for developers. Analyze these weekly stats and provide exactly 3 short, actionable insights.

## Weekly Stats
- Tasks completed: ${stats.completedTasks}/${stats.totalTasks} (${completionRate}% completion rate)
- Hours worked: ${stats.totalHours}/${stats.maxHours}h (${hoursUsageRate}% capacity)
- Rescue slots used: ${stats.rescueUsed}/${stats.rescueMax}
- Tasks skipped: ${stats.skippedTasks}
- Focus quality: ${stats.avgFocusQuality > 0 ? `${stats.avgFocusQuality}/10` : "Not tracked"}
- Energy level: ${stats.avgEnergyLevel > 0 ? `${stats.avgEnergyLevel}/10` : "Not tracked"}

## Rules
- Be concise (1 sentence each)
- Be actionable and specific
- Be friendly and dev-oriented
- No corporate bullshit
- Format: Return exactly 3 insights, one per line, starting with an emoji

Example format:
🎯 You crushed 90% of tasks - keep that momentum going next week!
⚡ Consider using rescue slots earlier when tasks pile up
📊 Try tracking focus quality to spot patterns`;
};

const parseInsights = (text: string): string[] => {
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  // Take exactly 3 insights, or pad with fallback if fewer
  const insights = lines.slice(0, 3);

  while (insights.length < 3) {
    insights.push("📊 Track more data next week for better insights");
  }

  return insights;
};

export const generateWeeklyInsightsAction = authAction
  .inputSchema(GenerateWeeklyInsightsSchema)
  .action(async ({ parsedInput: { stats } }) => {
    try {
      const result = await generateText({
        model,
        prompt: buildPrompt(stats as WeeklyStats),
        temperature: 0.7,
        maxOutputTokens: 300,
      });

      return {
        insights: parseInsights(result.text),
        success: true,
      };
    } catch (error) {
      // Return fallback insights on API error
      logger.error("Failed to generate insights:", error);

      return {
        insights: [
          "📊 AI insights temporarily unavailable",
          "💡 Review your completed tasks to spot patterns",
          "🎯 Set clear priorities for next week",
        ],
        success: false,
      };
    }
  });
