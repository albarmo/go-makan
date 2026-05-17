import { Title } from "@solidjs/meta";
import { A, createAsync, useNavigate, useParams } from "@solidjs/router";
import {
  ArrowRight as IconArrowRight,
  MapPin as IconMapPin,
  Minus as IconMinus,
  Phone as IconPhone,
  Plus as IconPlus,
  Receipt as IconReceipt,
  Store as IconStore,
} from "lucide-solid";
import { For, Show, Suspense } from "solid-js";
import Layout from "~/components/Layout";
import RoleGuard from "~/components/RoleGuard";
import { useOrderDraft } from "~/lib/order-draft-context";
import { useUser } from "~/lib/user-context";
import { formatRupiah } from "~/lib/utils";
import { getMenusByStore } from "~/server/menus";
import { getStoreById } from "~/server/stores";

export const route = {
  load: ({ params }: { params: { id: string } }) =>
    getStoreById(parseInt(params.id)),
};

export default function StoreDetailPage() {
  return (
    <RoleGuard>
      <StoreDetailContent />
    </RoleGuard>
  );
}

function StoreDetailContent() {
  const params = useParams<{ id: string }>();
  const { user } = useUser();
  const draft = useOrderDraft();
  const navigate = useNavigate();
  const store = createAsync(() => getStoreById(parseInt(params.id)));
  const menus = createAsync(() => getMenusByStore(parseInt(params.id)));
  const currentStoreId = () => parseInt(params.id);
  const storeDraftItems = () =>
    draft.items().filter((item) => item.storeId === currentStoreId());
  const storeDraftQuantity = () =>
    storeDraftItems().reduce((sum, item) => sum + item.quantity, 0);
  const storeDraftAmount = () =>
    storeDraftItems().reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <>
      <Title>Detail Toko - Titip Makan</Title>
      <Layout title="Detail Toko" showBack noBottomNav>
        <Suspense fallback={<StoreDetailSkeleton />}>
          <Show
            when={store()}
            fallback={
              <div class="tm-card p-8">
                <p class="text-slate-600">Toko tidak ditemukan.</p>
              </div>
            }
          >
            {(currentStore) => (
              <section class="space-y-6">
                <div class="tm-card overflow-hidden">
                  <div class="relative h-56 bg-slate-200">
                    <Show
                      when={currentStore().imageUrl}
                      fallback={
                        <div class="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-200 via-slate-100 to-sky-100 text-primary-700">
                          <IconStore class="h-14 w-14" />
                        </div>
                      }
                    >
                      <img
                        src={currentStore().imageUrl!}
                        alt={currentStore().name}
                        class="h-full w-full object-cover"
                      />
                    </Show>

                    <span
                      class={`absolute right-4 top-4 rounded-lg px-4 py-2 text-sm font-semibold shadow-sm ${
                        currentStore().isActive
                          ? "bg-white text-emerald-600"
                          : "bg-white text-red-500"
                      }`}
                    >
                      {currentStore().isActive ? "Buka" : "Tutup"}
                    </span>
                  </div>

                  <div class="space-y-5 p-6">
                    <div>
                      <h1 class="tm-page-title">{currentStore().name}</h1>
                      <p class="mt-3 text-base leading-7 text-slate-600">
                        {currentStore().description ||
                          "Pilihan tempat makan favorit untuk kebutuhan makan siang kantor."}
                      </p>
                    </div>

                    <div class="space-y-4">
                      <div class="flex items-start gap-3 text-base text-slate-600">
                        <IconMapPin class="mt-0.5 h-5 w-5 shrink-0 text-primary-700" />
                        <span>
                          {currentStore().address || "Alamat belum ditambahkan"}
                        </span>
                      </div>

                      <Show when={currentStore().phone}>
                        <div class="flex items-start gap-3 text-base text-slate-600">
                          <IconPhone class="mt-0.5 h-5 w-5 shrink-0 text-primary-700" />
                          <span>{currentStore().phone}</span>
                        </div>
                      </Show>
                    </div>

                    <Show when={user()?.role === "pemesan"}>
                      <div class="rounded-lg bg-slate-50 px-4 py-4">
                        <p class="text-sm text-slate-500">
                          Pilih menu langsung dari toko ini
                        </p>
                        <p class="mt-2 text-base text-slate-700">
                          Tambahkan item ke draft, lalu lanjut checkout saat
                          sudah siap.
                        </p>
                      </div>
                    </Show>
                  </div>
                </div>

                <section class="space-y-4">
                  <div class="flex items-end justify-between gap-4">
                    <div>
                      <h2 class="font-bold tracking-[-0.05em] text-slate-900">
                        Menu Tersedia
                      </h2>
                      <p class="mt-1 text-base text-slate-500">
                        Daftar menu aktif dari toko ini.
                      </p>
                    </div>
                    <div class="flex h-11 w-11 items-center justify-center rounded-lg bg-sky-100 text-primary-700">
                      <IconReceipt class="h-5 w-5" />
                    </div>
                  </div>

                  <Show
                    when={(menus() ?? []).length > 0}
                    fallback={
                      <div class="tm-card p-6">
                        <p class="text-base leading-7 text-slate-600">
                          Belum ada menu aktif untuk toko ini.
                        </p>
                      </div>
                    }
                  >
                    <div class="space-y-4">
                      <For each={menus()}>
                        {(menu) => (
                          <div
                            class="tm-card overflow-hidden p-4 cursor-pointer"
                            onClick={() => void navigate(`/menus/${menu.id}`)}
                          >
                            <div class="flex gap-4">
                              <div class="h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                                <Show
                                  when={menu.imageUrl}
                                  fallback={
                                    <div class="flex h-full w-full items-center justify-center bg-gradient-to-br from-sky-100 via-cyan-50 to-slate-100 px-2 text-center text-sm font-semibold text-primary-700">
                                      {menu.name.split(" ").slice(0, 2).join(" ")}
                                    </div>
                                  }
                                >
                                  <img
                                    src={menu.imageUrl!}
                                    alt={menu.name}
                                    class="h-full w-full object-cover"
                                  />
                                </Show>
                              </div>

                              <div class="min-w-0 flex-1">
                                <div class="flex items-start justify-between gap-3">
                                  <div>
                                    <p class="text-lg font-semibold leading-tight text-slate-900">
                                      {menu.name}
                                    </p>
                                    <p class="mt-2 text-sm leading-6 text-slate-500">
                                      {menu.description ||
                                        "Menu favorit yang siap dipesan hari ini."}
                                    </p>
                                  </div>
                                  <span class="badge-submitted">Tersedia</span>
                                </div>

                                <div class="mt-4 flex items-center justify-between gap-3">
                                  <p class="text-lg font-bold text-primary-700">
                                    {formatRupiah(menu.price)}
                                  </p>
                                  <Show when={user()?.role === "pemesan"}>
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
                                                storeName:
                                                  menu.storeName ??
                                                  currentStore().name,
                                                name: menu.name,
                                                price: menu.price,
                                              },
                                              (draft.getItem(menu.id)?.quantity ??
                                                0) - 1,
                                            );
                                          }}
                                          class="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-700"
                                        >
                                          <IconMinus class="h-4 w-4" />
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
                                              storeName:
                                                menu.storeName ??
                                                currentStore().name,
                                              name: menu.name,
                                              price: menu.price,
                                            },
                                            (draft.getItem(menu.id)?.quantity ??
                                              0) + 1,
                                          );
                                        }}
                                        class="flex h-10 items-center justify-center gap-2 rounded-lg bg-sky-100 px-4 text-sm font-semibold text-primary-700"
                                      >
                                        <IconPlus class="h-4 w-4" />
                                        Pilih
                                      </button>
                                    </div>
                                  </Show>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </For>
                    </div>
                  </Show>
                </section>
              </section>
            )}
          </Show>
        </Suspense>

        <Show when={user()?.role === "pemesan" && storeDraftItems().length > 0}>
          <div class="tm-bottom-nav !border-t-slate-200">
            <div class="mx-auto max-w-[30rem] px-6 pb-6 pt-4">
              <A
                href="/orders/new"
                class="tm-card flex items-center justify-between gap-4 bg-white px-5 py-4"
              >
                <div class="min-w-0">
                  <p class="text-sm text-slate-500">
                    {storeDraftQuantity()} item dari {store()?.name}
                  </p>
                  <p class="mt-1 text-base font-semibold text-slate-900">
                    Lanjutkan checkout
                  </p>
                </div>
                <div class="flex items-center gap-3">
                  <div class="text-right">
                    <p class="text-base font-bold text-primary-700">
                      {formatRupiah(storeDraftAmount())}
                    </p>
                    <p class="mt-1 text-sm font-semibold text-primary-700">
                      Buka draft
                    </p>
                  </div>
                  <IconArrowRight class="h-5 w-5 text-primary-700" />
                </div>
              </A>
            </div>
          </div>
        </Show>
      </Layout>
    </>
  );
}

function StoreDetailSkeleton() {
  return (
    <div class="space-y-6">
      <div class="h-80 animate-pulse rounded-lg bg-white/80" />
      <div class="h-56 animate-pulse rounded-lg bg-white/80" />
    </div>
  );
}
