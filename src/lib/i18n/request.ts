import { getRequestConfig } from "next-intl/server";
import { getLocaleFromCookies } from "./get-locale";

export default getRequestConfig(async () => {
  const locale = await getLocaleFromCookies();

  return {
    locale,
    messages: (await import(`../../../locales/${locale}.json`)).default,
    timeZone: "Europe/Paris",
    now: new Date(),
  };
});
