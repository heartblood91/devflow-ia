import { getSession } from "@/lib/auth/auth-user";
import { prisma } from "@/lib/prisma";
import { unauthorized } from "next/navigation";

export type CurrentUserPayload = {
  id: string;
  name: string;
  email: string;
  image: string | null;
};

export const getCurrentUser = async (): Promise<CurrentUserPayload | null> => {
  const session = await getSession();

  if (!session?.user.id) {
    return null;
  }

  const user = await prisma.user.findFirst({
    where: { id: session.user.id },
  });

  if (!user) {
    return null;
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    image: user.image,
  };
};

export const getRequiredCurrentUser = async (): Promise<CurrentUserPayload> => {
  const user = await getCurrentUser();

  if (!user) {
    unauthorized();
  }

  return user;
};

// Alias for convenience
export const getUser = getCurrentUser;
