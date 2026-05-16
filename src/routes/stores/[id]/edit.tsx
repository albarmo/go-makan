import { createAsync, useAction, useParams } from "@solidjs/router";
import { createSignal, Show, Suspense } from "solid-js";
import { Title } from "@solidjs/meta";
import Layout from "~/components/Layout";
import RoleGuard from "~/components/RoleGuard";
import ImageUpload from "~/components/ImageUpload";
import { getStoreById, updateStoreAction } from "~/server/stores";

export const route = {
  load: ({ params }: { params: { id: string } }) =>
    getStoreById(parseInt(params.id)),
};

export default function EditStorePage() {
  return (
    <RoleGuard>
      <EditStoreContent />
    </RoleGuard>
  );
}

function EditStoreContent() {
  const params = useParams<{ id: string }>();
  const store = createAsync(() => getStoreById(parseInt(params.id)));
  const updateStore = useAction(updateStoreAction);
  const [submitting, setSubmitting] = createSignal(false);
  const [error, setError] = createSignal("");

  const handleSubmit = async (e: SubmitEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const form = e.currentTarget as HTMLFormElement;
      const formData = new FormData(form);
      await updateStore(formData);
    } catch (err) {
      setError(String(err));
      setSubmitting(false);
    }
  };

  return (
    <>
      <Title>Edit Toko - Titip Makan</Title>
      <Layout title="Edit Toko" showBack>
        <Suspense
          fallback={
            <div class="card h-64 animate-pulse bg-gray-100" />
          }
        >
          <Show
            when={store()}
            fallback={
              <div class="card p-8 text-center">
                <p class="text-gray-500">Toko tidak ditemukan</p>
              </div>
            }
          >
            {(s) => (
              <form onSubmit={handleSubmit} class="space-y-4">
                <input type="hidden" name="id" value={s().id} />

                <div class="card p-4 space-y-4">
                  <div>
                    <label class="mb-1.5 block text-sm font-semibold text-gray-700">
                      Nama Toko <span class="text-red-500">*</span>
                    </label>
                    <input
                      name="name"
                      type="text"
                      class="input"
                      value={s().name}
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
                    >
                      {s().description ?? ""}
                    </textarea>
                  </div>

                  <div>
                    <label class="mb-1.5 block text-sm font-semibold text-gray-700">
                      Alamat
                    </label>
                    <input
                      name="address"
                      type="text"
                      class="input"
                      value={s().address ?? ""}
                    />
                  </div>

                  <div>
                    <label class="mb-1.5 block text-sm font-semibold text-gray-700">
                      No. Telepon
                    </label>
                    <input
                      name="phone"
                      type="tel"
                      class="input"
                      value={s().phone ?? ""}
                    />
                  </div>

                  <ImageUpload
                    name="imageUrl"
                    folder="stores"
                    label="Foto Toko"
                    currentUrl={s().imageUrl}
                  />

                  <div class="flex items-center gap-3">
                    <input
                      type="checkbox"
                      name="isActive"
                      id="isActive"
                      value="true"
                      checked={s().isActive}
                      class="h-4 w-4 rounded border-gray-300 text-primary-600"
                    />
                    <label
                      for="isActive"
                      class="text-sm font-medium text-gray-700"
                    >
                      Toko aktif
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
