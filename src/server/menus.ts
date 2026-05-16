import { query, action, redirect } from "@solidjs/router";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { db } from "~/lib/db";
import { menus, stores } from "~/lib/db/schema";

const MenuSchema = z.object({
  storeId: z.number().int().positive("Pilih toko terlebih dahulu"),
  name: z.string().min(1, "Nama menu wajib diisi"),
  description: z.string().optional().nullable(),
  price: z.number().int().min(0, "Harga tidak boleh negatif"),
  imageUrl: z.string().url().optional().nullable(),
  isAvailable: z.boolean().default(true),
});

export const getMenus = query(async () => {
  "use server";
  return await db
    .select({
      id: menus.id,
      storeId: menus.storeId,
      name: menus.name,
      description: menus.description,
      price: menus.price,
      imageUrl: menus.imageUrl,
      isAvailable: menus.isAvailable,
      createdAt: menus.createdAt,
      updatedAt: menus.updatedAt,
      storeName: stores.name,
    })
    .from(menus)
    .innerJoin(stores, eq(menus.storeId, stores.id))
    .orderBy(stores.name, menus.name);
}, "getMenus");

export const getMenusByStore = query(async (storeId: number) => {
  "use server";
  return await db
    .select()
    .from(menus)
    .where(and(eq(menus.storeId, storeId), eq(menus.isAvailable, true)))
    .orderBy(menus.name);
}, "getMenusByStore");

export const getMenuById = query(async (id: number) => {
  "use server";
  const [menu] = await db.select().from(menus).where(eq(menus.id, id));
  return menu ?? null;
}, "getMenuById");

export const createMenuAction = action(async (formData: FormData) => {
  "use server";
  const rawImageUrl = formData.get("imageUrl") as string;
  const data = MenuSchema.parse({
    storeId: parseInt(formData.get("storeId") as string),
    name: formData.get("name"),
    description: formData.get("description") || null,
    price: parseInt(formData.get("price") as string),
    imageUrl: rawImageUrl || null,
    isAvailable: formData.get("isAvailable") === "true",
  });
  await db.insert(menus).values(data);
  return redirect("/menus");
}, "createMenu");

export const updateMenuAction = action(async (formData: FormData) => {
  "use server";
  const id = parseInt(formData.get("id") as string);
  const rawImageUrl = formData.get("imageUrl") as string;
  const data = MenuSchema.parse({
    storeId: parseInt(formData.get("storeId") as string),
    name: formData.get("name"),
    description: formData.get("description") || null,
    price: parseInt(formData.get("price") as string),
    imageUrl: rawImageUrl || null,
    isAvailable: formData.get("isAvailable") === "true",
  });
  await db
    .update(menus)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(menus.id, id));
  return redirect("/menus");
}, "updateMenu");

export const toggleMenuAction = action(async (formData: FormData) => {
  "use server";
  const id = parseInt(formData.get("id") as string);
  const isAvailable = formData.get("isAvailable") === "true";
  await db
    .update(menus)
    .set({ isAvailable: !isAvailable, updatedAt: new Date() })
    .where(eq(menus.id, id));
  return redirect("/menus");
}, "toggleMenu");
