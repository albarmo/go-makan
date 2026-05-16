import { Title } from "@solidjs/meta";
import { createAsync } from "@solidjs/router";
import { createMemo, For, Show, Suspense } from "solid-js";
import Layout from "~/components/Layout";
import RoleGuard from "~/components/RoleGuard";
import {
  IconCalendar,
  IconReceipt,
  IconStore,
  IconWallet,
} from "~/components/icons";
import { formatRupiah } from "~/lib/utils";
import { getBuyerRecap } from "~/server/orders";

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
        sum + store.items.reduce((acc, item) => acc + item.totalSubtotal, 0),
      0,
    ),
  );
  const totalItems = createMemo(() =>
    (recap() ?? []).reduce(
      (sum, store) =>
        sum + store.items.reduce((acc, item) => acc + item.totalQuantity, 0),
      0,
    ),
  );

  return (
    <>
      <Title>Rekap Belanja - Titip Makan</Title>
      <Layout title="Titip Makan">
        <section class="space-y-6">
          <div class="flex items-start justify-between gap-4">
            <h1 class="tm-page-title">Rekap Belanja</h1>
            <div class="tm-panel flex min-w-[11rem] items-center gap-4">
              <IconCalendar class="h-7 w-7 text-primary-700" />
              <span class=" font-semibold leading-8 text-slate-800">
                Hari ini
              </span>
            </div>
          </div>

          <div class="rounded-lg bg-[#35bced] px-8 py-8 text-primary-800 shadow-[0_18px_36px_rgba(53,188,237,0.2)]">
            <div class="flex items-start justify-between gap-4">
              <div>
                <p class=" text-primary-700">Total Belanja</p>
                <p class="mt-4  font-bold tracking-[-0.06em]">
                  {formatRupiah(grandTotal())}
                </p>
              </div>
              <div class="flex h-20 w-20 items-center justify-center rounded-lg bg-primary-700/10">
                <IconWallet class="h-10 w-10" />
              </div>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="tm-card p-6 text-center">
              <div class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-sky-100 text-primary-700">
                <IconStore class="h-6 w-6" />
              </div>
              <p class=" font-bold tracking-[-0.05em] text-slate-900">
                {(recap() ?? []).length}
              </p>
              <p class=" text-slate-600">Jumlah Store</p>
            </div>
            <div class="tm-card p-6 text-center">
              <div class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-sky-100 text-primary-700">
                <IconReceipt class="h-6 w-6" />
              </div>
              <p class=" font-bold tracking-[-0.05em] text-slate-900">
                {totalItems()}
              </p>
              <p class=" text-slate-600">Jumlah Item</p>
            </div>
          </div>

          <Suspense fallback={<RecapSkeleton />}>
            <Show
              when={(recap() ?? []).length > 0}
              fallback={
                <div class="tm-card p-8">
                  <p class=" text-slate-600">Belum ada data rekap belanja.</p>
                </div>
              }
            >
              <div class="space-y-6">
                <For each={recap()}>
                  {(storeData) => {
                    const totalStoreAmount = storeData.items.reduce(
                      (sum, item) => sum + item.totalSubtotal,
                      0,
                    );
                    const totalStoreItems = storeData.items.reduce(
                      (sum, item) => sum + item.totalQuantity,
                      0,
                    );
                    const isDone = storeData.items.every((item) =>
                      item.orders.every(
                        (order) => order.status === "purchased",
                      ),
                    );

                    return (
                      <div class="tm-card overflow-hidden">
                        <div class="flex items-start justify-between gap-4 bg-slate-50 px-6 py-5">
                          <div class="flex items-start gap-4">
                            <div class="flex h-14 w-14 items-center justify-center rounded-lg bg-sky-100  font-bold text-primary-700">
                              {storeData.storeName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p
                                class={` font-semibold leading-tight tracking-[-0.05em] ${isDone ? "line-through text-slate-500" : "text-slate-900"}`}
                              >
                                {storeData.storeName}
                              </p>
                              <p class="mt-1  text-slate-500">
                                {totalStoreItems} item •{" "}
                                {formatRupiah(totalStoreAmount)}
                              </p>
                            </div>
                          </div>
                          <span
                            class={
                              isDone ? "badge-purchased" : "badge-submitted"
                            }
                          >
                            {isDone ? "Sudah Dibeli" : "Belum Dibeli"}
                          </span>
                        </div>

                        <div class="px-6 py-6">
                          <For each={storeData.items}>
                            {(item) => (
                              <div class="border-b border-slate-200 py-5 last:border-b-0">
                                <div class="mb-2 flex items-start justify-between gap-4">
                                  <div>
                                    <div class="flex items-center gap-3">
                                      <p
                                        class={` font-semibold text-slate-900 ${isDone ? "line-through text-slate-400" : ""}`}
                                      >
                                        {item.menuName}
                                      </p>
                                      <span class="rounded-lg bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-500">
                                        x{item.totalQuantity}
                                      </span>
                                    </div>
                                    <p class="mt-3 text-base text-slate-600">
                                      {formatRupiah(item.totalSubtotal)}
                                    </p>
                                  </div>
                                </div>

                                <div class="mt-4 flex flex-wrap gap-2">
                                  <For each={item.orders}>
                                    {(orderDetail) => (
                                      <span class="rounded-lg bg-slate-100 px-4 py-2 text-sm text-slate-600">
                                        {orderDetail.requesterName}
                                        <Show when={orderDetail.notes}>
                                          {`: ${orderDetail.notes}`}
                                        </Show>
                                      </span>
                                    )}
                                  </For>
                                </div>
                              </div>
                            )}
                          </For>
                        </div>

                        <Show when={!isDone}>
                          <div class="px-6 pb-6">
                            <button type="button" class="btn-primary w-full">
                              Tandai Semua dari Store Ini Sudah Dibeli
                            </button>
                          </div>
                        </Show>
                      </div>
                    );
                  }}
                </For>
              </div>
            </Show>
          </Suspense>
        </section>
      </Layout>
    </>
  );
}

function RecapSkeleton() {
  return (
    <div class="space-y-6">
      {[1, 2].map((item) => (
        <div class="h-96 animate-pulse rounded-lg bg-white/80" />
      ))}
    </div>
  );
}
