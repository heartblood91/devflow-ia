import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Layout } from "@/features/page/layout";
import type { PropsWithChildren } from "react";
import { getLocale } from "next-intl/server";
import { AccountSidebar } from "./account-sidebar";
import type { Locale } from "@/lib/i18n/config";

export async function AccountNavigation({ children }: PropsWithChildren) {
  const currentLocale = (await getLocale()) as Locale;

  return (
    <SidebarProvider>
      <AccountSidebar currentLocale={currentLocale} />
      <SidebarInset className="border-accent border">
        <header className="flex h-16 shrink-0 items-center gap-2">
          <Layout size="lg">
            <SidebarTrigger className="-ml-1" />
          </Layout>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
