import { createSignal, Show } from "solid-js";
import { useAction } from "@solidjs/router";
import { Title } from "@solidjs/meta";
import Layout from "~/components/Layout";
import RoleGuard from "~/components/RoleGuard";
import ImageUpload from "~/components/ImageUpload";
import { createStoreAction } from "~/server/stores";

export default function NewStorePage() {
  return (
    <RoleGuard>
      <NewStoreContent />
    </RoleGuard>
  );
}

function NewStoreContent() {
  const createStore = useAction(createStoreAction);
  const [submitting, setSubmitting] = createSignal(false);
  const [error, setError] = createSignal("");

  const handleSubmit = async (e: SubmitEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const form = e.currentTarget as HTMLFormElement;
      const formData = new FormData(form);
      await createStore(formData);
    } catch (err) {
      setError(String(err));
      setSubmitting(false);
    }
  };

  return (
    <>
      <Title>Tambah Toko - Titip Makan</Title>
      <Layout title="Tambah Toko" showBack>
        <form onSubmit={handleSubmit} class="space-y-4">
          <div class="card p-4 space-y-4">
            <div>
              <label class="mb-1.5 block text-sm font-semibold text-gray-700">
                Nama Toko <span class="text-red-500">*</span>
              </label>
              <input
                name="name"
                type="text"
                class="input"
                placeholder="Contoh: Warung Pak Slamet"
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
                placeholder="Contoh: Warung nasi & lauk pauk"
              />
            </div>

            <div>
              <label class="mb-1.5 block text-sm font-semibold text-gray-700">
                Alamat
              </label>
              <input
                name="address"
                type="text"
                class="input"
                placeholder="Contoh: Jl. Sudirman No. 10"
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
                placeholder="Contoh: 08123456789"
              />
            </div>

            <ImageUpload
              name="imageUrl"
              folder="stores"
              label="Foto Toko"
            />

            <div class="flex items-center gap-3">
              <input
                type="checkbox"
                name="isActive"
                id="isActive"
                value="true"
                checked
                class="h-4 w-4 rounded border-gray-300 text-primary-600"
              />
              <label for="isActive" class="text-sm font-medium text-gray-700">
                Toko aktif (bisa dipilih saat order)
              </label>
            </div>

            {/* hidden field workaround: checkbox only sends value when checked */}
            <input type="hidden" name="isActive" value="false" />
          </div>

          <Show when={error()}>
            <p class="text-sm text-red-600">{error()}</p>
          </Show>

          <button type="submit" disabled={submitting()} class="btn-primary w-full">
            {submitting() ? "Menyimpan..." : "Simpan Toko"}
          </button>
        </form>
      </Layout>
    </>
  );
}
