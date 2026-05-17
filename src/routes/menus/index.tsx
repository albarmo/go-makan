import { Title } from "@solidjs/meta";
import { A, createAsync, useNavigate } from "@solidjs/router";
import { Plus as IconPlus, Search as IconSearch } from "lucide-solid";
import { createSignal, For, Show, Suspense } from "solid-js";
import Layout from "~/components/Layout";
import RoleGuard from "~/components/RoleGuard";
import { useOrderDraft } from "~/lib/order-draft-context";
import { formatRupiah } from "~/lib/utils";
import { getMenus } from "~/server/menus";

export const route = {
  load: () => getMenus(),
};

export default function MenusPage() {
  return (
    <RoleGuard>
      <MenusContent />
    </RoleGuard>
  );
}

function MenusContent() {
  const navigate = useNavigate();
  const draft = useOrderDraft();
  const menus = createAsync(() => getMenus());
  const [search, setSearch] = createSignal("");
  const [selectedStore, setSelectedStore] = createSignal("all");

  const storeOptions = () =>
    Array.from(new Set((menus() ?? []).map((menu) => menu.storeName)));

  const filteredMenus = () => {
    const query = search().toLowerCase();
    return (menus() ?? [])
      .filter(
        (menu) =>
          selectedStore() === "all" || menu.storeName === selectedStore(),
      )
      .filter(
        (menu) =>
          !query ||
          menu.name.toLowerCase().includes(query) ||
          menu.storeName.toLowerCase().includes(query),
      );
  };

  return (
    <>
      <Title>Menu - Titip Makan</Title>
      <Layout title="Titip Makan">
        <section class="space-y-6">
          <h1 class="tm-page-title">Menu</h1>

          <div class="relative">
            <IconSearch class="pointer-events-none absolute left-5 top-1/2 h-6 w-6 -translate-y-1/2 text-primary-700" />
            <input
              type="search"
              class="input pl-16 "
              placeholder="Cari makanan..."
              value={search()}
              onInput={(e) => setSearch(e.currentTarget.value)}
            />
          </div>

          <div class="flex gap-3 overflow-x-auto pb-1">
            <StorePill
              label="Semua"
              active={selectedStore() === "all"}
              onClick={() => setSelectedStore("all")}
            />
            <For each={storeOptions()}>
              {(storeName) => (
                <StorePill
                  label={storeName}
                  active={selectedStore() === storeName}
                  onClick={() => setSelectedStore(storeName)}
                />
              )}
            </For>
          </div>

          <Suspense fallback={<MenuSkeleton />}>
            <Show
              when={filteredMenus().length > 0}
              fallback={
                <div class="tm-card p-8">
                  <p class=" text-slate-600">
                    Menu belum tersedia untuk filter ini.
                  </p>
                </div>
              }
            >
              <div class="space-y-6">
                <For each={filteredMenus()}>
                  {(menu) => (
                    <div
                      class="tm-card overflow-hidden p-7 cursor-pointer"
                      onClick={() => void navigate(`/menus/${menu.id}`)}
                    >
                      <Show
                        when={menu.imageUrl}
                        fallback={
                          <div class="mb-5 h-48 rounded-lg bg-gradient-to-br from-slate-100 via-slate-200 to-slate-100" />
                        }
                      >
                        <img
                          src={menu.imageUrl!}
                          alt={menu.name}
                          class="mb-5 h-48 w-full rounded-lg object-cover"
                        />
                      </Show>
                      <div class="mb-4 flex items-start justify-between gap-4">
                        <div>
                          <p class=" font-semibold leading-tight tracking-[-0.05em] text-slate-900">
                            {menu.name}
                          </p>
                          <p class="mt-2  text-primary-700">{menu.storeName}</p>
                        </div>
                        <span
                          class={
                            menu.isAvailable
                              ? "badge-submitted"
                              : "badge-cancelled"
                          }
                        >
                          {menu.isAvailable ? "Tersedia" : "Habis"}
                        </span>
                      </div>

                      <p class="mb-5  leading-8 text-slate-700">
                        {menu.description ||
                          "Menu favorit yang cocok untuk makan siang kantor."}
                      </p>

                      <div class="tm-divider mb-5" />

                      <div class="flex items-end justify-between gap-4">
                        <p class=" font-bold tracking-[-0.06em] text-primary-700">
                          {formatRupiah(menu.price)}
                        </p>
                        <Show
                          when={menu.isAvailable}
                          fallback={
                            <button
                              type="button"
                              onClick={(e) => e.stopPropagation()}
                              class="flex h-16 w-16 items-center justify-center rounded-lg bg-slate-200 text-slate-500"
                            >
                              <IconPlus class="h-8 w-8" />
                            </button>
                          }
                        >
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
                                      storeName: menu.storeName,
                                      name: menu.name,
                                      price: menu.price,
                                    },
                                    (draft.getItem(menu.id)?.quantity ?? 0) - 1,
                                  );
                                }}
                                class="flex h-11 w-11 items-center justify-center rounded-lg bg-slate-100 text-slate-700"
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
                                    storeName: menu.storeName,
                                    name: menu.name,
                                    price: menu.price,
                                  },
                                  (draft.getItem(menu.id)?.quantity ?? 0) + 1,
                                );
                              }}
                              class="inline-flex items-center gap-3 rounded-lg bg-primary-700 px-5 py-4 font-semibold text-white"
                            >
                              <IconPlus class="h-5 w-5" />
                              Tambah
                            </button>
                          </div>
                        </Show>
                      </div>
                    </div>
                  )}
                </For>
              </div>
            </Show>
          </Suspense>
        </section>
      </Layout>
    </>
  );
}

function StorePill(props: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={props.onClick}
      class={`shrink-0 rounded-lg px-6 py-4  font-semibold transition-all ${
        props.active
          ? "bg-primary-700 text-white"
          : "bg-slate-200 text-slate-700"
      }`}
    >
      {props.label}
    </button>
  );
}

function MenuSkeleton() {
  return (
    <div class="space-y-6">
      {[1, 2, 3].map((item) => (
        <div class="h-72 animate-pulse rounded-lg bg-white/80" />
      ))}
    </div>
  );
}
