import { createAsync } from "@solidjs/router";
import { createSignal, For, Show, Suspense } from "solid-js";
import { Title } from "@solidjs/meta";
import { A } from "@solidjs/router";
import Layout from "~/components/Layout";
import RoleGuard from "~/components/RoleGuard";
import { getStores, toggleStoreAction } from "~/server/stores";
import { IconSearch, IconPlus, IconEdit, IconMapPin, IconPhone } from "~/components/icons";

export const route = {
  load: () => getStores(),
};

export default function StoresPage() {
  return (
    <RoleGuard>
      <StoresContent />
    </RoleGuard>
  );
}

function StoresContent() {
  const stores = createAsync(() => getStores());
  const [search, setSearch] = createSignal("");

  const filtered = () => {
    const q = search().toLowerCase();
    return (stores() ?? []).filter(
      (s) =>
        !q ||
        s.name.toLowerCase().includes(q) ||
        (s.description ?? "").toLowerCase().includes(q)
    );
  };

  return (
    <>
      <Title>Toko - Titip Makan</Title>
      <Layout title="Daftar Toko">
        {/* Search */}
        <div class="relative mb-4">
          <IconSearch class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            class="input pl-9"
            placeholder="Cari toko..."
            value={search()}
            onInput={(e) => setSearch(e.currentTarget.value)}
          />
        </div>

        <Suspense
          fallback={
            <div class="space-y-3">
              {[1, 2, 3].map(() => (
                <div class="card h-44 animate-pulse bg-gray-100" />
              ))}
            </div>
          }
        >
          <Show
            when={filtered().length > 0}
            fallback={
              <div class="card p-10 text-center">
                <p class="text-3xl">🏪</p>
                <p class="mt-2 font-semibold text-gray-700">
                  {search() ? "Toko tidak ditemukan" : "Belum ada toko"}
                </p>
                <Show when={!search()}>
                  <A href="/stores/new" class="btn-primary mt-4 inline-flex">
                    Tambah Toko
                  </A>
                </Show>
              </div>
            }
          >
            <div class="space-y-3">
              <For each={filtered()}>
                {(store) => (
                  <div class="card overflow-hidden">
                    {/* Image with status overlay */}
                    <div class="relative h-36 bg-gray-100">
                      <Show
                        when={store.imageUrl}
                        fallback={
                          <div class="flex h-full items-center justify-center text-5xl">
                            🏪
                          </div>
                        }
                      >
                        <img
                          src={store.imageUrl!}
                          alt={store.name}
                          class="h-full w-full object-cover"
                        />
                      </Show>
                      {/* Status badge overlay */}
                      <span
                        class={`absolute right-3 top-3 rounded-full px-2.5 py-1 text-xs font-semibold shadow ${
                          store.isActive
                            ? "bg-emerald-500 text-white"
                            : "bg-gray-600 text-white"
                        }`}
                      >
                        {store.isActive ? "Buka" : "Tutup"}
                      </span>
                    </div>

                    {/* Info */}
                    <div class="p-4">
                      <div class="flex items-start justify-between gap-2">
                        <div class="flex-1 min-w-0">
                          <h3 class="font-bold text-gray-900">{store.name}</h3>
                          <Show when={store.description}>
                            <p class="mt-0.5 text-sm text-gray-500 line-clamp-1">
                              {store.description}
                            </p>
                          </Show>
                          <div class="mt-1.5 flex flex-wrap gap-2">
                            <Show when={store.address}>
                              <div class="flex items-center gap-1 text-xs text-gray-400">
                                <IconMapPin class="h-3 w-3" />
                                <span class="truncate max-w-[140px]">{store.address}</span>
                              </div>
                            </Show>
                            <Show when={store.phone}>
                              <div class="flex items-center gap-1 text-xs text-gray-400">
                                <IconPhone class="h-3 w-3" />
                                <span>{store.phone}</span>
                              </div>
                            </Show>
                          </div>
                        </div>
                        <div class="flex shrink-0 gap-2">
                          <A
                            href={`/stores/${store.id}/edit`}
                            class="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50"
                          >
                            <IconEdit class="h-3.5 w-3.5" />
                          </A>
                          <form method="post" action={toggleStoreAction}>
                            <input type="hidden" name="id" value={store.id} />
                            <input type="hidden" name="isActive" value={store.isActive.toString()} />
                            <button
                              type="submit"
                              class={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                                store.isActive
                                  ? "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                  : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                              }`}
                            >
                              {store.isActive ? "Tutup" : "Buka"}
                            </button>
                          </form>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </For>
            </div>
          </Show>
        </Suspense>

        {/* FAB */}
        <A
          href="/stores/new"
          class="fixed bottom-20 right-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary-600 text-white shadow-lg hover:bg-primary-700 active:scale-95 transition-all z-40"
          aria-label="Tambah Toko"
        >
          <IconPlus class="h-6 w-6" />
        </A>
      </Layout>
    </>
  );
}
