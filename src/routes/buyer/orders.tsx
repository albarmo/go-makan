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
import { IconArrowRight } from "~/components/icons";

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

  const totalAll = createMemo(() =>
    (allOrders() ?? []).reduce((sum, o) => sum + o.totalAmount, 0)
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
      <Layout title="Titipan Hari Ini">
        <Suspense
          fallback={
            <div class="space-y-3">
              {[1, 2, 3].map(() => (
                <div class="card h-24 animate-pulse bg-gray-100" />
              ))}
            </div>
          }
        >
          {/* Stats strip */}
          <Show when={(allOrders() ?? []).length > 0}>
            <div class="mb-4 rounded-2xl bg-primary-700 p-4">
              <div class="grid grid-cols-3 gap-2">
                <div class="text-center">
                  <p class="text-xl font-bold text-white">{counts().all}</p>
                  <p class="text-xs text-primary-300">Total</p>
                </div>
                <div class="text-center">
                  <p class="text-xl font-bold text-amber-300">{counts().submitted}</p>
                  <p class="text-xs text-primary-300">Menunggu</p>
                </div>
                <div class="text-center">
                  <p class="text-xl font-bold text-emerald-300">{counts().purchased}</p>
                  <p class="text-xs text-primary-300">Selesai</p>
                </div>
              </div>
              <Show when={totalAll() > 0}>
                <div class="mt-3 border-t border-white/20 pt-3">
                  <p class="text-center text-xs text-primary-300">Total Tagihan</p>
                  <p class="text-center text-base font-bold text-white">
                    {formatRupiah(totalAll())}
                  </p>
                </div>
              </Show>
            </div>
          </Show>

          {/* Filter chips */}
          <div class="mb-3 flex gap-2 overflow-x-auto pb-1">
            <For each={tabs}>
              {(tab) => (
                <button
                  onClick={() => setFilter(tab.key)}
                  class={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                    filter() === tab.key
                      ? "bg-primary-600 text-white"
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
              <div class="card p-10 text-center">
                <p class="text-3xl">📦</p>
                <p class="mt-2 font-semibold text-gray-700">
                  {filter() === "all"
                    ? "Belum ada order hari ini"
                    : "Tidak ada order dengan status ini"}
                </p>
              </div>
            }
          >
            <div class="space-y-2">
              <For each={filtered()}>
                {(order) => (
                  <A
                    href={`/orders/${order.id}`}
                    class="card flex items-center gap-3 p-4 hover:shadow-md active:scale-[0.98] transition-all"
                  >
                    {/* Avatar initial */}
                    <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-100 text-sm font-bold text-primary-700">
                      {order.requesterName.charAt(0).toUpperCase()}
                    </div>
                    <div class="flex-1 min-w-0">
                      <p class="font-semibold text-gray-900">{order.requesterName}</p>
                      <p class="text-xs font-medium text-primary-600">{order.storeName}</p>
                      <p class="text-xs text-gray-400">{formatDateTime(order.createdAt)}</p>
                    </div>
                    <div class="flex shrink-0 flex-col items-end gap-1">
                      <span class={statusBadgeClass(order.status)}>
                        {statusLabel(order.status)}
                      </span>
                      <span class="text-sm font-bold text-primary-600">
                        {formatRupiah(order.totalAmount)}
                      </span>
                    </div>
                    <IconArrowRight class="h-4 w-4 shrink-0 text-gray-300" />
                  </A>
                )}
              </For>
            </div>
          </Show>
        </Suspense>
      </Layout>
    </>
  );
}
