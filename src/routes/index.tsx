import { Title } from "@solidjs/meta";
import { A, createAsync, useNavigate } from "@solidjs/router";
import {
  ArrowRight as IconArrowRight,
  MapPin as IconMapPin,
  Receipt as IconReceipt,
  Search as IconSearch,
  ShoppingBag as IconShoppingBag,
  Store as IconStore,
  Wallet as IconWallet,
} from "lucide-solid";
import {
  createEffect,
  createMemo,
  createSignal,
  For,
  onCleanup,
  Show,
  Suspense,
} from "solid-js";
import BottomNav from "~/components/BottomNav";
import RoleGuard from "~/components/RoleGuard";
import { useOrderDraft } from "~/lib/order-draft-context";
import { useOrderEvents } from "~/lib/use-order-events";
import { useUser } from "~/lib/user-context";
import { formatCompactRupiah, formatRupiah } from "~/lib/utils";
import { getAvailableMenus } from "~/server/menus";
import { getBuyerOrdersByStore, getTodayOrders } from "~/server/orders";
import { getActiveStores } from "~/server/stores";

export default function HomePage() {
  return (
    <RoleGuard>
      <HomeContent />
    </RoleGuard>
  );
}

function HomeContent() {
  const { user } = useUser();

  return (
    <>
      <Title>Dashboard - Titip Makan</Title>
      <Show
        when={user()?.role === "pembeli"}
        fallback={
          <HomeShell>
            <PemesanHome />
          </HomeShell>
        }
      >
        <HomeShell>
          <PembeliHome />
        </HomeShell>
      </Show>
    </>
  );
}

function HomeShell(props: { children: any }) {
  const { user } = useUser();

  return (
    <div class="tm-app-shell">
      <main class="tm-page">{props.children}</main>
      <Show when={user()}>
        <BottomNav />
      </Show>
    </div>
  );
}

function PemesanHome() {
  const { user } = useUser();
  const draft = useOrderDraft();
  const navigate = useNavigate();
  const stores = createAsync(() => getActiveStores());
  const menus = createAsync(() => getAvailableMenus());
  const [searchInput, setSearchInput] = createSignal("");
  const [searchQuery, setSearchQuery] = createSignal("");
  const [visibleMenuCount, setVisibleMenuCount] = createSignal(6);
  let loadMoreRef: HTMLDivElement | undefined;

  const filteredStores = createMemo(() => {
    const query = searchQuery().trim().toLowerCase();
    const allStores = stores() ?? [];
    if (!query) return allStores;

    return allStores.filter((store) =>
      [store.name, store.description ?? "", store.address ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  });
  const featuredStores = createMemo(() => {
    const matchedStores = filteredStores();
    return searchQuery().trim() ? matchedStores : matchedStores.slice(0, 4);
  });
  const filteredMenus = createMemo(() => {
    const query = searchQuery().trim().toLowerCase();
    const allMenus = menus() ?? [];
    if (!query) return allMenus;

    return allMenus.filter((menu) =>
      [menu.name, menu.description ?? "", menu.storeName ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  });
  const visibleMenus = createMemo(() =>
    filteredMenus().slice(0, visibleMenuCount()),
  );
  const canLoadMore = createMemo(
    () => visibleMenuCount() < filteredMenus().length,
  );

  createEffect(() => {
    const handle = setTimeout(() => {
      setSearchQuery(searchInput());
    }, 280);

    onCleanup(() => clearTimeout(handle));
  });

  createEffect(() => {
    searchQuery();
    setVisibleMenuCount(6);
  });

  createEffect(() => {
    const node = loadMoreRef;
    if (
      !node ||
      !canLoadMore() ||
      typeof IntersectionObserver === "undefined"
    ) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisibleMenuCount((count) =>
            Math.min(count + 4, filteredMenus().length),
          );
        }
      },
      { rootMargin: "160px 0px" },
    );

    observer.observe(node);
    onCleanup(() => observer.disconnect());
  });

  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <div class="space-y-7 pb-28">
        <section class="relative left-1/2 w-screen -translate-x-1/2 -mt-8 pb-10">
          <div class="relative overflow-hidden bg-gradient-to-br from-primary-700 via-sky-600 to-cyan-500 px-6 pb-12 pt-5 text-white shadow-[0_18px_36px_rgba(15,104,140,0.22)]">
            <div class="absolute -right-6 -top-6 h-24 w-24 rounded-lg bg-white/10 rotate-12" />
            <div class="absolute right-5 top-10 h-16 w-16 rounded-lg bg-white/10" />
            <div class="absolute -bottom-8 left-1/2 h-20 w-20 -translate-x-1/2 rounded-lg bg-white/10 rotate-45" />

            <div class="relative z-10">
              <div class="flex items-start justify-between gap-4">
                <div>
                  <span class="inline-flex rounded-lg bg-white/15 px-3 py-1 text-sm font-semibold text-white">
                    Saya Yang Nitip
                  </span>

                  <h1 class="mt-4 text-lg font-extrabold tracking-[-0.05em] text-white">
                    Halo, {user()?.name}!
                  </h1>

                  <p class="mt-3 text-base text-white/90">
                    Temukan toko favorit dan titip makan siang lebih cepat.
                  </p>
                </div>
              </div>

              <div class="mt-6 flex items-center gap-2 text-sm text-white/90">
                <IconMapPin class="h-4 w-4" />
                <span>Bitgroup Cityloft</span>
              </div>
            </div>
          </div>

          <div class="absolute inset-x-4 -bottom-1 flex items-center gap-3 rounded-lg border border-white/80 bg-white px-5 py-4 shadow-[0_14px_28px_rgba(15,68,93,0.12)]">
            <IconSearch class="h-5 w-5 text-slate-400" />
            <input
              type="search"
              class="w-full h-full bg-transparent text-base text-slate-700 placeholder:text-slate-400 focus:outline-none"
              placeholder="Cari menu atau tempat makan"
              value={searchInput()}
              onInput={(e) => setSearchInput(e.currentTarget.value)}
            />
          </div>
        </section>

        <section class="space-y-5">
          <div class="flex items-end justify-between gap-4">
            <h2 class=" font-bold tracking-[-0.05em] text-slate-900">
              Tempat Makan
            </h2>
            <A href="/stores" class="text-base font-semibold text-primary-700">
              Lihat Semua
            </A>
          </div>

          <Show
            when={featuredStores().length > 0}
            fallback={
              <div class="tm-card p-7">
                <p class="text-lg text-slate-600">
                  {searchQuery().trim()
                    ? "Tidak ada toko yang cocok dengan pencarianmu."
                    : "Belum ada toko aktif yang bisa ditampilkan."}
                </p>
              </div>
            }
          >
            <div class="-mx-2 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [scroll-padding-left:2rem] [scroll-padding-right:2rem]">
              <For each={featuredStores()}>
                {(store) => (
                  <A
                    href={`/stores/${store.id}`}
                    class="tm-card min-w-[16.5rem] snap-start overflow-hidden"
                  >
                    <div class="relative h-28 bg-slate-200">
                      <Show
                        when={store.imageUrl}
                        fallback={
                          <div class="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-200 via-slate-100 to-sky-100  font-bold text-primary-700">
                            {store.name.charAt(0).toUpperCase()}
                          </div>
                        }
                      >
                        <img
                          src={store.imageUrl!}
                          alt={store.name}
                          class="h-full w-full object-cover"
                        />
                      </Show>
                      <span class="absolute right-3 top-3 rounded-lg bg-white px-3 py-1 text-sm font-semibold text-emerald-600 shadow-sm">
                        Buka
                      </span>
                    </div>

                    <div class="space-y-3 p-4">
                      <div>
                        <p class="text-lg font-semibold leading-tight text-slate-900">
                          {store.name}
                        </p>
                        <p class="mt-2 text-sm leading-6 text-slate-600">
                          {store.description ||
                            "Menu favorit untuk makan siang kantor."}
                        </p>
                      </div>

                      <div class="flex items-start gap-2 text-sm text-slate-500">
                        <IconMapPin class="mt-0.5 h-4 w-4 shrink-0" />
                        <span>
                          {store.address || "Alamat belum ditambahkan"}
                        </span>
                      </div>
                    </div>
                  </A>
                )}
              </For>
            </div>
          </Show>
        </section>

        <section class="space-y-5">
          <div class="flex items-end justify-between gap-4">
            <div>
              <h2 class=" font-bold tracking-[-0.05em] text-slate-900">
                Semua Menu
              </h2>
              <p class="mt-2 text-base text-slate-500">
                Pilih menu favoritmu, nanti lanjut titip di checkout.
              </p>
            </div>
          </div>

          <Show
            when={filteredMenus().length > 0}
            fallback={
              <div class="tm-card p-7">
                <p class="text-lg text-slate-600">
                  {searchQuery().trim()
                    ? "Tidak ada menu yang cocok dengan pencarianmu."
                    : "Belum ada menu aktif yang bisa ditampilkan."}
                </p>
              </div>
            }
          >
            <div class="grid grid-cols-2 gap-4">
              <For each={visibleMenus()}>
                {(menu) => (
                  <div class="tm-card overflow-hidden p-3">
                    <button
                      type="button"
                      onClick={() => void navigate(`/menus/${menu.id}`)}
                      class="block w-full text-left"
                    >
                      <div class="relative mb-3 aspect-square rounded-lg bg-slate-100">
                        <Show
                          when={menu.imageUrl}
                          fallback={
                            <div class="flex h-full w-full items-center justify-center rounded-lg bg-gradient-to-br from-sky-100 via-cyan-50 to-slate-100 px-3 text-center text-lg font-bold text-primary-700">
                              {menu.name.split(" ").slice(0, 2).join(" ")}
                            </div>
                          }
                        >
                          <img
                            src={menu.imageUrl!}
                            alt={menu.name}
                            class="h-full w-full rounded-lg object-cover"
                          />
                        </Show>
                      </div>

                      <div class="space-y-2">
                        <p class="text-base font-semibold leading-tight text-slate-900">
                          {menu.name}
                        </p>
                        <p class="text-sm leading-6 text-slate-500">
                          {menu.description ||
                            "Pilihan enak untuk makan siang hari ini."}
                        </p>
                        <span class="text-sm leading-6 text-primary-600">
                          {menu.storeName}
                        </span>
                      </div>
                    </button>

                    <div class="pt-3">
                      <div class="flex items-center justify-between gap-3 pt-1">
                        <span class="text-lg font-bold text-primary-700">
                          {formatRupiah(menu.price)}
                        </span>
                        <div class="flex items-center gap-2">
                          <Show when={draft.getItem(menu.id)}>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                draft.setQuantity(
                                  {
                                    id: menu.id,
                                    storeId: menu.storeId,
                                    storeName: menu.storeName ?? "",
                                    name: menu.name,
                                    price: menu.price,
                                  },
                                  (draft.getItem(menu.id)?.quantity ?? 0) - 1,
                                );
                              }}
                              class="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-base font-semibold text-slate-700"
                            >
                              -
                            </button>
                            <span class="min-w-5 text-center text-sm font-semibold text-slate-700">
                              {draft.getItem(menu.id)?.quantity}
                            </span>
                          </Show>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              draft.setQuantity(
                                {
                                  id: menu.id,
                                  storeId: menu.storeId,
                                  storeName: menu.storeName ?? "",
                                  name: menu.name,
                                  price: menu.price,
                                },
                                (draft.getItem(menu.id)?.quantity ?? 0) + 1,
                              );
                            }}
                            class="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-100 text-lg font-semibold text-primary-700"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </For>

              <Show when={canLoadMore()}>
                <div
                  ref={loadMoreRef}
                  class="col-span-2 flex h-12 items-center justify-center text-sm font-medium text-slate-500"
                >
                  Memuat menu lainnya...
                </div>
              </Show>
            </div>
          </Show>
        </section>

        <Show when={draft.items().length > 0}>
          <div class="fixed inset-x-0 bottom-24 z-40">
            <div class="mx-auto max-w-[30rem] px-6">
              <A
                href="/orders/new"
                class="tm-card flex items-center justify-between gap-4 bg-white px-5 py-4"
              >
                <div class="min-w-0">
                  <p class="text-sm text-slate-500">
                    {draft.totalQuantity()} item dari {draft.totalStoreCount()}{" "}
                    {draft.totalStoreCount() === 1 ? "toko" : "toko"}
                  </p>
                  <p class="mt-1 text-base font-semibold text-slate-900">
                    Lanjutkan draft order
                  </p>
                </div>
                <div class="shrink-0 text-right">
                  <p class="text-base font-bold text-primary-700">
                    {formatRupiah(draft.totalAmount())}
                  </p>
                  <p class="mt-1 text-sm font-semibold text-primary-700">
                    Buka checkout
                  </p>
                </div>
              </A>
            </div>
          </div>
        </Show>
      </div>
    </Suspense>
  );
}

function PembeliHome() {
  const { user } = useUser();
  const [refreshKey, setRefreshKey] = createSignal(0);
  const todayOrders = createAsync(() => {
    refreshKey();
    return getTodayOrders();
  });
  const storeOrders = createAsync(() => {
    refreshKey();
    return getBuyerOrdersByStore();
  });

  useOrderEvents(() => setRefreshKey((value) => value + 1));
  const activeOrders = createMemo(() =>
    (todayOrders() ?? []).filter((order) => order.status !== "cancelled"),
  );
  const incomingOrders = createMemo(() =>
    activeOrders().filter((order) => order.status === "submitted"),
  );
  const purchasedUnpaidOrders = createMemo(() =>
    activeOrders().filter(
      (order) => order.status === "purchased" && order.paymentStatus !== "paid",
    ),
  );
  const purchasedPaidOrders = createMemo(() =>
    activeOrders().filter(
      (order) => order.status === "purchased" && order.paymentStatus === "paid",
    ),
  );

  const totalBelanja = createMemo(() =>
    activeOrders().reduce((sum, order) => sum + order.totalAmount, 0),
  );
  const totalStores = createMemo(() => (storeOrders() ?? []).length);
  const unpaidTotal = createMemo(() =>
    purchasedUnpaidOrders().reduce((sum, order) => sum + order.totalAmount, 0),
  );
  const destinationStores = createMemo(() =>
    [...(storeOrders() ?? [])]
      .filter((store) => store.orderCount > 0)
      .sort((a, b) => {
        if (b.pendingCount !== a.pendingCount) {
          return b.pendingCount - a.pendingCount;
        }
        if (b.unpaidCount !== a.unpaidCount) {
          return b.unpaidCount - a.unpaidCount;
        }
        return b.totalItems - a.totalItems;
      }),
  );

  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <div class="space-y-6">
        <section class="relative left-1/2 w-screen -translate-x-1/2 -mt-8 pb-16">
          <div class="relative overflow-hidden bg-gradient-to-br from-primary-800 via-primary-700 to-cyan-500 px-6 pb-16 pt-6 text-white shadow-[0_18px_36px_rgba(15,104,140,0.24)]">
            <div class="absolute -left-8 top-8 h-20 w-20 rounded-lg bg-white/10 rotate-12" />
            <div class="absolute right-5 top-6 h-16 w-16 rounded-lg bg-white/10" />
            <div class="absolute bottom-5 right-10 h-24 w-24 rounded-lg bg-white/10 rotate-45" />

            <div class="relative z-10 space-y-5">
              <div class="flex items-start justify-between gap-4">
                <div>
                  <span class="inline-flex rounded-lg bg-white/15 px-3 py-1 text-sm font-semibold text-white">
                    Pembeli
                  </span>
                  <h1 class="mt-4 font-extrabold tracking-[-0.05em] text-white">
                    Halo, {user()?.name}!
                  </h1>
                  <p class="mt-3 max-w-[14rem] text-base leading-7 text-white/90">
                    Ringkas semua titipan masuk, pembelian aktif, dan tagihan
                    hari ini.
                  </p>
                </div>

                <A
                  href="/buyer/orders"
                  class="inline-flex shrink-0 items-center gap-2 rounded-lg bg-white/15 px-4 py-2 text-sm font-semibold text-white backdrop-blur"
                >
                  Kelola
                  <IconArrowRight class="h-4 w-4" />
                </A>
              </div>

              <div class="grid grid-cols-3 gap-3">
                <DashboardMiniStat
                  label="Masuk"
                  value={String(incomingOrders().length)}
                />
                <DashboardMiniStat
                  label="Belum Lunas"
                  value={String(purchasedUnpaidOrders().length)}
                />
                <DashboardMiniStat
                  label="Selesai"
                  value={String(purchasedPaidOrders().length)}
                />
              </div>
            </div>
          </div>

          <div class="absolute inset-x-6 -bottom-1 grid grid-cols-3 gap-3">
            <QuickLinkCard
              href="/buyer/orders"
              icon={<IconShoppingBag class="h-5 w-5" />}
              label="Orders"
            />
            <QuickLinkCard
              href="/buyer/recap"
              icon={<IconReceipt class="h-5 w-5" />}
              label="Rekap"
            />
            <QuickLinkCard
              href="/buyer/settlement"
              icon={<IconWallet class="h-5 w-5" />}
              label="Tagihan"
            />
          </div>
        </section>

        <div class="grid grid-cols-2 gap-4">
          <DashboardStatCard
            icon={<IconShoppingBag class="h-6 w-6" />}
            label="Order Aktif"
            value={String(activeOrders().length)}
            caption={`${incomingOrders().length} perlu diproses`}
          />
          <DashboardStatCard
            icon={<IconWallet class="h-6 w-6" />}
            label="Belum Lunas"
            value={formatCompactRupiah(unpaidTotal())}
            caption={`${purchasedUnpaidOrders().length} order`}
          />
          <div class="tm-card col-span-2 p-6">
            <div class="mb-5 flex h-12 w-12 items-center justify-center rounded-lg bg-sky-100 text-primary-700">
              <IconStore class="h-6 w-6" />
            </div>
            <div class="flex items-end justify-between gap-4">
              <div>
                <p class="text-base text-slate-700">Store Hari Ini</p>
                <p class="mt-2 font-bold tracking-[-0.05em] text-slate-900">
                  {totalStores()}
                </p>
              </div>
              <p class="text-base font-semibold text-primary-700">
                {formatCompactRupiah(totalBelanja())}
              </p>
            </div>
          </div>
        </div>

        <section class="space-y-4">
          <div class="flex items-end justify-between gap-4">
            <div>
              <h2 class="font-bold tracking-[-0.05em] text-slate-900">
                Toko Tujuan
              </h2>
              <p class="mt-1 text-base text-slate-500">
                Kerjakan belanja per toko supaya rutenya lebih efisien.
              </p>
            </div>
            <A
              href="/buyer/orders"
              class="text-base font-semibold text-primary-700"
            >
              Semua Toko
            </A>
          </div>

          <Show
            when={destinationStores().length > 0}
            fallback={
              <div class="tm-card p-6">
                <p class="font-semibold text-slate-900">
                  Belum ada toko yang perlu dituju
                </p>
                <p class="mt-2 text-base leading-7 text-slate-600">
                  Saat ada titipan masuk, daftar toko yang perlu didatangi akan
                  muncul di sini.
                </p>
              </div>
            }
          >
            <div class="space-y-4">
              <For each={destinationStores().slice(0, 3)}>
                {(store) => (
                  <div class="tm-card overflow-hidden">
                    <div class="bg-gradient-to-r from-sky-100 via-white to-cyan-50 px-6 py-5">
                      <div class="flex items-start justify-between gap-4">
                        <div class="flex items-start gap-4">
                          <div class="flex h-12 w-12 items-center justify-center rounded-lg bg-white text-primary-700 shadow-sm">
                            {store.storeName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p class="font-semibold tracking-[-0.04em] text-slate-900">
                              {store.storeName}
                            </p>
                            <p class="mt-2 text-base text-primary-700">
                              {store.orderCount} order • {store.totalItems} item
                            </p>
                          </div>
                        </div>
                        <span
                          class={
                            store.pendingCount > 0
                              ? "badge-submitted"
                              : store.unpaidCount > 0
                                ? "badge-cancelled"
                                : "badge-purchased"
                          }
                        >
                          {store.pendingCount > 0
                            ? `${store.pendingCount} pending`
                            : store.unpaidCount > 0
                              ? `${store.unpaidCount} belum bayar`
                              : "Selesai"}
                        </span>
                      </div>
                    </div>

                    <div class="space-y-4 px-6 py-5">
                      <div class="grid grid-cols-3 gap-3">
                        <div class="rounded-lg bg-slate-50 px-4 py-3">
                          <p class="text-sm text-slate-500">Perlu Dibeli</p>
                          <p class="mt-1 font-semibold text-slate-900">
                            {store.pendingCount}
                          </p>
                        </div>
                        <div class="rounded-lg bg-slate-50 px-4 py-3">
                          <p class="text-sm text-slate-500">Belum Bayar</p>
                          <p class="mt-1 font-semibold text-slate-900">
                            {store.unpaidCount}
                          </p>
                        </div>
                        <div class="rounded-lg bg-slate-50 px-4 py-3">
                          <p class="text-sm text-slate-500">Estimasi</p>
                          <p class="mt-1 font-semibold text-primary-700">
                            {formatCompactRupiah(store.totalAmount)}
                          </p>
                        </div>
                      </div>

                      <div class="flex items-end justify-between gap-4">
                        <div>
                          <p class="text-sm text-slate-500">Arah kerja</p>
                          <p class="mt-2 text-base leading-7 text-slate-700">
                            Selesaikan semua titipan dari toko ini dulu sebelum
                            lanjut ke toko berikutnya.
                          </p>
                        </div>
                        <A href="/buyer/orders" class="btn-primary">
                          Buka
                        </A>
                      </div>
                    </div>
                  </div>
                )}
              </For>
            </div>
          </Show>
        </section>

        <section class="space-y-4">
          <div class="flex items-end justify-between gap-4">
            <div>
              <h2 class="font-bold tracking-[-0.05em] text-slate-900">
                Titipan Masuk
              </h2>
              <p class="mt-1 text-base text-slate-500">
                Antrian cepat untuk bantu teman kantor.
              </p>
            </div>
            <A
              href="/buyer/orders"
              class="text-base font-semibold text-primary-700"
            >
              Lihat Semua
            </A>
          </div>

          <Show
            when={incomingOrders().length > 0}
            fallback={
              <div class="tm-card p-6">
                <p class="text-base leading-7 text-slate-600">
                  Belum ada titipan baru saat ini.
                </p>
              </div>
            }
          >
            <div class="space-y-4">
              <For each={incomingOrders().slice(0, 3)}>
                {(order) => (
                  <div class="tm-card p-5">
                    <div class="flex items-start justify-between gap-4">
                      <div class="flex items-start gap-4">
                        <div class="flex h-11 w-11 items-center justify-center rounded-lg bg-slate-200 font-semibold text-primary-700">
                          {order.requesterName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p class="font-semibold tracking-[-0.04em] text-slate-900">
                            {order.requesterName}
                          </p>
                          <p class="mt-1 text-base text-primary-700">
                            {order.storeSummary}
                          </p>
                        </div>
                      </div>
                      <span class="badge-submitted">Masuk</span>
                    </div>

                    <div class="mt-4 flex items-end justify-between gap-4">
                      <div>
                        <p class="text-base leading-7 text-slate-700">
                          {order.itemSummary}
                        </p>
                        <p class="mt-2 text-sm text-slate-500">
                          Estimasi {formatRupiah(order.totalAmount)}
                        </p>
                      </div>
                      <A
                        href={`/orders/${order.id}`}
                        class="btn-outline !min-h-0 px-4 py-3"
                      >
                        Proses
                      </A>
                    </div>
                  </div>
                )}
              </For>
            </div>
          </Show>
        </section>

        <A
          href="/buyer/settlement"
          class="tm-card flex items-center justify-between gap-4 bg-white px-5 py-4"
        >
          <div class="flex items-center gap-4">
            <div class="flex h-11 w-11 items-center justify-center rounded-lg bg-sky-100 text-primary-700">
              <IconWallet class="h-6 w-6" />
            </div>
            <div>
              <p class="font-semibold text-slate-900">Pantau Tagihan</p>
              <p class="mt-1 text-sm text-slate-500">
                Cek siapa yang belum transfer dan bukti pembayarannya.
              </p>
            </div>
          </div>
          <IconArrowRight class="h-5 w-5 text-primary-700" />
        </A>
      </div>
    </Suspense>
  );
}

function QuickLinkCard(props: { href: string; icon: any; label: string }) {
  return (
    <A
      href={props.href}
      class="tm-card flex min-h-[4.5rem] flex-col items-center justify-center gap-2 px-3 py-3 text-center"
    >
      <div class="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-100 text-primary-700">
        {props.icon}
      </div>
      <span class="text-sm font-semibold text-slate-700">{props.label}</span>
    </A>
  );
}

function DashboardMiniStat(props: { label: string; value: string }) {
  return (
    <div class="rounded-lg bg-white/12 px-3 py-3 backdrop-blur-sm">
      <p class="text-sm text-white/80">{props.label}</p>
      <p class="mt-1 font-bold text-white">{props.value}</p>
    </div>
  );
}

function DashboardStatCard(props: {
  icon: any;
  label: string;
  value: string;
  caption?: string;
}) {
  return (
    <div class="tm-card p-6">
      <div class="mb-5 flex h-12 w-12 items-center justify-center rounded-lg bg-sky-100 text-primary-700">
        {props.icon}
      </div>
      <p class="text-base text-slate-700">{props.label}</p>
      <p class="mt-2 font-bold tracking-[-0.06em] text-slate-900">
        {props.value}
      </p>
      <Show when={props.caption}>
        <p class="mt-2 text-sm text-primary-700">{props.caption}</p>
      </Show>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div class="space-y-5">
      <div class="h-52 animate-pulse rounded-lg bg-white/80" />
      <div class="grid grid-cols-2 gap-4">
        <div class="h-36 animate-pulse rounded-lg bg-white/80" />
        <div class="h-36 animate-pulse rounded-lg bg-white/80" />
      </div>
      <div class="h-56 animate-pulse rounded-lg bg-white/80" />
      <div class="h-52 animate-pulse rounded-lg bg-white/80" />
    </div>
  );
}
