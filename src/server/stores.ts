import { query, action, redirect } from "@solidjs/router";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "~/lib/db";
import { stores } from "~/lib/db/schema";

const StoreSchema = z.object({
  name: z.string().min(1, "Nama toko wajib diisi"),
  description: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  imageUrl: z.string().url().optional().nullable(),
  isActive: z.boolean().default(true),
});

export const getStores = query(async () => {
  "use server";
  return await db.select().from(stores).orderBy(stores.name);
}, "getStores");

export const getActiveStores = query(async () => {
  "use server";
  return await db
    .select()
    .from(stores)
    .where(eq(stores.isActive, true))
    .orderBy(stores.name);
}, "getActiveStores");

export const getStoreById = query(async (id: number) => {
  "use server";
  const [store] = await db.select().from(stores).where(eq(stores.id, id));
  return store ?? null;
}, "getStoreById");

export const createStoreAction = action(async (formData: FormData) => {
  "use server";
  const rawImageUrl = formData.get("imageUrl") as string;
  const data = StoreSchema.parse({
    name: formData.get("name"),
    description: formData.get("description") || null,
    address: formData.get("address") || null,
    phone: formData.get("phone") || null,
    imageUrl: rawImageUrl || null,
    isActive: formData.get("isActive") === "true",
  });
  await db.insert(stores).values(data);
  return redirect("/stores");
}, "createStore");

export const updateStoreAction = action(async (formData: FormData) => {
  "use server";
  const id = parseInt(formData.get("id") as string);
  const rawImageUrl = formData.get("imageUrl") as string;
  const data = StoreSchema.parse({
    name: formData.get("name"),
    description: formData.get("description") || null,
    address: formData.get("address") || null,
    phone: formData.get("phone") || null,
    imageUrl: rawImageUrl || null,
    isActive: formData.get("isActive") === "true",
  });
  await db
    .update(stores)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(stores.id, id));
  return redirect("/stores");
}, "updateStore");

export const toggleStoreAction = action(async (formData: FormData) => {
  "use server";
  const id = parseInt(formData.get("id") as string);
  const isActive = formData.get("isActive") === "true";
  await db
    .update(stores)
    .set({ isActive: !isActive, updatedAt: new Date() })
    .where(eq(stores.id, id));
  return redirect("/stores");
}, "toggleStore");
