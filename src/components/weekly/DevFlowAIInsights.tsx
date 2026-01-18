"use client";

import { useState, useEffect, useTransition } from "react";
import { useTranslations } from "next-intl";
import { MessageCircle, Sparkles } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { generateWeeklyInsightsAction } from "@/lib/actions/generateWeeklyInsights.action";
import { resolveActionResult } from "@/lib/actions/actions-utils";
import type { WeeklyStats } from "@/lib/stats/calculateWeeklyStats";

type DevFlowAIInsightsProps = {
  stats: WeeklyStats | null;
};

/**
 * Display AI-generated insights based on weekly statistics.
 * Features a border-l-4 accent style with MessageCircle icons.
 */
export const DevFlowAIInsights = ({ stats }: DevFlowAIInsightsProps) => {
  const t = useTranslations("weekly.aiInsights");
  const [insights, setInsights] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [_isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!stats) return;

    let mounted = true;
    setIsLoading(true);

    const fetchInsights = async () => {
      try {
        const result = await resolveActionResult(
          generateWeeklyInsightsAction({ stats }),
        );
        if (mounted) {
          setInsights(result.insights);
        }
      } catch {
        // Fallback insights will be shown via getFallbackInsights()
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    startTransition(() => {
      void fetchInsights();
    });

    return () => {
      mounted = false;
    };
  }, [stats]);

  return (
    <Card className="rounded-none border-2 border-l-4 border-l-blue-500 bg-gray-50 dark:bg-gray-900">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="size-5 text-blue-500" aria-hidden="true" />
          {t("title")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="size-5 animate-pulse rounded bg-blue-200 dark:bg-blue-800" />
                <div className="h-5 flex-1 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
              </div>
            ))}
          </div>
        ) : (
          <ul className="flex flex-col gap-3" aria-label={t("title")}>
            {(insights.length > 0
              ? insights
              : [
                  t("fallback.unableToGenerate"),
                  t("fallback.checkStats"),
                  t("fallback.keepTracking"),
                ]
            ).map((insight, index) => (
              <li key={index} className="flex items-start gap-3">
                <MessageCircle
                  className="mt-0.5 size-5 shrink-0 text-blue-500"
                  aria-hidden="true"
                />
                <span className="text-sm">{insight}</span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
};
