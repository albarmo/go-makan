import { action, query } from "@solidjs/router";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "~/lib/db";
import { userProfiles } from "~/lib/db/schema";
import type { Role } from "~/lib/user-context";

const BuyerProfileSchema = z.object({
  role: z.enum(["pemesan", "pembeli"]),
  name: z.string().min(1),
  bankName: z.string().optional().nullable(),
  accountNumber: z.string().optional().nullable(),
  cardholderName: z.string().optional().nullable(),
});

function normalizeName(name: string) {
  return name.trim().replace(/\s+/g, " ").toLowerCase();
}

function buildProfileKey(role: Role, name: string) {
  return `${role}:${normalizeName(name)}`;
}

export const getBuyerProfileByName = query(async (name: string) => {
  "use server";
  const normalized = normalizeName(name);
  if (!normalized) return null;

  const [profile] = await db
    .select({
      name: userProfiles.name,
      bankName: userProfiles.bankName,
      accountNumber: userProfiles.accountNumber,
      cardholderName: userProfiles.cardholderName,
    })
    .from(userProfiles)
    .where(eq(userProfiles.profileKey, buildProfileKey("pembeli", name)));

  return profile ?? null;
}, "getBuyerProfileByName");

export const upsertUserProfileAction = action(async (formData: FormData) => {
  "use server";
  const parsed = BuyerProfileSchema.parse({
    role: formData.get("role"),
    name: formData.get("name"),
    bankName: formData.get("bankName") || null,
    accountNumber: formData.get("accountNumber") || null,
    cardholderName: formData.get("cardholderName") || null,
  });

  const normalizedName = normalizeName(parsed.name);
  const profileKey = buildProfileKey(parsed.role, parsed.name);
  const [existing] = await db
    .select({ id: userProfiles.id })
    .from(userProfiles)
    .where(eq(userProfiles.profileKey, profileKey));

  const values = {
    profileKey,
    role: parsed.role,
    name: parsed.name.trim(),
    normalizedName,
    bankName: parsed.role === "pembeli" ? parsed.bankName?.trim() || null : null,
    accountNumber:
      parsed.role === "pembeli" ? parsed.accountNumber?.trim() || null : null,
    cardholderName:
      parsed.role === "pembeli" ? parsed.cardholderName?.trim() || null : null,
    updatedAt: new Date(),
  };

  if (existing) {
    await db.update(userProfiles).set(values).where(eq(userProfiles.id, existing.id));
  } else {
    await db.insert(userProfiles).values(values);
  }

  return {
    role: parsed.role,
    name: values.name,
    bankName: values.bankName,
    accountNumber: values.accountNumber,
    cardholderName: values.cardholderName,
  };
}, "upsertUserProfile");
