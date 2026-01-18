"use client";

import { format } from "date-fns";
import { X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getDateFnsLocale } from "@/lib/format/date";
import { RetrospectiveStats } from "./RetrospectiveStats";

type WarRoomModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  weekStartDate: Date;
};

/**
 * War Room modal for weekly retrospective and planning.
 * Left column: RetrospectiveStats (current PR)
 * Right column: Planning placeholder (Phase 5 Day 3)
 */
export const WarRoomModal = ({
  open,
  onOpenChange,
  weekStartDate,
}: WarRoomModalProps) => {
  const t = useTranslations();
  const locale = useLocale();
  const dateFnsLocale = getDateFnsLocale(locale);

  const formattedDate = format(weekStartDate, "d MMMM yyyy", {
    locale: dateFnsLocale,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex !h-[95vh] !w-[95vw] !max-w-[95vw] flex-col overflow-hidden rounded-none border-4 border-black bg-white p-0 lg:!h-[85vh] lg:!w-[70vw] lg:!max-w-[70vw] dark:bg-gray-950"
        aria-describedby={undefined}
      >
        <DialogHeader className="shrink-0 border-b-2 border-black p-4">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold">
              {t("weekly.warRoomModal.title", { date: formattedDate })}
            </DialogTitle>
            <DialogClose asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-8"
                aria-label={t("common.close")}
              >
                <X className="size-6" />
              </Button>
            </DialogClose>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-4 lg:p-6">
          <div className="grid h-full grid-cols-1 gap-4 lg:grid-cols-5 lg:gap-6">
            {/* Left column: Retrospective Stats - takes 3/5 of space */}
            <div className="flex flex-col gap-4 lg:col-span-3">
              <RetrospectiveStats weekStartDate={weekStartDate} />
            </div>

            {/* Right column: Planning placeholder - takes 2/5 of space */}
            <div className="flex flex-col gap-4 lg:col-span-2">
              <Card className="flex h-full flex-col rounded-none border-2 border-dashed border-gray-400">
                <CardHeader>
                  <CardTitle className="text-muted-foreground">
                    {t("weekly.warRoomModal.planning")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-1 items-center justify-center">
                  <p className="text-muted-foreground text-center text-sm">
                    {t("weekly.warRoomModal.comingSoon")}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        <DialogFooter className="shrink-0 border-t-2 border-black p-4">
          <div className="flex w-full flex-col gap-2 sm:flex-row sm:justify-end">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-none border-2"
            >
              {t("common.cancel")}
            </Button>
            <Button
              variant="outline"
              disabled
              className="rounded-none border-2"
            >
              {t("weekly.warRoomModal.generatePlanning")}
            </Button>
            <Button
              variant="default"
              onClick={() => onOpenChange(false)}
              className="rounded-none border-2"
            >
              {t("common.confirm")}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
