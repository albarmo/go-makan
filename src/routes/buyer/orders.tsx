import { Title } from "@solidjs/meta";
import { A, createAsync } from "@solidjs/router";
import { createMemo, createSignal, For, Show, Suspense } from "solid-js";
import Layout from "~/components/Layout";
import RoleGuard from "~/components/RoleGuard";
import { IconCalendar, IconFilter, IconStore } from "~/components/icons";
import { formatRupiah, statusLabel } from "~/lib/utils";
import { getTodayOrders } from "~/server/orders";

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
  const [filter, setFilter] = createSignal<
    "all" | "submitted" | "purchased" | "cancelled"
  >("all");

  const filteredOrders = createMemo(() => {
    const orders = allOrders() ?? [];
    if (filter() === "all") return orders;
    return orders.filter((order) => order.status === filter());
  });

  return (
    <>
      <Title>Semua Titipan - Titip Makan</Title>
      <Layout title="Titip Makan">
        <section class="space-y-6">
          <h1 class="tm-page-title">Semua Titipan</h1>

          <div class="grid grid-cols-3 gap-3">
            <button
              type="button"
              class="tm-panel flex items-center justify-between text-left text-lg text-slate-600"
            >
              <span>Date</span>
              <IconCalendar class="h-6 w-6 text-primary-700" />
            </button>
            <button
              type="button"
              class="tm-panel flex items-center justify-between text-left text-lg text-slate-600"
            >
              <span>Store</span>
              <IconStore class="h-6 w-6 text-primary-700" />
            </button>
            <button
              type="button"
              class="tm-panel flex items-center justify-between text-left text-lg text-slate-600"
            >
              <span>Status</span>
              <IconFilter class="h-6 w-6 text-primary-700" />
            </button>
          </div>

          <div class="flex gap-3 overflow-x-auto pb-1">
            <FilterChip
              label="Semua"
              active={filter() === "all"}
              onClick={() => setFilter("all")}
            />
            <FilterChip
              label="Pending"
              active={filter() === "submitted"}
              onClick={() => setFilter("submitted")}
            />
            <FilterChip
              label="Selesai"
              active={filter() === "purchased"}
              onClick={() => setFilter("purchased")}
            />
            <FilterChip
              label="Batal"
              active={filter() === "cancelled"}
              onClick={() => setFilter("cancelled")}
            />
          </div>

          <Suspense fallback={<OrdersSkeleton />}>
            <Show
              when={filteredOrders().length > 0}
              fallback={
                <div class="tm-card p-8">
                  <p class="text-lg text-slate-600">
                    Belum ada titipan yang cocok dengan filter ini.
                  </p>
                </div>
              }
            >
              <div class="space-y-6">
                <For each={filteredOrders()}>
                  {(order) => (
                    <div class="tm-card p-7">
                      <div class="mb-5 flex items-start justify-between gap-4">
                        <div class="flex items-start gap-4">
                          <div class="flex h-14 w-14 items-center justify-center rounded-full bg-slate-200 text-lg font-bold text-primary-700">
                            {order.requesterName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p class="text-xl font-semibold leading-tight tracking-[-0.05em] text-slate-900">
                              {order.requesterName}
                            </p>
                            <p class="text-lg leading-8 text-primary-700">
                              {order.storeName}
                            </p>
                          </div>
                        </div>
                        <span
                          class={
                            order.status === "purchased"
                              ? "badge-purchased"
                              : order.status === "cancelled"
                                ? "badge-cancelled"
                                : "badge-submitted"
                          }
                        >
                          {order.status === "submitted"
                            ? "Pending"
                            : statusLabel(order.status)}
                        </span>
                      </div>

                      <div class="tm-card-soft mb-6 px-5 py-5">
                        <p class="text-lg leading-9 text-slate-700">
                          {order.itemSummary}
                        </p>
                      </div>

                      <div class="mb-6 flex items-center justify-between gap-4">
                        <p class="text-xl font-medium text-primary-700">
                          Total Tagihan
                        </p>
                        <p class="text-xl font-bold tracking-[-0.05em] text-slate-900">
                          {formatRupiah(order.totalAmount)}
                        </p>
                      </div>

                      <Show
                        when={order.status === "submitted"}
                        fallback={
                          <div class="flex justify-end">
                            <A
                              href={`/orders/${order.id}`}
                              class="text-xl font-semibold text-primary-700"
                            >
                              Lihat Detail
                            </A>
                          </div>
                        }
                      >
                        <div class="grid grid-cols-2 gap-4">
                          <A href={`/orders/${order.id}`} class="btn-secondary">
                            Batalkan
                          </A>
                          <A href={`/orders/${order.id}`} class="btn-primary">
                            Sudah Dibeli
                          </A>
                        </div>
                      </Show>
                    </div>
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

function FilterChip(props: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={props.onClick}
      class={`shrink-0 rounded-full px-5 py-3 text-base font-semibold transition-all ${
        props.active
          ? "bg-[#35bced] text-primary-700"
          : "bg-white text-slate-500 shadow-sm"
      }`}
    >
      {props.label}
    </button>
  );
}

function OrdersSkeleton() {
  return (
    <div class="space-y-6">
      {[1, 2].map((item) => (
        <div class="h-72 animate-pulse rounded-[2rem] bg-white/80" />
      ))}
    </div>
  );
}
