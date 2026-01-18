import { format, type Locale } from "date-fns";
import { enUS, fr } from "date-fns/locale";

/**
 * Map of supported locales to date-fns locale objects
 */
export const DATE_FNS_LOCALE_MAP: Record<string, Locale> = {
  en: enUS,
  fr: fr,
} as const;

/**
 * Get the date-fns locale for a given locale string
 * Falls back to enUS if the locale is not supported
 */
export const getDateFnsLocale = (locale: string): Locale => {
  return DATE_FNS_LOCALE_MAP[locale] ?? enUS;
};

export const formatDate = (date: Date) => {
  return format(date, "MMMM d, yyyy", { locale: enUS });
};
