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
        className="max-h-[90vh] w-full max-w-6xl overflow-y-auto rounded-none border-4 border-black bg-white p-0 sm:max-h-[85vh] md:h-auto dark:bg-gray-950"
        aria-describedby={undefined}
      >
        <DialogHeader className="border-b-2 border-black p-4">
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

        <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-2">
          {/* Left column: Retrospective Stats */}
          <div className="flex flex-col gap-4">
            <RetrospectiveStats weekStartDate={weekStartDate} />
          </div>

          {/* Right column: Planning placeholder */}
          <div className="flex flex-col gap-4">
            <Card className="rounded-none border-2 border-dashed border-gray-400">
              <CardHeader>
                <CardTitle className="text-muted-foreground">
                  {t("weekly.warRoomModal.planning")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center text-sm">
                  {t("weekly.warRoomModal.comingSoon")}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        <DialogFooter className="border-t-2 border-black p-4">
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
