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
        <Suspense
          fallback={
            <div class="space-y-4">
              {[1, 2].map(() => (
                <div class="card h-44 animate-pulse bg-gray-100" />
              ))}
            </div>
          }
        >
          <Show
            when={(recap() ?? []).length > 0}
            fallback={
              <div class="card p-10 text-center">
                <p class="text-4xl">📊</p>
                <p class="mt-3 font-bold text-gray-800">Belum ada order hari ini</p>
                <p class="mt-1 text-sm text-gray-400">
                  Rekap akan muncul saat ada pesanan
                </p>
              </div>
            }
          >
            {/* Grand total banner */}
            <div class="mb-4 rounded-2xl bg-primary-700 p-5">
              <p class="text-xs text-primary-300">{formatDate(todayString())}</p>
              <p class="mt-1 text-2xl font-bold text-white">{formatRupiah(grandTotal())}</p>
              <p class="text-xs text-primary-300 mt-0.5">Total Belanja Hari Ini</p>
              <div class="mt-3 flex gap-4 border-t border-white/20 pt-3">
                <div>
                  <p class="text-lg font-bold text-white">{totalItems()}</p>
                  <p class="text-xs text-primary-300">Total Item</p>
                </div>
                <div>
                  <p class="text-lg font-bold text-white">{(recap() ?? []).length}</p>
                  <p class="text-xs text-primary-300">Toko</p>
                </div>
              </div>
            </div>

            {/* Per store */}
            <div class="space-y-3">
              <For each={recap()}>
                {(storeData) => {
                  const storeTotalQty = () =>
                    storeData.items.reduce((s, i) => s + i.totalQuantity, 0);
                  const storeTotalAmount = () =>
                    storeData.items.reduce((s, i) => s + i.totalSubtotal, 0);

                  return (
                    <div class="card overflow-hidden">
                      {/* Store header */}
                      <div class="flex items-center justify-between bg-slate-50 px-4 py-3">
                        <div class="flex items-center gap-2.5">
                          <div class="flex h-8 w-8 items-center justify-center rounded-full bg-primary-600 text-sm font-bold text-white">
                            {storeData.storeName.charAt(0).toUpperCase()}
                          </div>
                          <p class="font-semibold text-gray-900">{storeData.storeName}</p>
                        </div>
                        <div class="text-right">
                          <p class="text-sm font-bold text-primary-600">
                            {formatRupiah(storeTotalAmount())}
                          </p>
                          <p class="text-xs text-gray-400">{storeTotalQty()} item</p>
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
                                    <p class="font-semibold text-gray-900">{item.menuName}</p>
                                    <span class="rounded-full bg-primary-100 px-2 py-0.5 text-xs font-bold text-primary-700">
                                      ×{item.totalQuantity}
                                    </span>
                                  </div>
                                  <p class="text-xs text-gray-400">{formatRupiah(item.price)} / porsi</p>
                                </div>
                                <p class="shrink-0 font-bold text-primary-600">
                                  {formatRupiah(item.totalSubtotal)}
                                </p>
                              </div>

                              {/* Per pemesan */}
                              <div class="mt-2.5 space-y-1.5">
                                <For each={item.orders}>
                                  {(orderDetail) => (
                                    <div class="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                                      <div class="flex items-center gap-2">
                                        <div class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary-100 text-[10px] font-bold text-primary-700">
                                          {orderDetail.requesterName.charAt(0).toUpperCase()}
                                        </div>
                                        <span class="text-xs font-medium text-gray-700">
                                          {orderDetail.requesterName}
                                        </span>
                                        <span class="text-xs text-gray-400">×{orderDetail.quantity}</span>
                                        <Show when={orderDetail.notes}>
                                          <span class="text-xs text-gray-400 italic">
                                            — {orderDetail.notes}
                                          </span>
                                        </Show>
                                      </div>
                                      <span class="text-xs font-semibold text-gray-700">
                                        {formatRupiah(item.price * orderDetail.quantity)}
                                      </span>
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
