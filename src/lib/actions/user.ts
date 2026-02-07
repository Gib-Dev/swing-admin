"use server";

import { getDb } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { createUserSchema, type CreateUserInput } from "@/lib/validations/auth";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export async function createUser(
  data: CreateUserInput
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth();

    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    const validated = createUserSchema.safeParse(data);

    if (!validated.success) {
      return { success: false, error: "Invalid data" };
    }

    const db = getDb();

    const existing = await db.query.users.findFirst({
      where: eq(users.email, validated.data.email),
    });

    if (existing) {
      return { success: false, error: "A user with this email already exists" };
    }

    const passwordHash = await bcrypt.hash(validated.data.password, 10);

    await db.insert(users).values({
      name: validated.data.name,
      email: validated.data.email,
      passwordHash,
      role: validated.data.role,
    });

    revalidatePath("/users");

    return { success: true };
  } catch (error) {
    console.error("Failed to create user:", error);
    return { success: false, error: "Failed to create user" };
  }
}

export async function deleteUser(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth();

    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    if (session.user.id === id) {
      return { success: false, error: "You cannot delete your own account" };
    }

    const db = getDb();

    const existing = await db.query.users.findFirst({
      where: eq(users.id, id),
    });

    if (!existing) {
      return { success: false, error: "User not found" };
    }

    await db.delete(users).where(eq(users.id, id));

    revalidatePath("/users");

    return { success: true };
  } catch (error) {
    console.error("Failed to delete user:", error);
    return { success: false, error: "Failed to delete user" };
  }
}
