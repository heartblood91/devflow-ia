"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SidebarMenuButton } from "@/components/ui/sidebar";
import { useSession } from "@/lib/auth-client";
import { ChevronsUpDown } from "lucide-react";
import { UserDropdown } from "../auth/user-dropdown";
import type { Locale } from "@/lib/i18n/config";

type SidebarUserButtonProps = {
  currentLocale: Locale;
};

export const SidebarUserButton = ({
  currentLocale,
}: SidebarUserButtonProps) => {
  const session = useSession();
  const data = session.data?.user;

  return (
    <UserDropdown currentLocale={currentLocale}>
      <SidebarMenuButton variant="outline" className="h-12">
        <Avatar className="size-8 rounded-lg">
          <AvatarImage src={data?.image ?? ""} alt={data?.name[0]} />
          <AvatarFallback className="rounded-lg">
            {data?.name[0] ?? data?.email[0]}
          </AvatarFallback>
        </Avatar>
        <div className="grid flex-1 text-left text-sm leading-tight">
          <span className="truncate font-semibold">{data?.name}</span>
          <span className="truncate text-xs">{data?.email}</span>
        </div>
        <ChevronsUpDown className="ml-auto size-4" />
      </SidebarMenuButton>
    </UserDropdown>
  );
};
