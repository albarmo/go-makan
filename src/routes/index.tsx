import { Title } from "@solidjs/meta";
import { A, createAsync } from "@solidjs/router";
import { createMemo, For, Show, Suspense } from "solid-js";
import Layout from "~/components/Layout";
import RoleGuard from "~/components/RoleGuard";
import {
  IconClock,
  IconReceipt,
  IconShoppingBag,
  IconStore,
  IconWallet,
} from "~/components/icons";
import { useUser } from "~/lib/user-context";
import {
  formatCompactRupiah,
  formatRelativeOrderTime,
  formatRupiah,
  statusLabel,
} from "~/lib/utils";
import { getBuyerRecap, getMyOrders, getTodayOrders } from "~/server/orders";

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
      <Layout title="Titip Makan" showUser>
        <Show when={user()?.role === "pembeli"} fallback={<PemesanHome />}>
          <PembeliHome />
        </Show>
      </Layout>
    </>
  );
}

function PemesanHome() {
  const { user } = useUser();
  const myOrders = createAsync(() => getMyOrders(user()?.name ?? ""));

  const totalBelanja = createMemo(() =>
    (myOrders() ?? [])
      .filter((order) => order.status !== "cancelled")
      .reduce((sum, order) => sum + order.totalAmount, 0),
  );
  const latestOrder = createMemo(() => (myOrders() ?? [])[0]);

  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <div class="space-y-7">
        <section>
          <h1 class="tm-page-title">Halo, {user()?.name}!</h1>
          <div class="mt-4 flex flex-wrap items-center gap-3">
            <span class="tm-chip tm-chip-accent">Pemesan</span>
            <p class="text-lg leading-8 text-primary-700">
              Siap untuk makan enak hari ini?
            </p>
          </div>
        </section>

        <A href="/role" class="btn-accent inline-flex gap-3 text-lg">
          Ganti Role
        </A>

        <div class="space-y-5">
          <DashboardStatCard
            icon={<IconReceipt class="h-7 w-7" />}
            label="Order Hari Ini"
            value={String((myOrders() ?? []).length)}
          />
          <DashboardStatCard
            icon={<IconWallet class="h-7 w-7" />}
            label="Total Titipan"
            value={formatRupiah(totalBelanja())}
          />
          <DashboardStatCard
            icon={<IconClock class="h-7 w-7" />}
            label="Status Terakhir"
            value={
              latestOrder() ? statusLabel(latestOrder()!.status) : "Belum Ada"
            }
            caption={
              latestOrder()
                ? `Estimasi: ${formatRelativeOrderTime(latestOrder()!.createdAt)}`
                : undefined
            }
          />
        </div>

        <A
          href="/orders/new"
          class="btn-primary flex w-full items-center justify-center gap-4 text-xl"
        >
          <span class="text-xl leading-none">+</span>
          Titip Makan Sekarang
        </A>

        <section class="space-y-5">
          <div class="flex items-end justify-between">
            <h2 class="text-xl font-bold tracking-[-0.05em] text-slate-900">
              Order Saya Hari Ini
            </h2>
            <A href="/my-orders" class="text-lg font-semibold text-primary-700">
              Lihat Semua
            </A>
          </div>

          <Show
            when={latestOrder()}
            fallback={
              <div class="tm-card p-7">
                <p class="text-lg text-slate-600">
                  Belum ada pesanan hari ini.
                </p>
              </div>
            }
          >
            {(order) => (
              <A href={`/orders/${order().id}`} class="tm-card block p-7">
                <div class="mb-5 flex items-start justify-between gap-4">
                  <div>
                    <p class="text-lg font-semibold leading-tight tracking-[-0.05em] text-slate-900">
                      {order().storeName}
                    </p>
                    <p class="mt-3 text-lg text-primary-700">
                      Dititipkan ke: {order().buyerName ?? "Menunggu pembeli"}
                    </p>
                  </div>
                  <span
                    class={
                      order().status === "purchased"
                        ? "badge-purchased"
                        : order().status === "cancelled"
                          ? "badge-cancelled"
                          : "badge-submitted"
                    }
                  >
                    {statusLabel(order().status)}
                  </span>
                </div>

                <div class="tm-divider mb-5" />

                <p class="mb-4 text-lg leading-8 text-slate-800">
                  {order().itemSummary}
                </p>

                <div class="tm-divider mb-5" />

                <div class="flex items-center justify-between">
                  <p class="text-xl font-semibold text-primary-700">
                    Total Biaya (Inc. Fee)
                  </p>
                  <p class="text-xl font-bold tracking-[-0.05em] text-primary-700">
                    {formatRupiah(order().totalAmount)}
                  </p>
                </div>
              </A>
            )}
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
            <div class="mb-7 flex h-14 w-14 items-center justify-center rounded-full bg-sky-100 text-primary-700">
              <IconStore class="h-7 w-7" />
            </div>
            <p class="text-lg text-slate-700">Store Dikunjungi</p>
            <p class="mt-3 text-xl font-bold tracking-[-0.05em] text-slate-900">
              {totalStores()}
            </p>
          </div>
        </div>

        <A
          href="/buyer/recap"
          class="btn-primary flex w-full items-center justify-center gap-4 text-lg"
        >
          <IconReceipt class="h-8 w-8" />
          Lihat Rekap Belanja
        </A>

        <section class="space-y-5">
          <div class="flex items-end justify-between">
            <h2 class="text-xl font-bold tracking-[-0.05em] text-slate-900">
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
                      <div class="flex h-14 w-14 items-center justify-center rounded-full bg-slate-200 text-lg font-bold text-primary-700">
                        {order.requesterName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p class="text-xl font-semibold leading-tight tracking-[-0.05em] text-slate-900">
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
                      <p class="text-xl text-slate-600">
                        Estimasi Biaya
                      </p>
                      <p class="mt-2 text-xl font-bold tracking-[-0.04em] text-slate-900">
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
      <div class="mb-7 flex h-14 w-14 items-center justify-center rounded-full bg-sky-100 text-primary-700">
        {props.icon}
      </div>
      <p class="text-xl text-slate-700">{props.label}</p>
      <p class="mt-3 text-xl font-bold tracking-[-0.06em] text-slate-900">
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
      <div class="h-20 animate-pulse rounded-[2rem] bg-white/80" />
      <div class="grid grid-cols-2 gap-5">
        <div class="h-44 animate-pulse rounded-[2rem] bg-white/80" />
        <div class="h-44 animate-pulse rounded-[2rem] bg-white/80" />
      </div>
      <div class="h-28 animate-pulse rounded-[2rem] bg-white/80" />
      <div class="h-64 animate-pulse rounded-[2rem] bg-white/80" />
    </div>
  );
}
