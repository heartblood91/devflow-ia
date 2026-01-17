"use client";

import { Toaster } from "@/components/ui/sonner";
import { DialogManagerRenderer } from "@/features/dialog-manager/dialog-manager-renderer";
import { GlobalDialogLazy } from "@/features/global-dialog/global-dialog-lazy";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { ThemeProvider } from "next-themes";
import type { PropsWithChildren } from "react";
import { NextIntlClientProvider } from "next-intl";

const queryClient = new QueryClient();

type ProvidersProps = PropsWithChildren<{
  locale: string;
  messages: Record<string, unknown>;
}>;

export const Providers = ({ children, locale, messages }: ProvidersProps) => {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <NextIntlClientProvider locale={locale} messages={messages}>
        <QueryClientProvider client={queryClient}>
          <Toaster />
          <DialogManagerRenderer />
          <GlobalDialogLazy />
          {children}
          {process.env.NODE_ENV === "development" && (
            <ReactQueryDevtools initialIsOpen={false} />
          )}
        </QueryClientProvider>
      </NextIntlClientProvider>
    </ThemeProvider>
  );
};
