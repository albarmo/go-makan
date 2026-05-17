import { Title } from "@solidjs/meta";
import { A, createAsync, useAction } from "@solidjs/router";
import {
  ArrowRight as IconArrowRight,
  Ban as IconBan,
  CheckCheck as IconCheckCheck,
  CircleAlert as IconCircleAlert,
  CircleCheckBig as IconCircleCheckBig,
  Clock3 as IconClock3,
  Store as IconStore,
  Wallet as IconWallet,
} from "lucide-solid";
import { createMemo, createSignal, For, Show, Suspense } from "solid-js";
import Layout from "~/components/Layout";
import RoleGuard from "~/components/RoleGuard";
import { useOrderEvents } from "~/lib/use-order-events";
import { useUser } from "~/lib/user-context";
import {
  formatRupiah,
  paymentStatusBadgeClass,
  paymentStatusLabel,
  statusLabel,
} from "~/lib/utils";
import {
  getBuyerOrdersByStore,
  markStoreItemsPurchasedAction,
  updateOrderItemFulfillmentAction,
  type BuyerStoreOrdersGroup,
} from "~/server/orders";

export const route = {
  load: () => getBuyerOrdersByStore(),
};

export default function BuyerOrdersPage() {
  return (
    <RoleGuard requiredRole="pembeli">
      <BuyerOrdersContent />
    </RoleGuard>
  );
}

function BuyerOrdersContent() {
  const { user } = useUser();
  const [refreshKey, setRefreshKey] = createSignal(0);
  const groupedOrders = createAsync<BuyerStoreOrdersGroup[]>(() => {
    refreshKey();
    return getBuyerOrdersByStore();
  });
  const updateItemFulfillment = useAction(updateOrderItemFulfillmentAction);
  const markStorePurchased = useAction(markStoreItemsPurchasedAction);
  const [filter, setFilter] = createSignal<
    "all" | "submitted" | "purchased" | "cancelled"
  >("submitted");
  const [updatingKey, setUpdatingKey] = createSignal<string | null>(null);

  useOrderEvents(() => setRefreshKey((value) => value + 1));

  const allOrderEntries = createMemo(() =>
    (groupedOrders() ?? []).flatMap((group) => group.orders),
  );
  const totalStores = createMemo(() => (groupedOrders() ?? []).length);
  const pendingCount = createMemo(
    () =>
      allOrderEntries().filter((order) => order.status === "submitted").length,
  );
  const purchasedCount = createMemo(
    () =>
      allOrderEntries().filter((order) => order.status === "purchased").length,
  );
  const unpaidCount = createMemo(
    () =>
      allOrderEntries().filter(
        (order) =>
          order.status === "purchased" && order.paymentStatus !== "paid",
      ).length,
  );

  const visibleGroups = createMemo(() => {
    const groups = groupedOrders() ?? [];
    if (filter() === "all") return groups;

    return groups
      .map((group) => ({
        ...group,
        orders: group.orders.filter((order) => order.status === filter()),
      }))
      .filter((group) => group.orders.length > 0)
      .map((group) => ({
        ...group,
        orderCount: group.orders.length,
        pendingCount: group.orders.filter((order) => order.status === "submitted").length,
        purchasedCount: group.orders.filter((order) => order.status === "purchased").length,
        unpaidCount: group.orders.filter(
          (order) =>
            order.status === "purchased" && order.paymentStatus !== "paid",
        ).length,
        totalItems: group.orders.reduce((sum, order) => sum + order.itemCount, 0),
        totalAmount: group.orders.reduce((sum, order) => sum + order.storeAmount, 0),
      }));
  });

  const handleItemStatus = async (
    itemId: number,
    status: "pending" | "purchased" | "unavailable",
  ) => {
    const currentUser = user();
    if (!currentUser) return;

    setUpdatingKey(`item:${itemId}:${status}`);
    try {
      const formData = new FormData();
      formData.set("itemId", String(itemId));
      formData.set("status", status);
      formData.set("buyerName", currentUser.name);
      formData.set("buyerProfileId", String(currentUser.id));
      formData.set("redirectTo", "/buyer/orders");
      await updateItemFulfillment(formData);
    } catch {
      setUpdatingKey(null);
    }
  };

  const handleBulkStorePurchased = async (storeId: number) => {
    const currentUser = user();
    if (!currentUser) return;

    setUpdatingKey(`store:${storeId}`);
    try {
      const formData = new FormData();
      formData.set("storeId", String(storeId));
      formData.set("buyerName", currentUser.name);
      formData.set("buyerProfileId", String(currentUser.id));
      formData.set("redirectTo", "/buyer/orders");
      await markStorePurchased(formData);
    } catch {
      setUpdatingKey(null);
    }
  };

  return (
    <>
      <Title>Semua Titipan - Titip Makan</Title>
      <Layout title="Titip Makan">
        <section class="space-y-6">
          <div class="flex items-end justify-between gap-4">
            <div>
              <h1 class="tm-page-title">Belanja per Toko</h1>
              <p class="mt-2 text-base text-slate-500">
                Kerjakan titipan per toko supaya belanja lebih cepat dan tidak
                bolak-balik.
              </p>
            </div>
            <div class="hidden h-11 w-11 items-center justify-center rounded-lg bg-sky-100 text-primary-700 sm:flex">
              <IconStore class="h-5 w-5" />
            </div>
          </div>

          <div class="grid grid-cols-3 gap-3">
            <SummaryCard
              icon={<IconStore class="h-5 w-5" />}
              label="Toko Aktif"
              value={String(totalStores())}
            />
            <SummaryCard
              icon={<IconClock3 class="h-5 w-5" />}
              label="Perlu Dibeli"
              value={String(pendingCount())}
            />
            <SummaryCard
              icon={<IconWallet class="h-5 w-5" />}
              label="Belum Bayar"
              value={String(unpaidCount())}
            />
          </div>

          <div class="flex gap-3 overflow-x-auto pb-1">
            <FilterChip
              label={`Perlu Aksi (${pendingCount()})`}
              active={filter() === "submitted"}
              onClick={() => setFilter("submitted")}
            />
            <FilterChip
              label={`Semua (${allOrderEntries().length})`}
              active={filter() === "all"}
              onClick={() => setFilter("all")}
            />
            <FilterChip
              label={`Selesai (${purchasedCount()})`}
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
              when={visibleGroups().length > 0}
              fallback={
                <div class="tm-card p-8">
                  <p class="text-slate-600">
                    Belum ada titipan yang cocok dengan filter ini.
                  </p>
                </div>
              }
            >
              <div class="space-y-6">
                <For each={visibleGroups()}>
                  {(storeGroup) => (
                    <div class="tm-card overflow-hidden">
                      <div class="bg-slate-50 px-5 py-5">
                        <div class="flex items-start justify-between gap-4">
                          <div class="flex items-start gap-4">
                            <div class="flex h-12 w-12 items-center justify-center rounded-lg bg-sky-100 font-bold text-primary-700">
                              {storeGroup.storeName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p class="font-semibold leading-tight tracking-[-0.05em] text-slate-900">
                                {storeGroup.storeName}
                              </p>
                              <p class="mt-1 text-sm text-slate-500">
                                {storeGroup.orderCount} order • {storeGroup.totalItems} item
                              </p>
                            </div>
                          </div>
                          <div class="text-right">
                            <p class="text-sm text-slate-500">Estimasi toko</p>
                            <p class="mt-1 font-semibold text-primary-700">
                              {formatRupiah(storeGroup.totalAmount)}
                            </p>
                          </div>
                        </div>

                        <div class="mt-4 grid grid-cols-3 gap-3">
                          <StoreMetric
                            label="Menu Pending"
                            value={String(storeGroup.pendingItemCount)}
                          />
                          <StoreMetric
                            label="Sudah Dibeli"
                            value={String(storeGroup.purchasedItemCount)}
                          />
                          <StoreMetric
                            label="Tidak Tersedia"
                            value={String(storeGroup.unavailableItemCount)}
                          />
                        </div>

                        <Show when={storeGroup.pendingItemCount > 0}>
                          <button
                            type="button"
                            onClick={() => handleBulkStorePurchased(storeGroup.storeId)}
                            disabled={updatingKey() === `store:${storeGroup.storeId}`}
                            class="btn-primary mt-4 w-full gap-2 disabled:cursor-not-allowed disabled:opacity-70"
                          >
                            <IconCheckCheck class="h-4 w-4" />
                            {updatingKey() === `store:${storeGroup.storeId}`
                              ? "Memproses..."
                              : "Tandai Semua dari Toko Ini Sudah Dibeli"}
                          </button>
                        </Show>
                      </div>

                      <div class="space-y-4 px-5 py-5">
                        <For each={storeGroup.orders}>
                          {(order) => (
                            <div class="rounded-lg border border-slate-200 bg-white px-4 py-4">
                              <div class="flex items-start justify-between gap-4">
                                <div>
                                  <p class="font-semibold text-slate-900">
                                    {order.requesterName}
                                  </p>
                                  <p class="mt-1 text-sm text-slate-500">
                                    {order.itemCount} item untuk toko ini
                                  </p>
                                  <p class="mt-2 text-xs text-slate-500">
                                    {order.pendingItemCount} pending •{" "}
                                    {order.purchasedItemCount} dibeli •{" "}
                                    {order.unavailableItemCount} tidak tersedia
                                  </p>
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
                                    ? "Perlu Dibeli"
                                    : order.status === "purchased"
                                      ? paymentStatusLabel(order.paymentStatus)
                                      : statusLabel(order.status)}
                                </span>
                              </div>

                              <div class="mt-3 rounded-lg bg-slate-50 px-4 py-4">
                                <p class="text-sm text-slate-500">Daftar Menu</p>
                                <div class="mt-2 space-y-2">
                                  <For each={order.items}>
                                    {(item) => (
                                      <div class="rounded-lg border border-slate-200 bg-white px-3 py-3">
                                        <div class="flex items-start justify-between gap-3 text-sm text-slate-700">
                                          <div>
                                            <p>
                                              {item.quantity}x {item.menuName}
                                            </p>
                                            <Show when={item.notes}>
                                              <p class="mt-1 text-xs text-slate-500">
                                                Catatan: {item.notes}
                                              </p>
                                            </Show>
                                          </div>
                                          <div class="text-right">
                                            <p>{formatRupiah(item.subtotal)}</p>
                                            <span
                                              class={`mt-2 inline-flex rounded-lg px-2 py-1 text-xs font-semibold ${
                                                item.fulfillmentStatus === "purchased"
                                                  ? "bg-emerald-100 text-emerald-700"
                                                  : item.fulfillmentStatus === "unavailable"
                                                    ? "bg-rose-100 text-rose-600"
                                                    : "bg-amber-100 text-amber-700"
                                              }`}
                                            >
                                              {item.fulfillmentStatus === "purchased"
                                                ? "Sudah Dibeli"
                                                : item.fulfillmentStatus === "unavailable"
                                                  ? "Tidak Tersedia"
                                                  : "Pending"}
                                            </span>
                                          </div>
                                        </div>

                                        <div class="mt-3 grid grid-cols-2 gap-2">
                                          <button
                                            type="button"
                                            onClick={() =>
                                              handleItemStatus(
                                                item.id,
                                                item.fulfillmentStatus === "purchased"
                                                  ? "pending"
                                                  : "purchased",
                                              )
                                            }
                                            disabled={
                                              updatingKey() === `item:${item.id}:purchased` ||
                                              updatingKey() === `item:${item.id}:pending`
                                            }
                                            class={`inline-flex min-h-[2.75rem] items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition ${
                                              item.fulfillmentStatus === "purchased"
                                                ? "bg-emerald-50 text-emerald-700"
                                                : "bg-sky-100 text-primary-700"
                                            }`}
                                          >
                                            <IconCircleCheckBig class="h-4 w-4" />
                                            {updatingKey() === `item:${item.id}:purchased` ||
                                            updatingKey() === `item:${item.id}:pending`
                                              ? "Memproses..."
                                              : item.fulfillmentStatus === "purchased"
                                                ? "Batalkan Checklist"
                                                : "Checklist Dibeli"}
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() =>
                                              handleItemStatus(
                                                item.id,
                                                item.fulfillmentStatus === "unavailable"
                                                  ? "pending"
                                                  : "unavailable",
                                              )
                                            }
                                            disabled={
                                              updatingKey() === `item:${item.id}:unavailable` ||
                                              updatingKey() === `item:${item.id}:pending`
                                            }
                                            class={`inline-flex min-h-[2.75rem] items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition ${
                                              item.fulfillmentStatus === "unavailable"
                                                ? "bg-rose-50 text-rose-600"
                                                : "bg-slate-100 text-slate-600"
                                            }`}
                                          >
                                            <IconBan class="h-4 w-4" />
                                            {updatingKey() === `item:${item.id}:unavailable` ||
                                            updatingKey() === `item:${item.id}:pending`
                                              ? "Memproses..."
                                              : item.fulfillmentStatus === "unavailable"
                                                ? "Batalkan Tidak Tersedia"
                                                : "Tandai Tidak Tersedia"}
                                          </button>
                                        </div>
                                      </div>
                                    )}
                                  </For>
                                </div>
                              </div>

                              <div class="mt-4 flex items-center justify-between gap-4">
                                <div>
                                  <p class="text-sm text-slate-500">Total untuk toko ini</p>
                                  <p class="mt-1 font-semibold text-slate-900">
                                    {formatRupiah(order.storeAmount)}
                                  </p>
                                  <Show when={order.unavailableItemCount > 0}>
                                    <p class="mt-2 text-xs text-rose-500">
                                      Total otomatis tidak menghitung item yang tidak tersedia.
                                    </p>
                                  </Show>
                                </div>
                                <A
                                  href={`/orders/${order.orderId}`}
                                  class={
                                    order.status === "submitted"
                                      ? "btn-primary !min-h-0 gap-2 px-4 py-3"
                                      : "btn-outline !min-h-0 gap-2 px-4 py-3"
                                  }
                                >
                                  Detail
                                  <IconArrowRight class="h-4 w-4" />
                                </A>
                              </div>
                            </div>
                          )}
                        </For>
                      </div>
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

function SummaryCard(props: { icon: any; label: string; value: string }) {
  return (
    <div class="tm-card p-4">
      <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-100 text-primary-700">
        {props.icon}
      </div>
      <p class="mt-4 text-sm text-slate-500">{props.label}</p>
      <p class="mt-2 font-bold tracking-[-0.05em] text-slate-900">
        {props.value}
      </p>
    </div>
  );
}

function StoreMetric(props: { label: string; value: string }) {
  return (
    <div class="rounded-lg bg-white px-3 py-3">
      <p class="text-xs text-slate-500">{props.label}</p>
      <p class="mt-1 font-semibold text-slate-900">{props.value}</p>
    </div>
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
      class={`shrink-0 rounded-lg px-5 py-3 text-base font-semibold transition-all ${
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
      {[1, 2].map(() => (
        <div class="h-72 animate-pulse rounded-lg bg-white/80" />
      ))}
    </div>
  );
}
