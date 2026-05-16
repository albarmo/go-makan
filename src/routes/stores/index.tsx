import { Title } from "@solidjs/meta";
import { A, createAsync } from "@solidjs/router";
import { createSignal, For, Show, Suspense } from "solid-js";
import Layout from "~/components/Layout";
import RoleGuard from "~/components/RoleGuard";
import { IconMapPin, IconPlus, IconSearch } from "~/components/icons";
import { getStores } from "~/server/stores";

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

  const filteredStores = () => {
    const query = search().toLowerCase();
    return (stores() ?? []).filter(
      (store) =>
        !query ||
        store.name.toLowerCase().includes(query) ||
        (store.description ?? "").toLowerCase().includes(query),
    );
  };

  return (
    <>
      <Title>Tempat Makan - Titip Makan</Title>
      <Layout title="Titip Makan" showUser>
        <section class="space-y-6">
          <h1 class="tm-page-title">Tempat Makan</h1>

          <div class="relative">
            <IconSearch class="pointer-events-none absolute left-5 top-1/2 h-6 w-6 -translate-y-1/2 text-slate-500" />
            <input
              type="search"
              class="input pl-16 "
              placeholder="Cari store atau menu..."
              value={search()}
              onInput={(e) => setSearch(e.currentTarget.value)}
            />
          </div>

          <Suspense fallback={<StoreSkeleton />}>
            <Show
              when={filteredStores().length > 0}
              fallback={
                <div class="tm-card p-8">
                  <p class=" text-slate-600">
                    Belum ada store yang cocok dengan pencarian.
                  </p>
                </div>
              }
            >
              <div class="space-y-6">
                <For each={filteredStores()}>
                  {(store) => (
                    <div class="tm-card overflow-hidden">
                      <div class="relative h-56 bg-slate-200">
                        <Show
                          when={store.imageUrl}
                          fallback={
                            <div class="h-full w-full bg-gradient-to-br from-slate-200 via-slate-300 to-slate-200" />
                          }
                        >
                          <img
                            src={store.imageUrl!}
                            alt={store.name}
                            class="h-full w-full object-cover"
                          />
                        </Show>
                        <div class="absolute right-4 top-4 rounded-lg bg-white px-4 py-2 text-base font-medium text-slate-700 shadow-sm">
                          <span
                            class={`mr-2 inline-block h-3 w-3 rounded-lg ${store.isActive ? "bg-emerald-400" : "bg-red-400"}`}
                          />
                          {store.isActive ? "Buka" : "Tutup"}
                        </div>
                      </div>

                      <div class="p-6">
                        <h2 class=" font-semibold leading-tight tracking-[-0.05em] text-slate-900">
                          {store.name}
                        </h2>
                        <p class="mt-3  leading-8 text-slate-700">
                          {store.description ||
                            "Tersedia berbagai pilihan makanan enak untuk makan siang."}
                        </p>

                        <div class="mt-5 flex items-start gap-3 text-base text-slate-600">
                          <IconMapPin class="mt-0.5 h-5 w-5 shrink-0" />
                          <span>
                            {store.address || "Alamat belum ditambahkan"}
                          </span>
                        </div>

                        <p class="mt-4 text-base font-medium text-primary-700">
                          Lihat menu tersedia
                        </p>
                      </div>
                    </div>
                  )}
                </For>
              </div>
            </Show>
          </Suspense>

          <A
            href="/stores/new"
            class="btn-accent fixed bottom-28 right-6 z-40 gap-3 px-7"
          >
            <IconPlus class="h-6 w-6" />
            Tambah Store
          </A>
        </section>
      </Layout>
    </>
  );
}

function StoreSkeleton() {
  return (
    <div class="space-y-6">
      {[1, 2].map((item) => (
        <div class="h-96 animate-pulse rounded-lg bg-white/80" />
      ))}
    </div>
  );
}
