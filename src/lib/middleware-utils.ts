import { auth } from "@/lib/auth";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export const handleRootRedirect = (_request: NextRequest) => {
  // DevFlow: Let app/page.tsx handle the redirect logic
  // This allows for server-side user check and proper redirect
  return null;
};

export const isAppRoute = (pathname: string) => {
  return pathname.startsWith("/app/app");
};

export const isAdminRoute = (pathname: string) => {
  return pathname.startsWith("/app/admin");
};

export const validateSession = async (request: NextRequest) => {
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session?.session.userId) return null;

  return session;
};

export const redirectToSignIn = (request: NextRequest) => {
  const url = request.nextUrl.clone();
  url.pathname = "/auth/signin";
  return NextResponse.redirect(url);
};

export const redirectToUnauthorized = (request: NextRequest) => {
  const url = request.nextUrl.clone();
  url.pathname = "/unauthorized";
  return NextResponse.redirect(url);
};
