import { action } from "@solidjs/router";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "~/lib/db";
import { userProfiles } from "~/lib/db/schema";
import type { UserState } from "~/lib/user-context";

const UserProfileSchema = z.object({
  userId: z.coerce.number().int().positive(),
  role: z.enum(["pemesan", "pembeli"]),
  name: z.string().min(1),
  bankName: z.string().optional().nullable(),
  accountNumber: z.string().optional().nullable(),
  cardholderName: z.string().optional().nullable(),
});

function normalizeName(name: string) {
  return name.trim().replace(/\s+/g, " ").toLowerCase();
}

function toUserState(profile: {
  id: number;
  username: string | null;
  role: string;
  name: string;
  hasCompletedSetup: boolean;
  bankName: string | null;
  accountNumber: string | null;
  cardholderName: string | null;
}): UserState {
  return {
    id: profile.id,
    username: profile.username ?? "",
    role: profile.role === "pembeli" ? "pembeli" : "pemesan",
    name: profile.name,
    hasCompletedSetup: profile.hasCompletedSetup,
    bankName: profile.bankName ?? undefined,
    accountNumber: profile.accountNumber ?? undefined,
    cardholderName: profile.cardholderName ?? undefined,
  };
}

export const upsertUserProfileAction = action(async (formData: FormData) => {
  "use server";
  const parsed = UserProfileSchema.parse({
    userId: formData.get("userId"),
    role: formData.get("role"),
    name: formData.get("name"),
    bankName: formData.get("bankName") || null,
    accountNumber: formData.get("accountNumber") || null,
    cardholderName: formData.get("cardholderName") || null,
  });

  const trimmedName = parsed.name.trim();
  const normalizedName = normalizeName(parsed.name);
  const [existing] = await db
    .select({
      id: userProfiles.id,
      username: userProfiles.username,
    })
    .from(userProfiles)
    .where(eq(userProfiles.id, parsed.userId));

  if (!existing) {
    throw new Error("Akun tidak ditemukan.");
  }

  const values = {
    profileKey: existing.username
      ? `account:${existing.username.trim().toLowerCase()}`
      : `legacy:${parsed.userId}`,
    role: parsed.role,
    name: trimmedName,
    normalizedName,
    bankName: parsed.role === "pembeli" ? parsed.bankName?.trim() || null : null,
    accountNumber:
      parsed.role === "pembeli" ? parsed.accountNumber?.trim() || null : null,
    cardholderName:
      parsed.role === "pembeli" ? parsed.cardholderName?.trim() || null : null,
    hasCompletedSetup: true,
    updatedAt: new Date(),
  };

  const [updated] = await db
    .update(userProfiles)
    .set(values)
    .where(eq(userProfiles.id, existing.id))
    .returning({
      id: userProfiles.id,
      username: userProfiles.username,
      role: userProfiles.role,
      name: userProfiles.name,
      hasCompletedSetup: userProfiles.hasCompletedSetup,
      bankName: userProfiles.bankName,
      accountNumber: userProfiles.accountNumber,
      cardholderName: userProfiles.cardholderName,
    });

  return toUserState(updated);
}, "upsertUserProfile");
