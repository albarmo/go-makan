import {
  pgTable,
  serial,
  varchar,
  text,
  boolean,
  integer,
  timestamp,
  date,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const userProfiles = pgTable(
  "user_profiles",
  {
    id: serial("id").primaryKey(),
    profileKey: varchar("profile_key", { length: 255 }).notNull(),
    username: varchar("username", { length: 255 }),
    normalizedUsername: varchar("normalized_username", { length: 255 }),
    pinHash: text("pin_hash"),
    hasCompletedSetup: boolean("has_completed_setup").default(false).notNull(),
    role: varchar("role", { length: 50 }).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    normalizedName: varchar("normalized_name", { length: 255 }).notNull(),
    bankName: varchar("bank_name", { length: 255 }),
    accountNumber: varchar("account_number", { length: 100 }),
    cardholderName: varchar("cardholder_name", { length: 255 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    profileKeyIdx: uniqueIndex("user_profiles_profile_key_idx").on(
      table.profileKey,
    ),
    usernameIdx: uniqueIndex("user_profiles_normalized_username_idx").on(
      table.normalizedUsername,
    ),
  }),
);

export const stores = pgTable("stores", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  address: text("address"),
  phone: varchar("phone", { length: 50 }),
  imageUrl: text("image_url"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const menus = pgTable("menus", {
  id: serial("id").primaryKey(),
  storeId: integer("store_id")
    .references(() => stores.id)
    .notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  price: integer("price").notNull(),
  imageUrl: text("image_url"),
  isAvailable: boolean("is_available").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  orderDate: date("order_date").notNull(),
  requesterName: varchar("requester_name", { length: 255 }).notNull(),
  buyerProfileId: integer("buyer_profile_id").references(() => userProfiles.id),
  buyerName: varchar("buyer_name", { length: 255 }),
  storeId: integer("store_id")
    .references(() => stores.id)
    .notNull(),
  status: varchar("status", { length: 50 }).default("submitted").notNull(),
  paymentStatus: varchar("payment_status", { length: 50 })
    .default("unpaid")
    .notNull(),
  notes: text("notes"),
  totalAmount: integer("total_amount").default(0).notNull(),
  purchasedAt: timestamp("purchased_at"),
  paidAt: timestamp("paid_at"),
  paymentProofUrl: text("payment_proof_url"),
  paymentProofUploadedAt: timestamp("payment_proof_uploaded_at"),
  cancelledAt: timestamp("cancelled_at"),
  cancellationReason: text("cancellation_reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id")
    .references(() => orders.id)
    .notNull(),
  storeId: integer("store_id")
    .references(() => stores.id)
    .notNull(),
  menuId: integer("menu_id")
    .references(() => menus.id)
    .notNull(),
  storeNameSnapshot: varchar("store_name_snapshot", { length: 255 }).notNull(),
  menuNameSnapshot: varchar("menu_name_snapshot", { length: 255 }).notNull(),
  priceSnapshot: integer("price_snapshot").notNull(),
  quantity: integer("quantity").default(1).notNull(),
  fulfillmentStatus: varchar("fulfillment_status", { length: 50 })
    .default("pending")
    .notNull(),
  fulfilledAt: timestamp("fulfilled_at"),
  notes: text("notes"),
  subtotal: integer("subtotal").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const storesRelations = relations(stores, ({ many }) => ({
  menus: many(menus),
  orders: many(orders),
}));

export const menusRelations = relations(menus, ({ one, many }) => ({
  store: one(stores, { fields: [menus.storeId], references: [stores.id] }),
  orderItems: many(orderItems),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  store: one(stores, { fields: [orders.storeId], references: [stores.id] }),
  items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
  store: one(stores, { fields: [orderItems.storeId], references: [stores.id] }),
  menu: one(menus, { fields: [orderItems.menuId], references: [menus.id] }),
}));

export type Store = typeof stores.$inferSelect;
export type Menu = typeof menus.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type OrderItem = typeof orderItems.$inferSelect;
export type UserProfile = typeof userProfiles.$inferSelect;
export type NewStore = typeof stores.$inferInsert;
export type NewMenu = typeof menus.$inferInsert;
export type NewOrder = typeof orders.$inferInsert;
export type NewOrderItem = typeof orderItems.$inferInsert;
export type NewUserProfile = typeof userProfiles.$inferInsert;
