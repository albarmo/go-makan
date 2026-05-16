import { createAsync, useAction } from "@solidjs/router";
import {
  createMemo,
  createSignal,
  For,
  Show,
  Suspense,
} from "solid-js";
import { Title } from "@solidjs/meta";
import Layout from "~/components/Layout";
import RoleGuard from "~/components/RoleGuard";
import { useUser } from "~/lib/user-context";
import { getActiveStores } from "~/server/stores";
import { getMenusByStore } from "~/server/menus";
import { createOrderAction } from "~/server/orders";
import { formatRupiah } from "~/lib/utils";
import { type Menu } from "~/lib/db/schema";

interface CartItem {
  menuId: number;
  menuName: string;
  price: number;
  quantity: number;
  notes: string;
}

export const route = {
  load: () => getActiveStores(),
};

export default function NewOrderPage() {
  return (
    <RoleGuard requiredRole="pemesan">
      <NewOrderContent />
    </RoleGuard>
  );
}

function NewOrderContent() {
  const { user } = useUser();
  const createOrder = useAction(createOrderAction);
  const activeStores = createAsync(() => getActiveStores());

  const [step, setStep] = createSignal<"store" | "menu">("store");
  const [selectedStore, setSelectedStore] = createSignal<{
    id: number;
    name: string;
  } | null>(null);
  const [cart, setCart] = createSignal<CartItem[]>([]);
  const [orderNotes, setOrderNotes] = createSignal("");
  const [submitting, setSubmitting] = createSignal(false);
  const [error, setError] = createSignal("");

  const storeMenus = createAsync(() => {
    const s = selectedStore();
    if (!s) return Promise.resolve([] as Menu[]);
    return getMenusByStore(s.id);
  });

  const totalAmount = createMemo(() =>
    cart().reduce((sum, item) => sum + item.price * item.quantity, 0)
  );

  const cartCount = createMemo(() =>
    cart().reduce((sum, item) => sum + item.quantity, 0)
  );

  const getCartItem = (menuId: number) =>
    cart().find((item) => item.menuId === menuId);

  const setQuantity = (menu: Menu, qty: number) => {
    if (qty <= 0) {
      setCart((prev) => prev.filter((item) => item.menuId !== menu.id));
    } else {
      setCart((prev) => {
        const existing = prev.find((item) => item.menuId === menu.id);
        if (existing) {
          return prev.map((item) =>
            item.menuId === menu.id ? { ...item, quantity: qty } : item
          );
        }
        return [
          ...prev,
          {
            menuId: menu.id,
            menuName: menu.name,
            price: menu.price,
            quantity: qty,
            notes: "",
          },
        ];
      });
    }
  };

  const setItemNotes = (menuId: number, notes: string) => {
    setCart((prev) =>
      prev.map((item) =>
        item.menuId === menuId ? { ...item, notes } : item
      )
    );
  };

  const handleSelectStore = (store: { id: number; name: string }) => {
    setSelectedStore(store);
    setCart([]);
    setStep("menu");
  };

  const handleSubmit = async () => {
    const u = user();
    const s = selectedStore();
    if (!u || !s || cart().length === 0) return;

    setSubmitting(true);
    setError("");
    try {
      const formData = new FormData();
      formData.set("requesterName", u.name);
      formData.set("storeId", s.id.toString());
      formData.set("notes", orderNotes());
      formData.set(
        "items",
        JSON.stringify(
          cart().map((item) => ({
            menuId: item.menuId,
            menuName: item.menuName,
            price: item.price,
            quantity: item.quantity,
            notes: item.notes || null,
          }))
        )
      );
      await createOrder(formData);
    } catch (err) {
      setError(String(err));
      setSubmitting(false);
    }
  };

  return (
    <>
      <Title>Order Baru - Titip Makan</Title>
      <div class="min-h-screen bg-gray-50">
        {/* Header */}
        <header class="sticky top-0 z-40 border-b border-gray-200 bg-white">
          <div class="mx-auto flex max-w-lg items-center gap-3 px-4 py-3">
            <Show when={step() === "menu"}>
              <button
                onClick={() => setStep("store")}
                class="flex h-9 w-9 items-center justify-center rounded-full text-gray-600 hover:bg-gray-100"
              >
                ←
              </button>
            </Show>
            <div class="flex-1">
              <h1 class="text-base font-semibold text-gray-900">
                {step() === "store" ? "Pilih Toko" : selectedStore()?.name ?? "Pilih Menu"}
              </h1>
              <Show when={step() === "menu" && cartCount() > 0}>
                <p class="text-xs text-primary-600">
                  {cartCount()} item dipilih · {formatRupiah(totalAmount())}
                </p>
              </Show>
            </div>
          </div>
        </header>

        <main class="mx-auto max-w-lg px-4 py-4 pb-36">
          {/* Step 1: Pilih Toko */}
          <Show when={step() === "store"}>
            <Suspense
              fallback={
                <div class="space-y-3">
                  {[1, 2, 3].map(() => (
                    <div class="card h-20 animate-pulse bg-gray-100" />
                  ))}
                </div>
              }
            >
              <Show
                when={(activeStores() ?? []).length > 0}
                fallback={
                  <div class="card p-8 text-center">
                    <p class="text-2xl">🏪</p>
                    <p class="mt-2 font-semibold text-gray-700">
                      Belum ada toko aktif
                    </p>
                    <p class="mt-1 text-sm text-gray-400">
                      Minta admin untuk menambahkan toko
                    </p>
                  </div>
                }
              >
                <div class="space-y-3">
                  <p class="text-sm text-gray-500">
                    Pilih tempat makan untuk pesananmu hari ini
                  </p>
                  <For each={activeStores()}>
                    {(store) => (
                      <button
                        type="button"
                        onClick={() => handleSelectStore(store)}
                        class="card w-full p-4 text-left hover:shadow-md active:scale-95 transition-all"
                      >
                        <div class="flex items-center gap-3">
                          <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-100 text-2xl">
                            🏪
                          </div>
                          <div class="flex-1 min-w-0">
                            <p class="font-semibold text-gray-900">
                              {store.name}
                            </p>
                            <Show when={store.description}>
                              <p class="text-sm text-gray-500 truncate">
                                {store.description}
                              </p>
                            </Show>
                            <Show when={store.address}>
                              <p class="text-xs text-gray-400 truncate">
                                📍 {store.address}
                              </p>
                            </Show>
                          </div>
                          <span class="text-gray-400">→</span>
                        </div>
                      </button>
                    )}
                  </For>
                </div>
              </Show>
            </Suspense>
          </Show>

          {/* Step 2: Pilih Menu */}
          <Show when={step() === "menu"}>
            <Suspense
              fallback={
                <div class="space-y-3">
                  {[1, 2, 3, 4].map(() => (
                    <div class="card h-20 animate-pulse bg-gray-100" />
                  ))}
                </div>
              }
            >
              <Show
                when={(storeMenus() ?? []).length > 0}
                fallback={
                  <div class="card p-8 text-center">
                    <p class="text-2xl">🍽️</p>
                    <p class="mt-2 font-semibold text-gray-700">
                      Belum ada menu di toko ini
                    </p>
                  </div>
                }
              >
                <div class="space-y-2">
                  <For each={storeMenus()}>
                    {(menu) => {
                      const cartItem = () => getCartItem(menu.id);
                      return (
                        <div class="card p-4">
                          <div class="flex items-start gap-3">
                            <div class="flex-1 min-w-0">
                              <p class="font-semibold text-gray-900">
                                {menu.name}
                              </p>
                              <Show when={menu.description}>
                                <p class="text-sm text-gray-500">
                                  {menu.description}
                                </p>
                              </Show>
                              <p class="mt-1 font-semibold text-primary-600">
                                {formatRupiah(menu.price)}
                              </p>
                            </div>

                            {/* Quantity control */}
                            <div class="flex shrink-0 items-center gap-2">
                              <Show when={cartItem()}>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setQuantity(menu, (cartItem()?.quantity ?? 0) - 1)
                                  }
                                  class="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-lg font-bold text-gray-600 hover:bg-gray-200"
                                >
                                  −
                                </button>
                                <span class="w-6 text-center text-sm font-bold text-gray-900">
                                  {cartItem()?.quantity ?? 0}
                                </span>
                              </Show>
                              <button
                                type="button"
                                onClick={() =>
                                  setQuantity(menu, (cartItem()?.quantity ?? 0) + 1)
                                }
                                class="flex h-8 w-8 items-center justify-center rounded-full bg-primary-500 text-lg font-bold text-white hover:bg-primary-600"
                              >
                                +
                              </button>
                            </div>
                          </div>

                          {/* Notes per item */}
                          <Show when={cartItem()}>
                            <div class="mt-2">
                              <input
                                type="text"
                                class="input !py-2 text-xs"
                                placeholder="Catatan untuk item ini (opsional)"
                                value={cartItem()?.notes ?? ""}
                                onInput={(e) =>
                                  setItemNotes(menu.id, e.currentTarget.value)
                                }
                                maxLength={200}
                              />
                            </div>
                          </Show>
                        </div>
                      );
                    }}
                  </For>

                  {/* Order notes */}
                  <div class="card p-4">
                    <label class="mb-1.5 block text-sm font-semibold text-gray-700">
                      Catatan Order (opsional)
                    </label>
                    <textarea
                      class="input resize-none text-sm"
                      rows="2"
                      placeholder="Contoh: tolong bungkus terpisah"
                      value={orderNotes()}
                      onInput={(e) => setOrderNotes(e.currentTarget.value)}
                      maxLength={500}
                    />
                  </div>
                </div>
              </Show>
            </Suspense>
          </Show>
        </main>

        {/* Sticky bottom: total + submit button */}
        <Show when={step() === "menu" && cart().length > 0}>
          <div class="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white px-4 py-4 shadow-lg">
            <div class="mx-auto max-w-lg space-y-3">
              {/* Mini cart summary */}
              <div class="space-y-1">
                <For each={cart()}>
                  {(item) => (
                    <div class="flex justify-between text-sm">
                      <span class="text-gray-600">
                        {item.menuName} × {item.quantity}
                      </span>
                      <span class="font-medium">
                        {formatRupiah(item.price * item.quantity)}
                      </span>
                    </div>
                  )}
                </For>
                <div class="flex justify-between border-t border-gray-100 pt-1 text-base font-bold">
                  <span>Total</span>
                  <span class="text-primary-600">{formatRupiah(totalAmount())}</span>
                </div>
              </div>

              <Show when={error()}>
                <p class="text-sm text-red-600">{error()}</p>
              </Show>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting() || cart().length === 0}
                class="btn-primary w-full"
              >
                {submitting() ? "Membuat Order..." : `Titip Beli · ${formatRupiah(totalAmount())}`}
              </button>
            </div>
          </div>
        </Show>
      </div>
    </>
  );
}
