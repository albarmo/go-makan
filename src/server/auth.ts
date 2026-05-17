import { action } from "@solidjs/router";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "~/lib/db";
import { userProfiles } from "~/lib/db/schema";
import type { UserState } from "~/lib/user-context";

const UsernameSchema = z
  .string()
  .trim()
  .min(3, "Username minimal 3 karakter.")
  .max(24, "Username maksimal 24 karakter.")
  .regex(
    /^[a-zA-Z0-9._-]+$/,
    "Username hanya boleh huruf, angka, titik, strip, atau underscore.",
  );

const PinSchema = z
  .string()
  .trim()
  .regex(/^\d{6}$/, "PIN harus terdiri dari 6 digit.");

const RegisterSchema = z.object({
  username: UsernameSchema,
  pin: PinSchema,
});

const LoginSchema = z.object({
  username: UsernameSchema,
  pin: PinSchema,
});

function normalizeUsername(username: string) {
  return username.trim().toLowerCase();
}

function buildAccountProfileKey(username: string) {
  return `account:${normalizeUsername(username)}`;
}

async function hashPin(pin: string) {
  const { randomBytes, scryptSync } = await import("node:crypto");
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(pin, salt, 64).toString("hex");
  return `${salt}:${derived}`;
}

async function verifyPin(pin: string, pinHash: string) {
  const { scryptSync, timingSafeEqual } = await import("node:crypto");
  const [salt, storedHash] = pinHash.split(":");
  if (!salt || !storedHash) return false;

  const derived = scryptSync(pin, salt, 64);
  const stored = Buffer.from(storedHash, "hex");
  if (stored.length !== derived.length) return false;

  return timingSafeEqual(stored, derived);
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

export const registerWithPinAction = action(async (formData: FormData) => {
  "use server";
  const parsed = RegisterSchema.parse({
    username: formData.get("username"),
    pin: formData.get("pin"),
  });

  const normalizedUsername = normalizeUsername(parsed.username);
  const [existing] = await db
    .select({ id: userProfiles.id })
    .from(userProfiles)
    .where(eq(userProfiles.normalizedUsername, normalizedUsername));

  if (existing) {
    throw new Error("Username sudah dipakai.");
  }

  const pinHash = await hashPin(parsed.pin);
  const [created] = await db
    .insert(userProfiles)
    .values({
      profileKey: buildAccountProfileKey(parsed.username),
      username: parsed.username.trim(),
      normalizedUsername,
      pinHash,
      hasCompletedSetup: false,
      role: "pemesan",
      name: parsed.username.trim(),
      normalizedName: parsed.username.trim().toLowerCase(),
      bankName: null,
      accountNumber: null,
      cardholderName: null,
      updatedAt: new Date(),
    })
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

  return toUserState(created);
}, "registerWithPin");

export const loginWithPinAction = action(async (formData: FormData) => {
  "use server";
  const parsed = LoginSchema.parse({
    username: formData.get("username"),
    pin: formData.get("pin"),
  });

  const normalizedUsername = normalizeUsername(parsed.username);
  const [profile] = await db
    .select({
      id: userProfiles.id,
      username: userProfiles.username,
      role: userProfiles.role,
      name: userProfiles.name,
      hasCompletedSetup: userProfiles.hasCompletedSetup,
      bankName: userProfiles.bankName,
      accountNumber: userProfiles.accountNumber,
      cardholderName: userProfiles.cardholderName,
      pinHash: userProfiles.pinHash,
    })
    .from(userProfiles)
    .where(eq(userProfiles.normalizedUsername, normalizedUsername));

  if (!profile?.pinHash) {
    throw new Error("Username atau PIN tidak cocok.");
  }

  const isValid = await verifyPin(parsed.pin, profile.pinHash);
  if (!isValid) {
    throw new Error("Username atau PIN tidak cocok.");
  }

  return toUserState(profile);
}, "loginWithPin");
