import { getUser } from "@/lib/user/get-user";
import { redirect } from "next/navigation";

/**
 * DevFlow Root Page
 *
 * Redirects based on authentication status:
 * - Logged in → /app (main app)
 * - Not logged in → /auth/signin
 *
 * No public landing page for MVP
 */
export default async function RootPage() {
  const user = await getUser();

  if (user) {
    redirect("/app");
  }

  redirect("/auth/signin");
}
