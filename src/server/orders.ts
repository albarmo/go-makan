import { query, action, redirect } from "@solidjs/router";
import { eq, and, ne, desc, inArray } from "drizzle-orm";
import { z } from "zod";
import { db } from "~/lib/db";
import { orders, orderItems, stores, menus } from "~/lib/db/schema";
import { buildOrderSummary, todayString } from "~/lib/utils";

const OrderItemInput = z.object({
  menuId: z.number().int().positive(),
  menuName: z.string(),
  price: z.number().int().min(0),
  quantity: z.number().int().min(1),
  notes: z.string().optional().nullable(),
});

const CreateOrderSchema = z.object({
  requesterName: z.string().min(1),
  storeId: z.number().int().positive(),
  notes: z.string().optional().nullable(),
  items: z.array(OrderItemInput).min(1, "Minimal 1 item"),
});

export const getMyOrders = query(async (requesterName: string) => {
  "use server";
  const today = todayString();
  const result = await db
    .select({
      id: orders.id,
      orderDate: orders.orderDate,
      requesterName: orders.requesterName,
      buyerName: orders.buyerName,
      storeId: orders.storeId,
      storeName: stores.name,
      status: orders.status,
      notes: orders.notes,
      totalAmount: orders.totalAmount,
      purchasedAt: orders.purchasedAt,
      cancelledAt: orders.cancelledAt,
      cancellationReason: orders.cancellationReason,
      createdAt: orders.createdAt,
    })
    .from(orders)
    .innerJoin(stores, eq(orders.storeId, stores.id))
    .where(
      and(eq(orders.requesterName, requesterName), eq(orders.orderDate, today))
    )
    .orderBy(desc(orders.createdAt));

  if (result.length === 0) return result;

  const itemRows = await db
    .select({
      orderId: orderItems.orderId,
      menuNameSnapshot: orderItems.menuNameSnapshot,
      quantity: orderItems.quantity,
    })
    .from(orderItems)
    .where(inArray(orderItems.orderId, result.map((order) => order.id)));

  const itemsByOrderId = new Map<number, typeof itemRows>();
  for (const item of itemRows) {
    const existing = itemsByOrderId.get(item.orderId) ?? [];
    existing.push(item);
    itemsByOrderId.set(item.orderId, existing);
  }

  return result.map((order) => {
    const orderItemsForSummary = itemsByOrderId.get(order.id) ?? [];
    return {
      ...order,
      itemSummary: buildOrderSummary(orderItemsForSummary),
      itemCount: orderItemsForSummary.reduce((sum, item) => sum + item.quantity, 0),
    };
  });
}, "getMyOrders");

export const getTodayOrders = query(async () => {
  "use server";
  const today = todayString();
  const result = await db
    .select({
      id: orders.id,
      orderDate: orders.orderDate,
      requesterName: orders.requesterName,
      buyerName: orders.buyerName,
      storeId: orders.storeId,
      storeName: stores.name,
      status: orders.status,
      notes: orders.notes,
      totalAmount: orders.totalAmount,
      purchasedAt: orders.purchasedAt,
      cancelledAt: orders.cancelledAt,
      cancellationReason: orders.cancellationReason,
      createdAt: orders.createdAt,
    })
    .from(orders)
    .innerJoin(stores, eq(orders.storeId, stores.id))
    .where(eq(orders.orderDate, today))
    .orderBy(desc(orders.createdAt));

  if (result.length === 0) return result;

  const itemRows = await db
    .select({
      orderId: orderItems.orderId,
      menuNameSnapshot: orderItems.menuNameSnapshot,
      quantity: orderItems.quantity,
    })
    .from(orderItems)
    .where(inArray(orderItems.orderId, result.map((order) => order.id)));

  const itemsByOrderId = new Map<number, typeof itemRows>();
  for (const item of itemRows) {
    const existing = itemsByOrderId.get(item.orderId) ?? [];
    existing.push(item);
    itemsByOrderId.set(item.orderId, existing);
  }

  return result.map((order) => {
    const orderItemsForSummary = itemsByOrderId.get(order.id) ?? [];
    return {
      ...order,
      itemSummary: buildOrderSummary(orderItemsForSummary),
      itemCount: orderItemsForSummary.reduce((sum, item) => sum + item.quantity, 0),
    };
  });
}, "getTodayOrders");

export const getOrderById = query(async (id: number) => {
  "use server";
  const [order] = await db
    .select({
      id: orders.id,
      orderDate: orders.orderDate,
      requesterName: orders.requesterName,
      buyerName: orders.buyerName,
      storeId: orders.storeId,
      storeName: stores.name,
      status: orders.status,
      notes: orders.notes,
      totalAmount: orders.totalAmount,
      purchasedAt: orders.purchasedAt,
      cancelledAt: orders.cancelledAt,
      cancellationReason: orders.cancellationReason,
      createdAt: orders.createdAt,
    })
    .from(orders)
    .innerJoin(stores, eq(orders.storeId, stores.id))
    .where(eq(orders.id, id));

  if (!order) return null;

  const items = await db
    .select()
    .from(orderItems)
    .where(eq(orderItems.orderId, id))
    .orderBy(orderItems.id);

  return { ...order, items };
}, "getOrderById");

export const getBuyerRecap = query(async () => {
  "use server";
  const today = todayString();
  const rows = await db
    .select({
      orderId: orders.id,
      requesterName: orders.requesterName,
      orderStatus: orders.status,
      storeId: stores.id,
      storeName: stores.name,
      menuName: orderItems.menuNameSnapshot,
      price: orderItems.priceSnapshot,
      quantity: orderItems.quantity,
      subtotal: orderItems.subtotal,
      itemNotes: orderItems.notes,
    })
    .from(orders)
    .innerJoin(stores, eq(orders.storeId, stores.id))
    .innerJoin(orderItems, eq(orderItems.orderId, orders.id))
    .where(
      and(
        eq(orders.orderDate, today),
        ne(orders.status, "cancelled")
      )
    )
    .orderBy(stores.name, orderItems.menuNameSnapshot);

  // Group by store > menu
  const storeMap = new Map<
    number,
    {
      storeId: number;
      storeName: string;
      items: Map<
        string,
        {
          menuName: string;
          price: number;
          totalQuantity: number;
          totalSubtotal: number;
          orders: {
            orderId: number;
            requesterName: string;
            quantity: number;
            notes: string | null;
            status: string;
          }[];
        }
      >;
    }
  >();

  for (const row of rows) {
    if (!storeMap.has(row.storeId)) {
      storeMap.set(row.storeId, {
        storeId: row.storeId,
        storeName: row.storeName,
        items: new Map(),
      });
    }
    const storeEntry = storeMap.get(row.storeId)!;
    const key = `${row.menuName}__${row.price}`;
    if (!storeEntry.items.has(key)) {
      storeEntry.items.set(key, {
        menuName: row.menuName,
        price: row.price,
        totalQuantity: 0,
        totalSubtotal: 0,
        orders: [],
      });
    }
    const item = storeEntry.items.get(key)!;
    item.totalQuantity += row.quantity;
    item.totalSubtotal += row.subtotal;
    item.orders.push({
      orderId: row.orderId,
      requesterName: row.requesterName,
      quantity: row.quantity,
      notes: row.itemNotes,
      status: row.orderStatus,
    });
  }

  return Array.from(storeMap.values()).map((s) => ({
    ...s,
    items: Array.from(s.items.values()),
  }));
}, "getBuyerRecap");

export const getSettlement = query(async () => {
  "use server";
  const today = todayString();
  const rows = await db
    .select({
      orderId: orders.id,
      requesterName: orders.requesterName,
      storeName: stores.name,
      status: orders.status,
      totalAmount: orders.totalAmount,
      menuName: orderItems.menuNameSnapshot,
      quantity: orderItems.quantity,
      price: orderItems.priceSnapshot,
      subtotal: orderItems.subtotal,
    })
    .from(orders)
    .innerJoin(stores, eq(orders.storeId, stores.id))
    .innerJoin(orderItems, eq(orderItems.orderId, orders.id))
    .where(
      and(eq(orders.orderDate, today), ne(orders.status, "cancelled"))
    )
    .orderBy(orders.requesterName, stores.name);

  // Group by requesterName
  const personMap = new Map<
    string,
    {
      requesterName: string;
      totalAmount: number;
      orderGroups: Map<
        number,
        {
          orderId: number;
          storeName: string;
          status: string;
          orderTotal: number;
          items: { menuName: string; quantity: number; price: number; subtotal: number }[];
        }
      >;
    }
  >();

  for (const row of rows) {
    if (!personMap.has(row.requesterName)) {
      personMap.set(row.requesterName, {
        requesterName: row.requesterName,
        totalAmount: 0,
        orderGroups: new Map(),
      });
    }
    const person = personMap.get(row.requesterName)!;
    if (!person.orderGroups.has(row.orderId)) {
      person.orderGroups.set(row.orderId, {
        orderId: row.orderId,
        storeName: row.storeName,
        status: row.status,
        orderTotal: row.totalAmount,
        items: [],
      });
      person.totalAmount += row.totalAmount;
    }
    person.orderGroups.get(row.orderId)!.items.push({
      menuName: row.menuName,
      quantity: row.quantity,
      price: row.price,
      subtotal: row.subtotal,
    });
  }

  return Array.from(personMap.values()).map((p) => ({
    ...p,
    orderGroups: Array.from(p.orderGroups.values()),
  }));
}, "getSettlement");

export const createOrderAction = action(async (formData: FormData) => {
  "use server";
  const parsed = CreateOrderSchema.parse({
    requesterName: formData.get("requesterName"),
    storeId: parseInt(formData.get("storeId") as string),
    notes: formData.get("notes") || null,
    items: JSON.parse(formData.get("items") as string),
  });

  const totalAmount = parsed.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const today = todayString();

  // Insert order
  const [order] = await db
    .insert(orders)
    .values({
      orderDate: today,
      requesterName: parsed.requesterName,
      storeId: parsed.storeId,
      notes: parsed.notes,
      status: "submitted",
      totalAmount,
    })
    .returning({ id: orders.id });

  // Insert order items
  await db.insert(orderItems).values(
    parsed.items.map((item) => ({
      orderId: order.id,
      menuId: item.menuId,
      menuNameSnapshot: item.menuName,
      priceSnapshot: item.price,
      quantity: item.quantity,
      notes: item.notes ?? null,
      subtotal: item.price * item.quantity,
    }))
  );

  return redirect(`/orders/${order.id}`);
}, "createOrder");

export const cancelOrderAction = action(async (formData: FormData) => {
  "use server";
  const id = parseInt(formData.get("id") as string);
  const reason = (formData.get("reason") as string) || null;
  const redirectTo = (formData.get("redirectTo") as string) || "/my-orders";

  await db
    .update(orders)
    .set({
      status: "cancelled",
      cancellationReason: reason,
      cancelledAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(orders.id, id));

  return redirect(redirectTo);
}, "cancelOrder");

export const markPurchasedAction = action(async (formData: FormData) => {
  "use server";
  const id = parseInt(formData.get("id") as string);
  const buyerName = formData.get("buyerName") as string;

  await db
    .update(orders)
    .set({
      status: "purchased",
      buyerName,
      purchasedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(orders.id, id));

  return redirect("/buyer/orders");
}, "markPurchased");
