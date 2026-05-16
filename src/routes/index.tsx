import { Show } from "solid-js";
import { A } from "@solidjs/router";
import { Title } from "@solidjs/meta";
import Layout from "~/components/Layout";
import RoleGuard from "~/components/RoleGuard";
import { useUser } from "~/lib/user-context";
import { formatDate, todayString } from "~/lib/utils";
import { IconArrowRight, IconShoppingBag, IconList, IconChart, IconWallet } from "~/components/icons";

export default function HomePage() {
  return (
    <RoleGuard>
      <HomeContent />
    </RoleGuard>
  );
}

function HomeContent() {
  const { user } = useUser();
  const today = formatDate(todayString());

  return (
    <>
      <Title>Beranda - Titip Makan</Title>
      <Layout title="Titip Makan" showUser>
        {/* Greeting banner */}
        <div class="-mx-4 -mt-4 mb-5 bg-primary-700 px-4 pb-6 pt-3">
          <p class="text-xs text-primary-300">{today}</p>
          <h2 class="mt-1 text-xl font-bold text-white">
            Halo, {user()?.name}! 👋
          </h2>
          <div class="mt-1 inline-flex items-center rounded-full bg-white/20 px-2.5 py-0.5">
            <span class="text-xs font-medium text-white">
              {user()?.role === "pemesan" ? "Yang Nitip 🙋" : "Yang Belikan 🛍️"}
            </span>
          </div>
        </div>

        {/* Pemesan quick links */}
        <Show when={user()?.role === "pemesan"}>
          <div class="space-y-3">
            {/* Primary CTA */}
            <A
              href="/orders/new"
              class="card flex items-center gap-4 p-4 bg-primary-600 border-primary-600 hover:bg-primary-700 active:scale-[0.98] transition-all"
            >
              <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/20">
                <IconShoppingBag class="h-6 w-6 text-white" />
              </div>
              <div class="flex-1">
                <p class="font-bold text-white">Titip Makan Sekarang</p>
                <p class="text-xs text-primary-200">Pilih toko dan menu kesukaanmu</p>
              </div>
              <IconArrowRight class="h-5 w-5 text-white/70" />
            </A>

            {/* Secondary links */}
            <div class="grid grid-cols-3 gap-3">
              <A
                href="/my-orders"
                class="card flex flex-col items-center gap-2 p-4 hover:shadow-md active:scale-95 transition-all"
              >
                <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50">
                  <IconList class="h-5 w-5 text-primary-600" />
                </div>
                <p class="text-center text-xs font-semibold text-gray-700">Pesananku</p>
              </A>
              <A
                href="/stores"
                class="card flex flex-col items-center gap-2 p-4 hover:shadow-md active:scale-95 transition-all"
              >
                <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50">
                  <span class="text-xl">🏪</span>
                </div>
                <p class="text-center text-xs font-semibold text-gray-700">Toko</p>
              </A>
              <A
                href="/menus"
                class="card flex flex-col items-center gap-2 p-4 hover:shadow-md active:scale-95 transition-all"
              >
                <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50">
                  <span class="text-xl">🍽️</span>
                </div>
                <p class="text-center text-xs font-semibold text-gray-700">Menu</p>
              </A>
            </div>
          </div>
        </Show>

        {/* Pembeli quick links */}
        <Show when={user()?.role === "pembeli"}>
          <div class="space-y-3">
            {/* Primary CTA */}
            <A
              href="/buyer/orders"
              class="card flex items-center gap-4 p-4 bg-primary-600 border-primary-600 hover:bg-primary-700 active:scale-[0.98] transition-all"
            >
              <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/20">
                <span class="text-2xl">📦</span>
              </div>
              <div class="flex-1">
                <p class="font-bold text-white">Lihat Titipan Masuk</p>
                <p class="text-xs text-primary-200">Cek semua order hari ini</p>
              </div>
              <IconArrowRight class="h-5 w-5 text-white/70" />
            </A>

            {/* Stats grid */}
            <div class="grid grid-cols-3 gap-3">
              <A
                href="/buyer/recap"
                class="card flex flex-col items-center gap-2 p-4 hover:shadow-md active:scale-95 transition-all"
              >
                <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50">
                  <IconChart class="h-5 w-5 text-primary-600" />
                </div>
                <p class="text-center text-xs font-semibold text-gray-700">Rekap</p>
              </A>
              <A
                href="/buyer/settlement"
                class="card flex flex-col items-center gap-2 p-4 hover:shadow-md active:scale-95 transition-all"
              >
                <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50">
                  <IconWallet class="h-5 w-5 text-emerald-600" />
                </div>
                <p class="text-center text-xs font-semibold text-gray-700">Tagihan</p>
              </A>
              <A
                href="/menus"
                class="card flex flex-col items-center gap-2 p-4 hover:shadow-md active:scale-95 transition-all"
              >
                <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50">
                  <span class="text-xl">🍽️</span>
                </div>
                <p class="text-center text-xs font-semibold text-gray-700">Menu</p>
              </A>
            </div>

            <A
              href="/stores"
              class="card flex items-center justify-between p-4 hover:shadow-md active:scale-[0.98] transition-all"
            >
              <div class="flex items-center gap-3">
                <span class="text-xl">🏪</span>
                <div>
                  <p class="font-semibold text-gray-800">Kelola Toko & Menu</p>
                  <p class="text-xs text-gray-400">Tambah atau ubah data toko</p>
                </div>
              </div>
              <IconArrowRight class="h-4 w-4 text-gray-400" />
            </A>
          </div>
        </Show>
      </Layout>
    </>
  );
}
