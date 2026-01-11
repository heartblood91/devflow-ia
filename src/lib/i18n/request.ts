import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";
import type { Locale } from "./config";
import { defaultLocale, locales } from "./config";

export default getRequestConfig(async () => {
  // Get locale from cookie or use default
  const cookieStore = await cookies();
  const localeCookie = cookieStore.get("NEXT_LOCALE");
  const locale =
    localeCookie?.value && locales.includes(localeCookie.value as Locale)
      ? (localeCookie.value as Locale)
      : defaultLocale;

  return {
    locale,
    messages: (await import(`../../../locales/${locale}.json`)).default,
  };
});
