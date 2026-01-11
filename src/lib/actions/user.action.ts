"use server";

/**
 * Server Actions for User Profile Management
 *
 * NOTE: This action is not currently used. Profile updates are handled client-side
 * via authClient.updateUser() which properly syncs both database and Better Auth session.
 */

import { authAction } from "@/lib/actions/safe-actions";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

export const UpdateProfileSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  image: z.string().url().optional().nullable(),
});

export const updateUserProfileAction = authAction
  .inputSchema(UpdateProfileSchema)
  .action(async ({ parsedInput: data, ctx: { user } }) => {
    // Update user in database
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        name: data.name,
        image: data.image,
      },
    });

    // Revalidate account pages
    revalidatePath("/account");
    revalidatePath("/account/(settings)");

    return { success: true, user: updatedUser };
  });
