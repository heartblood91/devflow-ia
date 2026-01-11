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
import { ChevronDown } from "lucide-react";
import { getAccountNavigation } from "./account.links";
import type { Locale } from "@/lib/i18n/config";

type AccountSidebarProps = {
  currentLocale: Locale;
};

export function AccountSidebar({ currentLocale }: AccountSidebarProps) {
  const links: NavigationGroup[] = getAccountNavigation();

  return (
    <Sidebar variant="inset">
      <SidebarHeader>
        <Typography variant="large">Account</Typography>
      </SidebarHeader>
      <SidebarContent>
        {links.map((link) => (
          <SidebarGroup key={link.title}>
            <SidebarGroupLabel>
              {link.title}
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
