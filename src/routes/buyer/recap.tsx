import { Title } from "@solidjs/meta";
import { A, createAsync } from "@solidjs/router";
import {
  ArrowRight as IconArrowRight,
  Receipt as IconReceipt,
  Store as IconStore,
  Wallet as IconWallet,
} from "lucide-solid";
import { createMemo, For, Show, Suspense } from "solid-js";
import Layout from "~/components/Layout";
import RoleGuard from "~/components/RoleGuard";
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
  const completedStores = createMemo(
    () =>
      (recap() ?? []).filter((store) =>
        store.items.every((item) =>
          item.orders.every((order) => order.status === "purchased"),
        ),
      ).length,
  );

  return (
    <>
      <Title>Rekap Belanja - Titip Makan</Title>
      <Layout title="Titip Makan">
        <section class="space-y-6">
          <div class="flex items-start justify-between gap-4">
            <div>
              <h1 class="tm-page-title">Rekap Belanja</h1>
              <p class="mt-2 text-base text-slate-500">
                Pantau total belanja per store dan lihat item mana yang masih
                perlu dibeli.
              </p>
            </div>
            <A
              href="/buyer/orders"
              class="text-base font-semibold text-primary-700"
            >
              Kelola Order
            </A>
          </div>

          <div class="rounded-lg bg-gradient-to-br from-[#35bced] via-cyan-400 to-sky-500 px-6 py-6 text-primary-800 shadow-[0_18px_36px_rgba(53,188,237,0.2)]">
            <div class="flex items-start justify-between gap-4">
              <div>
                <p class="text-primary-700">Total Belanja</p>
                <p class="mt-3 font-bold tracking-[-0.06em]">
                  {formatRupiah(grandTotal())}
                </p>
                <p class="mt-2 text-sm text-primary-700">
                  {(recap() ?? []).length} store aktif hari ini
                </p>
              </div>
              <div class="flex h-16 w-16 items-center justify-center rounded-lg bg-primary-700/10">
                <IconWallet class="h-8 w-8" />
              </div>
            </div>
          </div>

          <div class="grid grid-cols-3 gap-3">
            <RecapStatCard
              icon={<IconStore class="h-5 w-5" />}
              label="Store"
              value={String((recap() ?? []).length)}
            />
            <RecapStatCard
              icon={<IconReceipt class="h-5 w-5" />}
              label="Item"
              value={String(totalItems())}
            />
            <RecapStatCard
              icon={<IconWallet class="h-5 w-5" />}
              label="Selesai"
              value={String(completedStores())}
              tone="success"
            />
          </div>

          <Suspense fallback={<RecapSkeleton />}>
            <Show
              when={(recap() ?? []).length > 0}
              fallback={
                <div class="tm-card p-8">
                  <p class="text-slate-600">Belum ada data rekap belanja.</p>
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
                    const pendingOrders = storeData.items.reduce(
                      (sum, item) =>
                        sum +
                        item.orders.filter(
                          (order) => order.status === "submitted",
                        ).length,
                      0,
                    );
                    const purchasedOrders = storeData.items.reduce(
                      (sum, item) =>
                        sum +
                        item.orders.filter(
                          (order) => order.status === "purchased",
                        ).length,
                      0,
                    );

                    return (
                      <div class="tm-card overflow-hidden">
                        <div class="flex items-start justify-between gap-4 bg-slate-50 px-5 py-5">
                          <div class="flex items-start gap-4">
                            <div class="flex h-12 w-12 items-center justify-center rounded-lg bg-sky-100 font-bold text-primary-700">
                              {storeData.storeName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p
                                class={`font-semibold leading-tight tracking-[-0.05em] ${isDone ? "line-through text-slate-500" : "text-slate-900"}`}
                              >
                                {storeData.storeName}
                              </p>
                              <p class="mt-1 text-sm text-slate-500">
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

                        <div class="grid grid-cols-2 gap-3 px-5 pt-5">
                          <div class="rounded-lg bg-slate-50 px-4 py-3">
                            <p class="text-sm text-slate-500">Masih Pending</p>
                            <p class="mt-1 font-semibold text-slate-900">
                              {pendingOrders} order
                            </p>
                          </div>
                          <div class="rounded-lg bg-slate-50 px-4 py-3">
                            <p class="text-sm text-slate-500">Sudah Dibeli</p>
                            <p class="mt-1 font-semibold text-slate-900">
                              {purchasedOrders} order
                            </p>
                          </div>
                        </div>

                        <div class="px-5 py-5">
                          <For each={storeData.items}>
                            {(item) => (
                              <div class="border-b border-slate-200 py-4 last:border-b-0">
                                <div class="mb-2 flex items-start justify-between gap-4">
                                  <div>
                                    <div class="flex items-center gap-3">
                                      <p
                                        class={`font-semibold text-slate-900 ${isDone ? "line-through text-slate-400" : ""}`}
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

                        <div class="px-5 pb-5">
                          <Show
                            when={!isDone}
                            fallback={
                              <div class="flex items-center justify-between rounded-lg bg-emerald-50 px-4 py-4 text-emerald-700">
                                <p class="text-sm font-medium">
                                  Semua item dari store ini sudah selesai
                                  dibeli.
                                </p>
                                <IconWallet class="h-5 w-5" />
                              </div>
                            }
                          >
                            <A
                              href="/buyer/orders"
                              class="btn-primary w-full gap-2"
                            >
                              Kelola di Orders
                              <IconArrowRight class="h-4 w-4" />
                            </A>
                          </Show>
                        </div>
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

function RecapStatCard(props: {
  icon: any;
  label: string;
  value: string;
  tone?: "default" | "success";
}) {
  return (
    <div class="tm-card p-4 text-center">
      <div
        class={`mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-lg ${
          props.tone === "success"
            ? "bg-emerald-100 text-emerald-600"
            : "bg-sky-100 text-primary-700"
        }`}
      >
        {props.icon}
      </div>
      <p class="font-bold tracking-[-0.05em] text-slate-900">{props.value}</p>
      <p class="text-sm text-slate-600">{props.label}</p>
    </div>
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
