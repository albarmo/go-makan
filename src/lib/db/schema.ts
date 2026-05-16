import {
  pgTable,
  serial,
  varchar,
  text,
  boolean,
  integer,
  timestamp,
  date,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

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
  buyerName: varchar("buyer_name", { length: 255 }),
  storeId: integer("store_id")
    .references(() => stores.id)
    .notNull(),
  status: varchar("status", { length: 50 }).default("submitted").notNull(),
  notes: text("notes"),
  totalAmount: integer("total_amount").default(0).notNull(),
  purchasedAt: timestamp("purchased_at"),
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
  menuId: integer("menu_id")
    .references(() => menus.id)
    .notNull(),
  menuNameSnapshot: varchar("menu_name_snapshot", { length: 255 }).notNull(),
  priceSnapshot: integer("price_snapshot").notNull(),
  quantity: integer("quantity").default(1).notNull(),
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
  menu: one(menus, { fields: [orderItems.menuId], references: [menus.id] }),
}));

export type Store = typeof stores.$inferSelect;
export type Menu = typeof menus.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type OrderItem = typeof orderItems.$inferSelect;
export type NewStore = typeof stores.$inferInsert;
export type NewMenu = typeof menus.$inferInsert;
export type NewOrder = typeof orders.$inferInsert;
export type NewOrderItem = typeof orderItems.$inferInsert;
