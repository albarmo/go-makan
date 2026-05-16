import { createAsync } from "@solidjs/router";
import { createSignal, Show } from "solid-js";
import { getImageKitAuth } from "~/server/imagekit";

interface ImageUploadProps {
  name: string;
  currentUrl?: string | null;
  folder?: string;
  label?: string;
  onUploaded?: (url: string) => void;
}

export default function ImageUpload(props: ImageUploadProps) {
  const auth = createAsync(() => getImageKitAuth());
  const [preview, setPreview] = createSignal<string | null>(
    props.currentUrl ?? null,
  );
  const [uploading, setUploading] = createSignal(false);
  const [error, setError] = createSignal("");
  const [uploadedUrl, setUploadedUrl] = createSignal<string>(
    props.currentUrl ?? "",
  );

  const handleFileChange = async (e: Event) => {
    const input = e.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    // Preview immediately
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target?.result as string);
    reader.readAsDataURL(file);

    const ikAuth = auth();
    if (!ikAuth) {
      setError("Auth belum siap, coba lagi");
      return;
    }

    setUploading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append(
        "fileName",
        `${Date.now()}_${file.name.replace(/\s+/g, "_")}`,
      );
      formData.append("token", ikAuth.token);
      formData.append("expire", ikAuth.expire.toString());
      formData.append("signature", ikAuth.signature);
      if (props.folder) {
        formData.append("folder", props.folder);
      }

      const res = await fetch(
        "https://upload.imagekit.io/api/v1/files/upload",
        {
          method: "POST",
          headers: {
            Authorization: `Basic ${btoa(ikAuth.publicKey + ":")}`,
          },
          body: formData,
        },
      );

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Upload gagal: ${errText}`);
      }

      const data = await res.json();
      const url = data.url as string;
      setUploadedUrl(url);
      props.onUploaded?.(url);
    } catch (err) {
      setError(String(err));
      // Revert preview to previous
      setPreview(props.currentUrl ?? null);
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    setPreview(null);
    setUploadedUrl("");
    props.onUploaded?.("");
  };

  return (
    <div class="space-y-2">
      <Show when={props.label}>
        <label class="block text-sm font-semibold text-gray-700">
          {props.label}
        </label>
      </Show>

      {/* Hidden input to submit URL with form */}
      <input type="hidden" name={props.name} value={uploadedUrl()} />

      <Show
        when={preview()}
        fallback={
          <label
            class={`flex min-h-32 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors ${
              uploading()
                ? "border-primary-300 bg-primary-50 cursor-not-allowed"
                : "border-gray-300 bg-gray-50 hover:border-primary-400 hover:bg-primary-50"
            }`}
          >
            <Show
              when={!uploading()}
              fallback={
                <div class="flex flex-col items-center gap-2">
                  <div class="h-8 w-8 animate-spin rounded-lg border-4 border-primary-500 border-t-transparent" />
                  <p class="text-sm text-primary-600">Mengupload...</p>
                </div>
              }
            >
              <span class="">📷</span>
              <p class="mt-2 text-sm font-medium text-gray-600">
                Klik untuk upload foto
              </p>
              <p class="text-xs text-gray-400">JPG, PNG, WebP - maks 10MB</p>
            </Show>
            <Show when={!uploading()}>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                class="hidden"
                onChange={handleFileChange}
              />
            </Show>
          </label>
        }
      >
        <div class="relative">
          <img
            src={preview()!}
            alt="Preview"
            class="h-48 w-full rounded-lg object-cover"
          />
          <Show when={uploading()}>
            <div class="absolute inset-0 flex items-center justify-center rounded-lg bg-black/40">
              <div class="h-8 w-8 animate-spin rounded-lg border-4 border-white border-t-transparent" />
            </div>
          </Show>
          <Show when={!uploading()}>
            <div class="absolute right-2 top-2 flex gap-2">
              <label class="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg bg-white/90 text-gray-700 shadow hover:bg-white">
                <span class="text-sm">✏️</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  class="hidden"
                  onChange={handleFileChange}
                />
              </label>
              <button
                type="button"
                onClick={handleRemove}
                class="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/90 text-white shadow hover:bg-red-600"
              >
                <span class="text-sm">✕</span>
              </button>
            </div>
          </Show>
        </div>
      </Show>

      <Show when={error()}>
        <p class="text-xs text-red-600">{error()}</p>
      </Show>
    </div>
  );
}
