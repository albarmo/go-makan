import { Title } from "@solidjs/meta";
import { A, createAsync } from "@solidjs/router";
import { Calendar as IconCalendar } from "lucide-solid";
import { createMemo, createSignal, For, Show, Suspense } from "solid-js";
import Layout from "~/components/Layout";
import RoleGuard from "~/components/RoleGuard";
import { useUser } from "~/lib/user-context";
import {
  formatRelativeOrderTime,
  formatRupiah,
  paymentStatusBadgeClass,
  paymentStatusLabel,
  statusLabel,
} from "~/lib/utils";
import { getMyOrders, type OrderListItem } from "~/server/orders";

export default function MyOrdersPage() {
  return (
    <RoleGuard requiredRole="pemesan">
      <MyOrdersContent />
    </RoleGuard>
  );
}

function MyOrdersContent() {
  const { user } = useUser();
  const myOrders = createAsync<OrderListItem[]>(() =>
    getMyOrders(user()?.name ?? ""),
  );
  const [filter, setFilter] = createSignal<"all" | "submitted">("all");

  const visibleOrders = createMemo(() => {
    const orders = myOrders() ?? [];
    if (filter() === "all") return orders;
    return orders.filter((order) => order.status === "submitted");
  });

  return (
    <>
      <Title>Order Saya - Titip Makan</Title>
      <Layout title="Titip Makan">
        <section class="space-y-6">
          <h1 class="tm-page-title">Order Saya</h1>

          <div class="flex gap-3 overflow-x-auto pb-1">
            <button
              type="button"
              class="tm-panel flex shrink-0 items-center gap-3 px-5 py-4  font-semibold text-slate-800"
            >
              <IconCalendar class="h-6 w-6 text-slate-700" />
              Pilih Tanggal
            </button>
            <OrderFilter
              label="Semua"
              active={filter() === "all"}
              onClick={() => setFilter("all")}
            />
            <OrderFilter
              label="Belum Dibeli"
              active={filter() === "submitted"}
              onClick={() => setFilter("submitted")}
            />
          </div>

          <Suspense fallback={<MyOrdersSkeleton />}>
            <Show
              when={visibleOrders().length > 0}
              fallback={
                <div class="tm-card p-8">
                  <p class=" text-slate-600">
                    Belum ada order untuk ditampilkan.
                  </p>
                </div>
              }
            >
              <div class="space-y-6">
                <For each={visibleOrders()}>
                  {(order) => (
                    <div class="tm-card p-7">
                      <div class="mb-5 flex items-start justify-between gap-4">
                        <div class="flex items-start gap-4">
                          <div class="flex h-16 w-16 items-center justify-center rounded-lg bg-slate-200 ">
                            {order.storeSummary.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p class=" font-semibold leading-tight tracking-[-0.05em] text-slate-900">
                              {order.storeSummary}
                            </p>
                            <p class="mt-2  text-slate-500">
                              {formatRelativeOrderTime(order.createdAt)}
                            </p>
                          </div>
                        </div>
                        <span
                          class={
                            order.status === "purchased"
                              ? paymentStatusBadgeClass(order.paymentStatus)
                              : order.status === "cancelled"
                                ? "badge-cancelled"
                                : "badge-submitted"
                          }
                        >
                          {order.status === "submitted"
                            ? "Belum Dibeli"
                            : order.status === "purchased"
                              ? paymentStatusLabel(order.paymentStatus)
                              : statusLabel(order.status)}
                        </span>
                      </div>

                      <div class="tm-divider mb-5" />

                      <div class="mb-6 flex items-end justify-between gap-4">
                        <p class="max-w-[12rem]  leading-8 text-slate-800">
                          {order?.itemSummary}
                        </p>
                        <p class=" font-bold tracking-[-0.06em] text-primary-700">
                          {formatRupiah(order.totalAmount)}
                        </p>
                      </div>

                      <Show
                        when={order.status === "submitted"}
                        fallback={
                          <A
                            href={`/orders/${order.id}`}
                            class="btn-secondary w-full"
                          >
                            Detail
                          </A>
                        }
                      >
                        <div class="grid grid-cols-2 gap-4">
                          <A href={`/orders/${order.id}`} class="btn-secondary">
                            Batalkan
                          </A>
                          <A href={`/orders/${order.id}`} class="btn-primary">
                            Detail
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

function OrderFilter(props: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={props.onClick}
      class={`shrink-0 rounded-lg px-8 py-4 text-sm font-semibold transition-all ${
        props.active
          ? "bg-[#35bced] text-primary-700"
          : "bg-slate-200 text-slate-700"
      }`}
    >
      {props.label}
    </button>
  );
}

function MyOrdersSkeleton() {
  return (
    <div class="space-y-6">
      {[1, 2, 3].map((item) => (
        <div class="h-72 animate-pulse rounded-lg bg-white/80" />
      ))}
    </div>
  );
}
