import { Title } from "@solidjs/meta";
import { A, createAsync } from "@solidjs/router";
import {
  Calendar as IconCalendar,
  Receipt as IconReceipt,
  Wallet as IconWallet,
} from "lucide-solid";
import { createMemo, For, Show, Suspense } from "solid-js";
import Layout from "~/components/Layout";
import RoleGuard from "~/components/RoleGuard";
import { useUser } from "~/lib/user-context";
import {
  formatRupiah,
  paymentStatusBadgeClass,
  paymentStatusLabel,
  statusBadgeClass,
  statusLabel,
} from "~/lib/utils";
import { getMyOrders, type OrderListItem } from "~/server/orders";

export default function SettlementPage() {
  return (
    <RoleGuard requiredRole="pemesan">
      <SettlementContent />
    </RoleGuard>
  );
}

function SettlementContent() {
  const { user } = useUser();
  const orders = createAsync<OrderListItem[]>(() =>
    getMyOrders(user()?.name ?? ""),
  );

  const activeOrders = createMemo(() =>
    (orders() ?? []).filter((order) => order.status !== "cancelled"),
  );
  const grandTotal = createMemo(() =>
    activeOrders().reduce((sum, order) => sum + order.totalAmount, 0),
  );
  const unpaidTotal = createMemo(() =>
    activeOrders()
      .filter((order) => order.paymentStatus !== "paid")
      .reduce((sum, order) => sum + order.totalAmount, 0),
  );
  const paidTotal = createMemo(() =>
    activeOrders()
      .filter((order) => order.paymentStatus === "paid")
      .reduce((sum, order) => sum + order.totalAmount, 0),
  );

  return (
    <>
      <Title>Tagihan - Titip Makan</Title>
      <Layout title="Tagihan">
        <section class="space-y-7">
          <div class="tm-panel flex items-center justify-between">
            <div class="flex items-center gap-4 text-primary-700">
              <IconCalendar class="h-7 w-7" />
              <div>
                <p class="text-base font-semibold">Tagihan Hari Ini</p>
                <p class="text-sm text-slate-500">
                  {activeOrders().length} order aktif
                </p>
              </div>
            </div>
            <A
              href="/orders/new"
              class="text-base font-semibold text-primary-700"
            >
              Titip Lagi
            </A>
          </div>

          <div class="relative overflow-hidden rounded-lg bg-[#35bced] px-6 py-7 text-primary-800 shadow-[0_18px_36px_rgba(53,188,237,0.2)]">
            <div class="absolute -left-10 top-14 h-24 w-24 rounded-lg bg-white/10" />
            <div class="absolute -right-6 -top-6 h-24 w-24 rounded-lg bg-white/10" />
            <div class="absolute right-8 top-1/2 h-14 w-14 -translate-y-1/2 rounded-lg bg-white/10" />

            <div class="relative">
              <div class="flex items-center gap-3">
                <div class="flex h-12 w-12 items-center justify-center rounded-lg bg-white/20 text-primary-800">
                  <IconWallet class="h-6 w-6" />
                </div>
                <div>
                  <p class="text-base font-medium">Total Tagihan</p>
                  <p class="text-sm text-primary-800/80">
                    Ringkasan pesanan kamu hari ini
                  </p>
                </div>
              </div>

              <p class="mt-5  font-bold tracking-[-0.06em]">
                {formatRupiah(grandTotal())}
              </p>

              <div class="mt-5 flex flex-wrap gap-3">
                <span class="rounded-lg bg-white/20 px-4 py-2 text-sm font-medium">
                  Belum Lunas: {formatRupiah(unpaidTotal())}
                </span>
                <span class="rounded-lg bg-white/20 px-4 py-2 text-sm font-medium">
                  Lunas: {formatRupiah(paidTotal())}
                </span>
              </div>
            </div>
          </div>

          <div class="flex items-end justify-between gap-4">
            <h2 class=" font-bold tracking-[-0.05em] text-slate-900">
              Rincian Tagihan
            </h2>
            <A
              href="/my-orders"
              class="text-base font-semibold text-primary-700"
            >
              Lihat Order
            </A>
          </div>

          <Suspense fallback={<SettlementSkeleton />}>
            <Show
              when={activeOrders().length > 0}
              fallback={
                <div class="tm-card p-7">
                  <div class="flex items-start gap-4">
                    <div class="flex h-12 w-12 items-center justify-center rounded-lg bg-sky-100 text-primary-700">
                      <IconReceipt class="h-6 w-6" />
                    </div>
                    <div>
                      <p class="text-lg font-semibold text-slate-900">
                        Belum ada tagihan hari ini
                      </p>
                      <p class="mt-2 text-base text-slate-600">
                        Setelah membuat order, rincian tagihan akan muncul di
                        sini.
                      </p>
                    </div>
                  </div>
                </div>
              }
            >
              <div class="space-y-5">
                <For each={activeOrders()}>
                  {(order) => (
                    <A href={`/orders/${order.id}`} class="tm-card block p-6">
                      <div class="flex items-start justify-between gap-4">
                        <div>
                          <p class="text-lg font-semibold leading-tight text-slate-900">
                            {order.storeSummary}
                          </p>
                          <p class="mt-2 text-base text-primary-700">
                            {order.buyerName
                              ? `Dibeli oleh ${order.buyerName}`
                              : "Menunggu pembeli"}
                          </p>
                        </div>
                        <span
                          class={
                            order.status === "purchased"
                              ? paymentStatusBadgeClass(order.paymentStatus)
                              : statusBadgeClass(order.status)
                          }
                        >
                          {order.status === "purchased"
                            ? paymentStatusLabel(order.paymentStatus)
                            : statusLabel(order.status)}
                        </span>
                      </div>

                      <div class="tm-divider my-5" />

                      <div class="rounded-lg bg-slate-50 px-4 py-4">
                        <p class="text-base leading-7 text-slate-700">
                          {order.itemSummary}
                        </p>
                      </div>

                      <div class="mt-5 flex items-center justify-between gap-4">
                        <div>
                          <p class="text-base text-slate-500">Total Tagihan</p>
                          <p class="mt-2  font-bold tracking-[-0.05em] text-primary-700">
                            {formatRupiah(order.totalAmount)}
                          </p>
                        </div>
                        <span class="text-base font-semibold text-primary-700">
                          Lihat Detail
                        </span>
                      </div>
                    </A>
                  )}
                </For>
              </div>
            </Show>
          </Suspense>
        </section>
      </Layout>
    </>
  );
}

function SettlementSkeleton() {
  return (
    <div class="space-y-5">
      <div class="h-40 animate-pulse rounded-lg bg-white/80" />
      <div class="h-52 animate-pulse rounded-lg bg-white/80" />
      <div class="h-52 animate-pulse rounded-lg bg-white/80" />
    </div>
  );
}
