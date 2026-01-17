import { APP_NAV_LINKS } from "@/features/navigation/app-links";
import type { NavigationGroup } from "@/features/navigation/navigation.type";

export const APP_LINKS: NavigationGroup[] = [
  {
    title: "Menu",
    links: [...APP_NAV_LINKS],
  },
] satisfies NavigationGroup[];
