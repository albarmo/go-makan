import { action, query, redirect } from "@solidjs/router";
import { and, desc, eq, inArray, ne } from "drizzle-orm";
import { z } from "zod";
import { db } from "~/lib/db";
import { orderItems, orders, userProfiles } from "~/lib/db/schema";
import { buildOrderSummary, todayString } from "~/lib/utils";

export interface OrderListItem {
  id: number;
  orderDate: string;
  requesterName: string;
  buyerName: string | null;
  storeId: number | null;
  storeName: string | null;
  storeSummary: string;
  storeCount: number;
  status: string;
  paymentStatus: string;
  notes: string | null;
  totalAmount: number;
  purchasedAt: Date | null;
  paidAt: Date | null;
  cancelledAt: Date | null;
  cancellationReason: string | null;
  createdAt: Date;
  itemSummary: string;
  itemCount: number;
}

export interface OrderDetailItem {
  id: number;
  orderId: number;
  storeId: number;
  storeNameSnapshot: string;
  menuId: number;
  menuNameSnapshot: string;
  priceSnapshot: number;
  quantity: number;
  fulfillmentStatus: string;
  fulfilledAt: Date | null;
  notes: string | null;
  subtotal: number;
  createdAt: Date;
}

export interface OrderStoreGroup {
  storeId: number;
  storeName: string;
  items: OrderDetailItem[];
  totalAmount: number;
  totalQuantity: number;
}

export interface OrderDetail {
  id: number;
  orderDate: string;
  requesterName: string;
  buyerName: string | null;
  storeId: number | null;
  storeName: string | null;
  storeSummary: string;
  storeCount: number;
  status: string;
  paymentStatus: string;
  notes: string | null;
  totalAmount: number;
  purchasedAt: Date | null;
  paidAt: Date | null;
  paymentProofUrl: string | null;
  paymentProofUploadedAt: Date | null;
  cancelledAt: Date | null;
  cancellationReason: string | null;
  createdAt: Date;
  items: OrderDetailItem[];
  storeGroups: OrderStoreGroup[];
  buyerPaymentProfile: {
    bankName: string | null;
    accountNumber: string | null;
    cardholderName: string | null;
  } | null;
}

export interface BuyerStoreOrderItem {
  id: number;
  menuName: string;
  quantity: number;
  subtotal: number;
  fulfillmentStatus: string;
  fulfilledAt: Date | null;
  notes: string | null;
}

export interface BuyerStoreOrderGroupEntry {
  orderId: number;
  requesterName: string;
  buyerName: string | null;
  status: string;
  paymentStatus: string;
  createdAt: Date;
  itemSummary: string;
  itemCount: number;
  storeAmount: number;
  pendingItemCount: number;
  purchasedItemCount: number;
  unavailableItemCount: number;
  items: BuyerStoreOrderItem[];
}

export interface BuyerStoreOrdersGroup {
  storeId: number;
  storeName: string;
  orderCount: number;
  pendingCount: number;
  purchasedCount: number;
  unpaidCount: number;
  totalItems: number;
  totalAmount: number;
  pendingItemCount: number;
  purchasedItemCount: number;
  unavailableItemCount: number;
  orders: BuyerStoreOrderGroupEntry[];
}

const OrderItemInput = z.object({
  menuId: z.number().int().positive(),
  storeId: z.number().int().positive(),
  storeName: z.string().min(1),
  menuName: z.string(),
  price: z.number().int().min(0),
  quantity: z.number().int().min(1),
  notes: z.string().optional().nullable(),
});

const CreateOrderSchema = z.object({
  requesterName: z.string().min(1),
  notes: z.string().optional().nullable(),
  items: z.array(OrderItemInput).min(1, "Minimal 1 item"),
});

type OrderStoreMetaRow = {
  orderId: number;
  storeId: number;
  storeNameSnapshot: string;
  menuNameSnapshot: string;
  quantity: number;
  fulfillmentStatus: string;
};

const ItemFulfillmentStatus = z.enum(["pending", "purchased", "unavailable"]);

const UpdateOrderItemFulfillmentSchema = z.object({
  itemId: z.coerce.number().int().positive(),
  status: ItemFulfillmentStatus,
  buyerName: z.string().min(1),
  buyerProfileId: z.coerce.number().int().positive(),
  redirectTo: z.string().optional(),
});

const BulkStoreFulfillmentSchema = z.object({
  storeId: z.coerce.number().int().positive(),
  buyerName: z.string().min(1),
  buyerProfileId: z.coerce.number().int().positive(),
  redirectTo: z.string().optional(),
});

type OrderBaseRow = {
  id: number;
  orderDate: string;
  requesterName: string;
  buyerProfileId: number | null;
  buyerName: string | null;
  storeId: number | null;
  status: string;
  paymentStatus: string;
  notes: string | null;
  totalAmount: number;
  purchasedAt: Date | null;
  paidAt: Date | null;
  cancelledAt: Date | null;
  cancellationReason: string | null;
  createdAt: Date;
};

function normalizeStoreNames(itemRows: { storeId: number; storeNameSnapshot: string }[]) {
  const stores = new Map<number, string>();
  for (const item of itemRows) {
    if (!stores.has(item.storeId)) {
      stores.set(item.storeId, item.storeNameSnapshot);
    }
  }
  return Array.from(stores.entries()).map(([storeId, storeName]) => ({
    storeId,
    storeName,
  }));
}

function buildStoreSummary(
  storesForOrder: { storeId: number; storeName: string }[],
): {
  storeId: number | null;
  storeName: string | null;
  storeSummary: string;
  storeCount: number;
} {
  const primaryStore = storesForOrder[0] ?? null;
  if (!primaryStore) {
    return {
      storeId: null,
      storeName: null,
      storeSummary: "Belum ada toko",
      storeCount: 0,
    };
  }

  if (storesForOrder.length === 1) {
    return {
      storeId: primaryStore.storeId,
      storeName: primaryStore.storeName,
      storeSummary: primaryStore.storeName,
      storeCount: 1,
    };
  }

  return {
    storeId: primaryStore.storeId,
    storeName: primaryStore.storeName,
    storeSummary: `${primaryStore.storeName} +${storesForOrder.length - 1} toko`,
    storeCount: storesForOrder.length,
  };
}

function buildStoreSummaryFromNames(storeNames: string[]) {
  const uniqueNames = Array.from(new Set(storeNames));
  return buildStoreSummary(
    uniqueNames.map((storeName, index) => ({
      storeId: index + 1,
      storeName,
    })),
  );
}

function decorateOrders(
  result: OrderBaseRow[],
  itemRows: OrderStoreMetaRow[],
): OrderListItem[] {
  const itemsByOrderId = new Map<number, OrderStoreMetaRow[]>();
  for (const item of itemRows) {
    const existing = itemsByOrderId.get(item.orderId) ?? [];
    existing.push(item);
    itemsByOrderId.set(item.orderId, existing);
  }

  return result.map<OrderListItem>((order) => {
    const allOrderItems = itemsByOrderId.get(order.id) ?? [];
    const orderItemsForSummary = allOrderItems.filter(
      (item) => item.fulfillmentStatus !== "unavailable",
    );
    const storeMeta = buildStoreSummary(
      normalizeStoreNames(orderItemsForSummary.length > 0 ? orderItemsForSummary : allOrderItems),
    );

    return {
      ...order,
      ...storeMeta,
      itemSummary: buildOrderSummary(orderItemsForSummary),
      itemCount: orderItemsForSummary.reduce((sum, item) => sum + item.quantity, 0),
    };
  });
}

async function getOrderStoreMeta(orderIds: number[]) {
  if (orderIds.length === 0) return [];

  return db
    .select({
      orderId: orderItems.orderId,
      storeId: orderItems.storeId,
      storeNameSnapshot: orderItems.storeNameSnapshot,
      menuNameSnapshot: orderItems.menuNameSnapshot,
      quantity: orderItems.quantity,
      fulfillmentStatus: orderItems.fulfillmentStatus,
    })
    .from(orderItems)
    .where(inArray(orderItems.orderId, orderIds))
    .orderBy(orderItems.id);
}

export const getMyOrders = query(
  async (requesterName: string): Promise<OrderListItem[]> => {
    "use server";
    const today = todayString();
    const result = await db
      .select({
        id: orders.id,
        orderDate: orders.orderDate,
        requesterName: orders.requesterName,
        buyerProfileId: orders.buyerProfileId,
        buyerName: orders.buyerName,
        storeId: orders.storeId,
        status: orders.status,
        paymentStatus: orders.paymentStatus,
        notes: orders.notes,
        totalAmount: orders.totalAmount,
        purchasedAt: orders.purchasedAt,
        paidAt: orders.paidAt,
        cancelledAt: orders.cancelledAt,
        cancellationReason: orders.cancellationReason,
        createdAt: orders.createdAt,
      })
      .from(orders)
      .where(and(eq(orders.requesterName, requesterName), eq(orders.orderDate, today)))
      .orderBy(desc(orders.createdAt));

    const itemRows = await getOrderStoreMeta(result.map((order) => order.id));
    return decorateOrders(result, itemRows);
  },
  "getMyOrders",
);

export const getTodayOrders = query(
  async (): Promise<OrderListItem[]> => {
    "use server";
    const today = todayString();
    const result = await db
      .select({
        id: orders.id,
        orderDate: orders.orderDate,
        requesterName: orders.requesterName,
        buyerProfileId: orders.buyerProfileId,
        buyerName: orders.buyerName,
        storeId: orders.storeId,
        status: orders.status,
        paymentStatus: orders.paymentStatus,
        notes: orders.notes,
        totalAmount: orders.totalAmount,
        purchasedAt: orders.purchasedAt,
        paidAt: orders.paidAt,
        cancelledAt: orders.cancelledAt,
        cancellationReason: orders.cancellationReason,
        createdAt: orders.createdAt,
      })
      .from(orders)
      .where(eq(orders.orderDate, today))
      .orderBy(desc(orders.createdAt));

    const itemRows = await getOrderStoreMeta(result.map((order) => order.id));
    return decorateOrders(result, itemRows);
  },
  "getTodayOrders",
);

export const getBuyerOrdersByStore = query(async (): Promise<BuyerStoreOrdersGroup[]> => {
  "use server";
  const today = todayString();
  const rows = await db
    .select({
      itemId: orderItems.id,
      orderId: orders.id,
      requesterName: orders.requesterName,
      buyerName: orders.buyerName,
      status: orders.status,
      paymentStatus: orders.paymentStatus,
      createdAt: orders.createdAt,
      storeId: orderItems.storeId,
      storeName: orderItems.storeNameSnapshot,
      menuName: orderItems.menuNameSnapshot,
      quantity: orderItems.quantity,
      subtotal: orderItems.subtotal,
      fulfillmentStatus: orderItems.fulfillmentStatus,
      fulfilledAt: orderItems.fulfilledAt,
      notes: orderItems.notes,
    })
    .from(orders)
    .innerJoin(orderItems, eq(orderItems.orderId, orders.id))
    .where(eq(orders.orderDate, today))
    .orderBy(orderItems.storeNameSnapshot, desc(orders.createdAt), orderItems.id);

  const storeMap = new Map<
    number,
    {
      storeId: number;
      storeName: string;
      orders: Map<
        number,
        {
          orderId: number;
          requesterName: string;
          buyerName: string | null;
          status: string;
          paymentStatus: string;
          createdAt: Date;
          items: BuyerStoreOrderItem[];
          storeAmount: number;
          itemCount: number;
          pendingItemCount: number;
          purchasedItemCount: number;
          unavailableItemCount: number;
        }
      >;
    }
  >();

  for (const row of rows) {
    if (!storeMap.has(row.storeId)) {
      storeMap.set(row.storeId, {
        storeId: row.storeId,
        storeName: row.storeName,
        orders: new Map(),
      });
    }

    const storeEntry = storeMap.get(row.storeId)!;
    if (!storeEntry.orders.has(row.orderId)) {
      storeEntry.orders.set(row.orderId, {
        orderId: row.orderId,
        requesterName: row.requesterName,
        buyerName: row.buyerName,
        status: row.status,
        paymentStatus: row.paymentStatus,
        createdAt: row.createdAt,
        items: [],
        storeAmount: 0,
        itemCount: 0,
        pendingItemCount: 0,
        purchasedItemCount: 0,
        unavailableItemCount: 0,
      });
    }

    const orderEntry = storeEntry.orders.get(row.orderId)!;
    orderEntry.items.push({
      id: row.itemId,
      menuName: row.menuName,
      quantity: row.quantity,
      fulfillmentStatus: row.fulfillmentStatus,
      fulfilledAt: row.fulfilledAt,
      subtotal: row.subtotal,
      notes: row.notes,
    });
    if (row.fulfillmentStatus !== "unavailable") {
      orderEntry.storeAmount += row.subtotal;
    }
    orderEntry.itemCount += row.quantity;
    if (row.fulfillmentStatus === "pending") {
      orderEntry.pendingItemCount += 1;
    } else if (row.fulfillmentStatus === "purchased") {
      orderEntry.purchasedItemCount += 1;
    } else {
      orderEntry.unavailableItemCount += 1;
    }
  }

  return Array.from(storeMap.values()).map((store) => {
    const ordersForStore = Array.from(store.orders.values()).map((order) => ({
      ...order,
      itemSummary: buildOrderSummary(
        order.items.map((item) => ({
          menuName: item.menuName,
          quantity: item.quantity,
        })),
      ),
    }));

    return {
      storeId: store.storeId,
      storeName: store.storeName,
      orderCount: ordersForStore.length,
      pendingCount: ordersForStore.filter((order) => order.status === "submitted").length,
      purchasedCount: ordersForStore.filter((order) => order.status === "purchased").length,
      unpaidCount: ordersForStore.filter(
        (order) => order.status === "purchased" && order.paymentStatus !== "paid",
      ).length,
      totalItems: ordersForStore.reduce((sum, order) => sum + order.itemCount, 0),
      totalAmount: ordersForStore.reduce((sum, order) => sum + order.storeAmount, 0),
      pendingItemCount: ordersForStore.reduce(
        (sum, order) => sum + order.pendingItemCount,
        0,
      ),
      purchasedItemCount: ordersForStore.reduce(
        (sum, order) => sum + order.purchasedItemCount,
        0,
      ),
      unavailableItemCount: ordersForStore.reduce(
        (sum, order) => sum + order.unavailableItemCount,
        0,
      ),
      orders: ordersForStore,
    };
  });
}, "getBuyerOrdersByStore");

export const getOrderById = query(
  async (id: number): Promise<OrderDetail | null> => {
    "use server";
    const [order] = await db
      .select({
        id: orders.id,
        orderDate: orders.orderDate,
        requesterName: orders.requesterName,
        buyerProfileId: orders.buyerProfileId,
        buyerName: orders.buyerName,
        storeId: orders.storeId,
        status: orders.status,
        paymentStatus: orders.paymentStatus,
        notes: orders.notes,
        totalAmount: orders.totalAmount,
        purchasedAt: orders.purchasedAt,
        paidAt: orders.paidAt,
        paymentProofUrl: orders.paymentProofUrl,
        paymentProofUploadedAt: orders.paymentProofUploadedAt,
        cancelledAt: orders.cancelledAt,
        cancellationReason: orders.cancellationReason,
        createdAt: orders.createdAt,
      })
      .from(orders)
      .where(eq(orders.id, id));

    if (!order) return null;

    const items = await db
      .select({
        id: orderItems.id,
        orderId: orderItems.orderId,
        storeId: orderItems.storeId,
        storeNameSnapshot: orderItems.storeNameSnapshot,
        menuId: orderItems.menuId,
        menuNameSnapshot: orderItems.menuNameSnapshot,
        priceSnapshot: orderItems.priceSnapshot,
        quantity: orderItems.quantity,
        fulfillmentStatus: orderItems.fulfillmentStatus,
        fulfilledAt: orderItems.fulfilledAt,
        notes: orderItems.notes,
        subtotal: orderItems.subtotal,
        createdAt: orderItems.createdAt,
      })
      .from(orderItems)
      .where(eq(orderItems.orderId, id))
      .orderBy(orderItems.id);

    const storeGroupsMap = new Map<number, OrderStoreGroup>();
    for (const item of items) {
      if (!storeGroupsMap.has(item.storeId)) {
        storeGroupsMap.set(item.storeId, {
          storeId: item.storeId,
          storeName: item.storeNameSnapshot,
          items: [],
          totalAmount: 0,
          totalQuantity: 0,
        });
      }
      const group = storeGroupsMap.get(item.storeId)!;
      group.items.push(item);
      if (item.fulfillmentStatus !== "unavailable") {
        group.totalAmount += item.subtotal;
      }
      group.totalQuantity += item.quantity;
    }

    let buyerPaymentProfile: OrderDetail["buyerPaymentProfile"] = null;

    if (order.buyerProfileId) {
      const [profile] = await db
        .select({
          bankName: userProfiles.bankName,
          accountNumber: userProfiles.accountNumber,
          cardholderName: userProfiles.cardholderName,
        })
        .from(userProfiles)
        .where(eq(userProfiles.id, order.buyerProfileId));

      buyerPaymentProfile = profile ?? null;
    } else if (order.buyerName) {
      const normalizedBuyerName = order.buyerName
        .trim()
        .replace(/\s+/g, " ")
        .toLowerCase();
      const [legacyProfile] = await db
        .select({
          bankName: userProfiles.bankName,
          accountNumber: userProfiles.accountNumber,
          cardholderName: userProfiles.cardholderName,
        })
        .from(userProfiles)
        .where(eq(userProfiles.normalizedName, normalizedBuyerName));

      buyerPaymentProfile = legacyProfile ?? null;
    }

    const storeMeta = buildStoreSummary(
      Array.from(storeGroupsMap.values()).map((group) => ({
        storeId: group.storeId,
        storeName: group.storeName,
      })),
    );

    return {
      ...order,
      ...storeMeta,
      items,
      storeGroups: Array.from(storeGroupsMap.values()),
      buyerPaymentProfile,
    };
  },
  "getOrderById",
);

export const getBuyerRecap = query(async () => {
  "use server";
  const today = todayString();
  const rows = await db
    .select({
      orderId: orders.id,
      requesterName: orders.requesterName,
      orderStatus: orders.status,
      paymentStatus: orders.paymentStatus,
      storeId: orderItems.storeId,
      storeName: orderItems.storeNameSnapshot,
      menuName: orderItems.menuNameSnapshot,
      price: orderItems.priceSnapshot,
      quantity: orderItems.quantity,
      subtotal: orderItems.subtotal,
      itemNotes: orderItems.notes,
    })
    .from(orders)
    .innerJoin(orderItems, eq(orderItems.orderId, orders.id))
    .where(
      and(
        eq(orders.orderDate, today),
        ne(orders.status, "cancelled"),
        ne(orderItems.fulfillmentStatus, "unavailable"),
      ),
    )
    .orderBy(orderItems.storeNameSnapshot, orderItems.menuNameSnapshot);

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
            paymentStatus: string;
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
      paymentStatus: row.paymentStatus,
    });
  }

  return Array.from(storeMap.values()).map((store) => ({
    ...store,
    items: Array.from(store.items.values()),
  }));
}, "getBuyerRecap");

export const getSettlement = query(async () => {
  "use server";
  const today = todayString();
  const rows = await db
    .select({
      orderId: orders.id,
      requesterName: orders.requesterName,
      status: orders.status,
      paymentStatus: orders.paymentStatus,
      totalAmount: orders.totalAmount,
      storeId: orderItems.storeId,
      storeName: orderItems.storeNameSnapshot,
      menuName: orderItems.menuNameSnapshot,
      quantity: orderItems.quantity,
      price: orderItems.priceSnapshot,
      subtotal: orderItems.subtotal,
    })
    .from(orders)
    .innerJoin(orderItems, eq(orderItems.orderId, orders.id))
    .where(
      and(
        eq(orders.orderDate, today),
        ne(orders.status, "cancelled"),
        ne(orderItems.fulfillmentStatus, "unavailable"),
      ),
    )
    .orderBy(orders.requesterName, orderItems.storeNameSnapshot);

  const personMap = new Map<
    string,
    {
      requesterName: string;
      totalAmount: number;
      orderGroups: Map<
        number,
        {
          orderId: number;
          storeSummary: string;
          storeCount: number;
          status: string;
          paymentStatus: string;
          orderTotal: number;
          items: {
            storeName: string;
            menuName: string;
            quantity: number;
            price: number;
            subtotal: number;
          }[];
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
        storeSummary: "",
        storeCount: 0,
        status: row.status,
        paymentStatus: row.paymentStatus,
        orderTotal: row.totalAmount,
        items: [],
      });
      person.totalAmount += row.totalAmount;
    }

    person.orderGroups.get(row.orderId)!.items.push({
      storeName: row.storeName,
      menuName: row.menuName,
      quantity: row.quantity,
      price: row.price,
      subtotal: row.subtotal,
    });
  }

  return Array.from(personMap.values()).map((person) => ({
    ...person,
    orderGroups: Array.from(person.orderGroups.values()).map((group) => {
      const storeMeta = buildStoreSummaryFromNames(
        group.items.map((item) => item.storeName),
      );

      return {
        ...group,
        storeSummary: storeMeta.storeSummary,
        storeCount: storeMeta.storeCount,
      };
    }),
  }));
}, "getSettlement");

async function syncOrderAfterItemUpdates(
  orderId: number,
  buyerName: string,
  buyerProfileId: number,
) {
  const items = await db
    .select({
      id: orderItems.id,
      fulfillmentStatus: orderItems.fulfillmentStatus,
      subtotal: orderItems.subtotal,
    })
    .from(orderItems)
    .where(eq(orderItems.orderId, orderId));

  if (items.length === 0) return;

  const hasPendingItems = items.some((item) => item.fulfillmentStatus === "pending");
  const recalculatedTotal = items
    .filter((item) => item.fulfillmentStatus !== "unavailable")
    .reduce((sum, item) => sum + item.subtotal, 0);

  await db
    .update(orders)
    .set({
      buyerProfileId,
      buyerName,
      status: hasPendingItems ? "submitted" : "purchased",
      totalAmount: recalculatedTotal,
      purchasedAt: hasPendingItems ? null : new Date(),
      updatedAt: new Date(),
    })
    .where(eq(orders.id, orderId));
}

export const createOrderAction = action(async (formData: FormData) => {
  "use server";
  const parsed = CreateOrderSchema.parse({
    requesterName: formData.get("requesterName"),
    notes: formData.get("notes") || null,
    items: JSON.parse(formData.get("items") as string),
  });

  const totalAmount = parsed.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const today = todayString();

  const [order] = await db
    .insert(orders)
    .values({
      orderDate: today,
      requesterName: parsed.requesterName,
      storeId: parsed.items[0].storeId,
      notes: parsed.notes,
      status: "submitted",
      paymentStatus: "unpaid",
      totalAmount,
    })
    .returning({ id: orders.id });

  await db.insert(orderItems).values(
    parsed.items.map((item) => ({
      orderId: order.id,
      storeId: item.storeId,
      storeNameSnapshot: item.storeName,
      menuId: item.menuId,
      menuNameSnapshot: item.menuName,
      priceSnapshot: item.price,
      quantity: item.quantity,
      notes: item.notes ?? null,
      subtotal: item.price * item.quantity,
    })),
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
  const buyerProfileId = parseInt(formData.get("buyerProfileId") as string);

  if (Number.isNaN(buyerProfileId) || !buyerName?.trim()) {
    throw new Error("Data pembeli tidak valid.");
  }

  await db
    .update(orderItems)
    .set({
      fulfillmentStatus: "purchased",
      fulfilledAt: new Date(),
    })
    .where(and(eq(orderItems.orderId, id), eq(orderItems.fulfillmentStatus, "pending")));

  await syncOrderAfterItemUpdates(id, buyerName, buyerProfileId);

  return redirect("/buyer/orders");
}, "markPurchased");

export const updateOrderItemFulfillmentAction = action(
  async (formData: FormData) => {
    "use server";
    const parsed = UpdateOrderItemFulfillmentSchema.parse({
      itemId: formData.get("itemId"),
      status: formData.get("status"),
      buyerName: formData.get("buyerName"),
      buyerProfileId: formData.get("buyerProfileId"),
      redirectTo: (formData.get("redirectTo") as string) || "/buyer/orders",
    });

    const [item] = await db
      .select({
        orderId: orderItems.orderId,
      })
      .from(orderItems)
      .where(eq(orderItems.id, parsed.itemId));

    if (!item) {
      throw new Error("Item order tidak ditemukan.");
    }

    await db
      .update(orderItems)
      .set({
        fulfillmentStatus: parsed.status,
        fulfilledAt: parsed.status === "pending" ? null : new Date(),
      })
      .where(eq(orderItems.id, parsed.itemId));

    await syncOrderAfterItemUpdates(
      item.orderId,
      parsed.buyerName,
      parsed.buyerProfileId,
    );

    return redirect(parsed.redirectTo || "/buyer/orders");
  },
  "updateOrderItemFulfillment",
);

export const markStoreItemsPurchasedAction = action(
  async (formData: FormData) => {
    "use server";
    const parsed = BulkStoreFulfillmentSchema.parse({
      storeId: formData.get("storeId"),
      buyerName: formData.get("buyerName"),
      buyerProfileId: formData.get("buyerProfileId"),
      redirectTo: (formData.get("redirectTo") as string) || "/buyer/orders",
    });

    const today = todayString();
    const pendingRows = await db
      .select({
        orderId: orderItems.orderId,
        itemId: orderItems.id,
      })
      .from(orderItems)
      .innerJoin(orders, eq(orders.id, orderItems.orderId))
      .where(
        and(
          eq(orders.orderDate, today),
          eq(orderItems.storeId, parsed.storeId),
          eq(orderItems.fulfillmentStatus, "pending"),
          ne(orders.status, "cancelled"),
        ),
      );

    if (pendingRows.length === 0) {
      return redirect(parsed.redirectTo || "/buyer/orders");
    }

    const now = new Date();
    await db
      .update(orderItems)
      .set({
        fulfillmentStatus: "purchased",
        fulfilledAt: now,
      })
      .where(
        inArray(
          orderItems.id,
          pendingRows.map((row) => row.itemId),
        ),
      );

    const orderIds = Array.from(new Set(pendingRows.map((row) => row.orderId)));
    for (const orderId of orderIds) {
      await syncOrderAfterItemUpdates(
        orderId,
        parsed.buyerName,
        parsed.buyerProfileId,
      );
    }

    return redirect(parsed.redirectTo || "/buyer/orders");
  },
  "markStoreItemsPurchased",
);

export const markOrderPaidAction = action(async (formData: FormData) => {
  "use server";
  const id = parseInt(formData.get("id") as string);
  const paymentProofUrl = (formData.get("paymentProofUrl") as string)?.trim();

  if (!paymentProofUrl) {
    throw new Error("Bukti pembayaran wajib diupload.");
  }

  await db
    .update(orders)
    .set({
      paymentStatus: "paid",
      paidAt: new Date(),
      paymentProofUrl,
      paymentProofUploadedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(orders.id, id));

  return redirect(`/orders/${id}`);
}, "markOrderPaid");
