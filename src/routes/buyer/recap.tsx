import { createAsync } from "@solidjs/router";
import { createMemo, For, Show, Suspense } from "solid-js";
import { Title } from "@solidjs/meta";
import Layout from "~/components/Layout";
import RoleGuard from "~/components/RoleGuard";
import { getBuyerRecap } from "~/server/orders";
import { formatRupiah, formatDate, todayString } from "~/lib/utils";

export const route = {
  load: () => getBuyerRecap(),
};

export default function BuyerRecapPage() {
  return (
    <RoleGuard requiredRole="pembeli">
      <BuyerRecapContent />
    </RoleGuard>
  );
}

function BuyerRecapContent() {
  const recap = createAsync(() => getBuyerRecap());

  const grandTotal = createMemo(() =>
    (recap() ?? []).reduce(
      (sum, store) =>
        sum + store.items.reduce((s, item) => s + item.totalSubtotal, 0),
      0
    )
  );

  const totalItems = createMemo(() =>
    (recap() ?? []).reduce(
      (sum, store) =>
        sum + store.items.reduce((s, item) => s + item.totalQuantity, 0),
      0
    )
  );

  return (
    <>
      <Title>Rekap Belanja - Titip Makan</Title>
      <Layout title="Rekap Belanja">
        <div class="mb-4">
          <p class="text-sm text-gray-500">{formatDate(todayString())}</p>
        </div>

        <Suspense
          fallback={
            <div class="space-y-4">
              {[1, 2].map(() => (
                <div class="card h-48 animate-pulse bg-gray-100" />
              ))}
            </div>
          }
        >
          <Show
            when={(recap() ?? []).length > 0}
            fallback={
              <div class="card p-8 text-center">
                <p class="text-3xl">📊</p>
                <p class="mt-2 font-semibold text-gray-700">
                  Belum ada order hari ini
                </p>
                <p class="mt-1 text-sm text-gray-400">
                  Rekap akan muncul saat ada pesanan
                </p>
              </div>
            }
          >
            {/* Grand total */}
            <div class="card mb-4 bg-primary-500 p-5 text-white">
              <p class="text-sm opacity-80">Total Belanja Hari Ini</p>
              <p class="mt-1 text-2xl font-bold">{formatRupiah(grandTotal())}</p>
              <p class="mt-1 text-sm opacity-80">{totalItems()} item dari {(recap() ?? []).length} toko</p>
            </div>

            {/* Per store */}
            <div class="space-y-4">
              <For each={recap()}>
                {(storeData) => {
                  const storeTotalQty = () =>
                    storeData.items.reduce((s, i) => s + i.totalQuantity, 0);
                  const storeTotalAmount = () =>
                    storeData.items.reduce((s, i) => s + i.totalSubtotal, 0);

                  return (
                    <div class="card overflow-hidden">
                      {/* Store header */}
                      <div class="bg-gray-50 px-4 py-3 border-b border-gray-100">
                        <div class="flex items-center justify-between">
                          <div class="flex items-center gap-2">
                            <span>🏪</span>
                            <h3 class="font-semibold text-gray-900">
                              {storeData.storeName}
                            </h3>
                          </div>
                          <div class="text-right">
                            <p class="text-sm font-bold text-primary-600">
                              {formatRupiah(storeTotalAmount())}
                            </p>
                            <p class="text-xs text-gray-400">
                              {storeTotalQty()} item
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Menu items */}
                      <div class="divide-y divide-gray-50">
                        <For each={storeData.items}>
                          {(item) => (
                            <div class="p-4">
                              <div class="flex items-start justify-between gap-3">
                                <div class="flex-1">
                                  <div class="flex items-center gap-2">
                                    <p class="font-semibold text-gray-900">
                                      {item.menuName}
                                    </p>
                                    <span class="rounded-full bg-primary-100 px-2 py-0.5 text-xs font-bold text-primary-700">
                                      ×{item.totalQuantity}
                                    </span>
                                  </div>
                                  <p class="text-sm text-gray-500">
                                    {formatRupiah(item.price)} / porsi
                                  </p>
                                </div>
                                <p class="shrink-0 font-bold text-primary-600">
                                  {formatRupiah(item.totalSubtotal)}
                                </p>
                              </div>

                              {/* Detail per pemesan */}
                              <div class="mt-2 space-y-1.5">
                                <For each={item.orders}>
                                  {(orderDetail) => (
                                    <div class="rounded-lg bg-gray-50 px-3 py-2">
                                      <div class="flex items-center justify-between">
                                        <div class="flex items-center gap-2">
                                          <span class="text-xs font-medium text-gray-700">
                                            {orderDetail.requesterName}
                                          </span>
                                          <span class="text-xs text-gray-400">
                                            ×{orderDetail.quantity}
                                          </span>
                                          <Show when={orderDetail.status === "purchased"}>
                                            <span class="badge-purchased">Dibeli</span>
                                          </Show>
                                        </div>
                                        <span class="text-xs font-medium text-gray-600">
                                          {formatRupiah(item.price * orderDetail.quantity)}
                                        </span>
                                      </div>
                                      <Show when={orderDetail.notes}>
                                        <p class="mt-0.5 text-xs text-gray-400 italic">
                                          Catatan: {orderDetail.notes}
                                        </p>
                                      </Show>
                                    </div>
                                  )}
                                </For>
                              </div>
                            </div>
                          )}
                        </For>
                      </div>
                    </div>
                  );
                }}
              </For>
            </div>
          </Show>
        </Suspense>
      </Layout>
    </>
  );
}
