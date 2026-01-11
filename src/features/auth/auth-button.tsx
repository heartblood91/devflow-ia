import { getUser } from "@/lib/auth/auth-user";
import { getLocale } from "next-intl/server";
import type { Locale } from "@/lib/i18n/config";
import { LoggedInButton, SignInButton } from "./sign-in-button";

export const AuthButton = async () => {
  const user = await getUser();
  const currentLocale = (await getLocale()) as Locale;

  if (user) {
    return <LoggedInButton user={user} currentLocale={currentLocale} />;
  }

  return <SignInButton />;
};
