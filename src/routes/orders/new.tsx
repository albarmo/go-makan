import { Title } from "@solidjs/meta";
import { createAsync, useAction } from "@solidjs/router";
import { createMemo, createSignal, For, Show, Suspense } from "solid-js";
import { IconArrowRight, IconChevronLeft } from "~/components/icons";
import RoleGuard from "~/components/RoleGuard";
import { type Menu } from "~/lib/db/schema";
import { useUser } from "~/lib/user-context";
import { formatRupiah } from "~/lib/utils";
import { getAvailableMenus, getMenusByStore } from "~/server/menus";
import { createOrderAction } from "~/server/orders";
import { getActiveStores } from "~/server/stores";

interface CartItem {
  menuId: number;
  storeId: number;
  menuName: string;
  price: number;
  quantity: number;
  notes: string;
}

interface BrowseMenu extends Menu {
  storeName?: string;
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
  const stores = createAsync(() => getActiveStores());
  const allMenus = createAsync(() => getAvailableMenus());

  const [selectedStoreId, setSelectedStoreId] = createSignal<number | null>(
    null,
  );
  const [cart, setCart] = createSignal<CartItem[]>([]);
  const [submitting, setSubmitting] = createSignal(false);
  const [error, setError] = createSignal("");

  const selectedStore = createMemo(
    () =>
      (stores() ?? []).find((store) => store.id === selectedStoreId()) ?? null,
  );

  const storeMenus = createAsync(() => {
    const storeId = selectedStoreId();
    if (!storeId) return Promise.resolve([] as Menu[]);
    return getMenusByStore(storeId);
  });

  const visibleMenus = createMemo<BrowseMenu[]>(() => {
    const storeId = selectedStoreId();
    if (!storeId) return (allMenus() ?? []) as BrowseMenu[];
    return (storeMenus() ?? []).map((menu) => ({
      ...menu,
      storeName: selectedStore()?.name ?? undefined,
    }));
  });

  const totalAmount = createMemo(() =>
    cart().reduce((sum, item) => sum + item.price * item.quantity, 0),
  );

  const lockedStoreId = createMemo(() => cart()[0]?.storeId ?? null);

  const getCartItem = (menuId: number) =>
    cart().find((item) => item.menuId === menuId);

  const setQuantity = (menu: BrowseMenu, quantity: number) => {
    if (quantity <= 0) {
      setCart((items) => items.filter((item) => item.menuId !== menu.id));
      return;
    }

    setCart((items) => {
      const existing = items.find((item) => item.menuId === menu.id);
      if (!existing) {
        return [
          ...items,
          {
            menuId: menu.id,
            storeId: menu.storeId,
            menuName: menu.name,
            price: menu.price,
            quantity,
            notes: "",
          },
        ];
      }

      return items.map((item) =>
        item.menuId === menu.id ? { ...item, quantity } : item,
      );
    });

    if (!selectedStoreId()) {
      setSelectedStoreId(menu.storeId);
    }
  };

  const setItemNotes = (menuId: number, notes: string) => {
    setCart((items) =>
      items.map((item) => (item.menuId === menuId ? { ...item, notes } : item)),
    );
  };

  const handleSubmit = async () => {
    const store = selectedStore();
    const currentUser = user();
    if (!store || !currentUser || cart().length === 0) return;

    setSubmitting(true);
    setError("");

    try {
      const formData = new FormData();
      formData.set("requesterName", currentUser.name);
      formData.set("storeId", String(store.id));
      formData.set("notes", "");
      formData.set(
        "items",
        JSON.stringify(
          cart().map((item) => ({
            menuId: item.menuId,
            menuName: item.menuName,
            price: item.price,
            quantity: item.quantity,
            notes: item.notes || null,
          })),
        ),
      );
      await createOrder(formData);
    } catch (err) {
      setSubmitting(false);
      setError(String(err));
    }
  };

  const isMenuSelectable = (menu: BrowseMenu) =>
    !lockedStoreId() || lockedStoreId() === menu.storeId;

  return (
    <>
      <Title>Create Order - Titip Makan</Title>
      <div class="tm-app-shell">
        <header class="tm-topbar">
          <div class="mx-auto flex max-w-[30rem] items-center gap-4 px-6 py-4">
            <button
              type="button"
              onClick={() => history.back()}
              class="flex h-11 w-11 items-center justify-center rounded-full text-slate-900"
              aria-label="Kembali"
            >
              <IconChevronLeft class="h-7 w-7" />
            </button>
            <h1 class="text-xl font-bold tracking-[-0.05em] text-slate-900">
              Create Order
            </h1>
          </div>
        </header>

        <main class="mx-auto max-w-[30rem] px-6 pb-44 pt-6">
          <div class="mb-10 flex items-center justify-between">
            <StepBadge number={1} label="Store" active />
            <div class="mx-2 h-px flex-1 bg-slate-300" />
            <StepBadge number={2} label="Menu" active={!!selectedStore()} />
            <div class="mx-2 h-px flex-1 bg-slate-300" />
            <StepBadge number={3} label="Checkout" active={cart().length > 0} />
          </div>

          <section class="space-y-5">
            <h2 class="text-xl font-semibold tracking-[-0.05em] text-slate-900">
              Order Details
            </h2>

            <div>
              <label class="mb-3 block text-lg font-semibold text-slate-800">
                Your Name
              </label>
              <input
                class="input text-lg"
                value={user()?.name ?? ""}
                disabled
              />
            </div>

            <div>
              <label class="mb-3 block text-lg font-semibold text-slate-800">
                Select Store
              </label>
              <select
                class="input text-lg"
                value={selectedStoreId() ?? ""}
                onChange={(e) => {
                  const nextValue = e.currentTarget.value;
                  if (nextValue === "all") {
                    setSelectedStoreId(null);
                    setCart([]);
                    return;
                  }
                  setSelectedStoreId(nextValue ? Number(nextValue) : null);
                  setCart([]);
                }}
              >
                <option value="all">Lihat semua menu</option>
                <For each={stores()}>
                  {(store) => <option value={store.id}>{store.name}</option>}
                </For>
              </select>
            </div>
          </section>

          <section class="mt-10">
            <div class="mb-5 flex items-center justify-between gap-4">
              <h2 class="text-xl font-semibold tracking-[-0.05em] text-slate-900">
                Menu
              </h2>
              <span class="rounded-full bg-slate-200 px-4 py-2 text-base text-slate-600">
                {selectedStore()?.name ?? "Semua Menu"}
              </span>
            </div>

            <Show when={lockedStoreId() && !selectedStore()}>
              <p class="mb-4 text-sm text-slate-500">
                Setelah pilih item pertama, order hanya bisa berisi menu dari store yang sama.
              </p>
            </Show>

            <Suspense fallback={<MenuGridSkeleton />}>
              <div class="grid grid-cols-2 gap-5">
                <For each={visibleMenus()}>
                  {(menu) => {
                    const cartItem = () => getCartItem(menu.id);
                    const selectable = () => isMenuSelectable(menu);

                    return (
                      <div
                        class={`tm-card overflow-hidden p-4 ${
                          selectable() ? "" : "opacity-50"
                        }`}
                      >
                        <div class="h-36 rounded-[1.5rem] bg-slate-200">
                          <Show
                            when={menu.imageUrl}
                            fallback={
                              <div class="h-full w-full bg-gradient-to-br from-slate-200 via-slate-300 to-slate-200" />
                            }
                          >
                            <img
                              src={menu.imageUrl!}
                              alt={menu.name}
                              class="h-full w-full rounded-[1.5rem] object-cover"
                            />
                          </Show>
                        </div>
                        <p class="mt-4 text-xl font-semibold leading-8 tracking-[-0.03em] text-slate-900">
                          {menu.name}
                        </p>
                        <Show when={menu.storeName}>
                          <p class="mt-1 text-sm font-medium text-primary-700">
                            {menu.storeName}
                          </p>
                        </Show>
                        <p class="mt-1 text-lg text-slate-600">
                          {formatRupiah(menu.price)}
                        </p>

                        <div class="mt-5 flex items-center justify-end gap-3">
                          <Show when={cartItem()}>
                            <button
                              type="button"
                              disabled={!selectable()}
                              onClick={() =>
                                setQuantity(menu, (cartItem()?.quantity ?? 0) - 1)
                              }
                              class="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-xl text-slate-700 disabled:opacity-50"
                            >
                              -
                            </button>
                            <span class="min-w-6 text-center text-lg font-semibold">
                              {cartItem()?.quantity}
                            </span>
                          </Show>
                          <button
                            type="button"
                            disabled={!selectable()}
                            onClick={() =>
                              setQuantity(menu, (cartItem()?.quantity ?? 0) + 1)
                            }
                            class="flex h-12 w-12 items-center justify-center rounded-full bg-[#35bced] text-xl leading-none text-primary-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
                          >
                            +
                          </button>
                        </div>

                        <Show when={!selectable()}>
                          <p class="mt-3 text-xs text-slate-500">
                            Keranjang aktif untuk store lain.
                          </p>
                        </Show>
                      </div>
                    );
                  }}
                </For>
              </div>
            </Suspense>
          </section>

          <Show when={cart().length > 0}>
            <section class="mt-10">
              <h2 class="mb-5 text-xl font-semibold tracking-[-0.05em] text-slate-900">
                Your Items
              </h2>
              <div class="tm-card p-5">
                <For each={cart()}>
                  {(item) => (
                    <div class="border-b border-slate-200 py-4 last:border-b-0">
                      <div class="mb-4 flex items-start justify-between gap-4">
                        <div>
                          <p class="text-xl font-semibold text-slate-900">
                            {item.menuName}
                          </p>
                          <p class="mt-1 text-lg text-primary-700">
                            {formatRupiah(item.price)}
                          </p>
                        </div>
                        <div class="flex items-center gap-4 rounded-full bg-slate-100 px-5 py-3">
                          <button
                            type="button"
                            onClick={() =>
                              setQuantity(
                                {
                                  id: item.menuId,
                                  storeId: item.storeId,
                                  name: item.menuName,
                                  price: item.price,
                                } as BrowseMenu,
                                item.quantity - 1,
                              )
                            }
                            class="text-xl text-slate-700"
                          >
                            -
                          </button>
                          <span class="text-lg font-semibold">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setQuantity(
                                {
                                  id: item.menuId,
                                  storeId: item.storeId,
                                  name: item.menuName,
                                  price: item.price,
                                } as BrowseMenu,
                                item.quantity + 1,
                              )
                            }
                            class="text-xl text-slate-700"
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
                          setItemNotes(item.menuId, e.currentTarget.value)
                        }
                      />
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
                <p class="text-lg text-slate-600">Total Estimated</p>
                <p class="mt-2 text-xl font-bold tracking-[-0.06em] text-primary-700">
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
        class={`flex h-12 w-12 items-center justify-center rounded-full text-base ${
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

function MenuGridSkeleton() {
  return (
    <div class="grid grid-cols-2 gap-5">
      {[1, 2].map((item) => (
        <div class="h-64 animate-pulse rounded-[2rem] bg-white/80" />
      ))}
    </div>
  );
}
