import { createAsync } from "@solidjs/router";
import { createMemo, createSignal, For, Show, Suspense } from "solid-js";
import { Title } from "@solidjs/meta";
import { A } from "@solidjs/router";
import Layout from "~/components/Layout";
import RoleGuard from "~/components/RoleGuard";
import { getTodayOrders } from "~/server/orders";
import {
  formatRupiah,
  formatDateTime,
  statusBadgeClass,
  statusLabel,
} from "~/lib/utils";

export const route = {
  load: () => getTodayOrders(),
};

export default function BuyerOrdersPage() {
  return (
    <RoleGuard requiredRole="pembeli">
      <BuyerOrdersContent />
    </RoleGuard>
  );
}

function BuyerOrdersContent() {
  const allOrders = createAsync(() => getTodayOrders());
  const [filter, setFilter] = createSignal<"all" | "submitted" | "purchased" | "cancelled">("all");

  const filtered = createMemo(() => {
    const orders = allOrders() ?? [];
    if (filter() === "all") return orders;
    return orders.filter((o) => o.status === filter());
  });

  const counts = createMemo(() => {
    const orders = allOrders() ?? [];
    return {
      all: orders.length,
      submitted: orders.filter((o) => o.status === "submitted").length,
      purchased: orders.filter((o) => o.status === "purchased").length,
      cancelled: orders.filter((o) => o.status === "cancelled").length,
    };
  });

  const totalPurchased = createMemo(() =>
    (allOrders() ?? [])
      .filter((o) => o.status === "purchased")
      .reduce((sum, o) => sum + o.totalAmount, 0)
  );

  const tabs = [
    { key: "all" as const, label: "Semua" },
    { key: "submitted" as const, label: "Menunggu" },
    { key: "purchased" as const, label: "Sudah Dibeli" },
    { key: "cancelled" as const, label: "Batal" },
  ];

  return (
    <>
      <Title>Semua Order - Titip Makan</Title>
      <Layout title="Order Hari Ini">
        <Suspense
          fallback={
            <div class="space-y-3">
              {[1, 2, 3].map(() => (
                <div class="card h-28 animate-pulse bg-gray-100" />
              ))}
            </div>
          }
        >
          {/* Summary card */}
          <Show when={(allOrders() ?? []).length > 0}>
            <div class="card mb-4 grid grid-cols-3 divide-x divide-gray-100 p-4">
              <div class="pr-4 text-center">
                <p class="text-2xl font-bold text-gray-900">{counts().all}</p>
                <p class="text-xs text-gray-500">Total Order</p>
              </div>
              <div class="px-4 text-center">
                <p class="text-2xl font-bold text-yellow-600">{counts().submitted}</p>
                <p class="text-xs text-gray-500">Menunggu</p>
              </div>
              <div class="pl-4 text-center">
                <p class="text-2xl font-bold text-green-600">{counts().purchased}</p>
                <p class="text-xs text-gray-500">Sudah Dibeli</p>
              </div>
            </div>

            <Show when={totalPurchased() > 0}>
              <div class="card mb-4 bg-green-50 p-4">
                <p class="text-sm text-gray-600">Total Sudah Dibeli</p>
                <p class="text-xl font-bold text-green-700">
                  {formatRupiah(totalPurchased())}
                </p>
              </div>
            </Show>
          </Show>

          {/* Filter tabs */}
          <div class="mb-3 flex gap-2 overflow-x-auto pb-1">
            <For each={tabs}>
              {(tab) => (
                <button
                  onClick={() => setFilter(tab.key)}
                  class={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                    filter() === tab.key
                      ? "bg-primary-500 text-white"
                      : "bg-white text-gray-600 border border-gray-200"
                  }`}
                >
                  {tab.label}
                  <Show when={counts()[tab.key] > 0}>
                    <span class="ml-1 opacity-70">({counts()[tab.key]})</span>
                  </Show>
                </button>
              )}
            </For>
          </div>

          <Show
            when={filtered().length > 0}
            fallback={
              <div class="card p-8 text-center">
                <p class="text-2xl">📦</p>
                <p class="mt-2 font-semibold text-gray-700">
                  {filter() === "all"
                    ? "Belum ada order hari ini"
                    : "Tidak ada order dengan status ini"}
                </p>
              </div>
            }
          >
            {/* Group by store */}
            <BuyerOrderList orders={filtered()} />
          </Show>
        </Suspense>
      </Layout>
    </>
  );
}

function BuyerOrderList(props: {
  orders: {
    id: number;
    requesterName: string;
    storeName: string;
    status: string;
    totalAmount: number;
    notes: string | null;
    createdAt: Date;
    buyerName: string | null;
  }[];
}) {
  // Group by store
  const grouped = createMemo(() => {
    const map = new Map<string, typeof props.orders>();
    for (const order of props.orders) {
      if (!map.has(order.storeName)) map.set(order.storeName, []);
      map.get(order.storeName)!.push(order);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  });

  return (
    <div class="space-y-4">
      <For each={grouped()}>
        {([storeName, orders]) => (
          <div>
            <h3 class="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-600">
              <span class="text-base">🏪</span>
              {storeName}
              <span class="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                {orders.length} order
              </span>
            </h3>
            <div class="space-y-2">
              <For each={orders}>
                {(order) => (
                  <A
                    href={`/orders/${order.id}`}
                    class="card block p-4 hover:shadow-md active:scale-95 transition-all"
                  >
                    <div class="flex items-start justify-between gap-2">
                      <div class="flex-1 min-w-0">
                        <p class="font-semibold text-gray-900">
                          {order.requesterName}
                        </p>
                        <p class="text-xs text-gray-400">
                          {formatDateTime(order.createdAt)}
                        </p>
                        <Show when={order.notes}>
                          <p class="mt-1 text-xs text-gray-500 italic">
                            "{order.notes}"
                          </p>
                        </Show>
                      </div>
                      <div class="flex shrink-0 flex-col items-end gap-1">
                        <span class={statusBadgeClass(order.status)}>
                          {statusLabel(order.status)}
                        </span>
                        <span class="text-sm font-bold text-primary-600">
                          {formatRupiah(order.totalAmount)}
                        </span>
                      </div>
                    </div>
                  </A>
                )}
              </For>
            </div>
          </div>
        )}
      </For>
    </div>
  );
}
