import { createAsync, useAction, useParams } from "@solidjs/router";
import { createSignal, For, Show, Suspense } from "solid-js";
import { Title } from "@solidjs/meta";
import Layout from "~/components/Layout";
import RoleGuard from "~/components/RoleGuard";
import { useUser } from "~/lib/user-context";
import { getOrderById, cancelOrderAction, markPurchasedAction } from "~/server/orders";
import { formatRupiah, formatDateTime, statusBadgeClass, statusLabel } from "~/lib/utils";

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
              <div class="space-y-4">
                {/* Order info card */}
                <div class="card p-4 space-y-3">
                  <div class="flex items-start justify-between gap-3">
                    <div>
                      <p class="text-xs text-gray-400">Order #{o().id}</p>
                      <h2 class="font-semibold text-gray-900">{o().storeName}</h2>
                    </div>
                    <span class={statusBadgeClass(o().status)}>
                      {statusLabel(o().status)}
                    </span>
                  </div>

                  <div class="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p class="text-xs text-gray-400">Yang Nitip</p>
                      <p class="font-medium text-gray-900">{o().requesterName}</p>
                    </div>
                    <Show when={o().buyerName}>
                      <div>
                        <p class="text-xs text-gray-400">Yang Belikan</p>
                        <p class="font-medium text-gray-900">{o().buyerName}</p>
                      </div>
                    </Show>
                    <div>
                      <p class="text-xs text-gray-400">Dibuat</p>
                      <p class="font-medium text-gray-900">
                        {formatDateTime(o().createdAt)}
                      </p>
                    </div>
                    <Show when={o().purchasedAt}>
                      <div>
                        <p class="text-xs text-gray-400">Dibeli</p>
                        <p class="font-medium text-gray-900">
                          {formatDateTime(o().purchasedAt!)}
                        </p>
                      </div>
                    </Show>
                  </div>

                  <Show when={o().notes}>
                    <div class="rounded-lg bg-gray-50 p-3">
                      <p class="text-xs font-semibold text-gray-500">Catatan Order</p>
                      <p class="mt-0.5 text-sm text-gray-700">{o().notes}</p>
                    </div>
                  </Show>

                  <Show when={o().cancellationReason}>
                    <div class="rounded-lg bg-red-50 p-3">
                      <p class="text-xs font-semibold text-red-500">Alasan Dibatalkan</p>
                      <p class="mt-0.5 text-sm text-red-700">{o().cancellationReason}</p>
                    </div>
                  </Show>
                </div>

                {/* Order items */}
                <div class="card overflow-hidden">
                  <div class="border-b border-gray-100 p-4">
                    <h3 class="font-semibold text-gray-900">Daftar Item</h3>
                  </div>
                  <div class="divide-y divide-gray-50">
                    <For each={o().items}>
                      {(item) => (
                        <div class="p-4">
                          <div class="flex items-start justify-between gap-2">
                            <div class="flex-1">
                              <p class="font-medium text-gray-900">
                                {item.menuNameSnapshot}
                              </p>
                              <p class="text-sm text-gray-500">
                                {formatRupiah(item.priceSnapshot)} × {item.quantity}
                              </p>
                              <Show when={item.notes}>
                                <p class="mt-0.5 text-xs text-gray-400 italic">
                                  Catatan: {item.notes}
                                </p>
                              </Show>
                            </div>
                            <p class="font-semibold text-primary-600 shrink-0">
                              {formatRupiah(item.subtotal)}
                            </p>
                          </div>
                        </div>
                      )}
                    </For>
                  </div>
                  <div class="border-t border-gray-100 p-4">
                    <div class="flex justify-between">
                      <span class="font-bold text-gray-900">Total</span>
                      <span class="text-lg font-bold text-primary-600">
                        {formatRupiah(o().totalAmount)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <Show when={o().status === "submitted"}>
                  {/* Pemesan: bisa batalkan sendiri */}
                  <Show when={isPemesan()}>
                    <Show
                      when={!showCancelForm()}
                      fallback={
                        <div class="card p-4 space-y-3">
                          <p class="text-sm font-semibold text-gray-700">
                            Alasan pembatalan (opsional)
                          </p>
                          <textarea
                            class="input resize-none text-sm"
                            rows="2"
                            placeholder="Tidak jadi memesan, dll"
                            value={cancelReason()}
                            onInput={(e) => setCancelReason(e.currentTarget.value)}
                          />
                          <div class="grid grid-cols-2 gap-3">
                            <button
                              type="button"
                              onClick={() => setShowCancelForm(false)}
                              class="btn-secondary"
                            >
                              Batal
                            </button>
                            <button
                              type="button"
                              onClick={handleCancel}
                              disabled={submitting()}
                              class="btn-danger"
                            >
                              {submitting() ? "..." : "Batalkan Order"}
                            </button>
                          </div>
                        </div>
                      }
                    >
                      <button
                        type="button"
                        onClick={() => setShowCancelForm(true)}
                        class="btn-secondary w-full"
                      >
                        Batalkan Order
                      </button>
                    </Show>
                  </Show>

                  {/* Pembeli: bisa mark purchased atau batalkan */}
                  <Show when={isPembeli()}>
                    <div class="space-y-3">
                      <button
                        type="button"
                        onClick={handleMarkPurchased}
                        disabled={submitting()}
                        class="btn-primary w-full"
                      >
                        {submitting() ? "..." : "Tandai Sudah Dibeli"}
                      </button>

                      <Show
                        when={!showCancelForm()}
                        fallback={
                          <div class="card p-4 space-y-3">
                            <p class="text-sm font-semibold text-gray-700">
                              Alasan pembatalan
                            </p>
                            <textarea
                              class="input resize-none text-sm"
                              rows="2"
                              placeholder="Contoh: stok habis, toko tutup"
                              value={cancelReason()}
                              onInput={(e) =>
                                setCancelReason(e.currentTarget.value)
                              }
                            />
                            <div class="grid grid-cols-2 gap-3">
                              <button
                                type="button"
                                onClick={() => setShowCancelForm(false)}
                                class="btn-secondary"
                              >
                                Batal
                              </button>
                              <button
                                type="button"
                                onClick={handleCancel}
                                disabled={submitting()}
                                class="btn-danger"
                              >
                                {submitting() ? "..." : "Batalkan"}
                              </button>
                            </div>
                          </div>
                        }
                      >
                        <button
                          type="button"
                          onClick={() => setShowCancelForm(true)}
                          class="btn-secondary w-full text-red-600"
                        >
                          Batalkan (Item Tidak Tersedia)
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
