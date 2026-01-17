import { APP_NAV_LINKS } from "@/features/navigation/app-links";
import type { NavigationGroup } from "@/features/navigation/navigation.type";
import { AlertCircle, Mail, User2 } from "lucide-react";

export const getAccountNavigation = (): NavigationGroup[] => {
  return ACCOUNT_LINKS;
};

/**
 * Account sidebar navigation groups
 * Titles and labels are i18n keys - translate with t(key) in components
 */
const ACCOUNT_LINKS: NavigationGroup[] = [
  {
    title: "yourProfile",
    links: [
      {
        href: "/account",
        Icon: User2,
        label: "profile",
      },
      {
        href: "/account/email",
        Icon: Mail,
        label: "email",
      },
      {
        href: "/account/danger",
        Icon: AlertCircle,
        label: "danger",
      },
    ],
  },
  {
    title: "app",
    links: [...APP_NAV_LINKS],
  },
];
