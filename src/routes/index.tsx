import { Show } from "solid-js";
import { A } from "@solidjs/router";
import { Title } from "@solidjs/meta";
import Layout from "~/components/Layout";
import RoleGuard from "~/components/RoleGuard";
import { useUser } from "~/lib/user-context";
import { formatDate, todayString } from "~/lib/utils";

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
      <Layout title="Titip Makan">
        {/* Greeting */}
        <div class="card mb-4 bg-gradient-to-r from-primary-500 to-primary-600 p-5 text-white">
          <p class="text-sm opacity-80">{today}</p>
          <h2 class="mt-1 text-xl font-bold">
            Halo, {user()?.name}! 👋
          </h2>
          <p class="mt-1 text-sm opacity-90">
            {user()?.role === "pemesan"
              ? "Mau nitip beli makan siang hari ini?"
              : "Mau belikan teman-teman makan siang?"}
          </p>
        </div>

        {/* Pemesan quick links */}
        <Show when={user()?.role === "pemesan"}>
          <div class="space-y-3">
            <h3 class="text-sm font-semibold uppercase tracking-wide text-gray-500">
              Menu Cepat
            </h3>
            <div class="grid grid-cols-2 gap-3">
              <A href="/orders/new" class="card flex flex-col items-center gap-2 p-4 hover:shadow-md active:scale-95 transition-all">
                <span class="text-3xl">🛒</span>
                <span class="text-sm font-semibold text-gray-700">Order Baru</span>
                <span class="text-xs text-gray-400">Titip beli sekarang</span>
              </A>
              <A href="/my-orders" class="card flex flex-col items-center gap-2 p-4 hover:shadow-md active:scale-95 transition-all">
                <span class="text-3xl">📋</span>
                <span class="text-sm font-semibold text-gray-700">Pesananku</span>
                <span class="text-xs text-gray-400">Lihat status pesanan</span>
              </A>
              <A href="/stores" class="card flex flex-col items-center gap-2 p-4 hover:shadow-md active:scale-95 transition-all">
                <span class="text-3xl">🏪</span>
                <span class="text-sm font-semibold text-gray-700">Daftar Toko</span>
                <span class="text-xs text-gray-400">Pilih tempat makan</span>
              </A>
              <A href="/menus" class="card flex flex-col items-center gap-2 p-4 hover:shadow-md active:scale-95 transition-all">
                <span class="text-3xl">🍽️</span>
                <span class="text-sm font-semibold text-gray-700">Menu</span>
                <span class="text-xs text-gray-400">Lihat semua menu</span>
              </A>
            </div>
          </div>
        </Show>

        {/* Pembeli quick links */}
        <Show when={user()?.role === "pembeli"}>
          <div class="space-y-3">
            <h3 class="text-sm font-semibold uppercase tracking-wide text-gray-500">
              Menu Cepat
            </h3>
            <div class="grid grid-cols-2 gap-3">
              <A href="/buyer/orders" class="card flex flex-col items-center gap-2 p-4 hover:shadow-md active:scale-95 transition-all">
                <span class="text-3xl">📦</span>
                <span class="text-sm font-semibold text-gray-700">Semua Order</span>
                <span class="text-xs text-gray-400">Order hari ini</span>
              </A>
              <A href="/buyer/recap" class="card flex flex-col items-center gap-2 p-4 hover:shadow-md active:scale-95 transition-all">
                <span class="text-3xl">📊</span>
                <span class="text-sm font-semibold text-gray-700">Rekap Belanja</span>
                <span class="text-xs text-gray-400">Per toko & menu</span>
              </A>
              <A href="/buyer/settlement" class="card flex flex-col items-center gap-2 p-4 hover:shadow-md active:scale-95 transition-all">
                <span class="text-3xl">💰</span>
                <span class="text-sm font-semibold text-gray-700">Tagihan</span>
                <span class="text-xs text-gray-400">Per pemesan</span>
              </A>
              <A href="/menus" class="card flex flex-col items-center gap-2 p-4 hover:shadow-md active:scale-95 transition-all">
                <span class="text-3xl">🍽️</span>
                <span class="text-sm font-semibold text-gray-700">Kelola Menu</span>
                <span class="text-xs text-gray-400">Toko & menu</span>
              </A>
            </div>
          </div>
        </Show>
      </Layout>
    </>
  );
}
