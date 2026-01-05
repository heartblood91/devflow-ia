import { combineWithParentMetadata } from "@/lib/metadata";
import { AccountLayout } from "../account-layout";
import { ChangeEmailForm } from "./change-email-form";

export const generateMetadata = combineWithParentMetadata({
  title: "Change Email",
  description: "Update your email address.",
});

export default function ChangeEmailPage() {
  return (
    <AccountLayout>
      <div className="flex flex-col gap-4 lg:gap-8">
        <ChangeEmailForm />
      </div>
    </AccountLayout>
  );
}
