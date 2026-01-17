import { APP_NAV_LINKS } from "@/features/navigation/app-links";
import type { NavigationGroup } from "@/features/navigation/navigation.type";

/**
 * App sidebar navigation groups
 * Titles are i18n keys - translate with t(title) in components
 */
export const APP_LINKS: NavigationGroup[] = [
  {
    title: "menu",
    links: [...APP_NAV_LINKS],
  },
] satisfies NavigationGroup[];
