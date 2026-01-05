import { combineWithParentMetadata } from "@/lib/metadata";
import { AccountLayout } from "../account-layout";
import { ChangePasswordForm } from "./change-password-form";

export const generateMetadata = combineWithParentMetadata({
  title: "Change Password",
  description: "Update your password to keep your account secure.",
});

export default function ChangePasswordPage() {
  return (
    <AccountLayout>
      <div className="flex flex-col gap-4 lg:gap-8">
        <ChangePasswordForm />
      </div>
    </AccountLayout>
  );
}
