import { createAsync, useAction } from "@solidjs/router";
import { For, Show, Suspense } from "solid-js";
import { Title } from "@solidjs/meta";
import { A } from "@solidjs/router";
import Layout from "~/components/Layout";
import RoleGuard from "~/components/RoleGuard";
import { getStores, toggleStoreAction } from "~/server/stores";
import { IconEdit, IconPlus } from "~/components/icons";

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
  const toggleStore = useAction(toggleStoreAction);

  return (
    <>
      <Title>Daftar Toko - Titip Makan</Title>
      <Layout title="Daftar Toko">
        <div class="mb-4 flex items-center justify-between">
          <p class="text-sm text-gray-500">Kelola toko makan</p>
          <A href="/stores/new" class="btn-primary flex items-center gap-2 !py-2 !px-3 text-xs">
            <IconPlus class="h-4 w-4" />
            Tambah Toko
          </A>
        </div>

        <Suspense
          fallback={
            <div class="space-y-3">
              {[1, 2, 3].map(() => (
                <div class="card h-20 animate-pulse bg-gray-100" />
              ))}
            </div>
          }
        >
          <Show
            when={(stores() ?? []).length > 0}
            fallback={
              <div class="card p-8 text-center">
                <p class="text-2xl">🏪</p>
                <p class="mt-2 font-semibold text-gray-700">Belum ada toko</p>
                <p class="mt-1 text-sm text-gray-400">
                  Tambahkan toko terlebih dahulu
                </p>
                <A href="/stores/new" class="btn-primary mt-4 inline-flex">
                  Tambah Toko
                </A>
              </div>
            }
          >
            <div class="space-y-3">
              <For each={stores()}>
                {(store) => (
                  <div class="card overflow-hidden">
                    <Show when={store.imageUrl}>
                      <img
                        src={store.imageUrl!}
                        alt={store.name}
                        class="h-32 w-full object-cover"
                      />
                    </Show>
                    <div class="p-4">
                    <div class="flex items-start gap-3">
                      <div class="flex-1 min-w-0">
                        <div class="flex items-center gap-2">
                          <h3 class="font-semibold text-gray-900">
                            {store.name}
                          </h3>
                          <span
                            class={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                              store.isActive
                                ? "bg-green-100 text-green-700"
                                : "bg-gray-100 text-gray-500"
                            }`}
                          >
                            {store.isActive ? "Aktif" : "Nonaktif"}
                          </span>
                        </div>
                        <Show when={store.description}>
                          <p class="mt-0.5 text-sm text-gray-500 truncate">
                            {store.description}
                          </p>
                        </Show>
                        <Show when={store.address}>
                          <p class="mt-0.5 text-xs text-gray-400 truncate">
                            📍 {store.address}
                          </p>
                        </Show>
                        <Show when={store.phone}>
                          <p class="mt-0.5 text-xs text-gray-400">
                            📞 {store.phone}
                          </p>
                        </Show>
                      </div>
                      <div class="flex shrink-0 gap-2">
                        <A
                          href={`/stores/${store.id}/edit`}
                          class="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50"
                        >
                          <IconEdit class="h-4 w-4" />
                        </A>
                        <form
                          method="post"
                          action={toggleStoreAction}
                        >
                          <input type="hidden" name="id" value={store.id} />
                          <input
                            type="hidden"
                            name="isActive"
                            value={store.isActive.toString()}
                          />
                          <button
                            type="submit"
                            class={`rounded-xl px-3 py-2 text-xs font-semibold transition-colors ${
                              store.isActive
                                ? "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                : "bg-green-100 text-green-700 hover:bg-green-200"
                            }`}
                          >
                            {store.isActive ? "Nonaktifkan" : "Aktifkan"}
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
      </Layout>
    </>
  );
}
