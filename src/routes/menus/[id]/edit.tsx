import { createAsync, useAction, useParams } from "@solidjs/router";
import { createSignal, For, Show, Suspense } from "solid-js";
import { Title } from "@solidjs/meta";
import Layout from "~/components/Layout";
import RoleGuard from "~/components/RoleGuard";
import ImageUpload from "~/components/ImageUpload";
import { getMenuById, updateMenuAction } from "~/server/menus";
import { getStores } from "~/server/stores";

export const route = {
  load: ({ params }: { params: { id: string } }) => {
    getMenuById(parseInt(params.id));
    getStores();
  },
};

export default function EditMenuPage() {
  return (
    <RoleGuard>
      <EditMenuContent />
    </RoleGuard>
  );
}

function EditMenuContent() {
  const params = useParams<{ id: string }>();
  const menu = createAsync(() => getMenuById(parseInt(params.id)));
  const stores = createAsync(() => getStores());
  const updateMenu = useAction(updateMenuAction);
  const [submitting, setSubmitting] = createSignal(false);
  const [error, setError] = createSignal("");

  const handleSubmit = async (e: SubmitEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const form = e.currentTarget as HTMLFormElement;
      const formData = new FormData(form);
      await updateMenu(formData);
    } catch (err) {
      setError(String(err));
      setSubmitting(false);
    }
  };

  return (
    <>
      <Title>Edit Menu - Titip Makan</Title>
      <Layout title="Edit Menu" showBack>
        <Suspense fallback={<div class="card h-64 animate-pulse bg-gray-100" />}>
          <Show
            when={menu()}
            fallback={
              <div class="card p-8 text-center">
                <p class="text-gray-500">Menu tidak ditemukan</p>
              </div>
            }
          >
            {(m) => (
              <form onSubmit={handleSubmit} class="space-y-4">
                <input type="hidden" name="id" value={m().id} />

                <div class="card p-4 space-y-4">
                  <div>
                    <label class="mb-1.5 block text-sm font-semibold text-gray-700">
                      Toko <span class="text-red-500">*</span>
                    </label>
                    <select name="storeId" class="input" required>
                      <For each={stores() ?? []}>
                        {(store) => (
                          <option
                            value={store.id}
                            selected={store.id === m().storeId}
                          >
                            {store.name}
                          </option>
                        )}
                      </For>
                    </select>
                  </div>

                  <div>
                    <label class="mb-1.5 block text-sm font-semibold text-gray-700">
                      Nama Menu <span class="text-red-500">*</span>
                    </label>
                    <input
                      name="name"
                      type="text"
                      class="input"
                      value={m().name}
                      required
                      maxLength={255}
                    />
                  </div>

                  <div>
                    <label class="mb-1.5 block text-sm font-semibold text-gray-700">
                      Deskripsi
                    </label>
                    <textarea name="description" class="input resize-none" rows="2">
                      {m().description ?? ""}
                    </textarea>
                  </div>

                  <div>
                    <label class="mb-1.5 block text-sm font-semibold text-gray-700">
                      Harga (Rp) <span class="text-red-500">*</span>
                    </label>
                    <input
                      name="price"
                      type="number"
                      class="input"
                      value={m().price}
                      required
                      min="0"
                      step="500"
                    />
                  </div>

                  <ImageUpload
                    name="imageUrl"
                    folder="menus"
                    label="Foto Menu"
                    currentUrl={m().imageUrl}
                  />

                  <div class="flex items-center gap-3">
                    <input
                      type="checkbox"
                      name="isAvailable"
                      id="isAvailable"
                      value="true"
                      checked={m().isAvailable}
                      class="h-4 w-4 rounded border-gray-300 text-primary-600"
                    />
                    <label for="isAvailable" class="text-sm font-medium text-gray-700">
                      Menu tersedia
                    </label>
                  </div>
                </div>

                <Show when={error()}>
                  <p class="text-sm text-red-600">{error()}</p>
                </Show>

                <button
                  type="submit"
                  disabled={submitting()}
                  class="btn-primary w-full"
                >
                  {submitting() ? "Menyimpan..." : "Simpan Perubahan"}
                </button>
              </form>
            )}
          </Show>
        </Suspense>
      </Layout>
    </>
  );
}
