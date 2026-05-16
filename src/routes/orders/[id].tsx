import { createAsync, useAction, useParams } from "@solidjs/router";
import { createSignal, For, Show, Suspense } from "solid-js";
import { Title } from "@solidjs/meta";
import Layout from "~/components/Layout";
import RoleGuard from "~/components/RoleGuard";
import { useUser } from "~/lib/user-context";
import { getOrderById, cancelOrderAction, markPurchasedAction } from "~/server/orders";
import { formatRupiah, formatDateTime, statusBadgeClass, statusLabel } from "~/lib/utils";
import { IconClock } from "~/components/icons";

export const route = {
  load: ({ params }: { params: { id: string } }) =>
    getOrderById(parseInt(params.id)),
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
  const order = createAsync(() => getOrderById(parseInt(params.id)));
  const { user } = useUser();
  const cancelOrder = useAction(cancelOrderAction);
  const markPurchased = useAction(markPurchasedAction);
  const [cancelReason, setCancelReason] = createSignal("");
  const [showCancelForm, setShowCancelForm] = createSignal(false);
  const [submitting, setSubmitting] = createSignal(false);

  const isPemesan = () => user()?.role === "pemesan";
  const isPembeli = () => user()?.role === "pembeli";

  const handleCancel = async () => {
    const o = order();
    if (!o) return;
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.set("id", o.id.toString());
      formData.set("reason", cancelReason());
      formData.set("redirectTo", isPemesan() ? "/my-orders" : "/buyer/orders");
      await cancelOrder(formData);
    } catch {
      setSubmitting(false);
    }
  };

  const handleMarkPurchased = async () => {
    const o = order();
    const u = user();
    if (!o || !u) return;
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.set("id", o.id.toString());
      formData.set("buyerName", u.name);
      await markPurchased(formData);
    } catch {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Title>Detail Order - Titip Makan</Title>
      <Layout title="Detail Order" showBack>
        <Suspense
          fallback={
            <div class="space-y-3">
              <div class="card h-32 animate-pulse bg-gray-100" />
              <div class="card h-48 animate-pulse bg-gray-100" />
            </div>
          }
        >
          <Show
            when={order()}
            fallback={
              <div class="card p-8 text-center">
                <p class="text-gray-500">Order tidak ditemukan</p>
              </div>
            }
          >
            {(o) => (
              <div class="space-y-3">
                {/* Status banner */}
                <div class={`rounded-2xl p-4 ${
                  o().status === "purchased"
                    ? "bg-emerald-600"
                    : o().status === "cancelled"
                    ? "bg-red-500"
                    : "bg-primary-700"
                }`}>
                  <div class="flex items-center gap-3">
                    <div class="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
                      <span class="text-xl">
                        {o().status === "purchased" ? "✅" : o().status === "cancelled" ? "❌" : "⏳"}
                      </span>
                    </div>
                    <div>
                      <p class="font-bold text-white">{statusLabel(o().status)}</p>
                      <p class="text-xs text-white/70">Order #{o().id} · {o().storeName}</p>
                    </div>
                  </div>
                </div>

                {/* Order info */}
                <div class="card overflow-hidden">
                  <div class="divide-y divide-gray-50">
                    <InfoRow label="Yang Nitip" value={o().requesterName} />
                    <Show when={o().buyerName}>
                      <InfoRow label="Yang Belikan" value={o().buyerName!} />
                    </Show>
                    <InfoRow label="Toko" value={o().storeName} />
                    <div class="flex items-center gap-3 px-4 py-3">
                      <p class="w-28 shrink-0 text-xs text-gray-400">Tanggal</p>
                      <div class="flex items-center gap-1.5">
                        <IconClock class="h-3.5 w-3.5 text-gray-400" />
                        <p class="text-sm font-medium text-gray-800">{formatDateTime(o().createdAt)}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <Show when={o().notes}>
                  <div class="rounded-xl bg-amber-50 px-4 py-3">
                    <p class="text-xs font-semibold text-amber-700">Catatan Order</p>
                    <p class="mt-0.5 text-sm text-amber-800">{o().notes}</p>
                  </div>
                </Show>

                <Show when={o().cancellationReason}>
                  <div class="rounded-xl bg-red-50 px-4 py-3">
                    <p class="text-xs font-semibold text-red-600">Alasan Dibatalkan</p>
                    <p class="mt-0.5 text-sm text-red-700">{o().cancellationReason}</p>
                  </div>
                </Show>

                {/* Order items */}
                <div class="card overflow-hidden">
                  <div class="border-b border-gray-100 px-4 py-3">
                    <p class="text-xs font-semibold uppercase tracking-wider text-gray-400">Daftar Menu</p>
                  </div>
                  <div class="divide-y divide-gray-50">
                    <For each={o().items}>
                      {(item) => (
                        <div class="px-4 py-3">
                          <div class="flex items-start justify-between gap-2">
                            <div class="flex-1">
                              <p class="font-medium text-gray-900">{item.menuNameSnapshot}</p>
                              <p class="text-xs text-gray-400">
                                {formatRupiah(item.priceSnapshot)} × {item.quantity}
                              </p>
                              <Show when={item.notes}>
                                <p class="mt-0.5 text-xs italic text-gray-400">"{item.notes}"</p>
                              </Show>
                            </div>
                            <p class="shrink-0 font-semibold text-primary-600">
                              {formatRupiah(item.subtotal)}
                            </p>
                          </div>
                        </div>
                      )}
                    </For>
                  </div>
                  <div class="flex items-center justify-between border-t border-gray-100 px-4 py-3">
                    <span class="font-bold text-gray-900">Total</span>
                    <span class="text-lg font-bold text-primary-600">
                      {formatRupiah(o().totalAmount)}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <Show when={o().status === "submitted"}>
                  <Show when={isPemesan()}>
                    <Show
                      when={!showCancelForm()}
                      fallback={
                        <div class="card p-4 space-y-3">
                          <p class="text-sm font-semibold text-gray-700">Alasan pembatalan (opsional)</p>
                          <textarea
                            class="input resize-none text-sm"
                            rows="2"
                            placeholder="Tidak jadi memesan, dll"
                            value={cancelReason()}
                            onInput={(e) => setCancelReason(e.currentTarget.value)}
                          />
                          <div class="grid grid-cols-2 gap-3">
                            <button type="button" onClick={() => setShowCancelForm(false)} class="btn-secondary">
                              Batal
                            </button>
                            <button type="button" onClick={handleCancel} disabled={submitting()} class="btn-danger">
                              {submitting() ? "..." : "Batalkan"}
                            </button>
                          </div>
                        </div>
                      }
                    >
                      <button type="button" onClick={() => setShowCancelForm(true)} class="btn-secondary w-full">
                        Batalkan Order
                      </button>
                    </Show>
                  </Show>

                  <Show when={isPembeli()}>
                    <div class="space-y-2">
                      <button
                        type="button"
                        onClick={handleMarkPurchased}
                        disabled={submitting()}
                        class="btn-primary w-full"
                      >
                        {submitting() ? "..." : "Tandai Sudah Dibeli ✓"}
                      </button>
                      <Show
                        when={!showCancelForm()}
                        fallback={
                          <div class="card p-4 space-y-3">
                            <p class="text-sm font-semibold text-gray-700">Alasan pembatalan</p>
                            <textarea
                              class="input resize-none text-sm"
                              rows="2"
                              placeholder="Contoh: stok habis, toko tutup"
                              value={cancelReason()}
                              onInput={(e) => setCancelReason(e.currentTarget.value)}
                            />
                            <div class="grid grid-cols-2 gap-3">
                              <button type="button" onClick={() => setShowCancelForm(false)} class="btn-secondary">
                                Kembali
                              </button>
                              <button type="button" onClick={handleCancel} disabled={submitting()} class="btn-danger">
                                {submitting() ? "..." : "Batalkan"}
                              </button>
                            </div>
                          </div>
                        }
                      >
                        <button
                          type="button"
                          onClick={() => setShowCancelForm(true)}
                          class="btn-secondary w-full !text-red-500"
                        >
                          Item Tidak Tersedia
                        </button>
                      </Show>
                    </div>
                  </Show>
                </Show>
              </div>
            )}
          </Show>
        </Suspense>
      </Layout>
    </>
  );
}

function InfoRow(props: { label: string; value: string }) {
  return (
    <div class="flex items-center gap-3 px-4 py-3">
      <p class="w-28 shrink-0 text-xs text-gray-400">{props.label}</p>
      <p class="text-sm font-semibold text-gray-800">{props.value}</p>
    </div>
  );
}
