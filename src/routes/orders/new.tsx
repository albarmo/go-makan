import { Title } from "@solidjs/meta";
import { A, useAction } from "@solidjs/router";
import {
  ArrowRight as IconArrowRight,
  ChevronLeft as IconChevronLeft,
  Store as IconStore,
} from "lucide-solid";
import { createMemo, createSignal, For, Show } from "solid-js";
import RoleGuard from "~/components/RoleGuard";
import { useOrderDraft } from "~/lib/order-draft-context";
import { useUser } from "~/lib/user-context";
import { formatRupiah } from "~/lib/utils";
import { createOrderAction } from "~/server/orders";

export default function NewOrderPage() {
  return (
    <RoleGuard requiredRole="pemesan">
      <NewOrderContent />
    </RoleGuard>
  );
}

function NewOrderContent() {
  const { user } = useUser();
  const draft = useOrderDraft();
  const createOrder = useAction(createOrderAction);
  const [submitting, setSubmitting] = createSignal(false);
  const [error, setError] = createSignal("");

  const cart = draft.items;
  const totalAmount = draft.totalAmount;
  const totalQuantity = draft.totalQuantity;
  const totalStoreCount = draft.totalStoreCount;
  const groupedCart = createMemo(() => {
    const groups = new Map<
      number,
      {
        storeId: number;
        storeName: string;
        items: ReturnType<typeof cart>;
        totalAmount: number;
      }
    >();

    for (const item of cart()) {
      if (!groups.has(item.storeId)) {
        groups.set(item.storeId, {
          storeId: item.storeId,
          storeName: item.storeName,
          items: [],
          totalAmount: 0,
        });
      }
      const group = groups.get(item.storeId)!;
      group.items.push(item);
      group.totalAmount += item.price * item.quantity;
    }

    return Array.from(groups.values());
  });

  const handleSubmit = async () => {
    const currentUser = user();
    if (!currentUser || cart().length === 0) return;

    setSubmitting(true);
    setError("");

    try {
      const formData = new FormData();
      formData.set("requesterName", currentUser.name);
      formData.set("notes", "");
      formData.set(
        "items",
        JSON.stringify(
          cart().map((item) => ({
            menuId: item.menuId,
            storeId: item.storeId,
            storeName: item.storeName,
            menuName: item.menuName,
            price: item.price,
            quantity: item.quantity,
            notes: item.notes || null,
          })),
        ),
      );
      await createOrder(formData);
      draft.clearDraft();
    } catch (err) {
      setSubmitting(false);
      setError(String(err));
    }
  };

  return (
    <>
      <Title>Create Order - Titip Makan</Title>
      <div class="tm-app-shell">
        <header class="tm-topbar">
          <div class="mx-auto flex max-w-[30rem] items-center gap-4 px-6 py-4">
            <button
              type="button"
              onClick={() => history.back()}
              class="flex h-11 w-11 items-center justify-center rounded-lg text-slate-900"
              aria-label="Kembali"
            >
              <IconChevronLeft class="h-7 w-7" />
            </button>
            <h1 class=" font-bold tracking-[-0.05em] text-slate-900">
              Create Order
            </h1>
          </div>
        </header>

        <main class="mx-auto max-w-[30rem] px-6 pb-44 pt-6">
          <section class="space-y-5">
            <h2 class=" font-semibold tracking-[-0.05em] text-slate-900">
              Order Details
            </h2>

            <div>
              <label class="mb-3 block  font-semibold text-slate-800">
                Your Name
              </label>
              <input class="input " value={user()?.name ?? ""} disabled />
            </div>

            <Show
              when={cart().length > 0}
              fallback={
                <div class="tm-card p-6">
                  <p class="font-semibold text-slate-900">
                    Belum ada menu di draft order
                  </p>
                  <p class="mt-2 text-base leading-7 text-slate-600">
                    Pilih menu dari halaman utama dulu, nanti di halaman ini
                    kamu tinggal edit qty, catatan, atau hapus item.
                  </p>
                  <A href="/" class="btn-primary mt-5 w-full">
                    Pilih Menu dari Home
                  </A>
                </div>
              }
            >
              <div class="tm-card p-5">
                <div class="flex items-start gap-4">
                  <div class="flex h-11 w-11 items-center justify-center rounded-lg bg-sky-100 text-primary-700">
                    <IconStore class="h-5 w-5" />
                  </div>
                  <div class="min-w-0 flex-1">
                    <p class="text-sm text-slate-500">Ringkasan toko</p>
                    <p class="mt-2 font-semibold text-slate-900">
                      {totalStoreCount()} toko di dalam satu order
                    </p>
                    <p class="mt-2 text-sm text-slate-500">
                      {totalQuantity()} item siap dicek sebelum dikirim.
                    </p>
                  </div>
                </div>
              </div>
            </Show>
          </section>

          <Show when={cart().length > 0}>
            <section class="mt-10">
              <div class="mb-5 flex items-end justify-between gap-4">
                <h2 class="font-semibold tracking-[-0.05em] text-slate-900">
                  Your Items
                </h2>
                <A href="/" class="text-base font-semibold text-primary-700">
                  Tambah Menu
                </A>
              </div>
              <div class="space-y-4">
                <For each={groupedCart()}>
                  {(storeGroup) => (
                    <div class="tm-card p-5">
                      <div class="mb-4 flex items-start justify-between gap-4 border-b border-slate-200 pb-4">
                        <div>
                          <p class="text-sm text-slate-500">Store</p>
                          <p class="mt-2 font-semibold text-slate-900">
                            {storeGroup.storeName}
                          </p>
                        </div>
                        <p class="text-base font-semibold text-primary-700">
                          {formatRupiah(storeGroup.totalAmount)}
                        </p>
                      </div>

                      <For each={storeGroup.items}>
                        {(item) => (
                          <div class="border-b border-slate-200 py-4 last:border-b-0">
                            <div class="mb-4 flex items-start justify-between gap-4">
                              <div>
                                <p class=" font-semibold text-slate-900">
                                  {item.menuName}
                                </p>
                                <p class="mt-1  text-primary-700">
                                  {formatRupiah(item.price)}
                                </p>
                              </div>
                              <div class="flex items-center gap-4 rounded-lg bg-slate-100 px-5 py-3">
                                <button
                                  type="button"
                                  onClick={() =>
                                    draft.setQuantity(
                                      {
                                        id: item.menuId,
                                        storeId: item.storeId,
                                        storeName: item.storeName,
                                        name: item.menuName,
                                        price: item.price,
                                      },
                                      item.quantity - 1,
                                    )
                                  }
                                  class=" text-slate-700"
                                >
                                  -
                                </button>
                                <span class=" font-semibold">
                                  {item.quantity}
                                </span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    draft.setQuantity(
                                      {
                                        id: item.menuId,
                                        storeId: item.storeId,
                                        storeName: item.storeName,
                                        name: item.menuName,
                                        price: item.price,
                                      },
                                      item.quantity + 1,
                                    )
                                  }
                                  class=" text-slate-700"
                                >
                                  +
                                </button>
                              </div>
                            </div>

                            <input
                              type="text"
                              class="input text-base"
                              placeholder="Add notes (e.g., less spicy)"
                              value={item.notes}
                              onInput={(e) =>
                                draft.setItemNotes(
                                  item.menuId,
                                  e.currentTarget.value,
                                )
                              }
                            />

                            <button
                              type="button"
                              onClick={() => draft.removeItem(item.menuId)}
                              class="mt-3 text-sm font-semibold text-red-500"
                            >
                              Hapus item
                            </button>
                          </div>
                        )}
                      </For>
                    </div>
                  )}
                </For>
              </div>
            </section>
          </Show>
        </main>

        <Show when={cart().length > 0}>
          <div class="tm-bottom-nav !border-t-slate-200">
            <div class="mx-auto max-w-[30rem] px-6 pb-6 pt-4">
              <div class="mb-4">
                <p class=" text-slate-600">Total Estimated</p>
                <p class="mt-2  font-bold tracking-[-0.06em] text-primary-700">
                  {formatRupiah(totalAmount())}
                </p>
              </div>

              <Show when={error()}>
                <p class="mb-3 text-sm text-red-500">{error()}</p>
              </Show>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting()}
                class="btn-primary flex w-full items-center justify-center gap-3 text-base"
              >
                {submitting() ? "Menyimpan..." : "Titip Sekarang"}
                <IconArrowRight class="h-6 w-6" />
              </button>
            </div>
          </div>
        </Show>
      </div>
    </>
  );
}

function StepBadge(props: { number: number; label: string; active?: boolean }) {
  return (
    <div class="flex flex-col items-center gap-3">
      <div
        class={`flex h-12 w-12 items-center justify-center rounded-lg text-base ${
          props.active
            ? "bg-primary-700 text-white"
            : "bg-slate-200 text-slate-700"
        }`}
      >
        {props.number}
      </div>
      <span
        class={`text-base ${props.active ? "text-primary-700" : "text-slate-600"}`}
      >
        {props.label}
      </span>
    </div>
  );
}
