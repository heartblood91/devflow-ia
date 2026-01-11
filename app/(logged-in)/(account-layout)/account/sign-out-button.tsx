"use client";

import { LoadingButton } from "@/features/form/submit-button";
import { authClient } from "@/lib/auth-client";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

export const SignOutButton = () => {
  const router = useRouter();

  const signOutMutation = useMutation({
    mutationFn: async () => {
      await authClient.signOut();
    },
    onSuccess: () => {
      // Use router.push for proper client-side navigation
      router.push("/auth/signin");
    },
  });

  return (
    <LoadingButton
      onClick={() => signOutMutation.mutate()}
      loading={signOutMutation.isPending}
    >
      Sign out
    </LoadingButton>
  );
};
