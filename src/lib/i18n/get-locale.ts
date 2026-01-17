import { cookies } from "next/headers";
import type { Locale } from "./config";
import { defaultLocale, locales } from "./config";

/**
 * Get the current locale from cookies (server-side)
 *
 * @description
 * Retrieves the user's locale preference from the NEXT_LOCALE cookie.
 * Falls back to the default locale if the cookie is not set or contains an invalid value.
 *
 * This function should be used in all server components that need to access the current locale.
 *
 * @example
 * // In a Server Component
 * const locale = await getLocaleFromCookies();
 *
 * @returns The current locale
 */
export const getLocaleFromCookies = async (): Promise<Locale> => {
  const cookieStore = await cookies();
  const localeCookie = cookieStore.get("NEXT_LOCALE");

  if (localeCookie?.value && locales.includes(localeCookie.value as Locale)) {
    return localeCookie.value as Locale;
  }

  return defaultLocale;
};
