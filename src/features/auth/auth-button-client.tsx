"use client";

import { useSession } from "@/lib/auth-client";
import { useLocale } from "next-intl";
import type { Locale } from "@/lib/i18n/config";
import { LoggedInButton, SignInButton } from "./sign-in-button";

export const AuthButtonClient = () => {
  const session = useSession();
  const currentLocale = useLocale() as Locale;

  if (session.data?.user) {
    const user = session.data.user;
    return <LoggedInButton user={user} currentLocale={currentLocale} />;
  }

  return <SignInButton />;
};
