import { createAsync } from "@solidjs/router";
import { createSignal, For, Show, Suspense } from "solid-js";
import { Title } from "@solidjs/meta";
import { A } from "@solidjs/router";
import Layout from "~/components/Layout";
import RoleGuard from "~/components/RoleGuard";
import { getMenus, toggleMenuAction } from "~/server/menus";
import { formatRupiah } from "~/lib/utils";
import { IconEdit, IconPlus, IconSearch } from "~/components/icons";

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
  const menus = createAsync(() => getMenus());
  const [filterStore, setFilterStore] = createSignal<string>("all");
  const [search, setSearch] = createSignal("");

  const storeNames = () => {
    const names = new Set((menus() ?? []).map((m) => m.storeName));
    return Array.from(names).sort();
  };

  const filtered = () => {
    const all = menus() ?? [];
    const q = search().toLowerCase();
    return all
      .filter((m) => filterStore() === "all" || m.storeName === filterStore())
      .filter(
        (m) =>
          !q ||
          m.name.toLowerCase().includes(q) ||
          m.storeName.toLowerCase().includes(q)
      );
  };

  return (
    <>
      <Title>Menu - Titip Makan</Title>
      <Layout title="Daftar Menu">
        {/* Search */}
        <div class="relative mb-3">
          <IconSearch class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            class="input pl-9"
            placeholder="Cari menu..."
            value={search()}
            onInput={(e) => setSearch(e.currentTarget.value)}
          />
        </div>

        <Suspense
          fallback={
            <div class="space-y-2">
              {[1, 2, 3, 4].map(() => (
                <div class="card h-20 animate-pulse bg-gray-100" />
              ))}
            </div>
          }
        >
          {/* Store filter pills */}
          <Show when={storeNames().length > 1}>
            <div class="mb-3 flex gap-2 overflow-x-auto pb-1">
              <button
                onClick={() => setFilterStore("all")}
                class={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                  filterStore() === "all"
                    ? "bg-primary-600 text-white"
                    : "bg-white text-gray-600 border border-gray-200"
                }`}
              >
                Semua
              </button>
              <For each={storeNames()}>
                {(name) => (
                  <button
                    onClick={() => setFilterStore(name)}
                    class={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                      filterStore() === name
                        ? "bg-primary-600 text-white"
                        : "bg-white text-gray-600 border border-gray-200"
                    }`}
                  >
                    {name}
                  </button>
                )}
              </For>
            </div>
          </Show>

          <Show
            when={filtered().length > 0}
            fallback={
              <div class="card p-10 text-center">
                <p class="text-3xl">🍽️</p>
                <p class="mt-2 font-semibold text-gray-700">
                  {search() || filterStore() !== "all"
                    ? "Menu tidak ditemukan"
                    : "Belum ada menu"}
                </p>
                <Show when={!search() && filterStore() === "all"}>
                  <A href="/menus/new" class="btn-primary mt-4 inline-flex">
                    Tambah Menu
                  </A>
                </Show>
              </div>
            }
          >
            <div class="space-y-2">
              <For each={filtered()}>
                {(menu) => (
                  <div class="card flex items-center gap-3 p-3">
                    {/* Thumbnail */}
                    <div class="shrink-0">
                      <Show
                        when={menu.imageUrl}
                        fallback={
                          <div class="flex h-16 w-16 items-center justify-center rounded-xl bg-gray-100 text-2xl">
                            🍽️
                          </div>
                        }
                      >
                        <img
                          src={menu.imageUrl!}
                          alt={menu.name}
                          class="h-16 w-16 rounded-xl object-cover"
                        />
                      </Show>
                    </div>

                    <div class="flex-1 min-w-0">
                      <p class="font-semibold text-gray-900 truncate">{menu.name}</p>
                      <p class="text-xs font-medium text-primary-600">{menu.storeName}</p>
                      <p class="mt-0.5 text-sm font-bold text-gray-800">
                        {formatRupiah(menu.price)}
                      </p>
                    </div>

                    <div class="flex shrink-0 items-center gap-1.5">
                      <span
                        class={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                          menu.isAvailable
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {menu.isAvailable ? "Tersedia" : "Habis"}
                      </span>
                      <A
                        href={`/menus/${menu.id}/edit`}
                        class="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50"
                      >
                        <IconEdit class="h-3.5 w-3.5" />
                      </A>
                      <form method="post" action={toggleMenuAction}>
                        <input type="hidden" name="id" value={menu.id} />
                        <input type="hidden" name="isAvailable" value={menu.isAvailable.toString()} />
                        <button
                          type="submit"
                          class={`flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold transition-colors ${
                            menu.isAvailable
                              ? "bg-gray-100 text-gray-600 hover:bg-gray-200"
                              : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                          }`}
                        >
                          {menu.isAvailable ? "−" : "+"}
                        </button>
                      </form>
                    </div>
                  </div>
                )}
              </For>
            </div>
          </Show>
        </Suspense>

        {/* FAB */}
        <A
          href="/menus/new"
          class="fixed bottom-20 right-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary-600 text-white shadow-lg hover:bg-primary-700 active:scale-95 transition-all z-40"
          aria-label="Tambah Menu"
        >
          <IconPlus class="h-6 w-6" />
        </A>
      </Layout>
    </>
  );
}
