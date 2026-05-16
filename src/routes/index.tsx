import { Title } from "@solidjs/meta";
import { A, createAsync } from "@solidjs/router";
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
import {
  IconMapPin,
  IconReceipt,
  IconSearch,
  IconShoppingBag,
  IconStore,
  IconWallet,
} from "~/components/icons";
import { useUser } from "~/lib/user-context";
import { formatCompactRupiah, formatRupiah } from "~/lib/utils";
import { getAvailableMenus } from "~/server/menus";
import { getBuyerRecap, getTodayOrders } from "~/server/orders";
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
  const stores = createAsync(() => getActiveStores());
  const menus = createAsync(() => getAvailableMenus());
  const [visibleMenuCount, setVisibleMenuCount] = createSignal(6);
  let loadMoreRef: HTMLDivElement | undefined;

  const featuredStores = createMemo(() => (stores() ?? []).slice(0, 4));
  const visibleMenus = createMemo(() =>
    (menus() ?? []).slice(0, visibleMenuCount()),
  );
  const canLoadMore = createMemo(
    () => visibleMenuCount() < (menus() ?? []).length,
  );

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
            Math.min(count + 4, (menus() ?? []).length),
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
      <div class="space-y-7">
        <section class="relative left-1/2 w-screen -translate-x-1/2 -mt-8 pb-10">
          <div class="relative overflow-hidden bg-gradient-to-br from-primary-700 via-sky-600 to-cyan-500 px-6 pb-12 pt-5 text-white shadow-[0_18px_36px_rgba(15,104,140,0.22)]">
            <div class="absolute -right-6 -top-6 h-24 w-24 rounded-lg bg-white/10 rotate-12" />
            <div class="absolute right-5 top-10 h-16 w-16 rounded-lg bg-white/10" />
            <div class="absolute -bottom-8 left-1/2 h-20 w-20 -translate-x-1/2 rounded-lg bg-white/10 rotate-45" />

            <div class="relative z-10">
              <div class="flex items-start justify-between gap-4">
                <div>
                  <span class="inline-flex rounded-lg bg-white/15 px-3 py-1 text-sm font-semibold text-white">
                    Pemesan
                  </span>
                  <h1 class="mt-4  font-extrabold tracking-[-0.05em] text-white">
                    Halo, {user()?.name}!
                  </h1>
                  <p class="mt-3 max-w-[13rem] text-base leading-7 text-white/90">
                    Temukan toko favorit dan titip makan siang lebih cepat.
                  </p>
                </div>

                <A
                  href="/orders/new"
                  class="inline-flex shrink-0 rounded-lg bg-white/15 px-4 py-2 text-sm font-semibold text-white backdrop-blur"
                >
                  Titip Cepat
                </A>
              </div>

              <div class="mt-6 flex items-center gap-2 text-sm text-white/90">
                <IconMapPin class="h-4 w-4" />
                <span>Rekomendasi untuk area kantor hari ini</span>
              </div>
            </div>
          </div>

          <A
            href="/menus"
            class="absolute inset-x-4 -bottom-1 flex items-center gap-3 rounded-lg border border-white/80 bg-white px-5 py-4 text-slate-500 shadow-[0_14px_28px_rgba(15,68,93,0.12)]"
          >
            <IconSearch class="h-5 w-5 text-slate-400" />
            <span class="text-lg">Cari menu atau tempat makan</span>
          </A>
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
                  Belum ada toko aktif yang bisa ditampilkan.
                </p>
              </div>
            }
          >
            <div class="-mx-2 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [scroll-padding-left:2rem] [scroll-padding-right:2rem]">
              <For each={featuredStores()}>
                {(store) => (
                  <A
                    href="/stores"
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
            <A
              href="/orders/new"
              class="text-base font-semibold text-primary-700"
            >
              Titip
            </A>
          </div>

          <Show
            when={(menus() ?? []).length > 0}
            fallback={
              <div class="tm-card p-7">
                <p class="text-lg text-slate-600">
                  Belum ada menu aktif yang bisa ditampilkan.
                </p>
              </div>
            }
          >
            <div class="grid grid-cols-2 gap-4">
              <For each={visibleMenus()}>
                {(menu) => (
                  <A href="/orders/new" class="tm-card overflow-hidden p-3">
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
                      <span class="absolute left-2 top-2 rounded-lg bg-white/95 px-2 py-1 text-sm font-semibold text-primary-700 shadow-sm">
                        {menu.storeName}
                      </span>
                    </div>

                    <div class="space-y-2">
                      <p class="text-lg font-semibold leading-tight text-slate-900">
                        {menu.name}
                      </p>
                      <p class="text-sm leading-6 text-slate-500">
                        {menu.description ||
                          "Pilihan enak untuk makan siang hari ini."}
                      </p>
                      <div class="flex items-center justify-between gap-3 pt-1">
                        <span class="text-lg font-bold text-primary-700">
                          {formatRupiah(menu.price)}
                        </span>
                        <span class="rounded-lg bg-sky-100 px-3 py-1 text-sm font-semibold text-primary-700">
                          Titip
                        </span>
                      </div>
                    </div>
                  </A>
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
      </div>
    </Suspense>
  );
}

function PembeliHome() {
  const { user } = useUser();
  const todayOrders = createAsync(() => getTodayOrders());
  const recap = createAsync(() => getBuyerRecap());

  const totalBelanja = createMemo(() =>
    (todayOrders() ?? [])
      .filter((order) => order.status !== "cancelled")
      .reduce((sum, order) => sum + order.totalAmount, 0),
  );
  const totalStores = createMemo(() => {
    const names = new Set((recap() ?? []).map((item) => item.storeName));
    return names.size;
  });
  const incomingOrders = createMemo(() =>
    (todayOrders() ?? []).filter((order) => order.status === "submitted"),
  );

  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <div class="space-y-7">
        <section>
          <h1 class="tm-page-title">Halo, {user()?.name}!</h1>
          <div class="mt-4 flex flex-wrap items-center gap-3">
            <span class="tm-chip tm-chip-accent">Pembeli</span>
            <p class="text-lg leading-8 text-primary-700">
              Siap membantu teman kantor hari ini?
            </p>
          </div>
        </section>

        <div class="grid grid-cols-2 gap-5">
          <DashboardStatCard
            icon={<IconShoppingBag class="h-7 w-7" />}
            label="Total Order"
            value={String((todayOrders() ?? []).length)}
          />
          <DashboardStatCard
            icon={<IconWallet class="h-7 w-7" />}
            label="Total Belanja"
            value={formatCompactRupiah(totalBelanja())}
          />
          <div class="tm-card col-span-2 p-7">
            <div class="mb-7 flex h-14 w-14 items-center justify-center rounded-lg bg-sky-100 text-primary-700">
              <IconStore class="h-7 w-7" />
            </div>
            <p class="text-lg text-slate-700">Store Dikunjungi</p>
            <p class="mt-3  font-bold tracking-[-0.05em] text-slate-900">
              {totalStores()}
            </p>
          </div>
        </div>

        <A
          href="/buyer/recap"
          class="btn-primary flex w-full items-center justify-center gap-4"
        >
          <IconReceipt class="h-8 w-8" />
          Lihat Rekap Belanja
        </A>

        <section class="space-y-5">
          <div class="flex items-end justify-between">
            <h2 class=" font-bold tracking-[-0.05em] text-slate-900">
              Titipan Masuk
            </h2>
            <A
              href="/buyer/orders"
              class="text-lg font-semibold text-primary-700"
            >
              Lihat Semua
            </A>
          </div>

          <Show
            when={incomingOrders().length > 0}
            fallback={
              <div class="tm-card p-7">
                <p class="text-lg text-slate-600">
                  Belum ada titipan baru saat ini.
                </p>
              </div>
            }
          >
            <For each={incomingOrders().slice(0, 2)}>
              {(order) => (
                <div class="tm-card p-7">
                  <div class="flex items-start justify-between gap-4">
                    <div class="flex items-start gap-4">
                      <div class="flex h-14 w-14 items-center justify-center rounded-lg bg-slate-200 text-lg font-bold text-primary-700">
                        {order.requesterName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p class=" font-semibold leading-tight tracking-[-0.05em] text-slate-900">
                          {order.requesterName}
                        </p>
                        <p class="text-lg leading-8 text-slate-700">
                          {order.itemSummary}
                        </p>
                      </div>
                    </div>
                    <span class="badge-submitted">Menunggu</span>
                  </div>

                  <div class="tm-divider my-6" />

                  <div class="flex items-center justify-between gap-4">
                    <div>
                      <p class=" text-slate-600">Estimasi Biaya</p>
                      <p class="mt-2  font-bold tracking-[-0.04em] text-slate-900">
                        {formatRupiah(order.totalAmount)}
                      </p>
                    </div>
                    <div class="flex gap-3">
                      <A
                        href={`/orders/${order.id}`}
                        class="btn-outline !min-h-0 px-8 py-4"
                      >
                        Tolak
                      </A>
                      <A
                        href={`/orders/${order.id}`}
                        class="btn-primary !min-h-0 px-8 py-4"
                      >
                        Terima
                      </A>
                    </div>
                  </div>
                </div>
              )}
            </For>
          </Show>
        </section>
      </div>
    </Suspense>
  );
}

function DashboardStatCard(props: {
  icon: JSX.Element;
  label: string;
  value: string;
  caption?: string;
}) {
  return (
    <div class="tm-card p-7">
      <div class="mb-7 flex h-14 w-14 items-center justify-center rounded-lg bg-sky-100 text-primary-700">
        {props.icon}
      </div>
      <p class=" text-slate-700">{props.label}</p>
      <p class="mt-3  font-bold tracking-[-0.06em] text-slate-900">
        {props.value}
      </p>
      <Show when={props.caption}>
        <p class="mt-2 text-lg text-primary-700">{props.caption}</p>
      </Show>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div class="space-y-5">
      <div class="h-20 animate-pulse rounded-lg bg-white/80" />
      <div class="grid grid-cols-2 gap-5">
        <div class="h-44 animate-pulse rounded-lg bg-white/80" />
        <div class="h-44 animate-pulse rounded-lg bg-white/80" />
      </div>
      <div class="h-28 animate-pulse rounded-lg bg-white/80" />
      <div class="h-64 animate-pulse rounded-lg bg-white/80" />
    </div>
  );
}
