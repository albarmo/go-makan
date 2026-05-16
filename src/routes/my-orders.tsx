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
      <Layout title="Pesananku Hari Ini">
        <Suspense
          fallback={
            <div class="space-y-3">
              {[1, 2].map(() => (
                <div class="card h-28 animate-pulse bg-gray-100" />
              ))}
            </div>
          }
        >
          <Show
            when={(myOrders() ?? []).length > 0}
            fallback={
              <div class="card p-8 text-center">
                <p class="text-3xl">📋</p>
                <p class="mt-2 font-semibold text-gray-700">
                  Belum ada pesanan hari ini
                </p>
                <p class="mt-1 text-sm text-gray-400">
                  Yuk, titip beli makan siang!
                </p>
                <A href="/orders/new" class="btn-primary mt-4 inline-flex">
                  Titip Beli Sekarang
                </A>
              </div>
            }
          >
            {/* Summary */}
            <div class="card mb-4 bg-primary-50 p-4">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm text-gray-600">Total Belanja Hari Ini</p>
                  <p class="text-xl font-bold text-primary-600">
                    {formatRupiah(totalBelanja())}
                  </p>
                </div>
                <A href="/orders/new" class="btn-primary !py-2 !px-3 text-xs">
                  + Titip Lagi
                </A>
              </div>
            </div>

            {/* Active orders */}
            <Show when={activeOrders().length > 0}>
              <div class="mb-2">
                <h3 class="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Menunggu Dibeli ({activeOrders().length})
                </h3>
                <div class="space-y-3">
                  <For each={activeOrders()}>
                    {(order) => <OrderCard order={order} />}
                  </For>
                </div>
              </div>
            </Show>

            {/* Done orders */}
            <Show when={doneOrders().length > 0}>
              <div class="mt-4">
                <h3 class="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Selesai / Dibatalkan
                </h3>
                <div class="space-y-3">
                  <For each={doneOrders()}>
                    {(order) => <OrderCard order={order} />}
                  </For>
                </div>
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
    <A href={`/orders/${o().id}`} class="card block p-4 hover:shadow-md active:scale-95 transition-all">
      <div class="flex items-start justify-between gap-2">
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2">
            <p class="font-semibold text-gray-900 truncate">{o().storeName}</p>
          </div>
          <p class="text-xs text-gray-400">{formatDateTime(o().createdAt)}</p>
          <Show when={o().buyerName}>
            <p class="mt-0.5 text-xs text-gray-500">
              Dibelikan oleh: <span class="font-medium">{o().buyerName}</span>
            </p>
          </Show>
          <Show when={o().cancellationReason}>
            <p class="mt-0.5 text-xs text-red-400 italic">
              {o().cancellationReason}
            </p>
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
      </div>
    </A>
  );
}
