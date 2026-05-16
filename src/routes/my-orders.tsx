import { createAsync } from "@solidjs/router";
import { createMemo, For, Show, Suspense } from "solid-js";
import { Title } from "@solidjs/meta";
import { A } from "@solidjs/router";
import Layout from "~/components/Layout";
import RoleGuard from "~/components/RoleGuard";
import { useUser } from "~/lib/user-context";
import { getMyOrders } from "~/server/orders";
import {
  formatRupiah,
  formatDateTime,
  statusBadgeClass,
  statusLabel,
} from "~/lib/utils";
import { IconArrowRight, IconShoppingBag } from "~/components/icons";

export default function MyOrdersPage() {
  return (
    <RoleGuard requiredRole="pemesan">
      <MyOrdersContent />
    </RoleGuard>
  );
}

function MyOrdersContent() {
  const { user } = useUser();
  const myOrders = createAsync(() => getMyOrders(user()?.name ?? ""));

  const activeOrders = createMemo(() =>
    (myOrders() ?? []).filter((o) => o.status === "submitted")
  );
  const doneOrders = createMemo(() =>
    (myOrders() ?? []).filter((o) => o.status !== "submitted")
  );

  const totalBelanja = createMemo(() =>
    (myOrders() ?? [])
      .filter((o) => o.status !== "cancelled")
      .reduce((sum, o) => sum + o.totalAmount, 0)
  );

  return (
    <>
      <Title>Pesananku - Titip Makan</Title>
      <Layout title="Pesananku">
        <Suspense
          fallback={
            <div class="space-y-3">
              {[1, 2].map(() => (
                <div class="card h-24 animate-pulse bg-gray-100" />
              ))}
            </div>
          }
        >
          <Show
            when={(myOrders() ?? []).length > 0}
            fallback={
              <div class="card p-10 text-center">
                <p class="text-4xl">🍱</p>
                <p class="mt-3 font-bold text-gray-800">
                  Belum ada pesanan hari ini
                </p>
                <p class="mt-1 text-sm text-gray-400">
                  Yuk, titip beli makan siang!
                </p>
                <A href="/orders/new" class="btn-primary mt-5 inline-flex">
                  Titip Beli Sekarang
                </A>
              </div>
            }
          >
            {/* Summary strip */}
            <div class="mb-4 flex items-center justify-between rounded-2xl bg-primary-700 px-4 py-3.5">
              <div>
                <p class="text-xs text-primary-300">Total belanja hari ini</p>
                <p class="text-lg font-bold text-white">{formatRupiah(totalBelanja())}</p>
              </div>
              <A href="/orders/new" class="flex items-center gap-1.5 rounded-xl bg-white px-3 py-2 text-xs font-bold text-primary-700 hover:bg-primary-50">
                <IconShoppingBag class="h-3.5 w-3.5" />
                Titip Lagi
              </A>
            </div>

            {/* Active orders */}
            <Show when={activeOrders().length > 0}>
              <p class="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
                Menunggu Dibeli ({activeOrders().length})
              </p>
              <div class="mb-4 space-y-2">
                <For each={activeOrders()}>
                  {(order) => <OrderCard order={order} />}
                </For>
              </div>
            </Show>

            {/* Done orders */}
            <Show when={doneOrders().length > 0}>
              <p class="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
                Selesai / Dibatalkan
              </p>
              <div class="space-y-2">
                <For each={doneOrders()}>
                  {(order) => <OrderCard order={order} />}
                </For>
              </div>
            </Show>
          </Show>
        </Suspense>
      </Layout>
    </>
  );
}

function OrderCard(props: {
  order: {
    id: number;
    storeName: string;
    status: string;
    totalAmount: number;
    createdAt: Date;
    cancellationReason: string | null;
    buyerName: string | null;
  };
}) {
  const o = () => props.order;
  return (
    <A
      href={`/orders/${o().id}`}
      class="card flex items-center gap-3 p-4 hover:shadow-md active:scale-[0.98] transition-all"
    >
      <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-50">
        <span class="text-lg">🏪</span>
      </div>
      <div class="flex-1 min-w-0">
        <p class="font-semibold text-gray-900 truncate">{o().storeName}</p>
        <p class="text-xs text-gray-400">{formatDateTime(o().createdAt)}</p>
        <Show when={o().buyerName}>
          <p class="text-xs text-gray-500">
            Dibeli oleh <span class="font-medium text-primary-600">{o().buyerName}</span>
          </p>
        </Show>
        <Show when={o().cancellationReason}>
          <p class="text-xs text-red-400 italic">{o().cancellationReason}</p>
        </Show>
      </div>
      <div class="flex shrink-0 flex-col items-end gap-1">
        <span class={statusBadgeClass(o().status)}>
          {statusLabel(o().status)}
        </span>
        <span class="text-sm font-bold text-primary-600">
          {formatRupiah(o().totalAmount)}
        </span>
      </div>
      <IconArrowRight class="h-4 w-4 shrink-0 text-gray-300" />
    </A>
  );
}
