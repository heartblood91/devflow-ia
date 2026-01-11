import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Layout } from "@/features/page/layout";
import type { PropsWithChildren } from "react";
import { AppBreadcrumb } from "./app-breadcrumb";
import { AppSidebar } from "./app-sidebar";
import { cookies } from "next/headers";
import { defaultLocale, locales, type Locale } from "@/lib/i18n/config";

export async function AppNavigation({ children }: PropsWithChildren) {
  // Get locale from cookie (server-side)
  const cookieStore = await cookies();
  const localeCookie = cookieStore.get("NEXT_LOCALE");
  const locale =
    localeCookie?.value && locales.includes(localeCookie.value as Locale)
      ? (localeCookie.value as Locale)
      : defaultLocale;

  return (
    <SidebarProvider>
      <AppSidebar currentLocale={locale} />
      <SidebarInset className="border-accent border">
        <header className="flex h-16 shrink-0 items-center gap-2">
          <Layout size="lg" className="flex items-center gap-2">
            <SidebarTrigger
              size="lg"
              variant="outline"
              className="size-9 cursor-pointer"
            />
            <AppBreadcrumb />
          </Layout>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
