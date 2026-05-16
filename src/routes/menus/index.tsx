import { createAsync } from "@solidjs/router";
import { createSignal, For, Show, Suspense } from "solid-js";
import { Title } from "@solidjs/meta";
import { A } from "@solidjs/router";
import Layout from "~/components/Layout";
import RoleGuard from "~/components/RoleGuard";
import { getMenus, toggleMenuAction } from "~/server/menus";
import { formatRupiah } from "~/lib/utils";
import { IconEdit, IconPlus } from "~/components/icons";

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

  const storeNames = () => {
    const names = new Set((menus() ?? []).map((m) => m.storeName));
    return Array.from(names).sort();
  };

  const filtered = () => {
    const all = menus() ?? [];
    if (filterStore() === "all") return all;
    return all.filter((m) => m.storeName === filterStore());
  };

  return (
    <>
      <Title>Menu - Titip Makan</Title>
      <Layout title="Daftar Menu">
        <div class="mb-4 flex items-center justify-between">
          <p class="text-sm text-gray-500">Kelola menu makan</p>
          <A
            href="/menus/new"
            class="btn-primary flex items-center gap-2 !py-2 !px-3 text-xs"
          >
            <IconPlus class="h-4 w-4" />
            Tambah Menu
          </A>
        </div>

        <Suspense
          fallback={
            <div class="space-y-3">
              {[1, 2, 3].map(() => (
                <div class="card h-16 animate-pulse bg-gray-100" />
              ))}
            </div>
          }
        >
          {/* Filter by store */}
          <Show when={(storeNames()).length > 1}>
            <div class="mb-3 flex gap-2 overflow-x-auto pb-1">
              <button
                onClick={() => setFilterStore("all")}
                class={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                  filterStore() === "all"
                    ? "bg-primary-500 text-white"
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
                        ? "bg-primary-500 text-white"
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
              <div class="card p-8 text-center">
                <p class="text-2xl">🍽️</p>
                <p class="mt-2 font-semibold text-gray-700">Belum ada menu</p>
                <p class="mt-1 text-sm text-gray-400">
                  Tambahkan menu terlebih dahulu
                </p>
                <A href="/menus/new" class="btn-primary mt-4 inline-flex">
                  Tambah Menu
                </A>
              </div>
            }
          >
            <div class="space-y-2">
              <For each={filtered()}>
                {(menu) => (
                  <div class="card flex items-center gap-3 p-3">
                    {/* Menu thumbnail */}
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
                      <div class="flex items-center gap-2">
                        <span class="font-semibold text-gray-900">
                          {menu.name}
                        </span>
                        <span
                          class={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            menu.isAvailable
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          {menu.isAvailable ? "Tersedia" : "Habis"}
                        </span>
                      </div>
                      <p class="text-xs text-gray-400">{menu.storeName}</p>
                      <p class="mt-0.5 text-sm font-semibold text-primary-600">
                        {formatRupiah(menu.price)}
                      </p>
                    </div>
                    <div class="flex shrink-0 gap-2">
                      <A
                        href={`/menus/${menu.id}/edit`}
                        class="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50"
                      >
                        <IconEdit class="h-4 w-4" />
                      </A>
                      <form method="post" action={toggleMenuAction}>
                        <input type="hidden" name="id" value={menu.id} />
                        <input
                          type="hidden"
                          name="isAvailable"
                          value={menu.isAvailable.toString()}
                        />
                        <button
                          type="submit"
                          class={`rounded-xl px-3 py-2 text-xs font-semibold transition-colors ${
                            menu.isAvailable
                              ? "bg-gray-100 text-gray-600 hover:bg-gray-200"
                              : "bg-green-100 text-green-700 hover:bg-green-200"
                          }`}
                        >
                          {menu.isAvailable ? "Tandai Habis" : "Tersedia"}
                        </button>
                      </form>
                    </div>
                  </div>
                )}
              </For>
            </div>
          </Show>
        </Suspense>
      </Layout>
    </>
  );
}
