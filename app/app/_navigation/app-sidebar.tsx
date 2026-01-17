"use client";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
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
import { ContactFeedbackPopover } from "@/features/contact/feedback/contact-feedback-popover";
import { SidebarUserButton } from "@/features/sidebar/sidebar-user-button";
import type { Locale } from "@/lib/i18n/config";
import { ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import type { PropsWithChildren } from "react";
import { useEffect, useState } from "react";
import { AppCommand } from "./app-command";
import { APP_LINKS } from "./app-navigation.links";
import { UpgradeCard } from "./upgrade-app-card";

type AppSidebarProps = {
  currentLocale: Locale;
};

export function AppSidebar({ currentLocale }: AppSidebarProps) {
  const t = useTranslations("nav");

  return (
    <Sidebar variant="inset">
      <SidebarHeader className="flex flex-col gap-2">
        <AppCommand />
      </SidebarHeader>
      <SidebarContent>
        {APP_LINKS.map((link) => (
          <ItemCollapsing
            defaultOpenStartPath={link.defaultOpenStartPath}
            key={link.title}
          >
            <SidebarGroup key={link.title}>
              <SidebarGroupLabel asChild>
                <CollapsibleTrigger>
                  {t(link.title)}
                  <ChevronDown className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180" />
                </CollapsibleTrigger>
              </SidebarGroupLabel>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarNavigationMenu link={link} />
                </SidebarGroupContent>
              </CollapsibleContent>
            </SidebarGroup>
          </ItemCollapsing>
        ))}
      </SidebarContent>
      <SidebarFooter className="flex flex-col gap-2">
        <UpgradeCard />
        <ContactFeedbackPopover />
        <SidebarUserButton currentLocale={currentLocale} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

const ItemCollapsing = (
  props: PropsWithChildren<{ defaultOpenStartPath?: string }>,
) => {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const isOpen = props.defaultOpenStartPath
    ? pathname.startsWith(props.defaultOpenStartPath)
    : true;

  useEffect(() => {
    if (isOpen) {
      setOpen(isOpen);
    }
  }, [isOpen]);

  return (
    <Collapsible
      defaultOpen={isOpen}
      onOpenChange={setOpen}
      open={open}
      className="group/collapsible"
    >
      {props.children}
    </Collapsible>
  );
};
