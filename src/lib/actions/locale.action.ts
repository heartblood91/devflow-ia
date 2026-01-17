"use server";

import { cookies } from "next/headers";
import { action } from "./safe-actions";
import { z } from "zod";
import { locales } from "../i18n/config";

const SetLocaleSchema = z.object({
  locale: z.enum(locales),
});

/**
 * Set the user's locale preference
 *
 * @description
 * Stores the selected locale in a cookie for next-intl to use
 */
export const setLocaleAction = action
  .schema(SetLocaleSchema)
  .action(async ({ parsedInput: { locale } }) => {
    const cookieStore = await cookies();
    cookieStore.set("NEXT_LOCALE", locale, {
      maxAge: 365 * 24 * 60 * 60, // 1 year
      path: "/",
    });

    return { success: true, locale };
  });
