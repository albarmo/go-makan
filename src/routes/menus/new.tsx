import { createAsync, useAction } from "@solidjs/router";
import { createSignal, For, Show, Suspense } from "solid-js";
import { Title } from "@solidjs/meta";
import Layout from "~/components/Layout";
import RoleGuard from "~/components/RoleGuard";
import ImageUpload from "~/components/ImageUpload";
import { getStores } from "~/server/stores";
import { createMenuAction } from "~/server/menus";

export const route = {
  load: () => getStores(),
};

export default function NewMenuPage() {
  return (
    <RoleGuard>
      <NewMenuContent />
    </RoleGuard>
  );
}

function NewMenuContent() {
  const stores = createAsync(() => getStores());
  const createMenu = useAction(createMenuAction);
  const [submitting, setSubmitting] = createSignal(false);
  const [error, setError] = createSignal("");

  const handleSubmit = async (e: SubmitEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const form = e.currentTarget as HTMLFormElement;
      const formData = new FormData(form);
      await createMenu(formData);
    } catch (err) {
      setError(String(err));
      setSubmitting(false);
    }
  };

  return (
    <>
      <Title>Tambah Menu - Titip Makan</Title>
      <Layout title="Tambah Menu" showBack>
        <Suspense fallback={<div class="card h-64 animate-pulse bg-gray-100" />}>
          <form onSubmit={handleSubmit} class="space-y-4">
            <div class="card p-4 space-y-4">
              <div>
                <label class="mb-1.5 block text-sm font-semibold text-gray-700">
                  Toko <span class="text-red-500">*</span>
                </label>
                <select name="storeId" class="input" required>
                  <option value="">-- Pilih Toko --</option>
                  <For each={stores() ?? []}>
                    {(store) => (
                      <option value={store.id}>
                        {store.name}
                        {!store.isActive ? " (Nonaktif)" : ""}
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
                  placeholder="Contoh: Nasi Goreng"
                  required
                  maxLength={255}
                />
              </div>

              <div>
                <label class="mb-1.5 block text-sm font-semibold text-gray-700">
                  Deskripsi
                </label>
                <textarea
                  name="description"
                  class="input resize-none"
                  rows="2"
                  placeholder="Opsional"
                />
              </div>

              <div>
                <label class="mb-1.5 block text-sm font-semibold text-gray-700">
                  Harga (Rp) <span class="text-red-500">*</span>
                </label>
                <input
                  name="price"
                  type="number"
                  class="input"
                  placeholder="Contoh: 15000"
                  required
                  min="0"
                  step="500"
                />
              </div>

              <ImageUpload
                name="imageUrl"
                folder="menus"
                label="Foto Menu"
              />

              <div class="flex items-center gap-3">
                <input
                  type="checkbox"
                  name="isAvailable"
                  id="isAvailable"
                  value="true"
                  checked
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
              {submitting() ? "Menyimpan..." : "Simpan Menu"}
            </button>
          </form>
        </Suspense>
      </Layout>
    </>
  );
}
