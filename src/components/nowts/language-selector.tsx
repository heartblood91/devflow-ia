"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { locales, localeNames, type Locale } from "@/lib/i18n/config";
import { setLocaleAction } from "@/lib/actions/locale.action";
import { resolveActionResult } from "@/lib/actions/actions-utils";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type LanguageSelectorProps = {
  currentLocale: Locale;
};

export const LanguageSelector = ({ currentLocale }: LanguageSelectorProps) => {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleLocaleChange = (locale: string) => {
    startTransition(async () => {
      try {
        await resolveActionResult(
          setLocaleAction({ locale: locale as Locale }),
        );
        router.refresh();
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to change language",
        );
      }
    });
  };

  return (
    <Select
      value={currentLocale}
      onValueChange={handleLocaleChange}
      disabled={isPending}
    >
      <SelectTrigger className="w-[140px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {locales.map((locale) => (
          <SelectItem key={locale} value={locale}>
            {localeNames[locale]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
