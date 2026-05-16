import { Title } from "@solidjs/meta";
import { createAsync, useAction, useParams } from "@solidjs/router";
import { createSignal, For, Show, Suspense } from "solid-js";
import Layout from "~/components/Layout";
import RoleGuard from "~/components/RoleGuard";
import {
  IconBike,
  IconCalendar,
  IconMessageCircle,
  IconStore,
  IconUser,
} from "~/components/icons";
import { useUser } from "~/lib/user-context";
import { formatDateTime, formatRupiah, statusLabel } from "~/lib/utils";
import {
  cancelOrderAction,
  getOrderById,
  markPurchasedAction,
} from "~/server/orders";

export const route = {
  load: ({ params }: { params: { id: string } }) =>
    getOrderById(Number(params.id)),
};

export default function OrderDetailPage() {
  return (
    <RoleGuard>
      <OrderDetailContent />
    </RoleGuard>
  );
}

function OrderDetailContent() {
  const params = useParams<{ id: string }>();
  const order = createAsync(() => getOrderById(Number(params.id)));
  const { user } = useUser();
  const cancelOrder = useAction(cancelOrderAction);
  const markPurchased = useAction(markPurchasedAction);
  const [cancelReason, setCancelReason] = createSignal("");
  const [submitting, setSubmitting] = createSignal(false);

  const isPemesan = () => user()?.role === "pemesan";
  const isPembeli = () => user()?.role === "pembeli";

  const handleCancel = async () => {
    const currentOrder = order();
    if (!currentOrder) return;
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.set("id", String(currentOrder.id));
      formData.set("reason", cancelReason());
      formData.set("redirectTo", isPemesan() ? "/my-orders" : "/buyer/orders");
      await cancelOrder(formData);
    } catch {
      setSubmitting(false);
    }
  };

  const handlePurchased = async () => {
    const currentOrder = order();
    const currentUser = user();
    if (!currentOrder || !currentUser) return;
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.set("id", String(currentOrder.id));
      formData.set("buyerName", currentUser.name);
      await markPurchased(formData);
    } catch {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Title>Detail Order - Titip Makan</Title>
      <Layout title="Detail Order" showBack>
        <Suspense fallback={<DetailSkeleton />}>
          <Show
            when={order()}
            fallback={
              <div class="tm-card p-8">
                <p class="text-lg text-slate-600">Order tidak ditemukan.</p>
              </div>
            }
          >
            {(currentOrder) => {
              const orderData = currentOrder();
              const isPending = orderData.status === "submitted";
              const isCancelled = orderData.status === "cancelled";

              return (
                <section class="space-y-7">
                  <div class="flex flex-col items-center text-center">
                    <div class="mb-7 flex h-28 w-28 items-center justify-center rounded-full bg-slate-200 text-primary-700 shadow-sm">
                      <IconBike class="h-14 w-14" />
                    </div>
                    <h1 class="text-xl font-bold tracking-[-0.06em] text-slate-900">
                      {isPending
                        ? "Sedang Dibelikan"
                        : statusLabel(orderData.status)}
                    </h1>
                    <p class="mt-4 text-lg leading-8 text-primary-700">
                      {orderData.buyerName
                        ? `${orderData.buyerName} sedang menangani pesananmu di ${orderData.storeName}.`
                        : `Pesananmu ke ${orderData.storeName} sedang menunggu diproses.`}
                    </p>
                  </div>

                  <div class="tm-card p-6">
                    <h2 class="mb-5 text-xl font-semibold tracking-[-0.05em] text-slate-900">
                      Informasi Pesanan
                    </h2>
                    <div class="tm-divider mb-5" />
                    <div class="space-y-5">
                      <InfoRow
                        icon={<IconUser class="h-6 w-6" />}
                        label="Yang Nitip"
                        value={orderData.requesterName}
                      />
                      <Show when={orderData.buyerName}>
                        <InfoRow
                          icon={<IconUser class="h-6 w-6" />}
                          label="Yang Belikan"
                          value={orderData.buyerName!}
                        />
                      </Show>
                      <InfoRow
                        icon={<IconStore class="h-6 w-6" />}
                        label="Store"
                        value={orderData.storeName}
                      />
                      <InfoRow
                        icon={<IconCalendar class="h-6 w-6" />}
                        label="Tanggal & Waktu"
                        value={formatDateTime(orderData.createdAt)}
                      />
                    </div>
                  </div>

                  <div class="tm-card p-6">
                    <h2 class="mb-5 text-xl font-semibold tracking-[-0.05em] text-slate-900">
                      Daftar Menu
                    </h2>
                    <div class="tm-divider mb-5" />

                    <For each={orderData.items}>
                      {(item) => (
                        <div class="border-b border-slate-200 py-5 last:border-b-0">
                          <div class="mb-3 flex items-start justify-between gap-4">
                            <div>
                              <p class="text-xl font-semibold text-slate-900">
                                {item.menuNameSnapshot}
                              </p>
                              <p class="mt-2 text-base text-primary-700">
                                Qty: {item.quantity}
                              </p>
                            </div>
                            <p class="text-xl text-slate-800">
                              {formatRupiah(item.subtotal)}
                            </p>
                          </div>

                          <Show when={item.notes}>
                            <div class="tm-card-soft px-4 py-4">
                              <p class="text-lg italic leading-8 text-slate-700">
                                Note: "{item.notes}"
                              </p>
                            </div>
                          </Show>
                        </div>
                      )}
                    </For>

                    <div class="border-t border-slate-200 pt-5">
                      <div class="mb-4 flex justify-between text-xl text-slate-800">
                        <span>Subtotal</span>
                        <span>{formatRupiah(orderData.totalAmount)}</span>
                      </div>
                      <div class="mb-4 flex justify-between text-xl text-primary-700">
                        <span>Biaya Titip</span>
                        <span>Rp 0</span>
                      </div>
                      <div class="flex justify-between text-xl font-bold tracking-[-0.05em]">
                        <span>Total Bayar</span>
                        <span class="text-primary-700">
                          {formatRupiah(orderData.totalAmount)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <Show when={orderData.notes}>
                    <div class="tm-panel flex items-center gap-4">
                      <div class="flex h-14 w-14 items-center justify-center rounded-full bg-sky-100 text-primary-700">
                        <IconMessageCircle class="h-7 w-7" />
                      </div>
                      <p class="text-lg leading-8 text-slate-700">
                        {orderData.notes}
                      </p>
                    </div>
                  </Show>

                  <Show when={isPending && isPembeli()}>
                    <button
                      type="button"
                      onClick={handlePurchased}
                      disabled={submitting()}
                      class="btn-primary w-full text-lg"
                    >
                      {submitting() ? "Memproses..." : "Tandai Sudah Dibeli"}
                    </button>
                  </Show>

                  <Show when={isPending}>
                    <Show when={isCancelled}>
                      <div class="tm-panel text-red-500">
                        {orderData.cancellationReason}
                      </div>
                    </Show>

                    <Show when={isPemesan() || isPembeli()}>
                      <div class="space-y-4">
                        <textarea
                          class="input min-h-[7rem] resize-none text-base"
                          placeholder={
                            isPembeli()
                              ? "Batalkan karena tidak tersedia..."
                              : "Alasan batal (opsional)"
                          }
                          value={cancelReason()}
                          onInput={(e) =>
                            setCancelReason(e.currentTarget.value)
                          }
                        />
                        <button
                          type="button"
                          onClick={handleCancel}
                          disabled={submitting()}
                          class={`w-full ${isPembeli() ? "btn-secondary text-red-500" : "btn-secondary"}`}
                        >
                          {isPembeli()
                            ? "Batalkan karena tidak tersedia"
                            : "Batalkan Order"}
                        </button>
                      </div>
                    </Show>
                  </Show>
                </section>
              );
            }}
          </Show>
        </Suspense>
      </Layout>
    </>
  );
}

function InfoRow(props: { icon: JSX.Element; label: string; value: string }) {
  return (
    <div class="flex items-start gap-4">
      <div class="mt-1 text-primary-700">{props.icon}</div>
      <div>
        <p class="text-sm font-medium uppercase tracking-[0.12em] text-primary-700">
          {props.label}
        </p>
        <p class="mt-1 text-lg leading-8 text-slate-900">
          {props.value}
        </p>
      </div>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div class="space-y-6">
      <div class="h-40 animate-pulse rounded-[2rem] bg-white/80" />
      <div class="h-80 animate-pulse rounded-[2rem] bg-white/80" />
      <div class="h-96 animate-pulse rounded-[2rem] bg-white/80" />
    </div>
  );
}
