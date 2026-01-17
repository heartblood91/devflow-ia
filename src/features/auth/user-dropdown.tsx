"use client";

import { Typography } from "@/components/nowts/typography";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSession } from "@/lib/auth-client";
import {
  Languages,
  LayoutDashboard,
  Monitor,
  Moon,
  Settings,
  Shield,
  SunMedium,
  SunMoon,
} from "lucide-react";

import { useTheme } from "next-themes";
import Link from "next/link";
import type { PropsWithChildren } from "react";
import { UserDropdownLogout } from "./user-dropdown-logout";
import { UserDropdownStopImpersonating } from "./user-dropdown-stop-impersonating";
import { locales, localeNames, type Locale } from "@/lib/i18n/config";
import { setLocaleAction } from "@/lib/actions/locale.action";
import { resolveActionResult } from "@/lib/actions/actions-utils";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type UserDropdownProps = PropsWithChildren<{
  currentLocale: Locale;
}>;

export const UserDropdown = ({
  children,
  currentLocale,
}: UserDropdownProps) => {
  const session = useSession();
  const theme = useTheme();
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleLocaleChange = (locale: Locale) => {
    startTransition(async () => {
      try {
        await resolveActionResult(setLocaleAction({ locale }));
        router.refresh();
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to change language",
        );
      }
    });
  };

  if (!session.data?.user) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuLabel>
          {session.data.user.name ? (
            <>
              <Typography variant="small">
                {session.data.user.name || session.data.user.email}
              </Typography>
              <Typography variant="muted">{session.data.user.email}</Typography>
            </>
          ) : (
            <Typography variant="small">{session.data.user.email}</Typography>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/orgs">
            <LayoutDashboard className="mr-2 size-4" />
            Dashboard
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/account">
            <Settings className="mr-2 size-4" />
            Account Settings
          </Link>
        </DropdownMenuItem>
        {session.data.user.role === "admin" && (
          <DropdownMenuItem asChild>
            <Link href="/admin">
              <Shield className="mr-2 size-4" />
              Admin
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <SunMoon className="text-muted-foreground mr-4 size-4" />
            <span>Theme</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuPortal>
            <DropdownMenuSubContent>
              <DropdownMenuItem onClick={() => theme.setTheme("dark")}>
                <SunMedium className="mr-2 size-4" />
                <span>Dark</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => theme.setTheme("light")}>
                <Moon className="mr-2 size-4" />
                <span>Light</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => theme.setTheme("system")}>
                <Monitor className="mr-2 size-4" />
                <span>System</span>
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuPortal>
        </DropdownMenuSub>

        <DropdownMenuSub>
          <DropdownMenuSubTrigger disabled={isPending}>
            <Languages className="text-muted-foreground mr-4 size-4" />
            <span>Language</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuPortal>
            <DropdownMenuSubContent>
              {locales.map((locale) => (
                <DropdownMenuItem
                  key={locale}
                  onClick={() => handleLocaleChange(locale)}
                  disabled={isPending}
                >
                  {currentLocale === locale && <span className="mr-2">✓</span>}
                  <span className={currentLocale !== locale ? "ml-6" : ""}>
                    {localeNames[locale]}
                  </span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuPortal>
        </DropdownMenuSub>

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <UserDropdownLogout />
          {session.data.session.impersonatedBy ? (
            <UserDropdownStopImpersonating />
          ) : null}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
