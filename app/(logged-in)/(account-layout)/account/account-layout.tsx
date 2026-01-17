import {
  Layout,
  LayoutActions,
  LayoutContent,
  LayoutHeader,
  LayoutTitle,
} from "@/features/page/layout";
import type { ReactNode } from "react";
import { SignOutButton } from "./sign-out-button";

type AccountLayoutProps = {
  children: ReactNode;
};

export async function AccountLayout({ children }: AccountLayoutProps) {
  return (
    <Layout size="lg">
      <LayoutHeader>
        <LayoutTitle>Settings</LayoutTitle>
      </LayoutHeader>
      <LayoutActions>
        <SignOutButton />
      </LayoutActions>
      <LayoutContent>{children}</LayoutContent>
    </Layout>
  );
}
