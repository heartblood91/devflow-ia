import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Layout } from "@/features/page/layout";
import type { PropsWithChildren } from "react";
import { getLocale } from "next-intl/server";
import { AdminSidebar } from "./admin-sidebar";
import type { Locale } from "@/lib/i18n/config";

export async function AdminNavigation({ children }: PropsWithChildren) {
  const currentLocale = (await getLocale()) as Locale;

  return (
    <SidebarProvider>
      <AdminSidebar currentLocale={currentLocale} />
      <SidebarInset className="border-accent border">
        <header className="flex h-16 shrink-0 items-center gap-2">
          <Layout size="lg" className="flex items-center gap-2">
            <SidebarTrigger
              size="lg"
              variant="outline"
              className="size-9 cursor-pointer"
            />
            <div className="flex items-center gap-2">
              <span className="font-semibold">Admin Panel</span>
            </div>
          </Layout>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
