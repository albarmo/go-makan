import { Title } from "@solidjs/meta";
import { createAsync, useAction, useParams } from "@solidjs/router";
import {
  Bike as IconBike,
  Calendar as IconCalendar,
  CircleAlert as IconCircleAlert,
  CircleCheckBig as IconCircleCheckBig,
  Clock3 as IconClock3,
  MessageCircle as IconMessageCircle,
  Store as IconStore,
  User as IconUser,
  Wallet as IconWallet,
} from "lucide-solid";
import { createEffect, createSignal, For, Show, Suspense } from "solid-js";
import ImageUpload from "~/components/ImageUpload";
import Layout from "~/components/Layout";
import RoleGuard from "~/components/RoleGuard";
import { useUser } from "~/lib/user-context";
import {
  formatDateTime,
  formatRupiah,
  paymentStatusBadgeClass,
  paymentStatusLabel,
  statusLabel,
} from "~/lib/utils";
import {
  cancelOrderAction,
  getOrderById,
  markOrderPaidAction,
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
  const markOrderPaid = useAction(markOrderPaidAction);
  const markPurchased = useAction(markPurchasedAction);
  const [cancelReason, setCancelReason] = createSignal("");
  const [paymentProofUrl, setPaymentProofUrl] = createSignal("");
  const [submitting, setSubmitting] = createSignal(false);

  const isPemesan = () => user()?.role === "pemesan";
  const isPembeli = () => user()?.role === "pembeli";

  createEffect(() => {
    const currentOrder = order();
    if (!currentOrder) return;
    setPaymentProofUrl(currentOrder.paymentProofUrl ?? "");
  });

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
      formData.set("buyerProfileId", String(currentUser.id));
      await markPurchased(formData);
    } catch {
      setSubmitting(false);
    }
  };

  const handlePaid = async () => {
    const currentOrder = order();
    if (!currentOrder || !paymentProofUrl()) return;
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.set("id", String(currentOrder.id));
      formData.set("paymentProofUrl", paymentProofUrl());
      await markOrderPaid(formData);
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
                <p class=" text-slate-600">Order tidak ditemukan.</p>
              </div>
            }
          >
            {(currentOrder) => {
              const orderData = currentOrder();
              const isPending = orderData.status === "submitted";
              const isCancelled = orderData.status === "cancelled";
              const isPurchased = orderData.status === "purchased";
              const isPaid = orderData.paymentStatus === "paid";
              const totalMenuLines = orderData.items.length;
              const purchasedMenuLines = orderData.items.filter(
                (item) => item.fulfillmentStatus === "purchased",
              ).length;
              const unavailableMenuLines = orderData.items.filter(
                (item) => item.fulfillmentStatus === "unavailable",
              ).length;
              const pendingMenuLines = orderData.items.filter(
                (item) => item.fulfillmentStatus === "pending",
              ).length;
              const resolvedMenuLines = purchasedMenuLines + unavailableMenuLines;
              const progressPercent =
                totalMenuLines > 0
                  ? Math.round((resolvedMenuLines / totalMenuLines) * 100)
                  : 0;

              return (
                <section class="space-y-7">
                  <div class="flex flex-col items-center text-center">
                    <div class="mb-7 flex h-28 w-28 items-center justify-center rounded-lg bg-slate-200 text-primary-700 shadow-sm">
                      <IconBike class="h-14 w-14" />
                    </div>
                    <h1 class=" font-bold tracking-[-0.06em] text-slate-900">
                      {isPending
                        ? "Sedang Dibelikan"
                        : statusLabel(orderData.status)}
                    </h1>
                    <p class="mt-2.5 text-primary-700">
                      {orderData.buyerName
                        ? `${orderData.buyerName} sedang menangani pesananmu untuk ${orderData.storeSummary}.`
                        : `Order ini berisi titipan dari ${orderData.storeSummary}.`}
                    </p>
                  </div>

                  <div class="tm-card p-6">
                    <div class="flex items-start justify-between gap-4">
                      <div>
                        <h2 class="text-lg font-semibold tracking-[-0.05em] text-slate-900">
                          Progress Belanja
                        </h2>
                        <p class="mt-2 text-base text-slate-600">
                          Pantau menu yang sudah selesai dibelikan dari seluruh
                          order ini.
                        </p>
                      </div>
                      <div class="text-right">
                        <p class="text-sm text-slate-500">Selesai</p>
                        <p class="mt-1 text-xl font-bold text-primary-700">
                          {progressPercent}%
                        </p>
                      </div>
                    </div>

                    <div class="mt-5 h-3 overflow-hidden rounded-lg bg-slate-100">
                      <div
                        class="h-full rounded-lg bg-gradient-to-r from-sky-500 to-primary-700 transition-all"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>

                    <div class="mt-5 grid grid-cols-3 gap-3">
                      <ProgressMetric
                        icon={<IconClock3 class="h-4 w-4" />}
                        label="Menunggu"
                        value={`${pendingMenuLines}`}
                        toneClass="bg-amber-100 text-amber-700"
                      />
                      <ProgressMetric
                        icon={<IconCircleCheckBig class="h-4 w-4" />}
                        label="Sudah Dibeli"
                        value={`${purchasedMenuLines}`}
                        toneClass="bg-emerald-100 text-emerald-700"
                      />
                      <ProgressMetric
                        icon={<IconCircleAlert class="h-4 w-4" />}
                        label="Tidak Tersedia"
                        value={`${unavailableMenuLines}`}
                        toneClass="bg-rose-100 text-rose-600"
                      />
                    </div>

                    <p class="mt-4 text-sm text-slate-500">
                      {resolvedMenuLines} dari {totalMenuLines} menu sudah punya
                      keputusan belanja.
                    </p>
                  </div>

                  <div class="tm-card p-6">
                    <h2 class="mb-5  font-semibold tracking-[-0.05em] text-slate-900">
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
                        label="Toko"
                        value={orderData.storeSummary}
                      />
                      <InfoRow
                        icon={<IconCalendar class="h-6 w-6" />}
                        label="Tanggal & Waktu"
                        value={formatDateTime(orderData.createdAt)}
                      />
                    </div>
                  </div>

                  <Show when={isPemesan() && orderData.buyerPaymentProfile}>
                    <div class="tm-card p-6">
                      <div class="mb-5 flex items-start gap-4">
                        <div class="flex h-12 w-12 items-center justify-center rounded-lg bg-sky-100 text-primary-700">
                          <IconWallet class="h-6 w-6" />
                        </div>
                        <div>
                          <h2 class="text-lg font-semibold tracking-[-0.05em] text-slate-900">
                            Pembayaran ke Pembeli
                          </h2>
                          <p class="mt-2 text-base text-slate-600">
                            Transfer ke rekening pembeli setelah pesanan selesai
                            dibelikan.
                          </p>
                        </div>
                      </div>
                      <div class="tm-divider mb-5" />
                      <div class="mb-5 flex items-center justify-between gap-4 rounded-lg bg-slate-50 px-4 py-4">
                        <div>
                          <p class="text-sm font-medium uppercase tracking-[0.12em] text-slate-500">
                            Status Pembayaran
                          </p>
                          <p class="mt-2 text-base text-slate-700">
                            {isPaid
                              ? "Pembayaran sudah dikonfirmasi."
                              : isPurchased
                                ? "Pesanan sudah dibeli, lanjut transfer ke pembeli."
                                : "Status pembayaran akan aktif setelah ada pembeli."}
                          </p>
                        </div>
                        <span
                          class={paymentStatusBadgeClass(
                            orderData.paymentStatus,
                          )}
                        >
                          {paymentStatusLabel(orderData.paymentStatus)}
                        </span>
                      </div>
                      <div class="space-y-5">
                        <InfoRow
                          icon={<IconWallet class="h-6 w-6" />}
                          label="Nama Bank"
                          value={orderData.buyerPaymentProfile!.bankName || "-"}
                        />
                        <InfoRow
                          icon={<IconWallet class="h-6 w-6" />}
                          label="Nomor Rekening"
                          value={
                            orderData.buyerPaymentProfile!.accountNumber || "-"
                          }
                        />
                        <InfoRow
                          icon={<IconUser class="h-6 w-6" />}
                          label="Nama Cardholder"
                          value={
                            orderData.buyerPaymentProfile!.cardholderName || "-"
                          }
                        />
                      </div>

                      <Show when={isPurchased && !isPaid}>
                        <div class="mt-6 space-y-4">
                          <div class="rounded-lg bg-slate-50 px-4 py-4">
                            <p class="text-base font-semibold text-slate-800">
                              Upload Bukti Pembayaran
                            </p>
                            <p class="mt-2 text-sm leading-6 text-slate-500">
                              Upload screenshot transfer atau bukti pembayaran
                              sebelum konfirmasi.
                            </p>
                          </div>
                          <ImageUpload
                            name="paymentProofUrl"
                            currentUrl={paymentProofUrl()}
                            folder="/titip-makan/payment-proofs"
                            label="Bukti Transfer"
                            onUploaded={(url) => setPaymentProofUrl(url)}
                          />
                          <button
                            type="button"
                            onClick={handlePaid}
                            disabled={submitting() || !paymentProofUrl()}
                            class="btn-primary w-full"
                          >
                            {submitting()
                              ? "Menyimpan..."
                              : "Upload Bukti & Konfirmasi Transfer"}
                          </button>
                        </div>
                      </Show>

                      <Show when={orderData.paymentProofUrl}>
                        <div class="mt-6 space-y-4">
                          <div class="rounded-lg bg-slate-50 px-4 py-4">
                            <p class="text-base font-semibold text-slate-800">
                              Bukti Pembayaran
                            </p>
                            <p class="mt-2 text-sm leading-6 text-slate-500">
                              {isPemesan()
                                ? "Bukti transfer yang sudah kamu upload."
                                : "Bukti transfer dari pemesan."}
                            </p>
                          </div>
                          <img
                            src={orderData.paymentProofUrl!}
                            alt="Bukti pembayaran"
                            class="w-full rounded-lg object-cover"
                          />
                          <Show when={orderData.paymentProofUploadedAt}>
                            <p class="text-sm text-slate-500">
                              Diupload pada{" "}
                              {formatDateTime(
                                orderData.paymentProofUploadedAt!,
                              )}
                              .
                            </p>
                          </Show>
                        </div>
                      </Show>

                      <Show when={isPaid && orderData.paidAt}>
                        <div class="mt-6 rounded-lg bg-emerald-50 px-4 py-4 text-base text-emerald-700">
                          Pembayaran tercatat pada{" "}
                          {formatDateTime(orderData.paidAt!)}.
                        </div>
                      </Show>
                    </div>
                  </Show>

                  <Show when={isPembeli() && orderData.paymentProofUrl}>
                    <div class="tm-card p-6">
                      <div class="mb-5 flex items-start gap-4">
                        <div class="flex h-12 w-12 items-center justify-center rounded-lg bg-sky-100 text-primary-700">
                          <IconWallet class="h-6 w-6" />
                        </div>
                        <div>
                          <h2 class="text-lg font-semibold tracking-[-0.05em] text-slate-900">
                            Bukti Pembayaran Pemesan
                          </h2>
                          <p class="mt-2 text-base text-slate-600">
                            Bukti transfer dari pemesan untuk order ini.
                          </p>
                        </div>
                      </div>
                      <img
                        src={orderData.paymentProofUrl!}
                        alt="Bukti pembayaran pemesan"
                        class="w-full rounded-lg object-cover"
                      />
                      <Show when={orderData.paymentProofUploadedAt}>
                        <p class="mt-4 text-sm text-slate-500">
                          Diupload pada{" "}
                          {formatDateTime(orderData.paymentProofUploadedAt!)}.
                        </p>
                      </Show>
                    </div>
                  </Show>

                  <div class="tm-card p-6">
                    <h2 class="mb-5 text-lg font-semibold tracking-[-0.05em] text-slate-900">
                      Daftar Menu
                    </h2>
                    <div class="tm-divider mb-5" />

                    <For each={orderData.storeGroups}>
                      {(storeGroup) => (
                        <div class="border-b border-slate-200 py-5 last:border-b-0">
                          <div class="mb-4 flex items-start justify-between gap-4 rounded-lg bg-slate-50 px-4 py-4">
                            <div>
                              <p class="font-semibold text-slate-900">
                                {storeGroup.storeName}
                              </p>
                              <p class="mt-2 text-sm text-slate-500">
                                {storeGroup.totalQuantity} item
                              </p>
                            </div>
                            <p class="font-semibold text-primary-700">
                              {formatRupiah(storeGroup.totalAmount)}
                            </p>
                          </div>

                          <For each={storeGroup.items}>
                            {(item) => (
                              <div class="border-b border-slate-200 py-5 last:border-b-0">
                                <div class="mb-3 flex items-start justify-between gap-4">
                                  <div>
                                    <p
                                      class={`font-semibold ${
                                        item.fulfillmentStatus === "unavailable"
                                          ? "text-slate-400 line-through"
                                          : "text-slate-900"
                                      }`}
                                    >
                                      {item.menuNameSnapshot}
                                    </p>
                                    <p
                                      class={`mt-2 text-base ${
                                        item.fulfillmentStatus === "unavailable"
                                          ? "text-slate-400"
                                          : "text-primary-700"
                                      }`}
                                    >
                                      Qty: {item.quantity}
                                    </p>
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
                                          : "Menunggu Dibeli"}
                                    </span>
                                    <Show when={item.fulfilledAt}>
                                      <p class="mt-2 text-xs text-slate-500">
                                        Diperbarui{" "}
                                        {formatDateTime(item.fulfilledAt!)}
                                      </p>
                                    </Show>
                                  </div>
                                  <p
                                    class={`${
                                      item.fulfillmentStatus === "unavailable"
                                        ? "text-slate-400 line-through"
                                        : "text-slate-800"
                                    }`}
                                  >
                                    {formatRupiah(item.subtotal)}
                                  </p>
                                </div>

                                <Show when={item.notes}>
                                  <div class="tm-card-soft px-4 py-4">
                                    <p class=" italic leading-8 text-slate-700">
                                      Note: "{item.notes}"
                                    </p>
                                  </div>
                                </Show>
                              </div>
                            )}
                          </For>
                        </div>
                      )}
                    </For>

                    <div class="border-t border-slate-200 pt-5">
                      <div class="mb-4 flex justify-between  text-slate-800">
                        <span>Subtotal</span>
                        <span>{formatRupiah(orderData.totalAmount)}</span>
                      </div>
                      <Show when={unavailableMenuLines > 0}>
                        <div class="mb-4 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-600">
                          {unavailableMenuLines} menu tidak tersedia dan tidak
                          dihitung ke total bayar.
                        </div>
                      </Show>
                      <div class="mb-4 flex justify-between  text-primary-700">
                        <span>Biaya Titip</span>
                        <span>Rp 0</span>
                      </div>
                      <div class="flex justify-between  font-bold tracking-[-0.05em]">
                        <span>Total Bayar</span>
                        <span class="text-primary-700">
                          {formatRupiah(orderData.totalAmount)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <Show when={orderData.notes}>
                    <div class="tm-panel flex items-center gap-4">
                      <div class="flex h-14 w-14 items-center justify-center rounded-lg bg-sky-100 text-primary-700">
                        <IconMessageCircle class="h-7 w-7" />
                      </div>
                      <p class=" leading-8 text-slate-700">{orderData.notes}</p>
                    </div>
                  </Show>

                  <Show when={isPending && isPembeli()}>
                    <button
                      type="button"
                      onClick={handlePurchased}
                      disabled={submitting()}
                      class="btn-primary w-full "
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

function InfoRow(props: { icon: any; label: string; value: string }) {
  return (
    <div class="flex items-start gap-4">
      <div class="mt-1 text-primary-700">{props.icon}</div>
      <div>
        <p class="text-sm font-medium uppercase tracking-[0.12em] text-primary-700">
          {props.label}
        </p>
        <p class="mt-1  leading-8 text-slate-900">{props.value}</p>
      </div>
    </div>
  );
}

function ProgressMetric(props: {
  icon: any;
  label: string;
  value: string;
  toneClass: string;
}) {
  return (
    <div class="rounded-lg bg-slate-50 px-3 py-3">
      <div
        class={`flex h-8 w-8 items-center justify-center rounded-lg ${props.toneClass}`}
      >
        {props.icon}
      </div>
      <p class="mt-3 text-xs text-slate-500">{props.label}</p>
      <p class="mt-1 font-semibold text-slate-900">{props.value}</p>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div class="space-y-6">
      <div class="h-40 animate-pulse rounded-lg bg-white/80" />
      <div class="h-80 animate-pulse rounded-lg bg-white/80" />
      <div class="h-96 animate-pulse rounded-lg bg-white/80" />
    </div>
  );
}
