"use client";

import { Typography } from "@/components/nowts/typography";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import { SidebarNavigationMenu } from "@/components/ui/sidebar-utils";
import type { NavigationGroup } from "@/features/navigation/navigation.type";
import { SidebarUserButton } from "@/features/sidebar/sidebar-user-button";
import type { Locale } from "@/lib/i18n/config";
import { ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";
import { getAccountNavigation } from "./account.links";

type AccountSidebarProps = {
  currentLocale: Locale;
};

export function AccountSidebar({ currentLocale }: AccountSidebarProps) {
  const t = useTranslations("nav");
  const links: NavigationGroup[] = getAccountNavigation();

  return (
    <Sidebar variant="inset">
      <SidebarHeader>
        <Typography variant="large">{t("account")}</Typography>
      </SidebarHeader>
      <SidebarContent>
        {links.map((link) => (
          <SidebarGroup key={link.title}>
            <SidebarGroupLabel>
              {t(link.title)}
              <ChevronDown className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180" />
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarNavigationMenu link={link} />
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter className="flex flex-col gap-2">
        <SidebarUserButton currentLocale={currentLocale} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
