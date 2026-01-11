import type { RenderOptions } from "@testing-library/react";
import { render } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import type { ReactElement } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NextIntlClientProvider } from "next-intl";
import enMessages from "../locales/en.json";

export const setup = (
  jsx: ReactElement,
  options?: Omit<RenderOptions, "queries">,
) => {
  // Create a new QueryClient for each test
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  });

  // Wrap component with QueryClientProvider and NextIntlClientProvider
  const wrappedJsx = (
    <QueryClientProvider client={queryClient}>
      <NextIntlClientProvider locale="en" messages={enMessages}>
        {jsx}
      </NextIntlClientProvider>
    </QueryClientProvider>
  );

  return {
    user: userEvent.setup(),
    ...render(wrappedJsx, options),
    queryClient, // Also expose the queryClient in case tests need to interact with it
  };
};
