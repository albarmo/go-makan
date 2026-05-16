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
              <div class="card p-10 text-center">
                <p class="text-4xl">💰</p>
                <p class="mt-3 font-bold text-gray-800">Belum ada tagihan hari ini</p>
                <p class="mt-1 text-sm text-gray-400">
                  Tagihan muncul saat ada order yang tidak dibatalkan
                </p>
              </div>
            }
          >
            {/* Grand total banner */}
            <div class="mb-4 rounded-2xl bg-primary-700 p-5">
              <p class="text-xs text-primary-300">{formatDate(todayString())}</p>
              <p class="mt-1 text-2xl font-bold text-white">{formatRupiah(grandTotal())}</p>
              <p class="text-xs text-primary-300 mt-0.5">Total Semua Tagihan</p>
              <p class="mt-2 text-xs text-primary-200">
                {(settlement() ?? []).length} orang yang nitip
              </p>
            </div>

            {/* Summary list */}
            <div class="card mb-4 overflow-hidden">
              <div class="px-4 py-3 border-b border-gray-100">
                <p class="text-xs font-semibold uppercase tracking-wider text-gray-400">Ringkasan</p>
              </div>
              <For each={settlement()}>
                {(person) => (
                  <div class="flex items-center justify-between px-4 py-3 border-b border-gray-50 last:border-0">
                    <div class="flex items-center gap-3">
                      <div class="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-sm font-bold text-primary-700">
                        {person.requesterName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p class="text-sm font-semibold text-gray-900">{person.requesterName}</p>
                        <p class="text-xs text-gray-400">{person.orderGroups.length} order</p>
                      </div>
                    </div>
                    <p class="font-bold text-primary-600">{formatRupiah(person.totalAmount)}</p>
                  </div>
                )}
              </For>
            </div>

            {/* Detail per person */}
            <div class="space-y-3">
              <For each={settlement()}>
                {(person) => (
                  <div class="card overflow-hidden">
                    {/* Person header */}
                    <div class="flex items-center justify-between bg-slate-50 px-4 py-3">
                      <div class="flex items-center gap-3">
                        <div class="flex h-10 w-10 items-center justify-center rounded-full bg-primary-600 text-base font-bold text-white">
                          {person.requesterName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p class="font-semibold text-gray-900">{person.requesterName}</p>
                          <p class="text-xs text-gray-400">Yang Nitip</p>
                        </div>
                      </div>
                      <div class="text-right">
                        <p class="text-lg font-bold text-primary-600">
                          {formatRupiah(person.totalAmount)}
                        </p>
                        <p class="text-xs text-gray-400">{person.orderGroups.length} order</p>
                      </div>
                    </div>

                    {/* Orders */}
                    <div class="divide-y divide-gray-50">
                      <For each={person.orderGroups}>
                        {(order) => (
                          <div class="p-4">
                            <div class="mb-2 flex items-center justify-between">
                              <div class="flex items-center gap-2">
                                <span class="text-sm font-medium text-primary-600">{order.storeName}</span>
                                <span class={statusBadgeClass(order.status)}>
                                  {statusLabel(order.status)}
                                </span>
                              </div>
                              <span class="text-sm font-bold text-gray-900">
                                {formatRupiah(order.orderTotal)}
                              </span>
                            </div>
                            <div class="space-y-1 rounded-xl bg-slate-50 p-3">
                              <For each={order.items}>
                                {(item) => (
                                  <div class="flex justify-between text-xs">
                                    <span class="text-gray-600">
                                      {item.menuName} ×{item.quantity}
                                    </span>
                                    <span class="font-medium text-gray-800">
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

                    {/* Total */}
                    <div class="flex justify-between border-t border-gray-100 bg-primary-50 px-4 py-3">
                      <span class="text-sm font-bold text-gray-900">Total {person.requesterName}</span>
                      <span class="text-sm font-bold text-primary-600">{formatRupiah(person.totalAmount)}</span>
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
