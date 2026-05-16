import { createAsync, useAction } from "@solidjs/router";
import {
  createMemo,
  createSignal,
  For,
  Show,
  Suspense,
} from "solid-js";
import { Title } from "@solidjs/meta";
import RoleGuard from "~/components/RoleGuard";
import { useUser } from "~/lib/user-context";
import { getActiveStores } from "~/server/stores";
import { getMenusByStore } from "~/server/menus";
import { createOrderAction } from "~/server/orders";
import { formatRupiah } from "~/lib/utils";
import { type Menu } from "~/lib/db/schema";
import { IconChevronLeft, IconMapPin, IconArrowRight } from "~/components/icons";

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
    description?: string | null;
    address?: string | null;
    imageUrl?: string | null;
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

  const handleSelectStore = (store: { id: number; name: string; description?: string | null; address?: string | null; imageUrl?: string | null }) => {
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
      <div class="min-h-screen bg-slate-100">
        {/* Header */}
        <header class="sticky top-0 z-40 bg-primary-700 text-white">
          <div class="mx-auto flex max-w-lg items-center gap-3 px-4 py-3.5">
            <Show when={step() === "menu"}>
              <button
                onClick={() => setStep("store")}
                class="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 hover:bg-white/30"
              >
                <IconChevronLeft class="h-4 w-4" />
              </button>
            </Show>
            <div class="flex-1">
              <h1 class="text-base font-bold">
                {step() === "store" ? "Pilih Toko" : selectedStore()?.name ?? "Pilih Menu"}
              </h1>
              <Show when={step() === "menu" && cartCount() > 0}>
                <p class="text-xs text-primary-200">
                  {cartCount()} item · {formatRupiah(totalAmount())}
                </p>
              </Show>
              <Show when={step() === "menu" && cartCount() === 0}>
                <p class="text-xs text-primary-300">Pilih menu yang mau dititip</p>
              </Show>
            </div>
          </div>
          {/* Step indicator */}
          <div class="flex px-4 pb-3 gap-2">
            <div class={`h-1 flex-1 rounded-full transition-colors ${step() === "store" ? "bg-white" : "bg-white/40"}`} />
            <div class={`h-1 flex-1 rounded-full transition-colors ${step() === "menu" ? "bg-white" : "bg-white/20"}`} />
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
                  <div class="card p-10 text-center">
                    <p class="text-3xl">🏪</p>
                    <p class="mt-2 font-semibold text-gray-700">Belum ada toko aktif</p>
                    <p class="mt-1 text-sm text-gray-400">Minta admin untuk menambahkan toko</p>
                  </div>
                }
              >
                <div class="space-y-2">
                  <p class="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
                    Toko Tersedia
                  </p>
                  <For each={activeStores()}>
                    {(store) => (
                      <button
                        type="button"
                        onClick={() => handleSelectStore(store)}
                        class="card w-full p-4 text-left hover:shadow-md active:scale-[0.98] transition-all"
                      >
                        <div class="flex items-center gap-3">
                          <Show
                            when={store.imageUrl}
                            fallback={
                              <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-100 text-2xl">
                                🏪
                              </div>
                            }
                          >
                            <img
                              src={store.imageUrl!}
                              alt={store.name}
                              class="h-12 w-12 shrink-0 rounded-xl object-cover"
                            />
                          </Show>
                          <div class="flex-1 min-w-0">
                            <p class="font-semibold text-gray-900">{store.name}</p>
                            <Show when={store.description}>
                              <p class="text-xs text-gray-400 truncate">{store.description}</p>
                            </Show>
                            <Show when={store.address}>
                              <div class="flex items-center gap-1 mt-0.5">
                                <IconMapPin class="h-3 w-3 text-gray-400 shrink-0" />
                                <p class="text-xs text-gray-400 truncate">{store.address}</p>
                              </div>
                            </Show>
                          </div>
                          <IconArrowRight class="h-4 w-4 shrink-0 text-gray-300" />
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
                <div class="space-y-2">
                  {[1, 2, 3, 4].map(() => (
                    <div class="card h-20 animate-pulse bg-gray-100" />
                  ))}
                </div>
              }
            >
              <Show
                when={(storeMenus() ?? []).length > 0}
                fallback={
                  <div class="card p-10 text-center">
                    <p class="text-3xl">🍽️</p>
                    <p class="mt-2 font-semibold text-gray-700">Belum ada menu di toko ini</p>
                  </div>
                }
              >
                <div class="space-y-2">
                  <p class="mb-1 text-xs font-semibold uppercase tracking-wider text-gray-400">
                    Menu Tersedia
                  </p>
                  <For each={storeMenus()}>
                    {(menu) => {
                      const cartItem = () => getCartItem(menu.id);
                      return (
                        <div class={`card p-3 transition-all ${cartItem() ? "border-primary-200 ring-1 ring-primary-200" : ""}`}>
                          <div class="flex items-center gap-3">
                            {/* Thumbnail */}
                            <Show
                              when={menu.imageUrl}
                              fallback={
                                <div class="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-2xl">
                                  🍽️
                                </div>
                              }
                            >
                              <img
                                src={menu.imageUrl!}
                                alt={menu.name}
                                class="h-14 w-14 shrink-0 rounded-xl object-cover"
                              />
                            </Show>

                            <div class="flex-1 min-w-0">
                              <p class="font-semibold text-gray-900 truncate">{menu.name}</p>
                              <Show when={menu.description}>
                                <p class="text-xs text-gray-400 truncate">{menu.description}</p>
                              </Show>
                              <p class="text-sm font-bold text-primary-600">
                                {formatRupiah(menu.price)}
                              </p>
                            </div>

                            {/* Qty controls */}
                            <div class="flex shrink-0 items-center gap-1.5">
                              <Show when={cartItem()}>
                                <button
                                  type="button"
                                  onClick={() => setQuantity(menu, (cartItem()?.quantity ?? 0) - 1)}
                                  class="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 text-base font-bold text-gray-600 hover:bg-gray-50"
                                >
                                  −
                                </button>
                                <span class="w-5 text-center text-sm font-bold text-gray-900">
                                  {cartItem()?.quantity ?? 0}
                                </span>
                              </Show>
                              <button
                                type="button"
                                onClick={() => setQuantity(menu, (cartItem()?.quantity ?? 0) + 1)}
                                class="flex h-8 w-8 items-center justify-center rounded-full bg-primary-600 text-base font-bold text-white hover:bg-primary-700"
                              >
                                +
                              </button>
                            </div>
                          </div>

                          {/* Per-item notes */}
                          <Show when={cartItem()}>
                            <div class="mt-2 pl-[68px]">
                              <input
                                type="text"
                                class="input !py-1.5 text-xs"
                                placeholder="Catatan (opsional)"
                                value={cartItem()?.notes ?? ""}
                                onInput={(e) => setItemNotes(menu.id, e.currentTarget.value)}
                                maxLength={200}
                              />
                            </div>
                          </Show>
                        </div>
                      );
                    }}
                  </For>

                  {/* Order notes */}
                  <div class="card p-4 mt-2">
                    <label class="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-400">
                      Catatan Order
                    </label>
                    <textarea
                      class="input resize-none text-sm"
                      rows="2"
                      placeholder="Opsional: tolong bungkus terpisah, dll"
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

        {/* Sticky cart summary + submit */}
        <Show when={step() === "menu" && cart().length > 0}>
          <div class="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] px-4 py-4">
            <div class="mx-auto max-w-lg">
              {/* Cart items */}
              <div class="mb-3 max-h-28 overflow-y-auto space-y-1">
                <For each={cart()}>
                  {(item) => (
                    <div class="flex justify-between text-xs">
                      <span class="text-gray-500">{item.menuName} × {item.quantity}</span>
                      <span class="font-semibold text-gray-700">{formatRupiah(item.price * item.quantity)}</span>
                    </div>
                  )}
                </For>
              </div>
              <div class="mb-3 flex justify-between border-t border-gray-100 pt-2 text-sm font-bold">
                <span class="text-gray-900">Total</span>
                <span class="text-primary-600">{formatRupiah(totalAmount())}</span>
              </div>

              <Show when={error()}>
                <p class="mb-2 text-xs text-red-500">{error()}</p>
              </Show>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting() || cart().length === 0}
                class="btn-primary w-full"
              >
                {submitting() ? "Membuat Order..." : `Titip Sekarang · ${formatRupiah(totalAmount())}`}
              </button>
            </div>
          </div>
        </Show>
      </div>
    </>
  );
}
