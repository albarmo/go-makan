import { Title } from "@solidjs/meta";
import { A, createAsync, useParams } from "@solidjs/router";
import {
  ArrowRight as IconArrowRight,
  MapPin as IconMapPin,
  Minus as IconMinus,
  Phone as IconPhone,
  Plus as IconPlus,
  Store as IconStore,
} from "lucide-solid";
import { Show, Suspense } from "solid-js";
import Layout from "~/components/Layout";
import RoleGuard from "~/components/RoleGuard";
import { useOrderDraft } from "~/lib/order-draft-context";
import { useUser } from "~/lib/user-context";
import { formatRupiah } from "~/lib/utils";
import { getMenuById } from "~/server/menus";

export const route = {
  load: ({ params }: { params: { id: string } }) =>
    getMenuById(parseInt(params.id)),
};

export default function MenuDetailPage() {
  return (
    <RoleGuard>
      <MenuDetailContent />
    </RoleGuard>
  );
}

function MenuDetailContent() {
  const params = useParams<{ id: string }>();
  const { user } = useUser();
  const draft = useOrderDraft();
  const menu = createAsync(() => getMenuById(parseInt(params.id)));

  const currentDraftItem = () => {
    const currentMenu = menu();
    if (!currentMenu) return undefined;
    return draft.getItem(currentMenu.id);
  };

  const setMenuQuantity = (quantity: number) => {
    const currentMenu = menu();
    if (!currentMenu) return;

    draft.setQuantity(
      {
        id: currentMenu.id,
        storeId: currentMenu.storeId,
        storeName: currentMenu.storeName,
        name: currentMenu.name,
        price: currentMenu.price,
      },
      quantity,
    );
  };

  return (
    <>
      <Title>Detail Menu - Titip Makan</Title>
      <Layout title="Detail Menu" showBack>
        <Suspense fallback={<MenuDetailSkeleton />}>
          <Show
            when={menu()}
            fallback={
              <div class="rounded-lg bg-white px-8 py-8 shadow-sm">
                <p class="text-slate-600">Menu tidak ditemukan.</p>
              </div>
            }
          >
            {(currentMenu) => (
              <section class="space-y-8 pb-8">
                <div class="relative left-1/2 w-screen -translate-x-1/2 overflow-hidden bg-slate-200">
                  <div class="relative h-[19rem]">
                    <Show
                      when={currentMenu().imageUrl}
                      fallback={
                        <div class="flex h-full w-full items-center justify-center bg-gradient-to-br from-sky-100 via-cyan-50 to-slate-100 text-primary-700">
                          <IconStore class="h-16 w-16" />
                        </div>
                      }
                    >
                      <img
                        src={currentMenu().imageUrl!}
                        alt={currentMenu().name}
                        class="h-full w-full object-cover"
                      />
                    </Show>

                    <div class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/65 via-slate-900/25 to-transparent px-6 pb-6 pt-16 text-white">
                      <div class="mx-auto max-w-[30rem]">
                        <div class="flex items-center justify-between gap-4">
                          <div>
                            <span class="inline-flex rounded-lg bg-white/15 px-3 py-1 text-sm font-semibold text-white backdrop-blur">
                              {currentMenu().storeName}
                            </span>
                            <h1 class="mt-3 font-bold leading-tight tracking-[-0.05em] text-white">
                              {currentMenu().name}
                            </h1>
                          </div>
                          <span
                            class={`rounded-lg px-4 py-2 text-sm font-semibold shadow-sm ${
                              currentMenu().isAvailable
                                ? "bg-white text-emerald-600"
                                : "bg-white text-red-500"
                            }`}
                          >
                            {currentMenu().isAvailable ? "Tersedia" : "Habis"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="space-y-6">
                  <div class="flex items-end justify-between gap-4 border-b border-slate-200 pb-5">
                    <div>
                      <p class="text-sm uppercase tracking-[0.12em] text-slate-500">
                        Harga
                      </p>
                      <p class="mt-2 text-xl font-bold tracking-[-0.05em] text-primary-700">
                        {formatRupiah(currentMenu().price)}
                      </p>
                    </div>
                    <Show when={currentDraftItem()}>
                      <p class="text-sm font-semibold text-slate-500">
                        Sudah dipilih {currentDraftItem()?.quantity} item
                      </p>
                    </Show>
                  </div>

                  <section class="space-y-3">
                    <p class="text-sm uppercase tracking-[0.12em] text-slate-500">
                      Tentang Menu
                    </p>
                    <p class="text-base leading-8 text-slate-700">
                      {currentMenu().description ||
                        "Pilihan menu yang siap dipesan untuk makan siang hari ini."}
                    </p>
                  </section>

                  <section class="space-y-4 border-t border-slate-200 pt-6">
                    <p class="text-sm uppercase tracking-[0.12em] text-slate-500">
                      Toko Asal
                    </p>
                    <A
                      href={`/stores/${currentMenu().storeId}`}
                      class="inline-flex items-center gap-3 text-base font-semibold text-primary-700"
                    >
                      <IconStore class="h-5 w-5" />
                      {currentMenu().storeName}
                    </A>

                    <div class="space-y-3 text-sm text-slate-600">
                      <div class="flex items-start gap-3">
                        <IconMapPin class="mt-0.5 h-4 w-4 shrink-0 text-primary-700" />
                        <span>
                          {currentMenu().storeAddress ||
                            "Alamat toko belum ditambahkan"}
                        </span>
                      </div>
                      <Show when={currentMenu().storePhone}>
                        <div class="flex items-start gap-3">
                          <IconPhone class="mt-0.5 h-4 w-4 shrink-0 text-primary-700" />
                          <span>{currentMenu().storePhone}</span>
                        </div>
                      </Show>
                    </div>
                  </section>

                  <Show when={user()?.role === "pemesan" && currentMenu().isAvailable}>
                    <section class="space-y-4 border-t border-slate-200 pt-6">
                      <div class="flex items-center justify-between gap-4">
                        <div>
                          <p class="text-sm uppercase tracking-[0.12em] text-slate-500">
                            Atur Jumlah
                          </p>
                          <p class="mt-2 text-base text-slate-700">
                            Tambahkan menu ke draft ordermu langsung dari sini.
                          </p>
                        </div>
                        <div class="flex items-center gap-3 rounded-lg bg-white px-3 py-3 shadow-[0_8px_24px_rgba(15,68,93,0.08)]">
                          <button
                            type="button"
                            onClick={() =>
                              setMenuQuantity(
                                (currentDraftItem()?.quantity ?? 0) - 1,
                              )
                            }
                            class="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-700"
                          >
                            <IconMinus class="h-4 w-4" />
                          </button>
                          <span class="min-w-8 text-center text-base font-semibold text-slate-900">
                            {currentDraftItem()?.quantity ?? 0}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setMenuQuantity(
                                (currentDraftItem()?.quantity ?? 0) + 1,
                              )
                            }
                            class="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-100 text-primary-700"
                          >
                            <IconPlus class="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      <Show
                        when={(currentDraftItem()?.quantity ?? 0) > 0}
                        fallback={
                          <button
                            type="button"
                            onClick={() => setMenuQuantity(1)}
                            class="btn-primary w-full gap-3"
                          >
                            <IconPlus class="h-5 w-5" />
                            Tambah ke Draft
                          </button>
                        }
                      >
                        <div class="rounded-lg bg-gradient-to-r from-sky-50 via-white to-cyan-50 px-5 py-5 shadow-[0_10px_28px_rgba(15,68,93,0.08)]">
                          <div class="flex items-center justify-between gap-4">
                            <div class="min-w-0">
                              <p class="text-sm text-slate-500">
                                {(currentDraftItem()?.quantity ?? 0)} item dari{" "}
                                {currentMenu().storeName}
                              </p>
                              <p class="mt-1 text-base font-semibold text-slate-900">
                                Siap lanjut ke checkout
                              </p>
                            </div>
                            <div class="text-right">
                              <p class="text-base font-bold text-primary-700">
                                {formatRupiah(
                                  (currentDraftItem()?.quantity ?? 0) *
                                    currentMenu().price,
                                )}
                              </p>
                            </div>
                          </div>

                          <A
                            href="/orders/new"
                            class="btn-primary mt-4 flex w-full items-center justify-center gap-3"
                          >
                            Lanjutkan Checkout
                            <IconArrowRight class="h-5 w-5" />
                          </A>
                        </div>
                      </Show>
                    </section>
                  </Show>
                </div>
              </section>
            )}
          </Show>
        </Suspense>
      </Layout>
    </>
  );
}

function MenuDetailSkeleton() {
  return (
    <div class="space-y-6">
      <div class="h-80 animate-pulse rounded-lg bg-white/80" />
      <div class="h-56 animate-pulse rounded-lg bg-white/80" />
    </div>
  );
}
