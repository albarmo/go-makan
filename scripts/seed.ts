import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "../src/lib/db/schema";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set. Create a .env file.");

  const db = drizzle(neon(url), { schema });

  console.log("🌱 Seeding database...");

  // Seed stores
  const [warungPakSlamet, rmPadang, kedaiMie] = await db
    .insert(schema.stores)
    .values([
      {
        name: "Warung Pak Slamet",
        description: "Nasi & lauk pauk lengkap",
        address: "Jl. Merdeka No. 5, depan kantor",
        phone: "081234567890",
        isActive: true,
      },
      {
        name: "RM Padang Minang",
        description: "Masakan Padang otentik",
        address: "Jl. Sudirman No. 88",
        phone: "087654321098",
        isActive: true,
      },
      {
        name: "Kedai Mie Bu Rini",
        description: "Mie ayam & bakso segar",
        address: "Jl. Kartini No. 12",
        phone: "082345678901",
        isActive: true,
      },
    ])
    .returning({ id: schema.stores.id });

  console.log("✅ Stores seeded");

  // Seed menus for Warung Pak Slamet
  await db.insert(schema.menus).values([
    {
      storeId: warungPakSlamet.id,
      name: "Nasi Goreng Spesial",
      description: "Nasi goreng dengan telur & ayam",
      price: 15000,
      isAvailable: true,
    },
    {
      storeId: warungPakSlamet.id,
      name: "Mie Goreng",
      description: "Mie goreng dengan sayuran segar",
      price: 13000,
      isAvailable: true,
    },
    {
      storeId: warungPakSlamet.id,
      name: "Nasi Ayam Goreng",
      description: "Nasi putih + ayam goreng + lalapan",
      price: 18000,
      isAvailable: true,
    },
    {
      storeId: warungPakSlamet.id,
      name: "Nasi Ikan Goreng",
      description: "Nasi putih + ikan goreng + sambal",
      price: 16000,
      isAvailable: true,
    },
    {
      storeId: warungPakSlamet.id,
      name: "Es Teh Manis",
      description: "",
      price: 5000,
      isAvailable: true,
    },
    {
      storeId: warungPakSlamet.id,
      name: "Air Mineral",
      description: "Aqua 600ml",
      price: 3000,
      isAvailable: true,
    },
  ]);

  // Seed menus for RM Padang Minang
  await db.insert(schema.menus).values([
    {
      storeId: rmPadang.id,
      name: "Nasi Rendang",
      description: "Nasi + rendang sapi + sayur",
      price: 25000,
      isAvailable: true,
    },
    {
      storeId: rmPadang.id,
      name: "Nasi Ayam Pop",
      description: "Nasi + ayam pop + sayur hijau",
      price: 22000,
      isAvailable: true,
    },
    {
      storeId: rmPadang.id,
      name: "Nasi Gulai Kambing",
      description: "Nasi + gulai kambing + sayur",
      price: 28000,
      isAvailable: true,
    },
    {
      storeId: rmPadang.id,
      name: "Nasi Telur Balado",
      description: "Nasi + telur balado + sayur",
      price: 18000,
      isAvailable: true,
    },
    {
      storeId: rmPadang.id,
      name: "Es Jeruk Segar",
      description: "Jeruk peras segar",
      price: 8000,
      isAvailable: true,
    },
    {
      storeId: rmPadang.id,
      name: "Es Teh Tawar",
      description: "",
      price: 5000,
      isAvailable: true,
    },
  ]);

  // Seed menus for Kedai Mie Bu Rini
  await db.insert(schema.menus).values([
    {
      storeId: kedaiMie.id,
      name: "Mie Ayam Biasa",
      description: "Mie ayam dengan kuah kaldu",
      price: 14000,
      isAvailable: true,
    },
    {
      storeId: kedaiMie.id,
      name: "Mie Ayam Bakso",
      description: "Mie ayam + 2 bakso",
      price: 18000,
      isAvailable: true,
    },
    {
      storeId: kedaiMie.id,
      name: "Mie Pangsit Goreng",
      description: "Mie + pangsit goreng",
      price: 16000,
      isAvailable: true,
    },
    {
      storeId: kedaiMie.id,
      name: "Bakso Kuah Spesial",
      description: "Bakso sapi + tahu + mie bihun",
      price: 17000,
      isAvailable: true,
    },
    {
      storeId: kedaiMie.id,
      name: "Es Teh Manis",
      description: "",
      price: 5000,
      isAvailable: true,
    },
    {
      storeId: kedaiMie.id,
      name: "Jus Alpukat",
      description: "Jus alpukat segar",
      price: 12000,
      isAvailable: true,
    },
  ]);

  console.log("✅ Menus seeded");
  console.log("\n🎉 Seeding complete!");
  console.log(`  - 3 toko (stores)`);
  console.log(`  - 18 menu items`);
}

main().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
