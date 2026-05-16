import { createAsync } from "@solidjs/router";
import { createMemo, For, Show, Suspense } from "solid-js";
import { Title } from "@solidjs/meta";
import Layout from "~/components/Layout";
import RoleGuard from "~/components/RoleGuard";
import { getSettlement } from "~/server/orders";
import { formatRupiah, formatDate, todayString, statusBadgeClass, statusLabel } from "~/lib/utils";

export const route = {
  load: () => getSettlement(),
};

export default function BuyerSettlementPage() {
  return (
    <RoleGuard requiredRole="pembeli">
      <BuyerSettlementContent />
    </RoleGuard>
  );
}

function BuyerSettlementContent() {
  const settlement = createAsync(() => getSettlement());

  const grandTotal = createMemo(() =>
    (settlement() ?? []).reduce((sum, p) => sum + p.totalAmount, 0)
  );

  return (
    <>
      <Title>Tagihan - Titip Makan</Title>
      <Layout title="Rekap Tagihan">
        <div class="mb-4">
          <p class="text-sm text-gray-500">{formatDate(todayString())}</p>
        </div>

        <Suspense
          fallback={
            <div class="space-y-4">
              {[1, 2, 3].map(() => (
                <div class="card h-40 animate-pulse bg-gray-100" />
              ))}
            </div>
          }
        >
          <Show
            when={(settlement() ?? []).length > 0}
            fallback={
              <div class="card p-8 text-center">
                <p class="text-3xl">💰</p>
                <p class="mt-2 font-semibold text-gray-700">
                  Belum ada tagihan hari ini
                </p>
                <p class="mt-1 text-sm text-gray-400">
                  Tagihan muncul saat ada order yang tidak dibatalkan
                </p>
              </div>
            }
          >
            {/* Grand total */}
            <div class="card mb-4 bg-gradient-to-r from-primary-500 to-primary-600 p-5 text-white">
              <p class="text-sm opacity-80">Total Semua Tagihan</p>
              <p class="mt-1 text-2xl font-bold">{formatRupiah(grandTotal())}</p>
              <p class="mt-1 text-sm opacity-80">
                {(settlement() ?? []).length} orang yang nitip
              </p>
            </div>

            {/* Quick summary list */}
            <div class="card mb-4 divide-y divide-gray-50">
              <div class="p-3">
                <p class="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Ringkasan Tagihan
                </p>
              </div>
              <For each={settlement()}>
                {(person) => (
                  <div class="flex items-center justify-between px-4 py-3">
                    <div class="flex items-center gap-3">
                      <div class="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-sm font-bold text-primary-700">
                        {person.requesterName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p class="text-sm font-semibold text-gray-900">
                          {person.requesterName}
                        </p>
                        <p class="text-xs text-gray-400">
                          {person.orderGroups.length} order
                        </p>
                      </div>
                    </div>
                    <p class="font-bold text-primary-600">
                      {formatRupiah(person.totalAmount)}
                    </p>
                  </div>
                )}
              </For>
            </div>

            {/* Detail per person */}
            <div class="space-y-4">
              <For each={settlement()}>
                {(person) => (
                  <div class="card overflow-hidden">
                    {/* Person header */}
                    <div class="bg-gray-50 px-4 py-3 border-b border-gray-100">
                      <div class="flex items-center justify-between">
                        <div class="flex items-center gap-3">
                          <div class="flex h-10 w-10 items-center justify-center rounded-full bg-primary-500 text-base font-bold text-white">
                            {person.requesterName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p class="font-semibold text-gray-900">
                              {person.requesterName}
                            </p>
                            <p class="text-xs text-gray-400">
                              Yang Nitip
                            </p>
                          </div>
                        </div>
                        <div class="text-right">
                          <p class="text-lg font-bold text-primary-600">
                            {formatRupiah(person.totalAmount)}
                          </p>
                          <p class="text-xs text-gray-400">
                            {person.orderGroups.length} order
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Orders */}
                    <div class="divide-y divide-gray-50">
                      <For each={person.orderGroups}>
                        {(order) => (
                          <div class="p-4">
                            <div class="mb-2 flex items-center justify-between">
                              <div class="flex items-center gap-2">
                                <span class="text-sm">🏪</span>
                                <span class="text-sm font-semibold text-gray-700">
                                  {order.storeName}
                                </span>
                                <span class={statusBadgeClass(order.status)}>
                                  {statusLabel(order.status)}
                                </span>
                              </div>
                              <span class="text-sm font-bold text-gray-900">
                                {formatRupiah(order.orderTotal)}
                              </span>
                            </div>

                            <div class="space-y-1 pl-2">
                              <For each={order.items}>
                                {(item) => (
                                  <div class="flex justify-between text-sm">
                                    <span class="text-gray-600">
                                      {item.menuName} ×{item.quantity}
                                    </span>
                                    <span class="text-gray-900">
                                      {formatRupiah(item.subtotal)}
                                    </span>
                                  </div>
                                )}
                              </For>
                            </div>
                          </div>
                        )}
                      </For>
                    </div>

                    {/* Person total */}
                    <div class="border-t border-gray-100 bg-primary-50 px-4 py-3">
                      <div class="flex justify-between">
                        <span class="font-bold text-gray-900">
                          Total Tagihan {person.requesterName}
                        </span>
                        <span class="font-bold text-primary-600">
                          {formatRupiah(person.totalAmount)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </For>
            </div>
          </Show>
        </Suspense>
      </Layout>
    </>
  );
}
